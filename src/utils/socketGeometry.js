// All values here are in centimeters (internal units).
export const SOCKET_SIZE = 7; // each socket is 7x7 cm
export const SOCKET_GAP = 0.2; // gap between sockets in a group
export const EDGE_MIN = 3; // from plate edges
export const GROUP_MIN_GAP = 4; // between groups

export function groupSize(count, dir) {
  const s = SOCKET_SIZE;
  const gaps = Math.max(0, count - 1) * SOCKET_GAP;
  return dir === "v"
    ? { w: s, h: count * s + gaps }
    : { w: count * s + gaps, h: s };
}

// Anchor is the bottom-left center of the first socket.
export function groupRectFromAnchor(x, y, count, dir) {
  const s = SOCKET_SIZE;
  const startLeft = x - s / 2; // shift from center to left edge of first socket
  const { w, h } = groupSize(count, dir);
  return { x: startLeft, y, w, h };
}

export function withinPlate(rect, plateW, plateH) {
  return (
    rect.x >= EDGE_MIN &&
    rect.y >= EDGE_MIN &&
    rect.x + rect.w <= plateW - EDGE_MIN &&
    rect.y + rect.h <= plateH - EDGE_MIN
  );
}

export function rectsOverlapWithPadding(a, b, pad) {
  return !(
    a.x + a.w + pad <= b.x ||
    b.x + b.w + pad <= a.x ||
    a.y + a.h + pad <= b.y ||
    b.y + b.h + pad <= a.y
  );
}

export function plateIsEligible(plate) {
  return (plate?.width ?? 0) >= 40 && (plate?.height ?? 0) >= 40;
}

export function validatePlacement(allGroups, idx, plate, candidate) {
  if (!plateIsEligible(plate))
    return { ok: false, reason: "Plate must be ≥ 40×40 cm." };

  const rect = groupRectFromAnchor(
    candidate.x,
    candidate.y,
    candidate.count,
    candidate.dir
  );
  if (!withinPlate(rect, plate.width, plate.height)) {
    return { ok: false, reason: "Keep ≥ 3 cm from plate edges." };
  }

  const self = allGroups[idx];
  const samePlateOthers = allGroups.filter(
    (g, i) => i !== idx && g.plateIndex === self.plateIndex
  );
  for (const g of samePlateOthers) {
    const r = groupRectFromAnchor(g.x, g.y, g.count, g.dir);
    if (rectsOverlapWithPadding(rect, r, GROUP_MIN_GAP)) {
      return {
        ok: false,
        reason: "Keep ≥ 4 cm distance between socket groups.",
      };
    }
  }
  return { ok: true };
}
