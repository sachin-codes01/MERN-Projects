const mongoose = require("mongoose");

// A contact-form submission. Stored server-side rather than only handed to
// WhatsApp because a deep link can PRE-FILL a chat but cannot send it — if
// the visitor closes WhatsApp without tapping send, this row is the only
// record that they tried to reach out at all.
const enquirySchema = new mongoose.Schema(
  {
    // Contact is login-gated, so there is always a real account behind an
    // enquiry — that's what makes the email trustworthy enough to lock the
    // field in the form.
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true, default: "" }, // optional by design

    // Copied from the logged-in account at submit time rather than taken
    // from the request body — the form renders it read-only, and trusting
    // the body would let a crafted request file an enquiry under someone
    // else's address.
    email: { type: String, required: true, lowercase: true, trim: true },

    // Stored as the bare 10 digits; the country code is implied (+91) since
    // validation only accepts Indian mobile numbers.
    phone: {
      type: String,
      required: true,
      validate: {
        validator: (v) => /^[6-9]\d{9}$/.test(v),
        message: "Enter a valid 10-digit Indian mobile number",
      },
    },

    subject: {
      type: String,
      enum: ["order", "product", "shipping", "returns", "wholesale", "feedback", "other", ""],
      default: "",
    },

    message: { type: String, required: true, trim: true, maxlength: 2000 },

    // Whether the visitor actually opened a chat channel after submitting.
    // Set by a follow-up call from the success screen, so you can tell a
    // "filled the form and vanished" apart from one that reached WhatsApp.
    openedChannel: {
      type: String,
      enum: ["whatsapp", "email", "instagram", "qr", ""],
      default: "",
    },

    status: {
      type: String,
      enum: ["new", "in_progress", "resolved"],
      default: "new",
    },
  },
  { timestamps: true }
);

enquirySchema.index({ createdAt: -1 });

module.exports = mongoose.model("Enquiry", enquirySchema);
