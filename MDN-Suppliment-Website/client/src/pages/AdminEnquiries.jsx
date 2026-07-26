import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/api";
import MDNLoader from "../components/MDNLoader";

const SUBJECT_LABELS = {
  order: "Order issue",
  product: "Product question",
  shipping: "Shipping & delivery",
  returns: "Returns & refunds",
  wholesale: "Wholesale & bulk",
  feedback: "Feedback",
  other: "Something else",
  "": "—",
};

const STATUSES = [
  { value: "new", label: "New" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
];

const STATUS_STYLES = {
  new: "bg-mdn-green/15 text-mdn-green",
  in_progress: "bg-amber-500/15 text-amber-400",
  resolved: "bg-white/10 text-mdn-gray",
};

export default function AdminEnquiries() {
  const { token, user } = useAuth();
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    api
      .adminGetEnquiries(token, filter ? { status: filter } : {})
      .then((d) => setEnquiries(d.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, filter]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (id, status) => {
    // Optimistic — the row is a local status chip, so reverting on failure
    // is cheaper than blocking the whole table on a round trip.
    const previous = enquiries;
    setEnquiries((list) => list.map((e) => (e._id === id ? { ...e, status } : e)));
    try {
      await api.adminUpdateEnquiryStatus(token, id, status);
    } catch (err) {
      setEnquiries(previous);
      setError(err.message);
    }
  };

  if (!["admin", "superadmin"].includes(user?.role)) {
    return <p className="mx-auto max-w-3xl px-4 py-10 text-red-400">Admin access only.</p>;
  }

  return (
    <div className="mx-auto max-w-shell px-4 py-8 sm:px-6 lg:px-[34px]">
      <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-mdn-white">Enquiries</h1>
      <p className="mt-2 text-sm text-mdn-gray">
        Contact-form submissions. These are captured even when the customer never opens WhatsApp.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {[{ value: "", label: "All" }, ...STATUSES].map((s) => (
          <button
            key={s.value}
            onClick={() => setFilter(s.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              filter === s.value
                ? "bg-mdn-green text-black"
                : "border border-white/10 text-mdn-gray hover:border-mdn-green/40 hover:text-mdn-white"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      {loading && <MDNLoader label="Loading enquiries" className="py-16" />}

      {!loading && enquiries.length === 0 && (
        <p className="mt-10 text-center text-sm text-mdn-gray">No enquiries yet.</p>
      )}

      {!loading && enquiries.length > 0 && (
        <div className="mt-6 space-y-4">
          {enquiries.map((e) => (
            <div key={e._id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-mdn-white">
                    {[e.firstName, e.lastName].filter(Boolean).join(" ")}
                  </p>
                  <p className="mt-0.5 text-sm text-mdn-gray">
                    <a href={`tel:+91${e.phone}`} className="hover:text-mdn-green">
                      +91 {e.phone}
                    </a>
                    {" · "}
                    <a href={`mailto:${e.email}`} className="hover:text-mdn-green">
                      {e.email}
                    </a>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${STATUS_STYLES[e.status]}`}>
                    {STATUSES.find((s) => s.value === e.status)?.label || e.status}
                  </span>
                  <select
                    value={e.status}
                    onChange={(ev) => updateStatus(e._id, ev.target.value)}
                    className="input-field !py-1.5 w-auto text-xs"
                    aria-label="Update status"
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-mdn-gray">
                <span>Subject: {SUBJECT_LABELS[e.subject] ?? e.subject}</span>
                <span>Received: {new Date(e.createdAt).toLocaleString()}</span>
                <span>
                  Opened chat: {e.openedChannel ? e.openedChannel : "no — form only"}
                </span>
              </div>

              <p className="mt-3 whitespace-pre-wrap border-t border-white/5 pt-3 text-sm leading-relaxed text-mdn-white/90">
                {e.message}
              </p>

              <a
                href={`https://wa.me/91${e.phone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm font-semibold text-mdn-green hover:text-mdn-green-light"
              >
                Reply on WhatsApp →
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
