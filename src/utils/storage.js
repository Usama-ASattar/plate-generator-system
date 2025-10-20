const hasLS = typeof window !== "undefined" && !!window.localStorage;

export function loadJSON(key, fallback) {
  if (!hasLS) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function saveJSON(key, value) {
  if (!hasLS) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota/security errors
  }
}

// Small debouncer to avoid writing on every keystroke
const timers = new Map();
export function saveJSONDebounced(key, value, delay = 120) {
  if (!hasLS) return;
  clearTimeout(timers.get(key));
  const id = setTimeout(() => saveJSON(key, value), delay);
  timers.set(key, id);
}
