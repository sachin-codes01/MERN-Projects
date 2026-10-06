import { Link } from "react-router-dom";
import SectionHeading from "../components/SectionHeading";
import { BLOGS } from "../data/blogs";

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const ArrowIcon = ({ className = "" }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={className}>
    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Category pill — image ke upar, safed background par dark text (har theme me readable)
const CategoryPill = ({ children, className = "" }) => (
  <span
    className={`rounded-full bg-white/95 px-2.5 py-1 font-heading text-[10px] font-semibold text-[#241f1a] shadow-xs ${className}`}
  >
    {children}
  </span>
);

// Blog list — reference card style: image upar, text neeche card me
// (pehle text photo ke upar overlay tha, jo light theme me padhne me nahi aata tha).
const Blogs = () => {
  const [featured, ...rest] = BLOGS;

  return (
    <section className="section">
      <SectionHeading
        eyebrow="From the MDN team"
        title="The"
        accent="Blog"
        subtitle="Straight talk on protein, supplements, and training — no hype, no filler."
      />

      {/* Featured post — mobile pe stacked, desktop pe image + text side by side */}
      {featured && (
        <Link
          to={`/blogs/${featured.slug}`}
          className="group mt-6 grid animate-fade-up overflow-hidden rounded-2xl border border-mdn-border bg-mdn-charcoal shadow-xs transition-shadow duration-300 hover:shadow-lg sm:mt-8 lg:grid-cols-[1.4fr_1fr]"
        >
          <div className="relative aspect-[16/9] overflow-hidden bg-mdn-sand lg:aspect-auto lg:min-h-[340px]">
            <img
              src={featured.cover}
              alt={featured.title}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute left-3 top-3 flex items-center gap-2 sm:left-4 sm:top-4">
              <span className="rounded-full bg-mdn-orange-badge px-2.5 py-1 font-heading text-[10px] font-semibold text-mdn-badge-ink">
                Featured
              </span>
              <CategoryPill>{featured.category}</CategoryPill>
            </div>
          </div>
          <div className="flex flex-col justify-center p-4 sm:p-6 lg:p-8">
            <h2 className="display-lg">{featured.title}</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-mdn-ink-body line-clamp-3 sm:text-base">{featured.excerpt}</p>
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-mdn-ink-muted">
              <time dateTime={featured.date}>{formatDate(featured.date)}</time>
              <span aria-hidden="true">•</span>
              <span>{featured.readTime}</span>
            </div>
            <span className="mt-4 inline-flex items-center gap-1 font-heading text-[13px] font-semibold text-mdn-green transition-transform duration-300 group-hover:translate-x-1">
              Read article <ArrowIcon />
            </span>
          </div>
        </Link>
      )}

      {/* Baaki posts — same card system, 1/2/3 columns */}
      <div className="mt-4 grid gap-4 sm:mt-6 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((post, i) => (
          <Link
            key={post.slug}
            to={`/blogs/${post.slug}`}
            style={{ animationDelay: `${i * 90}ms` }}
            className="lift group flex animate-fade-up flex-col overflow-hidden rounded-xl border border-mdn-border bg-mdn-charcoal shadow-xs"
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-mdn-sand">
              <img
                src={post.cover}
                alt={post.title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <CategoryPill className="absolute left-3 top-3">{post.category}</CategoryPill>
            </div>
            <div className="flex flex-1 flex-col p-4">
              <h3 className="font-heading text-base font-semibold leading-snug text-mdn-ink sm:text-[17px]">{post.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-mdn-ink-body line-clamp-2">{post.excerpt}</p>
              <span className="mt-auto flex items-center justify-between pt-3 text-[11px] text-mdn-ink-muted">
                <span>
                  {formatDate(post.date)} • {post.readTime}
                </span>
                <ArrowIcon className="text-mdn-green transition-transform duration-300 group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default Blogs;
