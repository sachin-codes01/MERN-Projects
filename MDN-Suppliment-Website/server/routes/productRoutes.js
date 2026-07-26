const router = require("express").Router();
const ctrl = require("../controller/productController");
const { isAuth } = require("../middleware/auth");

router.get("/", ctrl.getProducts);
// MUST stay above "/:slug" — Express matches in declaration order, so if
// the slug route came first it would swallow "/suggest" and try to look
// up a product whose slug is literally "suggest" (404).
router.get("/suggest", ctrl.getSuggestions);
router.get("/:slug", ctrl.getProductBySlug);
router.post("/:id/reviews", isAuth, ctrl.addReview);

module.exports = router;