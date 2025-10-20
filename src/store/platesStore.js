import { useSyncExternalStore } from "react";
import { loadJSON, saveJSONDebounced } from "../utils/storage";

const LS_KEY = "pg:plates/v1";
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const initial = loadJSON(LS_KEY, {
  plates: [{ width: 120, height: 60 }], // default plate
});

let state = validate(initial);
const listeners = new Set();

function validate(s) {
  const arr = Array.isArray(s?.plates) ? s.plates : [];
  // sanitize and clamp into valid ranges
  const safe = arr.map((p) => ({
    width: clamp(Number(p?.width) || 120, 20, 300),
    height: clamp(Number(p?.height) || 60, 30, 128),
  }));
  if (!safe.length) safe.push({ width: 120, height: 60 });
  return { plates: safe };
}

function notify() {
  for (const l of listeners) l();
  saveJSONDebounced(LS_KEY, state);
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function getSnapshot() {
  return state;
}
export function usePlatesStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function addPlate() {
  state = { ...state, plates: [...state.plates, { width: 120, height: 60 }] };
  notify();
}

export function removePlate(index) {
  if (state.plates.length <= 1) return;
  const next = state.plates.filter((_, i) => i !== index);
  state = { ...state, plates: next };
  notify();
}

export function updatePlate(index, key, valueCm) {
  const next = state.plates.slice();
  if (!next[index]) return;

  if (key === "width") valueCm = clamp(valueCm, 20, 300);
  if (key === "height") valueCm = clamp(valueCm, 30, 128);

  next[index] = { ...next[index], [key]: valueCm };
  state = { ...state, plates: next };
  notify();
}
