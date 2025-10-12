import { cn } from "./utils";

export default function UnitToggle({ unit, onChange }) {
  return (
    <div className="inline-flex items-center rounded-lg border border-gray-300 overflow-hidden">
      <button
        type="button"
        onClick={() => onChange("cm")}
        className={cn(
          "px-3 py-1.5 text-sm font-semibold",
          unit === "cm" ? "bg-black text-white" : "bg-white text-gray-700"
        )}
        aria-pressed={unit === "cm"}
      >
        cm
      </button>
      <button
        type="button"
        onClick={() => onChange("in")}
        className={cn(
          "px-3 py-1.5 text-sm font-semibold border-l border-gray-300",
          unit === "in" ? "bg-black text-white" : "bg-white text-gray-700"
        )}
        aria-pressed={unit === "in"}
      >
        in
      </button>
    </div>
  );
}
