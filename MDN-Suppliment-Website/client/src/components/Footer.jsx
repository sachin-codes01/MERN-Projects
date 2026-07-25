import { Link } from "react-router-dom";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import InstagramIcon from "@mui/icons-material/Instagram";
import FacebookIcon from "@mui/icons-material/Facebook";
import EmailIcon from "@mui/icons-material/Email";
import mdnLogo from "../assets/mdn-logo.png";
import SplashCursor from "./SplashCursor";
import ErrorBoundary from "./ErrorBoundary";
import { hasWebGLSupport } from "../utils/hasWebGLSupport";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useSettings } from "../context/SettingsContext";

const CONTACT_EMAIL = "sachin.codes01@gmail.com";

// Pre-filled on WhatsApp/email so a message that lands from the site is
// immediately recognizable as a lead from here rather than a cold
// contact. Instagram has no equivalent public "pre-filled DM" link — its
// API only allows that for approved business integrations — so its link
// below just opens the profile/DM thread as-is.
const CONTACT_MESSAGE = "Hi MDN! I'm reaching out from your website — I'd like to know more.";

const FOOTER_SOCIALS = [
  {
    name: "WhatsApp",
    href: `https://wa.me/917217344896?text=${encodeURIComponent(CONTACT_MESSAGE)}`,
    Icon: WhatsAppIcon,
    hoverColor: "#25D366",
  },
  { name: "Instagram", href: "https://www.instagram.com/sachin_28022005?igsh=MTNtY2kzaTlqaDl6cw==", Icon: InstagramIcon, hoverColor: "#E1306C" },
  { name: "Facebook", href: "https://facebook.com/mdn.nutrition", Icon: FacebookIcon, hoverColor: "#1877F2" },
  {
    name: "Email",
    href: `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Inquiry from MDN Website")}&body=${encodeURIComponent(CONTACT_MESSAGE)}`,
    Icon: EmailIcon,
    hoverColor: "#22B14C",
  },
];

const TICKER_ITEMS = [
  "Free shipping over ₹999",
  "Same day dispatch — order by 1PM",
  "100% Genuine, lab-tested products",
  "ISO & GMP certified facilities",
  "2,00,000+ athletes trust MDN",
];

export default function Footer() {
  const ticker = [...TICKER_ITEMS, ...TICKER_ITEMS];
  // Same reasoning as Navbar: this WebGL effect is laggy on small screens,
  // so it only mounts from `lg` up.
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const { splashCursorEnabled } = useSettings();

  return (
    <footer id="site-footer" className="relative mt-10 w-full overflow-hidden bg-mdn-black">
      {/* Background WebGL Fluid Canvas (z-0) */}
      <div className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-hidden">
        {splashCursorEnabled && isDesktop && hasWebGLSupport() && (
        <ErrorBoundary>
        <SplashCursor
          SIM_RESOLUTION={128}
          DYE_RESOLUTION={1024}
          DENSITY_DISSIPATION={3.8}
          VELOCITY_DISSIPATION={2.0}
          PRESSURE={0.08}
          CURL={7.0}
          SPLAT_RADIUS={0.4}
          SPLAT_FORCE={6000}
          SHADING={true}
          RAINBOW_MODE={false}
          COLOR="#19ad4b"
        />
        </ErrorBoundary>
        )}
      </div>

      {/* Foreground Content Stack (z-10) */}
      <div className="relative z-10 w-full pointer-events-none">
        {/* Always-running info strip */}
        <div className="pointer-events-auto overflow-hidden border-y border-mdn-green/20 bg-mdn-green py-2.5">
          <div className="marquee-track gap-10 motion-reduce:animate-none">
            {ticker.map((item, i) => (
              <span
                key={i}
                className="flex items-center gap-2 whitespace-nowrap text-xs font-bold uppercase tracking-wide text-mdn-black sm:text-sm"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-mdn-black/70" />
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Main Links/Grid Area */}
        <div className="pointer-events-auto border-t border-white/5 bg-mdn-charcoal/40 backdrop-blur-[2px]">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              {/* Same reserved-box + overflow technique as Navbar, and the
                  exact same box/image sizes, so the logo reads as
                  identical between nav and footer without changing either
                  bar's height. */}
              <span className="relative block h-8 w-16 sm:h-9 sm:w-20">
                <img
                  src={mdnLogo}
                  alt="MDN — My Daily Nutrition"
                  className="absolute left-1/2 top-1/2 h-14 w-auto -translate-x-1/2 -translate-y-1/2 sm:h-16"
                />
              </span>
              <p className="mt-3 text-sm leading-relaxed text-mdn-gray">
                My Daily Nutrition -- clean, tested supplements for every stage of your training.
              </p>
              <div className="mt-4 flex gap-3">
                {FOOTER_SOCIALS.map((social) => {
                  const Icon = social.Icon;
                  return (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.name}
                      style={{ "--hover-color": social.hoverColor }}
                      className="group flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-mdn-gray transition-all duration-200 hover:-translate-y-0.5 hover:border-transparent hover:text-[var(--hover-color)] hover:shadow-[0_0_10px_var(--hover-color)]"
                    >
                      <Icon sx={{ fontSize: 16 }} />
                    </a>
                  );
                })}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-mdn-white">Shop</h4>
              <ul className="mt-3 space-y-2 text-sm text-mdn-gray">
                <li><Link to="/products/section/best_seller" className="hover:text-mdn-green">Best Sellers</Link></li>
                <li><Link to="/products/section/new_arrival" className="hover:text-mdn-green">New Arrivals</Link></li>
                <li><Link to="/products/section/fitness_combo" className="hover:text-mdn-green">Fitness Combos</Link></li>
                <li><Link to="/products" className="hover:text-mdn-green">All Products</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-mdn-white">Support</h4>
              <ul className="mt-3 space-y-2 text-sm text-mdn-gray">
                {/* New: dedicated Customer Support page, listed first */}
                <li><Link to="/support" className="hover:text-mdn-green">Customer Support</Link></li>
                <li><Link to="/orders" className="hover:text-mdn-green">Track Order</Link></li>
                <li><a href="#faq" className="hover:text-mdn-green">FAQs</a></li>
                <li><Link to="/support?topic=contact" className="hover:text-mdn-green">Contact Us</Link></li>
                <li><Link to="/support?topic=shipping" className="hover:text-mdn-green">Shipping and Returns</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-mdn-white">Get in Touch</h4>
              <ul className="mt-3 space-y-2 text-sm text-mdn-gray">
                <li>
                  <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-mdn-green">
                    {CONTACT_EMAIL}
                  </a>
                </li>
                <li>
                  <a
                    href={FOOTER_SOCIALS[0].href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-mdn-green"
                  >
                    WhatsApp: +91 72173 44896
                  </a>
                </li>
                <li className="text-mdn-gray/80">Mon–Sat, 10am–7pm IST</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 px-4 py-4 text-center text-xs text-mdn-gray sm:px-6">
            {"\u00A9"} {new Date().getFullYear()} MDN -- My Daily Nutrition. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
