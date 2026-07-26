const Product = require("../models/Product");

// Turns a raw search box value into a set of $or conditions that match a
// PARTIAL term anywhere in the searchable fields.
//
// This replaces the previous `$text: { $search: term }`. A MongoDB text
// index tokenises its input into whole words and only ever matches whole
// words back (plus stemming) — so "creatine" found the product but "c",
// "cr" and "crea" matched nothing at all, which forced customers to type
// a full product name before they saw a single result. A case-insensitive
// regex matches mid-word, which is the behaviour a storefront search box
// is expected to have.
//
// The term is escaped before it reaches `new RegExp` so metacharacters a
// customer can legitimately type (".", "+", "(", "*") are treated as
// literal characters rather than becoming operators — unescaped, "(" is a
// syntax error that would 500 the endpoint, and ".*" would match the
// entire catalogue.
//
// `description` is deliberately NOT searched: on a one or two letter term
// it matches nearly every product and drowns out the real name hits.
function buildSearchConditions(term) {
  const clean = String(term || "").trim();
  if (!clean) return null;
  const rx = new RegExp(escapeRegex(clean), "i");
  return [{ name: rx }, { brand: rx }, { productType: rx }, { tags: rx }];
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// GET /api/products  (public storefront listing)
exports.getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, productType, goal, search, sort, section } = req.query;

    const filter = { isActive: true };
    if (category) filter.category = category;
    if (productType) filter.productType = productType;
    if (goal) filter.goal = goal;
    if (section) filter.sections = section;
    if (search) {
      const conditions = buildSearchConditions(search);
      if (conditions) filter.$or = conditions;
    }

    let sortOption = { createdAt: -1 };
    if (sort === "price_low") sortOption = { "sizes.0.price": 1 };
    if (sort === "price_high") sortOption = { "sizes.0.price": -1 };
    if (sort === "rating") sortOption = { ratingsAverage: -1 };

    // `category` is populated because the storefront groups products by
    // category NAME (see ProductsByCategory.jsx). Without this it stayed a
    // bare ObjectId, `p.category?.name` was undefined, and every group fell
    // back to the literal string "More Products" — so the page rendered one
    // identically-titled "More Products" section per category.
    const products = await Product.find(filter)
      .select("-reviews")
      .populate("category", "name slug")
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort(sortOption);

    const total = await Product.countDocuments(filter);

    res.json({ success: true, data: products, total, page: Number(page) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/products/suggest?q=cr&limit=8
//
// Lightweight autocomplete feed for the navbar search box. Kept separate
// from getProducts because the dropdown wants a handful of ranked rows
// with just enough to render a line item, not a paginated, sorted,
// filterable page of full product documents.
//
// Ranking is done here rather than in the query because a regex `find`
// has no relevance score to sort on. Over-fetching a few pages' worth and
// ordering them in memory is cheap at this catalogue size and gives the
// behaviour customers expect: typing "cr" puts "Creatine" above a product
// that merely happens to contain "cr" somewhere in its brand.
exports.getSuggestions = async (req, res) => {
  try {
    const { q, limit = 8 } = req.query;
    const conditions = buildSearchConditions(q);
    if (!conditions) return res.json({ success: true, data: [] });

    const max = Math.min(Number(limit) || 8, 20);

    const products = await Product.find({ isActive: true, $or: conditions })
      .select("name slug thumbnail productType brand sizes")
      .limit(max * 5)
      .lean();

    const escaped = escapeRegex(String(q).trim());
    const startsWith = new RegExp(`^${escaped}`, "i");
    const wordStart = new RegExp(`\\b${escaped}`, "i");

    const ranked = products
      .map((p) => {
        const name = p.name || "";
        // 0 = name begins with the term, 1 = a word inside the name
        // begins with it, 2 = matched somewhere else (brand/type/tag).
        const rank = startsWith.test(name) ? 0 : wordStart.test(name) ? 1 : 2;
        return { p, rank };
      })
      .sort((a, b) => a.rank - b.rank || a.p.name.localeCompare(b.p.name))
      .slice(0, max)
      .map(({ p }) => p);

    res.json({ success: true, data: ranked });
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