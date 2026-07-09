import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { api } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((fe) => ({ ...fe, [name]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.email.trim()) errs.email = "Email is required.";
    else if (!EMAIL_REGEX.test(form.email.trim())) errs.email = "Enter a valid email address.";
    if (!form.password) errs.password = "Password is required.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const data = await api.login(form);
      await login(data.accessToken, data.data);
      success(`Welcome back, ${data.data.name?.split(" ")[0] || "there"}!`);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
      toastError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4 py-10">
      <div className="card w-full max-w-sm animate-fade-up p-6 sm:p-8">
        <h2 className="text-center font-display text-xl font-bold uppercase tracking-wide text-mdn-white">
          Login
        </h2>
        {redirectTo === "/checkout" && (
          <p className="mt-2 rounded-md border border-mdn-green/30 bg-mdn-green/10 px-3 py-2 text-center text-xs text-mdn-green">
            Please log in to continue to checkout.
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-3">
          <div>
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className={`input-field ${fieldErrors.email ? "!border-red-500/60 focus:!border-red-500 focus:!ring-red-500/25" : ""}`}
            />
            {fieldErrors.email && <p className="mt-1 text-xs text-red-400">{fieldErrors.email}</p>}
          </div>

          <div>
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className={`input-field ${fieldErrors.password ? "!border-red-500/60 focus:!border-red-500 focus:!ring-red-500/25" : ""}`}
            />
            {fieldErrors.password && <p className="mt-1 text-xs text-red-400">{fieldErrors.password}</p>}
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-mdn-gray">
          No account?{" "}
          <Link to="/register" className="font-semibold text-mdn-green hover:text-mdn-green-light">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}