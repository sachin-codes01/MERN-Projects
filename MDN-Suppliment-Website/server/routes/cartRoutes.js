const router = require("express").Router();
const ctrl = require("../controller/cartController");
const { isAuth } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { limits } = require("../middleware/security");
const { idParam, addCartItemBody, updateCartItemBody, couponBody } = require("../validators/schemas");

router.use(isAuth);

const itemParam = validate({ params: idParam("itemId", "Cart item") });

router.get("/", ctrl.getCart);
router.post("/items", validate({ body: addCartItemBody }), ctrl.addItem);
router.put("/items/:itemId", itemParam, validate({ body: updateCartItemBody }), ctrl.updateItemQuantity);
router.delete("/items/:itemId", itemParam, ctrl.removeItem);
router.delete("/", ctrl.clearCart);

router.post("/coupon", limits.coupon, validate({ body: couponBody }), ctrl.applyCoupon);
router.delete("/coupon", ctrl.removeCoupon);

module.exports = router;
