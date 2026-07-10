const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const User = require("../models/User");

const generateOrderNumber = () => "ORD" + Date.now() + Math.floor(Math.random() * 1000);

// TODO (Razorpay milne ke baad): Ye function hata kar Razorpay verify wala placeOrder use karna
exports.placeOrder = async (req, res) => {
  const decrementedItems = [];
  try {
    const { shippingAddress, saveAddress } = req.body;

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
        return res.status(400).json({
          success: false,
          message: `${product.name} just went out of stock. Please update your cart.`,
        });
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

    let discount = 0;
    let appliedCouponCode = null;
    if (cart.couponApplied) {
      const coupon = await Coupon.findById(cart.couponApplied);
      if (coupon && coupon.isActive && (!coupon.expiresAt || coupon.expiresAt > new Date())) {
        if (!coupon.minOrderValue || subtotal >= coupon.minOrderValue) {
          discount =
            coupon.discountType === "percentage"
              ? Math.round((subtotal * coupon.discountValue) / 100)
              : coupon.discountValue;
          if (coupon.discountType === "percentage" && coupon.maxDiscount) {
            discount = Math.min(discount, coupon.maxDiscount);
          }
          discount = Math.min(discount, subtotal);
          appliedCouponCode = coupon.code;
        }
      }
    }

    const shippingFee = subtotal - discount > 999 ? 0 : 79;
    const tax = Math.round((subtotal - discount) * 0.05);
    const total = subtotal - discount + shippingFee + tax;

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      pricing: { subtotal, discount, couponCode: appliedCouponCode, shippingFee, tax, total },
      payment: { method: "online", status: "pending" },
      statusHistory: [{ status: "placed", note: "Order placed (payment gateway pending setup)" }],
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

async function rollback(decrementedItems) {
  for (const { productId, variantId, quantity } of decrementedItems) {
    await Product.updateOne(
      { _id: productId, "variants._id": variantId },
      { $inc: { "variants.$.stock": quantity } }
    ).catch(() => {});
  }
}

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