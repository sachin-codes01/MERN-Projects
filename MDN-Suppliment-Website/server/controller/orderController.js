const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Coupon = require("../models/Coupon");
const Product = require("../models/Product");
const CheckoutSession = require("../models/CheckoutSession");
const razorpay = require("../config/razorpay");
const { calcOrderPricing } = require("../utils/orderPricing");
const {
  isValidCheckoutSignature,
  isValidWebhookSignature,
  finalizePayment,
  refundOrder,
  syncRefundFromRazorpay,
} = require("../utils/payments");

const ADDRESS_FIELDS = ["fullName", "phone", "line1", "city", "state", "pincode"];

// STEP 1: POST /api/orders/create-razorpay-order
//
// Prices the cart from LIVE product data, refuses before payment if
// anything is out of stock, and freezes the result in a CheckoutSession.
// The Razorpay order is created for exactly that amount, and the order
// placed after payment is built from the same snapshot, so what the
// customer pays for is exactly what they get, even if the cart changes
// in another tab while the payment screen is open.
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { shippingAddress, saveAddress = null, addressId = null } = req.body || {};
    const missing = ADDRESS_FIELDS.filter((f) => !String(shippingAddress?.[f] || "").trim());
    if (missing.length) {
      return res.status(400).json({ success: false, message: "Please complete the delivery address." });
    }

    const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    let subtotal = 0;
    const items = [];
    for (const item of cart.items) {
      const product = item.product;
      if (!product || product.isActive === false) {
        return res.status(400).json({ success: false, message: "An item in your cart is no longer available." });
      }
      const size = product.sizes.id(item.sizeId);
      if (!size) {
        return res.status(400).json({ success: false, message: `Size no longer exists for ${product.name}` });
      }
      if (size.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message:
            size.stock > 0
              ? `Only ${size.stock} left of ${product.name} (${size.weight}). Please update your cart.`
              : `${product.name} (${size.weight}) is out of stock. Please remove it from your cart.`,
        });
      }
      const flavor = item.flavorId ? product.flavors.id(item.flavorId) : null;
      const price = (size.discountPrice || size.price) + (flavor?.priceAdjustment || 0);
      subtotal += price * item.quantity;
      items.push({
        product: product._id,
        sizeId: item.sizeId,
        flavorId: item.flavorId || null,
        name: product.name,
        flavor: flavor?.name || item.flavor || null,
        weight: size.weight,
        // Product photo first: the flavour swatch is a small crop of an
        // ingredient and reads as the wrong item in order history.
        image: product.thumbnail || flavor?.image,
        price,
        quantity: item.quantity,
      });
    }

    let discount = 0;
    let couponCode = null;
    if (cart.couponApplied) {
      const coupon = await Coupon.findById(cart.couponApplied);
      if (coupon && coupon.isActive && (!coupon.expiresAt || coupon.expiresAt > new Date())) {
        discount =
          coupon.discountType === "percentage"
            ? Math.round((subtotal * coupon.discountValue) / 100)
            : coupon.discountValue;
        if (coupon.discountType === "percentage" && coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
        discount = Math.min(discount, subtotal);
        couponCode = coupon.code;
      }
    }

    const { shippingFee, tax, total } = calcOrderPricing(subtotal, discount);
    const amount = Math.round(total * 100);

    const razorpayOrder = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: "rcpt_" + Date.now(),
      notes: { userId: String(req.user._id) },
    });

    await CheckoutSession.create({
      user: req.user._id,
      razorpayOrderId: razorpayOrder.id,
      amount,
      items,
      pricing: { subtotal, discount, couponCode, shippingFee, tax, total },
      shippingAddress: {
        fullName: shippingAddress.fullName,
        phone: shippingAddress.phone,
        line1: shippingAddress.line1,
        line2: shippingAddress.line2 || "",
        city: shippingAddress.city,
        state: shippingAddress.state,
        pincode: shippingAddress.pincode,
        country: shippingAddress.country || "India",
      },
      saveAddress: saveAddress ? { label: saveAddress.label || "Home" } : null,
      addressId: addressId || null,
    });

    res.json({
      success: true,
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        subtotal,
        discount,
        shippingFee,
        tax,
        total,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// STEP 2: POST /api/orders/verify-payment, called by the browser right
// after Razorpay Checkout succeeds. The webhook below does the same job
// server-to-server, so an order is still created if this call never
// arrives (tab closed, network dropped).
exports.verifyPaymentAndPlaceOrder = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment details missing" });
    }
    if (!isValidCheckoutSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    // A payment can only ever be claimed by the customer who started it.
    const session = await CheckoutSession.findOne({ razorpayOrderId: razorpay_order_id }).select("user");
    if (!session || String(session.user) !== String(req.user._id)) {
      return res.status(404).json({ success: false, message: "Checkout session not found" });
    }

    const { order, refunded } = await finalizePayment(razorpay_order_id, razorpay_payment_id);
    res.status(refunded ? 200 : 201).json({
      success: true,
      data: order,
      refunded,
      message: refunded ? order.cancelReason : undefined,
    });
  } catch (err) {
    res.status(err.status || 400).json({ success: false, message: err.message });
  }
};

// POST /api/orders/razorpay-webhook: Razorpay calls this server-to-server,
// with no user login. It is trusted only through the HMAC signature on the
// raw body. Returns 5xx on failure so Razorpay retries; finalizePayment is
// safe to run repeatedly.
exports.razorpayWebhook = async (req, res) => {
  if (!isValidWebhookSignature(req.rawBody || "", req.get("x-razorpay-signature"))) {
    return res.status(400).json({ success: false, message: "Invalid webhook signature" });
  }

  const { event, payload } = req.body || {};

  // Refunds — including ones made by hand in the Razorpay dashboard —
  // update the matching order's payment status and history.
  if (["refund.created", "refund.processed", "refund.failed"].includes(event)) {
    const refund = payload?.refund?.entity;
    if (!refund?.payment_id) return res.json({ success: true, ignored: true });
    try {
      const order = await syncRefundFromRazorpay(refund.payment_id, refund, event);
      return res.json({ success: true, ignored: !order });
    } catch (err) {
      console.error("Razorpay refund webhook failed:", err.message);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  const payment = payload?.payment?.entity;
  const handled = ["payment.captured", "payment.authorized", "order.paid"];
  if (!handled.includes(event) || !payment?.order_id) {
    return res.json({ success: true, ignored: true });
  }

  try {
    await finalizePayment(payment.order_id, payment.id);
    res.json({ success: true });
  } catch (err) {
    // A payment for a Razorpay order this app didn't create (e.g. a
    // payment link made in the dashboard): nothing to do, don't retry.
    if (err.status === 404) return res.json({ success: true, ignored: true });
    console.error("Razorpay webhook failed:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    // `items.image` is a snapshot taken when the order was placed, and
    // orders placed before the image-source fix stored the flavour swatch
    // rather than the product photo. Populating the product lets the
    // client prefer the LIVE thumbnail, which repairs those old orders
    // without a data migration — and keeps order history correct if a
    // product's photo is replaced later. `shortDescription` is the tagline
    // printed under each item on the downloadable receipt. Only a handful
    // of fields are selected, so this stays cheap.
    const orders = await Order.find({ user: req.user._id })
      .populate("items.product", "name thumbnail slug shortDescription")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (["shipped", "out_for_delivery", "delivered", "cancelled", "returned"].includes(order.orderStatus)) {
      return res.status(400).json({ success: false, message: "Order can no longer be cancelled" });
    }

    const reason = req.body.reason || "Cancelled by customer";

    // Refund FIRST: if Razorpay rejects it, the order stays as it was
    // rather than showing "cancelled" while the customer's money is kept.
    let refund = null;
    try {
      refund = await refundOrder(order, reason);
    } catch (err) {
      console.error("Refund failed for order", order.orderNumber, err.message);
      return res.status(502).json({
        success: false,
        message: "We couldn't process the refund right now, so the order was not cancelled. Please try again shortly.",
      });
    }

    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.product, "sizes._id": item.sizeId },
        { $inc: { "sizes.$.stock": item.quantity } }
      ).catch(() => {});
    }

    order.orderStatus = "cancelled";
    order.cancelReason = reason;
    order.statusHistory.push({
      status: "cancelled",
      note: refund ? `${reason}. Refund ${refund.id} issued.` : reason,
    });
    await order.save();

    res.json({
      success: true,
      message: refund ? "Order cancelled. Your refund has been initiated." : "Order cancelled",
      data: order,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
