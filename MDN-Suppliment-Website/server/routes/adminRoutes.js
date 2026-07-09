const router = require("express").Router();
const { isAuth, isAdmin } = require("../middleware/auth");

const productCtrl = require("../controller/admin.productController"); // from earlier
const Category = require("../models/Category");
const Coupon = require("../models/Coupon");
const Order = require("../models/Order");
const User = require("../models/User");

router.use(isAuth, isAdmin); // every route below is admin-only

/* ---------- PRODUCTS ---------- */
router.post("/products", productCtrl.createProduct);
router.get("/products", productCtrl.getAllProducts);
router.get("/products/:id", productCtrl.getProductById);
router.put("/products/:id", productCtrl.updateProduct);
router.delete("/products/:id", productCtrl.deleteProduct);

/* ---------- CATEGORIES ---------- */
router.post("/categories", async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.get("/categories", async (req, res) => {
  const categories = await Category.find().sort({ displayOrder: 1 });
  res.json({ success: true, data: categories });
});

router.put("/categories/:id", async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: category });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete("/categories/:id", async (req, res) => {
  await Category.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ success: true, message: "Category deactivated" });
});

/* ---------- COUPONS ---------- */
router.post("/coupons", async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, data: coupon });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.get("/coupons", async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json({ success: true, data: coupons });
});

router.get("/coupons/:id", async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found" });
    res.json({ success: true, data: coupon });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/coupons/:id", async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found" });
    res.json({ success: true, data: coupon });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Soft delete (deactivate)
router.delete("/coupons/:id", async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found" });
  res.json({ success: true, message: "Coupon deactivated" });
});

// Hard delete, for genuinely removing a coupon that was never used
router.delete("/coupons/:id/permanent", async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found" });
  res.json({ success: true, message: "Coupon deleted" });
});

/* ---------- ORDERS ---------- */
router.get("/orders", async (req, res) => {
  const { status, user, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.orderStatus = status;
  if (user) filter.user = user;

  const orders = await Order.find(filter)
    .populate("user", "name email")
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 });
  const total = await Order.countDocuments(filter);
  res.json({ success: true, data: orders, total });
});

router.get("/orders/:id", async (req, res) => {
  const order = await Order.findById(req.params.id).populate("user", "name email");
  if (!order) return res.status(404).json({ success: false, message: "Order not found" });
  res.json({ success: true, data: order });
});

router.put("/orders/:id/status", async (req, res) => {
  try {
    const { status, note, trackingNumber, courierPartner, estimatedDelivery, deliveredAt } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    order.orderStatus = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (courierPartner) order.courierPartner = courierPartner;
    if (estimatedDelivery) order.estimatedDelivery = estimatedDelivery;

    // Admin can pick a specific delivered date; if they just mark it
    // "delivered" without choosing one, default to right now.
    if (status === "delivered") {
      order.deliveredAt = deliveredAt ? new Date(deliveredAt) : new Date();
    } else if (deliveredAt !== undefined) {
      // lets admin correct/clear the date independent of status changes
      order.deliveredAt = deliveredAt ? new Date(deliveredAt) : null;
    }

    order.statusHistory.push({ status, note });

    await order.save();
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/* ---------- USERS ---------- */
router.get("/users", async (req, res) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  res.json({ success: true, data: users });
});

router.get("/users/:id", async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  res.json({ success: true, data: user });
});

// Orders placed by a specific user — used by the admin "view orders" action
router.get("/users/:id/orders", async (req, res) => {
  const orders = await Order.find({ user: req.params.id }).sort({ createdAt: -1 });
  res.json({ success: true, data: orders });
});

router.put("/users/:id/block", async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: true }, { new: true }).select("-password");
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  res.json({ success: true, data: user });
});

router.put("/users/:id/unblock", async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: false }, { new: true }).select("-password");
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  res.json({ success: true, data: user });
});

module.exports = router;