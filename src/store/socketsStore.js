// src/store/socketsStore.js
import { useSyncExternalStore } from "react";
import { loadJSON, saveJSONDebounced } from "../utils/storage";
import {
  SOCKET_SIZE,
  SOCKET_GAP,
  EDGE_MIN,
  GROUP_MIN_GAP,
  groupRectFromAnchor,
  groupSize,
  rectsOverlapWithPadding,
  withinPlate,
} from "../utils/socketGeometry";

const LS_KEY = "pg:sockets/v1";

// Simple local unique ID generator (no external deps)
function uuid() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

const MIN_PLATE = { w: 40, h: 40 };
const newGroup = (plateIndex = 0) => ({
  id: uuid(),
  plateIndex,
  count: 3, // 1..5
  dir: "h", // "h" | "v"
  x: EDGE_MIN + SOCKET_SIZE / 2, // default safe anchor from left
  y: EDGE_MIN, // default safe anchor from bottom
});

function sanitize(raw) {
  const enabled = !!raw?.enabled;
  const groups = Array.isArray(raw?.groups) ? raw.groups : [];
  const safe = groups.map((g) => ({
    id: typeof g?.id === "string" ? g.id : uuid(),
    plateIndex: Number.isFinite(g?.plateIndex) ? g.plateIndex : 0,
    count: Math.min(5, Math.max(1, Number(g?.count) || 3)),
    dir: g?.dir === "v" ? "v" : "h",
    x: Number(g?.x) || EDGE_MIN + SOCKET_SIZE / 2,
    y: Number(g?.y) || EDGE_MIN,
  }));
  return { enabled, groups: safe, error: null };
}

let state = sanitize(loadJSON(LS_KEY, { enabled: false, groups: [] }));
const listeners = new Set();

function notify() {
  for (const l of listeners) l();
  saveJSONDebounced(LS_KEY, { enabled: state.enabled, groups: state.groups });
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function getSnapshot() {
  return state;
}
export function useSocketsStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function setEnabled(on, plates) {
  if (!on) {
    state = { ...state, enabled: false, groups: [], error: null };
    return notify();
  }
  const idx = (plates || []).findIndex(
    (p) => (p?.width ?? 0) >= MIN_PLATE.w && (p?.height ?? 0) >= MIN_PLATE.h
  );
  if (idx === -1) {
    state = {
      ...state,
      enabled: false,
      groups: [],
      error: "No plate ≥ 40×40 cm to attach sockets.",
    };
    return notify();
  }
  state = { ...state, enabled: true, error: null }; // keep any existing groups
  notify();
}

/** Find first valid position for a new group on a given plate. */
function findSpotForNewGroup(plate, existingOnPlate, { count, dir }) {
  const { width: W, height: H } = plate;
  const { w, h } = groupSize(count, dir);
  // Candidate rect from anchor (ax, ay)
  // ax must be >= EDGE_MIN + SOCKET_SIZE/2; ay >= EDGE_MIN
  const minAx = EDGE_MIN + SOCKET_SIZE / 2;
  const maxAx = W - EDGE_MIN - (w - SOCKET_SIZE / 2); // ensure rect fits by anchor
  const minAy = EDGE_MIN;
  const maxAy = H - EDGE_MIN - h;

  const step = 0.5; // cm granularity for search

  for (let ay = minAy; ay <= maxAy + 1e-6; ay += step) {
    for (let ax = minAx; ax <= maxAx + 1e-6; ax += step) {
      const rect = groupRectFromAnchor(ax, ay, count, dir);
      if (!withinPlate(rect, W, H)) continue;

      let clash = false;
      for (const g of existingOnPlate) {
        const r = groupRectFromAnchor(g.x, g.y, g.count, g.dir);
        if (rectsOverlapWithPadding(rect, r, GROUP_MIN_GAP)) {
          clash = true;
          break;
        }
      }
      if (!clash) return { x: ax, y: ay };
    }
  }
  return null;
}

export function addGroupOn(plateIndex, plates) {
  const plate = plates?.[plateIndex];
  if (!plate) return;

  const template = newGroup(plateIndex);
  const existingOnPlate = state.groups.filter(
    (g) => g.plateIndex === plateIndex
  );

  const spot = findSpotForNewGroup(plate, existingOnPlate, template);
  if (!spot) {
    state = {
      ...state,
      error: "No space left for another socket group on this plate.",
    };
    return notify();
  }

  const next = { ...template, ...spot };
  state = { ...state, groups: [...state.groups, next], error: null };
  notify();
}

export function removeGroup(id) {
  state = { ...state, groups: state.groups.filter((g) => g.id !== id) };
  notify();
}

export function updateGroup(id, patch) {
  state = {
    ...state,
    groups: state.groups.map((g) => (g.id === id ? { ...g, ...patch } : g)),
  };
  notify();
}

export function setError(msg) {
  state = { ...state, error: msg || null };
  notify();
}

export function clearForPlate(plateIndex) {
  state = {
    ...state,
    groups: state.groups.filter((g) => g.plateIndex !== plateIndex),
  };
  notify();
}

export function shiftAfterPlateRemoved(removedIndex) {
  state = {
    ...state,
    groups: state.groups
      .filter((g) => g.plateIndex !== removedIndex)
      .map((g) =>
        g.plateIndex > removedIndex ? { ...g, plateIndex: g.plateIndex - 1 } : g
      ),
  };
  notify();
}

export function ensureGroupsWithin(platesLen) {
  if (!Number.isFinite(platesLen) || platesLen <= 0) return;
  let changed = false;
  const groups = state.groups.filter((g) => {
    if (g.plateIndex < 0 || g.plateIndex >= platesLen) {
      changed = true;
      return false;
    }
    return true;
  });
  if (changed) {
    state = { ...state, groups };
    notify();
  }
}
