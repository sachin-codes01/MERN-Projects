const GUEST_CART_KEY = "guestCart";

const readCart = () => {
  try {
    return JSON.parse(localStorage.getItem(GUEST_CART_KEY) || "[]");
  } catch {
    return [];
  }
};

const writeCart = (items) => {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
};

export const guestCart = {
  getItems: () => readCart(),

  getCart: () => {
    const items = readCart();
    const subtotal = items.reduce((sum, i) => sum + i.priceAtAddition * i.quantity, 0);
    return { items, subtotal, discount: 0, total: subtotal, couponApplied: null };
  },

  addItem: ({ productId, variantId, quantity = 1, name, image, price, slug, stock }) => {
    const items = readCart();
    const existing = items.find((i) => i.productId === productId && i.variantId === variantId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({ productId, variantId, quantity, name, image, priceAtAddition: price, slug, stock });
    }
    writeCart(items);
    return items;
  },

  updateItem: (variantId, quantity) => {
    let items = readCart();
    if (quantity <= 0) {
      items = items.filter((i) => i.variantId !== variantId);
    } else {
      const item = items.find((i) => i.variantId === variantId);
      if (item) item.quantity = quantity;
    }
    writeCart(items);
    return items;
  },

  removeItem: (variantId) => {
    const items = readCart().filter((i) => i.variantId !== variantId);
    writeCart(items);
    return items;
  },

  clear: () => writeCart([]),
};