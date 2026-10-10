import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/api";
import { useToast } from "../context/ToastContext";
import { useConfirm } from "../components/ConfirmDialog";
import { blockNonPriceKeys, hasErrors, LIMITS, numberRule, rules, validateFields } from "../utils/validators";

// Coupon form ke rules — server (couponCreateBody) bhi yahi check karta hai
const COUPON_RULES = {
  code: rules.couponCode,
  discountValue: (v, f) =>
    numberRule(f.discountType === "percentage" ? "Discount %" : "Discount amount", {
      gt: 0,
      max: f.discountType === "percentage" ? 100 : 100000,
    })(v),
  minOrderValue: numberRule("Minimum order value", { min: 0, max: 1000000, optional: true }),
  maxDiscount: (v, f) => (f.discountType === "percentage" ? numberRule("Max discount", { gt: 0, max: 1000000, optional: true })(v) : ""),
  expiresAt: (v, f) => {
    if (!v) return "";
    if (Number.isNaN(Date.parse(v))) return "Pick a valid date";
    // Naya coupon pehle se expired nahi ho sakta (purane edit karte waqt chhoot)
    const today = new Date().toISOString().slice(0, 10);
    return !f._editing && v < today ? "Expiry date can't be in the past" : "";
  },
};

const emptyForm = {
  code: "",
  discountType: "percentage",
  discountValue: "",
  minOrderValue: "",
  maxDiscount: "",
  expiresAt: "",
};

export default function AdminCoupons() {
  const { token, user } = useAuth();
  const { success, error: toastError } = useToast();
  const [coupons, setCoupons] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState(null);
  const [confirm, confirmDialog] = useConfirm();

  const loadCoupons = () => {
    setLoading(true);
    api
      .adminGetCoupons(token)
      .then((d) => setCoupons(d.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (token) loadCoupons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (user && !["admin", "superadmin"].includes(user.role)) {
    return <p className="mx-auto max-w-3xl px-4 py-10 text-red-400">Admin access only.</p>;
  }

  const values = { ...form, _editing: !!editingId };
  const checkField = (name, v = values) => COUPON_RULES[name]?.(v[name], v) || "";

  const handleChange = (e) => {
    const { name } = e.target;
    // Code: sirf A-Z 0-9, apne aap capital
    const value = name === "code" ? e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") : e.target.value;
    const next = { ...form, [name]: value };
    setForm(next);
    if (fieldErrors[name]) setFieldErrors((fe) => ({ ...fe, [name]: checkField(name, { ...next, _editing: !!editingId }) }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setFieldErrors((fe) => ({ ...fe, [name]: checkField(name) }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFieldErrors({});
  };

  const startEdit = (coupon) => {
    setForm({
      code: coupon.code || "",
      discountType: coupon.discountType || "percentage",
      discountValue: coupon.discountValue ?? "",
      minOrderValue: coupon.minOrderValue ?? "",
      maxDiscount: coupon.maxDiscount ?? "",
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : "",
    });
    setEditingId(coupon._id);
    setFieldErrors({});
    setError("");
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return; // double submit guard
    setError("");
    setMessage("");

    const errs = validateFields(values, COUPON_RULES);
    setFieldErrors(errs);
    if (hasErrors(errs)) {
      toastError("Some fields need fixing — please check the form.");
      return;
    }

    const payload = {
      code: form.code.toUpperCase().trim(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : 0,
      maxDiscount: form.discountType === "percentage" && form.maxDiscount ? Number(form.maxDiscount) : undefined,
      expiresAt: form.expiresAt || undefined,
    };

    setSaving(true);
    try {
      if (editingId) {
        await api.adminUpdateCoupon(token, editingId, payload);
        setMessage("Coupon updated.");
        success("Coupon updated successfully.");
      } else {
        await api.adminCreateCoupon(token, payload);
        setMessage("Coupon created.");
        success("Coupon created successfully.");
      }
      resetForm();
      loadCoupons();
    } catch (err) {
      setError(err.message);
      toastError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (coupon) => {
    if (deactivatingId) return;
    const ok = await confirm({
      title: `Deactivate ${coupon.code}?`,
      message: "Customers will no longer be able to apply this coupon.",
      confirmLabel: "Deactivate",
      danger: true,
    });
    if (!ok) return;
    const id = coupon._id;
    setError("");
    setMessage("");
    setDeactivatingId(id);
    try {
      await api.adminDeleteCoupon(token, id);
      setMessage("Coupon deactivated.");
      success("Coupon deactivated.");
      loadCoupons();
    } catch (err) {
      setError(err.message);
      toastError(err.message);
    } finally {
      setDeactivatingId(null);
    }
  };

  const err = (name) =>
    fieldErrors[name] ? (
      <p id={`coupon-${name}-error`} role="alert" className="mt-1 text-xs text-mdn-danger">
        {fieldErrors[name]}
      </p>
    ) : null;
  const errClass = (name) => (fieldErrors[name] ? "!border-mdn-danger/60" : "");
  const describedBy = (name) => (fieldErrors[name] ? `coupon-${name}-error` : undefined);
  const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-wide text-mdn-gray";

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="h-24 animate-pulse rounded-xl bg-mdn-charcoal2" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <p className="text-center text-xs font-semibold uppercase tracking-widest text-mdn-green sm:text-left">
        Admin Panel
      </p>
      <h2 className="mt-1 text-center text-2xl font-bold text-mdn-white sm:text-left sm:text-3xl">Coupons</h2>

      {error && <p className="mt-4 text-center text-sm text-red-400 sm:text-left">{error}</p>}
      {message && <p className="mt-4 text-center text-sm text-mdn-green sm:text-left">{message}</p>}

      <div className="card mt-8 p-6">
        <h3 className="text-lg font-bold text-mdn-white">{editingId ? "Edit Coupon" : "Create Coupon"}</h3>
        <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
          <div>
            <label htmlFor="coupon-code" className={labelClass}>
              Coupon code <span className="text-mdn-danger">*</span>
            </label>
            <input
              id="coupon-code"
              name="code"
              placeholder="e.g. WELCOME10"
              value={form.code}
              onChange={handleChange}
              onBlur={handleBlur}
              maxLength={LIMITS.couponMax}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              required
              aria-invalid={!!fieldErrors.code}
              aria-describedby={describedBy("code")}
              className={`input-field w-full ${errClass("code")}`}
            />
            {err("code")}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="coupon-type" className={labelClass}>
                Discount type
              </label>
              <select
                id="coupon-type"
                name="discountType"
                value={form.discountType}
                onChange={handleChange}
                className="input-field"
              >
                <option value="percentage">Percentage off</option>
                <option value="flat">Flat amount off</option>
              </select>
            </div>
            <div>
              <label htmlFor="coupon-value" className={labelClass}>
                {form.discountType === "percentage" ? "Discount % (1-100)" : "Discount amount (₹)"} <span className="text-mdn-danger">*</span>
              </label>
              <input
                id="coupon-value"
                name="discountValue"
                type="number"
                inputMode="decimal"
                min="0"
                max={form.discountType === "percentage" ? 100 : undefined}
                step="any"
                value={form.discountValue}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={blockNonPriceKeys}
                required
                aria-invalid={!!fieldErrors.discountValue}
                aria-describedby={describedBy("discountValue")}
                className={`input-field ${errClass("discountValue")}`}
              />
              {err("discountValue")}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="coupon-min" className={labelClass}>
                Minimum order value (₹, optional)
              </label>
              <input
                id="coupon-min"
                name="minOrderValue"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={form.minOrderValue}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={blockNonPriceKeys}
                aria-invalid={!!fieldErrors.minOrderValue}
                aria-describedby={describedBy("minOrderValue")}
                className={`input-field ${errClass("minOrderValue")}`}
              />
              {err("minOrderValue")}
            </div>
            {form.discountType === "percentage" && (
              <div>
                <label htmlFor="coupon-max" className={labelClass}>
                  Max discount cap (₹, optional)
                </label>
                <input
                  id="coupon-max"
                  name="maxDiscount"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  value={form.maxDiscount}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onKeyDown={blockNonPriceKeys}
                  aria-invalid={!!fieldErrors.maxDiscount}
                  aria-describedby={describedBy("maxDiscount")}
                  className={`input-field ${errClass("maxDiscount")}`}
                />
                {err("maxDiscount")}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="coupon-expiry" className={labelClass}>
              Expiry date (optional)
            </label>
            <input
              id="coupon-expiry"
              name="expiresAt"
              type="date"
              min={editingId ? undefined : new Date().toISOString().slice(0, 10)}
              value={form.expiresAt}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={!!fieldErrors.expiresAt}
              aria-describedby={describedBy("expiresAt")}
              className={`input-field w-full sm:w-auto ${errClass("expiresAt")}`}
            />
            {err("expiresAt")}
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button type="submit" disabled={saving} className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
              {saving ? "Saving..." : editingId ? "Save Changes" : "Create Coupon"}
            </button>
            {editingId && (
              <button type="button" disabled={saving} className="btn-secondary w-full sm:w-auto" onClick={resetForm}>
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-bold text-mdn-white">Existing Coupons ({coupons.length})</h3>
        <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-mdn-charcoal2 text-left text-xs uppercase tracking-wide text-mdn-gray">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Min Order</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c._id} className={`border-b border-white/5 ${!c.isActive ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3 font-semibold text-mdn-white">{c.code}</td>
                  <td className="px-4 py-3 text-mdn-gray">
                    {c.discountType === "percentage" ? `${c.discountValue}%` : `₹${c.discountValue}`}
                  </td>
                  <td className="px-4 py-3 text-mdn-gray">{c.minOrderValue ? `₹${c.minOrderValue}` : "—"}</td>
                  <td className="px-4 py-3 text-mdn-gray">
                    {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "No expiry"}
                  </td>
                  <td className="px-4 py-3 text-mdn-gray">{c.isActive ? "Active" : "Inactive"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => startEdit(c)} aria-label={`Edit coupon ${c.code}`} className="btn-secondary !px-3 !py-1 text-xs">
                        Edit
                      </button>
                      {c.isActive && (
                        <button
                          type="button"
                          onClick={() => handleDeactivate(c)}
                          disabled={deactivatingId === c._id}
                          aria-label={`Deactivate coupon ${c.code}`}
                          className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                        >
                          {deactivatingId === c._id ? "Deactivating..." : "Deactivate"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-mdn-gray">
                    No coupons yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {confirmDialog}
    </div>
  );
}