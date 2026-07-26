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
      <span className="text-mdn-green">{text.slice(at, at + term.length)}</span>
      {text.slice(at + term.length)}
    </>
  );
}

export default function SearchSuggest({
  className = "",
  inputClassName = "input-field w-full !py-2 pl-9 pr-9 text-sm",
  placeholder = "Search supplements...",
  onNavigate,
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
      <form onSubmit={onSubmit} className="relative" role="search">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mdn-gray">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          placeholder={placeholder}
          className={inputClassName}
          autoComplete="off"
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
            className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-mdn-white transition-colors hover:bg-mdn-green hover:text-mdn-black"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </form>

      {showPanel && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-white/10 bg-mdn-charcoal shadow-2xl shadow-black/50">
          {loading && items.length === 0 && (
            <p className="px-4 py-4 text-sm text-mdn-gray">Searching…</p>
          )}

          {!loading && items.length === 0 && (
            <p className="px-4 py-4 text-sm text-mdn-gray">
              No products match “{term}”.
            </p>
          )}

          {items.length > 0 && (
            <ul className="max-h-[22rem] overflow-y-auto py-1">
              {items.map((p, i) => {
                const size = p.sizes?.[0];
                const { effectivePrice } = getSizePrice(size);
                return (
                  <li key={p._id}>
                    <button
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onClick={() => goToProduct(p)}
                      className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                        i === active ? "bg-white/10" : "hover:bg-white/5"
                      }`}
                    >
                      <span className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md border border-white/10 bg-mdn-charcoal2">
                        {p.thumbnail && (
                          <img src={p.thumbnail} alt="" className="h-full w-full object-cover" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-mdn-white">
                          <Highlight text={p.name} term={term} />
                        </span>
                        <span className="block truncate text-xs text-mdn-gray">{p.productType}</span>
                      </span>
                      {effectivePrice > 0 && (
                        <span className="flex-shrink-0 text-sm font-bold text-mdn-green">
                          ₹{effectivePrice}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <button
            type="button"
            onClick={submitSearch}
            className="block w-full border-t border-white/10 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-mdn-green transition-colors hover:bg-white/5"
          >
            View all results for “{term}”
          </button>
        </div>
      )}
    </div>
  );
}
