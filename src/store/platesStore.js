import { useSyncExternalStore } from "react";
import { loadPlates, savePlates } from "../utils/storage";

const DEFAULT_PLATE = { width: 250, height: 128 };
const MIN_PLATES = 1;
const MAX_PLATES = 10;

let state = { plates: loadPlates() || [DEFAULT_PLATE] };
const listeners = new Set();

function emit() {
  savePlates(state.plates);
  for (const l of listeners) l();
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getSnapshot() {
  return state;
}

export function usePlatesStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/* Actions */
export function addPlate() {
  if (state.plates.length >= MAX_PLATES) return;
  state = { ...state, plates: [...state.plates, { ...DEFAULT_PLATE }] };
  emit();
}

export function removePlate(index) {
  if (state.plates.length <= MIN_PLATES) return;
  state = { ...state, plates: state.plates.filter((_, i) => i !== index) };
  emit();
}

export function updatePlate(index, key, value) {
  const next = state.plates.map((p, i) =>
    i === index ? { ...p, [key]: value } : p
  );
  state = { ...state, plates: next };
  emit();
}

export function setPlates(next) {
  state = { ...state, plates: [...next] };
  emit();
}
