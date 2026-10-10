const router = require("express").Router();
const validate = require("../middleware/validate");
const ServiceablePincode = require("../models/ServiceablePincode");
const { pincodeParam } = require("../validators/schemas");

// Public — checkout pe customer ke pincode pe delivery hai ya nahi.
// GET /api/pincodes/check/110001 → { available: true, area }
router.get("/check/:pincode", validate({ params: pincodeParam }), async (req, res) => {
  const found = await ServiceablePincode.findOne({ pincode: req.params.pincode }).select("area").lean();
  res.json({ success: true, data: { pincode: req.params.pincode, available: !!found, area: found?.area || "" } });
});

module.exports = router;
