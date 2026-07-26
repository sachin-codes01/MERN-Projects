import { useCallback, useEffect, useRef, useState } from "react";
import SliderArrow from "./SliderArrow";

/**
 * Single-row "one card advances at a time" carousel — different from
 * Carousel.jsx (which pages through whole groups). Used where you want
 * several items visible at once but the row itself moves item-by-item
 * (e.g. "What's Your Target?").
 *
 * Item width comes from Tailwind classes on each item (itemClassName),
 * so it's fully responsive — the actual pixel step is measured from the
 * rendered DOM rather than hardcoded, so it always matches whatever
 * width the current breakpoint gives each card.
 */
export default function ItemCarousel({
  items,
  renderItem,
  autoPlay = true,
  interval = 3000,
  gapClassName = "gap-4",
  itemClassName = "w-[78%] sm:w-[46%] lg:w-[23%]",
  showDots = true,
  showArrows = true,
}) {
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [stepPx, setStepPx] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const [maxIndex, setMaxIndex] = useState(Math.max(0, items.length - 1));
  // Starts false so the first paint never guesses a layout: `maxScroll`
  // is 0 before anything is measured, which is indistinguishable from
  // "everything fits", and centering on that guess makes a full row snap
  // from centred to left-aligned on the frame after mount.
  const [measured, setMeasured] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const lastMoveX = useRef(0);
  const lastMoveTime = useRef(0);
  const velocityRef = useRef(0);
  const timerRef = useRef(null);
  const pointerIdRef = useRef(null);
  const capturedRef = useRef(false);

  // Minimum horizontal travel, in px, before a pointer-down is treated as a
  // drag rather than a click/tap on a card.
  const DRAG_THRESHOLD = 6;

  const measure = useCallback(() => {
    const track = trackRef.current;
    const container = containerRef.current;
    if (!track || !container || track.children.length === 0) return;
    const firstChild = track.children[0];
    const style = getComputedStyle(track);
    const gap = parseFloat(style.columnGap || style.gap || "0");
    const itemWidth = firstChild.getBoundingClientRect().width + gap;
    if (itemWidth <= 0) return;
    setStepPx(itemWidth);
    const containerWidth = container.getBoundingClientRect().width;
    // `track.scrollWidth` is the exact total width of every item + gap
    // between them — using that (instead of guessing how many items
    // "visible" fit and multiplying) is what lets the scroll clamp land
    // EXACTLY at the end, so the last card sits flush against the right
    // edge instead of being cut off or leaving empty space after it.
    const maxScrollPx = Math.max(0, track.scrollWidth - containerWidth);
    setMaxScroll(maxScrollPx);
    setMaxIndex(Math.max(0, Math.ceil(maxScrollPx / itemWidth)));
    setMeasured(true);
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure, items.length]);

  useEffect(() => {
    setIndex((i) => Math.min(i, maxIndex));
  }, [maxIndex]);

  const stopAutoplay = () => clearInterval(timerRef.current);
  const startAutoplay = useCallback(() => {
    stopAutoplay();
    if (autoPlay && maxIndex > 0) {
      timerRef.current = setInterval(() => {
        setIndex((i) => (i >= maxIndex ? 0 : i + 1));
      }, interval);
    }
  }, [autoPlay, interval, maxIndex]);

  useEffect(() => {
    startAutoplay();
    return stopAutoplay;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startAutoplay]);

  const goTo = (i) => setIndex(Math.max(0, Math.min(maxIndex, i)));

  // Pixel offset for a given index, clamped so the LAST index always
  // lands exactly at `maxScroll` instead of `index * stepPx`, which can
  // overshoot past the real end or stop short of it depending on how
  // evenly the items divide into the container width.
  const positionFor = (i) => Math.min(i * stepPx, maxScroll);

  // When the whole set already fits the container there is nothing to
  // scroll, so the row is centred instead of left-aligned. Without this a
  // section that returns fewer products than fit across (e.g. a single
  // bestseller) rendered one card pinned to the far left with the rest of
  // the row empty. Only applies once measured — see `measured` above.
  const fitsInRow = measured && maxScroll <= 0;

  const onPointerDown = (e) => {
    if (maxIndex <= 0) return;
    // Deliberately NOT calling setPointerCapture here. Per the Pointer
    // Events spec, once a pointer is captured, the browser retargets that
    // pointer's subsequent mouse-compat events — including the `click`
    // that follows `pointerup` — to the capturing element, regardless of
    // what's actually under the cursor. Capturing eagerly on every
    // pointerdown meant a plain tap on a product card (zero movement) had
    // its click silently retargeted from the <a> to this track div, so
    // navigation never fired. Capture is deferred to onPointerMove, once
    // real drag movement crosses DRAG_THRESHOLD — by then it's a genuine
    // drag, not a click, so there's nothing left to swallow.
    dragStartX.current = e.clientX;
    lastMoveX.current = e.clientX;
    lastMoveTime.current = performance.now();
    velocityRef.current = 0;
    pointerIdRef.current = e.pointerId;
    capturedRef.current = false;
    stopAutoplay();
  };
  const onPointerMove = (e) => {
    if (pointerIdRef.current === null) return;
    const now = performance.now();
    const dt = now - lastMoveTime.current;
    if (dt > 0) velocityRef.current = (e.clientX - lastMoveX.current) / dt; // px/ms
    lastMoveX.current = e.clientX;
    lastMoveTime.current = now;

    const totalOffset = e.clientX - dragStartX.current;
    if (!isDragging) {
      if (Math.abs(totalOffset) < DRAG_THRESHOLD) return;
      setIsDragging(true);
      trackRef.current?.setPointerCapture?.(pointerIdRef.current);
      capturedRef.current = true;
    }
    setDragOffset(totalOffset);
  };
  const endDrag = (e) => {
    if (e && capturedRef.current && trackRef.current?.hasPointerCapture?.(e.pointerId)) {
      trackRef.current.releasePointerCapture(e.pointerId);
    }
    pointerIdRef.current = null;
    capturedRef.current = false;

    if (isDragging) {
      // How far you dragged, PLUS a bit of projected travel from how fast
      // you were moving at release (a quick flick keeps going) — together
      // these decide how MANY cards to advance, instead of always moving
      // exactly one no matter how far or fast the swipe was.
      const flungOffset = dragOffset + velocityRef.current * 160;
      const minThreshold = stepPx * 0.2;
      if (Math.abs(flungOffset) > minThreshold) {
        const steps = Math.max(1, Math.round(Math.abs(flungOffset) / stepPx));
        goTo(flungOffset < 0 ? index + steps : index - steps);
      }
      setIsDragging(false);
      setDragOffset(0);
    }
    startAutoplay();
  };

  return (
    <div
      ref={containerRef}
      className="relative select-none"
      onMouseEnter={stopAutoplay}
      onMouseLeave={() => !isDragging && startAutoplay()}
    >
      <div
        className="relative overflow-hidden"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerCancel={endDrag}
        style={{
          cursor: maxIndex > 0 ? (isDragging ? "grabbing" : "grab") : "default",
          // See Carousel.jsx: without this, touch browsers can hijack a
          // horizontal swipe as page-scroll and cancel the drag mid-way.
          touchAction: "pan-y",
        }}
      >
        <div
          ref={trackRef}
          className={`flex py-4 ${gapClassName} ${fitsInRow ? "justify-center" : ""}`}
          style={{
            transform: `translateX(calc(-${positionFor(index)}px + ${dragOffset}px))`,
            transition: isDragging ? "none" : "transform 0.5s cubic-bezier(.4,0,.2,1)",
          }}
        >
          {items.map((item, i) => (
            <div key={i} className={`flex-shrink-0 ${itemClassName}`}>
              {renderItem(item, i)}
            </div>
          ))}
        </div>

        {showArrows && maxIndex > 0 && (
          <>
            <SliderArrow
              direction="left"
              onClick={() => {
                goTo(index - 1);
                startAutoplay();
              }}
            />
            <SliderArrow
              direction="right"
              onClick={() => {
                goTo(index + 1);
                startAutoplay();
              }}
            />
          </>
        )}
      </div>

      {showDots && maxIndex > 0 && (
        <div className="mt-5 flex justify-center gap-2">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                goTo(i);
                startAutoplay();
              }}
              aria-label={`Go to position ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === index ? "w-6 bg-mdn-green" : "w-2 bg-white/25 hover:bg-white/45"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
