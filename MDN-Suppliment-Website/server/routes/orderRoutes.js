const router = require("express").Router();
const ctrl = require("../controller/orderController");
const { isAuth } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { limits } = require("../middleware/security");
const { idParam, createRazorpayOrderBody, verifyPaymentBody, cancelOrderBody } = require("../validators/schemas");

// Called by Razorpay's servers, not a logged-in user — so it sits ABOVE
// isAuth and is authenticated by its HMAC signature instead.
router.post("/razorpay-webhook", ctrl.razorpayWebhook);

router.use(isAuth);

router.post("/create-razorpay-order", limits.payment, validate({ body: createRazorpayOrderBody }), ctrl.createRazorpayOrder);
router.post("/verify-payment", limits.payment, validate({ body: verifyPaymentBody }), ctrl.verifyPaymentAndPlaceOrder);

const orderParam = validate({ params: idParam("id", "Order") });

router.get("/", ctrl.getMyOrders);
router.get("/:id", orderParam, ctrl.getOrderById);
router.put("/:id/cancel", orderParam, validate({ body: cancelOrderBody }), ctrl.cancelOrder);

module.exports = router;
