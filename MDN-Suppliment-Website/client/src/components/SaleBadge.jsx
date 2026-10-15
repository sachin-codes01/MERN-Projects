// Product photo ke kone me chamakta star badge ("SALE", "HOT"…). Admin panel
// se har product pe text set hota hai (product.saleBadge); khaali = kuch nahi.
// Animation index.css ke .sale-badge me — reduced-motion pe ruk jati hai.
const SaleBadge = ({ text, size = 58, className = "" }) => {
  if (!text) return null;
  // Kone me lagana ho to className me "absolute" — warna apni jagah (relative)
  const position = className.split(/\s+/).includes("absolute") ? "" : "relative";
  return (
    // size null ho to className ka [--sale-size:..] chalega (har screen pe alag size)
    <span className={`sale-badge ${position} ${className}`} style={size ? { "--sale-size": `${size}px` } : undefined} aria-label={text}>
      <span className="sale-badge__burst" aria-hidden="true" />
      <span className="sale-badge__text" aria-hidden="true">
        {text}
      </span>
    </span>
  );
};

export default SaleBadge;
