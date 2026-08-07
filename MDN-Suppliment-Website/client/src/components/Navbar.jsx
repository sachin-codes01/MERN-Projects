import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCartBadge } from "../context/CartBadgeContext";
import ThemeToggle from "./ThemeToggle";
import SearchSuggest from "./SearchSuggest";
import mdnLogo from "../assets/mdn-logo.png";
import allProductsImg from "../assets/All Products.png";
import wheyProteinImg from "../assets/Whey Protein.png";
import newLaunchesImg from "../assets/New Launches.png";
import veganProteinImg from "../assets/Vegan Protein.png";
import aminoAcidsImg from "../assets/Amino Acids.png";
import peanutButterImg from "../assets/Peanut Butter.png";
import supplementsImg from "../assets/Supplements.png";
import combosImg from "../assets/Combos.png";
import accessoriesImg from "../assets/Accessories.png";

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
// Each entry carries its own transparent cut-out PNG, matched to the
// category by name.
const SHOP_CATEGORIES = [
  { label: "All Products", to: "/products", image: allProductsImg },
  { label: "Whey Protein", to: "/search?q=whey%20protein", image: wheyProteinImg },
  { label: "New Launches", to: "/products/section/new_arrival", image: newLaunchesImg },
  { label: "Vegan Protein", to: "/search?q=vegan%20protein", image: veganProteinImg },
  { label: "Amino Acids", to: "/search?q=amino%20acids", image: aminoAcidsImg },
  { label: "Peanut Butter", to: "/search?q=peanut%20butter", image: peanutButterImg },
  { label: "Supplements", to: "/search?q=supplements", image: supplementsImg },
  { label: "Combos", to: "/products/section/fitness_combo", image: combosImg },
  { label: "Accessories", to: "/search?q=accessories", image: accessoriesImg },
];

// The mega-menu header already has a "View All" button, so the card row
// itself skips the "All Products" entry to avoid showing it twice.
const SHOP_ROW_CATEGORIES = SHOP_CATEGORIES.filter((c) => c.label !== "All Products");

// Image-first "shop by category" tile used in both the desktop Shop
// mega-menu and the mobile Shop accordion. Name sits below the image —
// the whole tile is the hover target (`group/card`), so the artwork, its
// glow, and the label all respond together.
//
// No card chrome: the artwork is a transparent cut-out that sits directly
// on the menu surface, lit from behind by a soft green glow instead of
// being boxed in by a border/fill.
//
// `object-contain` inside a fixed SQUARE box is what keeps the layout
// stable — the source art ranges from 0.67 (tall tubs) through 1.54
// (landscape gym bag), so `cover` would crop them and any height-driven
// sizing would give every tile a different footprint and break the grid.
// Contain letterboxes each cut-out inside an identical square, so all
// nine tiles occupy exactly the same space whatever their source ratio.
function ShopCategoryCard({ label, image }) {
  return (
    <div className="group/card flex flex-col items-center gap-1.5 transition-transform duration-200 hover:-translate-y-1">
      <div className="relative flex aspect-square w-full items-center justify-center">
        {/* Glow sits BEHIND the artwork (own layer, image is `relative`
            above it). Blurred green disc rather than a box-shadow so it
            reads as light spilling off the product, with no edge to hint
            at a card that isn't there. Pooled low (not box-centred) so it
            sits under the product's base now that the art is
            bottom-aligned, like light cast on the surface it stands on. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[4%] left-1/2 h-[62%] w-[78%] -translate-x-1/2 rounded-full bg-mdn-green/12 blur-[16px] transition-all duration-300 group-hover/card:bg-mdn-green/25 group-hover/card:blur-[22px]"
        />
        {image ? (
          // alt="" — the visible label below is inside the same <Link> and
          // already names it, so alt text would just double-announce.
          //
          // `object-bottom` stands every product on the same baseline
          // whatever its ratio, instead of contain-centring each one at a
          // different height inside its box.
          //
          // `absolute inset-0` (not `relative h-full w-full`) is what
          // keeps the tiles square. In normal flow `h-full` (height:100%)
          // has no definite parent height to resolve against — the box
          // only sets aspect-ratio — so the image fell back to its
          // intrinsic height and, since min-height is auto, stretched the
          // box past square: 0.67-ratio art made it 92x138, 0.79 made it
          // 92x116, while 1.0+ art stayed 92x92. Tiles ended up different
          // heights and the labels staircased (tops at 307/330/353). Out
          // of flow the image can't affect the box, so aspect-square
          // always wins and every tile is exactly 92x92.
          <img
            src={image}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-contain object-bottom drop-shadow-[0_3px_8px_rgba(66,48,30,0.22)] transition-transform duration-300 group-hover/card:scale-110"
          />
        ) : (
          <PlaceholderBoxIcon className="relative h-1/3 w-1/3 text-mdn-green/50" />
        )}
      </div>
      {/* Wraps to a second line instead of truncating. `truncate` cut off
          7 of the 8 desktop labels ("Whey Protein" needs 84px in a 72px
          tile); the longest unbreakable word is "SUPPLEMENTS" at 81px,
          which is what sets the minimum tile width below. Every tile's
          first line still starts at the same y, since the square image
          box above it is a fixed height — so wrapping can't stagger the
          row. */}
      <span className="block w-full label text-balance text-center text-[10.5px] leading-tight tracking-[0.1em] text-mdn-ink-body transition-colors duration-200 line-clamp-2 group-hover/card:text-mdn-green">
        {label}
      </span>
    </div>
  );
}

export default function Navbar() {
  const { user, token } = useAuth();
  const { hasNewItem, clearNewItem } = useCartBadge();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileShopOpen, setMobileShopOpen] = useState(false);
  // Some Google accounts' avatar URLs occasionally fail to load (dead
  // link, hotlink block, etc). Without this, a failed <img> falls back
  // to the browser's broken-image glyph + alt text instead of the
  // letter-avatar badge — this tracks that failure so we can swap in the
  // fallback ourselves, the same way ProductCard already does for thumbnails.
  const [avatarBroken, setAvatarBroken] = useState(false);

  const isAdminRoute = location.pathname.startsWith("/admin");
  const isAdminUser = ["admin", "superadmin"].includes(user?.role);

  const linkClass = ({ active } = {}) =>
    `label text-[13px] transition-colors duration-200 hover:text-mdn-green ${
      active ? "text-mdn-green" : "text-mdn-ink-body"
    }`;

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
    <nav className="sticky top-0 z-50 border-b border-mdn-border bg-mdn-black/95 backdrop-blur">
      {/* Main Bar Top Grid */}
      <div className="relative z-10 mx-auto grid max-w-shell grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-2.5 sm:px-6 lg:px-[34px] md:grid-cols-[1fr_auto_1fr]">
        {/* Left — hamburger (mobile) / search (desktop) */}
        <div className="flex items-center">
          <button
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
            /* p-2.5 + the 22px glyph gives a 42px box, and `tap-44`
               tops it up to the 44px minimum. This was p-1.5 → 34x34,
               under the threshold for the primary mobile nav control. */
            className="tap-44 -ml-1 rounded-md p-2.5 text-mdn-ink transition-colors hover:bg-mdn-sand md:hidden"
          >
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </button>

          <SearchSuggest className="hidden w-full max-w-xs md:block" />
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
          <span className="label mt-1 whitespace-nowrap text-[9px] tracking-[0.22em] text-mdn-ink-muted sm:text-[10px]">
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
            /* The cart was a bare 20x20 SVG — the smallest tap target on
               the site and one of the most used. `tap-44` grows the hit
               region to 44x44 without changing the glyph or the
               navbar's row height. */
            className="tap-44 relative flex items-center text-mdn-ink transition-colors duration-200 hover:text-mdn-green"
            aria-label="Cart"
          >
            <CartIcon />
            {hasNewItem && (
              <span className="absolute -right-1.5 -top-1.5 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping-slow rounded-full bg-mdn-orange-badge opacity-90" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-mdn-orange-badge" />
              </span>
            )}
          </Link>

          {token ? (
            <Link to="/profile" className="hidden items-center gap-2 text-sm text-mdn-ink hover:text-mdn-green sm:flex">
              {user?.avatar && !avatarBroken ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  onError={() => setAvatarBroken(true)}
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-mdn-green text-xs font-bold text-white">
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
      <div className="relative z-10 hidden justify-center border-t border-mdn-border md:flex">
        <div className="mx-auto flex max-w-shell flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 sm:px-6 lg:px-[34px] py-2.5">
          <Link
            to="/"
            className="group relative label text-[13.5px] text-mdn-ink transition-colors duration-200 hover:text-mdn-green"
          >
            Home
            <span className="absolute -bottom-1 left-0 h-[2px] w-full origin-left scale-x-0 bg-mdn-green transition-transform duration-300 ease-out group-hover:scale-x-100" />
          </Link>

          {/* Shop Dropdown */}
          <div className="group relative">
            <button
              type="button"
              className="flex items-center gap-1 label text-[13.5px] text-mdn-ink transition-colors duration-200 hover:text-mdn-green"
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
              <div className="w-[92vw] max-w-4xl rounded-2xl border border-mdn-border bg-mdn-charcoal p-5 shadow-lg">
                <div className="mb-4 flex items-end justify-between gap-4 border-b border-mdn-border pb-3">
                  <div>
                    <p className="eyebrow">Shop</p>
                    <h3 className="display-md mt-0.5">Browse by Category</h3>
                  </div>
                  <Link
                    to="/products"
                    className="group/all inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border border-mdn-green/40 px-4 py-1.5 label text-[11px] text-mdn-green transition-all duration-200 hover:border-mdn-green hover:bg-mdn-green hover:text-white"
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
                {/* max-w-[92px] = the widest full label ("Peanut Butter"),
                    so every name fits on one line here. The 8 columns of
                    this panel are ~96.5px wide, so this still leaves
                    breathing room — the old 72px cap was throwing away
                    ~24px per column and truncating almost every label. */}
                <div className="grid grid-cols-8 justify-items-center gap-3">
                  {SHOP_ROW_CATEGORIES.map((c) => (
                    <Link key={c.label} to={c.to} className="w-full max-w-[92px]">
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
              className="group relative label text-[13.5px] text-mdn-ink transition-colors duration-200 hover:text-mdn-green"
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
        className={`relative z-10 grid overflow-hidden border-t border-mdn-border bg-mdn-charcoal transition-[grid-template-rows] duration-300 ease-in-out md:hidden ${
          mobileOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
        <div className="flex flex-col gap-1 px-4 py-3">
          {/* The search box previously existed only on md+ (`hidden md:block`
              on the desktop bar), so phone users had no way to search at
              all — the same autocomplete component is mounted here, and
              closes the drawer once it navigates. */}
          <SearchSuggest className="mb-3" onNavigate={() => setMobileOpen(false)} />

          <p className="eyebrow mb-1 mt-1">Explore</p>
          {QUICK_LINKS.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              onClick={() => setMobileOpen(false)}
              className="rounded-md px-2 py-2.5 text-mdn-ink hover:bg-mdn-sand"
            >
              {l.label}
            </Link>
          ))}

          <button
            type="button"
            onClick={() => setMobileShopOpen((o) => !o)}
            aria-expanded={mobileShopOpen}
            className="flex items-center justify-between rounded-md px-2 py-2.5 text-left text-mdn-ink hover:bg-mdn-sand"
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
              {/* 84px track (was 64px): "SUPPLEMENTS" is a single
                  unbreakable 81px word, so anything narrower clipped it no
                  matter how the label wraps. Longer two-word names wrap to
                  a second line at this width instead of being cut. */}
              <div className="grid grid-cols-[repeat(auto-fill,84px)] justify-center gap-3 py-2 pr-2">
                {SHOP_CATEGORIES.map((c) => (
                  <Link key={c.label} to={c.to} onClick={() => setMobileOpen(false)}>
                    <ShopCategoryCard label={c.label} image={c.image} />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <p className="eyebrow mb-1 mt-3">Account</p>

          <div className="flex items-center justify-between rounded-md px-2 py-2">
            <span className="text-sm text-mdn-ink">Appearance</span>
            <ThemeToggle />
          </div>

          {token && (
            <Link to="/orders" onClick={() => setMobileOpen(false)} className="rounded-md px-2 py-2.5 text-mdn-ink hover:bg-mdn-sand">
              Orders
            </Link>
          )}
          {token && isAdminUser && (
            <Link to="/admin/products" onClick={() => setMobileOpen(false)} className="rounded-md px-2 py-2.5 text-mdn-ink hover:bg-mdn-sand">
              Admin
            </Link>
          )}
          {token ? (
            <Link
              to="/profile"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 rounded-md px-2 py-2 text-mdn-ink hover:bg-mdn-sand"
            >
              {user?.avatar && !avatarBroken ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  onError={() => setAvatarBroken(true)}
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-mdn-green text-xs font-bold text-white">
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
        <div className="relative z-10 flex gap-4 overflow-x-auto border-t border-mdn-border bg-mdn-charcoal px-4 py-2 text-sm sm:px-6">
          {[
            ["/admin/products", "Products"],
            ["/admin/orders", "Orders"],
            ["/admin/users", "Users"],
            ["/admin/coupons", "Coupons"],
            ["/admin/enquiries", "Enquiries"],
            ["/admin/settings", "Settings"],
          ].map(([to, label]) => (
            <Link
              key={to}
              to={to}
              className={`whitespace-nowrap pb-1 transition-colors ${
                location.pathname === to ? "border-b-2 border-mdn-green text-mdn-green" : "text-mdn-ink-muted hover:text-mdn-ink"
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
