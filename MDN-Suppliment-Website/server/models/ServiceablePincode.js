const mongoose = require("mongoose");

// Jin pincodes pe delivery hoti hai — admin panel se manually add hote hain.
// Checkout pe customer ka pincode yahan na mile to "shipping not available";
// payment order banane wala route bhi isi list se check karta hai.
const serviceablePincodeSchema = new mongoose.Schema(
  {
    pincode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/^[1-9]\d{5}$/, "Enter a valid 6-digit pincode"],
    },
    // Admin ki suvidha ke liye — kis area ka pincode hai (optional)
    area: { type: String, trim: true, maxlength: 80, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ServiceablePincode", serviceablePincodeSchema);
