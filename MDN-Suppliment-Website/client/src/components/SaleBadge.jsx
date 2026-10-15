// Product photo ke kone me chamakta star badge ("SALE", "HOT"…). Admin panel
// se har product pe text set hota hai (product.saleBadge); khaali = kuch nahi.
// Animation index.css ke .sale-badge me — reduced-motion pe ruk jati hai.
const SaleBadge = ({ text, size = 58, className = "" }) => {
  if (!text) return null;
  // Kone me lagana ho to className me "absolute" — warna apni jagah (relative)
  const position = className.split(/\s+/).includes("absolute") ? "" : "relative";
  return (
    <span className={`sale-badge ${position} ${className}`} style={{ "--sale-size": `${size}px` }} aria-label={text}>
      <span className="sale-badge__burst" aria-hidden="true" />
      <span className="sale-badge__text" aria-hidden="true">
        {text}
      </span>
    </span>
  );
};

export default SaleBadge;
