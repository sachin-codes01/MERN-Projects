import { Fragment, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/api";
import { useToast } from "../context/ToastContext";
import SearchInput from "../components/SearchInput";
import MDNLoader from "../components/MDNLoader";

export default function AdminUsers() {
  const { token, user } = useAuth();
  const { success, error: toastError } = useToast();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [expandedOrdersId, setExpandedOrdersId] = useState(null);
  const [expandedDetailsId, setExpandedDetailsId] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [userDetails, setUserDetails] = useState(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const loadUsers = () => {
    setLoading(true);
    api
      .adminGetUsers(token)
      .then((d) => setUsers(d.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (token) loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (user && !["admin", "superadmin"].includes(user.role)) {
    return <p className="mx-auto max-w-3xl px-4 py-10 text-red-400">Admin access only.</p>;
  }

  const handleBlock = async (id) => {
    setError("");
    setMessage("");
    try {
      await api.adminBlockUser(token, id);
      setMessage("User blocked.");
      success("User blocked.");
      loadUsers();
    } catch (err) {
      setError(err.message);
      toastError(err.message);
    }
  };

  const handleUnblock = async (id) => {
    setError("");
    setMessage("");
    try {
      await api.adminUnblockUser(token, id);
      setMessage("User unblocked.");
      success("User unblocked.");
      loadUsers();
    } catch (err) {
      setError(err.message);
      toastError(err.message);
    }
  };

  const toggleOrders = async (id) => {
    setExpandedDetailsId(null);
    if (expandedOrdersId === id) {
      setExpandedOrdersId(null);
      setUserOrders([]);
      return;
    }
    setExpandedOrdersId(id);
    setOrdersLoading(true);
    setUserOrders([]);
    try {
      const data = await api.adminGetUserOrders(token, id);
      setUserOrders(data.data);
    } catch (err) {
      setError(err.message);
      toastError(err.message);
    } finally {
      setOrdersLoading(false);
    }
  };

  const toggleDetails = async (id) => {
    setExpandedOrdersId(null);
    if (expandedDetailsId === id) {
      setExpandedDetailsId(null);
      setUserDetails(null);
      return;
    }
    setExpandedDetailsId(id);
    setDetailsLoading(true);
    setUserDetails(null);
    try {
      const data = await api.adminGetUser(token, id);
      setUserDetails(data.data);
    } catch (err) {
      setError(err.message);
      toastError(err.message);
    } finally {
      setDetailsLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <MDNLoader label="Loading users" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <p className="text-center text-xs font-semibold uppercase tracking-widest text-mdn-green sm:text-left">
        Admin Panel
      </p>
      <h2 className="mt-1 text-center text-2xl font-bold text-mdn-white sm:text-left sm:text-3xl">Users</h2>

      {error && <p className="mt-4 text-center text-sm text-red-400 sm:text-left">{error}</p>}
      {message && <p className="mt-4 text-center text-sm text-mdn-green sm:text-left">{message}</p>}

      <div className="mt-6">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name, email, or phone..."
          className="sm:max-w-xs"
        />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[800px] table-fixed border-collapse text-sm">
          <colgroup>
            <col className="w-[14%]" />
            <col className="w-[20%]" />
            <col className="w-[12%]" />
            <col className="w-[10%]" />
            <col className="w-[10%]" />
            <col className="w-[12%]" />
            <col className="w-[22%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-white/10 bg-mdn-charcoal2 text-left text-xs uppercase tracking-wide text-mdn-gray">
              <th className="px-3 py-3">Name</th>
              <th className="px-3 py-3">Email</th>
              <th className="px-3 py-3">Phone</th>
              <th className="px-3 py-3">Role</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Joined</th>
              <th className="px-3 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <Fragment key={u._id}>
                <tr className={`border-b border-white/5 ${u.isBlocked ? "opacity-50" : ""}`}>
                  <td className="px-3 py-3 truncate text-mdn-white">{u.name}</td>
                  <td className="px-3 py-3 truncate text-mdn-gray">{u.email}</td>
                  <td className="px-3 py-3 truncate text-mdn-gray">{u.phone || "—"}</td>
                  <td className="px-3 py-3 truncate capitalize text-mdn-gray">{u.role}</td>
                  <td className="px-3 py-3 truncate text-mdn-gray">{u.isBlocked ? "Blocked" : "Active"}</td>
                  <td className="px-3 py-3 truncate text-mdn-gray">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleDetails(u._id)}
                        className="btn-secondary !px-2.5 !py-1 text-xs"
                      >
                        {expandedDetailsId === u._id ? "Hide Details" : "View Details"}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleOrders(u._id)}
                        className="btn-secondary !px-2.5 !py-1 text-xs"
                      >
                        {expandedOrdersId === u._id ? "Hide Orders" : "View Orders"}
                      </button>
                      {u.isBlocked ? (
                        <button
                          type="button"
                          onClick={() => handleUnblock(u._id)}
                          className="btn-secondary !px-2.5 !py-1 text-xs"
                        >
                          Unblock
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleBlock(u._id)}
                          className="rounded-md border border-red-500/40 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20"
                        >
                          Block
                        </button>
                      )}
                    </div>
                  </td>
                </tr>

                {expandedDetailsId === u._id && (
                  <tr className="border-b border-white/5">
                    <td colSpan={7} className="bg-mdn-charcoal2/50 px-4 py-5">
                      {detailsLoading && <MDNLoader label="Loading details" />}
                      {!detailsLoading && userDetails && (
                        <div className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm text-mdn-gray sm:grid-cols-2">
                          <div className="flex gap-2">
                            <strong className="w-36 shrink-0 text-mdn-white">Phone:</strong>
                            <span>{userDetails.phone || "Not provided"}</span>
                          </div>
                          <div className="flex gap-2">
                            <strong className="w-36 shrink-0 text-mdn-white">Email verified:</strong>
                            <span>{userDetails.isVerified ? "Yes" : "No"}</span>
                          </div>
                          <div className="flex gap-2">
                            <strong className="w-36 shrink-0 text-mdn-white">Fitness goal:</strong>
                            <span>
                              {userDetails.fitnessGoal ? userDetails.fitnessGoal.replace("_", " ") : "Not set"}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <strong className="w-36 shrink-0 text-mdn-white">Wishlist items:</strong>
                            <span>{userDetails.wishlist?.length || 0}</span>
                          </div>
                          <div className="flex gap-2">
                            <strong className="w-36 shrink-0 text-mdn-white">Last login:</strong>
                            <span>
                              {userDetails.lastLogin ? new Date(userDetails.lastLogin).toLocaleString() : "Never"}
                            </span>
                          </div>

                          <div className="col-span-full">
                            <strong className="text-mdn-white">
                              Saved addresses ({userDetails.addresses?.length || 0}):
                            </strong>
                            {(!userDetails.addresses || userDetails.addresses.length === 0) && (
                              <p className="mt-1">No addresses saved.</p>
                            )}
                            {userDetails.addresses?.map((addr) => (
                              <div key={addr._id} className="card mt-2 p-3">
                                <p>
                                  <strong className="text-mdn-white">{addr.label}</strong>{" "}
                                  {addr.isDefault && (
                                    <span className="ml-1 rounded-full border border-mdn-green/30 bg-mdn-green/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-mdn-green">
                                      Default
                                    </span>
                                  )}
                                </p>
                                <p className="mt-1">
                                  {addr.fullName} — {addr.phone}
                                </p>
                                <p>
                                  {addr.line1}
                                  {addr.line2 ? `, ${addr.line2}` : ""}
                                </p>
                                <p>
                                  {addr.city}, {addr.state} {addr.pincode}, {addr.country}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                )}

                {expandedOrdersId === u._id && (
                  <tr className="border-b border-white/5">
                    <td colSpan={7} className="bg-mdn-charcoal2/50 px-4 py-5">
                      {ordersLoading && <MDNLoader label="Loading orders" />}
                      {!ordersLoading && userOrders.length === 0 && (
                        <p className="text-sm text-mdn-gray">No orders from this user yet.</p>
                      )}
                      {!ordersLoading && userOrders.length > 0 && (
                        <div className="overflow-x-auto rounded-lg border border-white/10">
                          <table className="w-full min-w-[650px] table-fixed border-collapse text-sm">
                            <colgroup>
                              <col className="w-[16%]" />
                              <col className="w-[14%]" />
                              <col className="w-[12%]" />
                              <col className="w-[14%]" />
                              <col className="w-[44%]" />
                            </colgroup>
                            <thead>
                              <tr className="border-b border-white/10 bg-mdn-charcoal text-left text-xs uppercase tracking-wide text-mdn-gray">
                                <th className="px-3 py-2">Order #</th>
                                <th className="px-3 py-2">Status</th>
                                <th className="px-3 py-2">Total</th>
                                <th className="px-3 py-2">Placed</th>
                                <th className="px-3 py-2">Shipped To</th>
                              </tr>
                            </thead>
                            <tbody>
                              {userOrders.map((o) => (
                                <tr key={o._id} className="border-b border-white/5">
                                  <td className="px-3 py-3 truncate text-mdn-white">{o.orderNumber}</td>
                                  <td className="px-3 py-3">
                                    <span className="rounded-full border border-mdn-green/30 bg-mdn-green/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-mdn-green">
                                      {o.orderStatus.replace(/_/g, " ")}
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 truncate font-mono font-semibold text-mdn-green">
                                    ₹{o.pricing.total}
                                  </td>
                                  <td className="px-3 py-3 truncate text-mdn-gray">
                                    {new Date(o.createdAt).toLocaleDateString()}
                                  </td>
                                  <td className="px-3 py-3 align-top text-mdn-gray">
                                    {o.shippingAddress.fullName} — {o.shippingAddress.phone}
                                    <br />
                                    {o.shippingAddress.line1}
                                    {o.shippingAddress.line2 ? `, ${o.shippingAddress.line2}` : ""},{" "}
                                    {o.shippingAddress.city}, {o.shippingAddress.state}{" "}
                                    {o.shippingAddress.pincode}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-mdn-gray">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}