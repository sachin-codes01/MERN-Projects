import { Link, useParams, Navigate } from "react-router-dom";
import { getBlogBySlug, BLOGS } from "../data/blogs";

const BlogDetail = () => {
  const { slug } = useParams();
  const post = getBlogBySlug(slug);

  if (!post) return <Navigate to="/blogs" replace />;

  const morePosts = BLOGS.filter((b) => b.slug !== post.slug).slice(0, 3);

  return (
    <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <Link to="/blogs" className="inline-flex items-center gap-1.5 font-heading text-[13px] font-semibold text-mdn-green hover:text-mdn-green-light">
        ← Back to Blog
      </Link>

      <span className="eyebrow mt-5 block">
        {post.category}
      </span>
      <h1 className="mt-1 display-xl">
        {post.title}
      </h1>
      <div className="mt-3 flex items-center gap-2 text-xs text-mdn-ink-muted">
        <time dateTime={post.date}>
          {new Date(post.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
        </time>
        <span aria-hidden="true">•</span>
        <span>{post.readTime}</span>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl bg-mdn-sand">
        <img src={post.cover} alt={post.title} className="aspect-[16/9] w-full object-cover" />
      </div>

      <div className="mt-8 space-y-5">
        {post.content.map((block, i) =>
          block.type === "h2" ? (
            <h2 key={i} className="display-md pt-2">
              {block.text}
            </h2>
          ) : (
            <p key={i} className="text-[15px] leading-[1.75] text-mdn-ink-body sm:text-base">
              {block.text}
            </p>
          )
        )}
      </div>

      <div className="card mt-8 flex flex-col items-center gap-3 p-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <p className="font-heading text-[15px] font-semibold text-mdn-ink">Ready to put this into practice?</p>
          <p className="mt-1 text-sm text-mdn-ink-body">Browse the MDN range and find the right fit for your goals.</p>
        </div>
        <Link to="/products" className="btn-primary shrink-0 !px-5 !py-2.5 text-sm">
          Shop Products
        </Link>
      </div>

      {morePosts.length > 0 && (
        <div className="mt-10 sm:mt-12">
          <h3 className="display-md">More from the blog</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {morePosts.map((p) => (
              <Link
                key={p.slug}
                to={`/blogs/${p.slug}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-mdn-border bg-mdn-charcoal shadow-xs transition-shadow duration-300 hover:shadow-lg"
              >
                <span className="block aspect-[16/10] overflow-hidden bg-mdn-sand">
                  <img
                    src={p.cover}
                    alt={p.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </span>
                <span className="block p-3.5">
                  <span className="eyebrow block">{p.category}</span>
                  <span className="mt-1 block line-clamp-2 font-heading text-sm font-semibold leading-snug text-mdn-ink">
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
};

export default BlogDetail;
