import { Link } from "react-router-dom";
import SectionHeading from "../components/SectionHeading";
import { BLOGS } from "../data/blogs";

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function ArrowIcon({ className = "" }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Blogs() {
  const [featured, ...rest] = BLOGS;

  return (
    <section className="relative overflow-hidden px-4 py-14 sm:px-6 sm:py-16">
      {/* Decorative glow + grid backdrop, same treatment as the other
          "cool" sections on the site (TargetSection, StorySection) —
          the plain white-card grid this replaced had none of that. */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 -translate-y-1/3 rounded-full bg-mdn-green/10 blur-[100px]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgb(var(--mdn-white)) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--mdn-white)) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="From the MDN team"
          title="The"
          accent="Blog"
          subtitle="Straight talk on protein, supplements, and training — no hype, no filler."
        />

        {/* Featured post — the latest article gets the big treatment
            instead of sitting in the grid like everything else. */}
        {featured && (
          <Link
            to={`/blogs/${featured.slug}`}
            className="group relative mt-10 block animate-fade-up overflow-hidden rounded-2xl border border-white/5 bg-mdn-charcoal2 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-mdn-green/40 hover:shadow-green-glow"
          >
            <div className="relative aspect-[16/9] w-full sm:aspect-[21/9]">
              <img
                src={featured.cover}
                alt={featured.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-mdn-black via-mdn-black/60 via-40% to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-mdn-green px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-mdn-black">
                    Featured
                  </span>
                  <span className="rounded-full border border-white/25 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-mdn-white/90">
                    {featured.category}
                  </span>
                </div>
                <h3 className="mt-3 max-w-2xl font-display text-xl font-bold leading-tight text-mdn-white sm:text-3xl">
                  {featured.title}
                </h3>
                <p className="mt-2 hidden max-w-xl text-sm leading-relaxed text-mdn-white/80 sm:block">
                  {featured.excerpt}
                </p>
                <div className="mt-4 flex items-center gap-3 text-xs text-mdn-white/70">
                  <time dateTime={featured.date}>{formatDate(featured.date)}</time>
                  <span aria-hidden="true">•</span>
                  <span>{featured.readTime}</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-mdn-green transition-transform duration-300 group-hover:translate-x-1">
                    Read article <ArrowIcon />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Rest of the posts — image-overlay cards (title/meta sit on the
            photo itself) so the grid reads as one visual system with the
            featured card above instead of two different card styles. */}
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((post, i) => (
            <Link
              key={post.slug}
              to={`/blogs/${post.slug}`}
              style={{ animationDelay: `${i * 90}ms` }}
              className="group relative aspect-[4/5] animate-fade-up overflow-hidden rounded-xl border border-white/5 bg-mdn-charcoal2 transition-all duration-300 hover:-translate-y-1.5 hover:border-mdn-green/40 hover:shadow-green-glow"
            >
              <img
                src={post.cover}
                alt={post.title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-mdn-black via-mdn-black/70 via-40% to-transparent" />

              <span className="absolute left-3 top-3 rounded-full bg-mdn-black/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-mdn-green backdrop-blur-sm">
                {post.category}
              </span>

              <span className="absolute inset-x-0 bottom-0 p-4 text-left sm:p-5">
                <span className="block text-sm font-bold leading-snug text-mdn-white sm:text-base">
                  {post.title}
                </span>
                <span className="mt-1.5 block text-xs leading-snug text-mdn-white/70 line-clamp-2">
                  {post.excerpt}
                </span>
                <span className="mt-2.5 flex items-center justify-between text-[11px] text-mdn-white/60">
                  <span>
                    {formatDate(post.date)} • {post.readTime}
                  </span>
                  <ArrowIcon className="text-mdn-green opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100" />
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
