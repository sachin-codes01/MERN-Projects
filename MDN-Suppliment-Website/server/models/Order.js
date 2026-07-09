const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  variantId: { type: mongoose.Schema.Types.ObjectId },
  name: String,
  flavor: String,
  weight: String,
  image: String,
  price: Number,
  quantity: Number,
});

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: String,
    phone: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: "India" },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: String,
    note: String,
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

    payment: {
      method: { type: String, enum: ["cod", "online"], default: "cod" },
      status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
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

    trackingNumber: String,
    courierPartner: String,
    estimatedDelivery: Date,
    deliveredAt: Date,
    cancelReason: String,

    statusHistory: [statusHistorySchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);