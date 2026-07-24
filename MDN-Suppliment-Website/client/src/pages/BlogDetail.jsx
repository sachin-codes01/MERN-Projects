import { Link, useParams, Navigate } from "react-router-dom";
import { getBlogBySlug, BLOGS } from "../data/blogs";

export default function BlogDetail() {
  const { slug } = useParams();
  const post = getBlogBySlug(slug);

  if (!post) return <Navigate to="/blogs" replace />;

  const morePosts = BLOGS.filter((b) => b.slug !== post.slug).slice(0, 3);

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link to="/blogs" className="inline-flex items-center gap-1.5 text-sm font-semibold text-mdn-green hover:text-mdn-green-light">
        ← Back to Blog
      </Link>

      <span className="mt-6 block text-xs font-semibold uppercase tracking-widest text-mdn-green">
        {post.category}
      </span>
      <h1 className="mt-1 font-display text-2xl font-bold leading-tight text-mdn-white sm:text-4xl">
        {post.title}
      </h1>
      <div className="mt-3 flex items-center gap-2 text-xs text-mdn-gray">
        <time dateTime={post.date}>
          {new Date(post.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
        </time>
        <span aria-hidden="true">•</span>
        <span>{post.readTime}</span>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl">
        <img src={post.cover} alt={post.title} className="aspect-[16/9] w-full object-cover" />
      </div>

      <div className="mt-8 space-y-5">
        {post.content.map((block, i) =>
          block.type === "h2" ? (
            <h2 key={i} className="pt-2 text-xl font-bold text-mdn-white">
              {block.text}
            </h2>
          ) : (
            <p key={i} className="text-sm leading-relaxed text-mdn-gray sm:text-base">
              {block.text}
            </p>
          )
        )}
      </div>

      <div className="card mt-10 flex flex-col items-center gap-3 p-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <p className="text-sm font-bold text-mdn-white">Ready to put this into practice?</p>
          <p className="mt-1 text-sm text-mdn-gray">Browse the MDN range and find the right fit for your goals.</p>
        </div>
        <Link to="/products" className="btn-primary shrink-0 !px-5 !py-2.5 text-sm">
          Shop Products
        </Link>
      </div>

      {morePosts.length > 0 && (
        <div className="mt-14">
          <h3 className="text-lg font-bold text-mdn-white">More from the blog</h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {morePosts.map((p) => (
              <Link
                key={p.slug}
                to={`/blogs/${p.slug}`}
                className="group relative aspect-[4/5] overflow-hidden rounded-xl border border-white/5 bg-mdn-charcoal2 transition-all duration-300 hover:-translate-y-1.5 hover:border-mdn-green/40 hover:shadow-green-glow"
              >
                <img
                  src={p.cover}
                  alt={p.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-mdn-black via-mdn-black/70 via-40% to-transparent" />
                <span className="absolute inset-x-0 bottom-0 p-4 text-left">
                  <span className="block text-[10px] font-semibold uppercase tracking-widest text-mdn-green">
                    {p.category}
                  </span>
                  <span className="mt-1 block line-clamp-2 text-sm font-bold leading-snug text-mdn-white">
                    {p.title}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
