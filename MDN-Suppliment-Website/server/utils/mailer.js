const path = require("path");
const nodemailer = require("nodemailer");

// Saare emails (OTP, login, order…) yahin se jate hain — ek transporter,
// ek layout. Design jaan-boojh ke saada rakha hai, jaise asli store emails
// (Amazon/Nykaa): logo, left-aligned text, simple tables, ek button.
//
// Email clients (Gmail, Outlook) me modern CSS nahi chalta — isliye sab
// tables + inline styles, aur system fonts.
//
// SMTP (Gmail App Password) .env me na ho to email chupchaap skip.

const isMailConfigured = () => !!(process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter = null;
const getTransporter = () => {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT) || 465;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
};

// Website ka logo — email ke andar attach (cid), taaki bina deploy ke bhi dikhe
const LOGO_PATH = path.join(__dirname, "..", "assets", "mdn-logo-email.png");
const LOGO_CID = "mdn-logo@mdn";
const SITE_URL = (process.env.CLIENT_URL || "https://mdn-my-daily-nutrition.vercel.app").replace(/\/$/, "");

const C = {
  page: "#f5f2ec",
  card: "#ffffff",
  green: "#3f5524",
  ink: "#1f2418",
  body: "#3d4236",
  muted: "#7b7d74",
  border: "#e6e1d6",
  soft: "#f8f6f1",
  red: "#a3271b",
};
const FONT = "Arial,Helvetica,sans-serif";

// User ka likha text (naam, address, product name) HTML me safe
const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const rupee = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

/* ================= Building blocks ================= */

const paragraph = (html) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${C.body}">${html}</p>`;

// Section ka chhota bold heading ("Items in this order")
const heading = (text) =>
  `<p style="margin:28px 0 10px;font-size:15px;font-weight:bold;color:${C.ink}">${esc(text)}</p>`;

const button = (href, label) => `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 4px"><tr>
    <td style="background:${C.green};border-radius:6px">
      <a href="${href}" style="display:inline-block;padding:12px 24px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none">${label}</a>
    </td>
  </tr></table>`;

// Details ka hissa — bina box/background ke, sirf thodi jagah (saada text jaisa)
const box = (html) => `<div style="margin:4px 0 0">${html}</div>`;

// Label / value ki lines
const detailRows = (rows) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows
    .filter(Boolean)
    .map(
      ([label, value]) => `<tr>
        <td style="padding:3px 0;font-size:14px;color:${C.muted};width:150px;vertical-align:top">${label}:</td>
        <td style="padding:3px 0;font-size:14px;color:${C.ink}">${value}</td>
      </tr>`
    )
    .join("")}</table>`;

// Product photo ka public URL: Cloudinary (chhota karke) ya website ka path
const imageUrl = (src) => {
  if (!src) return "";
  if (/res\.cloudinary\.com\/.+\/upload\//.test(src)) return src.replace("/upload/", "/upload/w_120,h_120,c_pad,b_white,f_jpg/");
  if (/^https?:\/\//i.test(src)) return src;
  return src.startsWith("/") ? `${SITE_URL}${src}` : "";
};

// Items: photo + naam + flavour/size + qty, daayein price
const itemList = (items = []) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${C.border}">${items
    .map((it) => {
      const img = imageUrl(it.product?.thumbnail || it.image);
      const meta = [it.flavor, it.weight].filter(Boolean).map(esc).join(", ");
      return `<tr>
        <td width="64" valign="top" style="padding:14px 0;border-bottom:1px solid ${C.border}">
          ${img ? `<img src="${img}" width="56" height="56" alt="" style="display:block;width:56px;height:56px;border:1px solid ${C.border};border-radius:4px">` : ""}
        </td>
        <td valign="top" style="padding:14px 10px;border-bottom:1px solid ${C.border}">
          <div style="font-size:14px;color:${C.ink};line-height:1.4">${esc(it.name)}</div>
          <div style="margin-top:3px;font-size:13px;color:${C.muted}">${meta}${meta ? " · " : ""}Qty ${it.quantity || 1}</div>
        </td>
        <td valign="top" align="right" style="padding:14px 0;border-bottom:1px solid ${C.border};font-size:14px;color:${C.ink};white-space:nowrap">${
          it.price !== undefined ? rupee(it.price * (it.quantity || 1)) : ""
        }</td>
      </tr>`;
    })
    .join("")}</table>`;

// Bill: subtotal, discount, shipping, GST, total (daayein side)
const summary = (pricing = {}, { paid = true } = {}) => {
  const row = (label, value, strong) => `<tr>
    <td align="right" style="padding:3px 16px 3px 0;font-size:14px;color:${strong ? C.ink : C.muted}${strong ? ";font-weight:bold" : ""}">${label}</td>
    <td align="right" style="padding:3px 0;font-size:14px;color:${C.ink};white-space:nowrap${strong ? ";font-weight:bold" : ""}">${value}</td>
  </tr>`;
  return `<table role="presentation" cellpadding="0" cellspacing="0" align="right" style="margin-top:12px">
    ${row("Subtotal", rupee(pricing.subtotal))}
    ${pricing.discount > 0 ? row(`Discount${pricing.couponCode ? ` (${esc(pricing.couponCode)})` : ""}`, `-${rupee(pricing.discount)}`) : ""}
    ${row("Shipping", pricing.shippingFee > 0 ? rupee(pricing.shippingFee) : "Free")}
    ${row("GST (included)", rupee(pricing.tax))}
    ${row(paid ? "Total paid" : "Order total", rupee(pricing.total), true)}
  </table>
  <div style="clear:both"></div>`;
};

/* ================= Poora email ================= */

// title: bada headline; body: baaki sab (paragraphs, boxes, tables)
const layout = ({ preheader = "", title = "", body = "", footerNote = "", unsubscribeUrl = "" }) => `<!doctype html>
<html lang="en"><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light only">
  <title>MDN – My Daily Nutrition</title>
</head>
<body style="margin:0;padding:0;background:${C.page}">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.page};font-family:${FONT}">
    <tr><td align="center" style="padding:24px 12px 32px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${C.card};border:1px solid ${C.border};border-radius:8px">
        <tr><td style="padding:22px 32px;border-bottom:1px solid ${C.border}">
          <!-- Logo + daayein website ka poora naam -->
          <a href="${SITE_URL}" style="text-decoration:none">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td valign="middle" style="padding-right:14px"><img src="cid:${LOGO_CID}" width="84" alt="MDN" style="display:block;width:84px;height:auto;border:0"></td>
              <td valign="middle" style="padding-left:14px;border-left:1px solid ${C.border}">
                <div style="font-size:17px;font-weight:bold;color:${C.ink};line-height:1.2">My Daily Nutrition</div>
              </td>
            </tr></table>
          </a>
        </td></tr>
        <tr><td style="padding:30px 32px 32px">
          ${title ? `<h1 style="margin:0 0 18px;font-size:22px;line-height:1.3;font-weight:bold;color:${C.ink}">${title}</h1>` : ""}
          ${body}
          <p style="margin:28px 0 0;font-size:15px;line-height:1.6;color:${C.body}">Team MDN</p>
        </td></tr>
      </table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">
        <tr><td style="padding:18px 32px 0;font-size:12px;line-height:1.7;color:${C.muted}">
          ${footerNote ? `${footerNote}<br>` : ""}
          ${unsubscribeUrl ? `Don't want product updates? <a href="${unsubscribeUrl}" style="color:${C.muted}">Unsubscribe</a>.<br>` : ""}
          Need help? Visit <a href="${SITE_URL}/support" style="color:${C.muted}">Customer Support</a>.<br>
          MDN – My Daily Nutrition, India
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

// Email bhejo (await karne layak). SMTP na ho to { skipped: true }.
const sendMail = async ({ to, subject, text, attachments = [], ...content }) => {
  if (!isMailConfigured() || !to) return { skipped: true };
  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || `"MDN – My Daily Nutrition" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    // Promotional email pe Gmail ka "Unsubscribe" button
    ...(content.unsubscribeUrl
      ? { list: { unsubscribe: { url: content.unsubscribeUrl, comment: "Unsubscribe from product updates" } } }
      : {}),
    html: layout(content),
    attachments: [{ filename: "mdn-logo.png", path: LOGO_PATH, cid: LOGO_CID }, ...attachments],
  });
  return { sent: true };
};

// Notification emails ke liye: request ko kabhi rokta ya fail nahi karta —
// background me bhejo, galti sirf log me
const sendInBackground = (label, buildAndSend) => {
  if (!isMailConfigured()) return;
  Promise.resolve()
    .then(buildAndSend)
    .catch((err) => console.error(`[email] ${label} failed:`, err.message));
};

module.exports = {
  sendMail,
  sendInBackground,
  isMailConfigured,
  layout,
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
};
