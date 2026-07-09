const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");

const calcCartTotals = async (cart) => {
  const subtotal = cart.items.reduce((sum, i) => sum + i.priceAtAddition * i.quantity, 0);
  let discount = 0;
  let couponDetails = null;

  if (cart.couponApplied) {
    const coupon = await Coupon.findById(cart.couponApplied);
    if (coupon && coupon.isActive && (!coupon.expiresAt || coupon.expiresAt > new Date())) {
      if (coupon.discountType === "percentage") {
        discount = Math.round((subtotal * coupon.discountValue) / 100);
        if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
      } else {
        discount = coupon.discountValue;
      }
      discount = Math.min(discount, subtotal);
      couponDetails = coupon;
    } else {
      cart.couponApplied = null;
      await cart.save();
    }
  }

  return { subtotal, discount, total: subtotal - discount, couponDetails };
};

// GET /api/cart
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate("items.product", "name thumbnail slug");
    if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });

    const totals = await calcCartTotals(cart);
    res.json({ success: true, data: { ...cart.toObject(), ...totals } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/cart/items
exports.addItem = async (req, res) => {
  try {
    const { productId, variantId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const variant = product.variants.id(variantId);
    if (!variant) return res.status(404).json({ success: false, message: "Variant not found" });

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });

    const existingItem = cart.items.find(
      (i) => i.product.toString() === productId && i.variantId.toString() === variantId
    );
    const totalRequested = (existingItem?.quantity || 0) + quantity;

    if (variant.stock < totalRequested) {
      return res.status(400).json({ success: false, message: "Not enough stock available" });
    }

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        product: productId,
        variantId,
        quantity,
        priceAtAddition: variant.discountPrice || variant.price,
      });
    }

    await cart.save();
    res.status(201).json({ success: true, data: cart });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT /api/cart/items/:variantId
exports.updateItemQuantity = async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    const item = cart.items.find((i) => i.variantId.toString() === req.params.variantId);
    if (!item) return res.status(404).json({ success: false, message: "Item not in cart" });

    if (quantity <= 0) {
      cart.items = cart.items.filter((i) => i.variantId.toString() !== req.params.variantId);
    } else {
      const product = await Product.findById(item.product);
      const variant = product?.variants.id(req.params.variantId);
      if (variant && quantity > variant.stock) {
        return res.status(400).json({ success: false, message: "Not enough stock available" });
      }
      item.quantity = quantity;
    }

    await cart.save();
    res.json({ success: true, data: cart });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/cart/items/:variantId
exports.removeItem = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    cart.items = cart.items.filter((i) => i.variantId.toString() !== req.params.variantId);
    await cart.save();

    res.json({ success: true, data: cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/cart
exports.clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [], couponApplied: null });
    res.json({ success: true, message: "Cart cleared" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/cart/coupon   { code }
exports.applyCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: "Coupon code required" });

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim(), isActive: true });
    if (!coupon) return res.status(404).json({ success: false, message: "Invalid or inactive coupon" });
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "This coupon has expired" });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Your cart is empty" });
    }

    const subtotal = cart.items.reduce((sum, i) => sum + i.priceAtAddition * i.quantity, 0);
    if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
      return res.status(400).json({
        success: false,
        message: `Add items worth ₹${coupon.minOrderValue - subtotal} more to use this coupon`,
      });
    }

    cart.couponApplied = coupon._id;
    await cart.save();

    const totals = await calcCartTotals(cart);
    res.json({ success: true, data: { ...cart.toObject(), ...totals } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/cart/coupon
exports.removeCoupon = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    cart.couponApplied = null;
    await cart.save();

    const totals = await calcCartTotals(cart);
    res.json({ success: true, data: { ...cart.toObject(), ...totals } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.calcCartTotals = calcCartTotals;