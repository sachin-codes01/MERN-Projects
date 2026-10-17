import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import MDNLoader from "../components/MDNLoader";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import AddressFields, { Field, inputClass } from "../components/AddressFields";
import { addressRules, cleanAddress, hasErrors, LIMITS, rules, validateFields } from "../utils/validators";
import { usePincodeDetails } from "../hooks/usePincodeDetails";
import OtpVerify from "../components/OtpVerify";

// Address ke rules + email (Razorpay prefill / receipt ke liye)
const CHECKOUT_RULES = { ...addressRules, email: rules.email };

const emptyForm = {
  fullName: "", email: "", phone: "", line1: "", line2: "", city: "", district: "", state: "", pincode: "", country: "India",
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
  const [couponError, setCouponError] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  // Email OTP: chalu hai ya nahi + is account ke verified emails
  const [otp, setOtp] = useState({ loaded: false, email: {}, accountEmail: "", verifiedEmails: [] });
  useEffect(() => {
    api
      .otpStatus(token)
      .then((d) => setOtp({ loaded: true, ...d.data }))
      // Status na mile to OTP UI mat dikhao — server payment se pehle khud check karta hai
      .catch(() => setOtp((o) => ({ ...o, loaded: true })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const markEmailVerified = (target) =>
    setOtp((o) => ({ ...o, verifiedEmails: [target, ...o.verifiedEmails.filter((t) => t !== target)] }));

  // User ne khud pincode badla? Tabhi city/state auto-fill — saved address
  // load hote waqt uski apni city overwrite nahi karni
  const pincodeTypedRef = useRef(false);

  useEffect(() => {
    Promise.all([api.getCart(token), api.getMyAddresses(token)])
      .then(([cartData, addrData]) => {
        setCart(cartData.data);
        setAddresses(addrData.data);

        const def = addrData.data.find((a) => a.isDefault) || addrData.data[0];
        if (def) {
          setSelectedAddressId(def._id);
          applyAddressToForm(def);
          setSaveAddress(false); // existing address — don't save it again
        } else {
          setForm((f) => ({ ...f, fullName: user?.name || "", email: user?.email || "" }));
          setSaveAddress(true); // no saved address yet, so the new one will be saved
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setPageLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyAddressToForm = (addr) => {
    const next = {
      ...emptyForm,
      fullName: addr?.fullName || user?.name || "",
      email: user?.email || "",
      phone: addr?.phone || "",
      line1: addr?.line1 || "",
      line2: addr?.line2 || "",
      city: addr?.city || "",
      district: addr?.district || "",
      state: addr?.state || "",
      pincode: addr?.pincode || "",
      country: addr?.country || "India",
    };
    setForm(next);
    // Purane saved address me koi galti ho (e.g. galat pincode) to turant
    // dikhao — warna Pay button bina wajah bataye band rehta
    setFieldErrors(validateFields(next, CHECKOUT_RULES));
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
    setSaveAddress(false); // address is already saved — no need to re-save
  };

  // Ek field ki galti — blur pe dikhai jati hai, aur galti ke baad type
  // karte hi live update hoti hai (theek hote hi gayab)
  const checkField = (name, values = form) => CHECKOUT_RULES[name]?.(values[name], values) || "";

  const handleChange = (name, value) => {
    if (name === "pincode") pincodeTypedRef.current = true;
    const next = { ...form, [name]: value };
    setForm(next);
    if (fieldErrors[name]) setFieldErrors((fe) => ({ ...fe, [name]: checkField(name, next) }));
  };

  const handleBlur = (name) => setFieldErrors((fe) => ({ ...fe, [name]: checkField(name) }));

  const validate = () => {
    const errs = validateFields(form, CHECKOUT_RULES);
    setFieldErrors(errs);
    return !hasErrors(errs);
  };

  // Pay button tabhi chalega jab saari fields sahi hon
  const formValid = !hasErrors(validateFields(form, CHECKOUT_RULES));

  // Pincode 6 sahi digits ka hote hi check: delivery list me hai ya nahi
  // (admin panel), aur city/state auto-fill
  const pincodeInfo = usePincodeDetails(form.pincode, token);
  const delivery = {
    pincode: pincodeInfo.pincode,
    area: pincodeInfo.area,
    status:
      pincodeInfo.status === "done" ? (pincodeInfo.available ? "available" : "unavailable") : pincodeInfo.status,
  };

  useEffect(() => {
    if (pincodeInfo.status !== "done" || !pincodeTypedRef.current) return;
    pincodeTypedRef.current = false;
    if (!pincodeInfo.city && !pincodeInfo.state) return;
    setForm((f) => {
      const next = {
        ...f,
        city: pincodeInfo.city || f.city,
        district: pincodeInfo.district || f.district,
        state: pincodeInfo.state || f.state,
      };
      // Purani "City can only contain letters" jaisi galti hatao
      setFieldErrors((fe) => ({
        ...fe,
        city: checkField("city", next),
        district: checkField("district", next),
        state: checkField("state", next),
      }));
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pincodeInfo]);

  // "error" (network) pe rokte nahi — server payment se pehle khud check karta hai
  const deliveryOk = delivery.status === "available" || delivery.status === "error";
  // Email OTP — Google account wala email pehle se verified
  const emailTarget = form.email.trim().toLowerCase();
  const emailVerified = !otp.email.enabled || emailTarget === otp.accountEmail || otp.verifiedEmails.includes(emailTarget);
  const canPay = formValid && deliveryOk && otp.loaded && emailVerified;

  const deliveryStatus =
    delivery.status === "checking" ? (
      <p className="mt-1 text-xs text-mdn-gray" aria-live="polite">
        Checking delivery for {delivery.pincode}…
      </p>
    ) : delivery.status === "available" ? (
      <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-mdn-green" aria-live="polite">
        <CheckCircleRoundedIcon sx={{ fontSize: 14 }} aria-hidden="true" />
        Delivery available{delivery.area ? ` in ${delivery.area}` : pincodeInfo.city ? ` in ${pincodeInfo.city}` : ""}
      </p>
    ) : delivery.status === "unavailable" ? (
      <div id="checkout-pincode-error" role="alert" className="mt-1 text-xs">
        <p className="flex items-center gap-1 font-semibold text-mdn-danger">
          <LocalShippingOutlinedIcon sx={{ fontSize: 14 }} aria-hidden="true" />
          Shipping not available in this pincode
        </p>
        {/* Delivery nahi hai to customer support se baat karne ka seedha rasta */}
        <Link
          to="/support?topic=shipping#contact-form"
          className="mt-0.5 inline-block font-semibold text-mdn-green underline-offset-2 hover:underline"
        >
          Contact customer support →
        </Link>
      </div>
    ) : null;

  const handleApplyCoupon = async () => {
    if (couponBusy) return;
    setError("");
    setCouponMessage("");
    const code = couponCode.trim().toUpperCase();
    const msg = rules.couponCode(code);
    setCouponError(msg);
    if (msg) return;

    setCouponBusy(true);
    try {
      const data = await api.applyCoupon(token, code);
      setCart(data.data);
      setCouponMessage("Coupon applied!");
      success("Coupon applied!");
    } catch (err) {
      setCouponError(err.message);
      toastError(err.message);
    } finally {
      setCouponBusy(false);
    }
  };

  const handleRemoveCoupon = async () => {
    if (couponBusy) return;
    setCouponBusy(true);
    try {
      const data = await api.removeCoupon(token);
      setCart(data.data);
      setCouponCode("");
      setCouponMessage("");
      success("Coupon removed.");
    } catch (err) {
      toastError(err.message);
    } finally {
      setCouponBusy(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (placing) return; // double submit guard
    setError("");
    if (!validate()) {
      toastError("Some fields need fixing — please check the highlighted fields.");
      return;
    }
    if (delivery.status === "unavailable") {
      toastError(`Sorry, we don't ship to pincode ${delivery.pincode} yet.`);
      return;
    }
    if (delivery.status === "checking") return; // check pura hone do

    if (!window.Razorpay) {
      toastError("The payment system failed to load. Please refresh the page and try again.");
      return;
    }

    // Trim + phone sirf 10 digits — server bhi yahi rules dobara check karta hai
    const shippingAddress = cleanAddress(form);

    setPlacing(true);
    try {
      const rpOrderRes = await api.createRazorpayOrder(token, {
        shippingAddress,
        saveAddress: saveAddress
          ? { label: addresses.find((a) => a._id === selectedAddressId)?.label || "Home" }
          : null,
        addressId: selectedAddressId || null,
        email: form.email.trim().toLowerCase(),
      });
      const rpOrder = rpOrderRes.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: rpOrder.amount,
        currency: rpOrder.currency,
        name: "MDN Store",
        description: "Order Payment",
        order_id: rpOrder.razorpayOrderId,
        prefill: {
          name: shippingAddress.fullName,
          email: form.email.trim().toLowerCase(),
          contact: shippingAddress.phone,
        },
        theme: { color: "#3f5524" },

        handler: async function (response) {
          try {
            // Address and items were already fixed when the payment was
            // created — only the payment proof is sent now.
            const data = await api.verifyPayment(token, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            if (data.refunded) {
              // Paid, but an item sold out meanwhile — the server already
              // refunded in full and recorded a cancelled order.
              toastError(data.message || "An item sold out, so your payment has been refunded in full.");
              navigate("/orders");
              return;
            }
            navigate("/orders", { state: { justPlaced: data.data.orderNumber } });
          } catch (err) {
            // The money may already be taken at this point. The server's
            // webhook still places the order, so point the customer there
            // instead of implying the payment was lost.
            const msg = `${err.message} If money was deducted, your order will appear in Your Orders within a few minutes.`;
            setError(msg);
            toastError(msg);
          } finally {
            setPlacing(false);
          }
        },

        modal: {
          ondismiss: function () {
            setPlacing(false);
            toastError("Payment was cancelled.");
          },
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", function (response) {
        setPlacing(false);
        toastError("Payment failed: " + response.error.description);
      });

      rzp.open();
    } catch (err) {
      setError(err.message);
      toastError(err.message);
      setPlacing(false);
    }
  };

  if (pageLoading) {
    return <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6"><MDNLoader label="Loading checkout" /></div>;
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
      <h2 className="display-xl">Checkout</h2>

      {error && <p className="mt-3 text-sm text-mdn-danger">{error}</p>}

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-8">
        <section className="card space-y-4 p-4 sm:p-5">
          <h3 className="font-heading text-base font-semibold text-mdn-ink">Shipping details</h3>

          {addresses.length > 0 && (
            <div>
              <label htmlFor="checkout-saved-address" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-mdn-gray">
                Choose a saved address
              </label>
              <select id="checkout-saved-address" value={selectedAddressId} onChange={handleSelectAddress} className="input-field w-full">
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
              ? "The selected address is shown below — you can edit it here if needed."
              : "Enter a new address — you can also save it to your profile."}
          </p>

          <AddressFields
            idPrefix="checkout"
            values={form}
            errors={fieldErrors}
            onChange={handleChange}
            onBlur={handleBlur}
            addons={{
              pincode: deliveryStatus,
            }}
          />

          <Field id="checkout-email" label="Email (for your receipt)" error={fieldErrors.email}>
            <input
              id="checkout-email"
              name="email"
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              onBlur={() => handleBlur("email")}
              autoComplete="email"
              inputMode="email"
              maxLength={254}
              required
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? "checkout-email-error" : undefined}
              className={inputClass(fieldErrors.email)}
            />
            {!fieldErrors.email && otp.email.enabled && (
              <OtpVerify
                channel="email"
                target={emailTarget}
                valid={!rules.email(form.email)}
                verified={emailVerified}
                testMode={otp.email.testMode}
                token={token}
                onVerified={markEmailVerified}
              />
            )}
          </Field>

          <label className="flex items-center gap-2.5 text-sm text-mdn-gray">
            <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="h-4 w-4 shrink-0 accent-mdn-green" />
            <span>{selectedAddressId ? "Update these changes in my profile" : "Save this address to my profile"}</span>
          </label>
        </section>

        <section>
          <h3 className="font-heading text-base font-semibold text-mdn-ink">Coupon</h3>
          {cart.couponApplied ? (
            <div className="card mt-3 flex flex-wrap items-center justify-between gap-3 p-4">
              <span className="text-sm text-mdn-green">Coupon applied — you saved ₹{cart.discount}</span>
              <button
                type="button"
                onClick={handleRemoveCoupon}
                disabled={couponBusy}
                className="btn-secondary !px-4 !py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
              >
                {couponBusy ? "Removing..." : "Remove"}
              </button>
            </div>
          ) : (
            <div className="mt-3">
              <label htmlFor="checkout-coupon" className="sr-only">Coupon code</label>
              <div className="flex gap-3">
                <input
                  id="checkout-coupon"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  // Sirf A-Z aur 0-9, apne aap capital
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
                    setCouponError("");
                  }}
                  onKeyDown={(e) => {
                    // Enter se poora checkout form submit na ho — sirf coupon apply
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleApplyCoupon();
                    }
                  }}
                  maxLength={LIMITS.couponMax}
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  aria-invalid={!!couponError}
                  aria-describedby={couponError ? "checkout-coupon-error" : undefined}
                  className={`${inputClass(couponError)} flex-1`}
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={couponBusy || !couponCode}
                  className="btn-primary !px-5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {couponBusy ? "Applying..." : "Apply"}
                </button>
              </div>
              {couponError && (
                <p id="checkout-coupon-error" role="alert" className="mt-1.5 text-xs text-mdn-danger">
                  {couponError}
                </p>
              )}
            </div>
          )}
          {couponMessage && <p className="mt-2 text-sm text-mdn-green">{couponMessage}</p>}
        </section>

        {/* Every line the customer is actually charged, itemised — these
            numbers come from the server's cart totals, which share one
            calculation with the Razorpay order amount (see
            server/utils/orderPricing.js), so what's shown here is exactly
            what the payment popup will ask for. */}
        <section className="card space-y-1.5 p-4 sm:p-5">
          <h3 className="mb-1 font-heading text-base font-semibold text-mdn-ink">Price details</h3>

          <div className="flex items-center justify-between text-sm text-mdn-gray">
            <span>Subtotal</span><span>₹{cart.subtotal}</span>
          </div>

          {cart.discount > 0 && (
            <div className="flex items-center justify-between text-sm text-mdn-green">
              <span>Discount{cart.couponDetails?.code ? ` (${cart.couponDetails.code})` : ""}</span>
              <span>-₹{cart.discount}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-mdn-gray">
            <span>Shipping</span>
            {cart.shippingFee > 0 ? (
              <span>₹{cart.shippingFee}</span>
            ) : (
              <span className="font-semibold text-mdn-green">FREE</span>
            )}
          </div>

          <div className="flex items-center justify-between text-sm text-mdn-gray">
            <span>GST ({Math.round((cart.taxRate ?? 0.05) * 100)}%)</span>
            <span>₹{cart.tax}</span>
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-mdn-border pt-2 text-base font-bold text-mdn-white">
            <span>Total payable</span><span className="text-mdn-green">₹{cart.total}</span>
          </div>

          <p className="pt-1 text-xs text-mdn-gray/70">
            All taxes included. This is the final amount — the payment popup will show ₹{cart.total}, nothing extra
            is added later.
          </p>

        </section>

        <div>
          <button
            type="submit"
            disabled={placing || !canPay}
            aria-describedby={!canPay ? "checkout-pay-hint" : undefined}
            className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {placing ? "Processing..." : `Pay ₹${cart.total} & Place Order`}
          </button>
          {!canPay && !placing && (
            <p id="checkout-pay-hint" className="mt-2 text-xs text-mdn-gray">
              {!formValid
                ? "Fill in all required delivery details to continue."
                : delivery.status === "unavailable"
                  ? "We don't deliver to this pincode yet. Use a different address or contact customer support."
                  : !emailVerified
                    ? "Verify your email with the OTP to continue."
                    : "Checking delivery for your pincode…"}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}