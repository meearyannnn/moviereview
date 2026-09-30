// src/hooks/useSmoothScroll.ts — High-Performance, Glitch-Free Carousel Scroll Hook
import { useRef, useState, useEffect, useCallback } from 'react';

interface UseSmoothScrollOptions {
  enableWheel?: boolean;
  enableDrag?: boolean;
  scrollStepRatio?: number;
}

export function useSmoothScroll<T extends HTMLElement = HTMLDivElement>(
  options: UseSmoothScrollOptions = {}
) {
  const {
    enableWheel = true,
    enableDrag = true,
    scrollStepRatio = 0.75,
  } = options;

  const containerRef = useRef<T | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Drag state refs
  const isPointerDownRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragOccurredRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);

  // Efficient scroll state updater (only triggers React re-render when boolean state actually changes)
  const updateScrollState = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const canLeft = scrollLeft > 8;
    const canRight = scrollLeft < scrollWidth - clientWidth - 8;

    setCanScrollLeft((prev) => (prev !== canLeft ? canLeft : prev));
    setCanScrollRight((prev) => (prev !== canRight ? canRight : prev));
  }, []);

  // Native hardware-accelerated smooth scrolling for Prev / Next arrows
  const scrollToDirection = useCallback(
    (direction: 'left' | 'right', customAmount?: number) => {
      const el = containerRef.current;
      if (!el) return;

      const clientWidth = el.clientWidth;
      let step = customAmount;

      if (!step) {
        const firstCard = el.querySelector(':scope > *') as HTMLElement | null;
        if (firstCard) {
          const cardWidth = firstCard.offsetWidth;
          const gap = 16;
          const cardStep = cardWidth + gap;
          const visibleCards = Math.max(1, Math.floor((clientWidth + gap) / cardStep));
          step = visibleCards * cardStep;
        } else {
          step = clientWidth * scrollStepRatio;
        }
      }

      const targetDelta = direction === 'left' ? -step : step;
      const maxScroll = el.scrollWidth - clientWidth;
      const targetPos = Math.max(0, Math.min(maxScroll, el.scrollLeft + targetDelta));

      // Use native smooth scrolling (GPU compositor-accelerated, 60–120fps)
      el.scrollTo({
        left: targetPos,
        behavior: 'smooth',
      });
    },
    [scrollStepRatio]
  );

  // Mouse drag handling (only for desktop mouse pointers, leaves touch to native hardware scroll)
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!enableDrag) return;
      // Only drag on primary mouse button, ignore touch events so mobile kinetic scroll is 100% native
      if (e.pointerType !== 'mouse' || e.button !== 0) return;

      const el = containerRef.current;
      if (!el) return;

      isPointerDownRef.current = true;
      isDraggingRef.current = false;
      dragOccurredRef.current = false;
      startXRef.current = e.clientX;
      startScrollLeftRef.current = el.scrollLeft;
    },
    [enableDrag]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isPointerDownRef.current || e.pointerType !== 'mouse') return;
      const el = containerRef.current;
      if (!el) return;

      const deltaX = e.clientX - startXRef.current;

      // Threshold before initiating drag to allow clean clicks
      if (!isDraggingRef.current) {
        if (Math.abs(deltaX) > 6) {
          isDraggingRef.current = true;
          dragOccurredRef.current = true;
          setIsDragging(true);
          try {
            el.setPointerCapture(e.pointerId);
          } catch {
            // Safe fallback if pointer capture fails
          }
        } else {
          return;
        }
      }

      if (isDraggingRef.current) {
        el.scrollLeft = startScrollLeftRef.current - deltaX;
      }
    },
    []
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isPointerDownRef.current || e.pointerType !== 'mouse') return;
      isPointerDownRef.current = false;

      const el = containerRef.current;
      if (el && isDraggingRef.current) {
        try {
          if (el.hasPointerCapture(e.pointerId)) {
            el.releasePointerCapture(e.pointerId);
          }
        } catch {
          // Safe fallback
        }
      }

      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);

        // Keep dragOccurredRef true briefly to prevent firing click event on the dragged card
        setTimeout(() => {
          dragOccurredRef.current = false;
        }, 50);
      } else {
        dragOccurredRef.current = false;
        setIsDragging(false);
      }
    },
    []
  );

  // Intercept click on children ONLY if a drag action was performed
  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (dragOccurredRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  // Optimized scroll and wheel event listeners
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Passive scroll listener for smooth button updates
    const handleScroll = () => {
      if (rafIdRef.current !== null) return;
      rafIdRef.current = requestAnimationFrame(() => {
        updateScrollState();
        rafIdRef.current = null;
      });
    };

    el.addEventListener('scroll', handleScroll, { passive: true });

    // Wheel event handler:
    // CRITICAL: NEVER hijack vertical page scrolling (deltaY) when user is scrolling the webpage!
    // Only scroll horizontally if user is explicitly holding Shift or trackpad has horizontal swipe.
    const handleWheel = (e: WheelEvent) => {
      if (!enableWheel) return;

      // If user holds Shift, allow smooth horizontal scroll
      if (e.shiftKey) {
        e.preventDefault();
        el.scrollLeft += e.deltaY || e.deltaX;
        return;
      }

      // If trackpad has native horizontal gesture (deltaX > deltaY), let it scroll horizontally
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        // Native horizontal trackpad scrolling, no preventDefault needed
        return;
      }

      // Otherwise: PURE VERTICAL SCROLL. DO NOT INTERCEPT!
      // Let the page scroll normally without any jumping or trapping!
    };

    el.addEventListener('wheel', handleWheel, { passive: false });

    // Initial state check
    updateScrollState();
    const timeout = setTimeout(updateScrollState, 150);

    // Resize observer for container dimensions
    const resizeObserver = new ResizeObserver(() => {
      updateScrollState();
    });
    resizeObserver.observe(el);

    return () => {
      clearTimeout(timeout);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      el.removeEventListener('scroll', handleScroll);
      el.removeEventListener('wheel', handleWheel);
      resizeObserver.disconnect();
    };
  }, [enableWheel, updateScrollState]);

  return {
    containerRef,
    canScrollLeft,
    canScrollRight,
    isDragging,
    scrollToDirection,
    updateScrollState,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onClickCapture,
    },
  };
}
