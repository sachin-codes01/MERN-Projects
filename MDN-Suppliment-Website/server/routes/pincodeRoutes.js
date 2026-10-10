const router = require("express").Router();
const validate = require("../middleware/validate");
const { limits } = require("../middleware/security");
const ServiceablePincode = require("../models/ServiceablePincode");
const { pincodeParam } = require("../validators/schemas");
const { lookupPincode } = require("../utils/pincodeLookup");

// Public — address form me pincode daalte hi:
//   available: admin ki delivery list me hai ya nahi
//   city/district/state: auto-fill ke liye (India Post se; na mile to "")
// GET /api/pincodes/check/110001 → { available, area, city, district, state }
router.get("/check/:pincode", limits.pincode, validate({ params: pincodeParam }), async (req, res) => {
  const { pincode } = req.params;
  const [found, place] = await Promise.all([
    ServiceablePincode.findOne({ pincode }).select("area").lean(),
    lookupPincode(pincode),
  ]);
  res.json({
    success: true,
    data: {
      pincode,
      available: !!found,
      area: found?.area || "",
      city: place?.city || "",
      district: place?.district || "",
      state: place?.state || "",
    },
  });
});

module.exports = router;
