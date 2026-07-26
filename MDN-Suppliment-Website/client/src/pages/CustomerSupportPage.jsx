import { Link, useSearchParams } from "react-router-dom";
import ContactForm from "../components/ContactForm";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";

// No contact details live on this page. They used to sit in a "Get in
// Touch" card here — number, email, Instagram handle and a QR, all visible
// before anyone filled anything, which made the login gate pointless: a
// visitor could just read them and message directly. They are now revealed
// only by ContactForm's success panel, once an enquiry is on record.

// Footer links (Contact Us / Shipping and Returns) both land here via
// `?topic=`, and each just swaps the eyebrow/heading/intro text below —
// the form and quick-link grid underneath stay the same for every topic.
const TOPICS = {
  support: {
    eyebrow: "We're here for you",
    title: "Customer Support",
    intro:
      "Questions about an order, a product, tracking, or returns? Send us a message below and we'll pick it up from there — real people, real answers.",
  },
  contact: {
    eyebrow: "Get in touch",
    title: "Contact Us",
    intro:
      "Have a question about an order, a product, or anything else? Send us a message below and we'll get straight back to you.",
  },
  shipping: {
    eyebrow: "Delivery & returns",
    title: "Shipping & Returns",
    intro:
      "Free shipping over ₹999 with same-day dispatch. Unopened products can be returned within 7 days of delivery. Send us the details below and we'll sort it out.",
    highlightCard: "Shipping & Returns",
  },
};

// Arriving from "Shipping and Returns" pre-selects that subject so the
// visitor doesn't have to restate why they came.
const TOPIC_SUBJECT = { shipping: "shipping", contact: "", support: "" };

export default function CustomerSupportPage() {
  const [searchParams] = useSearchParams();
  const topicKey = searchParams.get("topic") || "support";
  const topic = TOPICS[topicKey] || TOPICS.support;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-[34px]">
      <p className="text-center text-xs font-semibold uppercase tracking-widest text-mdn-green sm:text-left">
        {topic.eyebrow}
      </p>
      <h1 className="mt-1 text-center font-display text-2xl font-bold uppercase tracking-wide text-mdn-white sm:text-left sm:text-3xl">
        {topic.title}
      </h1>
      <p className="mt-3 max-w-2xl text-center text-sm leading-relaxed text-mdn-gray sm:text-left">
        {topic.intro}
      </p>

      {/* The form itself, inline — visitors kept looking for it on this
          page rather than clicking through to /contact. Same component as
          the /contact route, and it renders its own sign-in prompt when
          signed out (this page is public). */}
      <section id="contact-form" className="mt-8">
        <h2 className="font-display text-xl font-bold uppercase tracking-wide text-mdn-white sm:text-2xl">
          Send us a message
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mdn-gray">
          Fill this in once and we'll carry your details straight into the chat — no retyping.
        </p>
        <div className="card mt-5 p-5 sm:p-8">
          <ContactForm defaultSubject={TOPIC_SUBJECT[topicKey] || ""} />
        </div>
      </section>

      {/* Quick links */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <InfoCard
          Icon={Inventory2RoundedIcon}
          title="Order help"
          body="Track, modify, or cancel an order from your Orders page."
          to="/orders"
          cta="View Orders"
        />
        <InfoCard
          Icon={LocalShippingRoundedIcon}
          title="Shipping & Returns"
          body="Free shipping over ₹999. Unopened products can be returned within 7 days of delivery."
          highlighted={topic.highlightCard === "Shipping & Returns"}
        />
        <InfoCard
          Icon={HelpOutlineRoundedIcon}
          title="FAQs"
          body="Find quick answers to the most common questions."
          to="/#faq"
          cta="Browse FAQs"
        />
      </div>
    </div>
  );
}

function InfoCard({ Icon, title, body, to, cta, highlighted }) {
  return (
    <div className={`card p-5 ${highlighted ? "border-mdn-green/60 ring-1 ring-mdn-green/40" : ""}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mdn-green/15 text-mdn-green">
        <Icon sx={{ fontSize: 18 }} />
      </span>
      <h3 className="mt-3 text-sm font-bold uppercase tracking-wide text-mdn-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-mdn-gray">{body}</p>
      {to && (
        <Link to={to} className="mt-3 inline-block text-sm font-semibold text-mdn-green hover:text-mdn-green-light">
          {cta} →
        </Link>
      )}
    </div>
  );
}
