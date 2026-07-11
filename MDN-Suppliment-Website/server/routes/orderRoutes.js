const router = require("express").Router();
const ctrl = require("../controller/orderController");
const { isAuth } = require("../middleware/auth");

router.use(isAuth);

router.post("/create-razorpay-order", ctrl.createRazorpayOrder);
router.post("/verify-payment", ctrl.verifyPaymentAndPlaceOrder);

router.get("/", ctrl.getMyOrders);
router.get("/:id", ctrl.getOrderById);
router.put("/:id/cancel", ctrl.cancelOrder);

module.exports = router;