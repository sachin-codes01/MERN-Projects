import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/api";
import { getSizePrice } from "../utils/pricing";

/**
 * Search box with a live product dropdown — results appear from the first
 * character typed, so "c" or "crea" surfaces Creatine without the customer
 * having to type the whole product name.
 *
 * The matching itself is server-side (GET /api/products/suggest); this
 * component only debounces, ranks nothing, and renders. See
 * buildSearchConditions in server/controller/productController.js for why
 * partial matching needed a regex rather than the old $text index.
 */

// Bolds the matched run inside a product name so it's obvious WHY a row
// came back for the typed term.
function Highlight({ text = "", term = "" }) {
  const at = term ? text.toLowerCase().indexOf(term.toLowerCase()) : -1;
  if (at === -1) return text;
  return (
    <>
      {text.slice(0, at)}
      <span className="rounded-sm bg-mdn-orange-soft font-extrabold text-mdn-ink">{text.slice(at, at + term.length)}</span>
      {text.slice(at + term.length)}
    </>
  );
}

export default function SearchSuggest({
  className = "",
  // Input khud transparent hai — border, focus glow aur height pill <form>
  // sambhalta hai. Font 16px pe fixed: iOS Safari 16px se chhote input pe
  // focus karte hi poora page zoom kar deta hai aur wapas nahi aata.
  inputClassName = "h-full min-w-0 flex-1 border-0 bg-transparent px-2 font-heading text-[16px] font-semibold text-mdn-ink outline-none placeholder:font-medium placeholder:text-mdn-ink-muted focus-visible:!shadow-none focus-visible:!outline-none",
  placeholder = "Search supplements...",
  onNavigate,
  autoFocus = false,
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  // Index of the keyboard-highlighted row; -1 means "nothing highlighted",
  // in which case Enter falls through to a normal full-search submit.
  const [active, setActive] = useState(-1);
  const boxRef = useRef(null);
  // Guards against a slow response for an earlier term landing after a
  // faster one for the term the customer has since typed, which would
  // show results that no longer match what's in the box.
  const reqIdRef = useRef(0);

  const term = query.trim();

  useEffect(() => {
    if (!term) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const reqId = ++reqIdRef.current;
    // Debounced so a fast typist fires one request, not one per keystroke.
    const timer = setTimeout(() => {
      api
        .suggestProducts(term)
        .then((d) => {
          if (reqId !== reqIdRef.current) return;
          setItems(d.data || []);
          setActive(-1);
        })
        .catch(() => {
          if (reqId === reqIdRef.current) setItems([]);
        })
        .finally(() => {
          if (reqId === reqIdRef.current) setLoading(false);
        });
    }, 200);
    return () => clearTimeout(timer);
  }, [term]);

  // Clicking anywhere outside closes the dropdown but keeps the typed text.
  useEffect(() => {
    if (!open) return;
    const onDocPointerDown = (e) => {
      if (!boxRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDocPointerDown);
    return () => document.removeEventListener("pointerdown", onDocPointerDown);
  }, [open]);

  const close = () => {
    setOpen(false);
    setActive(-1);
  };

  const goToProduct = (product) => {
    close();
    setQuery("");
    onNavigate?.();
    navigate(`/products/${product.slug}`);
  };

  const submitSearch = () => {
    if (!term) return;
    close();
    onNavigate?.();
    navigate(`/search?q=${encodeURIComponent(term)}`);
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      close();
      return;
    }
    // Enter is handled here rather than left to the <form>'s submit
    // event. This form has no submit button, so a browser only submits it
    // implicitly under a narrow condition (exactly one field that blocks
    // implicit submission) — which silently stops applying the moment the
    // component is dropped somewhere with another input beside it.
    // Handling the key directly makes Enter behave the same everywhere.
    if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && items[active]) goToProduct(items[active]);
      else submitSearch();
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!items.length) return;
      e.preventDefault();
      setOpen(true);
      setActive((i) => {
        const next = e.key === "ArrowDown" ? i + 1 : i - 1;
        if (next < -1) return items.length - 1;
        if (next >= items.length) return -1;
        return next;
      });
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (active >= 0 && items[active]) goToProduct(items[active]);
    else submitSearch();
  };

  const showPanel = open && term.length > 0;

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      {/* Poora pill hi container hai — focus pe green border + halka glow,
          taaki saaf dikhe ki search active hai. */}
      <form
        onSubmit={onSubmit}
        role="search"
        className="group flex h-12 items-center gap-1 rounded-full border-2 border-mdn-border-strong bg-mdn-charcoal pl-4 pr-1.5 shadow-xs transition-[border-color,box-shadow] duration-200 hover:border-mdn-ink-muted/50 focus-within:border-mdn-green focus-within:shadow-[0_0_0_4px_rgb(var(--green-primary)/0.14)]"
      >
        <span className="pointer-events-none flex-shrink-0 text-mdn-ink-muted transition-colors duration-200 group-focus-within:text-mdn-green">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
          </svg>
        </span>

        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          autoFocus={autoFocus}
          placeholder={placeholder}
          className={inputClassName}
          autoComplete="off"
          enterKeyHint="search"
          aria-label="Search products"
          aria-expanded={showPanel}
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setItems([]);
              close();
            }}
            aria-label="Clear search"
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-mdn-sand text-mdn-ink-muted transition-colors hover:bg-mdn-ink hover:text-mdn-charcoal"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        )}

        {/* Pill ke andar "Search" button — click pe full search submit */}
        <button
          type="submit"
          className="press flex h-9 flex-shrink-0 items-center gap-1.5 rounded-full bg-mdn-green px-4 font-heading text-[13px] font-bold text-mdn-on-primary hover:bg-mdn-green-light sm:px-5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" className="hidden sm:block">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
          </svg>
          Search
        </button>
      </form>

      {showPanel && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 animate-fade-up overflow-hidden rounded-2xl border border-mdn-border bg-mdn-charcoal shadow-lg">
          {loading && items.length === 0 && (
            <p className="flex items-center gap-2.5 px-4 py-4 text-sm text-mdn-ink-muted">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-mdn-border-strong border-t-mdn-green" />
              Searching…
            </p>
          )}

          {!loading && items.length === 0 && (
            <div className="px-4 py-5">
              <p className="font-heading text-sm font-semibold text-mdn-ink">No products match “{term}”</p>
              <p className="mt-1 text-[13px] text-mdn-ink-muted">Try a different word, like “whey”, “creatine” or “isolate”.</p>
            </div>
          )}

          {/* Lenis swallows wheel events page-wide by default, which would
              make this list's own scrollbar dead — data-lenis-prevent is
              Lenis's opt-out for elements with independent scroll. */}
          {items.length > 0 && (
            <>
              <p className="eyebrow px-4 pb-1 pt-3">Products</p>
              <ul data-lenis-prevent className="max-h-[22rem] overflow-y-auto px-1.5 pb-1.5">
                {items.map((p, i) => {
                  const size = p.sizes?.[0];
                  const { effectivePrice } = getSizePrice(size);
                  return (
                    <li key={p._id}>
                      <button
                        type="button"
                        onMouseEnter={() => setActive(i)}
                        onClick={() => goToProduct(p)}
                        className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors ${
                          i === active ? "bg-mdn-sand" : "hover:bg-mdn-sand"
                        }`}
                      >
                        <span className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-mdn-border bg-mdn-sand">
                          {p.thumbnail && <img src={p.thumbnail} alt="" className="h-full w-full object-cover" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-heading text-[14px] font-bold text-mdn-ink">
                            <Highlight text={p.name} term={term} />
                          </span>
                          <span className="block truncate text-xs font-medium text-mdn-ink-muted">{p.productType}</span>
                        </span>
                        {effectivePrice > 0 && (
                          <span className="flex-shrink-0 font-heading text-sm font-bold tabular-nums text-mdn-ink">
                            ₹{effectivePrice}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          <button
            type="button"
            onClick={submitSearch}
            className="group flex w-full items-center justify-between border-t border-mdn-border bg-mdn-sand/60 px-4 py-3 text-left font-heading text-[13px] font-bold text-mdn-green transition-colors hover:bg-mdn-sand"
          >
            <span>View all results for “{term}”</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="transition-transform duration-200 group-hover:translate-x-1">
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
