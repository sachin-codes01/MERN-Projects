const router = require("express").Router();
const ctrl = require("../controller/authController");
const { isAuth } = require("../middleware/auth");

router.post("/register", ctrl.register);
router.post("/login", ctrl.login);
router.post("/refresh", ctrl.refreshToken);
router.post("/forgot-password", ctrl.forgotPassword);
router.post("/reset-password", ctrl.resetPassword);

router.post("/logout", isAuth, ctrl.logout);
router.get("/me", isAuth, ctrl.getMe);

module.exports = router;