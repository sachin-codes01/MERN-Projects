import { useEffect, useMemo, useState } from "react";
import { reviewCountLabel } from "../utils/rating";
import { Link } from "react-router-dom";
import Button from "@mui/material/Button";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { LIMITS, rules } from "../utils/validators";

const INITIAL_VISIBLE = 10;
const PAGE_SIZE = 10;

function Stars({ rating, size = 14 }) {
  const rounded = Math.round(rating);
  return (
    <div className="flex gap-0.5 text-mdn-green">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={i < rounded ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M12 2l2.9 6.4 7 .7-5.3 4.7 1.6 6.9L12 17.6 5.8 20.7l1.6-6.9L2.1 9.1l7-.7L12 2z" />
        </svg>
      ))}
    </div>
  );
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
}

// Interactive 1-5 star picker for the review form (as opposed to the
// read-only <Stars> above used to display existing ratings).
function StarPicker({ value, onChange }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Your rating">
      {Array.from({ length: 5 }).map((_, i) => {
        const starValue = i + 1;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(starValue)}
            role="radio"
            aria-checked={starValue === value}
            aria-label={`${starValue} star${starValue > 1 ? "s" : ""}`}
            className="rounded text-mdn-green transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mdn-green"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill={starValue <= value ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2l2.9 6.4 7 .7-5.3 4.7 1.6 6.9L12 17.6 5.8 20.7l1.6-6.9L2.1 9.1l7-.7L12 2z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

function WriteReviewForm({ onSubmitReview }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [commentError, setCommentError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return; // double submit guard
    const ratingMsg = rules.rating(rating);
    const commentMsg = rules.reviewComment(comment);
    setFormError(ratingMsg);
    setCommentError(commentMsg);
    if (ratingMsg || commentMsg) return;

    setSubmitting(true);
    try {
      const ok = await onSubmitReview({ rating, comment: comment.trim() });
      if (ok) {
        setRating(0);
        setComment("");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card mt-6 space-y-3 p-4 sm:p-5">
      <h3 className="font-heading text-base font-bold text-mdn-ink">Write a Review</h3>
      <StarPicker
        value={rating}
        onChange={(v) => {
          setRating(v);
          setFormError("");
        }}
      />
      {formError && (
        <p role="alert" className="text-xs text-mdn-danger">
          {formError}
        </p>
      )}
      <label htmlFor="review-comment" className="sr-only">
        Your review
      </label>
      <textarea
        id="review-comment"
        value={comment}
        onChange={(e) => {
          setComment(e.target.value);
          if (commentError) setCommentError(rules.reviewComment(e.target.value));
        }}
        onBlur={() => setCommentError(rules.reviewComment(comment))}
        maxLength={LIMITS.reviewMax}
        placeholder={`Share your experience with this product (optional, ${LIMITS.reviewMin}+ characters)`}
        rows={3}
        aria-invalid={!!commentError}
        aria-describedby="review-comment-help"
        className={`input-field w-full resize-none ${commentError ? "!border-mdn-danger/60" : ""}`}
      />
      <div id="review-comment-help" className="flex items-start justify-between gap-3 text-xs">
        <span role={commentError ? "alert" : undefined} className="text-mdn-danger">
          {commentError}
        </span>
        <span className="shrink-0 tabular-nums text-mdn-gray">
          {comment.trim().length}/{LIMITS.reviewMax}
        </span>
      </div>
      <button type="submit" disabled={submitting} className="btn-primary !px-5 !py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50">
        {submitting ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}

// Product-specific customer reviews — real `product.reviews` data, styled
// to match: stars row, avatar-initial circle, name + Verified pill, date,
// then the comment text, each review separated by a divider. This is
// intentionally separate from ReviewsSection.jsx (that one is a
// hardcoded homepage/marketing testimonials carousel, not per-product).
export default function ProductReviews({
  reviews = [],
  ratingsAverage = 0,
  ratingsCount = 0,
  currentUserId = null,
  canReview = false,
  onSubmitReview = null,
}) {
  const alreadyReviewed = currentUserId
    ? reviews.some((r) => (r.user?._id || r.user) === currentUserId)
    : false;
  // EVERY review, newest first. This used to shuffle the list and keep a
  // random 20-24 of them, which quietly hid real customer reviews and made
  // the visible set change on each page load — so the list never agreed
  // with the "N Reviews" count beside it. Ordering is by date so a newly
  // submitted review appears at the top immediately.
  const displayedReviews = useMemo(
    () => [...reviews].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    [reviews]
  );

  // "Show More" reveals 10 at a time instead of dumping the whole random
  // batch at once. Resets back to the initial 10 whenever `reviews`
  // changes — i.e. whenever a different product's data loads — so
  // leaving this product's page (or navigating straight to another one,
  // which reuses the same mounted component) doesn't leave the section
  // stuck expanded.
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE);
  }, [reviews]);

  const visibleReviews = displayedReviews.slice(0, visibleCount);
  const hasMore = visibleCount < displayedReviews.length;

  return (
    <section id="product-reviews" className="mt-10 border-t border-mdn-border pt-8 sm:mt-14 sm:pt-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="display-lg">
          Customer <span className="display-accent">Reviews</span>
        </h2>
        <div className="flex items-center gap-2">
          <Stars rating={ratingsAverage} />
          <span className="text-sm text-mdn-gray">
            {ratingsCount > 0 && `${ratingsAverage.toFixed(1)} `}
            ({reviewCountLabel(ratingsCount)})
          </span>
        </div>
      </div>

      {reviews.length === 0 ? (
        <p className="mt-6 text-sm text-mdn-gray">No reviews yet — be the first to share your experience.</p>
      ) : (
        <div className="mt-6 divide-y divide-mdn-border border-t border-mdn-border">
          {visibleReviews.map((r) => (
            <div key={r._id} className="py-5">
              <Stars rating={r.rating} />
              <div className="mt-3 flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mdn-green text-sm font-bold text-mdn-on-primary">
                  {(r.user?.name || "?").charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-semibold text-mdn-white">{r.user?.name || "Anonymous"}</span>
                    {r.verifiedPurchase && (
                      <span className="rounded-full border border-mdn-silver/40 px-2 py-0.5 text-[10px] font-medium text-mdn-gray">
                        Verified
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-mdn-gray">{formatDate(r.createdAt)}</span>
                </div>
              </div>
              {r.comment && <p className="mt-3 break-words text-sm leading-relaxed text-mdn-ink-body">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <Button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            variant="outlined"
            endIcon={<ExpandMoreRoundedIcon />}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.875rem",
              borderRadius: "999px",
              borderColor: "rgba(34,177,76,0.4)",
              borderWidth: "1.5px",
              color: "#22B14C",
              px: 3,
              py: 1,
              transition: "all 200ms",
              "&:hover": {
                borderColor: "#22B14C",
                borderWidth: "1.5px",
                backgroundColor: "rgba(34,177,76,0.08)",
                transform: "translateY(-2px)",
                boxShadow: "0 4px 14px rgba(34,177,76,0.25)",
              },
            }}
          >
            Show More Reviews
          </Button>
        </div>
      )}

      {canReview && onSubmitReview && !alreadyReviewed && <WriteReviewForm onSubmitReview={onSubmitReview} />}
      {canReview && alreadyReviewed && (
        <p className="mt-6 text-sm text-mdn-gray">You've already reviewed this product — thanks for sharing!</p>
      )}
      {!canReview && (
        <p className="mt-6 text-sm text-mdn-gray">
          <Link to="/login" className="text-mdn-green hover:underline">
            Log in
          </Link>{" "}
          to write a review.
        </p>
      )}
    </section>
  );
}
