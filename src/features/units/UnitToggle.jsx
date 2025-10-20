export default function UnitToggle({ unit = "cm", onChange }) {
  const isCm = unit === "cm";
  const base =
    "flex-1 h-9 px-4 text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-black/30";

  return (
    <div
      role="group"
      aria-label="Unit selection"
      className="inline-flex items-center rounded-xl border border-gray-300 overflow-hidden"
    >
      <button
        type="button"
        aria-pressed={isCm}
        onClick={() => onChange("cm")}
        className={
          base +
          " " +
          (isCm
            ? "bg-black text-white"
            : "bg-white text-gray-500 hover:bg-gray-50")
        }
      >
        cm
      </button>

      <button
        type="button"
        aria-pressed={!isCm}
        onClick={() => onChange("in")}
        className={
          base +
          " " +
          (!isCm
            ? "bg-black text-white"
            : "bg-white text-gray-500 hover:bg-gray-50")
        }
      >
        in
      </button>
    </div>
  );
}
