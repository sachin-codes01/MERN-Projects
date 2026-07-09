export default function MDNLoader({ label = "Loading", fullScreen = false, className = "" }) {
  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 py-10 ${className}`}>
      <div className="flex items-baseline gap-0.5 font-display text-3xl font-bold tracking-widest">
        <span className="animate-mdn-bounce text-mdn-white" style={{ animationDelay: "0ms" }}>
          M
        </span>
        <span className="animate-mdn-bounce text-mdn-white" style={{ animationDelay: "150ms" }}>
          D
        </span>
        <span className="animate-mdn-bounce text-mdn-green" style={{ animationDelay: "300ms" }}>
          N
        </span>
        <span className="animate-mdn-bounce text-mdn-green" style={{ animationDelay: "450ms" }}>
          .
        </span>
      </div>
      {label && (
        <p className="text-xs font-semibold uppercase tracking-widest text-mdn-gray">{label}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[999] flex items-center justify-center bg-mdn-black/90 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
}