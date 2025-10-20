import { memo } from "react";
import { cn } from "../../utils/utils";

const DimensionInput = memo(function DimensionInput({
  id,
  value,
  unit,
  onFocus,
  onChange,
  onBlur,
  error,
}) {
  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={value}
        onFocus={onFocus}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={Boolean(error)}
        className={cn(
          "w-full rounded-xl bg-white px-4 md:px-6 py-2 md:py-1 pr-12",
          "text-lg md:text-2xl font-semibold outline-none border",
          error ? "border-red-300" : "border-transparent",
          "focus:ring-2 focus:ring-black/5"
        )}
      />
      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 text-sm md:text-base">
        {unit}
      </span>
    </div>
  );
});

export default DimensionInput;
