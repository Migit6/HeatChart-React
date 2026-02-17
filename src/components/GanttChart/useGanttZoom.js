import { useState, useEffect, useCallback } from "react";

const MIN_DAY_WIDTH = 3;
const MAX_DAY_WIDTH = 20;
const DEFAULT_DAY_WIDTH = 7;

export default function useGanttZoom(containerRef) {
  const [dayWidth, setDayWidth] = useState(DEFAULT_DAY_WIDTH);

  const handleWheel = useCallback((e) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    setDayWidth((prev) => {
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const next = prev * factor;
      return Math.min(MAX_DAY_WIDTH, Math.max(MIN_DAY_WIDTH, next));
    });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [containerRef, handleWheel]);

  return dayWidth;
}
