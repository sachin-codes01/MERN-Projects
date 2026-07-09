import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCartBadge } from "../context/CartBadgeContext";

export default function Navbar() {
  const { user, token, logout } = useAuth();
  const { hasNewItem, clearNewItem } = useCartBadge();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdminRoute = location.pathname.startsWith("/admin");
  const isAdminUser = ["admin", "superadmin"].includes(user?.role);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setMobileOpen(false);
  };

  const linkClass = ({ active } = {}) =>
    `text-sm font-medium tracking-wide transition-colors duration-200 hover:text-mdn-green ${
      active ? "text-mdn-green" : "text-mdn-white/90"
    }`;

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-mdn-black/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-baseline font-display text-xl font-bold tracking-widest text-mdn-white">
          MDN<span className="text-mdn-green">.</span>
          <AnimatedTagline />
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-6 md:flex">
          <Link to="/products" className={linkClass({ active: location.pathname === "/products" })}>
            Products
          </Link>

          <Link
            to="/cart"
            onClick={clearNewItem}
            className="relative flex items-center gap-1.5 text-sm font-medium text-mdn-white/90 transition-colors duration-200 hover:text-mdn-green"
          >
            <CartIcon />
            Cart
            {hasNewItem && (
              <span className="absolute -right-2 -top-1.5 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping-slow rounded-full bg-red-500 opacity-90" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
              </span>
            )}
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

          {token ? (
            <div className="flex items-center gap-3 pl-3">
              <span className="text-sm text-mdn-gray">Hi, {user?.name?.split(" ")[0]}</span>
              <button onClick={handleLogout} className="btn-secondary !px-4 !py-1.5 text-sm">
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 pl-3">
              <Link to="/login" className={linkClass()}>
                Login
              </Link>
              <Link to="/register" className="btn-primary !px-4 !py-1.5 text-sm">
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <div className="flex items-center gap-3 md:hidden">
          <Link to="/cart" onClick={clearNewItem} className="relative">
            <CartIcon />
            {hasNewItem && (
              <span className="absolute -right-1.5 -top-1.5 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping-slow rounded-full bg-red-500 opacity-90" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
              </span>
            )}
          </Link>
          <button
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
            className="rounded-md p-1.5 text-mdn-white transition-colors hover:bg-white/5"
          >
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`overflow-hidden border-t border-white/5 bg-mdn-charcoal transition-[max-height] duration-300 ease-in-out md:hidden ${
          mobileOpen ? "max-h-96" : "max-h-0"
        }`}
      >
        <div className="flex flex-col gap-1 px-4 py-3">
          <Link to="/products" onClick={() => setMobileOpen(false)} className="rounded-md px-2 py-2 text-mdn-white/90 hover:bg-white/5">
            Products
          </Link>
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
            <button onClick={handleLogout} className="mt-1 rounded-md px-2 py-2 text-left text-red-400 hover:bg-white/5">
              Logout
            </button>
          ) : (
            <div className="mt-1 flex gap-2">
              <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-secondary flex-1 text-sm">
                Login
              </Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-primary flex-1 text-sm">
                Register
              </Link>
            </div>
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

/**
 * "My Daily Nutrition" — the full form of MDN.
 * Cycles: slides in next to the logo, holds for a moment,
 * then slides left (toward "MDN.") and fades out, repeating every few seconds.
 */
function AnimatedTagline() {
  const [phase, setPhase] = useState("hidden"); // hidden -> entering -> visible -> leaving -> hidden

  useEffect(() => {
    let timers = [];

    const runCycle = () => {
      setPhase("entering");
      timers.push(setTimeout(() => setPhase("visible"), 50));
      timers.push(setTimeout(() => setPhase("leaving"), 2400));
      timers.push(setTimeout(() => setPhase("hidden"), 3000));
    };

    runCycle();
    const interval = setInterval(runCycle, 6000);

    return () => {
      clearInterval(interval);
      timers.forEach(clearTimeout);
    };
  }, []);

  const stateClasses =
    phase === "visible"
      ? "max-w-[190px] translate-x-0 opacity-100"
      : phase === "leaving"
      ? "max-w-[190px] -translate-x-4 opacity-0"
      : "max-w-0 translate-x-4 opacity-0";

  return (
    <span
      aria-hidden="true"
      className={`ml-2 hidden overflow-hidden whitespace-nowrap text-xs font-medium normal-case tracking-normal text-mdn-gray transition-all duration-700 ease-in-out sm:inline-block ${stateClasses}`}
    >
      My Daily Nutrition
    </span>
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