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
import { useSettings } from "../context/SettingsContext";

const QUICK_LINKS = [
  { label: "Home", to: "/" },
  { label: "Build Your Bundle", to: "/products/section/fitness_combo" },
  { label: "Wholesale", to: "/search?q=wholesale" },
  // NOTE: this used to point at "/#faq" — now routes to the dedicated
  // Customer Support page instead, per request. Everything else about
  // the navbar is untouched.
  { label: "Customer Support", to: "/support" },
  { label: "Blogs", to: "/blogs" },
];

// In-site collection links (internal routes, react-router Links below —
// these used to point at asitisnutrition.com by mistake).
// `image` is left `null` until real category photos exist — drop a URL
// (or an `import`-ed local asset) into any entry and its card below picks
// it up automatically; until then it renders the placeholder tile.
const SHOP_CATEGORIES = [
  { label: "All Products", to: "/products", image: null },
  { label: "Whey Protein", to: "/search?q=whey%20protein", image: null },
  { label: "New Launches", to: "/products/section/new_arrival", image: null },
  { label: "Vegan Protein", to: "/search?q=vegan%20protein", image: null },
  { label: "Amino Acids", to: "/search?q=amino%20acids", image: null },
  { label: "Peanut Butter", to: "/search?q=peanut%20butter", image: null },
  { label: "Supplements", to: "/search?q=supplements", image: null },
  { label: "Combos", to: "/products/section/fitness_combo", image: null },
  { label: "Accessories", to: "/search?q=accessories", image: null },
];

// The mega-menu header already has a "View All" button, so the card row
// itself skips the "All Products" entry to avoid showing it twice.
const SHOP_ROW_CATEGORIES = SHOP_CATEGORIES.filter((c) => c.label !== "All Products");

// Image-first "shop by category" tile used in both the desktop Shop
// mega-menu and the mobile Shop accordion. Falls back to a soft branded
// placeholder (no broken-image icon) until a real photo is set on the
// category above. Name sits below the image (not overlaid on it) — the
// whole tile is the hover target (`group/card`), so the image box, its
// border/glow, and the label all respond together.
function ShopCategoryCard({ label, image }) {
  return (
    <div className="group/card flex flex-col items-center gap-1.5 transition-transform duration-200 hover:-translate-y-1">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-white/10 bg-mdn-charcoal2 shadow-sm transition-all duration-200 group-hover/card:border-mdn-green/60 group-hover/card:shadow-green-glow">
        {image ? (
          <img
            src={image}
            alt={label}
            className="h-full w-full object-cover transition-transform duration-300 group-hover/card:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-mdn-green/20 to-mdn-charcoal2">
            <PlaceholderBoxIcon className="h-1/3 w-1/3 text-mdn-green/60" />
          </div>
        )}
      </div>
      <span className="block max-w-full truncate text-center text-[10.5px] font-semibold uppercase tracking-wide text-mdn-white/80 transition-colors duration-200 group-hover/card:text-mdn-green">
        {label}
      </span>
    </div>
  );
}

export default function Navbar() {
  const { user, token } = useAuth();
  const { hasNewItem, clearNewItem } = useCartBadge();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileShopOpen, setMobileShopOpen] = useState(false);
  const [search, setSearch] = useState("");
  // Some Google accounts' avatar URLs occasionally fail to load (dead
  // link, hotlink block, etc). Without this, a failed <img> falls back
  // to the browser's broken-image glyph + alt text instead of the
  // letter-avatar badge — this tracks that failure so we can swap in the
  // fallback ourselves, the same way ProductCard already does for thumbnails.
  const [avatarBroken, setAvatarBroken] = useState(false);
  // The WebGL fluid-cursor background is heavy enough to make small
  // screens laggy — only mount it from `lg` up, where a mouse cursor
  // actually drives it and there's headroom to render it smoothly.
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const { splashCursorEnabled } = useSettings();

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

  // Re-attempt the avatar image whenever the logged-in user (or their
  // avatar URL) changes, instead of staying stuck on the fallback forever.
  useEffect(() => {
    setAvatarBroken(false);
  }, [user?.avatar]);

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-mdn-black/95 backdrop-blur">
      {/* Background WebGL Fluid Canvas */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
     {splashCursorEnabled && isDesktop && hasWebGLSupport() && (
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
          {/* Reserved box keeps its ORIGINAL footprint (h-8/sm:h-9) so the
              navbar's row height never changes — the actual <img> is
              rendered larger and absolutely centered on top of it,
              overflowing the box visually instead of pushing layout.
              Footer's logo uses this exact same box + image size so the
              two stay visually identical. */}
          <span className="relative block h-8 w-16 sm:h-9 sm:w-20">
            <img
              src={mdnLogo}
              alt="MDN — My Daily Nutrition"
              loading="eager"
              className="absolute left-1/2 top-1/2 h-14 w-auto -translate-x-1/2 -translate-y-1/2 sm:h-16"
            />
          </span>
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
              {user?.avatar && !avatarBroken ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  onError={() => setAvatarBroken(true)}
                  className="h-7 w-7 rounded-full object-cover"
                />
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

            {/* `fixed` (not `absolute`) so the panel centers on the whole
                viewport instead of under the Shop button, which itself
                isn't centered in the strip. It still opens/closes correctly
                off the *same* CSS :hover, because it's a DOM descendant of
                `.group` — the browser counts hovering it as hovering the
                group regardless of where it's visually positioned.
                `top-28` = the navbar's measured 112px height, so the panel
                sits flush beneath it. */}
            <div className="invisible fixed left-1/2 top-28 z-50 -translate-x-1/2 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
              <div className="w-[92vw] max-w-4xl rounded-2xl border border-white/10 bg-mdn-charcoal/95 p-5 shadow-2xl shadow-black/50 backdrop-blur-sm">
                <div className="mb-4 flex items-end justify-between gap-4 border-b border-white/10 pb-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-mdn-green">Shop</p>
                    <h3 className="mt-0.5 text-lg font-bold text-mdn-white">Browse by Category</h3>
                  </div>
                  <Link
                    to="/products"
                    className="group/all inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border border-mdn-green/40 px-4 py-1.5 text-xs font-semibold text-mdn-green transition-all duration-200 hover:border-mdn-green hover:bg-mdn-green hover:text-black"
                  >
                    View All
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.6"
                      className="transition-transform duration-200 group-hover/all:translate-x-0.5"
                    >
                      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </div>

                {/* Fixed column count (not fixed-width + scroll) — columns
                    shrink to fit the panel exactly, so it's always a single
                    row with no slide/scrollbar, no matter the viewport. No
                    `overflow-hidden` on this row either, so a card's hover
                    lift/glow near the edges never gets clipped.
                    `justify-items-center` + a `max-w` on each card keeps the
                    tiles a fixed, compact size — without it, a column just
                    stretches to fill the full panel width, which is what
                    made cards balloon up on tablet-width viewports. */}
                <div className="grid grid-cols-8 justify-items-center gap-3">
                  {SHOP_ROW_CATEGORIES.map((c) => (
                    <Link key={c.label} to={c.to} className="w-full max-w-[72px]">
                      <ShopCategoryCard label={c.label} image={c.image} />
                    </Link>
                  ))}
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

      {/* Mobile Drawer Menu — same grid-template-rows technique as the Shop
          accordion inside it: the Shop section's height varies (collapsed
          vs. 3 rows of category cards), so a guessed `max-height` here
          would either clip when Shop is open or leave dead space when it's
          not. `1fr` always matches the real content height.
          The `overflow-hidden` that makes `0fr` actually collapse to zero
          has to sit on a padding-less wrapper — putting it on the same
          element as `px-4 py-3` still rendered that padding at height 0
          (padding isn't "content", so collapsing doesn't remove it), which
          is what showed as the gap with "Explore" peeking through above
          the Hero. */}
      <div
        className={`relative z-10 grid overflow-hidden border-t border-white/5 bg-mdn-charcoal transition-[grid-template-rows] duration-300 ease-in-out md:hidden ${
          mobileOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
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
          {/* Animates via `grid-template-rows` (0fr -> 1fr) instead of a
              guessed `max-height` — a fixed max-h cut the 3rd row of cards
              off (it clipped mid-row, bleeding into the Hero below) because
              9 cards at this card size run taller than any one guessed
              number. `1fr` always matches the real content height exactly,
              so it can't clip no matter how many categories/rows there are. */}
          <div
            className={`grid overflow-hidden pl-3 transition-[grid-template-rows] duration-300 ease-in-out ${
              mobileShopOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="min-h-0 overflow-hidden">
              {/* `auto-fill` with a fixed 76px track — not a rigid
                  `grid-cols-3` — so the column COUNT adapts to whatever
                  width the drawer actually has: more columns (fewer rows)
                  on a wider phone, fewer columns on a narrow one. A fixed
                  column count either forces 3 rows even when 2 (or 1) would
                  fit, or stretches cards to fill leftover space; this does
                  neither — cards stay a fixed size and the row just packs
                  as many as actually fit, `justify-center` centering
                  whatever's left over instead of leaving it blank on one side. */}
              <div className="grid grid-cols-[repeat(auto-fill,64px)] justify-center gap-3 py-2 pr-2">
                {SHOP_CATEGORIES.map((c) => (
                  <Link key={c.label} to={c.to} onClick={() => setMobileOpen(false)}>
                    <ShopCategoryCard label={c.label} image={c.image} />
                  </Link>
                ))}
              </div>
            </div>
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
              {user?.avatar && !avatarBroken ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  onError={() => setAvatarBroken(true)}
                  className="h-6 w-6 rounded-full object-cover"
                />
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
      </div>

      {/* Admin Subnav Panel */}
      {token && isAdminUser && isAdminRoute && (
        <div className="relative z-10 flex gap-4 overflow-x-auto border-t border-white/5 bg-mdn-charcoal px-4 py-2 text-sm sm:px-6">
          {[
            ["/admin/products", "Products"],
            ["/admin/orders", "Orders"],
            ["/admin/users", "Users"],
            ["/admin/coupons", "Coupons"],
            ["/admin/settings", "Settings"],
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
function PlaceholderBoxIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <path d="M3.5 7.5l8.5-4 8.5 4-8.5 4-8.5-4z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.5 7.5v9l8.5 4M20.5 7.5v9l-8.5 4M12 11.5v9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
