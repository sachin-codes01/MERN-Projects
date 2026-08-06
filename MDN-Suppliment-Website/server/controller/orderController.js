const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const User = require("../models/User");
const razorpay = require("../config/razorpay");
const { calcOrderPricing } = require("../utils/orderPricing");
const crypto = require("crypto");

async function rollback(decrementedItems) {
  for (const { productId, sizeId, quantity } of decrementedItems) {
    await Product.updateOne(
      { _id: productId, "sizes._id": sizeId },
      { $inc: { "sizes.$.stock": quantity } }
    ).catch(() => {});
  }
}

// Same address dobara save na ho, isliye duplicate check
function isDuplicateAddress(existingAddresses, newAddress) {
  return existingAddresses.some(
    (a) =>
      (a.line1 || "").trim().toLowerCase() === (newAddress.line1 || "").trim().toLowerCase() &&
      (a.pincode || "").trim() === (newAddress.pincode || "").trim() &&
      (a.phone || "").trim() === (newAddress.phone || "").trim()
  );
}

// STEP 1: POST /api/orders/create-razorpay-order
exports.createRazorpayOrder = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    const subtotal = cart.items.reduce((sum, i) => sum + i.priceAtAddition * i.quantity, 0);
    let discount = 0;

    if (cart.couponApplied) {
      const coupon = await Coupon.findById(cart.couponApplied);
      if (coupon && coupon.isActive && (!coupon.expiresAt || coupon.expiresAt > new Date())) {
        discount = coupon.discountType === "percentage"
          ? Math.round((subtotal * coupon.discountValue) / 100)
          : coupon.discountValue;
        if (coupon.discountType === "percentage" && coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
        discount = Math.min(discount, subtotal);
      }
    }

    const { shippingFee, tax, total: finalTotal } = calcOrderPricing(subtotal, discount);

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(finalTotal * 100),
      currency: "INR",
      receipt: "rcpt_" + Date.now(),
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
        total: finalTotal,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// STEP 2: POST /api/orders/verify-payment
exports.verifyPaymentAndPlaceOrder = async (req, res) => {
  const decrementedItems = [];
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      shippingAddress,
      saveAddress,
      addressId,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment details missing" });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    let subtotal = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const product = item.product;
      const size = product.sizes.id(item.sizeId);
      if (!size) {
        await rollback(decrementedItems);
        return res.status(400).json({ success: false, message: `Size no longer exists for ${product.name}` });
      }

      const updated = await Product.findOneAndUpdate(
        { _id: product._id, "sizes._id": item.sizeId, "sizes.stock": { $gte: item.quantity } },
        { $inc: { "sizes.$.stock": -item.quantity } },
        { new: true }
      );
      if (!updated) {
        await rollback(decrementedItems);
        return res.status(400).json({ success: false, message: `${product.name} out of stock now.` });
      }

      decrementedItems.push({ productId: product._id, sizeId: item.sizeId, quantity: item.quantity });

      // Re-derived from the live product (not just the cart's stored
      // priceAtAddition) so a size/flavor price change between add-to-cart
      // and checkout is reflected in the final order — same as before.
      const flavor = item.flavorId ? product.flavors.id(item.flavorId) : null;
      const price = (size.discountPrice || size.price) + (flavor?.priceAdjustment || 0);
      subtotal += price * item.quantity;
      orderItems.push({
        product: product._id,
        sizeId: item.sizeId,
        name: product.name,
        flavor: flavor?.name || item.flavor || null,
        weight: size.weight,
        // Product photo first — the flavour swatch is a small crop of
        // an ingredient (a scoop of chocolate, a mango) and reads as the
        // wrong item in order history. Falls back to it only when a
        // product has no thumbnail at all.
        image: product.thumbnail || flavor?.image,
        price,
        quantity: item.quantity,
      });
    }

    let discount = 0, appliedCouponCode = null;
    if (cart.couponApplied) {
      const coupon = await Coupon.findById(cart.couponApplied);
      if (coupon && coupon.isActive && (!coupon.expiresAt || coupon.expiresAt > new Date())) {
        discount = coupon.discountType === "percentage"
          ? Math.round((subtotal * coupon.discountValue) / 100)
          : coupon.discountValue;
        if (coupon.discountType === "percentage" && coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
        discount = Math.min(discount, subtotal);
        appliedCouponCode = coupon.code;
      }
    }

    const { shippingFee, tax, total } = calcOrderPricing(subtotal, discount);

    const order = await Order.create({
      orderNumber: "ORD" + Date.now() + Math.floor(Math.random() * 1000),
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      pricing: { subtotal, discount, couponCode: appliedCouponCode, shippingFee, tax, total },
      payment: {
        method: "online",
        status: "paid",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      },
      statusHistory: [{ status: "placed", note: "Payment received via Razorpay" }],
    });

    cart.items = [];
    cart.couponApplied = null;
    await cart.save();

    // Address save — sirf tabhi jab duplicate na ho
    if (saveAddress) {
      const userDoc = await User.findById(req.user._id);

      // Checked out with an existing saved address and edited its fields —
      // update that address in place instead of appending a near-duplicate.
      const existing = addressId ? userDoc.addresses.id(addressId) : null;
      if (existing) {
        Object.assign(existing, shippingAddress, { label: saveAddress.label || existing.label || "Home" });
        await userDoc.save();
      } else {
        const alreadyExists = isDuplicateAddress(userDoc.addresses, shippingAddress);
        if (!alreadyExists) {
          userDoc.addresses.push({ ...shippingAddress, label: saveAddress.label || "Home" });
          await userDoc.save();
        }
      }
    }

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    await rollback(decrementedItems);
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    // `items.image` is a snapshot taken when the order was placed, and
    // orders placed before the image-source fix stored the flavour swatch
    // rather than the product photo. Populating the product lets the
    // client prefer the LIVE thumbnail, which repairs those old orders
    // without a data migration — and keeps order history correct if a
    // product's photo is replaced later. Only three fields are selected,
    // so this stays cheap.
    const orders = await Order.find({ user: req.user._id })
      .populate("items.product", "name thumbnail slug")
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

    if (["shipped", "out_for_delivery", "delivered"].includes(order.orderStatus)) {
      return res.status(400).json({ success: false, message: "Order can no longer be cancelled" });
    }

    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.product, "sizes._id": item.sizeId },
        { $inc: { "sizes.$.stock": item.quantity } }
      ).catch(() => {});
    }

    order.orderStatus = "cancelled";
    order.cancelReason = req.body.reason || "Cancelled by customer";
    order.statusHistory.push({ status: "cancelled", note: order.cancelReason });
    await order.save();

    res.json({ success: true, message: "Order cancelled", data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};