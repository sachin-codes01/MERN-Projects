// Surfaces product data that the admin panel already captures but the
// product page never rendered — the full nutrition table, dietary/goal
// tags, safety warnings and shelf-life dates. Nothing here is invented
// copy: every value comes from the Product document, and each block
// renders only when that product actually has the data, so a product
// without it shows nothing rather than an empty panel.

// Keys MUST match the enums in server/models/Product.js — `goal` and
// `dietaryTags` are validated against them, so a typo here saves nothing
// and renders nothing. Exported so the admin panel's checkboxes are built
// from this same list: the editor can then only ever offer values the
// storefront knows how to label.
export const GOAL_LABELS = {
  muscle_gain: "Muscle Gain",
  weight_loss: "Weight Loss",
  endurance: "Endurance",
  recovery: "Recovery",
  general_health: "General Health",
};

export const DIET_LABELS = {
  vegan: "Vegan",
  vegetarian: "Vegetarian",
  gluten_free: "Gluten Free",
  lactose_free: "Lactose Free",
  keto: "Keto",
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : null;

/**
 * Suitability pills — dietary tags and training goals, shown high in the
 * details column because "is this vegan / gluten-free" is a filter a
 * buyer applies before they even look at price.
 */
export function ProductTagRow({ product }) {
  const diet = (product.dietaryTags || []).filter((t) => DIET_LABELS[t]);
  const goals = (product.goal || []).filter((g) => GOAL_LABELS[g]);
  if (!diet.length && !goals.length) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {diet.map((t) => (
        <span
          key={t}
          className="rounded-full border border-mdn-green/40 bg-mdn-green/10 px-2.5 py-1 text-[11px] font-semibold text-mdn-green"
        >
          {DIET_LABELS[t]}
        </span>
      ))}
      {goals.map((g) => (
        <span
          key={g}
          className="rounded-full border border-white/15 px-2.5 py-1 text-[11px] font-semibold text-mdn-white/75"
        >
          {GOAL_LABELS[g]}
        </span>
      ))}
    </div>
  );
}

function Row({ label, value }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-2 last:border-b-0">
      <span className="text-sm text-mdn-gray">{label}</span>
      <span className="font-mono text-sm font-semibold text-mdn-white">{value}</span>
    </div>
  );
}

/**
 * Nutrition table + safety warnings + shelf life.
 *
 * The nutrition sub-document has been in the schema (and in the seeded
 * data) all along with servingSize, servingsPerContainer, calories,
 * protein, carbs, fats, sugar and a free-form otherNutrients list — none
 * of it was reaching the page. For a supplement this is the detail a
 * buyer actually compares between brands, so it gets a real table rather
 * than being buried in an accordion.
 */
export default function ProductFacts({ product }) {
  const n = product.nutrition || {};
  const others = (n.otherNutrients || []).filter((o) => o?.name);
  const hasNutrition =
    others.length ||
    [n.servingSize, n.servingsPerContainer, n.calories, n.protein, n.carbs, n.fats, n.sugar].some(
      (v) => v !== null && v !== undefined && v !== ""
    );

  const made = fmtDate(product.manufactureDate);
  const expires = fmtDate(product.expiryDate);
  const hasDates = made || expires;

  if (!hasNutrition && !product.warnings && !hasDates) return null;

  return (
    <div className="mt-10 grid gap-4 lg:grid-cols-2">
      {hasNutrition && (
        <div className="card p-5">
          <h3 className="font-display text-sm font-bold uppercase tracking-wide text-mdn-white">
            Nutrition <span className="text-mdn-green">Facts</span>
          </h3>
          {n.servingSize && (
            <p className="mt-1 text-xs text-mdn-gray">
              Per serving of {n.servingSize}
              {n.servingsPerContainer ? ` · ${n.servingsPerContainer} servings per pack` : ""}
            </p>
          )}

          <div className="mt-3">
            {/* Units are fixed by the schema — calories in kcal, the
                macros in grams — so they're printed here rather than
                being re-entered per product. */}
            <Row label="Energy" value={n.calories != null ? `${n.calories} kcal` : null} />
            <Row label="Protein" value={n.protein != null ? `${n.protein} g` : null} />
            <Row label="Carbohydrates" value={n.carbs != null ? `${n.carbs} g` : null} />
            <Row label="Total Fat" value={n.fats != null ? `${n.fats} g` : null} />
            <Row label="Sugar" value={n.sugar != null ? `${n.sugar} g` : null} />
            {others.map((o) => (
              <Row key={o.name} label={o.name} value={o.amount} />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {hasDates && (
          <div className="card p-5">
            <h3 className="font-display text-sm font-bold uppercase tracking-wide text-mdn-white">
              Batch <span className="text-mdn-green">Freshness</span>
            </h3>
            <div className="mt-3">
              <Row label="Manufactured" value={made} />
              <Row label="Best before" value={expires} />
            </div>
          </div>
        )}

        {product.warnings && (
          // Amber rather than the page's green: this is the one block on
          // the page a buyer should not skim past.
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
            <h3 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-amber-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Safety Information
            </h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-mdn-white/75">
              {product.warnings}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
