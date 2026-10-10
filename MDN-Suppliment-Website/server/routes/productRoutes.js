const router = require("express").Router();
const ctrl = require("../controller/productController");
const { isAuth } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { limits } = require("../middleware/security");
const { idParam, productListQuery, suggestQuery, slugParam, reviewBody } = require("../validators/schemas");

router.get("/", validate({ query: productListQuery }), ctrl.getProducts);
// MUST stay above "/:slug" — Express matches in declaration order, so if
// the slug route came first it would swallow "/suggest" and try to look
// up a product whose slug is literally "suggest" (404).
router.get("/suggest", validate({ query: suggestQuery }), ctrl.getSuggestions);
router.get("/:slug", validate({ params: slugParam }), ctrl.getProductBySlug);
router.post(
  "/:id/reviews",
  isAuth,
  limits.review,
  validate({ params: idParam("id", "Product"), body: reviewBody }),
  ctrl.addReview
);

module.exports = router;
