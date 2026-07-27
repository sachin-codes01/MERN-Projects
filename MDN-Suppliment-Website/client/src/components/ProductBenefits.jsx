import VerifiedUserRoundedIcon from "@mui/icons-material/VerifiedUserRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import WaterDropRoundedIcon from "@mui/icons-material/WaterDropRounded";
import ScienceRoundedIcon from "@mui/icons-material/ScienceRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import FitnessCenterRoundedIcon from "@mui/icons-material/FitnessCenterRounded";
import SpaRoundedIcon from "@mui/icons-material/SpaRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

// Shared between the storefront strip below and the admin editor's icon
// picker, so the two can never drift out of sync — the admin only ever
// offers keys that actually render here.
export const BENEFIT_ICONS = {
  shield: { label: "Shield", Icon: VerifiedUserRoundedIcon },
  heart: { label: "Heart", Icon: FavoriteRoundedIcon },
  drop: { label: "Droplet", Icon: WaterDropRoundedIcon },
  flask: { label: "Flask", Icon: ScienceRoundedIcon },
  bolt: { label: "Bolt", Icon: BoltRoundedIcon },
  muscle: { label: "Muscle", Icon: FitnessCenterRoundedIcon },
  leaf: { label: "Leaf", Icon: SpaRoundedIcon },
  check: { label: "Check", Icon: CheckCircleRoundedIcon },
};

export const BENEFIT_ICON_KEYS = Object.keys(BENEFIT_ICONS);

// The strip is a single 4-column row on desktop, so 4 is the most it can
// hold without wrapping to a ragged second row. Enforced in the admin
// editor (the add button stops at 4) and again here, so a product that
// already has more in the database still renders as one clean row.
export const MAX_BENEFITS = 4;

/**
 * Product benefit strip — a row of icon + short claim, split by vertical
 * dividers, sitting under the product info accordion on the PDP.
 *
 * Content is per-product (Product.benefits, set in the admin panel), since
 * the claims are about this specific product — "fast-absorbing for quick
 * recovery" is true of a whey and meaningless on a shaker.
 *
 * Two per row on phones rather than four: at four across, a claim like
 * "Available in various tasty flavors" wraps to three or four cramped
 * lines on a 375px screen.
 */
export default function ProductBenefits({ benefits = [] }) {
  if (!benefits.length) return null;

  return (
    <div className="mt-12 rounded-xl border border-white/10 bg-mdn-charcoal2/40 px-2 py-6 sm:px-4">
      <div className="grid grid-cols-2 gap-y-6 divide-white/10 sm:divide-x lg:grid-cols-4">
        {benefits.map((b, i) => {
          // Falls back to cycling the icon set when a benefit has no icon
          // chosen, so an admin can type claims and skip the picker
          // entirely and still get variety rather than four identical marks.
          const key = BENEFIT_ICONS[b.icon] ? b.icon : BENEFIT_ICON_KEYS[i % BENEFIT_ICON_KEYS.length];
          const { Icon } = BENEFIT_ICONS[key];
          return (
            <div key={i} className="flex flex-col items-center gap-3 px-2 text-center sm:px-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/15 bg-mdn-charcoal text-mdn-green">
                <Icon sx={{ fontSize: 22 }} />
              </span>
              <span className="text-[11px] font-bold uppercase leading-snug tracking-wide text-mdn-white sm:text-xs">
                {b.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
