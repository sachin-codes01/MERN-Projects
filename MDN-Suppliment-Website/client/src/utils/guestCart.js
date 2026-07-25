const GUEST_CART_KEY = "guestCart";

// A logged-in cart line gets a real Mongo _id (see Cart.js). A guest cart
// has no server document to generate one, so it synthesizes a stable id
// from (sizeId, flavorId) — the same pair that makes a line unique — and
// stores it under `_id` too, so Cart.jsx can treat both cart shapes the
// same way instead of branching on the field name.
const lineId = (sizeId, flavorId) => `${sizeId}:${flavorId || "none"}`;

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

  addItem: ({ productId, sizeId, flavorId = null, quantity = 1, name, image, price, slug, stock, flavor, weight, brand }) => {
    const items = readCart();
    const _id = lineId(sizeId, flavorId);
    const existing = items.find((i) => i.productId === productId && i._id === _id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({
        _id,
        productId,
        sizeId,
        flavorId,
        quantity,
        name,
        image,
        priceAtAddition: price,
        slug,
        stock,
        flavor,
        weight,
        brand,
      });
    }
    writeCart(items);
    return items;
  },

  updateItem: (itemId, quantity) => {
    let items = readCart();
    if (quantity <= 0) {
      items = items.filter((i) => i._id !== itemId);
    } else {
      const item = items.find((i) => i._id === itemId);
      if (item) item.quantity = quantity;
    }
    writeCart(items);
    return items;
  },

  removeItem: (itemId) => {
    const items = readCart().filter((i) => i._id !== itemId);
    writeCart(items);
    return items;
  },

  clear: () => writeCart([]),
};
