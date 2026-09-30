// Builds and downloads a PDF invoice for one order, entirely in the browser.
//
// jsPDF, autotable, the Inter font files and the logo are all loaded
// lazily, so nothing extra is downloaded until someone actually clicks
// "Download Receipt".
//
// Inter is embedded (rather than jsPDF's built-in Helvetica) because the
// built-in fonts have no ₹ glyph — they print a blank box instead.
import interRegularUrl from "@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf?url";
import interSemiBoldUrl from "@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf?url";
import interBoldUrl from "@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf?url";

const LOGO_URL = "/mdn-logo.png";

// Palette taken from the reference invoice — deep bottle green, not the
// site's bright CTA green, so the page reads calm when printed.
const GREEN = [30, 70, 45];
const INK = [28, 32, 30];
const MUTED = [110, 116, 112];
const LINE = [226, 229, 227];
const TINT = [240, 243, 241];
const PILL = [224, 238, 226];

const PAGE_MARGIN = 40;

const rupee = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const titleCase = (s = "") => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/* ---------- asset loaders ---------- */

const bufferToBase64 = (buf) => {
  const bytes = new Uint8Array(buf);
  let bin = "";
  // Chunked so large font files don't blow the argument limit of fromCharCode.
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
};

// Cached across clicks — the fonts are ~300KB each and never change.
let fontCache = null;
const loadFonts = () => {
  fontCache ??= Promise.all(
    [interRegularUrl, interSemiBoldUrl, interBoldUrl].map((u) =>
      fetch(u).then((r) => r.arrayBuffer()).then(bufferToBase64)
    )
  ).catch((err) => {
    fontCache = null; // let the next click retry instead of caching a failure
    throw err;
  });
  return fontCache;
};

const registerFonts = (doc, [regular, semibold, bold]) => {
  doc.addFileToVFS("Inter-Regular.ttf", regular);
  doc.addFont("Inter-Regular.ttf", "Inter", "normal");
  doc.addFileToVFS("Inter-SemiBold.ttf", semibold);
  doc.addFont("Inter-SemiBold.ttf", "InterSemi", "normal");
  doc.addFileToVFS("Inter-Bold.ttf", bold);
  doc.addFont("Inter-Bold.ttf", "Inter", "bold");
};

// Any image (webp, cross-origin Cloudinary, …) → a JPEG/PNG data URL jsPDF
// can embed, drawn onto a white square so transparent PNGs don't turn
// black. Resolves null on failure: a missing thumbnail must never stop
// the invoice from downloading.
const loadImage = (src, { size = 160, format = "image/jpeg", background = "#ffffff" } = {}) =>
  new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const ratio = img.naturalWidth / img.naturalHeight || 1;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = Math.round(size / ratio);
        const ctx = canvas.getContext("2d");
        if (background) {
          ctx.fillStyle = background;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve({ data: canvas.toDataURL(format, 0.9), ratio });
      } catch {
        resolve(null); // tainted canvas (no CORS headers) — skip the photo
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });

// The logo PNG is a 1024² square with lots of empty margin around the
// letters — crop to the painted pixels so it can be placed at a sensible size.
const loadLogo = () =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const { data, width, height } = ctx.getImageData(0, 0, c.width, c.height);
        let minX = width, minY = height, maxX = 0, maxY = 0;
        for (let y = 0; y < height; y += 2) {
          for (let x = 0; x < width; x += 2) {
            const i = (y * width + x) * 4;
            const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
            // painted = visible and not near-white
            if (a > 40 && !(r > 235 && g > 235 && b > 235)) {
              if (x < minX) minX = x;
              if (y < minY) minY = y;
              if (x > maxX) maxX = x;
              if (y > maxY) maxY = y;
            }
          }
        }
        if (maxX <= minX) return resolve(null);
        const w = maxX - minX + 1;
        const h = maxY - minY + 1;
        // Printed ~112pt wide, so 480px is plenty sharp and keeps the PDF small.
        const scale = Math.min(1, 480 / w);
        const out = document.createElement("canvas");
        out.width = Math.round(w * scale);
        out.height = Math.round(h * scale);
        out.getContext("2d").drawImage(c, minX, minY, w, h, 0, 0, out.width, out.height);
        resolve({ data: out.toDataURL("image/png"), ratio: w / h });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = LOGO_URL;
  });

/* ---------- drawing helpers ---------- */

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

// Box at the bottom, worded from the order's real state rather than
// always claiming the payment went through.
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
  if (order.payment?.status === "failed")
    return { ok: false, title: "Payment failed", sub: "We could not confirm the payment for this order." };
  return { ok: true, title: "Order placed successfully", sub: "Your order is being processed and will be shipped soon." };
};

/* ---------- main ---------- */

export const downloadReceipt = async (order) => {
  const [{ jsPDF }, { default: autoTable }, fonts, logo, thumbs] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
    loadFonts(),
    loadLogo(),
    Promise.all(order.items.map((item) => loadImage(item.product?.thumbnail || item.image))),
  ]);

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  registerFonts(doc, fonts);

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const left = PAGE_MARGIN;
  const right = pageW - PAGE_MARGIN;

  /* ----- header: logo left, INVOICE right ----- */
  let y = 48;
  if (logo) {
    const logoW = 112;
    doc.addImage(logo.data, "PNG", left, y, logoW, logoW / logo.ratio);
  }
  setText(doc, { font: "InterSemi", size: 9, color: GREEN });
  doc.setCharSpace(3.2);
  doc.text("MY DAILY NUTRITION", left, y + (logo ? 112 / logo.ratio : 30) + 16);
  doc.setCharSpace(0);

  setText(doc, { style: "bold", size: 26, color: INK });
  doc.text("INVOICE", right, y + 22, { align: "right" });
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(1.5);
  doc.line(right - 22, y + 34, right, y + 34);
  setText(doc, { size: 11, color: INK });
  doc.text(`Order #${order.orderNumber}`, right, y + 56, { align: "right" });
  setText(doc, { size: 9, color: MUTED });
  doc.text(`Placed on ${new Date(order.createdAt).toLocaleDateString("en-IN")}`, right, y + 74, { align: "right" });

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
    `${[a.city, a.state].filter(Boolean).join(", ")}${a.pincode ? ` - ${a.pincode}` : ""}`,
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
  // Status pill
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
    body: order.items.map((item, i) => [
      String(i + 1),
      "",
      "", // drawn by hand in didDrawCell (two lines, two styles)
      String(item.quantity),
      rupee(item.price),
      rupee(item.price * item.quantity),
    ]),
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
        if (t) {
          // contain inside the square, keeping the photo's own ratio
          const w = t.ratio >= 1 ? THUMB : THUMB * t.ratio;
          const h = t.ratio >= 1 ? THUMB / t.ratio : THUMB;
          doc.addImage(t.data, "JPEG", x + (THUMB - w) / 2, ty + (THUMB - h) / 2, w, h);
        }
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
    // Hairline under each row, like the reference.
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

  // Totals + status box need this much room above the footer; if a long
  // order leaves less, they move to a fresh page together rather than
  // splitting or running into the footer.
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
  // envelope icon
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(1.2);
  doc.roundedRect(left, fy - 4, 20, 14, 2, 2, "S");
  doc.line(left, fy - 3, left + 10, fy + 4);
  doc.line(left + 10, fy + 4, left + 20, fy - 3);
  setText(doc, { size: 9.5, color: INK });
  doc.text("Need Help?", left + 32, fy);
  setText(doc, { size: 9, color: MUTED });
  // The support email is deliberately not published on the site (the
  // contact form is login-gated), so the invoice points there too.
  doc.text(`${window.location.host}/contact`, left + 32, fy + 14);

  setText(doc, { size: 8, color: MUTED });
  doc.text("Thank you for choosing MDN", right, fy + 7, { align: "right" });
  const tw = doc.getTextWidth("Thank you for choosing MDN");
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(1.2);
  doc.line(right - tw - 34, fy + 4, right - tw - 10, fy + 4);

  doc.save(`MDN-Invoice-${order.orderNumber}.pdf`);
};
