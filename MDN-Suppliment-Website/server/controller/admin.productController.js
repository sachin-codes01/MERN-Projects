// Example: Admin CRUD controller for Products
// Same pattern applies to Category, Coupon, and Order status updates.
// Protect all routes below with `isAuth` + `isAdmin` middleware.

const Product = require("../models/Product");

// CREATE
exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// READ ALL (with pagination, filters)
exports.getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, productType, search } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (productType) filter.productType = productType;
    if (search) filter.$text = { $search: search };

    const products = await Product.find(filter)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(filter);

    res.json({ success: true, data: products, total, page: Number(page) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// READ ONE
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE (soft delete recommended over hard delete)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!product) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, message: "Product deactivated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/*
Routes file (admin.productRoutes.js):

const router = require("express").Router();
const ctrl = require("./admin.productController");
const { isAuth, isAdmin } = require("../middleware/auth");

router.use(isAuth, isAdmin);
router.post("/products", ctrl.createProduct);
router.get("/products", ctrl.getAllProducts);
router.get("/products/:id", ctrl.getProductById);
router.put("/products/:id", ctrl.updateProduct);
router.delete("/products/:id", ctrl.deleteProduct);

module.exports = router;
*/