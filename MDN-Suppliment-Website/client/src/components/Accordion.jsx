import { useState } from "react";

// Generic single-open-at-a-time accordion, visually matching FAQ.jsx's
// disclosure pattern. Items with no content are dropped before rendering
// so an unset field (e.g. a product with no `whoIsThisFor` text) doesn't
// show an empty row.
export default function Accordion({ items, defaultOpen = -1 }) {
  const [open, setOpen] = useState(defaultOpen);
  const visibleItems = items.filter((item) => item.content && item.content.trim());

  if (visibleItems.length === 0) return null;

  return (
    <div className="divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10">
      {visibleItems.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.title} className="bg-mdn-charcoal">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? -1 : i)}
              className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-white/5 sm:px-5 sm:py-4"
            >
              <span className="text-sm font-semibold text-mdn-white sm:text-base">{item.title}</span>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`flex-shrink-0 text-mdn-green transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
              >
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div
              className={`grid min-w-0 transition-all duration-300 ease-in-out ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="min-w-0 overflow-hidden">
                <p className="whitespace-pre-line break-words px-4 pb-3 text-sm leading-relaxed text-mdn-gray sm:px-5 sm:pb-4">
                  {item.content}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
