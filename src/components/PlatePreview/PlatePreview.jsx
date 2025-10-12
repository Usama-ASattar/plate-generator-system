import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import motifUrl from "../../assets/motif.jpg";
import { usePlatesStore } from "../../store/platesStore";

import { TILE_CM } from "./constants";
import { useFitScale } from "./hooks/useFitScale";
import { computeTotals } from "./utils/geometry";
import { drawPlates } from "./utils/draw";

import { useImage } from "../../hooks/useImage";

import ThumbnailStrip from "./ThumbnailStrip";
import ExportButton from "./ExportButton";

export default function PlatePreview() {
  const { plates } = usePlatesStore();

  const [images, setImages] = useState([motifUrl]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const currentSrc = images[currentIdx] || motifUrl;

  useEffect(() => {
    return () => {
      images.forEach((src) => {
        if (src.startsWith("blob:")) URL.revokeObjectURL(src);
      });
    };
  }, [images]);

  const containerRef = useRef(null);
  const drawAreaRef = useRef(null);
  const canvasRef = useRef(null);

  const img = useImage(currentSrc);

  // totals in logical units, 1 cm equals 1 px
  const totals = useMemo(() => computeTotals(plates), [plates]);
  const { totalW, maxH, xStarts } = totals;
  const n = plates?.length || 0;

  // keep a small constant visual gap in CSS pixels, then convert to logical
  const GAP_CSS_PX = 3;
  const scaleGuess = useFitScale(drawAreaRef, totalW || 1, maxH || 1);
  const gapLogical = n > 1 ? GAP_CSS_PX / Math.max(scaleGuess, 0.0001) : 0;

  // final layout including the screen gap
  const layoutW = totalW + gapLogical * Math.max(n - 1, 0);
  const layoutH = maxH;

  // final scale for the canvas
  const scale = useFitScale(drawAreaRef, layoutW || 1, layoutH || 1);

  // draw with helpers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img || !plates?.length) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(layoutW * scale * dpr));
    canvas.height = Math.max(1, Math.round(layoutH * scale * dpr));

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);

    drawPlates(
      ctx,
      img,
      plates,
      { totalW, xStarts },
      {
        layoutW,
        layoutH,
        gap: gapLogical,
        tileCm: TILE_CM,
      }
    );
  }, [img, plates, xStarts, layoutW, layoutH, totalW, scale, gapLogical]);

  const empty = !plates?.length;

  // gallery handlers
  const handleAdd = (url) => setImages((prev) => [...prev, url]);

  const handleRemove = (index) => {
    setImages((prev) => {
      if (prev.length <= 1) return prev;
      const removed = prev[index];
      const next = prev.filter((_, i) => i !== index);

      if (removed?.startsWith("blob:")) URL.revokeObjectURL(removed);

      setCurrentIdx((ci) => {
        if (index === ci) return Math.max(0, Math.min(ci, next.length - 1));
        if (index < ci) return ci - 1;
        return ci;
      });

      return next;
    });
  };

  // export as PNG
  const handleExportPng = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const ts = new Date().toISOString().replace(/[:.]/g, "-");
      a.href = url;
      a.download = `plate-preview-${ts}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  }, []);

  return (
    <div
      ref={containerRef}
      className="bg-gray-200 rounded-[20px] p-4 shadow-sm w-full h-full overflow-hidden flex flex-col"
    >
      <div className="mb-3 flex items-center justify-end gap-2">
        <ExportButton onExport={handleExportPng} />
      </div>

      <div
        ref={drawAreaRef}
        className="flex-1 min-h-0 overflow-hidden flex items-center justify-center"
      >
        {empty ? (
          <div className="w-full h-full min-h=[200px] flex items-center justify-center">
            <p className="text-gray-600 text-sm">
              Add plates to see the preview
            </p>
          </div>
        ) : (
          <div
            style={{
              width: `${layoutW * scale}px`,
              height: `${layoutH * scale}px`,
              position: "relative",
            }}
          >
            <canvas
              ref={canvasRef}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: `${layoutW * scale}px`,
                height: `${layoutH * scale}px`,
              }}
            />
          </div>
        )}
      </div>

      <ThumbnailStrip
        images={images}
        current={currentIdx}
        onSelect={setCurrentIdx}
        onAdd={handleAdd}
        onRemove={handleRemove}
      />
    </div>
  );
}
