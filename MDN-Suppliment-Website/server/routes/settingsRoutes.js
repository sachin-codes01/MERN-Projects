const router = require("express").Router();
const SiteSettings = require("../models/SiteSettings");

// Public — the storefront reads site-wide settings on every page load, so
// this can't sit behind admin auth.
router.get("/", async (req, res) => {
  const settings = await SiteSettings.getSingleton();
  res.json({ success: true, data: settings });
});

module.exports = router;
