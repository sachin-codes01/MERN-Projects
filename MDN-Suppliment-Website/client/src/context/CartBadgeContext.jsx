import { createContext, useContext, useState } from "react";

const CartBadgeContext = createContext(null);

export function CartBadgeProvider({ children }) {
  const [hasNewItem, setHasNewItem] = useState(false);

  const markNewItem = () => setHasNewItem(true);
  const clearNewItem = () => setHasNewItem(false);

  return (
    <CartBadgeContext.Provider value={{ hasNewItem, markNewItem, clearNewItem }}>
      {children}
    </CartBadgeContext.Provider>
  );
}

export const useCartBadge = () => useContext(CartBadgeContext);