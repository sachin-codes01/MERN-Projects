import { useAuth } from "../context/AuthContext";

export default function AdminSettings() {
  const { user } = useAuth();

  if (user && !["admin", "superadmin"].includes(user.role)) {
    return <p className="mx-auto max-w-3xl px-4 py-10 text-mdn-danger">Admin access only.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <p className="eyebrow text-center sm:text-left">Admin Panel</p>
      <h2 className="display-lg mt-1 text-center sm:text-left">Settings</h2>

      <div className="card mt-8 p-6 text-center">
        <p className="font-semibold text-mdn-white">No site-wide settings yet</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-mdn-gray">
          Storefront content — hero, banners, collections, goals, testimonials and FAQs — is managed
          from its own sections in the admin panel.
        </p>
      </div>
    </div>
  );
}
