import { useCallback, useEffect, useRef, useState } from "react";
import SliderArrow from "./SliderArrow";

const TRANSITION_MS = 600;

/**
 * Generic carousel: autoplay (optional), full-height-rectangle arrow
 * buttons, dot navigation, and mouse/touch "grab and drag" swiping (via
 * Pointer Events, so it works for mouse, touch, and pen with the same
 * code path).
 *
 * `slides` is an array of already-built React nodes — one node per
 * slide. Callers decide what a "slide" contains (a single image, a
 * grid of 4 product cards, a row of badges, etc).
 */
export default function Carousel({
  slides,
  autoPlay = true,
  interval = 4000,
  showArrows = true,
  showDots = true,
  dotsPosition = "below", // "below" (default, adds space under the track) | "overlay" (floats over the bottom of the slide)
  pauseOnHover = true,
  className = "",
  slideClassName = "",
}) {
  const count = slides.length;

  // Seamless infinite loop: a clone of the last slide is prepended and a
  // clone of the first slide is appended. `position` 1..count maps 1:1 to
  // real slide 0..count-1; positions 0 and count+1 are those clone
  // frames — used only to animate *through* the loop seam. Once a
  // transition that lands on a clone finishes, we silently snap
  // (transition switched off for one frame) to the matching real
  // position, which looks identical to the clone it replaces — so the
  // carousel appears to keep sliding forward instead of jumping
  // backward from last to first.
  const extended = count > 1 ? [slides[count - 1], ...slides, slides[0]] : slides;

  // With a single slide there's no clone padding in `extended` (it's just
  // `[slide]`, index 0) — starting at position 1 like the multi-slide case
  // does would translateX(-100%) and push that one slide fully off-screen,
  // rendering blank. Position 0 is the only valid index here.
  const [position, setPosition] = useState(count > 1 ? 1 : 0);
  const [transitionOn, setTransitionOn] = useState(true);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const dragStartX = useRef(0);
  const trackRef = useRef(null);
  const timerRef = useRef(null);
  const pointerIdRef = useRef(null);
  const capturedRef = useRef(false);

  // Minimum horizontal travel, in px, before a pointer-down is treated as a
  // drag rather than a click/tap on a slide.
  const DRAG_THRESHOLD = 6;

  // Guards against stacking more than one move at a time. Without this,
  // spamming the arrow (or an autoplay tick landing before the previous
  // move's wraparound snap has resolved — e.g. after the tab was
  // backgrounded and a `transitionend` got missed) lets `position` walk
  // past the extended slide array's real bounds (0..count+1), which
  // renders as a blank/white frame since nothing is painted there.
  const isAnimatingRef = useRef(false);
  const animationLockTimeoutRef = useRef(null);

  const clearAnimationLock = () => {
    isAnimatingRef.current = false;
    clearTimeout(animationLockTimeoutRef.current);
  };

  // Fallback safety net for a `transitionend` that never fires (tab
  // backgrounded mid-animation, a dropped frame under load, etc). The
  // normal snap happens in `handleTransitionEnd`; if that never runs,
  // `position` is left sitting on a clone frame (0 or count+1) with
  // nothing to reset it — the NEXT move then walks `position` past the
  // extended array's real bounds and renders a blank frame there (the
  // exact bug this file's other comments already call out). Scheduled via
  // setTimeout instead of relying on the closure's `position`, so it
  // always snaps off whatever the CURRENT value turns out to be — using
  // the functional form of setPosition rather than the stale value
  // captured when the timeout was scheduled.
  const scheduleAnimationLock = () => {
    animationLockTimeoutRef.current = setTimeout(() => {
      isAnimatingRef.current = false;
      setPosition((p) => {
        if (p === count + 1) {
          setTransitionOn(false);
          return 1;
        }
        if (p === 0) {
          setTransitionOn(false);
          return count;
        }
        return p;
      });
    }, TRANSITION_MS + 150);
  };

  const realIndex = count > 1 ? (((position - 1) % count) + count) % count : 0;
  // Hard safety net: even if some other edge case leaves `position`
  // outside the extended array's valid range, the rendered transform
  // never reads past it — worst case it holds on the nearest clone frame
  // instead of sliding into the empty space beyond the last rendered slide.
  const clampedPosition = Math.min(Math.max(position, 0), count + 1);

  const stopAutoplay = () => clearInterval(timerRef.current);
  const startAutoplay = useCallback(() => {
    stopAutoplay();
    if (autoPlay && count > 1) {
      timerRef.current = setInterval(() => {
        if (isAnimatingRef.current) return; // previous move hasn't settled yet — skip this tick
        isAnimatingRef.current = true;
        setTransitionOn(true);
        setPosition((p) => p + 1);
        scheduleAnimationLock();
      }, interval);
    }
  }, [autoPlay, interval, count]);

  useEffect(() => {
    startAutoplay();
    return () => {
      stopAutoplay();
      clearTimeout(animationLockTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startAutoplay]);

  // Landed on a clone frame (the seam) — snap invisibly to the matching
  // real position once the transition that got us there finishes.
  const handleTransitionEnd = (e) => {
    if (e.target !== e.currentTarget || e.propertyName !== "transform") return;
    if (position === count + 1) {
      setTransitionOn(false);
      setPosition(1);
    } else if (position === 0) {
      setTransitionOn(false);
      setPosition(count);
    }
    clearAnimationLock();
  };

  // Two animation frames after a silent snap, switch the transition back
  // on so the NEXT real move animates again — one frame isn't always
  // enough to guarantee the browser painted the snapped position first.
  useEffect(() => {
    if (transitionOn) return;
    let raf2;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setTransitionOn(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [transitionOn]);

  // Shared entry point for any move that isn't the raw drag-follow — caps
  // navigation to one move at a time so `position` can never be pushed
  // past the extended array's real bounds. `updater` is whatever
  // `setPosition` would normally take (function or absolute value).
  const move = (updater) => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setTransitionOn(true);
    setPosition(updater);
    scheduleAnimationLock();
  };

  const next = () => move((p) => p + 1);
  const prev = () => move((p) => p - 1);
  const goTo = (i) => move((((i % count) + count) % count) + 1);

  const onPointerDown = (e) => {
    if (count <= 1) return;
    // Deliberately NOT calling setPointerCapture here — see ItemCarousel.jsx
    // for the full explanation. Capturing on every pointerdown retargets the
    // click that follows a plain tap (e.g. on a link inside a slide) away
    // from its real target, silently swallowing it. Capture is deferred to
    // onPointerMove, once real drag movement crosses DRAG_THRESHOLD.
    dragStartX.current = e.clientX;
    pointerIdRef.current = e.pointerId;
    capturedRef.current = false;
    stopAutoplay();
  };

  const onPointerMove = (e) => {
    if (pointerIdRef.current === null) return;
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
      const width = trackRef.current?.offsetWidth || 1;
      const threshold = width * 0.12;
      if (dragOffset < -threshold) next();
      else if (dragOffset > threshold) prev();
      setIsDragging(false);
      setDragOffset(0);
    }
    startAutoplay();
  };

  return (
    <div
      className={`relative select-none ${className}`}
      onMouseEnter={() => pauseOnHover && stopAutoplay()}
      onMouseLeave={() => pauseOnHover && !isDragging && startAutoplay()}
    >
      {/* `relative` + `overflow-hidden` live on THIS wrapper (not the
          outer one) so the full-height arrow rectangles size themselves
          to exactly the slide area — not the slide area + dots below. */}
      <div
        ref={trackRef}
        className="relative h-full overflow-hidden"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerCancel={endDrag}
        style={{
          cursor: count > 1 ? (isDragging ? "grabbing" : "grab") : "default",
          // Without this, touch browsers treat any swipe with even a
          // slight vertical drift as a page-scroll gesture and cancel the
          // pointer sequence mid-drag — which is why swiping only "worked"
          // some of the time. `pan-y` tells the browser to keep native
          // vertical scroll but hand horizontal movement to this handler.
          touchAction: "pan-y",
        }}
      >
        <div
          className="flex h-full items-start"
          onTransitionEnd={handleTransitionEnd}
          style={{
            transform: `translateX(calc(-${clampedPosition * 100}% + ${dragOffset}px))`,
            transition:
              isDragging || !transitionOn ? "none" : `transform ${TRANSITION_MS}ms cubic-bezier(.4,0,.2,1)`,
          }}
        >
          {extended.map((slide, i) => (
            <div key={i} className={`h-full w-full flex-shrink-0 ${slideClassName}`}>
              {slide}
            </div>
          ))}
        </div>

        {showArrows && count > 1 && (
          <>
            <SliderArrow
              direction="left"
              onClick={() => {
                prev();
                startAutoplay();
              }}
            />
            <SliderArrow
              direction="right"
              onClick={() => {
                next();
                startAutoplay();
              }}
            />
          </>
        )}
      </div>

      {showDots && count > 1 && (
        <div
          className={
            dotsPosition === "overlay"
              ? "absolute inset-x-0 bottom-3 z-20 flex justify-center gap-1.5 drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]"
              : "mt-5 flex justify-center gap-2"
          }
        >
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                goTo(i);
                startAutoplay();
              }}
              aria-label={`Go to slide ${i + 1}`}
              className={
                dotsPosition === "overlay"
                  ? `h-1 rounded-full transition-all duration-300 ${
                      i === realIndex ? "w-4 bg-mdn-green" : "w-1 bg-white/60 hover:bg-white/85"
                    }`
                  : `h-2 rounded-full transition-all duration-300 ${
                      i === realIndex ? "w-6 bg-mdn-green" : "w-2 bg-white/25 hover:bg-white/45"
                    }`
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
