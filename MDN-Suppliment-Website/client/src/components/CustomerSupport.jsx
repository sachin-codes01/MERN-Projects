import { SOCIAL_LINKS } from "./SocialIcons";

// Update these with your real details.
const WHATSAPP_NUMBER = "+91 98765 43210";
const WHATSAPP_LINK = "https://wa.me/919876543210";
const EMAIL = "sachin.codes01@gmail.com";

const whatsapp = SOCIAL_LINKS.find((s) => s.name === "WhatsApp");
const instagram = SOCIAL_LINKS.find((s) => s.name === "Instagram");

export default function CustomerSupport() {
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&bgcolor=16181A&color=22B14C&data=${encodeURIComponent(
    WHATSAPP_LINK
  )}`;

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="card relative overflow-hidden p-6 sm:p-10">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-mdn-green/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-mdn-green/10 blur-3xl" />

        <div className="relative grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-mdn-green">We're here to help</p>
            <h2 className="mt-1 text-2xl font-bold text-mdn-white sm:text-3xl">
              Talk to <span className="text-mdn-green">Customer Support</span>
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-mdn-gray">
              Questions about an order, a variant, or which supplement fits your goals? Reach us directly —
              real people, real answers.
            </p>

            <div className="mt-6 space-y-3">
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-mdn-charcoal2 px-4 py-3 transition-colors hover:border-[#25D366]/50"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366]/15 text-[#25D366]">
                  {whatsapp && <whatsapp.Icon width={18} height={18} />}
                </span>

                <div>
                  <p className="text-xs uppercase tracking-wide text-mdn-gray">WhatsApp</p>
                  <p className="text-sm font-semibold text-mdn-white">{WHATSAPP_NUMBER}</p>
                </div>
              </a>

              <a
                href={`mailto:${EMAIL}`}
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-mdn-charcoal2 px-4 py-3 transition-colors hover:border-mdn-green/50"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mdn-green/15 text-mdn-green">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path
                      d="M3 7l9 6 9-6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>

                <div>
                  <p className="text-xs uppercase tracking-wide text-mdn-gray">Email</p>
                  <p className="text-sm font-semibold text-mdn-white">{EMAIL}</p>
                </div>
              </a>

              <a
                href={instagram?.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-mdn-charcoal2 px-4 py-3 transition-colors hover:border-[#E1306C]/50"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E1306C]/15 text-[#E1306C]">
                  {instagram && <instagram.Icon width={18} height={18} />}
                </span>

                <div>
                  <p className="text-xs uppercase tracking-wide text-mdn-gray">Instagram</p>
                  <p className="text-sm font-semibold text-mdn-white">
                    @sachin_28022005
                  </p>
                </div>
              </a>
            </div>
          </div>

          {/* QR code */}
          <div className="flex flex-col items-center justify-center rounded-xl border border-mdn-green/20 bg-mdn-charcoal2 p-6 text-center">
            <img src={qrSrc} alt="Scan to chat on WhatsApp" className="h-36 w-36 rounded-lg sm:h-44 sm:w-44" />
            <p className="mt-4 text-sm font-semibold text-mdn-white">Scan to chat on WhatsApp</p>
            <p className="mt-1 text-xs text-mdn-gray">Fastest way to reach our team</p>
          </div>
        </div>
      </div>
    </section>
  );
}