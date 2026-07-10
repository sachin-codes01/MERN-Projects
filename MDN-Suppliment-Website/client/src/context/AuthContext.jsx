import { createContext, useContext, useState } from "react";
import { api } from "../api/api";
import { guestCart } from "../utils/guestCart";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "null"));

  const loginWithGoogle = async (credential) => {
    const data = await api.googleLogin(credential);
    setToken(data.accessToken);
    setUser(data.data);
    localStorage.setItem("token", data.accessToken);
    localStorage.setItem("user", JSON.stringify(data.data));

    const guestItems = guestCart.getItems();
    if (guestItems.length > 0) {
      try {
        for (const item of guestItems) {
          await api.addToCart(data.accessToken, {
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          });
        }
      } catch {
        // ignore
      } finally {
        guestCart.clear();
      }
    }
    return data.data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ token, user, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);