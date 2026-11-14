// Single source of truth for everything charged on top of the item
// subtotal. The cart summary the customer reads before paying, the
// Razorpay order amount, and the Order.pricing row that gets stored all
// call this — so the number shown at checkout can never drift from the
// number actually charged.
// Use the default fee when a product has no override.
const FREE_SHIPPING_ABOVE = null;
const SHIPPING_FEE = 79;
const TAX_RATE = 0.05; // 5% GST

// Products ship together, so apply the highest applicable fee once.
function getProductShippingFee(items) {
  return items.reduce((fee, { product }) => (
    product ? Math.max(fee, product.shippingFee ?? SHIPPING_FEE) : fee
  ), 0);
}

function calcOrderPricing(subtotal = 0, discount = 0, productShippingFee = SHIPPING_FEE) {
  const afterDiscount = Math.max(subtotal - discount, 0);

  // Nothing in the cart — don't quote a shipping fee or tax on ₹0.
  if (afterDiscount <= 0) {
    return { shippingFee: 0, tax: 0, total: 0 };
  }

  const shippingFee = FREE_SHIPPING_ABOVE !== null && afterDiscount > FREE_SHIPPING_ABOVE ? 0 : productShippingFee;
  const tax = Math.round(afterDiscount * TAX_RATE);

  return { shippingFee, tax, total: afterDiscount + shippingFee + tax };
}

module.exports = { calcOrderPricing, getProductShippingFee, FREE_SHIPPING_ABOVE, SHIPPING_FEE, TAX_RATE };
