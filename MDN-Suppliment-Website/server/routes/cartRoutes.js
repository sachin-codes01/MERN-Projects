const router = require("express").Router();
const ctrl = require("../controller/cartController");
const { isAuth } = require("../middleware/auth");

router.use(isAuth);

router.get("/", ctrl.getCart);
router.post("/items", ctrl.addItem);
router.put("/items/:variantId", ctrl.updateItemQuantity);
router.delete("/items/:variantId", ctrl.removeItem);
router.delete("/", ctrl.clearCart);

router.post("/coupon", ctrl.applyCoupon);
router.delete("/coupon", ctrl.removeCoupon);

module.exports = router;