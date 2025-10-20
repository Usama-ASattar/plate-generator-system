export default function PositionInputs({
  drafts,
  errors,
  onChangeX,
  onChangeY,
}) {
  const d = drafts || { x: "", y: "" };
  const fe = errors || {};

  return (
    <div className="mb-4">
      <div className="text-sm font-medium mb-2">Positioniere die Steckdose</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-200 p-3 rounded-lg">
        <div className="min-w-0">
          <div className="text-sm font-medium mb-2">Abstand von Links</div>
          <input
            type="text"
            inputMode="decimal"
            pattern="[0-9.,]*"
            value={d.x ?? ""}
            onChange={(e) => onChangeX(e.target.value)}
            placeholder="Abstand von Links (≥ 3)"
            className={`w-full h-11 rounded-xl border px-3 bg-white text-sm appearance-none focus:ring-2 outline-none ${
              fe.x
                ? "border-red-500 focus:ring-red-200"
                : "border-gray-200 focus:ring-emerald-200 focus:border-emerald-400"
            }`}
          />
          {fe.x && <div className="mt-1 text-[11px] text-red-600">{fe.x}</div>}
        </div>

        <div className="min-w-0">
          <div className="text-sm font-medium mb-2">Abstand von unten</div>
          <input
            type="text"
            inputMode="decimal"
            pattern="[0-9.,]*"
            value={d.y ?? ""}
            onChange={(e) => onChangeY(e.target.value)}
            placeholder="Abstand von unten (≥ 3)"
            className={`w-full h-11 rounded-xl border px-3 bg-white text-sm appearance-none focus:ring-2 outline-none ${
              fe.y
                ? "border-red-500 focus:ring-red-200"
                : "border-gray-200 focus:ring-emerald-200 focus:border-emerald-400"
            }`}
          />
          {fe.y && <div className="mt-1 text-[11px] text-red-600">{fe.y}</div>}
        </div>
      </div>
    </div>
  );
}
