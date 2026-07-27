const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const { calcOrderPricing, FREE_SHIPPING_ABOVE, TAX_RATE } = require("../utils/orderPricing");

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

  // `total` is the full amount payable — the same figure the Razorpay
  // popup will show — so the checkout summary can display every line the
  // customer is charged instead of only the item subtotal.
  const { shippingFee, tax } = calcOrderPricing(subtotal, discount);

  return {
    subtotal,
    discount,
    shippingFee,
    tax,
    taxRate: TAX_RATE,
    freeShippingAbove: FREE_SHIPPING_ABOVE,
    total: subtotal - discount + shippingFee + tax,
    couponDetails,
  };
};

// Stock is a single shared pool per size, split across however many
// flavor-lines of that size are already in the cart — so adding "1kg
// Vanilla" has to account for "1kg Chocolate" already sitting in the same
// cart against the same size's stock. `excludeItemId` lets an in-place
// quantity update compare against the OTHER lines only, not double-count
// the line being changed.
const quantityOfSizeInCart = (cart, sizeId, excludeItemId = null) =>
  cart.items
    .filter((i) => i.sizeId.toString() === sizeId.toString() && String(i._id) !== String(excludeItemId))
    .reduce((sum, i) => sum + i.quantity, 0);

// GET /api/cart
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product",
      "name thumbnail slug sizes flavors brand"
    );
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
    const { productId, sizeId, flavorId = null, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const size = product.sizes.id(sizeId);
    if (!size) return res.status(404).json({ success: false, message: "Size not found" });

    const flavor = flavorId ? product.flavors.id(flavorId) : null;
    if (flavorId && !flavor) return res.status(404).json({ success: false, message: "Flavor not found" });

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });

    const existingItem = cart.items.find(
      (i) =>
        i.product.toString() === productId &&
        i.sizeId.toString() === sizeId &&
        (i.flavorId ? i.flavorId.toString() : null) === (flavorId || null)
    );

    const alreadyInCart = quantityOfSizeInCart(cart, sizeId, existingItem?._id);
    const totalRequested = alreadyInCart + (existingItem?.quantity || 0) + quantity;
    if (size.stock < totalRequested) {
      return res.status(400).json({ success: false, message: "Not enough stock available" });
    }

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      const basePrice = size.discountPrice || size.price;
      cart.items.push({
        product: productId,
        sizeId,
        flavorId: flavor?._id || null,
        flavor: flavor?.name || null,
        quantity,
        priceAtAddition: basePrice + (flavor?.priceAdjustment || 0),
      });
    }

    await cart.save();
    res.status(201).json({ success: true, data: cart });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT /api/cart/items/:itemId
exports.updateItemQuantity = async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    const item = cart.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ success: false, message: "Item not in cart" });

    if (quantity <= 0) {
      cart.items.pull(req.params.itemId);
    } else {
      const product = await Product.findById(item.product);
      const size = product?.sizes.id(item.sizeId);
      const othersOfThisSize = size ? quantityOfSizeInCart(cart, item.sizeId, item._id) : 0;
      if (size && othersOfThisSize + quantity > size.stock) {
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

// DELETE /api/cart/items/:itemId
exports.removeItem = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    cart.items.pull(req.params.itemId);
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
