// Customer ko jaane wale saare notification emails. Har function background
// me bhejta hai (sendInBackground) — email fail ho jaye to bhi login/order
// ka kaam nahi rukta, galti sirf server log me.

const User = require("../models/User");
const { sendMail, sendInBackground, esc, button, infoBox, paragraph, C, SITE_URL } = require("./mailer");
const { buildReceiptPdf } = require("./receiptPdf");

const rupee = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const firstName = (name = "") => esc(String(name).trim().split(/\s+/)[0] || "there");
const istTime = (d = new Date()) =>
  new Date(d).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });
const istDate = (d) => new Date(d).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium" });

// Order ka email kahan bheje: checkout pe diya (verified) email, warna account email
const orderRecipient = async (order) => {
  if (order.shippingAddress?.email) return order.shippingAddress.email;
  const user = await User.findById(order.user).select("email").lean();
  return user?.email;
};

/* ---------- Order ke chhote hisse ---------- */

const itemsTable = (order) => {
  const rows = order.items
    .map(
      (i) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid ${C.border};font-size:13.5px;color:${C.ink};text-align:left">
          <strong>${esc(i.name)}</strong>${i.flavor ? ` <span style="color:${C.muted}">(${esc(i.flavor)})</span>` : ""}
          <div style="font-size:12px;color:${C.muted}">${esc(i.weight || "")} × ${i.quantity}</div>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid ${C.border};font-size:13.5px;color:${C.ink};text-align:right;white-space:nowrap">${rupee(i.price * i.quantity)}</td>
      </tr>`
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px">${rows}</table>`;
};

const totalsTable = (order) => {
  const p = order.pricing || {};
  const line = (label, value, strong = false) => `<tr>
    <td style="padding:4px 0;font-size:${strong ? 15 : 13}px;color:${strong ? C.ink : C.muted};text-align:left${strong ? ";font-weight:700" : ""}">${label}</td>
    <td style="padding:4px 0;font-size:${strong ? 17 : 13}px;color:${C.ink};text-align:right${strong ? ";font-weight:700" : ""}">${value}</td>
  </tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px">
    ${line("Subtotal", rupee(p.subtotal))}
    ${p.discount > 0 ? line(`Discount${p.couponCode ? ` (${esc(p.couponCode)})` : ""}`, `-${rupee(p.discount)}`) : ""}
    ${line("Shipping", p.shippingFee > 0 ? rupee(p.shippingFee) : "FREE")}
    ${line("GST (included)", rupee(p.tax))}
    <tr><td colspan="2" style="border-top:1px solid ${C.border};padding-top:6px"></td></tr>
    ${line(order.payment?.status === "paid" ? "Total paid" : "Order total", rupee(p.total), true)}
  </table>`;
};

const addressBlock = (a = {}) =>
  infoBox(`<strong style="color:${C.ink}">Delivering to</strong><br>
    ${esc(a.fullName)} · ${esc(a.phone)}<br>
    ${esc([a.line1, a.line2].filter(Boolean).join(", "))}<br>
    ${esc([a.city, a.district, a.state].filter(Boolean).join(", "))} – ${esc(a.pincode)}`);

const orderHeader = (order) =>
  `<div style="display:inline-block;margin-bottom:6px;padding:6px 14px;border-radius:999px;background:${C.cream};border:1px solid ${C.border};font-size:12.5px;color:${C.ink}">
    Order <strong>#${esc(order.orderNumber)}</strong> · ${istDate(order.createdAt || Date.now())}
  </div>`;

/* ---------- Account ---------- */

// Pehli baar Google se sign-in
const sendWelcomeEmail = (user) =>
  sendInBackground("welcome", () =>
    sendMail({
      to: user.email,
      subject: "Welcome to MDN – My Daily Nutrition",
      text: `Hi ${user.name}, welcome to MDN! Your account is ready. Shop: ${SITE_URL}`,
      preheader: "Your MDN account is ready.",
      eyebrow: "WELCOME",
      title: `Welcome to MDN, ${firstName(user.name)}!`,
      body: `${paragraph("Your account is ready. Clean, lab-tested supplements — whey, creatine, pre-workout and more — delivered to your door.")}
        ${button(SITE_URL + "/products", "Start shopping")}
        ${infoBox("✔ Lab tested every batch &nbsp;·&nbsp; 🚚 Same-day dispatch &nbsp;·&nbsp; 🔒 Secure payments")}`,
    })
  );

// Har baad wale sign-in pe — security alert
const sendLoginAlertEmail = (user, { userAgent = "" } = {}) => {
  const device = describeDevice(userAgent);
  return sendInBackground("login alert", () =>
    sendMail({
      to: user.email,
      subject: "New sign-in to your MDN account",
      text: `New sign-in to your MDN account on ${istTime()} (${device}). If this wasn't you, contact support: ${SITE_URL}/support`,
      preheader: `Signed in on ${istTime()}`,
      eyebrow: "SECURITY ALERT",
      title: "New sign-in to your account",
      body: `${paragraph(`Hi ${firstName(user.name)}, your MDN account was just signed in with Google.`)}
        ${infoBox(`<strong style="color:${C.ink}">When:</strong> ${istTime()} (IST)<br><strong style="color:${C.ink}">Device:</strong> ${esc(device)}`)}
        ${paragraph("<br>If this was you, there's nothing to do. If you don't recognise it, sign out of your Google account on other devices and contact us.")}
        ${button(SITE_URL + "/support", "Contact support")}`,
    })
  );
};

// User-agent se "Chrome on Windows" jaisa
const describeDevice = (ua = "") => {
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "a browser";
  const os = /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iPhone/iPad" : /Windows/.test(ua) ? "Windows" : /Mac OS X/.test(ua) ? "Mac" : /Linux/.test(ua) ? "Linux" : "an unknown device";
  return `${browser} on ${os}`;
};

/* ---------- Orders ---------- */

// Payment ke baad — PDF invoice attach
const sendOrderPlacedEmail = (order) =>
  sendInBackground("order placed", async () => {
    const to = await orderRecipient(order);
    const pdf = await buildReceiptPdf(order).catch((err) => {
      console.error("[email] receipt PDF failed:", err.message);
      return null;
    });
    await sendMail({
      to,
      subject: `Order confirmed – #${order.orderNumber}`,
      text: `Thanks for your order #${order.orderNumber}. Total paid ${rupee(order.pricing?.total)}. Track it: ${SITE_URL}/orders`,
      preheader: `We've received your order #${order.orderNumber}. Your receipt is attached.`,
      eyebrow: "ORDER CONFIRMED",
      title: `Thank you, ${firstName(order.shippingAddress?.fullName)}! 🎉`,
      body: `${orderHeader(order)}
        ${paragraph("We've received your payment and your order is being prepared. Your receipt is attached to this email as a PDF.")}
        ${itemsTable(order)}
        ${totalsTable(order)}
        ${addressBlock(order.shippingAddress)}
        ${button(SITE_URL + "/orders", "Track your order")}`,
      attachments: pdf ? [{ filename: `MDN-Invoice-${order.orderNumber}.pdf`, content: pdf, contentType: "application/pdf" }] : [],
    });
  });

// Admin ne status badla
const STATUS_COPY = {
  confirmed: { eyebrow: "ORDER CONFIRMED", title: "Your order is confirmed", text: "We've confirmed your order and are getting it ready." },
  processing: { eyebrow: "BEING PACKED", title: "Your order is being packed", text: "Our team is packing your order right now." },
  shipped: { eyebrow: "SHIPPED", title: "Your order is on its way 🚚", text: "Your order has left our warehouse." },
  out_for_delivery: { eyebrow: "OUT FOR DELIVERY", title: "Arriving today", text: "Your order is out for delivery — keep your phone handy." },
  delivered: { eyebrow: "DELIVERED", title: "Your order was delivered ✅", text: "We hope you love it! Tell other customers what you think by leaving a review." },
  returned: { eyebrow: "RETURNED", title: "Your return is complete", text: "We've received your returned order. Any refund due will be processed shortly." },
};

const sendOrderStatusEmail = (order) => {
  const copy = STATUS_COPY[order.orderStatus];
  if (!copy) return;
  return sendInBackground(`order ${order.orderStatus}`, async () => {
    const details = [];
    if (order.estimatedDelivery && !["delivered", "returned"].includes(order.orderStatus)) {
      details.push(`<strong style="color:${C.ink}">Expected delivery:</strong> ${istDate(order.estimatedDelivery)}`);
    }
    if (order.courierPartner) details.push(`<strong style="color:${C.ink}">Courier:</strong> ${esc(order.courierPartner)}`);
    if (order.trackingNumber) details.push(`<strong style="color:${C.ink}">Tracking number:</strong> ${esc(order.trackingNumber)}`);
    if (order.orderStatus === "delivered" && order.deliveredAt) {
      details.push(`<strong style="color:${C.ink}">Delivered on:</strong> ${istDate(order.deliveredAt)}`);
    }
    await sendMail({
      to: await orderRecipient(order),
      subject: `${copy.title.replace(/[^\w\s'’-]/g, "").trim()} – #${order.orderNumber}`,
      text: `${copy.text} Order #${order.orderNumber}. ${SITE_URL}/orders`,
      preheader: `${copy.text} Order #${order.orderNumber}.`,
      eyebrow: copy.eyebrow,
      title: copy.title,
      body: `${orderHeader(order)}
        ${paragraph(copy.text)}
        ${details.length ? infoBox(details.join("<br>")) : ""}
        ${itemsTable(order)}
        ${button(SITE_URL + "/orders", order.orderStatus === "delivered" ? "Leave a review" : "Track your order")}`,
    });
  });
};

// Cancel (customer / admin / stock khatam) — refund ki jaankari ke saath
const sendOrderCancelledEmail = (order, { refunded = false, byCustomer = false } = {}) =>
  sendInBackground("order cancelled", async () => {
    const refundText = refunded
      ? `A full refund of <strong style="color:${C.ink}">${rupee(order.payment?.refundedAmount || order.pricing?.total)}</strong> has been started to your original payment method. It usually reaches your account in 5–7 working days.`
      : "No payment was taken for this order.";
    await sendMail({
      to: await orderRecipient(order),
      subject: `Order cancelled – #${order.orderNumber}`,
      text: `Your order #${order.orderNumber} was cancelled. ${refunded ? "A full refund has been started (5-7 working days)." : ""}`,
      preheader: `Order #${order.orderNumber} has been cancelled.`,
      eyebrow: "ORDER CANCELLED",
      title: byCustomer ? "Your order has been cancelled" : "We've had to cancel your order",
      body: `${orderHeader(order)}
        ${paragraph(byCustomer ? "As requested, we've cancelled your order." : "We're sorry — we couldn't complete this order.")}
        ${order.cancelReason ? infoBox(`<strong style="color:${C.ink}">Reason:</strong> ${esc(order.cancelReason)}`) : ""}
        ${infoBox(`💸 ${refundText}`)}
        ${itemsTable(order)}
        ${button(SITE_URL + "/products", "Continue shopping")}`,
    });
  });

// Razorpay dashboard se kiya refund pura hua
const sendRefundProcessedEmail = (order, amount) =>
  sendInBackground("refund processed", async () =>
    sendMail({
      to: await orderRecipient(order),
      subject: `Refund processed – #${order.orderNumber}`,
      text: `A refund of ${rupee(amount)} for order #${order.orderNumber} has been processed.`,
      preheader: `${rupee(amount)} is on its way back to you.`,
      eyebrow: "REFUND PROCESSED",
      title: "Your refund is on its way",
      body: `${orderHeader(order)}
        ${paragraph(`We've refunded <strong style="color:${C.ink}">${rupee(amount)}</strong> to your original payment method. Depending on your bank it can take 5–7 working days to show up.`)}
        ${button(SITE_URL + "/orders", "View your orders")}`,
    })
  );

/* ---------- Contact form ---------- */

const sendEnquiryReceivedEmail = (enquiry) =>
  sendInBackground("enquiry received", () =>
    sendMail({
      to: enquiry.email,
      subject: "We've received your message – MDN support",
      text: `Hi ${enquiry.firstName}, thanks for contacting MDN. We usually reply within 24 hours on working days.`,
      preheader: "We usually reply within 24 hours on working days.",
      eyebrow: "CUSTOMER SUPPORT",
      title: `Thanks, ${firstName(enquiry.firstName)} — we've got your message`,
      body: `${paragraph("Our team usually replies within 24 hours on working days (Mon–Sat, 10 AM – 7 PM IST).")}
        ${infoBox(`<strong style="color:${C.ink}">Your message</strong><br>${esc(enquiry.message).replace(/\n/g, "<br>")}`)}
        ${paragraph("<br>Need a faster answer? Message us on WhatsApp from the support page.")}
        ${button(SITE_URL + "/support", "Open support")}`,
    })
  );

module.exports = {
  sendWelcomeEmail,
  sendLoginAlertEmail,
  sendOrderPlacedEmail,
  sendOrderStatusEmail,
  sendOrderCancelledEmail,
  sendRefundProcessedEmail,
  sendEnquiryReceivedEmail,
};
