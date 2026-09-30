const mongoose = require("mongoose");

// Admin-added flavour swatches, reused across products in the admin form so
// a flavour photo is uploaded once instead of once per product. The six
// stock swatches live in client/public/flavours and are NOT stored here.
//
// Products copy the image URL into their own flavours when saved, so
// deleting a preset only removes it from the picker — existing products
// keep showing their photo.
const flavorPresetSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    image: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FlavorPreset", flavorPresetSchema);
