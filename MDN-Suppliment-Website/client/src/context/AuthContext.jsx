import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/api";
import { guestCart } from "../utils/guestCart";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "null"));

  // api.js silently rotates the access token via the refresh token when a
  // call hits a 401 (see refreshAccessToken in api/api.js) — pick up the
  // new token here so useAuth() consumers stay in sync without a reload.
  useEffect(() => {
    const handleTokenRefreshed = (e) => setToken(e.detail);
    window.addEventListener("auth:token-refreshed", handleTokenRefreshed);
    return () => window.removeEventListener("auth:token-refreshed", handleTokenRefreshed);
  }, []);

  const loginWithGoogle = async (credential) => {
    const data = await api.googleLogin(credential);
    setToken(data.accessToken);
    setUser(data.data);
    localStorage.setItem("token", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("user", JSON.stringify(data.data));

    const guestItems = guestCart.getItems();
    if (guestItems.length > 0) {
      try {
        for (const item of guestItems) {
          await api.addToCart(data.accessToken, {
            productId: item.productId,
            sizeId: item.sizeId,
            flavorId: item.flavorId,
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

  const logout = async () => {
    // Best-effort: invalidate the refresh token server-side so it can't be
    // replayed later. Local session is cleared either way.
    if (token) {
      try {
        await api.logout(token);
      } catch {
        // ignore — clearing local state below still logs the user out
      }
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ token, user, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);