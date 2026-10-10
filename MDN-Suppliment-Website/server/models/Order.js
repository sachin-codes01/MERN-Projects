const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  sizeId: { type: mongoose.Schema.Types.ObjectId },
  name: String,
  flavor: String,
  weight: String,
  image: String,
  price: { type: Number, min: 0 },
  quantity: { type: Number, min: 1 },
});

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true, maxlength: 100 },
    phone: { type: String, trim: true, maxlength: 15 },
    line1: { type: String, trim: true, maxlength: 300 },
    line2: { type: String, trim: true, maxlength: 300 },
    city: { type: String, trim: true, maxlength: 100 },
    state: { type: String, trim: true, maxlength: 100 },
    pincode: { type: String, trim: true, maxlength: 10 },
    country: { type: String, default: "India" },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: String,
    note: { type: String, maxlength: 1000 },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [orderItemSchema],
    shippingAddress: shippingAddressSchema,

    pricing: {
      subtotal: Number,
      discount: { type: Number, default: 0 },
      couponCode: { type: String, default: null },
      shippingFee: Number,
      tax: Number,
      total: Number,
    },

    // Filled in by utils/payments.js once Razorpay confirms the payment.
    // Refund fields are kept in sync with Razorpay — whether the refund was
    // made by this app (cancellation) or by hand in the Razorpay dashboard
    // (reported through the refund.* webhooks).
    payment: {
      method: { type: String, enum: ["online"], default: "online" },
      status: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded", "partially_refunded"],
        default: "pending",
      },
      razorpayOrderId: String,
      razorpayPaymentId: String,
      refundId: String, // latest refund
      refundedAmount: { type: Number, default: 0 }, // rupees, total refunded so far
      refundedAt: Date, // first refund
    },

    orderStatus: {
      type: String,
      enum: [
        "placed",
        "confirmed",
        "processing",
        "shipped",
        "out_for_delivery",
        "delivered",
        "cancelled",
        "returned",
      ],
      default: "placed",
    },

    trackingNumber: { type: String, trim: true, maxlength: 60 },
    courierPartner: { type: String, trim: true, maxlength: 60 },
    estimatedDelivery: Date,
    deliveredAt: Date,
    cancelReason: { type: String, trim: true, maxlength: 300 },

    statusHistory: [statusHistorySchema],
  },
  { timestamps: true }
);

// Last line of defence against one payment producing two orders — the
// CheckoutSession lock should already prevent it. Sparse, so orders
// without a Razorpay id are unaffected.
orderSchema.index({ "payment.razorpayOrderId": 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Order", orderSchema);