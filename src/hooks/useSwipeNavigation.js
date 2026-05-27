import { useCallback, useRef } from "react";

const SWIPE_MIN_DISTANCE = 56;

export const useSwipeNavigation = ({ abas, abaAtual, onChange }) => {
  const swipeStartRef = useRef(null);
  const abaIndiceAtual = Math.max(abas.indexOf(abaAtual), 0);

  const handleSwipeStart = useCallback((event) => {
    if (event.target.closest("input, textarea, select, button, [data-no-swipe='true']")) {
      swipeStartRef.current = null;
      return;
    }

    const touch = event.touches?.[0];
    if (!touch) return;
    swipeStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  }, []);

  const handleSwipeEnd = useCallback(
    (event) => {
      const start = swipeStartRef.current;
      swipeStartRef.current = null;
      if (!start) return;

      const touch = event.changedTouches?.[0];
      if (!touch) return;

      const deltaX = touch.clientX - start.x;
      const deltaY = touch.clientY - start.y;
      const duration = Math.max(Date.now() - start.time, 1);
      const velocity = Math.abs(deltaX) / duration;
      const horizontalIntent = Math.abs(deltaX) > Math.abs(deltaY) * 1.35;
      const shouldSwipe =
        Math.abs(deltaX) >= SWIPE_MIN_DISTANCE || velocity > 0.42;

      if (!horizontalIntent || !shouldSwipe || Math.abs(deltaY) > 92) return;

      const nextIndex =
        deltaX < 0
          ? Math.min(abaIndiceAtual + 1, abas.length - 1)
          : Math.max(abaIndiceAtual - 1, 0);

      if (nextIndex !== abaIndiceAtual) {
        onChange(abas[nextIndex]);
      }
    },
    [abaIndiceAtual, abas, onChange],
  );

  return {
    handleSwipeStart,
    handleSwipeEnd,
  };
};
