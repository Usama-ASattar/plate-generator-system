const KEY = "plates_config_v1";

export function savePlates(plates) {
  try {
    localStorage.setItem(KEY, JSON.stringify(plates));
  } catch (err) {
    console.error("Failed to save plates", err);
  }
}

export function loadPlates() {
  try {
    const s = localStorage.getItem(KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}
