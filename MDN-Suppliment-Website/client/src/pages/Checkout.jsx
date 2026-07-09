import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import MDNLoader from "../components/MDNLoader";

const emptyAddress = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
};

export default function Checkout() {
  const { token } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState(emptyAddress);
  const [saveNewAddress, setSaveNewAddress] = useState(true);

  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const loadCart = () => api.getCart(token).then((d) => setCart(d.data));

  useEffect(() => {
    Promise.all([
      loadCart(),
      api.getMyAddresses(token).then((d) => {
        setAddresses(d.data);
        const def = d.data.find((a) => a.isDefault) || d.data[0];
        if (def) setSelectedAddressId(def._id);
        else setUseNewAddress(true);
      }),
    ])
      .catch((err) => setError(err.message))
      .finally(() => setPageLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNewAddressChange = (e) =>
    setNewAddress({ ...newAddress, [e.target.name]: e.target.value });

  const handleApplyCoupon = async () => {
    setError("");
    setCouponMessage("");
    if (!couponCode.trim()) return;
    try {
      const data = await api.applyCoupon(token, couponCode.trim());
      setCart(data.data);
      setCouponMessage("Coupon applied!");
      success("Coupon applied!");
    } catch (err) {
      setError(err.message);
      toastError(err.message);
    }
  };

  const handleRemoveCoupon = async () => {
    setError("");
    setCouponMessage("");
    try {
      const data = await api.removeCoupon(token);
      setCart(data.data);
      setCouponCode("");
      success("Coupon removed.");
    } catch (err) {
      setError(err.message);
      toastError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const shippingAddress = useNewAddress
      ? newAddress
      : addresses.find((a) => a._id === selectedAddressId);

    if (!shippingAddress) {
      setError("Please select or enter a shipping address.");
      toastError("Please select or enter a shipping address.");
      setLoading(false);
      return;
    }

    try {
      const data = await api.placeOrder(token, {
        shippingAddress,
        paymentMethod: "cod",
        saveAddress: useNewAddress && saveNewAddress,
      });
      // NOTE: we intentionally do NOT toast success here.
      // Orders.jsx shows the "placed successfully" toast once it
      // receives `justPlaced` via router state, so toasting here too
      // would show the same message twice (see Orders.jsx for the
      // single source of truth on this toast).
      navigate(`/orders`, { state: { justPlaced: data.data.orderNumber } });
    } catch (err) {
      setError(err.message);
      toastError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <MDNLoader label="Loading checkout" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4 text-center">
        <p className="text-mdn-gray">Your cart is empty.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-mdn-white">Checkout</h2>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <form onSubmit={handleSubmit} className="mt-6 space-y-8">
        {/* Shipping address */}
        <section>
          <h3 className="text-sm font-bold uppercase tracking-wide text-mdn-white">Shipping address</h3>

          {addresses.length > 0 && (
            <div className="mt-3 space-y-3">
              {addresses.map((a) => (
                <label
                  key={a._id}
                  className={`card flex cursor-pointer items-start gap-3 p-4 transition-colors ${
                    !useNewAddress && selectedAddressId === a._id ? "border-mdn-green/50 bg-mdn-green/5" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="savedAddress"
                    checked={!useNewAddress && selectedAddressId === a._id}
                    onChange={() => {
                      setUseNewAddress(false);
                      setSelectedAddressId(a._id);
                    }}
                    className="mt-1 h-4 w-4 shrink-0 accent-mdn-green"
                  />
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-semibold text-mdn-white">
                      {a.label}{" "}
                      {a.isDefault && (
                        <span className="ml-1 rounded-full border border-mdn-green/30 bg-mdn-green/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-mdn-green">
                          Default
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-mdn-gray">
                      {a.fullName} — {a.phone}
                      <br />
                      {a.line1}
                      {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.pincode}
                    </p>
                  </div>
                </label>
              ))}

              <label
                className={`card flex cursor-pointer items-center gap-3 p-4 transition-colors ${
                  useNewAddress ? "border-mdn-green/50 bg-mdn-green/5" : ""
                }`}
              >
                <input
                  type="radio"
                  name="savedAddress"
                  checked={useNewAddress}
                  onChange={() => setUseNewAddress(true)}
                  className="h-4 w-4 shrink-0 accent-mdn-green"
                />
                <span className="text-sm font-semibold text-mdn-white">Use a new address</span>
              </label>
            </div>
          )}

          {(useNewAddress || addresses.length === 0) && (
            <div className="card mt-3 p-4 sm:p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  name="fullName"
                  placeholder="Full name"
                  value={newAddress.fullName}
                  onChange={handleNewAddressChange}
                  required
                  className="input-field"
                />
                <input
                  name="phone"
                  placeholder="Phone"
                  value={newAddress.phone}
                  onChange={handleNewAddressChange}
                  required
                  className="input-field"
                />
              </div>

              <input
                name="line1"
                placeholder="Address"
                value={newAddress.line1}
                onChange={handleNewAddressChange}
                required
                className="input-field mt-4 w-full"
              />
              <input
                name="line2"
                placeholder="Address line 2 (optional)"
                value={newAddress.line2}
                onChange={handleNewAddressChange}
                className="input-field mt-4 w-full"
              />

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <input
                  name="city"
                  placeholder="City"
                  value={newAddress.city}
                  onChange={handleNewAddressChange}
                  required
                  className="input-field"
                />
                <input
                  name="state"
                  placeholder="State"
                  value={newAddress.state}
                  onChange={handleNewAddressChange}
                  required
                  className="input-field"
                />
                <input
                  name="pincode"
                  placeholder="Pincode"
                  value={newAddress.pincode}
                  onChange={handleNewAddressChange}
                  required
                  className="input-field"
                />
              </div>

              <label className="mt-4 flex items-center gap-2.5 text-sm text-mdn-gray">
                <input
                  type="checkbox"
                  checked={saveNewAddress}
                  onChange={(e) => setSaveNewAddress(e.target.checked)}
                  className="h-4 w-4 shrink-0 accent-mdn-green"
                />
                <span>Save this address for next time</span>
              </label>
            </div>
          )}
        </section>

        {/* Coupon */}
        <section>
          <h3 className="text-sm font-bold uppercase tracking-wide text-mdn-white">Coupon</h3>

          {cart.couponApplied ? (
            <div className="card mt-3 flex flex-wrap items-center justify-between gap-3 p-4">
              <span className="text-sm text-mdn-green">Coupon applied — you saved ₹{cart.discount}</span>
              <button type="button" onClick={handleRemoveCoupon} className="btn-secondary !px-4 !py-1.5 text-xs">
                Remove
              </button>
            </div>
          ) : (
            <div className="mt-3 flex gap-3">
              <input
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="input-field flex-1"
              />
              <button type="button" onClick={handleApplyCoupon} className="btn-primary !px-5">
                Apply
              </button>
            </div>
          )}
          {couponMessage && <p className="mt-2 text-sm text-mdn-green">{couponMessage}</p>}
        </section>

        {/* Order summary */}
        <section className="card space-y-1.5 p-4 sm:p-5">
          <div className="flex items-center justify-between text-sm text-mdn-gray">
            <span>Subtotal</span>
            <span>₹{cart.subtotal}</span>
          </div>
          {cart.discount > 0 && (
            <div className="flex items-center justify-between text-sm text-mdn-green">
              <span>Discount</span>
              <span>-₹{cart.discount}</span>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2 text-base font-bold text-mdn-white">
            <span>Total</span>
            <span className="text-mdn-green">₹{cart.total}</span>
          </div>
        </section>

        <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto">
          {loading ? "Placing order..." : "Place Order (Cash on Delivery)"}
        </button>
      </form>
    </div>
  );
}