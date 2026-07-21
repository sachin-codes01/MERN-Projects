import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCartBadge } from "../context/CartBadgeContext";
import ThemeToggle from "./ThemeToggle";
import mdnLogo from "../assets/mdn-logo.png";
import SplashCursor from "./SplashCursor";
import ErrorBoundary from "./ErrorBoundary";
import { hasWebGLSupport } from "../utils/hasWebGLSupport";
import { useMediaQuery } from "../hooks/useMediaQuery";

const QUICK_LINKS = [
  { label: "Home", to: "/" },
  { label: "Build Your Bundle", to: "/products/section/fitness_combo" },
  { label: "Wholesale", to: "/search?q=wholesale" },
  // NOTE: this used to point at "/#faq" — now routes to the dedicated
  // Customer Support page instead, per request. Everything else about
  // the navbar is untouched.
  { label: "Customer Support", to: "/support" },
  { label: "Blogs", to: "/search?q=blog" },
];

// Real collection pages on asitisnutrition.com — external, so these
// render as plain <a> tags below (not react-router Links).
const SHOP_CATEGORIES = [
  { label: "All Products", href: "https://asitisnutrition.com/collections/as-it-is-one-all-products" },
  { label: "Whey Protein", href: "https://asitisnutrition.com/collections/asitis-one-whey-protein" },
  { label: "New Launches", href: "https://asitisnutrition.com/collections/as-i-is-one-new-launch" },
  { label: "Vegan Protein", href: "https://asitisnutrition.com/collections/as-it-is-one-non-whey" },
  { label: "Amino Acids", href: "https://asitisnutrition.com/collections/as-it-is-one-amino-acids" },
  { label: "Peanut Butter", href: "https://asitisnutrition.com/collections/as-it-is-one-peanut-butter" },
  { label: "Supplements", href: "https://asitisnutrition.com/collections/as-it-is-one-supplements" },
  { label: "Combos", href: "https://asitisnutrition.com/collections/as-it-is-one-best-sellers" },
  { label: "Accessories", href: "https://asitisnutrition.com/collections/as-it-is-one-accessories" },
];

export default function Navbar() {
  const { user, token } = useAuth();
  const { hasNewItem, clearNewItem } = useCartBadge();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileShopOpen, setMobileShopOpen] = useState(false);
  const [search, setSearch] = useState("");
  // The WebGL fluid-cursor background is heavy enough to make small
  // screens laggy — only mount it from `lg` up, where a mouse cursor
  // actually drives it and there's headroom to render it smoothly.
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const isAdminRoute = location.pathname.startsWith("/admin");
  const isAdminUser = ["admin", "superadmin"].includes(user?.role);

  const linkClass = ({ active } = {}) =>
    `text-sm font-medium tracking-wide transition-colors duration-200 hover:text-mdn-green ${
      active ? "text-mdn-green" : "text-mdn-white/90"
    }`;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  // Close the mobile menu on navigation.
  useEffect(() => {
    setMobileOpen(false);
    setMobileShopOpen(false);
  }, [location.pathname]);

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-mdn-black/95 backdrop-blur">
      {/* Background WebGL Fluid Canvas */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
     {isDesktop && hasWebGLSupport() && (
     <ErrorBoundary>
     <SplashCursor
  DENSITY_DISSIPATION={4.2}   // Evaporates faster so it dissipates like actual smoke puffs
  VELOCITY_DISSIPATION={2.2}   // Keeps the physical kinetic motion fluid but localized
  PRESSURE={0.08}
  CURL={6.5}                  // High vorticity value creates wispy, spinning smoke rings
  SPLAT_RADIUS={0.35}         // Expanded radius for softer, hazy mist borders
  SPLAT_FORCE={5000}          // Balanced drag velocity 
  COLOR_UPDATE_SPEED={10}
  SHADING={true}              // Adds realistic depth maps inside the smoke tracks
  RAINBOW_MODE={false}
  COLOR="#19ad4b"             // The exact emerald green color code from your image
/>
     </ErrorBoundary>
     )}
      </div>

      {/* Main Bar Top Grid */}
      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-2.5 sm:px-6 md:grid-cols-[1fr_auto_1fr]">
        {/* Left — hamburger (mobile) / search (desktop) */}
        <div className="flex items-center">
          <button
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
            className="rounded-md p-1.5 text-mdn-white transition-colors hover:bg-white/5 md:hidden"
          >
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </button>

          <form onSubmit={handleSearchSubmit} className="relative hidden max-w-xs md:block">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mdn-gray">
              <SearchGlyph />
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search supplements..."
              className="input-field w-full !py-2 pl-9 text-sm"
            />
          </form>
        </div>

        {/* Center — logo + tagline underneath */}
        <Link to="/" className="flex flex-col items-center justify-center leading-none">
          <img src={mdnLogo} alt="MDN — My Daily Nutrition" className="h-8 w-auto sm:h-9" loading="eager" />
          <span className="mt-1 whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.22em] text-mdn-gray sm:text-[10px]">
            My Daily Nutrition
          </span>
        </Link>

        {/* Right — nav links, theme toggle, cart, login */}
        <div className="flex items-center justify-end gap-3 sm:gap-4">
          <div className="hidden items-center gap-5 md:flex">
            <Link to="/products" className={linkClass({ active: location.pathname === "/products" })}>
              Products
            </Link>
            {token && (
              <Link to="/orders" className={linkClass({ active: location.pathname === "/orders" })}>
                Orders
              </Link>
            )}
            {token && isAdminUser && (
              <Link to="/admin/products" className={linkClass({ active: isAdminRoute })}>
                Admin
              </Link>
            )}
          </div>

          <ThemeToggle compact className="hidden scale-[0.85] md:flex md:scale-100" />

          <Link
            to="/cart"
            onClick={clearNewItem}
            className="relative flex items-center text-mdn-white/90 transition-colors duration-200 hover:text-mdn-green"
            aria-label="Cart"
          >
            <CartIcon />
            {hasNewItem && (
              <span className="absolute -right-1.5 -top-1.5 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping-slow rounded-full bg-red-500 opacity-90" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
              </span>
            )}
          </Link>

          {token ? (
            <Link to="/profile" className="hidden items-center gap-2 text-sm text-mdn-white/90 hover:text-mdn-green sm:flex">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="h-7 w-7 rounded-full object-cover" />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-mdn-green/15 text-xs font-bold text-mdn-green">
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </span>
              )}
            </Link>
          ) : (
            <Link to="/login" className="btn-primary hidden !px-4 !py-1.5 text-sm sm:inline-flex">
              Login
            </Link>
          )}
        </div>
      </div>

      {/* Bottom Desktop Category Strip */}
      <div className="relative z-10 hidden justify-center border-t border-white/5 md:flex">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 py-2.5">
          <Link
            to="/"
            className="group relative text-sm font-semibold uppercase tracking-wide text-mdn-white/90 transition-colors duration-200 hover:text-mdn-green"
          >
            Home
            <span className="absolute -bottom-1 left-0 h-[2px] w-full origin-left scale-x-0 bg-mdn-green transition-transform duration-300 ease-out group-hover:scale-x-100" />
          </Link>

          {/* Shop Dropdown */}
          <div className="group relative">
            <button
              type="button"
              className="flex items-center gap-1 text-sm font-semibold uppercase tracking-wide text-mdn-white/90 transition-colors duration-200 hover:text-mdn-green"
            >
              Shop
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                className="transition-transform duration-200 group-hover:rotate-180"
              >
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
              <div className="w-52 rounded-lg border border-white/10 bg-mdn-charcoal p-2 shadow-card">
                {SHOP_CATEGORIES.map((c) => (
                  <a
                    key={c.label}
                    href={c.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-md px-3 py-2 text-sm text-mdn-white/90 transition-colors hover:bg-white/5 hover:text-mdn-green"
                  >
                    {c.label}
                  </a>
                ))}
                <div className="mt-1 border-t border-white/10 pt-1">
                  <Link
                    to="/products"
                    className="block rounded-md px-3 py-2 text-sm font-semibold text-mdn-green transition-colors hover:bg-white/5"
                  >
                    View All Products →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {QUICK_LINKS.filter((l) => l.label !== "Home").map((l) => (
            <Link
              key={l.label}
              to={l.to}
              className="group relative text-sm font-semibold uppercase tracking-wide text-mdn-white/90 transition-colors duration-200 hover:text-mdn-green"
            >
              {l.label}
              <span className="absolute -bottom-1 left-0 h-[2px] w-full origin-left scale-x-0 bg-mdn-green transition-transform duration-300 ease-out group-hover:scale-x-100" />
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <div
        className={`relative z-10 overflow-hidden border-t border-white/5 bg-mdn-charcoal transition-[max-height] duration-300 ease-in-out md:hidden ${
          mobileOpen ? "max-h-[42rem]" : "max-h-0"
        }`}
      >
        <div className="flex flex-col gap-1 px-4 py-3">
          <p className="mb-1 mt-1 text-[10px] font-semibold uppercase tracking-widest text-mdn-gray">Explore</p>
          {QUICK_LINKS.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              onClick={() => setMobileOpen(false)}
              className="rounded-md px-2 py-2 text-mdn-white/90 hover:bg-white/5"
            >
              {l.label}
            </Link>
          ))}

          <button
            type="button"
            onClick={() => setMobileShopOpen((o) => !o)}
            aria-expanded={mobileShopOpen}
            className="flex items-center justify-between rounded-md px-2 py-2 text-left text-mdn-white/90 hover:bg-white/5"
          >
            Shop
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              className={`transition-transform duration-300 ${mobileShopOpen ? "rotate-180 text-mdn-green" : ""}`}
            >
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div
            className={`overflow-hidden pl-3 transition-[max-height] duration-300 ease-in-out ${
              mobileShopOpen ? "max-h-64" : "max-h-0"
            }`}
          >
            {SHOP_CATEGORIES.map((c) => (
              <a
                key={c.label}
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileOpen(false)}
                className="block rounded-md px-2 py-2 text-sm text-mdn-gray hover:bg-white/5 hover:text-mdn-green"
              >
                {c.label}
              </a>
            ))}
          </div>

          <p className="mb-1 mt-3 text-[10px] font-semibold uppercase tracking-widest text-mdn-gray">Account</p>

          <div className="flex items-center justify-between rounded-md px-2 py-2">
            <span className="text-sm text-mdn-white/90">Appearance</span>
            <ThemeToggle />
          </div>

          {token && (
            <Link to="/orders" onClick={() => setMobileOpen(false)} className="rounded-md px-2 py-2 text-mdn-white/90 hover:bg-white/5">
              Orders
            </Link>
          )}
          {token && isAdminUser && (
            <Link to="/admin/products" onClick={() => setMobileOpen(false)} className="rounded-md px-2 py-2 text-mdn-white/90 hover:bg-white/5">
              Admin
            </Link>
          )}
          {token ? (
            <Link
              to="/profile"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 rounded-md px-2 py-2 text-mdn-white/90 hover:bg-white/5"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="h-6 w-6 rounded-full object-cover" />
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-mdn-green/15 text-xs font-bold text-mdn-green">
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </span>
              )}
              My Profile
            </Link>
          ) : (
            <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-primary mt-1 text-sm">
              Login with Google
            </Link>
          )}
        </div>
      </div>

      {/* Admin Subnav Panel */}
      {token && isAdminUser && isAdminRoute && (
        <div className="relative z-10 flex gap-4 overflow-x-auto border-t border-white/5 bg-mdn-charcoal px-4 py-2 text-sm sm:px-6">
          {[
            ["/admin/products", "Products"],
            ["/admin/orders", "Orders"],
            ["/admin/users", "Users"],
            ["/admin/coupons", "Coupons"],
          ].map(([to, label]) => (
            <Link
              key={to}
              to={to}
              className={`whitespace-nowrap pb-1 transition-colors ${
                location.pathname === to ? "border-b-2 border-mdn-green text-mdn-green" : "text-mdn-gray hover:text-mdn-white"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}

function SearchGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}
function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 3h2l.4 2M7 13h10l3.6-8H5.4M7 13L5.4 5M7 13l-1.7 4.6A1 1 0 006.24 19H18" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="21" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="17" cy="21" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}
function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}
