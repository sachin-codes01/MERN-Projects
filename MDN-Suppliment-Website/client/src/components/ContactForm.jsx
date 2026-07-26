import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import QRCode from "qrcode";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import InstagramIcon from "@mui/icons-material/Instagram";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/api";
import FloatingInput from "./FloatingInput";
import { normalisePhone, isValidIndianMobile } from "../utils/phone";

/**
 * The whole contact flow — form, then the post-submit panel with contact
 * details, schedule, chat channels and a QR.
 *
 * Lives in its own component because it's rendered in two places: the
 * dedicated /contact route and inline on the Customer Support page. The
 * login gate is enforced HERE rather than only by the route wrapper, since
 * /support is public — signed-out visitors get a sign-in prompt instead of
 * a form they couldn't submit.
 */

const WHATSAPP_NUMBER_DISPLAY = "+91 72173 44896";
const WHATSAPP_NUMBER_E164 = "917217344896";
const CONTACT_EMAIL = "sachin.codes01@gmail.com";
const INSTAGRAM_HANDLE = "@sachin_28022005";
const INSTAGRAM_LINK = "https://www.instagram.com/sachin_28022005?igsh=MTNtY2kzaTlqaDl6cw==";

const SUPPORT_HOURS = [
  { days: "Monday – Friday", hours: "10:00 AM – 7:00 PM IST" },
  { days: "Saturday", hours: "10:00 AM – 4:00 PM IST" },
  { days: "Sunday & public holidays", hours: "Closed" },
];

// No "Message" entry here — the message box below already covers that, so
// an option by that name would just read as a duplicate of the field
// underneath it.
const SUBJECTS = [
  { value: "order", label: "Order issue or status" },
  { value: "product", label: "Product question" },
  { value: "shipping", label: "Shipping & delivery" },
  { value: "returns", label: "Returns & refunds" },
  { value: "wholesale", label: "Wholesale & bulk orders" },
  { value: "feedback", label: "Feedback or suggestion" },
  { value: "other", label: "Something else" },
];

/** The single message body every channel is pre-filled with, so whichever
 *  one the visitor picks lands with the same context. */
function buildMessage(form) {
  const subjectLabel = SUBJECTS.find((s) => s.value === form.subject)?.label;
  const name = [form.firstName, form.lastName].filter(Boolean).join(" ");
  return [
    "Hi MDN, I just submitted the contact form on your website.",
    "",
    `Name: ${name}`,
    `Email: ${form.email}`,
    `Phone: +91 ${normalisePhone(form.phone)}`,
    subjectLabel ? `Subject: ${subjectLabel}` : null,
    "",
    "Message:",
    form.message,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

export default function ContactForm({ defaultSubject = "" }) {
  const { token, user } = useAuth();
  const location = useLocation();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: defaultSubject,
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [submitted, setSubmitted] = useState(null);
  const [enquiryId, setEnquiryId] = useState(null);
  const successRef = useRef(null);

  // Seed from the signed-in account. Email is authoritative and locked; the
  // name/phone are only a starting point the visitor can correct.
  useEffect(() => {
    if (!user) return;
    const [first = "", ...rest] = (user.name || "").trim().split(/\s+/);
    setForm((f) => ({
      ...f,
      firstName: f.firstName || first,
      lastName: f.lastName || rest.join(" "),
      email: user.email || "",
      phone: f.phone || normalisePhone(user.phone || ""),
    }));
  }, [user]);

  useEffect(() => {
    if (submitted) successRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [submitted]);

  const set = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.firstName.trim()) next.firstName = "First name is required";
    if (!form.phone.trim()) next.phone = "Contact number is required";
    else if (!isValidIndianMobile(form.phone))
      next.phone = "Enter a valid 10-digit Indian mobile number (starting 6-9)";
    if (!form.message.trim()) next.message = "Please describe how we can help";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await api.createEnquiry(token, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: normalisePhone(form.phone),
        subject: form.subject,
        message: form.message.trim(),
      });
      setEnquiryId(res.data?._id || null);
      setSubmitted({ ...form, email: user?.email || form.email });
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Signed out: this component renders on the public /support page too, so
  // it has to stand on its own rather than assume a route guard ran.
  if (!token) {
    return (
      <div className="card flex flex-col items-center p-8 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-mdn-green/15 text-mdn-green">
          <LockRoundedIcon sx={{ fontSize: 24 }} />
        </span>
        <h3 className="mt-4 text-lg font-bold text-mdn-white">Sign in to contact us</h3>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-mdn-gray">
          We keep support tied to your account so we can pull up your orders straight away — and so
          your email is filled in for you.
        </p>
        <Link
          to="/login"
          state={{ from: location.pathname + location.search }}
          className="btn-primary mt-5"
        >
          Log in to continue
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div ref={successRef}>
        <SuccessPanel form={submitted} enquiryId={enquiryId} token={token} />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {/* FloatingInput hands its onChange the raw event, not a value. */}
      <div className="grid gap-5 sm:grid-cols-2">
        <FloatingInput
          label="First name"
          value={form.firstName}
          onChange={(e) => set("firstName")(e.target.value)}
          error={errors.firstName}
          required
        />
        <FloatingInput
          label="Last name"
          value={form.lastName}
          onChange={(e) => set("lastName")(e.target.value)}
        />
      </div>

      {/* Locked: it comes from the signed-in account, and the server ignores
          whatever the body says and re-reads it from the session anyway —
          so an editable box here would be a lie. */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-mdn-gray">
          Email
        </label>
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-mdn-charcoal2/60 px-4 py-3">
          <EmailRoundedIcon sx={{ fontSize: 18 }} className="shrink-0 text-mdn-gray" />
          <span className="min-w-0 flex-1 truncate text-sm text-mdn-white">{form.email}</span>
          <span className="shrink-0 rounded-full bg-mdn-green/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-mdn-green">
            Verified
          </span>
        </div>
        <p className="mt-1.5 text-xs text-mdn-gray">
          Taken from your account. To use a different address, update it in your profile.
        </p>
      </div>

      <div>
        <FloatingInput
          label="Contact number"
          type="tel"
          value={form.phone}
          onChange={(e) => set("phone")(e.target.value)}
          error={errors.phone}
          required
          inputMode="numeric"
          maxLength={14}
        />
        {!errors.phone && (
          <p className="mt-1.5 text-xs text-mdn-gray">
            Indian mobile only — 10 digits starting 6-9. You can paste it with +91 or spaces.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="contact-subject" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-mdn-gray">
          Subject
        </label>
        <select
          id="contact-subject"
          value={form.subject}
          onChange={(e) => set("subject")(e.target.value)}
          className="input-field w-full"
        >
          <option value="">Select a subject</option>
          {SUBJECTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="contact-message" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-mdn-gray">
          Message <span className="text-mdn-green">*</span>
        </label>
        <textarea
          id="contact-message"
          rows={5}
          value={form.message}
          onChange={(e) => set("message")(e.target.value)}
          placeholder="Tell us what's going on — order number, product name, anything that helps us help you."
          className="input-field w-full resize-y"
        />
        {errors.message && <p className="mt-1.5 text-xs text-red-400">{errors.message}</p>}
      </div>

      {serverError && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {serverError}
        </p>
      )}

      <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
        {submitting ? "Submitting…" : "Submit & Continue to Chat"}
      </button>
    </form>
  );
}

function SuccessPanel({ form, enquiryId, token }) {
  const [qrDataUrl, setQrDataUrl] = useState("");

  const body = useMemo(() => buildMessage(form), [form]);
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER_E164}?text=${encodeURIComponent(body)}`;
  const emailLink = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    "MDN enquiry from " + [form.firstName, form.lastName].filter(Boolean).join(" ")
  )}&body=${encodeURIComponent(body)}`;

  // The QR encodes the SAME pre-filled wa.me link as the button, so a phone
  // scan lands in a chat with the enquiry already typed — a static QR image
  // could only ever open an empty chat.
  useEffect(() => {
    QRCode.toDataURL(whatsappLink, { width: 320, margin: 1, errorCorrectionLevel: "L" })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [whatsappLink]);

  // Best-effort: records which channel was opened, so an enquiry that
  // reached WhatsApp can be told apart from one that stopped at the form.
  // Never blocks the click — the link opens regardless.
  const track = (channel) => {
    if (!enquiryId || !token) return;
    api.markEnquiryChannel(token, enquiryId, channel).catch(() => {});
  };

  return (
    <div>
      <div className="flex flex-col items-center text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-mdn-green/15 text-mdn-green">
          <CheckCircleRoundedIcon sx={{ fontSize: 32 }} />
        </span>
        <h2 className="mt-4 font-display text-2xl font-bold uppercase tracking-wide text-mdn-white sm:text-3xl">
          Thanks, {form.firstName}
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-mdn-gray">
          We've got your enquiry. Pick a channel below and your details will already be filled in —
          just hit send and we'll take it from there.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <ChannelCard
          href={whatsappLink}
          onClick={() => track("whatsapp")}
          Icon={WhatsAppIcon}
          tint="#25D366"
          label="WhatsApp"
          value={WHATSAPP_NUMBER_DISPLAY}
          note="Fastest reply"
        />
        <ChannelCard
          href={emailLink}
          onClick={() => track("email")}
          Icon={EmailRoundedIcon}
          tint="#22B14C"
          label="Email"
          value={CONTACT_EMAIL}
          note="Within 24 hours"
        />
        <ChannelCard
          href={INSTAGRAM_LINK}
          onClick={() => track("instagram")}
          Icon={InstagramIcon}
          tint="#E1306C"
          label="Instagram"
          value={INSTAGRAM_HANDLE}
          note="DMs open"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="card flex flex-col items-center justify-center p-6 text-center">
          <div className="rounded-lg border border-mdn-silver/30 bg-white p-2">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Scan to open WhatsApp with your enquiry"
                className="h-40 w-40 rounded-md sm:h-44 sm:w-44"
              />
            ) : (
              <div className="h-40 w-40 animate-pulse rounded-md bg-mdn-charcoal2 sm:h-44 sm:w-44" />
            )}
          </div>
          <p className="mt-4 text-sm font-semibold text-mdn-white">Scan to chat</p>
          <p className="mt-1 text-xs text-mdn-gray">
            Opens WhatsApp on your phone with this enquiry already written out.
          </p>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2">
            <ScheduleRoundedIcon sx={{ fontSize: 18 }} className="text-mdn-green" />
            <h3 className="text-sm font-bold uppercase tracking-wide text-mdn-white">Contact schedule</h3>
          </div>
          <ul className="mt-4 space-y-2.5">
            {SUPPORT_HOURS.map((row) => (
              <li
                key={row.days}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-white/5 pb-2.5 last:border-0 last:pb-0"
              >
                <span className="text-sm text-mdn-white">{row.days}</span>
                <span className="text-sm text-mdn-gray">{row.hours}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-mdn-gray">
            Messages sent outside these hours are answered on the next working day. Order-specific
            queries are quickest on WhatsApp with your order ID.
          </p>
        </div>
      </div>
    </div>
  );
}

function ChannelCard({ href, onClick, Icon, tint, label, value, note }) {
  return (
    <a
      href={href}
      onClick={onClick}
      target="_blank"
      rel="noopener noreferrer"
      className="card flex flex-col gap-2 p-5 transition-colors hover:border-mdn-green/50"
    >
      <span
        className="flex h-9 w-9 items-center justify-center rounded-full"
        style={{ backgroundColor: `${tint}26`, color: tint }}
      >
        <Icon sx={{ fontSize: 18 }} />
      </span>
      <p className="text-xs uppercase tracking-wide text-mdn-gray">{label}</p>
      <p className="truncate text-sm font-semibold text-mdn-white">{value}</p>
      <p className="text-xs text-mdn-green">{note}</p>
    </a>
  );
}
