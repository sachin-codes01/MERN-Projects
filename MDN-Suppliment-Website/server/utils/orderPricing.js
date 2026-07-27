// Single source of truth for everything charged on top of the item
// subtotal. The cart summary the customer reads before paying, the
// Razorpay order amount, and the Order.pricing row that gets stored all
// call this — so the number shown at checkout can never drift from the
// number actually charged.
const FREE_SHIPPING_ABOVE = 999; // afterDiscount strictly above this ships free
const SHIPPING_FEE = 79;
const TAX_RATE = 0.05; // 5% GST

function calcOrderPricing(subtotal = 0, discount = 0) {
  const afterDiscount = Math.max(subtotal - discount, 0);

  // Nothing in the cart — don't quote a shipping fee or tax on ₹0.
  if (afterDiscount <= 0) {
    return { shippingFee: 0, tax: 0, total: 0 };
  }

  const shippingFee = afterDiscount > FREE_SHIPPING_ABOVE ? 0 : SHIPPING_FEE;
  const tax = Math.round(afterDiscount * TAX_RATE);

  return { shippingFee, tax, total: afterDiscount + shippingFee + tax };
}

module.exports = { calcOrderPricing, FREE_SHIPPING_ABOVE, SHIPPING_FEE, TAX_RATE };
