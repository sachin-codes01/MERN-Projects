const router = require("express").Router();
const { isAuth, isAdmin } = require("../middleware/auth");
const upload = require("../middleware/upload");
const uploadCtrl = require("../controller/uploadController");

const productCtrl = require("../controller/admin.productController"); // from earlier
const enquiryCtrl = require("../controller/enquiryController");
const Category = require("../models/Category");
const Coupon = require("../models/Coupon");
const Order = require("../models/Order");
const User = require("../models/User");
const SiteSettings = require("../models/SiteSettings");
const FlavorPreset = require("../models/FlavorPreset");
const { refundOrder } = require("../utils/payments");
const validate = require("../middleware/validate");
const S = require("../validators/schemas");

// Har `:id` wale route pe pehle ObjectId check — galat id pe 500 ki jagah 400
const byId = (label) => validate({ params: S.idParam("id", label) });

router.use(isAuth, isAdmin); // every route below is admin-only

//Image
router.post("/upload", upload.single("image"), uploadCtrl.uploadImage);
/* ---------- PRODUCTS ---------- */
router.post("/products", validate({ body: S.productBody }), productCtrl.createProduct);
router.get("/products", validate({ query: S.adminProductsQuery }), productCtrl.getAllProducts);
router.get("/products/:id", byId("Product"), productCtrl.getProductById);
router.put("/products/:id", byId("Product"), validate({ body: S.productUpdateBody }), productCtrl.updateProduct);
router.delete("/products/:id", byId("Product"), productCtrl.deleteProduct);
// Distinct path (not a flag on the route above) so an accidental plain
// DELETE can only ever deactivate — never destroy.
router.delete("/products/:id/permanent", byId("Product"), productCtrl.permanentlyDeleteProduct);

/* ---------- ENQUIRIES (contact form submissions) ---------- */
router.get("/enquiries", validate({ query: S.adminEnquiriesQuery }), enquiryCtrl.adminGetEnquiries);
router.put("/enquiries/:id/status", byId("Enquiry"), validate({ body: S.enquiryStatusBody }), enquiryCtrl.adminUpdateEnquiryStatus);

/* ---------- CATEGORIES ---------- */
router.post("/categories", validate({ body: S.categoryBody }), async (req, res) => {
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

router.put("/categories/:id", byId("Category"), validate({ body: S.categoryUpdateBody }), async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!category) return res.status(404).json({ success: false, message: "Category not found" });
    res.json({ success: true, data: category });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete("/categories/:id", byId("Category"), async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, { isActive: false });
  if (!category) return res.status(404).json({ success: false, message: "Category not found" });
  res.json({ success: true, message: "Category deactivated" });
});

/* ---------- FLAVOUR PRESETS (reusable flavour swatches) ---------- */
router.get("/flavors", async (req, res) => {
  const flavors = await FlavorPreset.find().sort({ name: 1 });
  res.json({ success: true, data: flavors });
});

router.post("/flavors", validate({ body: S.flavorPresetBody }), async (req, res) => {
  try {
    // name/image validate() me trim + check ho chuke hain
    const { name, image } = req.body;
    // Case-insensitive duplicate check — "mango" and "Mango" are the same flavour.
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const exists = await FlavorPreset.findOne({ name: new RegExp(`^${escaped}$`, "i") });
    if (exists) return res.status(409).json({ success: false, message: "That flavour is already in the library" });

    const flavor = await FlavorPreset.create({ name, image });
    res.status(201).json({ success: true, data: flavor });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete("/flavors/:id", byId("Flavour"), async (req, res) => {
  const flavor = await FlavorPreset.findByIdAndDelete(req.params.id);
  if (!flavor) return res.status(404).json({ success: false, message: "Flavour not found" });
  res.json({ success: true, message: "Flavour removed from library" });
});

/* ---------- COUPONS ---------- */
router.post("/coupons", validate({ body: S.couponCreateBody }), async (req, res) => {
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

router.get("/coupons/:id", byId("Coupon"), async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found" });
    res.json({ success: true, data: coupon });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/coupons/:id", byId("Coupon"), validate({ body: S.couponUpdateBody }), async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found" });
    res.json({ success: true, data: coupon });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Soft delete (deactivate)
router.delete("/coupons/:id", byId("Coupon"), async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found" });
  res.json({ success: true, message: "Coupon deactivated" });
});

// Hard delete, for genuinely removing a coupon that was never used
router.delete("/coupons/:id/permanent", byId("Coupon"), async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found" });
  res.json({ success: true, message: "Coupon deleted" });
});

/* ---------- ORDERS ---------- */
router.get("/orders", validate({ query: S.adminOrdersQuery }), async (req, res) => {
  const { status, user, page, limit } = req.query;
  const filter = {};
  if (status) filter.orderStatus = status;
  if (user) filter.user = user;

  const orders = await Order.find(filter)
    .populate("user", "name email")
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 });
  const total = await Order.countDocuments(filter);
  res.json({ success: true, data: orders, total });
});

router.get("/orders/:id", byId("Order"), async (req, res) => {
  const order = await Order.findById(req.params.id).populate("user", "name email");
  if (!order) return res.status(404).json({ success: false, message: "Order not found" });
  res.json({ success: true, data: order });
});

router.put("/orders/:id/status", byId("Order"), validate({ body: S.orderStatusBody }), async (req, res) => {
  try {
    const { status, trackingNumber, courierPartner, estimatedDelivery, deliveredAt } = req.body;
    let { note } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // Delivered date order place hone se pehle ki nahi ho sakti
    if (deliveredAt && new Date(deliveredAt) < new Date(order.createdAt.toDateString())) {
      const message = "Delivered date can't be before the order date";
      return res.status(400).json({ success: false, message, errors: [{ field: "deliveredAt", message }] });
    }

    // Cancelling a paid order from the admin panel refunds the customer.
    // Done before the status changes so a failed refund leaves the order
    // untouched. (Returns are refunded manually once the goods are back.)
    if (status === "cancelled" && order.orderStatus !== "cancelled") {
      try {
        if (!order.cancelReason) order.cancelReason = note || "Cancelled by store";
        const refund = await refundOrder(order, order.cancelReason);
        if (refund) note = `${note ? note + ". " : ""}Refund ${refund.id} issued.`;
      } catch (err) {
        return res.status(502).json({ success: false, message: `Refund failed, order not cancelled: ${err.message}` });
      }
    }

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

router.get("/users/:id", byId("User"), async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  res.json({ success: true, data: user });
});

// Orders placed by a specific user — used by the admin "view orders" action
router.get("/users/:id/orders", byId("User"), async (req, res) => {
  const orders = await Order.find({ user: req.params.id }).sort({ createdAt: -1 });
  res.json({ success: true, data: orders });
});

router.put("/users/:id/block", byId("User"), async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: true }, { new: true }).select("-password");
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  res.json({ success: true, data: user });
});

router.put("/users/:id/unblock", byId("User"), async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: false }, { new: true }).select("-password");
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  res.json({ success: true, data: user });
});

/* ---------- SITE SETTINGS ---------- */
router.get("/settings", async (req, res) => {
  const settings = await SiteSettings.getSingleton();
  res.json({ success: true, data: settings });
});

router.put("/settings", validate({ body: S.emptyBody }), async (req, res) => {
  const settings = await SiteSettings.getSingleton();
  await settings.save();
  res.json({ success: true, data: settings });
});

module.exports = router;