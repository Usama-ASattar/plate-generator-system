import { useCallback, useRef, useState } from "react";

export default function useDragGroup({ pxToCm, getStartCm, tryCommit }) {
  const draggingRef = useRef(false);
  const startPxRef = useRef({ x: 0, y: 0 });
  const startCmRef = useRef({ x: 0, y: 0 });

  const [ui, setUi] = useState({
    active: false,
    xEdge: 0,
    yEdge: 0,
    invalid: false,
  });

  const onPointerDown = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.setPointerCapture?.(e.pointerId);

      draggingRef.current = true;
      startPxRef.current = { x: e.clientX, y: e.clientY };
      const s = getStartCm();
      startCmRef.current = { x: s.x, y: s.y };

      setUi({ active: true, xEdge: s.x, yEdge: s.y, invalid: false });
    },
    [getStartCm]
  );

  const onPointerMove = useCallback(
    (e) => {
      if (!draggingRef.current) return;
      e.preventDefault();
      e.stopPropagation();

      const dxPx = e.clientX - startPxRef.current.x;
      const dyPx = e.clientY - startPxRef.current.y;

      const { dxCm, dyCm } = pxToCm(dxPx, dyPx);
      const cand = {
        xEdge: startCmRef.current.x + dxCm,
        yEdge: startCmRef.current.y + dyCm,
      };

      const verdict = tryCommit(cand);
      setUi({
        active: true,
        xEdge: cand.xEdge,
        yEdge: cand.yEdge,
        invalid: verdict?.ok === false,
      });
    },
    [pxToCm, tryCommit]
  );

  const onPointerUp = useCallback((e) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setUi((s) => ({ ...s, active: false, invalid: false }));

    // Safely release pointer capture if supported & currently held
    const el = e.currentTarget;
    const id = e.pointerId;
    if (el?.hasPointerCapture?.(id)) {
      el.releasePointerCapture(id);
    }
  }, []);

  return {
    ui,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onTouchStart: (e) => e.preventDefault(), // avoid page scroll during drag
    },
  };
}
