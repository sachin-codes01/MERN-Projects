import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/api";
import { useToast } from "../context/ToastContext";

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

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
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
    setError("");
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const payload = {
      code: form.code.toUpperCase().trim(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : 0,
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
      expiresAt: form.expiresAt || undefined,
    };

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
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm("Deactivate this coupon? Customers will no longer be able to apply it.")) return;
    setError("");
    setMessage("");
    try {
      await api.adminDeleteCoupon(token, id);
      setMessage("Coupon deactivated.");
      success("Coupon deactivated.");
      loadCoupons();
    } catch (err) {
      setError(err.message);
      toastError(err.message);
    }
  };

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
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <input
            name="code"
            placeholder="Coupon code (e.g. WELCOME10)"
            value={form.code}
            onChange={handleChange}
            required
            className="input-field w-full"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <select name="discountType" value={form.discountType} onChange={handleChange} className="input-field">
              <option value="percentage">Percentage off</option>
              <option value="flat">Flat amount off</option>
            </select>
            <input
              name="discountValue"
              type="number"
              placeholder={form.discountType === "percentage" ? "Discount %" : "Discount amount (₹)"}
              value={form.discountValue}
              onChange={handleChange}
              required
              className="input-field"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <input
              name="minOrderValue"
              type="number"
              placeholder="Minimum order value (optional)"
              value={form.minOrderValue}
              onChange={handleChange}
              className="input-field"
            />
            {form.discountType === "percentage" && (
              <input
                name="maxDiscount"
                type="number"
                placeholder="Max discount cap (optional)"
                value={form.maxDiscount}
                onChange={handleChange}
                className="input-field"
              />
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-mdn-white">Expiry date (optional)</label>
            <input
              name="expiresAt"
              type="date"
              value={form.expiresAt}
              onChange={handleChange}
              className="input-field w-full sm:w-auto"
            />
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button type="submit" className="btn-primary w-full sm:w-auto">
              {editingId ? "Save Changes" : "Create Coupon"}
            </button>
            {editingId && (
              <button type="button" className="btn-secondary w-full sm:w-auto" onClick={resetForm}>
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
                      <button onClick={() => startEdit(c)} className="btn-secondary !px-3 !py-1 text-xs">
                        Edit
                      </button>
                      {c.isActive && (
                        <button
                          onClick={() => handleDeactivate(c._id)}
                          className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20"
                        >
                          Deactivate
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
    </div>
  );
}