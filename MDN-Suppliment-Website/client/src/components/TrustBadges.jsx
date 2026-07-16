const BADGES = [
  {
    glyph: "trophy",
    title: "#1 Protein in Brand 5 Years in a Row",
    body: "Recognized as the #1 protein brand for five years straight, delivering trusted quality and results you can count on.",
  },
  {
    glyph: "truck",
    title: "Same Day Dispatch",
    body: "Order by 1PM. Fast, careful packing of your order by people who actually care about what ships out.",
  },
  {
    glyph: "users",
    title: "Trusted By 2,00,000+ Athletes",
    body: "And counting — join India's fastest-growing nutrition community.",
  },
];

export default function TrustBadges() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {BADGES.map((b, i) => (
          <div
            key={b.title}
            style={{ animationDelay: `${i * 100}ms` }}
            className="card animate-fade-up flex flex-col items-start gap-3 p-6 transition-transform duration-300 hover:-translate-y-1"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-mdn-green/10 text-mdn-green">
              <Glyph name={b.glyph} />
            </span>
            <h3 className="text-base font-bold leading-snug text-mdn-white">{b.title}</h3>
            <p className="text-sm leading-relaxed text-mdn-gray">{b.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Glyph({ name }) {
  const common = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8 };
  if (name === "trophy")
    return (
      <svg {...common}>
        <path d="M8 4h8v5a4 4 0 01-8 0V4z" strokeLinejoin="round" />
        <path d="M8 5H5a3 3 0 003 3M16 5h3a3 3 0 01-3 3" strokeLinecap="round" />
        <path d="M12 13v3M9 20h6M10 17h4v3h-4z" strokeLinejoin="round" />
      </svg>
    );
  if (name === "truck")
    return (
      <svg {...common}>
        <rect x="2" y="7" width="12" height="9" rx="1" />
        <path d="M14 10h4l3 3v3h-7z" strokeLinejoin="round" />
        <circle cx="6.5" cy="18" r="1.6" />
        <circle cx="17" cy="18" r="1.6" />
      </svg>
    );
  return (
    <svg {...common}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-5.5 6-5.5S15 16.7 15 20" strokeLinecap="round" />
      <path d="M16 8.5a2.7 2.7 0 110 5.4M17.5 14.7c2.4.3 4.5 2.3 4.5 5.3" strokeLinecap="round" />
    </svg>
  );
}
