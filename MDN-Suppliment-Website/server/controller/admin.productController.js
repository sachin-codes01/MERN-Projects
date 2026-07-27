// Admin CRUD controller for Products — wired up in routes/adminRoutes.js
// (that file also applies isAuth + isAdmin to everything below it).

const Product = require("../models/Product");
const Cart = require("../models/Cart");

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
    // Same partial-match fix as the storefront listing — see
    // buildSearchConditions in productController.js for why $text was
    // dropped (it only ever matched whole words).
    if (search) {
      const clean = String(search).trim();
      if (clean) {
        const rx = new RegExp(clean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        filter.$or = [{ name: rx }, { brand: rx }, { productType: rx }, { tags: rx }];
      }
    }

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

// DELETE (soft) — hides the product from the storefront but keeps the
// document, so it can be reactivated and every reference to it stays intact.
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

// DELETE (permanent) — removes the document outright. Irreversible.
//
// Past orders are unaffected: Order.items stores its own snapshot of the
// name/flavor/weight/image/price at purchase time, so order history still
// renders correctly once the product row is gone.
//
// Live carts are NOT self-sufficient that way — a logged-in cart line only
// holds a reference and reads the details off the populated product, which
// would come back null and render an unbuyable blank row. So the product's
// lines are pulled out of every cart as part of the delete.
exports.permanentlyDeleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Not found" });

    await Cart.updateMany(
      { "items.product": req.params.id },
      { $pull: { items: { product: req.params.id } } }
    );

    res.json({ success: true, message: "Product permanently deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
