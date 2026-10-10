const router = require("express").Router();
const ctrl = require("../controller/authController");
const { isAuth } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { limits } = require("../middleware/security");
const { googleLoginBody, refreshBody, emptyBody } = require("../validators/schemas");

router.post("/google", limits.auth, validate({ body: googleLoginBody }), ctrl.googleLogin);
router.post("/refresh", limits.refresh, validate({ body: refreshBody }), ctrl.refreshToken);
router.post("/logout", isAuth, validate({ body: emptyBody }), ctrl.logout);
router.get("/me", isAuth, ctrl.getMe);

module.exports = router;
