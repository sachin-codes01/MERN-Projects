const router = require("express").Router();
const SiteSettings = require("../models/SiteSettings");

// Public — every visitor's Navbar/Footer needs this to decide whether to
// mount the SplashCursor WebGL effect, so it can't sit behind admin auth.
router.get("/", async (req, res) => {
  const settings = await SiteSettings.getSingleton();
  res.json({ success: true, data: settings });
});

module.exports = router;
