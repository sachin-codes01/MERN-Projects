import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { guestCart } from "../utils/guestCart";
import MDNLoader from "../components/MDNLoader";

export default function Cart() {
  const [cart, setCart] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const loadCart = () => {
    setLoading(true);
    setError("");
    if (token) {
      api
        .getCart(token)
        .then((data) => setCart(data.data))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setCart(guestCart.getCart());
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleQuantityChange = async (variantId, quantity) => {
    try {
      if (token) {
        await api.updateCartItem(token, variantId, quantity);
        loadCart();
      } else {
        guestCart.updateItem(variantId, quantity);
        setCart(guestCart.getCart());
      }
    } catch (err) {
      setError(err.message);
      toastError(err.message);
    }
  };

  const handleRemove = async (variantId) => {
    try {
      if (token) {
        await api.removeCartItem(token, variantId);
        loadCart();
      } else {
        guestCart.removeItem(variantId);
        setCart(guestCart.getCart());
      }
      success("Item removed from cart.");
    } catch (err) {
      setError(err.message);
      toastError(err.message);
    }
  };

  const handleCheckoutClick = () => {
    if (!token) navigate("/login", { state: { from: "/checkout" } });
    else navigate("/checkout");
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <MDNLoader label="Loading cart" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center animate-fade-up">
        <CartGlyph />
        <h2 className="mt-6 font-display text-2xl font-bold uppercase tracking-wide text-mdn-white sm:text-3xl">
          Your <span className="text-mdn-green">Cart</span> Is Empty
        </h2>
        <p className="mt-2 max-w-sm text-sm text-mdn-gray">
          Looks like you haven't fueled up yet — browse the store and add something worth training for.
        </p>
        <Link to="/products" className="btn-primary mt-6">
          Browse Products
        </Link>
      </div>
    );
  }

  const total = cart.items.reduce((sum, i) => sum + i.priceAtAddition * i.quantity, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h2 className="text-center font-display text-2xl font-bold uppercase tracking-wide text-mdn-white sm:text-left">
        Your <span className="text-mdn-green">Cart</span>
      </h2>

      <div className="mt-6 space-y-3">
        {cart.items.map((item) => (
          <div
            key={item.variantId}
            className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4"
          >
            <p className="flex-1 text-sm font-medium text-mdn-white">
              {item.product?.name || item.name || "Product"}
            </p>

            <div className="flex items-center justify-between gap-3 sm:justify-end sm:gap-4">
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => handleQuantityChange(item.variantId, Number(e.target.value))}
                className="input-field w-16 shrink-0 !py-1.5 text-center sm:w-20"
              />
              <p className="w-20 shrink-0 text-right font-mono font-bold text-mdn-green">
                ₹{item.priceAtAddition * item.quantity}
              </p>
              <button
                onClick={() => handleRemove(item.variantId)}
                className="shrink-0 text-xs font-semibold text-red-400 transition-colors hover:text-red-300"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col items-center gap-4 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-bold text-mdn-white">
          Total: <span className="text-mdn-green">₹{total}</span>
        </h3>
        <button onClick={handleCheckoutClick} className="btn-primary w-full sm:w-auto">
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}

function CartGlyph() {
  return (
    <div className="relative flex h-20 w-20 items-center justify-center">
      <div className="absolute h-20 w-20 animate-[pulse_3s_ease-in-out_infinite] rounded-full bg-mdn-green/15 blur-xl" />
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="relative text-mdn-green">
        <path d="M3 3h2l.4 2M7 13h10l3.6-8H5.4M7 13L5.4 5M7 13l-1.7 4.6A1 1 0 006.24 19H18" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="21" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="17" cy="21" r="1.4" fill="currentColor" stroke="none" />
      </svg>
    </div>
  );
}