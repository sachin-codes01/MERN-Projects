import { createContext, useContext, useState } from "react";
import { api } from "../api/api";
import { guestCart } from "../utils/guestCart";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user") || "null")
  );

  const login = async (accessToken, userData) => {
    setToken(accessToken);
    setUser(userData);
    localStorage.setItem("token", accessToken);
    localStorage.setItem("user", JSON.stringify(userData));

    // fold any items added while browsing as a guest into the real cart
    const guestItems = guestCart.getItems();
    if (guestItems.length > 0) {
      try {
        for (const item of guestItems) {
          await api.addToCart(accessToken, {
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          });
        }
      } catch {
        // don't block login if e.g. an item went out of stock in the meantime
      } finally {
        guestCart.clear();
      }
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);