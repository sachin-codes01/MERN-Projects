import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCartBadge } from "../context/CartBadgeContext";
import ThemeToggle from "./ThemeToggle";
import SearchSuggest from "./SearchSuggest";
import mdnLogo from "../assets/mdn-logo.png";
import { SHOP_CATEGORIES } from "../data/shopCategories";

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
  // Navbar ki live height CSS variable (--nav-h) me — Hero isse banner ko
  // window ke andar fit karta hai (screen size ke saath nav height badalti hai).
  const navRef = useRef(null);
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const set = () => document.documentElement.style.setProperty("--nav-h", `${el.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Bade screen pe search button dabane pe menu chhup ke search poori row leta hai
  const [searchOpen, setSearchOpen] = useState(false);
  // Some Google accounts' avatar URLs occasionally fail to load (dead
  // link, hotlink block, etc). Without this, a failed <img> falls back
  // to the browser's broken-image glyph + alt text instead of the
  // letter-avatar badge — this tracks that failure so we can swap in the
  // fallback ourselves, the same way ProductCard already does for thumbnails.
  const [avatarBroken, setAvatarBroken] = useState(false);

  // Scroll hone pe navbar ko halka shadow + solid background (passive listener, sirf boolean state)
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isAdminRoute = location.pathname.startsWith("/admin");
  const isAdminUser = ["admin", "superadmin"].includes(user?.role);

  const linkClass = ({ active } = {}) =>
    `nav-link label whitespace-nowrap !font-bold text-[13px] !tracking-[0.08em] transition-colors duration-200 hover:text-mdn-green min-[1500px]:text-[14.5px] min-[1500px]:!tracking-[0.09em] ${
      active ? "text-mdn-green" : "text-mdn-ink"
    }`;

  // Close the mobile menu (and the expanded search) on navigation.
  useEffect(() => {
    setMobileOpen(false);
    setMobileShopOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  // Esc se expanded search band
  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e) => e.key === "Escape" && setSearchOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen]);

  // Re-attempt the avatar image whenever the logged-in user (or their
  // avatar URL) changes, instead of staying stuck on the fallback forever.
  useEffect(() => {
    setAvatarBroken(false);
  }, [user?.avatar]);

  // Icon + chhota label wala action (reference ka "Profile" / "Bag" jaisa)
  const actionClass =
    "tap-44 relative flex flex-col items-center gap-0.5 text-mdn-ink transition-colors duration-200 hover:text-mdn-green";
  const actionLabel = "hidden text-[12px] font-semibold leading-none sm:block min-[1500px]:text-[13px]";

  return (
    <nav
      ref={navRef}
      // Solid background, backdrop-blur nahi — blur ke neeche chalta video har frame
      // dobara blur hota tha, jisse scroll pe banner flicker karta tha.
      className={`sticky top-0 z-50 border-b bg-mdn-charcoal/[0.98] transition-[box-shadow,border-color] duration-300 ${
        scrolled ? "border-mdn-border shadow-md" : "border-transparent"
      }`}
    >
      {/* Single row — hamburger + logo | links (xl) / search | actions */}
      {/* xl+: grid [logo | links | icons] — links beech wale column me centre, isliye
          logo aur icons dono taraf barabar gap rehta hai (koi side khaali nahi lagti) */}
      <div className="relative z-30 mx-auto flex max-w-shell items-center gap-3 px-4 py-2.5 sm:gap-5 sm:px-6 lg:px-[34px] xl:grid xl:grid-cols-[auto_1fr_auto] xl:py-3">
        <button
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle menu"
          className="tap-44 -ml-1.5 rounded-md p-2 text-mdn-ink transition-colors hover:bg-mdn-sand xl:hidden"
        >
          {mobileOpen ? <CloseIcon /> : <MenuIcon />}
        </button>

        {/* Logo — reference jaisa left side pe */}
        <Link to="/" className="flex flex-shrink-0 flex-col items-center justify-center leading-none xl:justify-self-start">
          <span className="relative block h-7 w-14 sm:h-8 sm:w-16 min-[1500px]:h-10 min-[1500px]:w-20">
            <img
              src={mdnLogo}
              alt="MDN — My Daily Nutrition"
              loading="eager"
              className="absolute left-1/2 top-1/2 h-12 w-auto -translate-x-1/2 -translate-y-1/2 sm:h-14 min-[1500px]:h-[68px]"
            />
          </span>
          <span className="label mt-1 whitespace-nowrap text-[7.5px] tracking-[0.2em] text-mdn-ink-muted sm:text-[8.5px] min-[1500px]:text-[10px]">
            My Daily Nutrition
          </span>
        </Link>

        {/* xl+: reference jaisa — logo ke theek baad menu links.
            Search khulne pe yeh chhup jate hain aur search poori row le leta hai. */}
        {!searchOpen && (
          <div className="hidden items-center justify-center gap-x-6 xl:flex min-[1500px]:gap-x-10">
            <Link to="/" aria-current={location.pathname === "/" ? "page" : undefined} className={linkClass({ active: location.pathname === "/" })}>
              Home
            </Link>

            {/* Shop dropdown — panel navbar row ke neeche centre me khulta hai */}
            <div className="group">
              <button
                type="button"
                className="press flex items-center gap-1 whitespace-nowrap rounded-full bg-mdn-ink px-3.5 py-1.5 label !font-bold text-[12.5px] !tracking-[0.08em] text-mdn-charcoal min-[1500px]:px-4 min-[1500px]:py-2 min-[1500px]:text-[13.5px] transition-colors duration-200 hover:bg-mdn-green"
              >
                Shop
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  className="transition-transform duration-200 group-hover:rotate-180"
                >
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {/* Hover pe turant khulta hai, band hone se pehle 500ms rukta hai —
                  taaki button se panel tak mouse le jaate waqt band na ho jaye. */}
              <div className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 translate-y-2 pt-1 opacity-0 transition-[opacity,transform,visibility] delay-500 duration-300 ease-brand-out group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-hover:delay-0">
                <div className="w-[92vw] max-w-4xl rounded-2xl border border-mdn-border bg-mdn-charcoal p-5 shadow-lg">
                  <div className="mb-4 flex items-end justify-between gap-4 border-b border-mdn-border pb-3">
                    <div>
                      <p className="eyebrow">Shop</p>
                      <h3 className="display-md mt-0.5">Browse by Category</h3>
                    </div>
                    <Link
                      to="/products"
                      className="group/all inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border border-mdn-green/40 px-4 py-1.5 label text-[11px] text-mdn-green transition-all duration-200 hover:border-mdn-green hover:bg-mdn-green hover:text-mdn-on-primary"
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

            <Link to="/products" aria-current={location.pathname === "/products" ? "page" : undefined} className={linkClass({ active: location.pathname === "/products" })}>
              Products
            </Link>

            {/* Blogs desktop row me nahi (bheed kam) — footer + mobile drawer me milta hai */}
            {QUICK_LINKS.filter((l) => l.label !== "Home" && l.label !== "Blogs").map((l) =>
              l.label === "Build Your Bundle" ? (
                <Link
                  key={l.label}
                  to={l.to}
                  className="btn-shine press whitespace-nowrap rounded-full bg-mdn-orange-solid px-3.5 py-1.5 label !font-bold text-[12.5px] !tracking-[0.08em] text-white min-[1500px]:px-4 min-[1500px]:py-2 min-[1500px]:text-[13.5px] transition-colors duration-200 hover:bg-mdn-orange-hover"
                >
                  {l.label}
                </Link>
              ) : (
                <Link key={l.label} to={l.to} aria-current={location.pathname === l.to ? "page" : undefined} className={linkClass({ active: location.pathname === l.to })}>
                  {l.label}
                </Link>
              )
            )}
          </div>
        )}

        {/* xl+: expanded search — poori row + close button */}
        {searchOpen && (
          <div className="hidden w-[min(700px,56vw)] animate-fade-up items-center justify-center gap-3 xl:flex xl:justify-self-center">
            {/* Poori row nahi — comfortable width pe centre me */}
            <SearchSuggest
              className="flex-1"
              autoFocus
              placeholder={'Search for "Whey Protein", "Creatine"...'}
              onNavigate={() => setSearchOpen(false)}
            />
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              aria-label="Close search"
              className="press flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-mdn-border-strong text-mdn-ink hover:border-mdn-ink hover:bg-mdn-ink hover:text-mdn-charcoal"
            >
              <CloseIcon />
            </button>
          </div>
        )}

        {/* md–xl: search isi row me inline; mobile pe neeche apni row me */}
        <div className="hidden flex-1 justify-center md:flex xl:hidden">
          <SearchSuggest className="w-full max-w-xl" />
        </div>
        <div className="flex-1 md:hidden" />

        {/* Right — theme, orders, admin, profile/login, cart */}
        <div className="flex items-center gap-3.5 sm:gap-5 xl:gap-4 xl:justify-self-end min-[1500px]:gap-7">
          {!searchOpen && (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Open search"
              className="press hidden h-10 w-10 items-center justify-center rounded-full min-[1500px]:h-11 min-[1500px]:w-11 border border-mdn-border-strong bg-mdn-charcoal text-mdn-ink hover:border-mdn-green hover:bg-mdn-green hover:text-mdn-on-primary xl:flex"
            >
              <SearchIcon />
            </button>
          )}
          {/* Admin ke 2 extra icons ke liye 1280–1535px pe jagah chahiye — tab theme
              toggle Profile page ke "Appearance" me milta hai */}
          {/* Compact toggle (md–1499px); 1500px+ pe sun/moon icons wala full toggle — right side ki khaali jagah bharta hai */}
          <ThemeToggle
            compact
            className={`hidden md:flex min-[1500px]:!hidden ${token && isAdminUser ? "xl:hidden" : ""}`}
          />
          <ThemeToggle className={`hidden ${token && isAdminUser ? "min-[1680px]:flex" : "min-[1500px]:flex"}`} />

          {token && (
            <Link
              to="/orders"
              className={`${actionClass} hidden lg:flex ${location.pathname === "/orders" ? "!text-mdn-green" : ""}`}
            >
              <OrdersIcon />
              <span className={actionLabel}>Orders</span>
            </Link>
          )}
          {token && isAdminUser && (
            <Link
              to="/admin/products"
              className={`${actionClass} hidden lg:flex ${isAdminRoute ? "!text-mdn-green" : ""}`}
            >
              <AdminIcon />
              <span className={actionLabel}>Admin</span>
            </Link>
          )}

          <Link to="/cart" onClick={clearNewItem} className={actionClass} aria-label="Cart">
            <span className="relative">
              <CartIcon />
              {hasNewItem && (
                <span className="absolute -right-1.5 -top-1.5 flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping-slow rounded-full bg-mdn-orange-badge opacity-90" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-mdn-orange-badge" />
                </span>
              )}
            </span>
            <span className={actionLabel}>Cart</span>
          </Link>

          {/* Profile / Login sabse aakhir me */}
          {token ? (
            <Link to="/profile" className={actionClass} aria-label="Profile">
              {user?.avatar && !avatarBroken ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  onError={() => setAvatarBroken(true)}
                  className="h-[22px] w-[22px] rounded-full object-cover"
                />
              ) : (
                <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-mdn-green text-[11px] font-bold text-mdn-on-primary">
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </span>
              )}
              <span className={actionLabel}>Profile</span>
            </Link>
          ) : (
            <Link to="/login" className={actionClass} aria-label="Login">
              <UserIcon />
              <span className={actionLabel}>Login</span>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile search row — reference mobile jaisa, hamesha dikhta hai */}
      <div className="relative z-20 px-4 pb-2.5 sm:px-6 md:hidden">
        <SearchSuggest onNavigate={() => setMobileOpen(false)} placeholder="Search whey, creatine..." />
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
        className={`relative z-10 grid overflow-hidden border-t border-mdn-border bg-mdn-charcoal transition-[grid-template-rows] duration-300 ease-in-out xl:hidden ${
          mobileOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
        <div className="flex flex-col gap-1 px-4 py-3">
          {/* The search box previously existed only on md+ (`hidden md:block`
              on the desktop bar), so phone users had no way to search at
              all — the same autocomplete component is mounted here, and
              closes the drawer once it navigates. */}
          {/* Search ab mobile pe apni row me aur tablet pe row 1 me hai — drawer me dobara nahi chahiye */}

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

function SearchIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
    </svg>
  );
}
function OrdersIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3.5 7.5l8.5-4 8.5 4v9l-8.5 4-8.5-4v-9z" strokeLinejoin="round" />
      <path d="M3.5 7.5l8.5 4 8.5-4M12 11.5v9" strokeLinejoin="round" />
    </svg>
  );
}
function AdminIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3z" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
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
