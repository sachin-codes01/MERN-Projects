import { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import ScrollToTop from "./components/ScrollToTop";
import MDNLoader from "./components/MDNLoader";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home"; // kept eager — it's the landing page, no point lazy-loading it

// Everything else loads on demand, so the first paint only ships the code
// the home page actually needs.
const Login = lazy(() => import("./pages/Login"));
const Products = lazy(() => import("./pages/Products"));
const SectionProducts = lazy(() => import("./pages/SectionProducts"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Orders = lazy(() => import("./pages/Orders"));
const Profile = lazy(() => import("./pages/Profile"));
const AdminProducts = lazy(() => import("./pages/AdminProducts"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminCoupons = lazy(() => import("./pages/AdminCoupons"));
const AdminOrders = lazy(() => import("./pages/AdminOrders"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
// New: Customer Support page (linked from Navbar "Customer Support" and
// Footer "Customer Support"), lazy-loaded like the other secondary pages.
const CustomerSupportPage = lazy(() => import("./pages/CustomerSupportPage"));
const Blogs = lazy(() => import("./pages/Blogs"));
const BlogDetail = lazy(() => import("./pages/BlogDetail"));

export default function App() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-mdn-black">
      <ScrollToTop />
      <Navbar />
      <main className="container mx-auto flex-1">
        {/* Wraps the routed page content only (not Navbar/Footer) — a
            render-time crash on one page (e.g. unexpected API shape) now
            shows this fallback instead of unmounting the entire app to a
            blank white screen. Keyed by pathname so navigating away from
            the crashed page remounts the boundary instead of it staying
            stuck on the fallback for the rest of the session. */}
        <ErrorBoundary
          key={location.pathname}
          fallback={
            <div className="mx-auto max-w-lg px-4 py-24 text-center">
              <p className="text-lg font-semibold text-mdn-white">Something went wrong loading this page.</p>
              <p className="mt-2 text-sm text-mdn-gray">Please refresh, or go back and try again.</p>
            </div>
          }
        >
          <Suspense fallback={<MDNLoader label="Loading" className="py-24" />}>
            <Routes>
              {/* Public — browsable without login */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/section/:section" element={<SectionProducts />} />
              <Route path="/products/:slug" element={<ProductDetail />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/support" element={<CustomerSupportPage />} />
              <Route path="/blogs" element={<Blogs />} />
              <Route path="/blogs/:slug" element={<BlogDetail />} />

              {/* Requires login */}
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute>
                    <Checkout />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute>
                    <Orders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Admin */}
              <Route
                path="/admin/products"
                element={
                  <AdminRoute>
                    <AdminProducts />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/orders"
                element={
                  <AdminRoute>
                    <AdminOrders />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <AdminRoute>
                    <AdminUsers />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/coupons"
                element={
                  <AdminRoute>
                    <AdminCoupons />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <AdminRoute>
                    <AdminSettings />
                  </AdminRoute>
                }
              />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      {!location.pathname.startsWith("/admin") && <Footer />}
    </div>
  );
}
