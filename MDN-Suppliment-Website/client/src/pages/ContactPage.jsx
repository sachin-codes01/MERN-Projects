import { useSearchParams } from "react-router-dom";
import ContactForm from "../components/ContactForm";

// Maps ?topic= onto a sensible pre-selected subject, so arriving from
// "Shipping and Returns" doesn't make the visitor pick it again.
const TOPIC_SUBJECT = { shipping: "shipping", returns: "returns", order: "order", wholesale: "wholesale" };

export default function ContactPage() {
  const [searchParams] = useSearchParams();
  const topic = searchParams.get("topic") || "";

  const intro =
    topic === "shipping"
      ? "Question about a delivery or a return? Send us the details and we'll pick it up from there."
      : "Tell us what you need and we'll continue on WhatsApp with all your details already attached.";

  return (
    <div className="mx-auto max-w-shell px-4 py-10 sm:px-6 lg:px-[34px]">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow">Get in touch</p>
        <h1 className="mt-1 display-xl">
          Contact Us
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-mdn-gray">{intro}</p>

        <div className="mt-8">
          <ContactForm defaultSubject={TOPIC_SUBJECT[topic] || ""} />
        </div>
      </div>
    </div>
  );
}
