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
  const viewportRef = useRef(null);
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
  // Live pixel offset while a trackpad gesture is in flight, reset to 0
  // once it settles onto a card (see the wheel effect below).
  const [wheelOffset, setWheelOffset] = useState(0);
  const wheelOffsetRef = useRef(0);

  // Mirrors of the values the wheel listener needs. Reading them through
  // refs is what lets that listener be registered ONCE — putting `index`
  // and friends in its dependency array meant it was detached and
  // re-attached on every step, throwing away the gesture state mid-scroll.
  const indexRef = useRef(0);
  const stepPxRef = useRef(0);
  const maxScrollRef = useRef(0);
  const maxIndexRef = useRef(0);
  // Authoritative scroll distance of the row, in px from the left end.
  // Kept in sync with `index` below and driven directly by wheel gestures.
  const scrollRef = useRef(0);
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

    // Content width is summed from the children rather than read off
    // `track.scrollWidth`, because scrollWidth is NOT transform-safe.
    //
    // The track is moved with `translateX(-Npx)`. scrollWidth measures
    // overflow from the padding edge RIGHTWARDS only — content that has
    // already scrolled off to the left sits at negative x and stops being
    // counted. So scrollWidth shrinks as the row scrolls: measured at
    // rest it read 2677px, but measured after scrolling it read 1941px
    // for the very same ten cards.
    //
    // Any re-measure taken mid-scroll therefore produced a wrong
    // `maxScroll` — too small, and the row could never reach the end so
    // the last card stayed half-cut; too large, and it scrolled past the
    // end leaving an empty band after the last card. Both of those were
    // the same bug. Summing the children is independent of the transform
    // (translate does not change an element's width), so the clamp is
    // correct whenever it runs.
    const children = Array.from(track.children);
    const contentWidth =
      children.reduce((sum, c) => sum + c.getBoundingClientRect().width, 0) +
      gap * Math.max(0, children.length - 1);

    const maxScrollPx = Math.max(0, contentWidth - containerWidth);
    setMaxScroll(maxScrollPx);
    setMaxIndex(Math.max(0, Math.ceil(maxScrollPx / itemWidth)));
    setMeasured(true);
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);

    // A window `resize` is not the only thing that changes these numbers.
    // The card width is a percentage and the height an aspect-ratio, so the
    // step size and the total track width also move when the CONTAINER
    // resizes without the window doing so — a font finishing loading, an
    // image settling, a parent's layout reflowing, or a style change
    // arriving over HMR. When that happened, `stepPx` and `maxScroll`
    // stayed at their old values and the row could be scrolled PAST its
    // real end, leaving an empty band after the last card.
    //
    // Observing the container and the track re-measures on any of those.
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    if (trackRef.current) ro.observe(trackRef.current);

    return () => {
      window.removeEventListener("resize", measure);
      ro.disconnect();
    };
  }, [measure, items.length]);

  // Re-clamp whenever a re-measure shrinks the track. Without this, a row
  // sitting at the old (larger) end keeps that position after the content
  // gets narrower, which is exactly the empty band after the last card.
  useEffect(() => {
    setIndex((i) => Math.min(i, maxIndex));
    scrollRef.current = Math.min(scrollRef.current, maxScroll);
  }, [maxIndex, maxScroll]);

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

  // Keep the wheel listener's mirrors current on every render.
  indexRef.current = index;
  stepPxRef.current = stepPx;
  maxScrollRef.current = maxScroll;
  maxIndexRef.current = maxIndex;

  // Any move that did NOT come from a wheel gesture (arrow click, dot,
  // drag, autoplay) leaves `wheelOffset` at 0 — realign the scroll
  // authority to that new index so the next trackpad gesture continues
  // from where the row actually is.
  useEffect(() => {
    if (wheelOffsetRef.current === 0) {
      scrollRef.current = Math.min(index * stepPx, maxScroll);
    }
  }, [index, stepPx, maxScroll]);

  const goTo = (i) => setIndex(Math.max(0, Math.min(maxIndex, i)));

  // ---- Trackpad / horizontal-wheel scrolling -------------------------
  //
  // The row follows the fingers 1:1 while the gesture is live, then snaps
  // to the nearest card once it stops. This replaced a
  // threshold-plus-cooldown stepper, which was genuinely unreliable: it
  // banked deltas until they crossed half a card, so identical flicks
  // sometimes stepped and sometimes did nothing depending on where the
  // running total happened to sit, and a trackpad's reversed momentum
  // deltas at the end of a flick could drag that total back through zero
  // and step the row BACKWARDS mid-scroll.
  //
  // Everything the handler needs is read through refs so the listener can
  // be attached once, instead of being torn down and re-attached on every
  // index change (which was also losing in-flight gesture state).
  //
  // A two-finger sideways swipe on a laptop trackpad fires `wheel` events
  // carrying `deltaX`. This track is transform-driven rather than a native
  // scroll container, so those events did nothing — the row could only be
  // dragged with a held pointer or stepped with the arrows.
  //
  // Three details this has to get right:
  //
  // • ONLY claim horizontal intent. If |deltaY| >= |deltaX| the gesture is
  //   a normal vertical page scroll that happens to have a little sideways
  //   wobble, and swallowing it would trap the page. Shift+wheel is the
  //   mouse-wheel convention for horizontal, so that maps to deltaY.
  // • preventDefault, via a NON-PASSIVE listener. React's onWheel is
  //   registered passively, where preventDefault is ignored — so this is
  //   attached by hand with `{ passive: false }`. Without it, a sideways
  //   trackpad swipe at either end of the row triggers the browser's
  //   back/forward navigation gesture and leaves the page entirely.
  // • Rate-limit. One trackpad flick emits dozens of wheel events; stepping
  //   per event would fly through the whole row. Deltas accumulate and fire
  //   a single step once they pass half a card, then a short cooldown runs
  //   before the next step can trigger.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    let snapTimer;
    let resumeTimer;

    // A two-finger VERTICAL scroll is never perfectly straight — it leaks
    // a pixel or two of deltaX per event, and on the opening event of a
    // flick deltaY can still be 0 while that noise is not. So horizontal
    // intent needs both a floor and a clear dominance over deltaY, or the
    // carousel steals ordinary page scrolls.
    const MIN_DX = 4;
    const DOMINANCE = 1.5;
    // Gesture is considered over after this long with no wheel event.
    const SETTLE_MS = 120;

    const onWheel = (e) => {
      const ax = Math.abs(e.deltaX);
      const ay = Math.abs(e.deltaY);

      let delta = 0;
      if (e.shiftKey && ay > 0) delta = e.deltaY; // mouse wheel: shift = horizontal
      else if (ax >= MIN_DX && ax > ay * DOMINANCE) delta = e.deltaX;
      if (!delta) return; // vertical / ambiguous — hand it back to the page

      const step = stepPxRef.current;
      const max = maxScrollRef.current;
      if (step <= 0 || max <= 0) return; // whole row already fits

      e.preventDefault();
      stopAutoplay();

      // Absolute scroll distance, clamped to the track. Because it is
      // clamped, the reversed momentum deltas a trackpad emits at the end
      // of a flick do nothing once the row is already pinned at an end.
      //
      // `scrollRef` is the authority for where the row actually sits, NOT
      // `index * step`. Deriving it from index each time meant the first
      // event of a gesture used whatever index React had last committed —
      // which lags the snap by a render — so a fresh gesture jumped
      // several hundred pixels to "correct" itself before tracking.
      const base = Math.min(indexRef.current * step, max);
      const next = Math.max(0, Math.min(max, scrollRef.current + delta));
      scrollRef.current = next;

      wheelOffsetRef.current = base - next;
      setWheelOffset(wheelOffsetRef.current);

      // Settle: once the gesture stops, commit to the nearest card and
      // hand the position back to `index` so arrows/dots stay in sync.
      clearTimeout(snapTimer);
      snapTimer = setTimeout(() => {
        const lastIndex = maxIndexRef.current;
        // Snapping to the NEAREST card is wrong in the final stretch. The
        // track's last step is a partial one — `max` is not a whole
        // multiple of `step` — so rounding there lands on the last WHOLE
        // step, which sits short of the end and clips the final card. The
        // row would follow the gesture all the way to the flush end and
        // then visibly jump back on release.
        //
        // Anything past the last whole step therefore snaps to the end
        // instead, where positionFor() clamps to `max` and the last card
        // sits flush.
        const landed =
          next > (lastIndex - 1) * step
            ? lastIndex
            : Math.max(0, Math.min(lastIndex, Math.round(next / step)));
        // Update the mirrors synchronously as well as the state. React
        // won't re-render (and so won't refresh `indexRef`) until after
        // this callback returns, and a gesture starting in that gap would
        // otherwise compute its base from the pre-snap index.
        indexRef.current = landed;
        scrollRef.current = Math.min(landed * step, max);
        wheelOffsetRef.current = 0;
        setWheelOffset(0);
        setIndex(landed);
      }, SETTLE_MS);

      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => startAutoplay(), 900);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      clearTimeout(snapTimer);
      clearTimeout(resumeTimer);
    };
  }, [startAutoplay]);

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
        ref={viewportRef}
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
            transform: `translateX(calc(-${positionFor(index)}px + ${dragOffset + wheelOffset}px))`,
            // No easing while a drag or trackpad gesture is live, so the
            // row tracks the input 1:1. Once the gesture settles both
            // offsets return to 0 in the same update that commits the new
            // index, so the snap itself is animated.
            transition: isDragging || wheelOffset !== 0 ? "none" : "transform 0.5s cubic-bezier(.4,0,.2,1)",
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
              className={`tap-44 h-2 rounded-full transition-all duration-300 ${
                i === index ? "w-6 bg-mdn-green" : "w-2 bg-white/25 hover:bg-white/45"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
