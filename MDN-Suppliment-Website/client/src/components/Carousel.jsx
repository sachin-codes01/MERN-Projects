import { useCallback, useEffect, useRef, useState } from "react";
import SliderArrow from "./SliderArrow";

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
  const [index, setIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const dragStartX = useRef(0);
  const trackRef = useRef(null);
  const timerRef = useRef(null);
  const count = slides.length;

  const goTo = useCallback(
    (i) => setIndex(((i % count) + count) % count),
    [count]
  );

  const stopAutoplay = () => clearInterval(timerRef.current);
  const startAutoplay = useCallback(() => {
    stopAutoplay();
    if (autoPlay && count > 1) {
      timerRef.current = setInterval(() => {
        setIndex((i) => (i + 1) % count);
      }, interval);
    }
  }, [autoPlay, interval, count]);

  useEffect(() => {
    startAutoplay();
    return stopAutoplay;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startAutoplay]);

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
    if (dragOffset < -threshold) goTo(index + 1);
    else if (dragOffset > threshold) goTo(index - 1);
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
        style={{ cursor: count > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
      >
        <div
          className="flex items-start"
          style={{
            transform: `translateX(calc(-${index * 100}% + ${dragOffset}px))`,
            transition: isDragging ? "none" : "transform 0.6s cubic-bezier(.4,0,.2,1)",
          }}
        >
          {slides.map((slide, i) => (
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
                i === index ? "w-6 bg-mdn-green" : "w-2 bg-white/25 hover:bg-white/45"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
