import { Switch } from "@mui/material";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import { useTheme } from "../context/ThemeContext";

/**
 * MUI Switch styled to match the MDN palette, with light/dark icons either
 * side. Reusable — used in the Navbar (desktop + mobile) and in Profile.
 * Pass `compact` to hide the two side icons (tight mobile navbar space).
 *
 * Wrapped in a grounded pill (border + surface + shadow) so it doesn't
 * float bare against the page background — that's what made it look fake
 * in light mode. The thumb also picks up a soft green glow when checked.
 */
export default function ThemeToggle({ className = "", compact = false }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div
      className={`flex items-center gap-1.5 rounded-full border border-mdn-silver/30 bg-mdn-charcoal2 px-2 py-1 shadow-sm transition-colors duration-300 ${className}`}
    >
      {!compact && (
        <LightModeRoundedIcon
          sx={{ fontSize: 16 }}
          className={`transition-colors duration-300 ${isDark ? "text-mdn-gray" : "text-mdn-green"}`}
        />
      )}
      <Switch
        checked={isDark}
        onChange={toggleTheme}
        // `inputProps` was the pre-v6 MUI API for reaching the underlying
        // <input>. Newer MUI versions pass it straight through toward the
        // DOM instead of consuming it, which is exactly the "React does
        // not recognize the `inputProps` prop on a DOM element" warning —
        // `slotProps.input` is the current, non-deprecated way to do the
        // same thing.
        slotProps={{ input: { "aria-label": "Toggle dark mode" } }}
        icon={<LightModeRoundedIcon sx={{ fontSize: 13, padding: "3px", color: "#16803C" }} />}
        checkedIcon={<DarkModeRoundedIcon sx={{ fontSize: 13, padding: "3px", color: "#0B0C0D" }} />}
        sx={{
          width: 44,
          height: 24,
          padding: 0,
          "& .MuiSwitch-switchBase": {
            padding: 0,
            margin: "3px",
            transitionDuration: "300ms",
            "&.Mui-checked": {
              transform: "translateX(20px)",
              color: "#fff",
              "& + .MuiSwitch-track": {
                backgroundColor: "#22B14C",
                opacity: 1,
              },
              "& .MuiSwitch-thumb": {
                boxShadow: "0 0 8px rgba(34,177,76,0.6)",
              },
            },
          },
          "& .MuiSwitch-thumb": {
            width: 18,
            height: 18,
            boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
            transition: "box-shadow 300ms",
          },
          "& .MuiSwitch-track": {
            borderRadius: 24 / 2,
            backgroundColor: "#C9CDD3",
            opacity: 1,
            transition: "background-color 300ms",
          },
        }}
      />
      {!compact && (
        <DarkModeRoundedIcon
          sx={{ fontSize: 16 }}
          className={`transition-colors duration-300 ${isDark ? "text-mdn-green" : "text-mdn-gray"}`}
        />
      )}
    </div>
  );
}
