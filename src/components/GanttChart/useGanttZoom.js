import { useState, useEffect, useCallback } from "react";

const MIN_COL_WIDTH = 20;
const MAX_COL_WIDTH = 120;
const DEFAULT_COL_WIDTH = 48;
const ZOOM_STEP = 4;

export default function useGanttZoom(containerRef) {
  const [colWidth, setColWidth] = useState(DEFAULT_COL_WIDTH);

  const handleWheel = useCallback((e) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    setColWidth((prev) => {
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      return Math.min(MAX_COL_WIDTH, Math.max(MIN_COL_WIDTH, prev + delta));
    });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [containerRef, handleWheel]);

  return colWidth;
}
