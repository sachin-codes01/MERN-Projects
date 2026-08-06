import { Link } from "react-router-dom";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import InstagramIcon from "@mui/icons-material/Instagram";
import FacebookIcon from "@mui/icons-material/Facebook";
import EmailIcon from "@mui/icons-material/Email";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import FactoryRoundedIcon from "@mui/icons-material/FactoryRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import mdnLogo from "../assets/mdn-logo.png";

// WhatsApp and Email now point INTERNALLY at /contact rather than opening
// a chat straight away: contacting support is login-gated so every enquiry
// is tied to a real account, and the form is what pre-fills the chat with
// the customer's details. `internal: true` makes the row render as a
// react-router <Link> instead of an <a>. Instagram/Facebook stay external
// — they're profile links, not support channels.
const FOOTER_SOCIALS = [
  { name: "WhatsApp", href: "/contact", internal: true, Icon: WhatsAppIcon },
  { name: "Instagram", href: "https://www.instagram.com/sachin_28022005?igsh=MTNtY2kzaTlqaDl6cw==", Icon: InstagramIcon },
  { name: "Facebook", href: "https://facebook.com/mdn.nutrition", Icon: FacebookIcon },
  { name: "Email", href: "/contact", internal: true, Icon: EmailIcon },
];

// Each message carries its own icon, matching the reference strip. The
// icon is decorative — the text next to it already says the same thing.
const TICKER_ITEMS = [
  { text: "Free shipping over ₹999", Icon: LocalShippingRoundedIcon },
  { text: "Same day dispatch — order by 1PM", Icon: BoltRoundedIcon },
  { text: "100% Genuine, lab-tested products", Icon: VerifiedRoundedIcon },
  { text: "ISO & GMP certified facilities", Icon: FactoryRoundedIcon },
  { text: "2,00,000+ athletes trust MDN", Icon: GroupsRoundedIcon },
];

// Footer sits on the deep-green ground in every reference, so its type is
// light-on-dark regardless of the site theme. These are fixed values, not
// theme tokens, on purpose — the footer looks the same in light and dark
// mode, exactly like the posters.
// Type here is Jost throughout, matching the navbar — `font-nav` and the
// shared `.label` class (see index.css) are used by these two bars and
// nowhere else on the site, so the chrome reads as its own layer against
// Didot headings and Inter body copy. Only the colours differ here,
// because the grounds differ.
const LINK = "font-nav text-[14px] text-[#b9c2a4] transition-colors duration-200 hover:text-[#fdf8f1]";
const HEADING = "label text-[13px] text-[#fdf8f1]";

export default function Footer() {
  const ticker = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    // The footer element itself carries the copyright bar's orange. Its
    // children each paint their own band, so this colour is only ever
    // visible in the strip `.has-sticky-atc` reserves at the bottom while
    // the sticky Add to Cart bar is up (see index.css). Without it that
    // reserved strip fell through to the cream page background and read as
    // a gap between the footer and the bar.
    <footer id="site-footer" className="relative mt-6 w-full overflow-hidden bg-mdn-orange-badge">
      {/* Always-running info strip — deep green, cream type */}
      <div className="overflow-hidden bg-mdn-green py-3">
        <div className="marquee-track gap-10 motion-reduce:animate-none">
          {ticker.map((item, i) => {
            const Icon = item.Icon;
            return (
              <span
                key={i}
                className="label flex items-center gap-2 whitespace-nowrap text-[11px] tracking-[0.1em] text-[#fdf8f1] sm:text-xs"
              >
                <Icon sx={{ fontSize: 16 }} className="text-[#d9a441]" />
                {item.text}
              </span>
            );
          })}
        </div>
      </div>

      {/* Main Links/Grid Area */}
      <div className="bg-mdn-green-dark">
        {/* Two columns from the smallest screen up, not one.
            Stacked in a single column the link lists still occupied the
            full 343px width while their text only filled the left quarter
            — so the footer read as a thin ribbon of type down the left
            edge with the whole right side empty, and ran very tall. Pairing
            them uses the width and roughly halves the footer's height on a
            phone. Desktop is untouched at four across, and the items and
            their order are exactly as before. */}
        <div className="mx-auto grid max-w-shell grid-cols-2 gap-x-6 gap-y-8 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-4 lg:px-[34px]">
          {/* Logo + blurb + socials keep the full width on phone and
              tablet — squeezed into one of two columns the blurb wraps to
              five or six very short lines. Only at lg, where it is one of
              four real columns, does it share the row. */}
          <div className="col-span-2 lg:col-span-1">
            {/* Same reserved-box + overflow technique as Navbar, and the
                exact same box/image sizes, so the logo reads as identical
                between nav and footer without changing either bar's height.
                `brightness-0 invert` renders the dark wordmark as solid
                cream — the source PNG is a dark logo made for light
                backgrounds, and it would otherwise disappear here. */}
            <span className="relative block h-8 w-16 sm:h-9 sm:w-20">
              <img
                src={mdnLogo}
                alt="MDN — My Daily Nutrition"
                className="absolute left-1/2 top-1/2 h-14 w-auto -translate-x-1/2 -translate-y-1/2 brightness-0 invert sm:h-16"
              />
            </span>
            <p className="mt-4 max-w-[34ch] font-nav text-[14px] leading-relaxed text-[#b9c2a4]">
              My Daily Nutrition — clean, tested supplements for every stage of your training.
            </p>
            <div className="mt-5 flex gap-2.5">
              {FOOTER_SOCIALS.map((social) => {
                const Icon = social.Icon;
                const iconClass =
                  "flex h-9 w-9 items-center justify-center rounded-full border border-[#5c6a4a] text-[#b9c2a4] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#fdf8f1] hover:bg-[#fdf8f1] hover:text-[#2a361b]";

                // Support channels route through the in-app contact form
                // (login-gated); profile links stay plain external <a>.
                return social.internal ? (
                  <Link key={social.name} to={social.href} aria-label={social.name} className={iconClass}>
                    <Icon sx={{ fontSize: 17 }} />
                  </Link>
                ) : (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.name}
                    className={iconClass}
                  >
                    <Icon sx={{ fontSize: 17 }} />
                  </a>
                );
              })}
            </div>
          </div>

          <div>
            <h4 className={HEADING}>Shop</h4>
            <ul className="mt-4 space-y-2.5">
              <li><Link to="/products/section/best_seller" className={LINK}>Best Sellers</Link></li>
              <li><Link to="/products/section/new_arrival" className={LINK}>New Arrivals</Link></li>
              {/* Flagship category — same route the navbar's Shop menu
                  uses for it, so both entry points land on one page. */}
              <li><Link to="/search?q=whey%20protein" className={LINK}>Whey Protein</Link></li>
              {/* Labelled "Combos" to match the navbar's Shop menu — same
                  route, and two different names for one destination read
                  as two different pages. */}
              <li><Link to="/products/section/fitness_combo" className={LINK}>Combos</Link></li>
              <li><Link to="/products" className={LINK}>All Products</Link></li>
            </ul>
          </div>

          <div>
            <h4 className={HEADING}>Support</h4>
            <ul className="mt-4 space-y-2.5">
              {/* Dedicated Customer Support page, listed first */}
              <li><Link to="/support" className={LINK}>Customer Support</Link></li>
              <li><Link to="/orders" className={LINK}>Track Order</Link></li>
              <li><Link to="/#faq" className={LINK}>FAQs</Link></li>
              <li><Link to="/contact" className={LINK}>Contact Us</Link></li>
              <li><Link to="/support?topic=shipping" className={LINK}>Shipping and Returns</Link></li>
            </ul>
          </div>

          {/* Replaced the old "Get in Touch" column. Publishing the email,
              WhatsApp number and hours here undercut the login-gated
              contact flow — anyone could skip the form and message
              directly. Those details now live on the /contact success
              screen, shown once an enquiry is on record. */}
          <div>
            <h4 className={HEADING}>Company</h4>
            <ul className="mt-4 space-y-2.5">
              <li><Link to="/#story" className={LINK}>Our Story</Link></li>
              <li><Link to="/blogs" className={LINK}>Blogs</Link></li>
              <li><Link to="/products/section/fitness_combo" className={LINK}>Build Your Bundle</Link></li>
              <li><Link to="/search?q=wholesale" className={LINK}>Wholesale</Link></li>
              <li><Link to="/#why-choose-mdn" className={LINK}>Why Choose MDN</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright — its own orange band, as in the reference home page */}
      <div className="bg-mdn-orange-badge px-4 py-3.5 text-center font-nav text-[12px] tracking-wide text-white sm:px-6">
        {"©"} {new Date().getFullYear()} MDN {"—"} My Daily Nutrition. All rights reserved.
      </div>
    </footer>
  );
}
