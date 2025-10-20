import { useEffect, useState } from "react";

export function useFitScale(containerRef, layoutW, layoutH) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!containerRef.current) return;
    const update = () => {
      const el = containerRef.current;
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      if (layoutW > 0 && layoutH > 0) {
        const s = Math.min(cw / layoutW, ch / layoutH, 1);
        setScale(Number.isFinite(s) ? s : 1);
      } else {
        setScale(1);
      }
    };
    const ro = new ResizeObserver(update);
    ro.observe(containerRef.current);
    update();
    return () => ro.disconnect();
  }, [containerRef, layoutW, layoutH]);

  return scale;
}
