import { Fragment, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/api";
import { useToast } from "../context/ToastContext";
import SearchInput from "../components/SearchInput";
import MDNLoader from "../components/MDNLoader";
import { useConfirm } from "../components/ConfirmDialog";
import { hasErrors, rules } from "../utils/validators";

const STATUS_OPTIONS = [
  "placed",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
];

// Status ke hisaab se zaroori fields — server (orderStatusBody) bhi yahi maangta hai
const NEEDS_TRACKING = ["shipped", "out_for_delivery"];
const dayStart = (d) => new Date(new Date(d).toDateString());

const validateStatusForm = (form, order) => {
  const errs = {};
  if (NEEDS_TRACKING.includes(form.status)) {
    errs.trackingNumber = rules.trackingNumber(form.trackingNumber);
    errs.courierPartner = rules.courierPartner(form.courierPartner);
  } else {
    // Optional, par diya ho to format sahi ho
    if (form.trackingNumber.trim()) errs.trackingNumber = rules.trackingNumber(form.trackingNumber);
    if (form.courierPartner.trim()) errs.courierPartner = rules.courierPartner(form.courierPartner);
  }
  if (form.status === "confirmed" && !form.estimatedDelivery) {
    errs.estimatedDelivery = "Estimated delivery date is required to confirm an order";
  } else if (form.status === "confirmed" && dayStart(form.estimatedDelivery) < dayStart(order.createdAt)) {
    errs.estimatedDelivery = "Estimated delivery can't be before the order date";
  }
  if (form.status === "delivered" && form.deliveredAt) {
    if (dayStart(form.deliveredAt) < dayStart(order.createdAt)) errs.deliveredAt = "Delivered date can't be before the order date";
    else if (dayStart(form.deliveredAt) > dayStart(Date.now())) errs.deliveredAt = "Delivered date can't be in the future";
  }
  if (form.note.trim().length > 300) errs.note = "Note must be at most 300 characters";
  return Object.fromEntries(Object.entries(errs).filter(([, v]) => v));
};

const todayInput = () => new Date().toISOString().slice(0, 10);

export default function AdminOrders() {
  const { token, user } = useAuth();
  const { success, error: toastError } = useToast();
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [expandedId, setExpandedId] = useState(null);
  const [updateForm, setUpdateForm] = useState({
    status: "",
    note: "",
    trackingNumber: "",
    courierPartner: "",
    estimatedDelivery: "",
    deliveredAt: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirm, confirmDialog] = useConfirm();

  const loadOrders = () => {
    setLoading(true);
    const params = statusFilter ? { status: statusFilter } : {};
    api
      .adminGetOrders(token, params)
      .then((d) => setOrders(d.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (token) loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, statusFilter]);

  if (user && !["admin", "superadmin"].includes(user.role)) {
    return <p className="mx-auto max-w-3xl px-4 py-10 text-red-400">Admin access only.</p>;
  }

  const toDateInputValue = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d)) return "";
    return d.toISOString().slice(0, 10);
  };

  const toggleExpand = (order) => {
    if (expandedId === order._id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(order._id);
    setUpdateForm({
      status: order.orderStatus,
      note: "",
      trackingNumber: order.trackingNumber || "",
      courierPartner: order.courierPartner || "",
      estimatedDelivery: toDateInputValue(order.estimatedDelivery),
      deliveredAt: toDateInputValue(order.deliveredAt),
    });
    setFormErrors({});
    setError("");
    setMessage("");
  };

  const handleFormChange = (e) => {
    const next = { ...updateForm, [e.target.name]: e.target.value };
    setUpdateForm(next);
    // Galtiyan dikh rahi hon to type karte hi dobara check
    const order = orders.find((o) => o._id === expandedId);
    if (order && hasErrors(formErrors)) setFormErrors(validateStatusForm(next, order));
  };

  const handleUpdateStatus = async (order) => {
    if (saving) return; // double submit guard
    setError("");
    setMessage("");

    const errs = validateStatusForm(updateForm, order);
    setFormErrors(errs);
    if (hasErrors(errs)) {
      toastError(Object.values(errs)[0]);
      return;
    }

    // Admin cancel = paid order ka refund bhi — pehle confirm
    if (updateForm.status === "cancelled" && order.orderStatus !== "cancelled") {
      const ok = await confirm({
        title: `Cancel order ${order.orderNumber}?`,
        message:
          order.payment?.status === "paid"
            ? `The customer will be refunded ₹${order.pricing.total} through Razorpay. This can't be undone.`
            : "This can't be undone.",
        confirmLabel: "Cancel order",
        cancelLabel: "Keep order",
        danger: true,
      });
      if (!ok) return;
    }

    setSaving(true);
    try {
      await api.adminUpdateOrderStatus(token, order._id, {
        ...updateForm,
        trackingNumber: updateForm.trackingNumber.trim(),
        courierPartner: updateForm.courierPartner.trim(),
        note: updateForm.note.trim(),
      });
      setMessage("Order status updated.");
      success("Order status updated.");
      loadOrders();
    } catch (err) {
      setError(err.message);
      toastError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const fieldError = (name) =>
    formErrors[name] ? (
      <p id={`order-${name}-error`} role="alert" className="mt-1 text-xs text-mdn-danger">
        {formErrors[name]}
      </p>
    ) : null;
  const fieldAria = (name) => ({
    "aria-invalid": !!formErrors[name],
    "aria-describedby": formErrors[name] ? `order-${name}-error` : undefined,
  });
  const needsTracking = NEEDS_TRACKING.includes(updateForm.status);

  const filteredOrders = orders.filter((o) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      o.orderNumber?.toLowerCase().includes(q) ||
      o.user?.name?.toLowerCase().includes(q) ||
      o.user?.email?.toLowerCase().includes(q) ||
      o.trackingNumber?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <MDNLoader label="Loading orders" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <p className="text-center text-xs font-semibold uppercase tracking-widest text-mdn-green sm:text-left">
        Admin Panel
      </p>
      <h2 className="mt-1 text-center text-2xl font-bold text-mdn-white sm:text-left sm:text-3xl">Orders</h2>

      {error && <p className="mt-4 text-center text-sm text-red-400 sm:text-left">{error}</p>}
      {message && <p className="mt-4 text-center text-sm text-mdn-green sm:text-left">{message}</p>}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search order #, customer, or tracking #..."
          className="sm:max-w-xs"
        />
        <div className="flex items-center gap-2">
          <label htmlFor="order-status-filter" className="whitespace-nowrap text-sm font-medium text-mdn-white">Filter by status:</label>
          <select
            id="order-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-full sm:w-56"
          >
            <option value="">All</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[700px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-mdn-charcoal2 text-left text-xs uppercase tracking-wide text-mdn-gray">
              <th className="px-4 py-3">Order #</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Placed</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((o) => (
              <Fragment key={o._id}>
                <tr className="border-b border-white/5">
                  <td className="px-4 py-3 text-mdn-white">{o.orderNumber}</td>
                  <td className="px-4 py-3 text-mdn-gray">
                    {o.user?.name || "—"}
                    <br />
                    <span className="text-xs text-mdn-gray/70">{o.user?.email}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-mdn-green/30 bg-mdn-green/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-mdn-green">
                      {o.orderStatus.replace("_", " ")}
                    </span>
                    {/* Refunds (incl. ones done in the Razorpay dashboard) */}
                    {["refunded", "partially_refunded"].includes(o.payment?.status) && (
                      <span className="ml-1.5 mt-1 inline-block rounded-full border border-sky-400/40 bg-sky-400/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-sky-300">
                        {o.payment.status === "refunded" ? "Refunded" : "Part refunded"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold text-mdn-green">
                    ₹{o.pricing.total}
                    {o.payment?.refundedAmount > 0 && (
                      <span className="block text-[11px] font-normal text-sky-300">−₹{o.payment.refundedAmount} refunded</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-mdn-gray">{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleExpand(o)}
                      aria-expanded={expandedId === o._id}
                      aria-label={`${expandedId === o._id ? "Close" : "Manage"} order ${o.orderNumber}`}
                      className={expandedId === o._id ? "btn-secondary !px-3 !py-1.5 text-xs" : "btn-primary !px-3 !py-1.5 text-xs"}
                    >
                      {expandedId === o._id ? "Close" : "Manage"}
                    </button>
                  </td>
                </tr>

                {expandedId === o._id && (
                  <tr className="border-b border-white/5">
                    <td colSpan={6} className="bg-mdn-charcoal2/50 px-4 py-5">
                      <div className="grid gap-6 lg:grid-cols-2">
                        <div>
                          <h4 className="text-sm font-bold uppercase tracking-wide text-mdn-white">Items</h4>
                          <ul className="mt-2 space-y-1 text-sm text-mdn-gray">
                            {o.items.map((item, i) => (
                              <li key={i}>
                                {item.name} {item.flavor ? `(${item.flavor})` : ""} — {item.weight} × {item.quantity} = ₹
                                {item.price * item.quantity}
                              </li>
                            ))}
                          </ul>

                          <h4 className="mt-4 text-sm font-bold uppercase tracking-wide text-mdn-white">
                            Shipping address
                          </h4>
                          <p className="mt-2 text-sm text-mdn-gray">
                            {o.shippingAddress.fullName} — {o.shippingAddress.phone}
                            <br />
                            {o.shippingAddress.line1}
                            {o.shippingAddress.line2 ? `, ${o.shippingAddress.line2}` : ""}
                            <br />
                            {[o.shippingAddress.city, o.shippingAddress.district, o.shippingAddress.state].filter(Boolean).join(", ")}{" "}
                            {o.shippingAddress.pincode}
                          </p>

                          {o.orderStatus === "cancelled" || o.orderStatus === "returned" ? (
                            <p className="mt-2 text-sm text-mdn-gray">
                              <strong className="text-mdn-white">
                                {o.orderStatus === "cancelled" ? "Cancelled on:" : "Returned on:"}
                              </strong>{" "}
                              {new Date(
                                o.statusHistory?.slice().reverse().find((h) => h.status === o.orderStatus)
                                  ?.updatedAt || o.updatedAt
                              ).toLocaleDateString()}
                            </p>
                          ) : (
                            <>
                              {o.estimatedDelivery && o.orderStatus !== "delivered" && (
                                <p className="mt-2 text-sm text-mdn-gray">
                                  <strong className="text-mdn-white">Estimated delivery:</strong>{" "}
                                  {new Date(o.estimatedDelivery).toLocaleDateString()}
                                </p>
                              )}
                              {o.deliveredAt && (
                                <p className="mt-2 text-sm text-mdn-gray">
                                  <strong className="text-mdn-white">Delivered on:</strong>{" "}
                                  {new Date(o.deliveredAt).toLocaleDateString()}
                                </p>
                              )}
                            </>
                          )}

                          <h4 className="mt-4 text-sm font-bold uppercase tracking-wide text-mdn-white">
                            Status history
                          </h4>
                          <ul className="mt-2 space-y-1 text-sm text-mdn-gray">
                            {o.statusHistory?.map((h, i) => (
                              <li key={i}>
                                <span className="rounded-full border border-mdn-green/30 bg-mdn-green/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-mdn-green">
                                  {h.status.replace("_", " ")}
                                </span>{" "}
                                {h.note && <span>— {h.note}</span>}{" "}
                                <span className="text-xs text-mdn-gray/70">
                                  {new Date(h.updatedAt).toLocaleString()}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold uppercase tracking-wide text-mdn-white">Update status</h4>
                          <div className="mt-3 space-y-3">
                            <div>
                              <label htmlFor="order-status" className="mb-1 block text-xs font-medium text-mdn-gray">Status</label>
                              <select
                                id="order-status"
                                name="status"
                                value={updateForm.status}
                                onChange={handleFormChange}
                                className="input-field w-full"
                              >
                                {STATUS_OPTIONS.map((s) => (
                                  <option key={s} value={s}>
                                    {s.replace("_", " ")}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label htmlFor="order-tracking" className="mb-1 block text-xs font-medium text-mdn-gray">
                                Tracking number {needsTracking && <span className="text-red-400">*</span>}
                              </label>
                              <input
                                id="order-tracking"
                                name="trackingNumber"
                                placeholder="e.g. AWB1234567890"
                                value={updateForm.trackingNumber}
                                onChange={handleFormChange}
                                maxLength={60}
                                autoComplete="off"
                                spellCheck={false}
                                required={needsTracking}
                                {...fieldAria("trackingNumber")}
                                className={`input-field w-full ${formErrors.trackingNumber ? "!border-red-500/60" : ""}`}
                              />
                              {fieldError("trackingNumber")}
                            </div>

                            <div>
                              <label htmlFor="order-courier" className="mb-1 block text-xs font-medium text-mdn-gray">
                                Courier partner {needsTracking && <span className="text-red-400">*</span>}
                              </label>
                              <input
                                id="order-courier"
                                name="courierPartner"
                                placeholder="e.g. Delhivery, Bluedart"
                                value={updateForm.courierPartner}
                                onChange={handleFormChange}
                                maxLength={60}
                                required={needsTracking}
                                {...fieldAria("courierPartner")}
                                className={`input-field w-full ${formErrors.courierPartner ? "!border-red-500/60" : ""}`}
                              />
                              {fieldError("courierPartner")}
                            </div>

                            {updateForm.status === "confirmed" && (
                              <div>
                                <label htmlFor="order-eta" className="mb-1 block text-xs font-medium text-mdn-gray">
                                  Estimated delivery date <span className="text-red-400">*</span>
                                </label>
                                <input
                                  id="order-eta"
                                  type="date"
                                  name="estimatedDelivery"
                                  min={toDateInputValue(o.createdAt)}
                                  value={updateForm.estimatedDelivery}
                                  onChange={handleFormChange}
                                  required
                                  {...fieldAria("estimatedDelivery")}
                                  className={`input-field w-full ${
                                    !updateForm.estimatedDelivery ? "border-red-500/50" : ""
                                  }`}
                                />
                                {fieldError("estimatedDelivery") || (
                                  <p className="mt-1 text-xs text-mdn-gray/70">
                                    The date the delivery partner is expected to arrive. Required to confirm this order.
                                  </p>
                                )}
                              </div>
                            )}

                            {updateForm.status === "delivered" && (
                              <div>
                                <label htmlFor="order-delivered" className="mb-1 block text-xs font-medium text-mdn-gray">Delivered date</label>
                                <input
                                  id="order-delivered"
                                  type="date"
                                  name="deliveredAt"
                                  min={toDateInputValue(o.createdAt)}
                                  max={todayInput()}
                                  value={updateForm.deliveredAt}
                                  onChange={handleFormChange}
                                  {...fieldAria("deliveredAt")}
                                  className={`input-field w-full ${formErrors.deliveredAt ? "!border-red-500/60" : ""}`}
                                />
                                {fieldError("deliveredAt") || (
                                  <p className="mt-1 text-xs text-mdn-gray/70">Leave blank to use today's date.</p>
                                )}
                              </div>
                            )}

                            <div>
                              <label htmlFor="order-note" className="mb-1 block text-xs font-medium text-mdn-gray">Note (optional)</label>
                              <input
                                id="order-note"
                                name="note"
                                placeholder="Internal note for this status change"
                                value={updateForm.note}
                                onChange={handleFormChange}
                                maxLength={300}
                                {...fieldAria("note")}
                                className="input-field w-full"
                              />
                              {fieldError("note")}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(o)}
                              disabled={saving || (updateForm.status === "confirmed" && !updateForm.estimatedDelivery)}
                              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                            >
                              {saving ? "Saving..." : "Save Update"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-mdn-gray">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {confirmDialog}
    </div>
  );
}