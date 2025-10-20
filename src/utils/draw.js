export function drawPlates(ctx, img, plates, totals, dims) {
  const { totalW, xStarts } = totals;
  const { layoutW, layoutH, gap, tileCm } = dims;

  ctx.clearRect(0, 0, layoutW, layoutH);

  const imgW = img.naturalWidth;
  const imgH = img.naturalHeight;
  if (!imgW || !imgH) return;

  const s = tileCm / imgW;
  const scaledH = imgH * s;

  function drawFragment(
    destX,
    plateTop,
    fragW,
    plateH,
    worldX,
    offsetInTile,
    tileIndex
  ) {
    let srcY, srcH, destY, destH;
    if (scaledH >= plateH) {
      srcH = plateH / s;
      srcY = (imgH - srcH) / 2;
      destY = plateTop;
      destH = plateH;
    } else {
      srcY = 0;
      srcH = imgH;
      destH = scaledH;
      destY = plateTop + (plateH - destH) / 2;
    }

    const mirrored = tileIndex % 2 === 1 && totalW > tileCm;
    const srcW = fragW / s;

    if (!mirrored) {
      const srcX = offsetInTile / s;
      ctx.drawImage(img, srcX, srcY, srcW, srcH, destX, destY, fragW, destH);
    } else {
      const srcX = imgW - (offsetInTile + fragW) / s;
      ctx.save();
      ctx.translate(destX + fragW, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, destY, fragW, destH);
      ctx.restore();
    }
  }

  for (let i = 0; i < plates.length; i++) {
    const p = plates[i];
    const plateW = Math.max(0, p?.width || 0);
    const plateH = Math.max(0, p?.height || 0);
    const worldStart = xStarts[i];
    const destStart = i * gap + worldStart;
    const plateTop = layoutH - plateH;

    let remain = plateW;
    let local = 0;
    while (remain > 0) {
      const worldX = worldStart + local;
      const tileIndex = Math.floor(worldX / tileCm);
      const offsetInTile = worldX % tileCm;
      const spaceInTile = tileCm - offsetInTile;
      const take = Math.min(remain, spaceInTile);

      drawFragment(
        destStart + local,
        plateTop,
        take,
        plateH,
        worldX,
        offsetInTile,
        tileIndex
      );

      local += take;
      remain -= take;
    }
  }
}
