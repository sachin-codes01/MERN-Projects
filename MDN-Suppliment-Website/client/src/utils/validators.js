import { normalisePhone } from "./phone";

// Saare form rules ek jagah. Server (server/validators/schemas.js) bhi
// bilkul yahi limits lagata hai — form pe jo pass ho, woh API pe bhi pass.
//
// Har rule ek chhota function hai: value lo, galat ho to English error
// message lautao, sahi ho to "" (khaali string). Form me use:
//
//   const errs = validateFields(form, { phone: rules.phone, pincode: rules.pincode });

export const LIMITS = {
  nameMin: 2,
  nameMax: 50,
  addressMin: 5,
  addressMax: 200,
  placeMax: 50,
  labelMax: 30,
  couponMin: 3,
  couponMax: 20,
  reviewMin: 10,
  reviewMax: 1000,
  messageMin: 10,
  messageMax: 1000,
  cancelReasonMin: 3,
  cancelReasonMax: 300,
  searchMax: 100,
  maxQtyPerLine: 10,
};

const NAME_RE = /^[\p{L}][\p{L}\p{M} .'-]*$/u;
const PLACE_RE = /^[\p{L}][\p{L}\p{M} .'-]*$/u;
const PHONE_RE = /^[6-9]\d{9}$/;
const PINCODE_RE = /^[1-9]\d{5}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const COUPON_RE = /^[A-Z0-9]+$/;
const TRACKING_RE = /^[A-Za-z0-9-]+$/;

const str = (v) => String(v ?? "").trim();

// Length + required ka common check
const lengthRule = (label, min, max, { optional = false } = {}) => (value) => {
  const v = str(value);
  if (!v) return optional ? "" : `${label} is required`;
  if (v.length < min) return `${label} must be at least ${min} characters`;
  if (v.length > max) return `${label} must be at most ${max} characters`;
  return "";
};

export const nameRule = (label, { optional = false } = {}) => (value) => {
  const v = str(value);
  const base = lengthRule(label, LIMITS.nameMin, LIMITS.nameMax, { optional })(v);
  if (base || !v) return base;
  return NAME_RE.test(v) ? "" : `${label} can only contain letters, spaces and . ' -`;
};

const placeRule = (label) => (value) => {
  const v = str(value);
  const base = lengthRule(label, 2, LIMITS.placeMax)(v);
  if (base) return base;
  return PLACE_RE.test(v) ? "" : `${label} can only contain letters`;
};

export const rules = {
  fullName: nameRule("Full name"),
  firstName: nameRule("First name"),
  lastName: nameRule("Last name", { optional: true }),
  label: lengthRule("Label", 1, LIMITS.labelMax, { optional: true }),

  phone: (value) => {
    if (!str(value)) return "Phone number is required";
    return PHONE_RE.test(normalisePhone(value)) ? "" : "Enter a valid 10-digit Indian mobile number (starting 6-9)";
  },
  pincode: (value) => {
    const v = str(value);
    if (!v) return "Pincode is required";
    return PINCODE_RE.test(v) ? "" : "Enter a valid 6-digit pincode";
  },
  email: (value) => {
    const v = str(value).toLowerCase();
    if (!v) return "Email is required";
    return EMAIL_RE.test(v) && v.length <= 254 ? "" : "Enter a valid email address";
  },

  line1: lengthRule("Address", LIMITS.addressMin, LIMITS.addressMax),
  line2: lengthRule("Address line 2", 0, LIMITS.addressMax, { optional: true }),
  city: placeRule("City"),
  state: placeRule("State"),

  couponCode: (value) => {
    const v = str(value).toUpperCase();
    if (!v) return "Enter a coupon code";
    if (v.length < LIMITS.couponMin || v.length > LIMITS.couponMax) {
      return `Coupon codes are ${LIMITS.couponMin}-${LIMITS.couponMax} characters`;
    }
    return COUPON_RE.test(v) ? "" : "Coupon codes only use letters A-Z and numbers";
  },

  rating: (value) => (Number.isInteger(value) && value >= 1 && value <= 5 ? "" : "Please select a star rating"),
  // Form me "optional" hai — likha ho to 10-1000
  reviewComment: lengthRule("Review", LIMITS.reviewMin, LIMITS.reviewMax, { optional: true }),
  message: lengthRule("Message", LIMITS.messageMin, LIMITS.messageMax),
  cancelReason: lengthRule("Reason", LIMITS.cancelReasonMin, LIMITS.cancelReasonMax),

  trackingNumber: (value) => {
    const v = str(value);
    if (!v) return "Tracking number is required once an order is shipped";
    if (v.length > 60) return "Tracking number must be at most 60 characters";
    return TRACKING_RE.test(v) ? "" : "Tracking number can only contain letters, numbers and -";
  },
  courierPartner: (value) => {
    const v = str(value);
    if (!v) return "Courier partner is required once an order is shipped";
    return v.length > 60 ? "Courier partner must be at most 60 characters" : "";
  },
};

// Ek saath kai fields — { field: "message" } sirf galat fields ke liye
export const validateFields = (values, ruleMap) =>
  Object.fromEntries(
    Object.entries(ruleMap)
      .map(([field, rule]) => [field, rule(values[field], values)])
      .filter(([, message]) => message)
  );

export const hasErrors = (errors) => Object.values(errors).some(Boolean);

// Address form ke rules — Checkout aur Profile dono yahi use karte hain
export const addressRules = {
  fullName: rules.fullName,
  phone: rules.phone,
  line1: rules.line1,
  line2: rules.line2,
  city: rules.city,
  state: rules.state,
  pincode: rules.pincode,
};

// Server ko bhejne se pehle: trim + phone sirf 10 digits
export const cleanAddress = (form) => ({
  fullName: str(form.fullName),
  phone: normalisePhone(form.phone),
  line1: str(form.line1),
  line2: str(form.line2),
  city: str(form.city),
  state: str(form.state),
  pincode: str(form.pincode),
  country: "India",
});

/* ---------- Number inputs ---------- */

// type="number" field me "e", "+", "-", "." type hone se rokta hai —
// sirf whole numbers chahiye (quantity, stock, servings).
export const blockNonIntegerKeys = (e) => {
  if (["e", "E", "+", "-", ".", ","].includes(e.key)) e.preventDefault();
};
// Price jaisi fields — decimal chalega, minus/exponent nahi
export const blockNonPriceKeys = (e) => {
  if (["e", "E", "+", "-", ","].includes(e.key)) e.preventDefault();
};

// Admin number fields ke liye chhota checker. "" = khaali (optional ho to theek).
export const numberRule =
  (label, { min, max, gt, int = false, optional = false } = {}) =>
  (value) => {
    if (value === "" || value === null || value === undefined) return optional ? "" : `${label} is required`;
    const n = Number(value);
    if (!Number.isFinite(n)) return `${label} must be a number`;
    if (int && !Number.isInteger(n)) return `${label} must be a whole number`;
    if (gt !== undefined && !(n > gt)) return `${label} must be greater than ${gt}`;
    if (min !== undefined && n < min) return `${label} must be at least ${min}`;
    if (max !== undefined && n > max) return `${label} must be at most ${max}`;
    return "";
  };
