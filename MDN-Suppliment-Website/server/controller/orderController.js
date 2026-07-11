const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const User = require("../models/User");
const razorpay = require("../config/razorpay");
const crypto = require("crypto");

async function rollback(decrementedItems) {
  for (const { productId, variantId, quantity } of decrementedItems) {
    await Product.updateOne(
      { _id: productId, "variants._id": variantId },
      { $inc: { "variants.$.stock": quantity } }
    ).catch(() => {});
  }
}

// STEP 1: POST /api/orders/create-razorpay-order
// Cart ke current total ke basis par Razorpay order banata hai (DB me abhi order nahi banta)
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

    const afterDiscount = subtotal - discount;
    const shippingFee = afterDiscount > 999 ? 0 : 79;
    const tax = Math.round(afterDiscount * 0.05);
    const finalTotal = afterDiscount + shippingFee + tax;

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(finalTotal * 100), // paise me convert
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
// Signature verify karta hai, phir asli Order DB me banata hai
exports.verifyPaymentAndPlaceOrder = async (req, res) => {
  const decrementedItems = [];
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      shippingAddress,
      saveAddress,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment details missing" });
    }

    // Signature verify — proof ki payment genuinely Razorpay se hui hai
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
      const variant = product.variants.id(item.variantId);
      if (!variant) {
        await rollback(decrementedItems);
        return res.status(400).json({ success: false, message: `Variant no longer exists for ${product.name}` });
      }

      const updated = await Product.findOneAndUpdate(
        { _id: product._id, "variants._id": item.variantId, "variants.stock": { $gte: item.quantity } },
        { $inc: { "variants.$.stock": -item.quantity } },
        { new: true }
      );
      if (!updated) {
        await rollback(decrementedItems);
        return res.status(400).json({ success: false, message: `${product.name} out of stock now.` });
      }

      decrementedItems.push({ productId: product._id, variantId: item.variantId, quantity: item.quantity });

      const price = variant.discountPrice || variant.price;
      subtotal += price * item.quantity;
      orderItems.push({
        product: product._id,
        variantId: item.variantId,
        name: product.name,
        flavor: variant.flavor,
        weight: variant.weight,
        image: variant.images?.[0] || product.thumbnail,
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

    const shippingFee = subtotal - discount > 999 ? 0 : 79;
    const tax = Math.round((subtotal - discount) * 0.05);
    const total = subtotal - discount + shippingFee + tax;

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

    if (saveAddress) {
      await User.findByIdAndUpdate(req.user._id, {
        $push: { addresses: { ...shippingAddress, label: saveAddress.label || "Home" } },
      });
    }

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    await rollback(decrementedItems);
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
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
        { _id: item.product, "variants._id": item.variantId },
        { $inc: { "variants.$.stock": item.quantity } }
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