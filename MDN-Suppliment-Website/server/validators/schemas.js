const { z } = require("zod");

// Saare request schemas ek jagah. Rules client ke utils/validators.js se
// mirror kiye gaye hain — dono jagah same limits, taaki form pe jo pass ho
// woh server pe bhi pass ho. Har object `strictObject` hai: anjaan field
// aaye to request reject (mass assignment band — koi `role`, `price`,
// `orderStatus` waghaira chupke se nahi bhej sakta).

/* ---------------- Building blocks ---------------- */

// HTML tags aur control characters hata do — reviews, naam, address
// waghaira me koi <script> ya <img onerror> store na ho.
const stripHtml = (v) =>
  v
    .replace(/<[^>]*>?/g, "")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();

const requiredOrType = (label, type) => (iss) =>
  iss.input === undefined || iss.input === null ? `${label} is required` : `${label} must be ${type}`;

// Text field: trim + HTML strip, phir length aur pattern. `optional` me
// field ka na hona aur "" dono chalte hain.
const text = (label, { min = 1, max = 200, pattern, patternMessage, optional = false } = {}) => {
  const schema = z
    .string({ error: requiredOrType(label, "text") })
    .transform(stripHtml)
    .superRefine((v, ctx) => {
      if (optional && v === "") return;
      if (v.length < min) {
        ctx.addIssue({ code: "custom", message: min <= 1 ? `${label} is required` : `${label} must be at least ${min} characters` });
      } else if (v.length > max) {
        ctx.addIssue({ code: "custom", message: `${label} must be at most ${max} characters` });
      } else if (pattern && !pattern.test(v)) {
        ctx.addIssue({ code: "custom", message: patternMessage || `${label} is not valid` });
      }
    });
  return optional ? schema.optional() : schema;
};

const NAME_RE = /^[\p{L}][\p{L}\p{M} .'-]*$/u;
const PLACE_RE = /^[\p{L}][\p{L}\p{M} .'-]*$/u;
const PHONE_RE = /^[6-9]\d{9}$/;
const PINCODE_RE = /^[1-9]\d{5}$/;
const COUPON_RE = /^[A-Z0-9]{3,20}$/;
const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

const objectId = (label = "Id") =>
  z.string({ error: requiredOrType(label, "text") }).regex(OBJECT_ID_RE, `${label} is not valid`);

const personName = (label, opts = {}) =>
  text(label, { min: 2, max: 50, pattern: NAME_RE, patternMessage: `${label} can only contain letters, spaces and . ' -`, ...opts });

// "+91 98765 43210", "098765-43210" sab chalte hain — pehle sirf 10 digits
const normalisePhone = (raw) => {
  const digits = String(raw).replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
};
const phone = z
  .string({ error: requiredOrType("Phone number", "text") })
  .transform(normalisePhone)
  .refine((v) => PHONE_RE.test(v), "Enter a valid 10-digit Indian mobile number (starting 6-9)");

const pincode = z
  .string({ error: requiredOrType("Pincode", "text") })
  .trim()
  .regex(PINCODE_RE, "Enter a valid 6-digit pincode");

const number = (label, { min, max, int = false, gt } = {}) => {
  let s = z.number({ error: requiredOrType(label, "a number") }).finite(`${label} must be a number`);
  if (int) s = s.int(`${label} must be a whole number`);
  if (gt !== undefined) s = s.gt(gt, `${label} must be greater than ${gt}`);
  if (min !== undefined) s = s.min(min, `${label} must be at least ${min}`);
  if (max !== undefined) s = s.max(max, `${label} must be at most ${max}`);
  return s;
};

// Query string ke numbers text me aate hain — "" ko "nahi diya" maano
const queryInt = (label, { min = 1, max, def }) =>
  z.preprocess(
    (v) => (v === "" || v === undefined ? def : Number(v)),
    number(label, { min, max, int: true })
  );
const queryText = (label, max = 100) =>
  z.preprocess((v) => (v === "" ? undefined : v), z.string().trim().max(max, `${label} is too long`).optional());

const dateString = (label) =>
  z
    .string({ error: requiredOrType(label, "a date") })
    .refine((v) => v === "" || !Number.isNaN(Date.parse(v)), `${label} is not a valid date`);

// Image: Cloudinary/https URL ya site ka apna path (/flavours/mango.webp).
// javascript:, data: waghaira yahin ruk jate hain.
const imageUrl = z
  .string({ error: requiredOrType("Image", "text") })
  .trim()
  .max(1000, "Image URL is too long")
  .refine((v) => /^https?:\/\/[^\s<>"'`]+$/i.test(v) || /^\/[\w\-./%]+$/.test(v), "Image must be an http(s) URL or a site path");
const optionalImage = z.union([z.literal(""), imageUrl]).optional();

const idParam = (name = "id", label = "Id") => z.strictObject({ [name]: objectId(label) });

/* ---------------- Auth ---------------- */

const googleLoginBody = z.strictObject({
  credential: z.string({ error: requiredOrType("Google credential", "text") }).min(1).max(4096),
});
const refreshBody = z.strictObject({
  refreshToken: z.string({ error: requiredOrType("Refresh token", "text") }).min(1).max(1024),
});

/* ---------------- Addresses ---------------- */

const addressFields = {
  label: text("Label", { max: 30, optional: true }),
  fullName: personName("Full name"),
  phone,
  line1: text("Address", { min: 5, max: 200 }),
  line2: text("Address line 2", { max: 200, optional: true }),
  city: text("City", { min: 2, max: 50, pattern: PLACE_RE, patternMessage: "City can only contain letters" }),
  // Optional — purane saved addresses me district nahi hai
  district: text("District", { min: 2, max: 50, pattern: PLACE_RE, patternMessage: "District can only contain letters", optional: true }),
  state: text("State", { min: 2, max: 50, pattern: PLACE_RE, patternMessage: "State can only contain letters" }),
  pincode,
  country: z.literal("India", { error: "Only Indian addresses are supported" }).optional(),
};

const addressBody = z.strictObject({ ...addressFields, isDefault: z.boolean().optional() });
// Edit: koi bhi field (e.g. sirf { isDefault: true } — "Set as default")
const addressUpdateBody = addressBody.partial();

/* ---------------- Cart ---------------- */

const MAX_QTY_PER_LINE = 10;

const addCartItemBody = z.strictObject({
  productId: objectId("Product"),
  sizeId: objectId("Size"),
  flavorId: objectId("Flavour").nullable().optional(),
  quantity: number("Quantity", { min: 1, max: MAX_QTY_PER_LINE, int: true }).optional().default(1),
});
// 0 = line hata do
const updateCartItemBody = z.strictObject({
  quantity: number("Quantity", { min: 0, max: MAX_QTY_PER_LINE, int: true }),
});
const couponBody = z.strictObject({
  code: z
    .string({ error: requiredOrType("Coupon code", "text") })
    .trim()
    .toUpperCase()
    .regex(COUPON_RE, "Coupon codes are 3-20 letters or numbers"),
});

/* ---------------- Orders / payment ---------------- */

const email = z
  .string({ error: requiredOrType("Email", "text") })
  .trim()
  .toLowerCase()
  .max(254, "Email is too long")
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Enter a valid email address");

const { label: _label, ...shippingFields } = addressFields;
const createRazorpayOrderBody = z.strictObject({
  shippingAddress: z.strictObject(shippingFields, { error: requiredOrType("Delivery address", "an object") }),
  // Receipt/contact email — Google wale se alag ho to OTP se verified hona chahiye
  email: email.optional(),
  saveAddress: z.strictObject({ label: text("Label", { max: 30, optional: true }) }).nullable().optional(),
  addressId: objectId("Address").nullable().optional(),
});

const RAZORPAY_ID_RE = /^[A-Za-z0-9_]{1,64}$/;
const verifyPaymentBody = z.strictObject({
  razorpay_order_id: z.string({ error: requiredOrType("Order id", "text") }).regex(RAZORPAY_ID_RE, "Invalid order id"),
  razorpay_payment_id: z.string({ error: requiredOrType("Payment id", "text") }).regex(RAZORPAY_ID_RE, "Invalid payment id"),
  razorpay_signature: z.string({ error: requiredOrType("Signature", "text") }).regex(/^[a-f0-9]{64}$/i, "Invalid signature"),
});

const cancelOrderBody = z.strictObject({
  reason: text("Cancel reason", { min: 3, max: 300, optional: true }),
});

/* ---------------- Products & reviews (public) ---------------- */

const productListQuery = z.strictObject({
  page: queryInt("Page", { min: 1, max: 1000, def: 1 }),
  // Catalogue chhota hai — kuch pages poora list (limit 1000) maangte hain
  limit: queryInt("Limit", { min: 1, max: 1000, def: 20 }),
  category: z.preprocess((v) => (v === "" ? undefined : v), objectId("Category").optional()),
  productType: queryText("Product type", 60),
  goal: queryText("Goal", 40),
  search: queryText("Search", 100),
  sort: queryText("Sort", 20),
  section: queryText("Section", 40),
  // Sale page: sirf jin products pe sale badge laga hai
  onSale: z.preprocess((v) => (v === "" ? undefined : v), z.enum(["true"], { error: "onSale must be true" }).optional()),
});
const suggestQuery = z.strictObject({
  q: queryText("Search", 100),
  limit: queryInt("Limit", { min: 1, max: 20, def: 8 }),
});
const slugParam = z.strictObject({
  slug: z.string().trim().min(1).max(160).regex(/^[a-z0-9-]+$/i, "Product not found"),
});

const reviewBody = z.strictObject({
  rating: number("Rating", { min: 1, max: 5, int: true }),
  // Form me "optional" hai — likha ho to 10-1000 characters
  comment: text("Review", { min: 10, max: 1000, optional: true }),
});

/* ---------------- Contact / enquiries ---------------- */

const SUBJECTS = ["order", "product", "shipping", "returns", "wholesale", "feedback", "other", ""];
const CHANNELS = ["whatsapp", "email", "instagram", "qr"];

const enquiryBody = z.strictObject({
  firstName: personName("First name"),
  lastName: personName("Last name", { optional: true }),
  phone,
  subject: z.enum(SUBJECTS, { error: "Pick a subject from the list" }).optional().default(""),
  message: text("Message", { min: 10, max: 1000 }),
});
const enquiryChannelBody = z.strictObject({
  channel: z.enum(CHANNELS, { error: "Unknown channel" }),
});

/* ---------------- Admin ---------------- */

const ORDER_STATUSES = ["placed", "confirmed", "processing", "shipped", "out_for_delivery", "delivered", "cancelled", "returned"];
const ENQUIRY_STATUSES = ["new", "in_progress", "resolved"];
const GOALS = ["muscle_gain", "weight_loss", "endurance", "recovery", "general_health"];
const DIETS = ["vegan", "vegetarian", "gluten_free", "lactose_free", "keto"];
const SECTIONS = ["best_seller", "new_arrival", "fitness_combo"];

const adminListQuery = (extra = {}) =>
  z.strictObject({
    page: queryInt("Page", { min: 1, max: 1000, def: 1 }),
    limit: queryInt("Limit", { min: 1, max: 100, def: 20 }),
    ...extra,
  });

const adminOrdersQuery = adminListQuery({
  status: z.preprocess((v) => (v === "" ? undefined : v), z.enum(ORDER_STATUSES, { error: "Unknown status" }).optional()),
  user: z.preprocess((v) => (v === "" ? undefined : v), objectId("User").optional()),
});
const adminEnquiriesQuery = adminListQuery({
  status: z.preprocess((v) => (v === "" ? undefined : v), z.enum(ENQUIRY_STATUSES, { error: "Unknown status" }).optional()),
  limit: queryInt("Limit", { min: 1, max: 100, def: 30 }),
});
const adminProductsQuery = adminListQuery({
  category: z.preprocess((v) => (v === "" ? undefined : v), objectId("Category").optional()),
  productType: queryText("Product type", 60),
  search: queryText("Search", 100),
});

const highlight = z.strictObject({
  label: text("Highlight label", { max: 40 }),
  value: text("Highlight value", { max: 40 }),
});

const sizeSchema = z
  .strictObject({
    // Edit pe purana _id bhejna zaroori — warna size naya ban jata aur
    // customers ki cart lines "size no longer exists" ho jati
    _id: objectId("Size").optional(),
    weight: text("Size weight", { max: 40 }),
    price: number("Price (MRP)", { gt: 0, max: 1000000 }),
    discountPrice: number("Selling price", { gt: 0, max: 1000000 }).optional(),
    stock: number("Stock", { min: 0, max: 1000000, int: true }),
    sku: text("SKU", { max: 60 }),
    servings: number("Servings", { min: 1, max: 10000, int: true }).optional(),
    supplyLabel: text("Supply label", { max: 60, optional: true }),
  })
  .refine((s) => s.discountPrice === undefined || s.discountPrice <= s.price, {
    message: "Selling price can't be more than the MRP",
    path: ["discountPrice"],
  });

const flavorSchema = z.strictObject({
  _id: objectId("Flavour").optional(),
  name: text("Flavour name", { max: 60 }),
  image: optionalImage,
  priceAdjustment: number("Flavour price change", { min: -100000, max: 100000 }).optional(),
  images: z.array(imageUrl).max(5, "A flavour can have at most 5 photos").optional(),
  shortDescription: text("Flavour short description", { max: 500, optional: true }),
  description: text("Flavour description", { max: 10000, optional: true }),
  ingredients: text("Flavour ingredients", { max: 5000, optional: true }),
  nutritionHighlights: z.array(highlight).max(20).optional(),
});

// Admin ka likha lamba text React escape karke dikhata hai — yahan sirf
// length check, HTML strip nahi (warna "<5g sugar" jaisa text kat jata)
const longText = (label, max, { optional = true } = {}) => {
  const s = z.string({ error: requiredOrType(label, "text") }).trim().max(max, `${label} must be at most ${max} characters`);
  return optional ? s.optional() : s.min(1, `${label} is required`);
};

const productBody = z.strictObject({
  name: text("Product name", { min: 2, max: 120 }),
  slug: text("Slug", { min: 2, max: 140 }),
  description: longText("Description", 10000, { optional: false }),
  shortDescription: longText("Short description", 500),
  brand: text("Brand", { max: 60 }),
  category: objectId("Category"),
  productType: text("Product type", { max: 60 }),
  tags: z.array(text("Tag", { max: 40 })).max(30, "At most 30 tags").optional(),
  thumbnail: imageUrl,
  images: z.array(imageUrl).max(10, "At most 10 gallery images").optional(),
  ingredients: longText("Ingredients", 5000),
  directionsOfUse: longText("Directions of use", 5000),
  whoIsThisFor: longText("Who is this for", 5000),
  warnings: longText("Warnings", 5000),
  nutritionHighlights: z.array(highlight).max(20).optional(),
  benefits: z
    .array(z.strictObject({ text: text("Benefit", { max: 120 }), icon: text("Benefit icon", { max: 40, optional: true }) }))
    .max(4, "At most 4 benefits")
    .optional(),
  posterTop: optionalImage,
  posterBottom: optionalImage,
  manualStars: number("Display stars", { min: 0, max: 5, int: true }).optional(),
  manualRating: number("Display rating", { min: 0, max: 5 }).optional(),
  sections: z.array(z.enum(SECTIONS)).optional(),
  goal: z.array(z.enum(GOALS)).optional(),
  dietaryTags: z.array(z.enum(DIETS)).optional(),
  sizes: z.array(sizeSchema).min(1, "Add at least one size").max(20, "At most 20 sizes"),
  flavors: z.array(flavorSchema).max(30, "At most 30 flavours").optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  saleBadge: text("Sale badge text", { max: 14, optional: true }),
  // Sirf create pe: naya product customers ko email karein? (save nahi hota)
  notifyCustomers: z.boolean().optional(),
});
// Edit / reactivate ({ isActive: true }) — har field optional
const productUpdateBody = productBody.partial();

const categoryBody = z.strictObject({
  name: text("Category name", { min: 2, max: 50 }),
  slug: text("Slug", { min: 2, max: 60 }),
  description: text("Description", { max: 500, optional: true }),
  image: optionalImage,
  parentCategory: objectId("Parent category").nullable().optional(),
  isActive: z.boolean().optional(),
  displayOrder: number("Display order", { min: 0, max: 10000, int: true }).optional(),
});
const categoryUpdateBody = categoryBody.partial();

const flavorPresetBody = z.strictObject({
  name: text("Flavour name", { max: 60 }),
  image: imageUrl,
});

const couponFields = {
  code: couponBody.shape.code,
  discountType: z.enum(["percentage", "flat"], { error: "Discount type must be percentage or flat" }),
  discountValue: number("Discount", { gt: 0, max: 100000 }),
  minOrderValue: number("Minimum order value", { min: 0, max: 1000000 }).optional(),
  maxDiscount: number("Max discount", { gt: 0, max: 1000000 }).optional(),
  expiresAt: dateString("Expiry date").nullable().optional(),
  isActive: z.boolean().optional(),
};
const percentageWithin100 = (c) => c.discountType !== "percentage" || c.discountValue === undefined || c.discountValue <= 100;
const couponBody_ = z
  .strictObject(couponFields)
  .refine(percentageWithin100, { message: "A percentage discount can't be more than 100%", path: ["discountValue"] });
const couponUpdateBody = z
  .strictObject(couponFields)
  .partial()
  .refine(percentageWithin100, { message: "A percentage discount can't be more than 100%", path: ["discountValue"] });

// Status ke hisaab se zaroori fields — client form bhi yahi rule dikhata hai
const NEEDS_TRACKING = ["shipped", "out_for_delivery"];
const orderStatusBody = z
  .strictObject({
    status: z.enum(ORDER_STATUSES, { error: "Pick a valid order status" }),
    note: text("Note", { max: 300, optional: true }),
    trackingNumber: text("Tracking number", {
      max: 60,
      pattern: /^[A-Za-z0-9-]+$/,
      patternMessage: "Tracking number can only contain letters, numbers and -",
      optional: true,
    }),
    courierPartner: text("Courier partner", { max: 60, optional: true }),
    estimatedDelivery: dateString("Estimated delivery").optional(),
    deliveredAt: dateString("Delivered date").optional(),
  })
  .superRefine((b, ctx) => {
    if (NEEDS_TRACKING.includes(b.status)) {
      if (!b.trackingNumber) ctx.addIssue({ code: "custom", path: ["trackingNumber"], message: "Tracking number is required once an order is shipped" });
      if (!b.courierPartner) ctx.addIssue({ code: "custom", path: ["courierPartner"], message: "Courier partner is required once an order is shipped" });
    }
    if (b.status === "confirmed" && !b.estimatedDelivery) {
      ctx.addIssue({ code: "custom", path: ["estimatedDelivery"], message: "Estimated delivery date is required to confirm an order" });
    }
    if (b.deliveredAt && Date.parse(b.deliveredAt) > Date.now() + 24 * 60 * 60 * 1000) {
      ctx.addIssue({ code: "custom", path: ["deliveredAt"], message: "Delivered date can't be in the future" });
    }
  });

const enquiryStatusBody = z.strictObject({
  status: z.enum(ENQUIRY_STATUSES, { error: "Pick a valid enquiry status" }),
});

const emptyBody = z.strictObject({});

/* ---------------- OTP (checkout phone/email) ---------------- */

// Sirf email OTP (phone OTP hata diya — SMS free nahi)
const otpTarget = (b, ctx) => {
  const r = email.safeParse(b.target);
  if (!r.success) ctx.addIssue({ code: "custom", path: ["target"], message: r.error.issues[0].message });
  else b.target = r.data;
};
const otpSendBody = z
  .strictObject({
    channel: z.enum(["email"], { error: "Only email verification is available" }),
    target: z.string({ error: requiredOrType("Email", "text") }).max(254),
  })
  .superRefine(otpTarget);
const otpVerifyBody = z
  .strictObject({
    channel: z.enum(["email"], { error: "Only email verification is available" }),
    target: z.string({ error: requiredOrType("Email", "text") }).max(254),
    code: z.string({ error: requiredOrType("Code", "text") }).trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
  })
  .superRefine(otpTarget);

/* ---------------- Serviceable pincodes ---------------- */

const pincodeParam = z.strictObject({ pincode });
// Admin ek saath kai pincodes paste kar sakta hai (max 500 ek baar me)
const addPincodesBody = z.strictObject({
  pincodes: z
    .array(pincode, { error: requiredOrType("Pincodes", "a list") })
    .min(1, "Add at least one pincode")
    .max(500, "Add at most 500 pincodes at a time"),
  area: text("Area", { max: 80, optional: true }),
});

module.exports = {
  MAX_QTY_PER_LINE,
  idParam,
  googleLoginBody,
  refreshBody,
  addressBody,
  addressUpdateBody,
  addCartItemBody,
  updateCartItemBody,
  couponBody,
  createRazorpayOrderBody,
  verifyPaymentBody,
  cancelOrderBody,
  productListQuery,
  suggestQuery,
  slugParam,
  reviewBody,
  enquiryBody,
  enquiryChannelBody,
  adminOrdersQuery,
  adminEnquiriesQuery,
  adminProductsQuery,
  productBody,
  productUpdateBody,
  categoryBody,
  categoryUpdateBody,
  flavorPresetBody,
  couponCreateBody: couponBody_,
  couponUpdateBody,
  orderStatusBody,
  enquiryStatusBody,
  emptyBody,
  pincodeParam,
  addPincodesBody,
  otpSendBody,
  otpVerifyBody,
};
