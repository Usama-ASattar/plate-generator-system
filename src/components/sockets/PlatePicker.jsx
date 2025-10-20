export default function PlatePicker({
  plates,
  selectedIndex,
  eligibleFn,
  unit,
  fmt,
  toInches,
  onSelect,
}) {
  return (
    <div className="mb-4">
      <div className="text-sm font-medium mb-2">
        Wähle die Rückwand für die Steckdose
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border border-gray-200 bg-gray-200 p-2 rounded-xl">
        {plates.map((p, i) => {
          const selected = selectedIndex === i;
          const eligible = eligibleFn(p);
          const pdims =
            unit === "cm"
              ? `${fmt(p.width, undefined, 1)} × ${fmt(
                  p.height,
                  undefined,
                  1
                )} cm`
              : `${fmt(toInches(p.width), undefined, 2)} × ${fmt(
                  toInches(p.height),
                  undefined,
                  2
                )} in`;

          return (
            <button
              key={i}
              type="button"
              disabled={!eligible}
              onClick={() => onSelect(i)}
              className={`group flex flex-col items-center justify-center rounded-xl border p-3 transition ${
                selected
                  ? "border-emerald-400 bg-emerald-50"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              } ${!eligible ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="w-full flex items-center justify-center">
                <div className="w-[84px] h-[54px] rounded-md border border-gray-300 bg-gray-100 relative overflow-hidden">
                  <div className="absolute inset-[8px] rounded-md border border-gray-300 bg-white" />
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-600">{pdims}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
