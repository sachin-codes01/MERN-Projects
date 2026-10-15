// Order ka PDF invoice — server pe banta hai taaki order confirmation email
// ke saath attach ho sake. Design bilkul client/src/utils/downloadReceipt.js
// jaisa (website ka "Download Receipt"), sirf browser-wale hisse (canvas,
// window) hata ke Node ke liye.
//
// Inter font isliye embed: jsPDF ke built-in fonts me ₹ ka glyph nahi hai.

const fs = require("fs");
const path = require("path");
const { jsPDF } = require("jspdf");
const autoTableModule = require("jspdf-autotable");
const { Jimp } = require("jimp");

const autoTable = autoTableModule.default || autoTableModule.autoTable;

const ASSETS = path.join(__dirname, "..", "assets");
const SITE_HOST = (process.env.CLIENT_URL || "https://mdn-my-daily-nutrition.vercel.app").replace(/^https?:\/\//, "").replace(/\/$/, "");

// Fonts + logo ek baar padh ke yaad rakho
let assetCache = null;
const loadAssets = () => {
  if (!assetCache) {
    const b64 = (f) => fs.readFileSync(path.join(ASSETS, f)).toString("base64");
    assetCache = {
      fonts: [b64("fonts/Inter_400Regular.ttf"), b64("fonts/Inter_600SemiBold.ttf"), b64("fonts/Inter_700Bold.ttf")],
      // mdn-logo-email.png pehle se crop kiya hua (360×173)
      logo: { data: `data:image/png;base64,${b64("mdn-logo-email.png")}`, ratio: 360 / 173 },
    };
  }
  return assetCache;
};

const GREEN = [30, 70, 45];
const INK = [28, 32, 30];
const MUTED = [110, 116, 112];
const LINE = [226, 229, 227];
const TINT = [240, 243, 241];
const PILL = [224, 238, 226];
const PAGE_MARGIN = 40;

const rupee = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const titleCase = (s = "") => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const registerFonts = (doc, [regular, semibold, bold]) => {
  doc.addFileToVFS("Inter-Regular.ttf", regular);
  doc.addFont("Inter-Regular.ttf", "Inter", "normal");
  doc.addFileToVFS("Inter-SemiBold.ttf", semibold);
  doc.addFont("Inter-SemiBold.ttf", "InterSemi", "normal");
  doc.addFileToVFS("Inter-Bold.ttf", bold);
  doc.addFont("Inter-Bold.ttf", "Inter", "bold");
};

// Product photo → chhota 160px JPEG (PDF halka rahe). Site path
// (/mdn/whey-front.jpg) live website se, warna poora URL. jimp pure JS hai —
// server pe canvas nahi chahiye. Koi bhi galti → null (bina photo ke chalega).
const THUMB_PX = 160;
const loadThumb = async (src) => {
  try {
    if (!src) return null;
    const url = /^https?:\/\//i.test(src) ? src : src.startsWith("/") ? `https://${SITE_HOST}${src}` : null;
    if (!url) return null;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const img = await Jimp.read(Buffer.from(await res.arrayBuffer()));
    img.scaleToFit({ w: THUMB_PX, h: THUMB_PX });
    // Safed square pe beech me — transparent PNG kaala na ho
    const canvas = new Jimp({ width: THUMB_PX, height: THUMB_PX, color: 0xffffffff });
    canvas.composite(img, Math.round((THUMB_PX - img.width) / 2), Math.round((THUMB_PX - img.height) / 2));
    const jpg = await canvas.getBuffer("image/jpeg", { quality: 82 });
    return { data: `data:image/jpeg;base64,${jpg.toString("base64")}`, ratio: 1 };
  } catch {
    return null;
  }
};

const setText = (doc, { font = "Inter", style = "normal", size = 10, color = INK } = {}) => {
  doc.setFont(font, style);
  doc.setFontSize(size);
  doc.setTextColor(...color);
};

const paymentLabel = (payment = {}) => {
  const m = payment.method || "online";
  if (m === "cod") return "Cash on Delivery";
  return m === "online" ? "Online Payment" : titleCase(m);
};

const statusMessage = (order) => {
  const s = order.orderStatus;
  if (order.payment?.status === "refunded")
    return {
      ok: false,
      title: "Payment refunded",
      sub: `${rupee(order.payment.refundedAmount || order.pricing?.total)} has been refunded to your original payment method.`,
    };
  if (order.payment?.status === "partially_refunded")
    return {
      ok: false,
      title: "Partially refunded",
      sub: `${rupee(order.payment.refundedAmount)} of ${rupee(order.pricing?.total)} has been refunded to your original payment method.`,
    };
  if (s === "cancelled") return { ok: false, title: "Order cancelled", sub: order.cancelReason || "This order was cancelled." };
  if (s === "returned") return { ok: false, title: "Order returned", sub: "This order was returned." };
  if (s === "delivered") return { ok: true, title: "Order delivered", sub: "Thank you! We hope you enjoy your products." };
  if (order.payment?.status === "paid")
    return { ok: true, title: "Payment received successfully", sub: "Your order is being processed and will be shipped soon." };
  return { ok: true, title: "Order placed successfully", sub: "Your order is being processed and will be shipped soon." };
};

// order (mongoose doc ya plain object) → PDF Buffer
const buildReceiptPdf = async (order) => {
  const { fonts, logo } = loadAssets();
  const thumbs = await Promise.all(order.items.map((item) => loadThumb(item.product?.thumbnail || item.image)));

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  registerFonts(doc, fonts);

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const left = PAGE_MARGIN;
  const right = pageW - PAGE_MARGIN;

  /* ----- header: logo left, INVOICE right ----- */
  let y = 48;
  const logoW = 112;
  doc.addImage(logo.data, "PNG", left, y, logoW, logoW / logo.ratio);
  setText(doc, { font: "InterSemi", size: 9, color: GREEN });
  doc.setCharSpace(3.2);
  doc.text("MY DAILY NUTRITION", left, y + logoW / logo.ratio + 16);
  doc.setCharSpace(0);

  setText(doc, { style: "bold", size: 26, color: INK });
  doc.text("INVOICE", right, y + 22, { align: "right" });
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(1.5);
  doc.line(right - 22, y + 34, right, y + 34);
  setText(doc, { size: 11, color: INK });
  doc.text(`Order #${order.orderNumber}`, right, y + 56, { align: "right" });
  setText(doc, { size: 9, color: MUTED });
  doc.text(`Placed on ${new Date(order.createdAt || Date.now()).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}`, right, y + 74, {
    align: "right",
  });

  /* ----- bill to + order facts ----- */
  y = 152;
  const a = order.shippingAddress || {};
  setText(doc, { size: 9, color: MUTED });
  doc.setCharSpace(0.8);
  doc.text("BILL TO", left, y);
  doc.setCharSpace(0);
  setText(doc, { font: "InterSemi", size: 12, color: INK });
  doc.text(a.fullName || "-", left, y + 22);
  setText(doc, { size: 9.5, color: MUTED });
  const addr = [
    [a.line1, a.line2].filter(Boolean).join(", "),
    `${[a.city, a.district, a.state].filter(Boolean).join(", ")}${a.pincode ? ` - ${a.pincode}` : ""}`,
    a.country || "India",
    a.phone ? `Phone: ${a.phone}` : "",
  ].filter((l) => l && l.trim());
  let ay = y + 40;
  addr.forEach((line) => {
    const wrapped = doc.splitTextToSize(line, 230);
    doc.text(wrapped, left, ay);
    ay += wrapped.length * 14;
  });

  const factsX = right - 210;
  const valueX = right - 110;
  const facts = [
    ["Payment Method", paymentLabel(order.payment)],
    ["Shipping Method", order.pricing?.shippingFee > 0 ? "Standard Shipping" : "Free Shipping"],
  ];
  facts.forEach(([label, value], i) => {
    const fy = y + i * 22;
    setText(doc, { size: 9.5, color: MUTED });
    doc.text(label, factsX, fy);
    doc.text(":", valueX - 16, fy);
    setText(doc, { size: 9.5, color: INK });
    doc.text(value, valueX, fy);
  });
  const sy = y + facts.length * 22;
  setText(doc, { size: 9.5, color: MUTED });
  doc.text("Status", factsX, sy);
  doc.text(":", valueX - 16, sy);
  const statusText = titleCase(order.orderStatus);
  const bad = order.orderStatus === "cancelled" || order.orderStatus === "returned";
  setText(doc, { font: "InterSemi", size: 9, color: bad ? [170, 40, 40] : GREEN });
  const pillW = doc.getTextWidth(statusText) + 20;
  doc.setFillColor(...(bad ? [250, 228, 228] : PILL));
  doc.roundedRect(valueX - 2, sy - 12, pillW, 18, 9, 9, "F");
  doc.text(statusText, valueX + 8, sy + 0.5);

  y = Math.max(ay, sy + 14) + 12;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.8);
  doc.line(left, y, right, y);

  /* ----- items table ----- */
  const THUMB = 38;
  autoTable(doc, {
    startY: y + 14,
    margin: { left, right: PAGE_MARGIN },
    head: [["#", "", "Product", "Quantity", "Price", "Total"]],
    body: order.items.map((item, i) => [String(i + 1), "", "", String(item.quantity), rupee(item.price), rupee(item.price * item.quantity)]),
    theme: "plain",
    styles: { font: "Inter", fontSize: 9.5, textColor: INK, valign: "middle", cellPadding: { top: 10, bottom: 10, left: 8, right: 8 } },
    headStyles: { font: "InterSemi", fontStyle: "normal", fillColor: TINT, textColor: INK, cellPadding: { top: 10, bottom: 10, left: 8, right: 8 } },
    columnStyles: {
      0: { cellWidth: 30, halign: "center" },
      1: { cellWidth: THUMB + 16, minCellHeight: THUMB + 14 },
      2: { cellWidth: "auto" },
      3: { cellWidth: 62, halign: "center" },
      4: { cellWidth: 70, halign: "right" },
      5: { cellWidth: 76, halign: "right" },
    },
    didParseCell: ({ section, column, cell }) => {
      if (section !== "head") return;
      if (column.index === 3) cell.styles.halign = "center";
      if (column.index >= 4) cell.styles.halign = "right";
    },
    didDrawCell: ({ section, column, row, cell }) => {
      if (section !== "body") return;
      const item = order.items[row.index];
      if (column.index === 1) {
        const t = thumbs[row.index];
        const x = cell.x + 4;
        const ty = cell.y + (cell.height - THUMB) / 2;
        doc.setFillColor(...TINT);
        doc.roundedRect(x, ty, THUMB, THUMB, 4, 4, "F");
        if (t) doc.addImage(t.data, "JPEG", x, ty, THUMB, THUMB);
      }
      if (column.index === 2) {
        const name = `${item.name || "Product"}${item.flavor ? ` (${item.flavor})` : ""}`;
        const sub = item.product?.shortDescription || item.weight || "";
        const width = cell.width - 16;
        setText(doc, { font: "InterSemi", size: 10, color: INK });
        const nameLines = doc.splitTextToSize(name, width).slice(0, 2);
        setText(doc, { size: 8.5, color: MUTED });
        const subLines = sub ? doc.splitTextToSize(sub, width).slice(0, 1) : [];
        const blockH = nameLines.length * 13 + (subLines.length ? 14 : 0);
        let ty = cell.y + (cell.height - blockH) / 2 + 10;
        setText(doc, { font: "InterSemi", size: 10, color: INK });
        doc.text(nameLines, cell.x + 8, ty);
        ty += nameLines.length * 13 + 2;
        if (subLines.length) {
          setText(doc, { size: 8.5, color: MUTED });
          doc.text(subLines, cell.x + 8, ty);
        }
      }
    },
    willDrawCell: ({ section, row, cell, doc: d }) => {
      if (section === "body" && row.index < order.items.length) {
        d.setDrawColor(...LINE);
        d.setLineWidth(0.6);
        d.line(cell.x, cell.y + cell.height, cell.x + cell.width, cell.y + cell.height);
      }
    },
  });

  /* ----- totals ----- */
  const p = order.pricing || {};
  const tLeft = right - 220;
  const rows = [["Subtotal", rupee(p.subtotal)]];
  if (p.discount > 0) rows.push([`Discount${p.couponCode ? ` (${p.couponCode})` : ""}`, `-${rupee(p.discount)}`]);
  rows.push(["Shipping", p.shippingFee > 0 ? rupee(p.shippingFee) : "FREE"]);
  rows.push(["GST (Included)", rupee(p.tax)]);

  const blockH = rows.length * 20 + 18 + 30 + 54;
  const footerTop = pageH - 90;
  y = doc.lastAutoTable.finalY + 22;
  if (y + blockH > footerTop) {
    doc.addPage();
    y = 60;
  }
  rows.forEach(([label, value]) => {
    setText(doc, { size: 9.5, color: MUTED });
    doc.text(label, tLeft, y);
    setText(doc, { size: 11, color: INK });
    doc.text(value, right, y, { align: "right" });
    y += 20;
  });
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.8);
  doc.line(tLeft, y - 4, right, y - 4);
  y += 18;
  setText(doc, { font: "InterSemi", size: 13, color: INK });
  doc.text(bad ? "Order Total" : "Total Paid", tLeft, y);
  setText(doc, { style: "bold", size: 18, color: INK });
  doc.text(rupee(p.total), right, y + 1, { align: "right" });

  /* ----- status message box ----- */
  y += 30;
  const msg = statusMessage(order);
  const boxH = 54;
  doc.setFillColor(...TINT);
  doc.roundedRect(left, y, right - left, boxH, 6, 6, "F");
  const cx = left + 26;
  const cy = y + boxH / 2;
  doc.setFillColor(...(msg.ok ? GREEN : [170, 40, 40]));
  doc.circle(cx, cy, 10, "F");
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(1.8);
  if (msg.ok) {
    doc.line(cx - 4.5, cy + 0.5, cx - 1.2, cy + 3.8);
    doc.line(cx - 1.2, cy + 3.8, cx + 4.8, cy - 3.2);
  } else {
    doc.line(cx - 3.5, cy - 3.5, cx + 3.5, cy + 3.5);
    doc.line(cx + 3.5, cy - 3.5, cx - 3.5, cy + 3.5);
  }
  doc.setDrawColor(...MUTED);
  doc.setLineWidth(0.6);
  doc.line(left + 48, y + 14, left + 48, y + boxH - 14);
  setText(doc, { font: "InterSemi", size: 10.5, color: INK });
  doc.text(msg.title, left + 62, cy - 3);
  setText(doc, { size: 8.5, color: MUTED });
  doc.text(msg.sub, left + 62, cy + 11);

  /* ----- footer ----- */
  const fy = pageH - 64;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.8);
  doc.line(left, fy - 20, right, fy - 20);
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(1.2);
  doc.roundedRect(left, fy - 4, 20, 14, 2, 2, "S");
  doc.line(left, fy - 3, left + 10, fy + 4);
  doc.line(left + 10, fy + 4, left + 20, fy - 3);
  setText(doc, { size: 9.5, color: INK });
  doc.text("Need Help?", left + 32, fy);
  setText(doc, { size: 9, color: MUTED });
  doc.text(`${SITE_HOST}/support`, left + 32, fy + 14);

  setText(doc, { size: 8, color: MUTED });
  doc.text("Thank you for choosing MDN", right, fy + 7, { align: "right" });
  const tw = doc.getTextWidth("Thank you for choosing MDN");
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(1.2);
  doc.line(right - tw - 34, fy + 4, right - tw - 10, fy + 4);

  return Buffer.from(doc.output("arraybuffer"));
};

module.exports = { buildReceiptPdf };
