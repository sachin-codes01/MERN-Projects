// Cart reminder: login wale customer ne cart me kuch daala aur 24 ghante tak
// order nahi kiya → ek reminder email. Har 30 min me check hota hai.
//
//   - Ek cart pe ek hi reminder; naya item judte hi (cartController.addItem)
//     reminderSentAt khaali hota hai, to agla reminder phir 24 ghante baad.
//   - Order hote hi cart khaali ho jata hai → reminder nahi jata.
//   - 7 din se purane cart chhod do (deploy karte hi purane sab ko na jaye).
//   - Unsubscribe kiya ho (productEmails: false) ya blocked ho → nahi.
//
// Note: Render free plan pe server so jata hai to check bhi tab tak rukta
// hai jab tak koi site na khole — reminder thoda late ja sakta hai.

const Cart = require("../models/Cart");
const { isMailConfigured } = require("./mailer");
const { sendCartReminderEmail } = require("./emails");

const HOUR = 60 * 60 * 1000;
const DELAY_HOURS = Number(process.env.CART_REMINDER_HOURS) || 24;
const MAX_AGE_HOURS = 7 * 24;
const CHECK_EVERY = 30 * 60 * 1000;

const runCartReminders = async () => {
  if (!isMailConfigured()) return;
  const now = Date.now();
  const due = await Cart.find({
    "items.0": { $exists: true },
    reminderSentAt: null,
    lastItemAddedAt: { $lte: new Date(now - DELAY_HOURS * HOUR), $gte: new Date(now - MAX_AGE_HOURS * HOUR) },
  })
    .select("_id")
    .lean();

  for (const { _id } of due) {
    // Pehle "bhej diya" mark karo (atomic) — do instance/do check ek hi cart
    // pe do email na bhejein
    const cart = await Cart.findOneAndUpdate({ _id, reminderSentAt: null }, { $set: { reminderSentAt: new Date() } }, { returnDocument: "after" })
      .populate("user", "name email isBlocked productEmails")
      .populate("items.product", "name thumbnail slug sizes isActive");
    if (!cart || !cart.user || cart.user.isBlocked || cart.user.productEmails === false) continue;

    const items = cart.items
      .filter((i) => i.product && i.product.isActive !== false)
      .map((i) => ({
        name: i.product.name,
        image: i.product.thumbnail,
        flavor: i.flavor,
        weight: i.product.sizes?.id?.(i.sizeId)?.weight || "",
        quantity: i.quantity,
        price: i.priceAtAddition,
      }));
    if (items.length) sendCartReminderEmail(cart.user, items);
  }
};

const startCartReminders = () => {
  const run = () => runCartReminders().catch((err) => console.error("[cart reminders]", err.message));
  setTimeout(run, 60 * 1000); // server start ke 1 min baad pehla check
  setInterval(run, CHECK_EVERY);
};

module.exports = { startCartReminders, runCartReminders };
