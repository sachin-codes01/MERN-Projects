import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useTheme } from "../context/ThemeContext";
import { api } from "../api/api";
import MDNLoader from "../components/MDNLoader";
import ThemeToggle from "../components/ThemeToggle";
import AddressFields, { Field, inputClass } from "../components/AddressFields";
import { useConfirm } from "../components/ConfirmDialog";
import { addressRules, cleanAddress, hasErrors, LIMITS, rules, validateFields } from "../utils/validators";

const PROFILE_RULES = { ...addressRules, label: rules.label };

const emptyAddressForm = {
  label: "Home", fullName: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "", country: "India",
};

export default function Profile() {
  const { token, user, logout } = useAuth();
  const { success, error: toastError } = useToast();
  const { isDark } = useTheme();
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
  const [settingDefaultId, setSettingDefaultId] = useState(null);
  // Same fix as Navbar.jsx: some Google avatar URLs fail to load, and a
  // failed <img> falls back to the browser's broken-image glyph + alt
  // text instead of the letter-avatar badge — this tracks that failure
  // so we can swap in the fallback ourselves.
  const [avatarBroken, setAvatarBroken] = useState(false);
  const [confirm, confirmDialog] = useConfirm();

  useEffect(() => {
    setAvatarBroken(false);
  }, [user?.avatar]);

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
    const next = {
      label: addr.label || "Home",
      fullName: addr.fullName || "",
      phone: addr.phone || "",
      line1: addr.line1 || "",
      line2: addr.line2 || "",
      city: addr.city || "",
      state: addr.state || "",
      pincode: addr.pincode || "",
      country: addr.country || "India",
    };
    setForm(next);
    // Purane address ki galtiyan edit kholte hi dikha do
    setFieldErrors(validateFields(next, PROFILE_RULES));
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyAddressForm);
    setFieldErrors({});
  };

  const checkField = (name, values = form) => PROFILE_RULES[name]?.(values[name], values) || "";

  const handleChange = (name, value) => {
    const next = { ...form, [name]: value };
    setForm(next);
    if (fieldErrors[name]) setFieldErrors((fe) => ({ ...fe, [name]: checkField(name, next) }));
  };

  const handleBlur = (name) => setFieldErrors((fe) => ({ ...fe, [name]: checkField(name) }));

  const validate = () => {
    const errs = validateFields(form, PROFILE_RULES);
    setFieldErrors(errs);
    return !hasErrors(errs);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (saving) return; // double submit guard
    if (!validate()) {
      toastError("Some fields need fixing — please check the highlighted fields.");
      return;
    }

    // Sirf address fields, trim karke — server inke alawa kuch accept nahi karta
    const payload = { ...cleanAddress(form), label: form.label.trim() || "Home" };
    setSaving(true);
    try {
      if (editingId) {
        await api.updateAddress(token, editingId, payload);
        success("Address updated.");
      } else {
        await api.addAddress(token, payload);
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

  const handleDelete = async (addr) => {
    if (deletingId) return;
    const ok = await confirm({
      title: "Delete this address?",
      message: `${addr.label || "Address"}: ${addr.line1}, ${addr.city}. This can't be undone.`,
      confirmLabel: "Delete address",
      danger: true,
    });
    if (!ok) return;
    const addressId = addr._id;
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

  const handleSetDefault = async (addressId) => {
    if (settingDefaultId) return;
    setSettingDefaultId(addressId);
    try {
      await api.updateAddress(token, addressId, { isDefault: true });
      success("Default address updated.");
      loadAddresses();
    } catch (err) {
      toastError(err.message);
    } finally {
      setSettingDefaultId(null);
    }
  };

  if (loading) {
    return <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6"><MDNLoader label="Loading profile" /></div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h2 className="display-xl">My Profile</h2>

      {/* User info card */}
      <div className="card mt-6 flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
        {user?.avatar && !avatarBroken ? (
          <img
            src={user.avatar}
            alt={user.name}
            onError={() => setAvatarBroken(true)}
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

      {/* Appearance */}
      <div className="card mt-6 flex items-center justify-between p-5">
        <div>
          <p className="font-heading text-base font-semibold text-mdn-ink">Appearance</p>
          <p className="mt-1 text-sm text-mdn-gray">
            {isDark ? "Dark mode — black & green." : "Light mode — white, silver & green."}
          </p>
        </div>
        <ThemeToggle />
      </div>

      {/* Saved addresses */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-base font-semibold text-mdn-ink">Saved Addresses</h3>
          {!formOpen && (
            <button type="button" onClick={openAddForm} className="btn-primary !px-4 !py-1.5 text-xs">
              + Add Address
            </button>
          )}
        </div>

        {error && <p className="mt-2 text-sm text-mdn-danger">{error}</p>}

        {/* Add / Edit form */}
        {formOpen && (
          <form onSubmit={handleSaveAddress} noValidate className="card mt-4 space-y-4 p-4 sm:p-5">
            <h4 className="font-heading text-base font-semibold text-mdn-ink">
              {editingId ? "Edit Address" : "New Address"}
            </h4>

            <Field id="profile-label" label="Label" optional error={fieldErrors.label}>
              <input
                id="profile-label"
                name="label"
                placeholder="e.g. Home, Office"
                value={form.label}
                onChange={(e) => handleChange("label", e.target.value)}
                onBlur={() => handleBlur("label")}
                maxLength={LIMITS.labelMax}
                autoComplete="off"
                className={inputClass(fieldErrors.label)}
              />
            </Field>

            <AddressFields
              idPrefix="profile"
              values={form}
              errors={fieldErrors}
              onChange={handleChange}
              onBlur={handleBlur}
            />

            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary !px-6 text-sm disabled:cursor-not-allowed disabled:opacity-50">
                {saving ? "Saving..." : editingId ? "Update Address" : "Save Address"}
              </button>
              <button type="button" onClick={closeForm} disabled={saving} className="btn-secondary !px-6 text-sm">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Address list */}
        {addresses.length === 0 && !formOpen ? (
          <p className="mt-3 text-sm text-mdn-gray">
            No saved addresses yet. Click "+ Add Address" to add one.
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

                <div className="mt-3 flex flex-wrap gap-3 pt-1">
                  {!addr.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(addr._id)}
                      disabled={settingDefaultId === addr._id}
                      className="text-xs font-semibold text-mdn-silver hover:underline disabled:opacity-50"
                    >
                      {settingDefaultId === addr._id ? "Setting..." : "Set as Default"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openEditForm(addr)}
                    aria-label={`Edit ${addr.label || "address"}`}
                    className="text-xs font-semibold text-mdn-green hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(addr)}
                    disabled={deletingId === addr._id}
                    aria-label={`Delete ${addr.label || "address"}`}
                    className="text-xs font-semibold text-mdn-danger hover:underline disabled:opacity-50"
                  >
                    {deletingId === addr._id ? "Removing..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button type="button" onClick={handleLogout} className="btn-secondary mt-8 !px-6 text-mdn-danger hover:!border-mdn-danger/50">
        Logout
      </button>

      {confirmDialog}
    </div>
  );
}
