import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { usePlatesStore } from "../../store/platesStore";
import { useImage } from "../../hooks/useImage";
import { useFitScale } from "../../hooks/useFitScale";

import ThumbnailStrip from "./ThumbnailStrip";
import ExportButton from "./ExportButton";
import SocketGuides from "./SocketGuides";

import motifUrl from "../../assets/motif_2.jpg";

// NEW: sockets for export
import { useSocketsStore } from "../../store/socketsStore";
import { groupSize } from "../../utils/socketGeometry";
import socketUrl from "../../assets/socket.webp";

/** Compute side-by-side layout (1 cm = 1 unit). */
function computeLayout(plates, gapLogical) {
  const xStarts = [];
  let acc = 0;
  plates.forEach((p, i) => {
    xStarts.push(acc);
    acc += p.width;
    if (i < plates.length - 1) acc += gapLogical;
  });
  const totalW = Math.max(1, acc);
  const maxH = Math.max(1, ...plates.map((p) => p.height || 1));
  return { totalW, maxH, xStarts };
}

export default function PlatePreview() {
  const { plates } = usePlatesStore();
  const { enabled: socketsEnabled, groups } = useSocketsStore(); // NEW

  // image strip (kept from your UI)
  const [images, setImages] = useState([motifUrl]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const currentSrc = images[currentIdx] || motifUrl;
  const img = useImage(currentSrc);

  const drawAreaRef = useRef(null);
  const canvasRef = useRef(null);

  // Convert a small pixel gap to logical cm so the space between plates is stable at any scale
  const probeScale = useFitScale(drawAreaRef, 100, 100);
  const gapLogical = plates.length > 1 ? 3 / Math.max(probeScale, 0.0001) : 0;

  const { totalW, maxH, xStarts } = useMemo(
    () => computeLayout(plates, gapLogical),
    [plates, gapLogical]
  );

  const layoutW = totalW;
  const layoutH = maxH;

  // Scale the whole layout to the available area
  const scale = useFitScale(
    drawAreaRef,
    Math.max(layoutW, 1),
    Math.max(layoutH, 1)
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !plates.length) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const cssW = layoutW * scale;
    const cssH = layoutH * scale;

    canvas.width = Math.max(1, Math.round(cssW * dpr));
    canvas.height = Math.max(1, Math.round(cssH * dpr));
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;

    const ctx = canvas.getContext("2d");
    // Use a simple y-up world: setTransform(scale,0,0,-scale,0,scale*layoutH)
    ctx.setTransform(dpr * scale, 0, 0, -dpr * scale, 0, dpr * scale * layoutH);

    // Clear world
    ctx.clearRect(0, 0, layoutW, layoutH);

    // ---- Compute one global image placement (COVER the whole layout) ----
    // So every plate sees the image from the same origin (continuous panorama).
    let iw = 0,
      ih = 0;
    if (img && img.complete) {
      iw = img.naturalWidth || img.width || 0;
      ih = img.naturalHeight || img.height || 0;
    }
    let dx = 0,
      dy = 0,
      dw = 0,
      dh = 0;
    if (iw > 0 && ih > 0) {
      const scaleCover = Math.max(layoutW / iw, layoutH / ih);
      dw = iw * scaleCover;
      dh = ih * scaleCover;
      // center within the layout (in world coords)
      dx = (layoutW - dw) / 2;
      dy = (layoutH - dh) / 2;
    }

    // ---- Draw plates with clipping (no borders) ----
    for (let i = 0; i < plates.length; i++) {
      const { width: w, height: h } = plates[i];
      const left = xStarts[i];
      const bottom = 0; // bottom aligned

      // Clip to plate rect
      ctx.save();
      ctx.beginPath();
      ctx.rect(left, bottom, w, h);
      ctx.clip();

      // Draw the shared image (same dx/dy for all plates) if available
      if (dw > 0 && dh > 0) {
        // drawImage is y-down; our world is y-up → flip locally
        ctx.save();
        ctx.scale(1, -1);
        if (img && img.complete) {
          ctx.drawImage(img, dx, -(dy + dh), dw, dh);
        }
        ctx.restore();
      }

      ctx.restore();
      // NOTE: No strokeRect → no borders around plates.
    }
  }, [img, plates, layoutW, layoutH, scale, xStarts]);

  // NEW: export that composites sockets too
  const handleExportPng = useCallback(async () => {
    const baseCanvas = canvasRef.current;
    if (!baseCanvas || !plates.length) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const cssW = layoutW * scale;
    const cssH = layoutH * scale;

    const off = document.createElement("canvas");
    off.width = Math.max(1, Math.round(cssW * dpr));
    off.height = Math.max(1, Math.round(cssH * dpr));
    off.style.width = `${cssW}px`;
    off.style.height = `${cssH}px`;

    const ctx = off.getContext("2d");
    // y-up world, same as your main draw
    ctx.setTransform(dpr * scale, 0, 0, -dpr * scale, 0, dpr * scale * layoutH);

    // ---- 1) Draw plates & shared image (same as effect) ----
    let iw = 0,
      ih = 0;
    if (img && img.complete) {
      iw = img.naturalWidth || img.width || 0;
      ih = img.naturalHeight || img.height || 0;
    }
    let dx = 0,
      dy = 0,
      dw = 0,
      dh = 0;
    if (iw > 0 && ih > 0) {
      const scaleCover = Math.max(layoutW / iw, layoutH / ih);
      dw = iw * scaleCover;
      dh = ih * scaleCover;
      dx = (layoutW - dw) / 2;
      dy = (layoutH - dh) / 2;
    }

    for (let i = 0; i < plates.length; i++) {
      const { width: w, height: h } = plates[i];
      const left = xStarts[i];
      const bottom = 0;

      ctx.save();
      ctx.beginPath();
      ctx.rect(left, bottom, w, h);
      ctx.clip();

      if (dw > 0 && dh > 0 && img && img.complete) {
        ctx.save();
        ctx.scale(1, -1);
        ctx.drawImage(img, dx, -(dy + dh), dw, dh);
        ctx.restore();
      }
      ctx.restore();
    }

    // ---- 2) Draw sockets onto the same offscreen canvas ----
    const SOCKET_SIZE_CM = 7;
    const GAP_CM = 0.2;
    const HALF = SOCKET_SIZE_CM / 2;

    // Load socket image
    const socketImg = new Image();
    socketImg.src = socketUrl;
    if (!socketImg.complete && socketImg.decode) {
      try {
        await socketImg.decode();
      } catch {
        /* ignore decode errors; we'll fallback to rects */
      }
    }

    if (socketsEnabled && groups.length) {
      for (const g of groups) {
        const pi = g.plateIndex;
        const plate = plates[pi];
        if (!plate) continue;

        const { w, h } = groupSize(g.count, g.dir); // footprint in cm
        const xEdge = g.x - HALF; // edge (world cm)
        const yEdge = g.y - HALF;
        const left = xStarts[pi] + xEdge; // world cm
        const bottom = yEdge;

        ctx.save();
        // helper to draw one socket 7x7 in world cm
        const drawOne = (x, y) => {
          if (socketImg.complete && socketImg.naturalWidth > 0) {
            ctx.save();
            ctx.scale(1, -1);
            ctx.drawImage(
              socketImg,
              x,
              -(y + SOCKET_SIZE_CM),
              SOCKET_SIZE_CM,
              SOCKET_SIZE_CM
            );
            ctx.restore();
          } else {
            ctx.fillStyle = "#111";
            ctx.fillRect(x, y, SOCKET_SIZE_CM, SOCKET_SIZE_CM);
          }
        };

        if (g.dir === "h") {
          for (let i = 0; i < g.count; i++) {
            const x = left + i * (SOCKET_SIZE_CM + GAP_CM);
            drawOne(x, bottom);
          }
        } else {
          for (let i = 0; i < g.count; i++) {
            const y = bottom + i * (SOCKET_SIZE_CM + GAP_CM);
            drawOne(left, y);
          }
        }
        ctx.restore();
      }
    }

    // ---- 3) Save PNG ----
    off.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const ts = new Date().toISOString().replace(/[:.]/g, "-");
      a.href = url;
      a.download = `plate-preview-${ts}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 800);
    }, "image/png");
  }, [img, plates, groups, socketsEnabled, layoutW, layoutH, scale, xStarts]);

  const empty = !plates.length;

  return (
    <div className="bg-gray-200 rounded-[20px] p-4 shadow-sm w-full h-full overflow-hidden flex flex-col">
      <div className="mb-3 flex items-center justify-end gap-2">
        <ExportButton onExport={handleExportPng} />
      </div>

      <div
        ref={drawAreaRef}
        className="flex-1 min-h-0 overflow-hidden flex items-center justify-center"
      >
        {empty ? (
          <div className="w-full h-full flex items-center justify-center">
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
            {/* Overlay uses the same layout + scale */}
            <SocketGuides
              plates={plates}
              layoutW={layoutW}
              layoutH={layoutH}
              xStarts={xStarts}
              gap={gapLogical}
              scale={scale}
            />
          </div>
        )}
      </div>

      <ThumbnailStrip
        images={images}
        current={currentIdx}
        onSelect={setCurrentIdx}
        onAdd={(url) => setImages((prev) => [...prev, url])}
        onRemove={(i) =>
          setImages((prev) => {
            if (prev.length <= 1) return prev;
            const removed = prev[i];
            const next = prev.filter((_, idx) => idx !== i);
            if (removed?.startsWith("blob:")) URL.revokeObjectURL(removed);
            if (i === currentIdx) {
              const ni = Math.max(0, Math.min(currentIdx, next.length - 1));
              setCurrentIdx(ni);
            } else if (i < currentIdx) {
              setCurrentIdx((c) => c - 1);
            }
            return next;
          })
        }
      />
    </div>
  );
}
