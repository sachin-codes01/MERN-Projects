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

  const [position, setPosition] = useState(1);
  const [transitionOn, setTransitionOn] = useState(true);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const dragStartX = useRef(0);
  const trackRef = useRef(null);
  const timerRef = useRef(null);

  const realIndex = count > 1 ? (((position - 1) % count) + count) % count : 0;

  const stopAutoplay = () => clearInterval(timerRef.current);
  const startAutoplay = useCallback(() => {
    stopAutoplay();
    if (autoPlay && count > 1) {
      timerRef.current = setInterval(() => {
        setTransitionOn(true);
        setPosition((p) => p + 1);
      }, interval);
    }
  }, [autoPlay, interval, count]);

  useEffect(() => {
    startAutoplay();
    return stopAutoplay;
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

  const next = () => {
    setTransitionOn(true);
    setPosition((p) => p + 1);
  };
  const prev = () => {
    setTransitionOn(true);
    setPosition((p) => p - 1);
  };
  const goTo = (i) => {
    setTransitionOn(true);
    setPosition((((i % count) + count) % count) + 1);
  };

  const onPointerDown = (e) => {
    if (count <= 1) return;
    setIsDragging(true);
    dragStartX.current = e.clientX;
    stopAutoplay();
    trackRef.current?.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!isDragging) return;
    setDragOffset(e.clientX - dragStartX.current);
  };

  const endDrag = () => {
    if (!isDragging) return;
    const width = trackRef.current?.offsetWidth || 1;
    const threshold = width * 0.12;
    if (dragOffset < -threshold) next();
    else if (dragOffset > threshold) prev();
    setIsDragging(false);
    setDragOffset(0);
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
        className="relative overflow-hidden"
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
          className="flex items-start"
          onTransitionEnd={handleTransitionEnd}
          style={{
            transform: `translateX(calc(-${position * 100}% + ${dragOffset}px))`,
            transition:
              isDragging || !transitionOn ? "none" : `transform ${TRANSITION_MS}ms cubic-bezier(.4,0,.2,1)`,
          }}
        >
          {extended.map((slide, i) => (
            <div key={i} className={`w-full flex-shrink-0 ${slideClassName}`}>
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
        <div className="mt-5 flex justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                goTo(i);
                startAutoplay();
              }}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === realIndex ? "w-6 bg-mdn-green" : "w-2 bg-white/25 hover:bg-white/45"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
