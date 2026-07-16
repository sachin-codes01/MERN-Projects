import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCartBadge } from "../context/CartBadgeContext";
import ThemeToggle from "./ThemeToggle";
import mdnLogo from "../assets/mdn-logo.png";

const QUICK_LINKS = [
  { label: "Home", to: "/" },
  { label: "Build Your Bundle", to: "/products/section/fitness_combo" },
  { label: "Shop", to: "/products" },
  { label: "Wholesale", to: "/search?q=wholesale" },
  { label: "Support", to: "/#faq" },
  { label: "Blogs", to: "/search?q=blog" },
];

export default function Navbar() {
  const { user, token } = useAuth();
  const { hasNewItem, clearNewItem } = useCartBadge();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [search, setSearch] = useState("");
  const quickRef = useRef(null);
  const closeTimer = useRef(null);

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

  // Close both menus on navigation so they don't stay open after a link click
  // that doesn't already call setMobileOpen/setQuickOpen itself.
  useEffect(() => {
    setMobileOpen(false);
    setQuickOpen(false);
  }, [location.pathname]);

  // Close the quick-links strip on outside click (covers the "click" trigger;
  // hover is handled with onMouseEnter/Leave + a short close delay below).
  useEffect(() => {
    const onClick = (e) => {
      if (quickOpen && quickRef.current && !quickRef.current.contains(e.target)) {
        setQuickOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [quickOpen]);

  const openQuick = () => {
    clearTimeout(closeTimer.current);
    setQuickOpen(true);
  };
  const scheduleCloseQuick = () => {
    closeTimer.current = setTimeout(() => setQuickOpen(false), 200);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-mdn-black/95 backdrop-blur">
      <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 sm:px-6 md:grid-cols-[1fr_auto_1fr]">
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

        {/* Center — logo */}
        <Link to="/" className="flex items-center justify-center">
          <img src={mdnLogo} alt="MDN — My Daily Nutrition" className="h-8 w-auto sm:h-9" loading="eager" />
        </Link>

        {/* Right — nav links (desktop), theme toggle (desktop only — lives
            in the mobile menu instead so the logo stays centered on small
            screens), cart, login */}
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
                <img src={user.avatar} alt={user.name} className="h-7 w-7 rounded-full object-cover" loading="lazy" />
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

      {/* Quick-links strip — centered trigger below the main navbar, expands
          on hover or click. Desktop only; mobile gets these same links
          folded into the hamburger menu below. Given a label + pulse dot
          so the row doesn't read as an empty sliver. */}
      <div
        ref={quickRef}
        className="relative hidden justify-center border-t border-white/5 md:flex md:py-0.5"
        onMouseEnter={openQuick}
        onMouseLeave={scheduleCloseQuick}
      >
        <button
          onClick={() => setQuickOpen((o) => !o)}
          aria-expanded={quickOpen}
          aria-label="Quick links"
          className="group flex items-center gap-2 px-5 py-2 text-mdn-gray transition-colors hover:text-mdn-green"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-mdn-green animate-pulse" />
          <span className="text-[11px] font-semibold uppercase tracking-widest">
            My Daily Nutrition
          </span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            className={`transition-transform duration-300 ${quickOpen ? "rotate-180 text-mdn-green" : ""}`}
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div
          className={`absolute left-0 right-0 top-full overflow-hidden border-b border-white/5 bg-mdn-charcoal shadow-card transition-[max-height,opacity] duration-300 ease-in-out ${
            quickOpen ? "max-h-16 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 py-3">
            {QUICK_LINKS.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                onClick={() => setQuickOpen(false)}
                className="group relative text-sm font-semibold uppercase tracking-wide text-mdn-white/90 transition-colors duration-200 hover:text-mdn-green"
              >
                {l.label}
                <span className="absolute -bottom-1 left-0 h-[2px] w-full origin-left scale-x-0 bg-mdn-green transition-transform duration-300 ease-out group-hover:scale-x-100" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile menu — everything folds in here: quick links, appearance
          toggle (moved here from the top bar so the logo stays centered),
          catalog links, account. No search — search only lives on the home
          page on mobile. */}
      <div
        className={`overflow-hidden border-t border-white/5 bg-mdn-charcoal transition-[max-height] duration-300 ease-in-out md:hidden ${
          mobileOpen ? "max-h-[36rem]" : "max-h-0"
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

          <p className="mb-1 mt-3 text-[10px] font-semibold uppercase tracking-widest text-mdn-gray">Account</p>

          {/* Theme toggle — lives here on mobile now */}
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
                <img src={user.avatar} alt={user.name} className="h-6 w-6 rounded-full object-cover" loading="lazy" />
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

      {/* Admin subnav */}
      {token && isAdminUser && isAdminRoute && (
        <div className="flex gap-4 overflow-x-auto border-t border-white/5 bg-mdn-charcoal px-4 py-2 text-sm sm:px-6">
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