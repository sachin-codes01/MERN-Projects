// Customer ko jaane wale saare notification emails. Har function background
// me bhejta hai (sendInBackground) — email fail ho jaye to bhi login/order
// ka kaam nahi rukta, galti sirf server log me.
//
// Copy saadi aur insaani rakhi hai — "Hi Sachin," se shuru, koi emoji nahi.

const User = require("../models/User");
const {
  sendMail,
  sendInBackground,
  esc,
  rupee,
  paragraph,
  heading,
  button,
  box,
  detailRows,
  itemList,
  imageUrl,
  summary,
  C,
  SITE_URL,
} = require("./mailer");
const { unsubscribeUrl } = require("./productUpdates");
const { buildReceiptPdf } = require("./receiptPdf");

// "sachin kumar" → "Sachin Kumar" (log naam chhote akshar me bhi likhte hain)
const titleName = (name = "") =>
  String(name)
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
const firstName = (name = "") => esc(titleName(name).split(" ")[0] || "there");
const hi = (name) => paragraph(`Hi ${firstName(name)},`);

const istTime = (d = new Date()) =>
  new Date(d).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });
const istDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });

// Order ka email kahan bheje: checkout pe diya (verified) email, warna account email
const orderRecipient = async (order) => {
  if (order.shippingAddress?.email) return order.shippingAddress.email;
  const user = await User.findById(order.user).select("email").lean();
  return user?.email;
};

const orderInfo = (order, extra = []) =>
  box(detailRows([["Order number", `<strong>${esc(order.orderNumber)}</strong>`], ["Order date", istDate(order.createdAt || Date.now())], ...extra]));

const shippingAddress = (a = {}) =>
  `${heading("Shipping address")}
   <p style="margin:0;font-size:14px;line-height:1.6;color:${C.body}">
     ${esc(titleName(a.fullName))}<br>
     ${esc([a.line1, a.line2].filter(Boolean).join(", "))}<br>
     ${esc([a.city, a.district, a.state].filter(Boolean).join(", "))} ${esc(a.pincode)}<br>
     Phone: ${esc(a.phone)}
   </p>`;

const ORDER_FOOTER = "You're receiving this email because you placed an order on the MDN website.";
const ACCOUNT_FOOTER = "You're receiving this email about your MDN account.";

/* ================= Account ================= */

// Pehli baar Google se sign-in
const sendWelcomeEmail = (user) =>
  sendInBackground("welcome", () =>
    sendMail({
      to: user.email,
      subject: "Welcome to MDN",
      text: `Hi ${firstName(user.name)}, thanks for creating an MDN account. Start shopping: ${SITE_URL}/products`,
      preheader: "Thanks for creating your account.",
      title: "Welcome to MDN",
      footerNote: ACCOUNT_FOOTER,
      body: `${hi(user.name)}
        ${paragraph("Thanks for creating an account with MDN – My Daily Nutrition. You can now check out faster, track your orders and save your addresses.")}
        ${paragraph("Every MDN product is lab tested, and orders placed before 1 PM ship the same day.")}
        ${button(SITE_URL + "/products", "Browse products")}`,
    })
  );

// User-agent se "Chrome on Windows" jaisa
const describeDevice = (ua = "") => {
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /Chrome\//.test(ua)
        ? "Chrome"
        : /Firefox\//.test(ua)
          ? "Firefox"
          : /Safari\//.test(ua)
            ? "Safari"
            : "a browser";
  const os = /Android/.test(ua)
    ? "Android"
    : /iPhone|iPad/.test(ua)
      ? "iPhone/iPad"
      : /Windows/.test(ua)
        ? "Windows"
        : /Mac OS X/.test(ua)
          ? "Mac"
          : /Linux/.test(ua)
            ? "Linux"
            : "an unknown device";
  return `${browser} on ${os}`;
};

// Har baad wale sign-in pe — security alert
const sendLoginAlertEmail = (user, { userAgent = "" } = {}) => {
  const device = describeDevice(userAgent);
  const when = istTime();
  return sendInBackground("login alert", () =>
    sendMail({
      to: user.email,
      subject: "New sign-in to your MDN account",
      text: `Hi ${firstName(user.name)}, your MDN account was signed in on ${when} IST (${device}). If this wasn't you, contact support: ${SITE_URL}/support`,
      preheader: `${device}, ${when} IST`,
      title: "New sign-in to your account",
      footerNote: ACCOUNT_FOOTER,
      body: `${hi(user.name)}
        ${paragraph("Your MDN account was just signed in with Google.")}
        ${box(detailRows([["Device", esc(device)], ["Time", `${when} IST`]]))}
        ${paragraph("<br>If this was you, you don't need to do anything. If you don't recognise this sign-in, please contact us.")}
        ${button(SITE_URL + "/support", "Contact support")}`,
    })
  );
};

/* ================= Orders ================= */

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
      subject: `Your MDN order ${order.orderNumber} is confirmed`,
      text: `Thanks for your order ${order.orderNumber}. Total paid ${rupee(order.pricing?.total)}. Track it: ${SITE_URL}/orders`,
      preheader: `Thanks for your order. Total paid ${rupee(order.pricing?.total)}.`,
      title: "Thanks for your order",
      footerNote: ORDER_FOOTER,
      body: `${hi(order.shippingAddress?.fullName)}
        ${paragraph(`We've received your payment and your order is being prepared. We'll email you again when it ships.${pdf ? " Your invoice is attached to this email." : ""}`)}
        ${orderInfo(order, [["Payment", "Paid online"]])}
        ${heading("Items in this order")}
        ${itemList(order.items)}
        ${summary(order.pricing, { paid: true })}
        ${shippingAddress(order.shippingAddress)}
        ${button(SITE_URL + "/orders", "View order")}`,
      attachments: pdf ? [{ filename: `MDN-Invoice-${order.orderNumber}.pdf`, content: pdf, contentType: "application/pdf" }] : [],
    });
  });

// Admin ne status badla
const STATUS_COPY = {
  confirmed: { subject: "has been confirmed", title: "Your order is confirmed", text: "We've confirmed your order and are getting it ready to ship." },
  processing: { subject: "is being packed", title: "Your order is being packed", text: "We're packing your order now. We'll email you as soon as it ships." },
  shipped: { subject: "has shipped", title: "Your order has shipped", text: "Good news — your order is on its way." },
  out_for_delivery: { subject: "is out for delivery", title: "Your order is out for delivery", text: "Your order will reach you today. Please keep your phone nearby in case the courier calls." },
  delivered: { subject: "has been delivered", title: "Your order has been delivered", text: "Your order has been delivered. We hope you enjoy it — if you have a minute, a review helps other customers a lot." },
  returned: { subject: "return is complete", title: "We've received your return", text: "Your returned order has reached us. Any refund due will be processed shortly." },
};

const sendOrderStatusEmail = (order) => {
  const copy = STATUS_COPY[order.orderStatus];
  if (!copy) return;
  return sendInBackground(`order ${order.orderStatus}`, async () => {
    const extra = [];
    if (order.estimatedDelivery && !["delivered", "returned"].includes(order.orderStatus)) {
      extra.push(["Expected delivery", istDate(order.estimatedDelivery)]);
    }
    if (order.courierPartner) extra.push(["Courier", esc(order.courierPartner)]);
    if (order.trackingNumber) extra.push(["Tracking number", `<strong>${esc(order.trackingNumber)}</strong>`]);
    if (order.orderStatus === "delivered" && order.deliveredAt) extra.push(["Delivered on", istDate(order.deliveredAt)]);

    await sendMail({
      to: await orderRecipient(order),
      subject: `Your MDN order ${order.orderNumber} ${copy.subject}`,
      text: `${copy.text} Order ${order.orderNumber}. ${SITE_URL}/orders`,
      preheader: copy.text,
      title: copy.title,
      footerNote: ORDER_FOOTER,
      body: `${hi(order.shippingAddress?.fullName)}
        ${paragraph(copy.text)}
        ${orderInfo(order, extra)}
        ${heading("Items in this order")}
        ${itemList(order.items)}
        ${button(SITE_URL + "/orders", order.orderStatus === "delivered" ? "Write a review" : "Track order")}`,
    });
  });
};

// Cancel (customer / admin / stock khatam) — refund ki jaankari ke saath
const sendOrderCancelledEmail = (order, { refunded = false, byCustomer = false } = {}) =>
  sendInBackground("order cancelled", async () => {
    const amount = rupee(order.payment?.refundedAmount || order.pricing?.total);
    const refundLine = refunded
      ? `We've started a full refund of <strong>${amount}</strong> to your original payment method. It usually takes 5–7 working days to reach your account.`
      : "No payment was taken for this order.";
    await sendMail({
      to: await orderRecipient(order),
      subject: `Your MDN order ${order.orderNumber} has been cancelled`,
      text: `Your order ${order.orderNumber} has been cancelled. ${refunded ? `A full refund of ${amount} has been started (5-7 working days).` : ""}`,
      preheader: refunded ? `Your refund of ${amount} has been started.` : "Your order has been cancelled.",
      title: "Your order has been cancelled",
      footerNote: ORDER_FOOTER,
      body: `${hi(order.shippingAddress?.fullName)}
        ${paragraph(byCustomer ? "As requested, we've cancelled your order." : "We're sorry, but we've had to cancel your order.")}
        ${paragraph(refundLine)}
        ${orderInfo(order, order.cancelReason ? [["Reason", esc(order.cancelReason)]] : [])}
        ${heading("Cancelled items")}
        ${itemList(order.items)}
        ${button(SITE_URL + "/products", "Continue shopping")}`,
    });
  });

// Razorpay dashboard se kiya refund pura hua
const sendRefundProcessedEmail = (order, amount) =>
  sendInBackground("refund processed", async () =>
    sendMail({
      to: await orderRecipient(order),
      subject: `Refund of ${rupee(amount)} processed for order ${order.orderNumber}`,
      text: `A refund of ${rupee(amount)} for order ${order.orderNumber} has been processed.`,
      preheader: `${rupee(amount)} has been refunded to your original payment method.`,
      title: "Your refund has been processed",
      footerNote: ORDER_FOOTER,
      body: `${hi(order.shippingAddress?.fullName)}
        ${paragraph(`We've refunded <strong>${rupee(amount)}</strong> to your original payment method. Depending on your bank, it can take 5–7 working days to show in your account.`)}
        ${orderInfo(order, [["Refund amount", rupee(amount)]])}
        ${button(SITE_URL + "/orders", "View your orders")}`,
    })
  );

/* ================= Contact form ================= */

const sendEnquiryReceivedEmail = (enquiry) =>
  sendInBackground("enquiry received", () =>
    sendMail({
      to: enquiry.email,
      subject: "We've received your message",
      text: `Hi ${firstName(enquiry.firstName)}, thanks for contacting MDN. We usually reply within 24 hours on working days.`,
      preheader: "We usually reply within 24 hours on working days.",
      title: "We've received your message",
      footerNote: "You're receiving this email because you contacted MDN support.",
      body: `${hi(enquiry.firstName)}
        ${paragraph("Thanks for getting in touch. Our team usually replies within 24 hours on working days (Monday to Saturday, 10 AM – 7 PM IST).")}
        ${heading("Your message")}
        <p style="margin:0;font-size:14px;line-height:1.6;color:${C.body};font-style:italic">"${esc(enquiry.message).replace(/\n/g, "<br>")}"</p>
        ${paragraph("<br>For a quicker reply, you can also message us on WhatsApp from the support page.")}
        ${button(SITE_URL + "/support", "Go to Customer Support")}`,
    })
  );

/* ================= Naya product ================= */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Admin ne naya product add kiya → sab customers ko (jinhone unsubscribe nahi
// kiya). Ek-ek karke, beech me thoda ruk ke — Gmail ek saath bahut saare
// emails pe account rok deta hai (limit ~500/din).
const sendNewProductEmails = (product) =>
  sendInBackground("new product", async () => {
    const users = await User.find({ isBlocked: { $ne: true }, productEmails: { $ne: false } })
      .select("name email")
      .lean();
    const size = product.sizes?.[0];
    const price = size ? size.discountPrice || size.price : null;
    const mrp = size?.discountPrice && size.discountPrice < size.price ? size.price : null;
    const img = imageUrl(product.thumbnail || product.images?.[0]);
    const link = `${SITE_URL}/products/${product.slug}`;

    let sent = 0;
    for (const u of users) {
      try {
        await sendMail({
          to: u.email,
          subject: `New at MDN: ${product.name}`,
          text: `Hi ${firstName(u.name)}, we've just added ${product.name}${price ? ` (from ${rupee(price)})` : ""}. Take a look: ${link}`,
          preheader: product.shortDescription || `${product.name} is now available.`,
          title: `New: ${esc(product.name)}`,
          unsubscribeUrl: unsubscribeUrl(u._id),
          footerNote: "You're receiving this because you have an account on the MDN website.",
          body: `${hi(u.name)}
            ${paragraph(`We've just added a new product to the MDN range${product.brand ? ` from ${esc(product.brand)}` : ""}.`)}
            ${img ? `<a href="${link}"><img src="${img}" width="240" alt="${esc(product.name)}" style="display:block;width:240px;max-width:100%;height:auto;margin:18px 0;border:1px solid ${C.border};border-radius:6px"></a>` : ""}
            <p style="margin:0 0 6px;font-size:18px;font-weight:bold;color:${C.ink}">${esc(product.name)}</p>
            ${product.shortDescription ? paragraph(esc(product.shortDescription)) : ""}
            ${
              price
                ? `<p style="margin:0;font-size:15px;color:${C.ink}">From <strong>${rupee(price)}</strong>${
                    mrp ? ` <span style="color:${C.muted};text-decoration:line-through">${rupee(mrp)}</span>` : ""
                  }${size?.weight ? ` <span style="color:${C.muted}">(${esc(size.weight)})</span>` : ""}</p>`
                : ""
            }
            ${button(link, "View product")}`,
        });
        sent += 1;
      } catch (err) {
        console.error(`[email] new product → ${u.email} failed:`, err.message);
      }
      await sleep(1500);
    }
    console.log(`[email] new product "${product.name}" sent to ${sent}/${users.length} customers`);
  });

/* ================= Cart reminder ================= */

// Cart me items pade hain, 24 ghante se order nahi hua
const sendCartReminderEmail = (user, items) =>
  sendInBackground("cart reminder", () => {
    const total = items.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0);
    const one = items.length === 1;
    return sendMail({
      to: user.email,
      subject: one ? `${items[0].name} is still in your cart` : "You left a few things in your cart",
      text: `Hi ${firstName(user.name)}, you still have ${items.length} item${one ? "" : "s"} in your MDN cart. Complete your order: ${SITE_URL}/cart`,
      preheader: "Your cart is saved — complete your order whenever you're ready.",
      title: one ? "Still thinking about it?" : "You left something in your cart",
      unsubscribeUrl: unsubscribeUrl(user._id),
      footerNote: "You're receiving this because you added items to your cart on the MDN website.",
      body: `${hi(user.name)}
        ${paragraph(`You added ${one ? "this item" : "these items"} to your cart but haven't checked out yet. We've saved ${one ? "it" : "them"} for you.`)}
        ${itemList(items)}
        <p style="margin:12px 0 0;text-align:right;font-size:15px;color:${C.ink}">Cart total: <strong>${rupee(total)}</strong></p>
        ${paragraph("<br>Stock can run out, so complete your order soon to make sure you get it. Prices and stock are confirmed at checkout.")}
        ${button(SITE_URL + "/cart", "Complete your order")}`,
    });
  });

module.exports = {
  sendCartReminderEmail,
  sendNewProductEmails,
  sendWelcomeEmail,
  sendLoginAlertEmail,
  sendOrderPlacedEmail,
  sendOrderStatusEmail,
  sendOrderCancelledEmail,
  sendRefundProcessedEmail,
  sendEnquiryReceivedEmail,
};
