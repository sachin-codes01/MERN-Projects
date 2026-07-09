import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((fe) => ({ ...fe, [name]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Full name is required.";
    else if (form.name.trim().length < 2) errs.name = "Name must be at least 2 characters.";

    if (!form.email.trim()) errs.email = "Email is required.";
    else if (!EMAIL_REGEX.test(form.email.trim())) errs.email = "Enter a valid email address.";

    if (!form.phone.trim()) errs.phone = "Phone number is required.";
    else if (!PHONE_REGEX.test(form.phone.trim())) errs.phone = "Enter a valid 10-digit mobile number.";

    if (!form.password) errs.password = "Password is required.";
    else if (form.password.length < 6) errs.password = "Password must be at least 6 characters.";

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const data = await api.register(form);
      login(data.accessToken, data.data);
      success(`Welcome to MDN, ${data.data.name?.split(" ")[0] || "there"}!`);
      navigate("/products");
    } catch (err) {
      setError(err.message);
      toastError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = (name) =>
    `input-field ${fieldErrors[name] ? "!border-red-500/60 focus:!border-red-500 focus:!ring-red-500/25" : ""}`;

  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4 py-10">
      <div className="card w-full max-w-sm animate-fade-up p-6 sm:p-8">
        <h2 className="text-center font-display text-xl font-bold uppercase tracking-wide text-mdn-white">
          Create Account
        </h2>

        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-3">
          <div>
            <input name="name" placeholder="Full name" value={form.name} onChange={handleChange} className={fieldClass("name")} />
            {fieldErrors.name && <p className="mt-1 text-xs text-red-400">{fieldErrors.name}</p>}
          </div>
          <div>
            <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} className={fieldClass("email")} />
            {fieldErrors.email && <p className="mt-1 text-xs text-red-400">{fieldErrors.email}</p>}
          </div>
          <div>
            <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} className={fieldClass("phone")} />
            {fieldErrors.phone && <p className="mt-1 text-xs text-red-400">{fieldErrors.phone}</p>}
          </div>
          <div>
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className={fieldClass("password")}
            />
            {fieldErrors.password && <p className="mt-1 text-xs text-red-400">{fieldErrors.password}</p>}
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Creating..." : "Register"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-mdn-gray">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-mdn-green hover:text-mdn-green-light">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}