import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api } from "../api/api";
import MDNLoader from "../components/MDNLoader";

const PHONE_REGEX = /^[6-9]\d{9}$/;
const PINCODE_REGEX = /^\d{6}$/;

const emptyAddressForm = {
  label: "Home", fullName: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "", country: "India",
};

export default function Profile() {
  const { token, user, logout } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = adding new
  const [form, setForm] = useState(emptyAddressForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadAddresses = () => {
    setLoading(true);
    api
      .getMyAddresses(token)
      .then((data) => setAddresses(data.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleLogout = () => {
    logout();
    success("Logged out.");
    navigate("/login");
  };

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyAddressForm);
    setFieldErrors({});
    setFormOpen(true);
  };

  const openEditForm = (addr) => {
    setEditingId(addr._id);
    setForm({
      label: addr.label || "Home",
      fullName: addr.fullName || "",
      phone: addr.phone || "",
      line1: addr.line1 || "",
      line2: addr.line2 || "",
      city: addr.city || "",
      state: addr.state || "",
      pincode: addr.pincode || "",
      country: addr.country || "India",
    });
    setFieldErrors({});
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyAddressForm);
    setFieldErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((fe) => ({ ...fe, [name]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = "Naam zaroori hai.";
    if (!form.phone.trim()) errs.phone = "Phone number zaroori hai.";
    else if (!PHONE_REGEX.test(form.phone.trim())) errs.phone = "Valid 10-digit mobile number daalein.";
    if (!form.line1.trim()) errs.line1 = "Address zaroori hai.";
    if (!form.city.trim()) errs.city = "City zaroori hai.";
    if (!form.state.trim()) errs.state = "State zaroori hai.";
    if (!form.pincode.trim()) errs.pincode = "Pincode zaroori hai.";
    else if (!PINCODE_REGEX.test(form.pincode.trim())) errs.pincode = "Valid 6-digit pincode daalein.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toastError("Form me kuch fields sahi nahi hain, check karein.");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await api.updateAddress(token, editingId, form);
        success("Address updated.");
      } else {
        await api.addAddress(token, form);
        success("Address added.");
      }
      closeForm();
      loadAddresses();
    } catch (err) {
      toastError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (addressId) => {
    if (!window.confirm("Ye address delete karna chahte hain?")) return;
    setDeletingId(addressId);
    try {
      await api.deleteAddress(token, addressId);
      success("Address removed.");
      loadAddresses();
    } catch (err) {
      toastError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const fieldClass = (name) =>
    `input-field ${fieldErrors[name] ? "!border-red-500/60 focus:!border-red-500 focus:!ring-red-500/25" : ""}`;

  if (loading) {
    return <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6"><MDNLoader label="Loading profile" /></div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-mdn-white">My Profile</h2>

      {/* User info card */}
      <div className="card mt-6 flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="h-20 w-20 rounded-full border-2 border-mdn-green/40 object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-mdn-green/40 bg-mdn-charcoal2 text-2xl font-bold text-mdn-green">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
        )}
        <div>
          <p className="text-lg font-bold text-mdn-white">{user?.name}</p>
          <p className="text-sm text-mdn-gray">{user?.email}</p>
          {user?.role && user.role !== "customer" && (
            <span className="mt-1 inline-block rounded-full bg-mdn-green/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-mdn-green">
              {user.role}
            </span>
          )}
        </div>
      </div>

      {/* Saved addresses */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wide text-mdn-white">Saved Addresses</h3>
          {!formOpen && (
            <button onClick={openAddForm} className="btn-primary !px-4 !py-1.5 text-xs">
              + Add Address
            </button>
          )}
        </div>

        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

        {/* Add / Edit form */}
        {formOpen && (
          <form onSubmit={handleSaveAddress} noValidate className="card mt-4 space-y-4 p-4 sm:p-5">
            <h4 className="text-sm font-bold uppercase tracking-wide text-mdn-white">
              {editingId ? "Edit Address" : "New Address"}
            </h4>

            <div className="grid gap-4 sm:grid-cols-2">
              <input
                name="label"
                placeholder="Label (e.g. Home, Office)"
                value={form.label}
                onChange={handleChange}
                className="input-field"
              />
              <div>
                <input name="fullName" placeholder="Full name" value={form.fullName} onChange={handleChange} className={fieldClass("fullName")} />
                {fieldErrors.fullName && <p className="mt-1 text-xs text-red-400">{fieldErrors.fullName}</p>}
              </div>
            </div>

            <div>
              <input name="phone" placeholder="Phone number" value={form.phone} onChange={handleChange} className={fieldClass("phone")} />
              {fieldErrors.phone && <p className="mt-1 text-xs text-red-400">{fieldErrors.phone}</p>}
            </div>

            <div>
              <input name="line1" placeholder="Address" value={form.line1} onChange={handleChange} className={`${fieldClass("line1")} w-full`} />
              {fieldErrors.line1 && <p className="mt-1 text-xs text-red-400">{fieldErrors.line1}</p>}
            </div>
            <input name="line2" placeholder="Address line 2 (optional)" value={form.line2} onChange={handleChange} className="input-field w-full" />

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <input name="city" placeholder="City" value={form.city} onChange={handleChange} className={fieldClass("city")} />
                {fieldErrors.city && <p className="mt-1 text-xs text-red-400">{fieldErrors.city}</p>}
              </div>
              <div>
                <input name="state" placeholder="State" value={form.state} onChange={handleChange} className={fieldClass("state")} />
                {fieldErrors.state && <p className="mt-1 text-xs text-red-400">{fieldErrors.state}</p>}
              </div>
              <div>
                <input name="pincode" placeholder="Pincode" value={form.pincode} onChange={handleChange} className={fieldClass("pincode")} />
                {fieldErrors.pincode && <p className="mt-1 text-xs text-red-400">{fieldErrors.pincode}</p>}
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary !px-6 text-sm">
                {saving ? "Saving..." : editingId ? "Update Address" : "Save Address"}
              </button>
              <button type="button" onClick={closeForm} className="btn-secondary !px-6 text-sm">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Address list */}
        {addresses.length === 0 && !formOpen ? (
          <p className="mt-3 text-sm text-mdn-gray">
            Koi saved address nahi hai. "+ Add Address" par click karein.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {addresses.map((addr) => (
              <div key={addr._id} className="card space-y-1 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-mdn-white">{addr.label || "Address"}</p>
                  {addr.isDefault && (
                    <span className="rounded-full bg-mdn-green/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-mdn-green">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-sm text-mdn-gray">{addr.fullName}</p>
                <p className="text-sm text-mdn-gray">{addr.phone}</p>
                <p className="text-sm text-mdn-gray">
                  {addr.line1}
                  {addr.line2 ? `, ${addr.line2}` : ""}
                </p>
                <p className="text-sm text-mdn-gray">
                  {addr.city}, {addr.state} - {addr.pincode}
                </p>
                <p className="text-sm text-mdn-gray">{addr.country}</p>

                <div className="mt-3 flex gap-3 pt-1">
                  <button
                    onClick={() => openEditForm(addr)}
                    className="text-xs font-semibold text-mdn-green hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(addr._id)}
                    disabled={deletingId === addr._id}
                    className="text-xs font-semibold text-red-400 hover:underline disabled:opacity-50"
                  >
                    {deletingId === addr._id ? "Removing..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={handleLogout} className="btn-secondary mt-8 !px-6 text-red-400 hover:!border-red-500/50">
        Logout
      </button>
    </div>
  );
}