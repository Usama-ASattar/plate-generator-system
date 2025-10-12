import { useEffect, useState } from "react";

export function useImage(src) {
  const [img, setImg] = useState(null);

  useEffect(() => {
    if (!src) {
      setImg(null);
      return;
    }
    let cancelled = false;
    const image = new Image();
    image.src = src;
    image.onload = () => {
      if (!cancelled) setImg(image);
    };
    image.onerror = () => {
      if (!cancelled) setImg(null);
    };
    return () => {
      cancelled = true;
    };
  }, [src]);

  return img;
}
