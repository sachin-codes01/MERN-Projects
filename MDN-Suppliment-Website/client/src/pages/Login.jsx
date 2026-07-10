import { useNavigate, useLocation } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Login() {
  const { loginWithGoogle } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/";

  const handleSuccess = async (credentialResponse) => {
    try {
      const userData = await loginWithGoogle(credentialResponse.credential);
      success(`Welcome, ${userData.name?.split(" ")[0] || "there"}!`);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toastError("Google login failed. Please try again.");
    }
  };

  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4 py-10">
      <div className="card w-full max-w-sm animate-fade-up p-8 text-center">
        <h2 className="font-display text-xl font-bold uppercase tracking-wide text-mdn-white">
          Login to MDN
        </h2>
        {redirectTo === "/checkout" && (
          <p className="mt-2 rounded-md border border-mdn-green/30 bg-mdn-green/10 px-3 py-2 text-xs text-mdn-green">
            Checkout continue karne ke liye pehle login karein.
          </p>
        )}
        <p className="mt-3 text-sm text-mdn-gray">Continue karne ke liye Google account use karein.</p>
        <div className="mt-6 flex justify-center">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => toastError("Google login failed. Please try again.")}
            theme="filled_black"
            shape="pill"
          />
        </div>
      </div>
    </div>
  );
}