import { Link } from "react-router-dom";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import InstagramIcon from "@mui/icons-material/Instagram";
import FacebookIcon from "@mui/icons-material/Facebook";
import EmailIcon from "@mui/icons-material/Email";

const CONTACT_EMAIL = "sachin.codes01@gmail.com";

const FOOTER_SOCIALS = [
  { name: "WhatsApp", href: "https://wa.me/919876543210", Icon: WhatsAppIcon, hoverColor: "#25D366" },
  { name: "Instagram", href: "https://www.instagram.com/sachin_28022005?igsh=MTNtY2kzaTlqaDl6cw==", Icon: InstagramIcon, hoverColor: "#E1306C" },
  { name: "Facebook", href: "https://facebook.com/mdn.nutrition", Icon: FacebookIcon, hoverColor: "#1877F2" },
  { name: "Email", href: `mailto:${CONTACT_EMAIL}`, Icon: EmailIcon, hoverColor: "#22B14C" },
];

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-white/5 bg-mdn-charcoal">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <span className="font-display text-xl font-bold tracking-widest text-mdn-white">
            MDN<span className="text-mdn-green">.</span>
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
            <li><Link to="/orders" className="hover:text-mdn-green">Track Order</Link></li>
            <li><a href="#faq" className="hover:text-mdn-green">FAQs</a></li>
            <li><a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-mdn-green">Contact Us</a></li>
            <li><a href="#" className="hover:text-mdn-green">Shipping and Returns</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-mdn-white">Newsletter</h4>
          <p className="mt-3 text-sm text-mdn-gray">Get restock alerts and training tips.</p>
          <form className="mt-3 flex gap-2" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="you@email.com" className="input-field !py-2 text-sm" />
            <button className="btn-primary !px-4 !py-2 text-sm">Join</button>
          </form>
        </div>
      </div>

      <div className="border-t border-white/5 px-4 py-4 text-center text-xs text-mdn-gray sm:px-6">
        {"\u00A9"} {new Date().getFullYear()} MDN -- My Daily Nutrition. All rights reserved.
      </div>
    </footer>
  );
}