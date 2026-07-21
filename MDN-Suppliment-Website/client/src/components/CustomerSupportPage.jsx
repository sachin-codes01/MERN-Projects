import { Link } from "react-router-dom";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import InstagramIcon from "@mui/icons-material/Instagram";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";

const WHATSAPP_NUMBER = "+91 98765 43210";
const WHATSAPP_LINK = "https://wa.me/919876543210";
const INSTAGRAM_LINK = "https://www.instagram.com/sachin_28022005?igsh=MTNtY2kzaTlqaDl6cw==";
const EMAIL = "sachin.codes01@gmail.com";

const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&bgcolor=FFFFFF&color=000000&margin=8&data=${encodeURIComponent(
  WHATSAPP_LINK
)}`;

export default function CustomerSupportPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <p className="text-center text-xs font-semibold uppercase tracking-widest text-mdn-green sm:text-left">
        We're here for you
      </p>
      <h1 className="mt-1 text-center font-display text-2xl font-bold uppercase tracking-wide text-mdn-white sm:text-left sm:text-3xl">
        Customer Support
      </h1>
      <p className="mt-3 max-w-2xl text-center text-sm leading-relaxed text-mdn-gray sm:text-left">
        Questions about an order, a product, tracking, or returns? Reach us directly below — real people,
        real answers.
      </p>

      {/* Contact card */}
      <div className="card relative mt-8 overflow-hidden p-5 sm:p-10">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-mdn-green/10 blur-3xl sm:-right-16 sm:-top-16 sm:h-56 sm:w-56" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-mdn-green/10 blur-3xl sm:-bottom-16 sm:-left-16 sm:h-56 sm:w-56" />

        <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:gap-10">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <p className="text-xs font-semibold uppercase tracking-widest text-mdn-green">Talk to us directly</p>
            <h2 className="mt-1 text-2xl font-bold text-mdn-white sm:text-3xl">Get in Touch</h2>

            <div className="mt-6 w-full space-y-3">
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-mdn-charcoal2 px-4 py-3 text-left transition-colors hover:border-[#25D366]/50"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#25D366]/15 text-[#25D366]">
                  <WhatsAppIcon sx={{ fontSize: 18 }} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-mdn-gray">WhatsApp</p>
                  <p className="truncate text-sm font-semibold text-mdn-white">{WHATSAPP_NUMBER}</p>
                </div>
              </a>

              <a
                href={`mailto:${EMAIL}`}
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-mdn-charcoal2 px-4 py-3 text-left transition-colors hover:border-mdn-green/50"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mdn-green/15 text-mdn-green">
                  <EmailRoundedIcon sx={{ fontSize: 18 }} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-mdn-gray">Email</p>
                  <p className="truncate text-sm font-semibold text-mdn-white">{EMAIL}</p>
                </div>
              </a>

              <a
                href={INSTAGRAM_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-mdn-charcoal2 px-4 py-3 text-left transition-colors hover:border-[#E1306C]/50"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E1306C]/15 text-[#E1306C]">
                  <InstagramIcon sx={{ fontSize: 18 }} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-mdn-gray">Instagram</p>
                  <p className="truncate text-sm font-semibold text-mdn-white">@sachin_28022005</p>
                </div>
              </a>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center rounded-xl border border-mdn-green/20 bg-mdn-charcoal2 p-6 text-center">
            <div className="rounded-lg border border-mdn-silver/30 bg-white p-2">
              <img src={qrSrc} alt="Scan to chat on WhatsApp" className="h-32 w-32 rounded-md sm:h-44 sm:w-44" />
            </div>
            <p className="mt-4 text-sm font-semibold text-mdn-white">Scan to chat on WhatsApp</p>
            <p className="mt-1 text-xs text-mdn-gray">Fastest way to reach our team</p>
          </div>
        </div>
      </div>

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

function InfoCard({ Icon, title, body, to, cta }) {
  return (
    <div className="card p-5">
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