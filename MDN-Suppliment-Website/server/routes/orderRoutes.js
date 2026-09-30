const router = require("express").Router();
const ctrl = require("../controller/orderController");
const { isAuth } = require("../middleware/auth");

// Called by Razorpay's servers, not a logged-in user — so it sits ABOVE
// isAuth and is authenticated by its HMAC signature instead.
router.post("/razorpay-webhook", ctrl.razorpayWebhook);

router.use(isAuth);

router.post("/create-razorpay-order", ctrl.createRazorpayOrder);
router.post("/verify-payment", ctrl.verifyPaymentAndPlaceOrder);

router.get("/", ctrl.getMyOrders);
router.get("/:id", ctrl.getOrderById);
router.put("/:id/cancel", ctrl.cancelOrder);

module.exports = router;