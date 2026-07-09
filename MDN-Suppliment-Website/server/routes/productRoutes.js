const router = require("express").Router();
const ctrl = require("../controller/productController");
const { isAuth } = require("../middleware/auth");

router.get("/", ctrl.getProducts);
router.get("/:slug", ctrl.getProductBySlug);
router.post("/:id/reviews", isAuth, ctrl.addReview);

module.exports = router;