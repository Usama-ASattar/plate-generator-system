import React, { useMemo } from "react";
import { useSocketsStore, updateGroup } from "../../store/socketsStore";
import { validatePlacement, groupSize } from "../../utils/socketGeometry";
import { useUnitStore } from "../../features/units/unitStore";
import { toInches } from "../../utils/utils";
import useDragGroup from "../../hooks/useDragGroup";

import SOCKET_IMG_FILE from "../../assets/socket.webp";

const SOCKET_SIZE_CM = 7; // each socket: 7x7 cm
const GAP_CM = 0.2; // between sockets
const EDGE_MIN_CM = 3; // 3 cm from edges minimum
const HALF = SOCKET_SIZE_CM / 2;

export default function SocketGuides({
  plates,
  layoutW,
  layoutH,
  xStarts,
  scale,
}) {
  const { enabled, groups } = useSocketsStore();
  const { unit } = useUnitStore();

  // helpers
  const cmToPx = (cm) => cm * scale;
  // screen y grows downward; our bottom grows upward → invert dy when converting
  const pxToCm = (dxPx, dyPx) => ({ dxCm: dxPx / scale, dyCm: -dyPx / scale });

  // Precompute per-plate pixel rects for convenience
  const plateRects = useMemo(() => {
    return plates.map((p, i) => ({
      leftPx: cmToPx(xStarts[i]),
      bottomPx: 0,
      widthPx: cmToPx(p.width),
      heightPx: cmToPx(p.height),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plates, xStarts, scale]);

  const label = (cm) =>
    unit === "cm" ? `${cm.toFixed(1)} cm` : `${toInches(cm).toFixed(2)} in`;

  if (!enabled || groups.length === 0) {
    // Still keep the overlay div so stacking context remains the same
    return (
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          width: `${layoutW * scale}px`,
          height: `${layoutH * scale}px`,
          top: 0,
          left: 0,
        }}
      />
    );
  }

  return (
    <div
      className="absolute inset-0"
      style={{
        width: `${layoutW * scale}px`,
        height: `${layoutH * scale}px`,
        top: 0,
        left: 0,
      }}
    >
      {/* Render groups */}
      {groups.map((g) => {
        const pi = g.plateIndex;
        const plate = plates[pi];
        if (!plate) return null;

        // Group footprint (cm)
        const { w, h } = groupSize(g.count, g.dir);

        // Store uses anchor (bottom-left center of first socket).
        // Our draggable UI shows EDGE distances:
        const xEdge = g.x - HALF;
        const yEdge = g.y - HALF;

        // Position the group container in px
        const leftPx = cmToPx(xStarts[pi] + xEdge);
        const bottomPx = cmToPx(yEdge);
        const widthPx = cmToPx(w);
        const heightPx = cmToPx(h);

        const plateRect = plateRects[pi];
        const socketSizePx = cmToPx(SOCKET_SIZE_CM);
        const gapPx = cmToPx(GAP_CM);

        return (
          <DraggableGroup
            key={g.id}
            g={g}
            plates={plates}
            groups={groups}
            plateIndex={pi}
            cmToPx={cmToPx}
            pxToCm={pxToCm}
            // placement
            leftPx={leftPx}
            bottomPx={bottomPx}
            widthPx={widthPx}
            heightPx={heightPx}
            // for guidelines only
            plateLeftPx={plateRect.leftPx}
            plateBottomPx={plateRect.bottomPx}
            plateWidthPx={plateRect.widthPx}
            plateHeightPx={plateRect.heightPx}
            // assets
            socketImg={SOCKET_IMG_FILE}
            socketSizePx={socketSizePx}
            gapPx={gapPx}
            // labels
            unitLabelFn={label}
          />
        );
      })}
    </div>
  );
}

/* ---------------- internal: one draggable group ---------------- */

function DraggableGroup({
  g,
  plates,
  groups,
  plateIndex,
  cmToPx,
  pxToCm,
  leftPx,
  bottomPx,
  widthPx,
  heightPx,
  plateLeftPx,
  plateBottomPx,
  socketImg,
  socketSizePx,
  gapPx,
  unitLabelFn,
}) {
  // Build a validator/committer for the drag hook
  const tryCommit = ({ xEdge, yEdge }) => {
    const plate = plates[g.plateIndex];
    if (!plate || g.plateIndex !== plateIndex) {
      // cross-plate dragging is not allowed
      return { ok: false };
    }

    // Footprint in cm (use pixel width converted by scale ratio)
    const wcm = (widthPx / socketSizePx) * 7;
    const hcm = (heightPx / socketSizePx) * 7;

    const maxX = plate.width - EDGE_MIN_CM - wcm;
    const maxY = plate.height - EDGE_MIN_CM - hcm;

    let xE = Math.max(EDGE_MIN_CM, Math.min(maxX, xEdge));
    let yE = Math.max(EDGE_MIN_CM, Math.min(maxY, yEdge));

    // Convert to ANCHOR for the store model
    const anchor = { x: xE + HALF, y: yE + HALF };

    // full validation (edges, overlaps, ≥4cm spacing)
    const idx = groups.findIndex((gg) => gg.id === g.id);
    const verdict = validatePlacement(groups, idx, plate, { ...g, ...anchor });
    if (!verdict.ok) return { ok: false };

    updateGroup(g.id, anchor);
    return { ok: true };
  };

  // Drag controller: we start from EDGE distances (anchor - 3.5 cm)
  const drag = useDragGroup({
    pxToCm,
    getStartCm: () => ({ x: g.x - HALF, y: g.y - HALF }),
    tryCommit,
  });

  return (
    <div className="absolute" style={{ left: leftPx, bottom: bottomPx }}>
      <div
        {...drag.handlers}
        className="relative"
        style={{
          width: widthPx,
          height: heightPx,
          touchAction: "none",
          cursor: "grab",
        }}
      >
        {/* sockets as images (unchanged visuals) */}
        {g.dir === "h" ? (
          <div
            className="absolute left-0 bottom-0 flex items-end"
            style={{ gap: gapPx }}
          >
            {Array.from({ length: g.count }).map((_, i) => (
              <img
                key={i}
                src={socketImg}
                alt=""
                draggable={false}
                className="pointer-events-none select-none"
                style={{ width: socketSizePx, height: socketSizePx }}
              />
            ))}
          </div>
        ) : (
          <div
            className="absolute left-0 bottom-0 flex flex-col justify-end"
            style={{ gap: gapPx }}
          >
            {Array.from({ length: g.count }).map((_, i) => (
              <img
                key={i}
                src={socketImg}
                alt=""
                draggable={false}
                className="pointer-events-none select-none"
                style={{ width: socketSizePx, height: socketSizePx }}
              />
            ))}
          </div>
        )}

        {/* selection ring while dragging */}
        {drag.ui.active && (
          <div
            className={`absolute inset-0 rounded-md pointer-events-none ${
              drag.ui.invalid
                ? "ring-2 ring-red-400"
                : "ring-2 ring-emerald-400"
            }`}
          />
        )}

        {/* guidelines (from left and bottom edges of the *plate*) */}
        {drag.ui.active && (
          <>
            {/* left guideline */}
            <div
              className={`absolute h-0.5 ${
                drag.ui.invalid ? "bg-red-400" : "bg-emerald-400"
              }`}
              style={{
                left: -(leftPx - plateLeftPx),
                bottom: 0,
                width: cmToPx(drag.ui.xEdge),
              }}
            />
            <div
              className={`absolute w-16 flex justify-center bottom-1 -translate-x-1/2 px-1 py-0.5 text-[11px] rounded ${
                drag.ui.invalid
                  ? "bg-red-400 text-white"
                  : "bg-emerald-400 text-white"
              }`}
              style={{ left: "-50px", bottom: "5px" }}
            >
              {unitLabelFn(drag.ui.xEdge)}
            </div>

            {/* bottom guideline */}
            <div
              className={`absolute w-0.5 ${
                drag.ui.invalid ? "bg-red-400" : "bg-emerald-400"
              }`}
              style={{
                left: 0,
                bottom: -(bottomPx - plateBottomPx),
                height: cmToPx(drag.ui.yEdge),
              }}
            />
            <div
              className={`absolute flex justify-center w-16 left-0 -translate-y-1/2 px-1 py-0.5 text-[11px] rounded ${
                drag.ui.invalid
                  ? "bg-red-400 text-white"
                  : "bg-emerald-400 text-white"
              }`}
              style={{
                bottom: "-60px",
                left: "5px",
              }}
            >
              {unitLabelFn(drag.ui.yEdge)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
