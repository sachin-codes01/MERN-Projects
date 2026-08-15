import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import HeadsetMicOutlinedIcon from "@mui/icons-material/HeadsetMicOutlined";
import bannerVideo from "../assets/mdn-hero-banner.mp4";

// The five reassurances shown in the panel over the banner's bottom edge.
// Split into `value` (the number/short claim, set large) and `label` (what
// it refers to, set small and uppercase) so the row scans as five figures
// rather than five sentences.
const TRUST_ITEMS = [
  { value: "11+", label: "Happy Customers", Icon: PersonOutlineRoundedIcon },
  { value: "50K+", label: "Orders Delivered", Icon: Inventory2OutlinedIcon },
  { value: "Fast", label: "& Safe Delivery", Icon: LocalShippingOutlinedIcon },
  { value: "100%", label: "Secure Payment", Icon: LockOutlinedIcon },
  { value: "24/7", label: "Customer Support", Icon: HeadsetMicOutlinedIcon },
];

export default function Hero() {
  return (
    <section className="relative">
      {/* Banner — still full-bleed, but its BOTTOM corners are curved so
          the artwork ends on a soft edge rather than a hard rule, per the
          reference. `overflow-hidden` is what actually clips the carousel
          images to that radius; without it the radius sits on the box and
          the image corners still square it off.

          The radius scales up with the viewport: a 32px curve that reads
          as a deliberate sweep on a phone looks like a rounding error
          across a 1536px banner. */}
      <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen overflow-hidden rounded-b-[28px] bg-mdn-black sm:rounded-b-[40px] lg:rounded-b-[56px]">
        {/* One video, no carousel. The box is `aspect-video` because the
            source is 1920x1080 — matching the box to the file means the
            full frame is visible at every width with nothing cropped,
            which the old 4:5 mobile box could not have done. There is
            deliberately no max-height cap: capping it would make the box
            shorter than 16:9 on wide screens and squash the video.
            Swap the ratio here if a re-cut banner ships at a new size. */}
        <video
          src={bannerVideo}
          // The four attributes below are what let a video play on its own:
          // iOS/Android refuse to autoplay anything with sound, and refuse
          // to play inline without `playsInline` (it goes fullscreen
          // instead). Dropping `muted` silently breaks autoplay on mobile.
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-label="MDN promotional banner"
          // object-fill, not cover/contain, by request: the whole frame
          // must always be visible. Cover crops the edges off and contain
          // adds letterbox bars — fill stretches the video to the box
          // instead, so nothing is ever cut away. With the box set to
          // aspect-video and the source at 1920x1080 the ratios match, so
          // in practice there is no stretch to see either.
          className="aspect-video h-full w-full bg-mdn-charcoal2 object-fill"
        />
      </div>

      <HeroTrustBar />
    </section>
  );
}

// Trust bar — the cream panel that straddles the banner's lower edge.
//
// It is a SIBLING of the banner, not a child: the banner needs
// `overflow-hidden` to clip its own rounded corners, and anything nested
// inside that would be clipped the moment it overhangs. Pulling it up
// with a negative margin instead lets it sit half on the artwork and half
// on the page, which is the effect in the reference.
//
// The overhang shrinks on small screens — the panel grows to three rows
// there, and a large negative margin would bury the banner behind it.
//
// Overhang is 9px — a shallow tuck, not a real overlap. The reference
// has the panel's top edge essentially flush with the banner's bottom
// (banner ends y=392, panel starts y=393); this sits a few pixels
// higher so the panel visibly laps the curve while its body still
// stands clear on the page. An earlier version overlapped by half the
// panel's height, which put the banner's bottom edge straight through
// its centre.
function HeroTrustBar() {
  return (
    <div className="relative z-10 mx-auto -mt-[14px] max-w-shell px-4 sm:px-6 lg:px-[34px]">
      <div className="rounded-2xl border border-mdn-border bg-mdn-sand px-3 py-5 shadow-lg sm:px-6 sm:py-6">
        {/* 2 cols on phones, 3 on small tablets, all 5 in a row from lg.
            Five equal columns squeezed onto a phone would clip the longer
            labels ("Orders Delivered", "Customer Support"). */}
        <ul className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-5">
          {TRUST_ITEMS.map(({ value, label, Icon }) => (
            <li key={label} className="flex items-center justify-center gap-2.5 sm:gap-3">
              <Icon
                aria-hidden="true"
                className="shrink-0 text-mdn-green"
                sx={{ fontSize: 30 }}
              />
              <div className="min-w-0">
                <p className="text-[15px] font-bold leading-none text-mdn-ink sm:text-lg">{value}</p>
                <p className="mt-1 text-[10px] font-medium uppercase leading-tight tracking-wider text-mdn-ink-muted sm:text-[11px]">
                  {label}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
