export default function ThumbnailStrip({
  images,
  current,
  onSelect,
  onAdd,
  onRemove,
}) {
  const canDelete = images.length > 1;

  return (
    <div className="w-full shrink-0 border-t border-black/5 pt-3 mt-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-gray-500 font-medium">Motiv</div>
        <label className="cursor-pointer inline-flex items-center gap-2 text-xs px-2 py-1 rounded-lg border border-gray-300 hover:bg-gray-50">
          Bild hinzufügen
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const url = URL.createObjectURL(f);
              onAdd(url);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      <div className="flex gap-2 overflow-x-auto overflow-y-visible pb-1 px-2">
        {images.map((src, i) => (
          <div key={src + i} className="relative pt-1">
            <button
              type="button"
              onClick={() => onSelect(i)}
              className={[
                "relative w-16 h-12 rounded-lg overflow-hidden ring-1",
                i === current
                  ? "ring-black"
                  : "ring-transparent hover:ring-gray-300",
              ].join(" ")}
              title={`Motiv ${i + 1}`}
            >
              <img
                src={src}
                className="absolute inset-0 w-full h-full object-cover"
                alt={`Motiv ${i + 1}`}
              />
            </button>

            <button
              type="button"
              onClick={() => onRemove(i)}
              disabled={!canDelete}
              title={
                canDelete
                  ? "Motiv entfernen"
                  : "Mindestens ein Motiv erforderlich"
              }
              className={[
                "absolute top-2 right-1 z-10 w-4 h-4 rounded-full flex items-center justify-center",
                "text-white text-[10px] shadow ring-2 ring-white",
                canDelete
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-gray-300 cursor-not-allowed",
              ].join(" ")}
              aria-label="Motiv entfernen"
            >
              <svg
                viewBox="0 0 12 12"
                width="8"
                height="8"
                className="pointer-events-none"
              >
                <path
                  d="M3 3l6 6M9 3L3 9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
