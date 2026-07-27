import { createContext, useContext, useEffect, useRef, useState } from "react";
import { api } from "../api/api";
import { guestCart } from "../utils/guestCart";

const AuthContext = createContext(null);

// A line the server will never accept no matter how many times we retry —
// the product, size or flavor it points at is gone. Anything else (stock,
// network blip, expired token) is worth keeping for another attempt.
const isPermanentMergeFailure = (message = "") => /not found/i.test(message);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "null"));
  // True while guest-cart lines are being moved onto the server cart, so
  // the cart/checkout screens can wait instead of rendering "empty" over
  // a merge that's still in flight.
  const [cartSyncing, setCartSyncing] = useState(false);
  const syncingRef = useRef(false);

  // api.js silently rotates the access token via the refresh token when a
  // call hits a 401 (see refreshAccessToken in api/api.js) — pick up the
  // new token here so useAuth() consumers stay in sync without a reload.
  useEffect(() => {
    const handleTokenRefreshed = (e) => setToken(e.detail);
    window.addEventListener("auth:token-refreshed", handleTokenRefreshed);
    return () => window.removeEventListener("auth:token-refreshed", handleTokenRefreshed);
  }, []);

  // Moves whatever is sitting in the logged-out cart onto the signed-in
  // user's server cart.
  //
  // Every line gets its OWN try/catch: previously one rejected item (out
  // of stock, a deleted product, a dropped request) aborted the loop and
  // the `finally` still wiped localStorage — so a single bad line emptied
  // the entire cart the moment the user logged in. Now a failure only
  // affects that line, and anything that didn't make it across stays in
  // localStorage for the next attempt rather than being thrown away.
  const syncGuestCart = async (accessToken) => {
    if (!accessToken || syncingRef.current) return;
    const guestItems = guestCart.getItems();
    if (guestItems.length === 0) return;

    syncingRef.current = true;
    setCartSyncing(true);
    const unmerged = [];

    try {
      for (const item of guestItems) {
        try {
          await api.addToCart(accessToken, {
            productId: item.productId,
            sizeId: item.sizeId,
            flavorId: item.flavorId,
            quantity: item.quantity,
          });
        } catch (err) {
          if (!isPermanentMergeFailure(err.message)) unmerged.push(item);
        }
      }
      guestCart.replace(unmerged);
    } finally {
      // Always release the flags — a stuck `cartSyncing` would leave the
      // cart page spinning forever.
      syncingRef.current = false;
      setCartSyncing(false);
    }
  };

  // Covers the sessions a login handler can't: the tab was closed or
  // reloaded partway through a merge, or items were added in another tab
  // while this one was logged out. Cheap no-op when there's nothing left
  // in the guest cart.
  useEffect(() => {
    if (token) syncGuestCart(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loginWithGoogle = async (credential) => {
    const data = await api.googleLogin(credential);
    localStorage.setItem("token", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("user", JSON.stringify(data.data));

    // Merge BEFORE publishing the new token: the token change is what
    // makes Cart/Checkout refetch, and they must not read the server cart
    // while it's still half-populated. Never let a cart problem fail the
    // login itself — unmerged lines stay in localStorage and are retried
    // on the next app load.
    try {
      await syncGuestCart(data.accessToken);
    } catch {
      // ignore — the user is still logged in below
    }

    setToken(data.accessToken);
    setUser(data.data);
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
    <AuthContext.Provider value={{ token, user, cartSyncing, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);