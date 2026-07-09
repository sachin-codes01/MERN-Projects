const Product = require("../models/Product");

// GET /api/products  (public storefront listing)
exports.getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, productType, goal, search, sort, section } = req.query;

    const filter = { isActive: true };
    if (category) filter.category = category;
    if (productType) filter.productType = productType;
    if (goal) filter.goal = goal;
    if (section) filter.sections = section;
    if (search) filter.$text = { $search: search };

    let sortOption = { createdAt: -1 };
    if (sort === "price_low") sortOption = { "variants.0.price": 1 };
    if (sort === "price_high") sortOption = { "variants.0.price": -1 };
    if (sort === "rating") sortOption = { ratingsAverage: -1 };

    const products = await Product.find(filter)
      .select("-reviews")
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort(sortOption);

    const total = await Product.countDocuments(filter);

    res.json({ success: true, data: products, total, page: Number(page) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/products/:slug
exports.getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true }).populate(
      "reviews.user",
      "name avatar"
    );
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/products/:id/reviews  (requires auth)
exports.addReview = async (req, res) => {
  try {
    const { rating, comment, images } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );
    if (alreadyReviewed) {
      return res.status(400).json({ success: false, message: "You already reviewed this product" });
    }

    product.reviews.push({ user: req.user._id, rating, comment, images });
    product.ratingsCount = product.reviews.length;
    product.ratingsAverage =
      product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length;

    await product.save();
    res.status(201).json({ success: true, message: "Review added" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};