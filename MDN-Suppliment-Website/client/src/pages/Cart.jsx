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

  const handleQuantityChange = async (itemId, quantity) => {
    if (quantity < 1) return; // never allow dropping below 1 via the stepper
    try {
      if (token) {
        await api.updateCartItem(token, itemId, quantity);
        loadCart();
      } else {
        guestCart.updateItem(itemId, quantity);
        setCart(guestCart.getCart());
      }
    } catch (err) {
      setError(err.message);
      toastError(err.message);
    }
  };

  const handleRemove = async (itemId) => {
    try {
      if (token) {
        await api.removeCartItem(token, itemId);
        loadCart();
      } else {
        guestCart.removeItem(itemId);
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
        {cart.items.map((item) => {
          // Logged-in carts only populate `product` (name/thumbnail/slug/
          // sizes/flavors/brand) — the specific size/flavor has to be
          // looked up from the entries matching this line item. Guest
          // carts instead carry a denormalized snapshot (name/image/
          // flavor/weight/brand) taken at the moment the item was added,
          // since there's no live product join for a logged-out cart.
          const size = item.product?.sizes?.find((s) => String(s._id) === String(item.sizeId));
          const flavorObj = item.flavorId
            ? item.product?.flavors?.find((f) => String(f._id) === String(item.flavorId))
            : null;
          const name = item.product?.name || item.name || "Product";
          const brand = item.product?.brand || item.brand;
          const image = flavorObj?.image || item.product?.thumbnail || item.image;
          const flavor = flavorObj?.name || item.flavor;
          const weight = size?.weight || item.weight;
          const slug = item.product?.slug || item.slug;

          return (
          <div key={item._id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
            {/* Image + text always sit side by side, even on mobile —
                only the stepper/price/remove group below moves from its
                own full-width row (mobile) to inline on the right
                (desktop). Previously image and text were separate flex
                items in a column on mobile, which is not what this
                needed to look like. */}
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Link to={slug ? `/products/${slug}` : "#"} className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-mdn-charcoal2">
                {image && (
                  <img
                    src={image}
                    alt={name}
                    onError={(e) => (e.target.style.display = "none")}
                    className="h-full w-full object-cover"
                  />
                )}
              </Link>

              <div className="min-w-0">
                {brand && <p className="text-xs font-semibold uppercase tracking-wide text-mdn-green">{brand}</p>}
                <Link
                  to={slug ? `/products/${slug}` : "#"}
                  className="line-clamp-1 text-sm font-medium text-mdn-white transition-colors hover:text-mdn-green"
                >
                  {name}
                </Link>
                {(flavor || weight) && (
                  <p className="mt-0.5 truncate text-xs text-mdn-gray">{[flavor, weight].filter(Boolean).join(" · ")}</p>
                )}
                <p className="mt-1 font-mono text-xs text-mdn-gray">₹{item.priceAtAddition} each</p>
              </div>
            </div>

            {/* justify-between spreads these across the full card width on
                mobile instead of leaving a big empty gap in the middle;
                sm:justify-end pulls them into a tight right-aligned
                group once there's a row's worth of space to share with
                the image+text block instead. */}
            <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-4 sm:justify-end sm:gap-6 sm:border-t-0 sm:pt-0">
              <div className="flex shrink-0 items-center rounded-lg border border-white/10 bg-mdn-charcoal2">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  aria-label="Decrease quantity"
                  className="flex h-8 w-8 items-center justify-center rounded-l-lg text-base font-bold text-mdn-white transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  −
                </button>
                <span className="w-8 shrink-0 text-center text-sm font-semibold text-mdn-white">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                  aria-label="Increase quantity"
                  className="flex h-8 w-8 items-center justify-center rounded-r-lg text-base font-bold text-mdn-white transition-colors hover:bg-white/5"
                >
                  +
                </button>
              </div>

              <p className="shrink-0 text-right font-mono text-base font-bold text-mdn-green">
                ₹{item.priceAtAddition * item.quantity}
              </p>
              <button
                onClick={() => handleRemove(item._id)}
                className="shrink-0 text-xs font-semibold text-red-400 transition-colors hover:text-red-300"
              >
                Remove
              </button>
            </div>
          </div>
          );
        })}
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