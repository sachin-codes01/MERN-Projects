import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
import MDNLoader from "./components/MDNLoader";
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
const SearchResults = lazy(() => import("./pages/SearchResults"));
// New: Customer Support page (linked from Navbar "Customer Support" and
// Footer "Customer Support"), lazy-loaded like the other secondary pages.
const CustomerSupportPage = lazy(() => import("./pages/CustomerSupportPage"));

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-mdn-black">
      <ScrollToTop />
      <Navbar />
      <main className="container mx-auto flex-1">
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
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/coupons" element={<AdminCoupons />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
