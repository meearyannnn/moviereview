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
  const startYRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const velocityRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  // Wheel smooth scrolling target
  const wheelTargetRef = useRef<number | null>(null);
  const wheelRafRef = useRef<number | null>(null);

  // Update arrow states
  const updateScrollState = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
  }, []);

  // Cancel any running animations
  const cancelAnimations = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (wheelRafRef.current !== null) {
      cancelAnimationFrame(wheelRafRef.current);
      wheelRafRef.current = null;
    }
    wheelTargetRef.current = null;
  }, []);

  // Smooth programmatic scroll (aligned to whole cards)
  const scrollToDirection = useCallback(
    (direction: 'left' | 'right', customAmount?: number) => {
      const el = containerRef.current;
      if (!el) return;

      cancelAnimations();

      const clientWidth = el.clientWidth;

      // Calculate whole-card step so cards never get sliced in half
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
      const startPos = el.scrollLeft;
      const maxScroll = el.scrollWidth - clientWidth;
      const targetPos = Math.max(0, Math.min(maxScroll, startPos + targetDelta));

      if (Math.abs(targetPos - startPos) < 1) return;

      const duration = 350; // ms
      const startTime = performance.now();

      // Smooth ease-out cubic
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

      const stepAnimation = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(1, elapsed / duration);
        const easedProgress = easeOutCubic(progress);

        el.scrollLeft = startPos + (targetPos - startPos) * easedProgress;
        updateScrollState();

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(stepAnimation);
        } else {
          animationFrameRef.current = null;
          updateScrollState();
        }
      };

      animationFrameRef.current = requestAnimationFrame(stepAnimation);
    },
    [cancelAnimations, scrollStepRatio, updateScrollState]
  );

  // Drag Momentum Physics
  const applyMomentum = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    let v = velocityRef.current;
    if (Math.abs(v) < 0.2) return;

    const friction = 0.92;
    const maxScroll = el.scrollWidth - el.clientWidth;

    const momentumStep = () => {
      v *= friction;
      el.scrollLeft -= v;
      updateScrollState();

      if (Math.abs(v) > 0.4 && el.scrollLeft > 0 && el.scrollLeft < maxScroll) {
        animationFrameRef.current = requestAnimationFrame(momentumStep);
      } else {
        animationFrameRef.current = null;
        updateScrollState();
      }
    };

    animationFrameRef.current = requestAnimationFrame(momentumStep);
  }, [updateScrollState]);

  // Pointer Down
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!enableDrag) return;
      if (e.button !== 0) return; // Only primary mouse button

      const el = containerRef.current;
      if (!el) return;

      cancelAnimations();

      isPointerDownRef.current = true;
      isDraggingRef.current = false;
      dragOccurredRef.current = false;
      startXRef.current = e.clientX;
      startYRef.current = e.clientY;
      startScrollLeftRef.current = el.scrollLeft;
      lastXRef.current = e.clientX;
      lastTimeRef.current = performance.now();
      velocityRef.current = 0;
    },
    [enableDrag, cancelAnimations]
  );

  // Pointer Move
  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isPointerDownRef.current) return;
      const el = containerRef.current;
      if (!el) return;

      const deltaX = e.clientX - startXRef.current;
      const deltaY = e.clientY - startYRef.current;

      // Only enter drag mode if horizontal movement exceeds 10px and is greater than vertical movement
      if (!isDraggingRef.current) {
        if (Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY)) {
          isDraggingRef.current = true;
          dragOccurredRef.current = true;
          setIsDragging(true);
        } else {
          return;
        }
      }

      if (isDraggingRef.current) {
        el.scrollLeft = startScrollLeftRef.current - deltaX;

        const now = performance.now();
        const dt = now - lastTimeRef.current;
        if (dt > 10) {
          const dx = e.clientX - lastXRef.current;
          velocityRef.current = (dx / dt) * 16;
          lastXRef.current = e.clientX;
          lastTimeRef.current = now;
        }

        updateScrollState();
      }
    },
    [updateScrollState]
  );

  // Pointer Up
  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isPointerDownRef.current) return;
      isPointerDownRef.current = false;

      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);
        applyMomentum();

        // Keep dragOccurredRef true just long enough to cancel the immediate synthetic click
        setTimeout(() => {
          dragOccurredRef.current = false;
        }, 80);
      } else {
        dragOccurredRef.current = false;
        setIsDragging(false);
      }
    },
    [applyMomentum]
  );

  // Intercept click on children ONLY if an actual drag gesture occurred
  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (dragOccurredRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  // Smooth wheel support
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !enableWheel) return;

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        updateScrollState();
        return;
      }

      const maxScroll = el.scrollWidth - el.clientWidth;
      const isAtLeft = el.scrollLeft <= 2;
      const isAtRight = el.scrollLeft >= maxScroll - 2;

      if ((isAtLeft && e.deltaY < 0) || (isAtRight && e.deltaY > 0)) {
        return;
      }

      e.preventDefault();

      if (wheelTargetRef.current === null) {
        wheelTargetRef.current = el.scrollLeft;
      }

      const delta = e.deltaY * 1.2;
      wheelTargetRef.current = Math.max(
        0,
        Math.min(maxScroll, wheelTargetRef.current + delta)
      );

      if (wheelRafRef.current === null) {
        const smoothWheelStep = () => {
          if (!containerRef.current || wheelTargetRef.current === null) {
            wheelRafRef.current = null;
            return;
          }

          const current = containerRef.current.scrollLeft;
          const diff = wheelTargetRef.current - current;

          if (Math.abs(diff) < 0.5) {
            containerRef.current.scrollLeft = wheelTargetRef.current;
            wheelTargetRef.current = null;
            wheelRafRef.current = null;
            updateScrollState();
          } else {
            containerRef.current.scrollLeft += diff * 0.18;
            updateScrollState();
            wheelRafRef.current = requestAnimationFrame(smoothWheelStep);
          }
        };

        wheelRafRef.current = requestAnimationFrame(smoothWheelStep);
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      el.removeEventListener('wheel', handleWheel);
      if (wheelRafRef.current) cancelAnimationFrame(wheelRafRef.current);
    };
  }, [enableWheel, updateScrollState]);

  // Initial, resize and mutation observer updates
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    updateScrollState();
    const timer = setTimeout(updateScrollState, 150);

    const resizeObserver = new ResizeObserver(() => {
      updateScrollState();
    });
    resizeObserver.observe(el);

    const mutationObserver = new MutationObserver(() => {
      updateScrollState();
    });
    mutationObserver.observe(el, { childList: true, subtree: true });

    const handleResize = () => updateScrollState();
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      cancelAnimations();
    };
  }, [updateScrollState, cancelAnimations]);

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
