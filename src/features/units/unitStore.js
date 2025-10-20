import { useSyncExternalStore } from "react";
import { loadJSON, saveJSON } from "../../utils/storage";

const LS_KEY = "pg:units/v1";

// initial state from LS
let state = loadJSON(LS_KEY, { unit: "cm" }); // "cm" | "in"
const listeners = new Set();

function notify() {
  for (const l of listeners) l();
  saveJSON(LS_KEY, state);
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function getSnapshot() {
  return state;
}
export function useUnitStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function setUnit(next) {
  if (next !== "cm" && next !== "in") return;
  if (state.unit === next) return;
  state = { ...state, unit: next };
  notify();
}
