const router = require("express").Router();
const { isAuth } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { limits } = require("../middleware/security");
const ctrl = require("../controller/enquiryController");
const { idParam, enquiryBody, enquiryChannelBody } = require("../validators/schemas");

// Contact is login-gated end to end: the client hides the form behind
// ProtectedRoute, and isAuth here is what actually enforces it.
router.post("/", isAuth, limits.contact, validate({ body: enquiryBody }), ctrl.createEnquiry);
router.put(
  "/:id/channel",
  isAuth,
  validate({ params: idParam("id", "Enquiry"), body: enquiryChannelBody }),
  ctrl.markChannelOpened
);

module.exports = router;
