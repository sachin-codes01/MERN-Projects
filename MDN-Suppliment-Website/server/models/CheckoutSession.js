const mongoose = require("mongoose");

// One row per Razorpay order. Created BEFORE the customer pays, it freezes
// exactly what they are paying for — items, prices, coupon, address and the
// amount in paise — so the order that gets created afterwards is built from
// this snapshot, never from whatever the cart happens to contain by then.
//
// It is also the lock that makes order creation happen exactly once: both
// the browser's verify call and Razorpay's webhook go through
// utils/payments.js finalizePayment(), which atomically flips `status`
// from "pending" to "processing" before doing any work.
const sessionItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    sizeId: { type: mongoose.Schema.Types.ObjectId },
    flavorId: { type: mongoose.Schema.Types.ObjectId, default: null },
    name: String,
    flavor: String,
    weight: String,
    image: String,
    price: Number,
    quantity: Number,
  },
  { _id: false }
);

const checkoutSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    razorpayOrderId: { type: String, required: true, unique: true },
    amount: { type: Number, required: true }, // paise — what Razorpay must have received
    items: [sessionItemSchema],
    pricing: {
      subtotal: Number,
      discount: Number,
      couponCode: String,
      shippingFee: Number,
      tax: Number,
      total: Number,
    },
    shippingAddress: { type: Object, required: true },
    saveAddress: { type: Object, default: null }, // { label } or null
    addressId: { type: String, default: null },

    // pending    — created, waiting for payment
    // processing — a finalize call holds the lock right now
    // completed  — order created (see `order`)
    // refunded   — paid, but could not be fulfilled; money returned
    // failed     — finalize hit an unexpected error; a retry (webhook) may run again
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "refunded", "failed"],
      default: "pending",
    },
    paymentId: String,
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    lastError: String,
  },
  { timestamps: true }
);

// Sessions are only needed around checkout time; the Order keeps the
// permanent record. Mongo deletes them automatically after 30 days.
checkoutSessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

module.exports = mongoose.model("CheckoutSession", checkoutSessionSchema);
