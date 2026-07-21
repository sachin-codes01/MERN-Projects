export default function SectionHeading({ eyebrow, title, accent, subtitle, className = "" }) {
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-widest text-mdn-green">{eyebrow}</p>
      )}
      <div className={`flex items-center gap-3 sm:gap-5 ${eyebrow ? "mt-2" : ""}`}>
        <span className="h-px w-7 shrink-0 bg-mdn-green sm:w-14" />
        <h2 className="font-display text-2xl font-black uppercase tracking-wide text-mdn-white sm:text-4xl">
          {title} {accent && <span className="font-serif italic text-mdn-green">{accent}</span>}
        </h2>
        <span className="h-px w-7 shrink-0 bg-mdn-green sm:w-14" />
      </div>
      {subtitle && <p className="mt-3 max-w-md text-sm text-mdn-gray sm:text-base">{subtitle}</p>}
    </div>
  );
}
