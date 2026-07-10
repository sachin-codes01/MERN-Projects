const router = require("express").Router();
const ctrl = require("../controller/authController");
const { isAuth } = require("../middleware/auth");

router.post("/google", ctrl.googleLogin);
router.post("/refresh", ctrl.refreshToken);
router.post("/logout", isAuth, ctrl.logout);
router.get("/me", isAuth, ctrl.getMe);

module.exports = router;