const router = require("express").Router();
const { isAuth } = require("../middleware/auth");
const ctrl = require("../controller/enquiryController");

// Contact is login-gated end to end: the client hides the form behind
// ProtectedRoute, and isAuth here is what actually enforces it.
router.post("/", isAuth, ctrl.createEnquiry);
router.put("/:id/channel", isAuth, ctrl.markChannelOpened);

module.exports = router;
