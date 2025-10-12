export function computeTotals(plates) {
  if (!plates?.length) return { totalW: 0, maxH: 0, xStarts: [] };
  let x = 0;
  const xStarts = [];
  for (const p of plates) {
    xStarts.push(x);
    x += p?.width || 0;
  }
  const totalW = x;
  const maxH = Math.max(...plates.map((p) => p?.height || 0));
  return { totalW, maxH, xStarts };
}
