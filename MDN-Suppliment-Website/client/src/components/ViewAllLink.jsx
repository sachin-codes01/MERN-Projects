import { Link } from "react-router-dom";

// Section heading ke right side wala chhota "View all →" link (reference jaisa)
const ViewAllLink = ({ to, label = "View all" }) => (
  <Link
    to={to}
    className="group inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-mdn-border-strong px-3.5 py-1.5 font-heading text-[13px] font-semibold text-mdn-ink transition-colors hover:border-mdn-green hover:bg-mdn-green hover:text-mdn-on-primary sm:text-sm"
  >
    {label}
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="transition-transform duration-200 group-hover:translate-x-0.5">
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </Link>
);

export default ViewAllLink;
