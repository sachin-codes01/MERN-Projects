import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api } from "../api/api";
import MDNLoader from "../components/MDNLoader";
import SearchInput from "../components/SearchInput";
import { useConfirm } from "../components/ConfirmDialog";

// Delivery areas — jin pincodes pe shipping hoti hai. Checkout pe customer
// ka pincode is list me na ho to "Shipping not available" aur payment band.

const PINCODE_RE = /^[1-9]\d{5}$/;
const MAX_PER_ADD = 500;

// "110001, 110002\n201301 201304" → saare tokens alag-alag
const parsePincodes = (text) =>
  text
    .split(/[\s,;]+/)
    .map((t) => t.trim())
    .filter(Boolean);

export default function AdminPincodes() {
  const { token, user } = useAuth();
  const { success, error: toastError } = useToast();
  const [confirm, confirmDialog] = useConfirm();

  const [pincodes, setPincodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [input, setInput] = useState("");
  const [area, setArea] = useState("");
  const [inputError, setInputError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadPincodes = () => {
    setLoading(true);
    api
      .adminGetPincodes(token)
      .then((d) => setPincodes(d.data))
      .catch((err) => toastError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (token) loadPincodes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const tokens = useMemo(() => parsePincodes(input), [input]);
  const invalid = tokens.filter((t) => !PINCODE_RE.test(t));
  const valid = [...new Set(tokens.filter((t) => PINCODE_RE.test(t)))];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pincodes;
    return pincodes.filter((p) => p.pincode.includes(q) || (p.area || "").toLowerCase().includes(q));
  }, [pincodes, search]);

  if (user && !["admin", "superadmin"].includes(user.role)) {
    return <p className="mx-auto max-w-3xl px-4 py-10 text-mdn-danger">Admin access only.</p>;
  }

  const handleAdd = async (e) => {
    e.preventDefault();
    if (saving) return; // double submit guard

    let msg = "";
    if (!tokens.length) msg = "Enter at least one pincode";
    else if (invalid.length) msg = `Not valid 6-digit pincodes: ${invalid.slice(0, 5).join(", ")}${invalid.length > 5 ? "…" : ""}`;
    else if (valid.length > MAX_PER_ADD) msg = `Add at most ${MAX_PER_ADD} pincodes at a time`;
    else if (area.trim().length > 80) msg = "Area must be at most 80 characters";
    setInputError(msg);
    if (msg) return;

    setSaving(true);
    try {
      const { data } = await api.adminAddPincodes(token, { pincodes: valid, area: area.trim() });
      const added = data.added.length;
      const skipped = data.skipped.length;
      success(
        added
          ? `${added} pincode${added > 1 ? "s" : ""} added${skipped ? ` · ${skipped} already in the list` : ""}`
          : "All of these pincodes were already in the list"
      );
      setInput("");
      setArea("");
      loadPincodes();
    } catch (err) {
      setInputError(err.message);
      toastError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p) => {
    if (deletingId) return;
    const ok = await confirm({
      title: `Stop delivering to ${p.pincode}?`,
      message: "Customers with this pincode won't be able to place an order until you add it back.",
      confirmLabel: "Remove pincode",
      danger: true,
    });
    if (!ok) return;
    setDeletingId(p._id);
    try {
      await api.adminDeletePincode(token, p._id);
      success(`${p.pincode} removed`);
      setPincodes((list) => list.filter((x) => x._id !== p._id));
    } catch (err) {
      toastError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <p className="text-center text-xs font-semibold uppercase tracking-widest text-mdn-green sm:text-left">Admin Panel</p>
      <h2 className="mt-1 text-center text-2xl font-bold text-mdn-white sm:text-left sm:text-3xl">Delivery Pincodes</h2>
      <p className="mt-2 text-center text-sm text-mdn-gray sm:text-left">
        Customers can only check out to pincodes in this list. Anywhere else shows "Shipping not available".
      </p>

      {!loading && pincodes.length === 0 && (
        <p role="alert" className="mt-4 rounded-lg border border-mdn-danger/30 bg-mdn-danger/10 px-4 py-3 text-sm text-mdn-danger">
          No pincodes added yet — checkout is blocked for every customer until you add at least one.
        </p>
      )}

      <div className="card mt-6 p-6">
        <h3 className="text-lg font-bold text-mdn-white">Add pincodes</h3>
        <form onSubmit={handleAdd} noValidate className="mt-4 space-y-4">
          <div>
            <label htmlFor="pincode-input" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-mdn-gray">
              Pincodes <span className="text-mdn-danger">*</span>
            </label>
            <textarea
              id="pincode-input"
              value={input}
              onChange={(e) => {
                // Sirf digits aur separators (comma, space, new line)
                setInput(e.target.value.replace(/[^\d\s,;]/g, ""));
                setInputError("");
              }}
              rows={3}
              inputMode="numeric"
              placeholder="110001, 110002, 201301 — paste one or many"
              aria-invalid={!!inputError}
              aria-describedby="pincode-input-help"
              className={`input-field w-full resize-y font-mono ${inputError ? "!border-mdn-danger/60" : ""}`}
            />
            <div id="pincode-input-help" className="mt-1 flex flex-wrap justify-between gap-2 text-xs">
              <span role={inputError ? "alert" : undefined} className={inputError ? "text-mdn-danger" : "text-mdn-gray"}>
                {inputError || "Separate with commas, spaces or new lines."}
              </span>
              {tokens.length > 0 && (
                <span className="tabular-nums text-mdn-gray">
                  {valid.length} valid{invalid.length ? ` · ${invalid.length} invalid` : ""}
                </span>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="pincode-area" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-mdn-gray">
              Area / city <span className="font-normal normal-case tracking-normal">(optional — shown to customers)</span>
            </label>
            <input
              id="pincode-area"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              maxLength={80}
              placeholder="e.g. Noida"
              className="input-field w-full"
            />
          </div>

          <button
            type="submit"
            disabled={saving || valid.length === 0}
            className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {saving ? "Adding..." : valid.length > 1 ? `Add ${valid.length} pincodes` : "Add pincode"}
          </button>
        </form>
      </div>

      <div className="mt-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-bold text-mdn-white">Serviceable pincodes ({pincodes.length})</h3>
          <SearchInput value={search} onChange={setSearch} placeholder="Search pincode or area" className="sm:max-w-xs" />
        </div>

        {loading ? (
          <div className="py-10">
            <MDNLoader label="Loading pincodes" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="mt-4 text-sm text-mdn-gray">{pincodes.length ? "No pincode matches your search." : "No pincodes yet."}</p>
        ) : (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {filtered.map((p) => (
              <li key={p._id} className="card flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="font-mono text-base font-semibold text-mdn-white">{p.pincode}</p>
                  {p.area && <p className="truncate text-xs text-mdn-gray">{p.area}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(p)}
                  disabled={deletingId === p._id}
                  aria-label={`Remove pincode ${p.pincode}`}
                  className="shrink-0 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                >
                  {deletingId === p._id ? "Removing..." : "Remove"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {confirmDialog}
    </div>
  );
}
