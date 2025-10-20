import { memo, useMemo } from "react";
import DimensionInput from "./DimensionInput";
import { cn, fmt, parseLocaleNumber, toCm, CM_PER_IN } from "../../utils/utils";

const PlateCard = memo(function PlateCard({
  index,
  plate,
  isActive,
  wErr,
  hErr,
  onFocus,
  onChange,
  onBlur,
  canRemove,
  onRemove,
  unit,
  locale,
}) {
  const secondaryWidth = useMemo(() => {
    const v = parseLocaleNumber(plate.width);
    if (!Number.isFinite(v)) return "";
    if (unit === "cm") return `${fmt(v * 10, locale, 0)} mm`;
    const cm = toCm(v);
    return `${fmt(cm, locale, 2)} cm`;
  }, [plate.width, unit, locale]);

  const secondaryHeight = useMemo(() => {
    const v = parseLocaleNumber(plate.height);
    if (!Number.isFinite(v)) return "";
    if (unit === "cm") return `${fmt(v * 10, locale, 0)} mm`;
    const cm = toCm(v);
    return `${fmt(cm, locale, 2)} cm`;
  }, [plate.height, unit, locale]);

  const widthLimitsLabel = useMemo(() => {
    const minCm = 20;
    const maxCm = 300;
    if (unit === "cm") return "20 to 300 cm";
    const minIn = minCm / CM_PER_IN;
    const maxIn = maxCm / CM_PER_IN;
    return `${fmt(minIn, locale, 2)} to ${fmt(maxIn, locale, 2)} in`;
  }, [unit, locale]);

  const heightLimitsLabel = useMemo(() => {
    const minCm = 30;
    const maxCm = 128;
    if (unit === "cm") return "30 to 128 cm";
    const minIn = minCm / CM_PER_IN;
    const maxIn = maxCm / CM_PER_IN;
    return `${fmt(minIn, locale, 2)} to ${fmt(maxIn, locale, 2)} in`;
  }, [unit, locale]);

  return (
    <div className="bg-gray-100 rounded-2xl p-3 md:p-4">
      <div className="flex items-start gap-3 md:gap-4">
        <div
          className={cn(
            "shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center",
            "text-sm md:text-base font-semibold",
            isActive ? "bg-black text-white" : "bg-white text-black",
            isActive && "md:mt-6 mt-8"
          )}
        >
          {index + 1}
        </div>

        <div className="flex-1">
          {isActive && (
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div
                className={cn(
                  "flex items-center justify-between text-[12px] md:text-xs",
                  wErr ? "text-red-400" : "text-gray-600"
                )}
              >
                <span className="font-bold">Breite</span>
                <span className={wErr ? "text-red-400" : "text-gray-400"}>
                  {widthLimitsLabel}
                </span>
              </div>
              <div
                className={cn(
                  "flex items-center justify-between text-[12px] md:text-xs",
                  hErr ? "text-red-400" : "text-gray-600"
                )}
              >
                <span className="font-bold">Höhe</span>
                <span className={hErr ? "text-red-400" : "text-gray-400"}>
                  {heightLimitsLabel}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 md:gap-4">
            <div>
              <DimensionInput
                id={`width-${index}`}
                unit={unit}
                value={plate.width}
                onFocus={() => onFocus(index)}
                onChange={(v) => onChange(index, "width", v)}
                onBlur={() => onBlur(index, "width")}
                error={wErr}
              />
              {isActive && (
                <div className="mt-1 px-8 text-xs text-gray-400">
                  {secondaryWidth}
                </div>
              )}
            </div>

            <div
              className={`text-gray-500 text-base md:text-lg text-center select-none ${
                isActive ? "pb-6" : "pb-1"
              }`}
            >
              x
            </div>

            <div>
              <DimensionInput
                id={`height-${index}`}
                unit={unit}
                value={plate.height}
                onFocus={() => onFocus(index)}
                onChange={(v) => onChange(index, "height", v)}
                onBlur={() => onBlur(index, "height")}
                error={hErr}
              />
              {isActive && (
                <div className="mt-1 px-8 text-xs text-gray-400">
                  {secondaryHeight}
                </div>
              )}
            </div>
          </div>
        </div>

        {canRemove && (
          <button
            onClick={() => onRemove(index)}
            type="button"
            title="Rückwand entfernen"
            className={cn(
              "shrink-0 flex items-center justify-center w-8 h-8 md:w-9 md:h-9",
              "rounded-full bg-red-100 hover:bg-red-200 transition",
              isActive && "md:mt-6 mt-8"
            )}
          >
            <span className="w-3.5 h-[2px] bg-red-500 block rounded-sm"></span>
          </button>
        )}
      </div>
    </div>
  );
});

export default PlateCard;
