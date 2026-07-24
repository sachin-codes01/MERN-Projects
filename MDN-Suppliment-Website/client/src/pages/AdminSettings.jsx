import { useState } from "react";
import Switch from "@mui/material/Switch";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { api } from "../api/api";
import { useToast } from "../context/ToastContext";

// Matches the --mdn-green Tailwind token so the MUI control doesn't clash
// with the rest of the (Tailwind-styled) admin UI.
const MDN_GREEN = "#22B14C";

export default function AdminSettings() {
  const { token, user } = useAuth();
  const { splashCursorEnabled, refreshSettings } = useSettings();
  const { success, error: toastError } = useToast();
  const [saving, setSaving] = useState(false);

  if (user && !["admin", "superadmin"].includes(user.role)) {
    return <p className="mx-auto max-w-3xl px-4 py-10 text-red-400">Admin access only.</p>;
  }

  const handleToggleSplashCursor = async () => {
    setSaving(true);
    try {
      await api.adminUpdateSettings(token, { splashCursorEnabled: !splashCursorEnabled });
      refreshSettings();
      success(`Splash cursor effect turned ${!splashCursorEnabled ? "on" : "off"}.`);
    } catch (err) {
      toastError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <p className="text-center text-xs font-semibold uppercase tracking-widest text-mdn-green sm:text-left">
        Admin Panel
      </p>
      <h2 className="mt-1 text-center text-2xl font-bold text-mdn-white sm:text-left sm:text-3xl">Settings</h2>

      <div className="card mt-8 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-mdn-white">Splash Cursor Effect</h3>
            <p className="mt-1 text-sm text-mdn-gray">
              The animated WebGL fluid effect in the navbar and footer. It's GPU-intensive and can
              cause lag on low-spec laptops — turn it off site-wide if visitors report choppy
              scrolling or high fan noise.
            </p>
          </div>

          <Switch
            checked={splashCursorEnabled}
            onChange={handleToggleSplashCursor}
            disabled={saving}
            inputProps={{ "aria-label": "Toggle splash cursor effect" }}
            sx={{
              "& .MuiSwitch-switchBase.Mui-checked": { color: MDN_GREEN },
              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: MDN_GREEN },
            }}
          />
        </div>
        <p className="mt-3 text-xs text-mdn-gray">
          Status: <span className={splashCursorEnabled ? "text-mdn-green" : "text-red-400"}>
            {splashCursorEnabled ? "ON — visible to desktop visitors" : "OFF — hidden for everyone"}
          </span>
        </p>
      </div>
    </div>
  );
}
