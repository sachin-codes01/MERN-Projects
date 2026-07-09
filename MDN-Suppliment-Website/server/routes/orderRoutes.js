const router = require("express").Router();
const ctrl = require("../controller/orderController");
const { isAuth } = require("../middleware/auth");

router.use(isAuth); // all order routes require login

router.post("/", ctrl.placeOrder);
router.get("/", ctrl.getMyOrders);
router.get("/:id", ctrl.getOrderById);
router.put("/:id/cancel", ctrl.cancelOrder);

module.exports = router;