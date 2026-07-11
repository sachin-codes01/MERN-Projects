import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import MDNLoader from "../components/MDNLoader";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;
const PINCODE_REGEX = /^\d{6}$/;

const emptyForm = {
  fullName: "", email: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "", country: "India",
};

export default function Checkout() {
  const { token, user } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saveAddress, setSaveAddress] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getCart(token), api.getMyAddresses(token)])
      .then(([cartData, addrData]) => {
        setCart(cartData.data);
        setAddresses(addrData.data);

        const def = addrData.data.find((a) => a.isDefault) || addrData.data[0];
        if (def) {
          setSelectedAddressId(def._id);
          applyAddressToForm(def);
          setSaveAddress(false); // existing address hai — dobara save nahi karna
        } else {
          setForm((f) => ({ ...f, fullName: user?.name || "", email: user?.email || "" }));
          setSaveAddress(true); // koi saved address nahi hai, isliye naya address save hoga
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setPageLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyAddressToForm = (addr) => {
    setForm((f) => ({
      ...f,
      fullName: addr?.fullName || user?.name || "",
      email: user?.email || "",
      phone: addr?.phone || "",
      line1: addr?.line1 || "",
      line2: addr?.line2 || "",
      city: addr?.city || "",
      state: addr?.state || "",
      pincode: addr?.pincode || "",
      country: addr?.country || "India",
    }));
  };

  const handleSelectAddress = (e) => {
    const id = e.target.value;
    setSelectedAddressId(id);
    setFieldErrors({});

    if (id === "") {
      // "Enter a new address" chosen
      setForm({ ...emptyForm, fullName: user?.name || "", email: user?.email || "" });
      setSaveAddress(true);
      return;
    }

    const addr = addresses.find((a) => a._id === id);
    applyAddressToForm(addr);
    setSaveAddress(false); // already saved address hai, re-save nahi chahiye
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((fe) => ({ ...fe, [name]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = "Naam zaroori hai.";
    if (!form.email.trim()) errs.email = "Email zaroori hai.";
    else if (!EMAIL_REGEX.test(form.email.trim())) errs.email = "Valid email daalein.";
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

  const handleApplyCoupon = async () => {
    setError(""); setCouponMessage("");
    if (!couponCode.trim()) return;
    try {
      const data = await api.applyCoupon(token, couponCode.trim());
      setCart(data.data);
      setCouponMessage("Coupon applied!");
      success("Coupon applied!");
    } catch (err) { toastError(err.message); }
  };

  const handleRemoveCoupon = async () => {
    try {
      const data = await api.removeCoupon(token);
      setCart(data.data);
      setCouponCode("");
      success("Coupon removed.");
    } catch (err) { toastError(err.message); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validate()) {
      toastError("Form me kuch fields sahi nahi hain, check karein.");
      return;
    }

    if (!window.Razorpay) {
      toastError("Payment system load nahi hua. Page refresh karke dobara try karein.");
      return;
    }

    const shippingAddress = {
      fullName: form.fullName, phone: form.phone, line1: form.line1, line2: form.line2,
      city: form.city, state: form.state, pincode: form.pincode, country: form.country,
    };

    setPlacing(true);
    try {
      const rpOrderRes = await api.createRazorpayOrder(token);
      const rpOrder = rpOrderRes.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: rpOrder.amount,
        currency: rpOrder.currency,
        name: "MDN Store",
        description: "Order Payment",
        order_id: rpOrder.razorpayOrderId,
        prefill: {
          name: form.fullName,
          email: form.email,
          contact: form.phone,
        },
        theme: { color: "#22b14c" },

        handler: async function (response) {
          try {
            const data = await api.verifyPayment(token, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              shippingAddress,
              saveAddress: saveAddress ? { label: "Home" } : null,
            });
            navigate("/orders", { state: { justPlaced: data.data.orderNumber } });
          } catch (err) {
            setError(err.message);
            toastError(err.message);
          } finally {
            setPlacing(false);
          }
        },

        modal: {
          ondismiss: function () {
            setPlacing(false);
            toastError("Payment cancel kar diya gaya.");
          },
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", function (response) {
        setPlacing(false);
        toastError("Payment fail ho gaya: " + response.error.description);
      });

      rzp.open();
    } catch (err) {
      setError(err.message);
      toastError(err.message);
      setPlacing(false);
    }
  };

  const fieldClass = (name) =>
    `input-field ${fieldErrors[name] ? "!border-red-500/60 focus:!border-red-500 focus:!ring-red-500/25" : ""}`;

  if (pageLoading) {
    return <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6"><MDNLoader label="Loading checkout" /></div>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4 text-center">
        <p className="text-mdn-gray">Aapka cart khali hai.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-mdn-white">Checkout</h2>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-8">
        <section className="card space-y-4 p-4 sm:p-5">
          <h3 className="text-sm font-bold uppercase tracking-wide text-mdn-white">Shipping details</h3>

          {addresses.length > 0 && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-mdn-gray">
                Choose a saved address
              </label>
              <select value={selectedAddressId} onChange={handleSelectAddress} className="input-field w-full">
                {addresses.map((addr) => (
                  <option key={addr._id} value={addr._id}>
                    {addr.label || "Address"} — {addr.line1}, {addr.city} {addr.isDefault ? "(Default)" : ""}
                  </option>
                ))}
                <option value="">+ Enter a new address</option>
              </select>
            </div>
          )}

          <p className="text-xs text-mdn-gray/70">
            {selectedAddressId
              ? "Selected address ke details neeche hain — chahein to yahin edit kar sakte hain."
              : "Naya address bharein — chahein to profile me save bhi kar sakte hain."}
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <input name="fullName" placeholder="Full name" value={form.fullName} onChange={handleChange} className={fieldClass("fullName")} />
              {fieldErrors.fullName && <p className="mt-1 text-xs text-red-400">{fieldErrors.fullName}</p>}
            </div>
            <div>
              <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} className={fieldClass("email")} />
              {fieldErrors.email && <p className="mt-1 text-xs text-red-400">{fieldErrors.email}</p>}
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

          <label className="flex items-center gap-2.5 text-sm text-mdn-gray">
            <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="h-4 w-4 shrink-0 accent-mdn-green" />
            <span>{selectedAddressId ? "Changes ko profile me update karein" : "Ye address profile me save karein"}</span>
          </label>
        </section>

        <section>
          <h3 className="text-sm font-bold uppercase tracking-wide text-mdn-white">Coupon</h3>
          {cart.couponApplied ? (
            <div className="card mt-3 flex flex-wrap items-center justify-between gap-3 p-4">
              <span className="text-sm text-mdn-green">Coupon applied — you saved ₹{cart.discount}</span>
              <button type="button" onClick={handleRemoveCoupon} className="btn-secondary !px-4 !py-1.5 text-xs">Remove</button>
            </div>
          ) : (
            <div className="mt-3 flex gap-3">
              <input placeholder="Enter coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} className="input-field flex-1" />
              <button type="button" onClick={handleApplyCoupon} className="btn-primary !px-5">Apply</button>
            </div>
          )}
          {couponMessage && <p className="mt-2 text-sm text-mdn-green">{couponMessage}</p>}
        </section>

        <section className="card space-y-1.5 p-4 sm:p-5">
          <div className="flex items-center justify-between text-sm text-mdn-gray">
            <span>Subtotal</span><span>₹{cart.subtotal}</span>
          </div>
          {cart.discount > 0 && (
            <div className="flex items-center justify-between text-sm text-mdn-green">
              <span>Discount</span><span>-₹{cart.discount}</span>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2 text-base font-bold text-mdn-white">
            <span>Total</span><span className="text-mdn-green">₹{cart.total}</span>
          </div>
          <p className="pt-1 text-xs text-mdn-gray/70">
            Final amount (shipping + tax included) payment popup me dikhega.
          </p>
        </section>

        <button type="submit" disabled={placing} className="btn-primary w-full sm:w-auto">
          {placing ? "Processing..." : "Pay & Place Order"}
        </button>
      </form>
    </div>
  );
}