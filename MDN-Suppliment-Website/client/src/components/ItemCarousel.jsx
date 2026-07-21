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
  const [maxIndex, setMaxIndex] = useState(Math.max(0, items.length - 1));
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const timerRef = useRef(null);

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
    const visible = Math.max(1, Math.round((containerWidth + gap) / itemWidth));
    setMaxIndex(Math.max(0, items.length - visible));
  }, [items.length]);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

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

  const onPointerDown = (e) => {
    if (maxIndex <= 0) return;
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
    const threshold = stepPx * 0.25;
    if (dragOffset < -threshold) goTo(index + 1);
    else if (dragOffset > threshold) goTo(index - 1);
    setIsDragging(false);
    setDragOffset(0);
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
        style={{ cursor: maxIndex > 0 ? (isDragging ? "grabbing" : "grab") : "default" }}
      >
        <div
          ref={trackRef}
          className={`flex py-4 ${gapClassName}`}
          style={{
            transform: `translateX(calc(-${index * stepPx}px + ${dragOffset}px))`,
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
