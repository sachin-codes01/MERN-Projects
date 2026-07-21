import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import ScienceRoundedIcon from "@mui/icons-material/ScienceRounded";
import SpaRoundedIcon from "@mui/icons-material/SpaRounded";
import FactoryRoundedIcon from "@mui/icons-material/FactoryRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import BiotechRoundedIcon from "@mui/icons-material/BiotechRounded";
import QrCodeScannerRoundedIcon from "@mui/icons-material/QrCodeScannerRounded";

const STRIP_ITEMS = [
  { label: "TRUSTIFIED", Icon: VerifiedRoundedIcon },
  { label: "LABDOOR", Icon: ScienceRoundedIcon },
  { label: "ONE INGREDIENT", Icon: SpaRoundedIcon },
  { label: "IN-HOUSE MANUFACTURED", Icon: FactoryRoundedIcon },
  { label: "ZERO ADDITIVES", Icon: BlockRoundedIcon },
  { label: "LAB TESTED", Icon: BiotechRoundedIcon },
  { label: "QR-VERIFIED BATCHES", Icon: QrCodeScannerRoundedIcon },
];

// Duplicated so the CSS marquee (translateX(0) -> translateX(-50%)) loops
// seamlessly — same pattern already used by the footer ticker.
const ITEMS = [...STRIP_ITEMS, ...STRIP_ITEMS];

export default function TrustStrip() {
  return (
    <div className="overflow-hidden border-y border-mdn-green/20 bg-mdn-green py-3">
      <div className="marquee-track gap-10 motion-reduce:animate-none">
        {ITEMS.map((item, i) => {
          const Icon = item.Icon;
          return (
            <span
              key={i}
              className="flex items-center gap-2 whitespace-nowrap text-xs font-bold uppercase tracking-widest text-mdn-black sm:text-sm"
            >
              <Icon sx={{ fontSize: 18 }} />
              {item.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
