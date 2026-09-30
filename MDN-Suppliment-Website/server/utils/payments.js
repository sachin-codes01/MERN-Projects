const crypto = require("crypto");
const razorpay = require("../config/razorpay");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const User = require("../models/User");
const CheckoutSession = require("../models/CheckoutSession");

// Constant-time string compare for HMAC signatures, so the check itself
// can't leak how many leading characters were right.
const safeEqual = (a, b) => {
  const ba = Buffer.from(String(a || ""));
  const bb = Buffer.from(String(b || ""));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
};

const hmac = (secret, data) => crypto.createHmac("sha256", secret).update(data).digest("hex");

// Signature Razorpay Checkout hands the browser after a successful payment.
const isValidCheckoutSignature = (razorpayOrderId, paymentId, signature) =>
  safeEqual(hmac(process.env.RAZORPAY_KEY_SECRET, `${razorpayOrderId}|${paymentId}`), signature);

// Signature on webhook calls — computed over the RAW request body with the
// webhook secret set in the Razorpay dashboard (not the API key secret).
const isValidWebhookSignature = (rawBody, signature) =>
  !!process.env.RAZORPAY_WEBHOOK_SECRET &&
  safeEqual(hmac(process.env.RAZORPAY_WEBHOOK_SECRET, rawBody), signature);

const restock = async (items) => {
  for (const { product, sizeId, quantity } of items) {
    await Product.updateOne({ _id: product, "sizes._id": sizeId }, { $inc: { "sizes.$.stock": quantity } }).catch(
      () => {}
    );
  }
};

const isDuplicateAddress = (existing, a) =>
  existing.some(
    (x) =>
      (x.line1 || "").trim().toLowerCase() === (a.line1 || "").trim().toLowerCase() &&
      (x.pincode || "").trim() === (a.pincode || "").trim() &&
      (x.phone || "").trim() === (a.phone || "").trim()
  );

const saveAddressForUser = async (session) => {
  if (!session.saveAddress) return;
  const userDoc = await User.findById(session.user);
  if (!userDoc) return;
  const label = session.saveAddress.label || "Home";
  // Checked out with an existing saved address and edited it — update in
  // place rather than appending a near-duplicate.
  const existing = session.addressId ? userDoc.addresses.id(session.addressId) : null;
  if (existing) {
    Object.assign(existing, session.shippingAddress, { label: existing.label || label });
  } else if (!isDuplicateAddress(userDoc.addresses, session.shippingAddress)) {
    userDoc.addresses.push({ ...session.shippingAddress, label });
  } else {
    return;
  }
  await userDoc.save();
};

const newOrderNumber = () => "ORD" + Date.now() + Math.floor(Math.random() * 1000);

// Asks Razorpay itself — not the browser — whether this payment really
// belongs to this order and covers the full amount. Captures it if the
// account is set to manual capture and the payment is only authorized.
const confirmPaymentWithRazorpay = async (session, paymentId) => {
  let payment = await razorpay.payments.fetch(paymentId);

  if (payment.order_id !== session.razorpayOrderId) {
    throw new Error("Payment does not belong to this order");
  }
  if (Number(payment.amount) !== session.amount || payment.currency !== "INR") {
    throw new Error("Paid amount does not match the order total");
  }
  if (payment.status === "authorized") {
    payment = await razorpay.payments.capture(paymentId, session.amount, "INR");
  }
  if (payment.status !== "captured") {
    throw new Error(`Payment is not complete yet (status: ${payment.status})`);
  }
  return payment;
};

// Full refund of a payment. Returns the Razorpay refund object.
const refundPayment = (paymentId, amountPaise, reason) =>
  razorpay.payments.refund(paymentId, { amount: amountPaise, speed: "normal", notes: { reason } });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Turns a paid CheckoutSession into an Order — exactly once.
 *
 * Called from two places that can race each other: the browser right after
 * Checkout succeeds, and Razorpay's webhook (which also covers customers who
 * close the tab before the browser call is made). Whichever arrives first
 * takes the lock; the other waits for and returns the same result.
 *
 * Resolves to { order, refunded } — `refunded` is true when the payment
 * went through but an item had sold out, so the money was sent back.
 */
const finalizePayment = async (razorpayOrderId, paymentId) => {
  const existing = await CheckoutSession.findOne({ razorpayOrderId });
  if (!existing) throw Object.assign(new Error("Checkout session not found"), { status: 404 });

  // Take the lock. "failed" is allowed back in so a later webhook retry can
  // finish a session whose first attempt hit a transient error.
  const session = await CheckoutSession.findOneAndUpdate(
    { _id: existing._id, status: { $in: ["pending", "failed"] } },
    { $set: { status: "processing", paymentId } },
    { new: true }
  );

  if (!session) {
    // Someone else holds it or already finished — wait for their result.
    for (let i = 0; i < 20; i++) {
      const s = await CheckoutSession.findById(existing._id).populate("order");
      if (s.status === "completed" || s.status === "refunded") {
        return { order: s.order, refunded: s.status === "refunded" };
      }
      if (s.status !== "processing") break;
      await sleep(500);
    }
    throw new Error("Your payment is still being processed. It will appear in Your Orders shortly.");
  }

  const decremented = [];
  try {
    await confirmPaymentWithRazorpay(session, paymentId);

    // Reserve stock item by item. Checked again here (not just before
    // payment) because someone else may have bought the last unit while
    // this customer was on the payment screen.
    let soldOut = null;
    for (const item of session.items) {
      const ok = await Product.findOneAndUpdate(
        { _id: item.product, "sizes._id": item.sizeId, "sizes.stock": { $gte: item.quantity } },
        { $inc: { "sizes.$.stock": -item.quantity } }
      );
      if (!ok) {
        soldOut = item;
        break;
      }
      decremented.push(item);
    }

    if (soldOut) {
      await restock(decremented);
      decremented.length = 0;
      const reason = `${soldOut.name} went out of stock before the order could be placed`;
      const refund = await refundPayment(paymentId, session.amount, reason);
      // Kept as a cancelled order so the customer sees what happened and
      // that their money is on its way back.
      const order = await Order.create({
        orderNumber: newOrderNumber(),
        user: session.user,
        items: session.items,
        shippingAddress: session.shippingAddress,
        pricing: session.pricing,
        payment: {
          method: "online",
          status: "refunded",
          razorpayOrderId: session.razorpayOrderId,
          razorpayPaymentId: paymentId,
          refundId: refund.id,
          refundedAmount: rupees(session.amount),
          refundedAt: new Date(),
        },
        orderStatus: "cancelled",
        cancelReason: `${reason}. A full refund has been issued.`,
        statusHistory: [{ status: "cancelled", note: `${reason}. Refund ${refund.id} issued.` }],
      });
      session.status = "refunded";
      session.order = order._id;
      await session.save();
      return { order, refunded: true };
    }

    const order = await Order.create({
      orderNumber: newOrderNumber(),
      user: session.user,
      items: session.items,
      shippingAddress: session.shippingAddress,
      pricing: session.pricing,
      payment: {
        method: "online",
        status: "paid",
        razorpayOrderId: session.razorpayOrderId,
        razorpayPaymentId: paymentId,
      },
      statusHistory: [{ status: "placed", note: "Payment received via Razorpay" }],
    });

    session.status = "completed";
    session.order = order._id;
    session.lastError = undefined;
    await session.save();

    // Housekeeping after the order exists — a failure here must not undo it.
    await Cart.updateOne({ user: session.user }, { $set: { items: [], couponApplied: null } }).catch(() => {});
    await saveAddressForUser(session).catch(() => {});

    return { order, refunded: false };
  } catch (err) {
    await restock(decremented);
    // Duplicate order (the unique index fired) means another path already
    // created it — treat as done rather than failed.
    if (err.code === 11000) {
      const order = await Order.findOne({ "payment.razorpayOrderId": session.razorpayOrderId });
      if (order) {
        await CheckoutSession.updateOne({ _id: session._id }, { status: "completed", order: order._id });
        return { order, refunded: false };
      }
    }
    await CheckoutSession.updateOne({ _id: session._id }, { status: "failed", lastError: err.message });
    throw err;
  }
};

/**
 * Refunds a paid order in full and marks it refunded. No-op for orders that
 * were never paid or are already refunded. Throws if Razorpay rejects the
 * refund, so the caller can leave the order untouched.
 */
const refundOrder = async (order, reason) => {
  if (order.payment?.status !== "paid" || !order.payment.razorpayPaymentId) return null;
  const refund = await refundPayment(
    order.payment.razorpayPaymentId,
    Math.round(order.pricing.total * 100),
    reason || "Order cancelled"
  );
  order.payment.status = "refunded";
  order.payment.refundId = refund.id;
  order.payment.refundedAmount = order.pricing.total;
  order.payment.refundedAt = new Date();
  return refund;
};

const rupees = (paise) => Math.round(paise) / 100;

/**
 * Brings an order's refund state in line with Razorpay. Called from the
 * refund.created / refund.processed / refund.failed webhooks, which fire
 * for EVERY refund — including ones made by hand in the Razorpay
 * dashboard, which this app would otherwise never hear about.
 *
 * Reads the payment's `amount_refunded` straight from Razorpay rather than
 * adding up webhook amounts, so it is correct no matter how many times or
 * in what order the webhooks arrive (and a failed refund drops back out).
 * Returns the updated order, or null if the payment isn't one of ours.
 */
const syncRefundFromRazorpay = async (paymentId, refund, event) => {
  const order = await Order.findOne({ "payment.razorpayPaymentId": paymentId });
  if (!order) return null;

  const payment = await razorpay.payments.fetch(paymentId);
  const refundedPaise = Number(payment.amount_refunded || 0);
  const status =
    refundedPaise <= 0 ? "paid" : refundedPaise >= Number(payment.amount) ? "refunded" : "partially_refunded";
  const refundedAmount = rupees(refundedPaise);

  const unchanged = order.payment.status === status && Number(order.payment.refundedAmount || 0) === refundedAmount;
  if (unchanged && event !== "refund.failed") return order;

  order.payment.status = status;
  order.payment.refundedAmount = refundedAmount;
  if (refund?.id && event !== "refund.failed") order.payment.refundId = refund.id;
  if (refundedPaise > 0 && !order.payment.refundedAt) order.payment.refundedAt = new Date();
  if (refundedPaise <= 0) order.payment.refundedAt = undefined;

  const amount = refund?.amount ? `₹${rupees(refund.amount)}` : "The refund";
  const note =
    event === "refund.failed"
      ? `Refund ${refund?.id || ""} of ${amount} failed at Razorpay.`
      : status === "refunded"
      ? `Full refund of ₹${refundedAmount} issued via Razorpay${refund?.id ? ` (${refund.id})` : ""}.`
      : `Partial refund of ${amount} issued via Razorpay — ₹${refundedAmount} refunded so far.`;
  order.statusHistory.push({ status: order.orderStatus, note });

  await order.save();
  return order;
};

module.exports = {
  isValidCheckoutSignature,
  isValidWebhookSignature,
  finalizePayment,
  refundOrder,
  syncRefundFromRazorpay,
};
