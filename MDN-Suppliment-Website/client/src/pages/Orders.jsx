import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import MDNLoader from "../components/MDNLoader";

const STATUS_STEPS = ["placed", "confirmed", "processing", "shipped", "out_for_delivery", "delivered"];
const NON_CANCELLABLE = ["shipped", "out_for_delivery", "delivered", "cancelled", "returned"];

function StatusTimeline({ order }) {
  if (order.orderStatus === "cancelled" || order.orderStatus === "returned") {
    return (
      <p className="inline-block rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-400">
        Order {order.orderStatus}
        {order.cancelReason ? ` — ${order.cancelReason}` : ""}
      </p>
    );
  }

  const currentIndex = STATUS_STEPS.indexOf(order.orderStatus);

  return (
    <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-1">
      {STATUS_STEPS.map((step, i) => (
        <div key={step} className="flex items-center gap-1.5">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                i <= currentIndex ? "bg-mdn-green shadow-[0_0_8px_rgba(34,177,76,0.7)]" : "bg-white/15"
              }`}
            />
            <span className={`whitespace-nowrap text-[10px] uppercase tracking-wide ${i <= currentIndex ? "text-mdn-green" : "text-mdn-gray"}`}>
              {step.replace(/_/g, " ")}
            </span>
          </div>
          {i < STATUS_STEPS.length - 1 && (
            <div className={`h-px w-6 ${i < currentIndex ? "bg-mdn-green" : "bg-white/15"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// Finds the timestamp the order actually entered its current terminal
// status (cancelled / returned), falling back to updatedAt if the
// backend didn't send a statusHistory entry for it.
function getTerminalStatusDate(order) {
  const entry = order.statusHistory
    ?.slice()
    .reverse()
    .find((h) => h.status === order.orderStatus);
  return entry?.updatedAt || order.cancelledAt || order.updatedAt;
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const { token } = useAuth();
  const { success, error: toastError } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const justPlaced = location.state?.justPlaced;

  // Guards against showing the "order placed" toast more than once for
  // the same navigation — without this, React StrictMode's dev-only
  // double-invoke of effects (mount -> unmount -> remount) fires this
  // effect twice, and the router state also lingers across silent
  // re-renders / remounts, which would toast a second (or third) time.
  const justPlacedShownRef = useRef(false);

  const loadOrders = () => {
    api
      .getMyOrders(token)
      .then((data) => setOrders(data.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (justPlaced && !justPlacedShownRef.current) {
      justPlacedShownRef.current = true;
      success(`Order ${justPlaced} placed successfully!`);
      // Clear the router state so it can't trigger this toast again on
      // a later remount, refresh-back-navigation, or re-render.
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [justPlaced]);

  const handleCancel = async (orderId) => {
    const reason = window.prompt("Optional: tell us why you're cancelling (or leave blank)");
    if (reason === null) return;

    setCancellingId(orderId);
    try {
      await api.cancelOrder(token, orderId, reason || undefined);
      success("Order cancelled.");
      loadOrders();
    } catch (err) {
      toastError(err.message);
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <MDNLoader label="Loading orders" />
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center animate-fade-up">
        <OrdersGlyph />
        <h2 className="mt-6 font-display text-2xl font-bold uppercase tracking-wide text-mdn-white sm:text-3xl">
          No <span className="text-mdn-green">Orders</span> Yet
        </h2>
        <p className="mt-2 max-w-sm text-sm text-mdn-gray">
          Once you place an order, you'll be able to track it right here.
        </p>
        <Link to="/products" className="btn-primary mt-6">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-mdn-white">
        Your <span className="text-mdn-green">Orders</span>
      </h2>

      <div className="mt-6 space-y-5">
        {orders.map((order) => {
          const isTerminalCancelLike = order.orderStatus === "cancelled" || order.orderStatus === "returned";
          return (
            <div key={order._id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <strong className="text-mdn-white">{order.orderNumber}</strong>
                  <span className="ml-2 text-xs text-mdn-gray">
                    placed {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <span className="rounded-full border border-mdn-green/30 bg-mdn-green/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-mdn-green">
                  {order.orderStatus.replace(/_/g, " ")}
                </span>
              </div>

              <StatusTimeline order={order} />

              {(order.trackingNumber || order.courierPartner) && (
                <p className="mt-3 text-xs text-mdn-gray">
                  {order.courierPartner && <>Shipped via <strong className="text-mdn-white">{order.courierPartner}</strong>{" "}</>}
                  {order.trackingNumber && <>· Tracking #: <strong className="text-mdn-white">{order.trackingNumber}</strong></>}
                </p>
              )}

              {/* Cancelled / returned orders show the date it happened.
                  Every other order shows estimated / actual delivery. */}
              {isTerminalCancelLike ? (
                <p className="mt-1 text-xs text-mdn-gray">
                  {order.orderStatus === "cancelled" ? "Cancelled" : "Returned"} on{" "}
                  {new Date(getTerminalStatusDate(order)).toLocaleDateString()}
                </p>
              ) : (
                <>
                  {order.estimatedDelivery && order.orderStatus !== "delivered" && (
                    <p className="mt-1 text-xs text-mdn-gray">
                      Estimated delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}
                    </p>
                  )}
                  {order.deliveredAt && (
                    <p className="mt-1 text-xs text-mdn-gray">Delivered on {new Date(order.deliveredAt).toLocaleDateString()}</p>
                  )}
                </>
              )}

              <ul className="mt-4 divide-y divide-white/5 border-t border-white/5">
                {order.items.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 py-2">
                    <img
                      src={item.image}
                      alt={item.name}
                      onError={(e) => (e.target.style.display = "none")}
                      className="h-10 w-10 rounded-md object-cover"
                    />
                    <span className="flex-1 text-sm text-mdn-white/90">
                      {item.name} {item.flavor ? `(${item.flavor})` : ""} — {item.weight} × {item.quantity}
                    </span>
                    <span className="font-mono text-sm font-bold text-mdn-green">₹{item.price * item.quantity}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-3 text-right font-bold text-mdn-white">
                Total: <span className="text-mdn-green">₹{order.pricing.total}</span>
              </p>

              {!NON_CANCELLABLE.includes(order.orderStatus) && (
                <button
                  disabled={cancellingId === order._id}
                  onClick={() => handleCancel(order._id)}
                  className="mt-3 text-xs font-semibold text-red-400 transition-colors hover:text-red-300 disabled:opacity-50"
                >
                  {cancellingId === order._id ? "Cancelling..." : "Cancel Order"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrdersGlyph() {
  return (
    <div className="relative flex h-20 w-20 items-center justify-center">
      <div className="absolute h-20 w-20 animate-[pulse_3s_ease-in-out_infinite] rounded-full bg-mdn-green/15 blur-xl" />
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="relative text-mdn-green">
        <rect x="4" y="6" width="16" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" />
        <path d="M8 12h8M8 16h5" strokeLinecap="round" />
      </svg>
    </div>
  );
}