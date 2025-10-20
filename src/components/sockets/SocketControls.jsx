import { useEffect, useMemo, useState } from "react";
import { usePlatesStore } from "../../store/platesStore";
import {
  useSocketsStore,
  setEnabled,
  addGroupOn,
  removeGroup,
  updateGroup,
  setError,
} from "../../store/socketsStore";
import {
  plateIsEligible,
  validatePlacement,
  groupSize,
} from "../../utils/socketGeometry";
import { useUnitStore } from "../../features/units/unitStore";
import { fmt, toInches, toCm } from "../../utils/utils";

import SectionHeading from "./SectionHeading";
import SocketsHeader from "./SocketsHeader";
import GroupCard from "./GroupCard";

const SOCKET_SIZE = 7; // cm
const HALF = SOCKET_SIZE / 2; // 3.5
const MIN_EDGE_CM = 3;
const SOCKET_PRICE_EUR = 20; // € per socket
const nfEUR = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

export default function SocketControls() {
  const { plates } = usePlatesStore();
  const { enabled, groups, error } = useSocketsStore();
  const { unit } = useUnitStore();

  const [activeId, setActiveId] = useState(null);
  const [drafts, setDrafts] = useState({}); // { [gid]: { x, y } } edge values shown
  const [fieldErrors, setFieldErrors] = useState({}); // { [gid]: { x?, y? } }
  const [menuOpenId, setMenuOpenId] = useState(null);

  // Close kebab menu on outside click / ESC
  useEffect(() => {
    const close = () => setMenuOpenId(null);
    const onKey = (e) => e.key === "Escape" && close();
    document.addEventListener("click", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const eligibleIdx = useMemo(
    () =>
      plates
        .map((p, i) => (plateIsEligible(p) ? i : null))
        .filter((v) => v !== null),
    [plates]
  );

  // Clamp candidate anchor inside plate (used when plate/count/dir changes)
  const clampAnchor = (g, plate) => {
    if (!plate) return { x: g.x, y: g.y };
    const { w, h } = groupSize(g.count, g.dir);
    const maxXEdge = plate.width - MIN_EDGE_CM - w;
    const maxYEdge = plate.height - MIN_EDGE_CM - h;

    let xEdge = g.x - HALF;
    let yEdge = g.y - HALF;
    xEdge = Math.min(Math.max(xEdge, MIN_EDGE_CM), maxXEdge);
    yEdge = Math.min(Math.max(yEdge, MIN_EDGE_CM), maxYEdge);

    return { x: xEdge + HALF, y: yEdge + HALF };
  };

  // Normalize anchors so drafts never show negative edges
  useEffect(() => {
    if (!groups.length) return;
    for (const g of groups) {
      const plate = plates[g.plateIndex];
      if (!plate) continue;
      const clamped = clampAnchor(g, plate);
      if (
        Math.abs(clamped.x - g.x) > 1e-6 ||
        Math.abs(clamped.y - g.y) > 1e-6
      ) {
        updateGroup(g.id, clamped);
      }
    }
  }, [groups, plates]);

  // Sync drafts + active accordion
  useEffect(() => {
    if (!groups.length) {
      setActiveId(null);
      setDrafts({});
      setFieldErrors({});
      setMenuOpenId(null);
      return;
    }
    if (!activeId || !groups.some((g) => g.id === activeId)) {
      setActiveId(groups[0].id);
    }
    setDrafts(() => {
      const next = {};
      for (const g of groups) {
        const xEdge = Math.max(MIN_EDGE_CM, g.x - HALF);
        const yEdge = Math.max(MIN_EDGE_CM, g.y - HALF);
        next[g.id] = {
          x: String(unit === "cm" ? xEdge : toInches(xEdge)),
          y: String(unit === "cm" ? yEdge : toInches(yEdge)),
        };
      }
      return next;
    });
  }, [groups, activeId, unit]);

  // Mutations ---------------------------------------------------------------

  const setGroup = (g, patch) => {
    let candidate = { ...g, ...patch };
    if ("plateIndex" in patch || "count" in patch || "dir" in patch) {
      const plate = plates[candidate.plateIndex];
      candidate = { ...candidate, ...clampAnchor(candidate, plate) };
    }

    const idx = groups.findIndex((x) => x.id === g.id);
    const verdict = validatePlacement(
      groups,
      idx,
      plates[candidate.plateIndex],
      candidate
    );
    if (!verdict.ok) return setError(verdict.reason);

    updateGroup(g.id, candidate);
    setError(null);

    const xEdge = Math.max(MIN_EDGE_CM, candidate.x - HALF);
    const yEdge = Math.max(MIN_EDGE_CM, candidate.y - HALF);
    setDrafts((d) => ({
      ...d,
      [g.id]: {
        x: String(unit === "cm" ? xEdge : toInches(xEdge)),
        y: String(unit === "cm" ? yEdge : toInches(yEdge)),
      },
    }));
    setFieldErrors((fe) => ({ ...fe, [g.id]: { x: undefined, y: undefined } }));
  };

  const markFieldError = (gid, key, msg) => {
    setFieldErrors((prev) => ({
      ...prev,
      [gid]: { ...(prev[gid] || {}), [key]: msg || undefined },
    }));
  };

  const changePos = (g, key, text) => {
    // user types an EDGE distance (cm or in)
    setDrafts((d) => ({ ...d, [g.id]: { ...(d[g.id] || {}), [key]: text } }));

    const clean = text
      .trim()
      .replace(/[^0-9.,-]/g, "")
      .replace(",", ".");
    if (clean === "" || clean === "." || clean === "-") {
      markFieldError(g.id, key, undefined);
      return;
    }
    const num = Number(clean);
    if (!Number.isFinite(num)) {
      markFieldError(g.id, key, "Ungültige Zahl");
      return;
    }

    const cmEdge = unit === "cm" ? num : toCm(num);
    const plate = plates[g.plateIndex];
    if (!plate) {
      markFieldError(g.id, key, "Unbekannte Rückwand");
      return;
    }

    const { w, h } = groupSize(g.count, g.dir);
    const maxEdge =
      key === "x"
        ? plate.width - MIN_EDGE_CM - w
        : plate.height - MIN_EDGE_CM - h;

    if (cmEdge + 1e-6 < MIN_EDGE_CM) {
      markFieldError(g.id, key, "Mindestens 3 cm vom Rand");
      return;
    }
    if (cmEdge - 1e-6 > maxEdge) {
      markFieldError(
        g.id,
        key,
        key === "x" ? "Zu nah am rechten Rand" : "Zu nah am oberen Rand"
      );
      return;
    }

    const cmAnchor = cmEdge + HALF;
    const idx = groups.findIndex((x) => x.id === g.id);
    const cand = { ...g, [key]: cmAnchor };
    const verdict = validatePlacement(groups, idx, plates[g.plateIndex], cand);
    if (!verdict.ok) {
      markFieldError(g.id, key, verdict.reason || "Ungültige Position");
      return;
    }

    updateGroup(g.id, { [key]: cmAnchor });
    markFieldError(g.id, key, undefined);
    setError(null);
  };

  // Confirm button keeps behavior
  const confirmAdd = () => {
    if (!enabled) return;
    const current = groups.find((x) => x.id === activeId);
    const targetPlate =
      (current && current.plateIndex != null
        ? current.plateIndex
        : eligibleIdx[0]) ?? null;
    if (targetPlate == null)
      return setError("Kein gültige Rückwand (≥ 40×40 cm).");
    addGroupOn(targetPlate, plates);
  };

  // Toggle behavior: OFF→ON auto-add one group to first eligible plate
  const handleToggleSockets = () => {
    if (enabled) {
      setEnabled(false, plates);
      setError(null);
      return;
    }
    const firstEligible = eligibleIdx[0];
    if (firstEligible == null) {
      setError("Kein gültige Rückwand (≥ 40×40 cm).");
      return;
    }
    setEnabled(true, plates);
    addGroupOn(firstEligible, plates);
    setError(null);
  };

  const onOpenMenu = (gid) => setMenuOpenId(gid);
  const onCloseMenu = () => setMenuOpenId(null);
  const onRemove = (gid) => {
    removeGroup(gid);
    setMenuOpenId(null);
  };

  return (
    <div className="flex flex-col bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-4 pb-2">
        <h2 className="text-2xl md:text-3xl font-black tracking-tight">
          Steckdosen. <span className="font-semibold">Auswählen.</span>
        </h2>
      </div>

      {/* Enable switch row */}
      <SocketsHeader enabled={enabled} onToggle={handleToggleSockets} />

      {/* Groups list */}
      {enabled && groups.length > 0 && (
        <>
          <SectionHeading text="Bestimme Anzahl und Ausrichtung der Steckdosen" />
          <div className="px-4 pb-1">
            <div className="space-y-2">
              {groups.map((g, index) => {
                const open = g.id === activeId;
                const d = drafts[g.id] || { x: "", y: "" };
                const fe = fieldErrors[g.id] || {};
                const plate = plates[g.plateIndex];

                const dims = plate
                  ? unit === "cm"
                    ? `${fmt(plate.width, undefined, 1)} × ${fmt(
                        plate.height,
                        undefined,
                        1
                      )} cm`
                    : `${fmt(toInches(plate.width), undefined, 2)} × ${fmt(
                        toInches(plate.height),
                        undefined,
                        2
                      )} in`
                  : "-";

                return (
                  <GroupCard
                    key={g.id}
                    index={index}
                    group={g}
                    dimsLabel={dims}
                    open={open}
                    onToggleOpen={() => setActiveId(open ? null : g.id)}
                    menuOpen={menuOpenId === g.id}
                    onOpenMenu={() => onOpenMenu(g.id)}
                    onCloseMenu={onCloseMenu}
                    onRemove={() => onRemove(g.id)}
                    plates={plates}
                    eligibleFn={plateIsEligible}
                    unit={unit}
                    fmt={fmt}
                    toInches={toInches}
                    setGroup={setGroup}
                    drafts={d}
                    errors={fe}
                    changePos={changePos}
                    nfEUR={nfEUR}
                    pricePerSocket={SOCKET_PRICE_EUR}
                  />
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Confirm */}
      <div className="px-4 pt-3 pb-6">
        {!!error && <div className="mb-3 text-xs text-red-600">{error}</div>}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={confirmAdd}
            disabled={!enabled || eligibleIdx.length === 0}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-emerald-500 text-emerald-600 font-semibold hover:bg-emerald-50 disabled:opacity-50"
          >
            Steckdose bestätigen
          </button>
        </div>
      </div>
    </div>
  );
}
