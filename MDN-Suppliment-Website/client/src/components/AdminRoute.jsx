import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ADMIN_ROLES = ["admin", "superadmin"];

// Guards /admin/* at the router level. Without this, an anonymous visitor
// (no token) could load the full admin page shell by navigating straight
// to a URL like /admin/products — the per-page role checks only reject
// logged-in users with the wrong role, not logged-out ones.
export default function AdminRoute({ children }) {
  const { token, user } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (!user || !ADMIN_ROLES.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
