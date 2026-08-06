const mongoose = require("mongoose");

// Singleton document — always looked up/created with a fixed _id so there's
// only ever one settings row, no per-admin or per-tenant duplication.
const SETTINGS_ID = "site_settings";

const siteSettingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: SETTINGS_ID },
  },
  { timestamps: true }
);

siteSettingsSchema.statics.getSingleton = async function () {
  let doc = await this.findById(SETTINGS_ID);
  if (!doc) doc = await this.create({ _id: SETTINGS_ID });
  return doc;
};

module.exports = mongoose.model("SiteSettings", siteSettingsSchema);
