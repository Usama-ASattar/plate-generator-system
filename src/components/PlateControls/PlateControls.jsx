// src/components/PlateControls.jsx
import React, { useEffect, useState } from "react";
import {
  usePlatesStore,
  addPlate,
  removePlate,
  updatePlate,
} from "../../store/platesStore";
import { parseDimension, validateDimension } from "../../utils/parseDimension";

import PlateCard from "./PlateCard";
import UnitToggle from "./UnitToggle";
import { fmt, parseLocaleNumber, toInches, toCm, useLocale } from "./utils";

export default function PlateControls() {
  const { plates } = usePlatesStore();
  const locale = useLocale();

  // unit state: "cm" or "in"
  const [unit, setUnit] = useState("cm");

  // drafts are strings shown in inputs in the current unit
  const [drafts, setDrafts] = useState(() =>
    plates.map((p) => ({
      width: fmt(p.width, locale, 2), // cm initially
      height: fmt(p.height, locale, 2),
    }))
  );

  const [errors, setErrors] = useState({});
  const [activeIndex, setActiveIndex] = useState(0);

  // keep drafts in sync with store and unit
  useEffect(() => {
    setDrafts(
      plates.map((p) => {
        const w = unit === "cm" ? p.width : toInches(p.width);
        const h = unit === "cm" ? p.height : toInches(p.height);
        return {
          width: fmt(w, locale, 2),
          height: fmt(h, locale, 2),
        };
      })
    );
    setActiveIndex((idx) => Math.min(idx, Math.max(plates.length - 1, 0)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plates, unit, locale]);

  const onChange = (i, key, val) => {
    setDrafts((prev) => {
      const arr = [...prev];
      arr[i] = { ...arr[i], [key]: val };
      return arr;
    });
  };

  const onBlur = (i, key) => {
    const raw = drafts[i]?.[key];

    // try locale friendly numeric parse first
    let numeric = parseLocaleNumber(raw);

    // fall back to existing parseDimension if needed
    if (!Number.isFinite(numeric)) {
      const parsed = parseDimension(raw);
      numeric = Number.isFinite(parsed) ? parsed : NaN;
    }

    if (!Number.isFinite(numeric)) {
      // keep current drafts but show error
      setErrors((prev) => ({
        ...prev,
        [`${i}-${key}`]: "Ungültig",
      }));
      return;
    }

    // convert to cm for validation and storage
    const valueCm = unit === "cm" ? numeric : toCm(numeric);

    // limits in cm
    const [min, max] = key === "width" ? [20, 300] : [30, 128];
    const ok = validateDimension(valueCm, min, max);

    if (!ok) {
      setErrors((prev) => ({
        ...prev,
        [`${i}-${key}`]: `Ungültig. ${min} to ${max} cm`,
      }));
      // reset draft back to stored value formatted in current unit
      setDrafts((prev) => {
        const arr = [...prev];
        const currentStored = plates[i][key]; // cm
        const shown =
          unit === "cm"
            ? fmt(currentStored, locale, 2)
            : fmt(toInches(currentStored), locale, 2);
        arr[i] = { ...arr[i], [key]: shown };
        return arr;
      });
      return;
    }

    // clear error
    setErrors((prev) => {
      const cp = { ...prev };
      delete cp[`${i}-${key}`];
      return cp;
    });

    // update store in cm
    updatePlate(i, key, valueCm);

    // normalize draft formatting in current unit
    setDrafts((prev) => {
      const arr = [...prev];
      const showVal = unit === "cm" ? valueCm : toInches(valueCm);
      arr[i] = { ...arr[i], [key]: fmt(showVal, locale, 2) };
      return arr;
    });
  };

  return (
    <div className="h-full max-h-full min-h-0 flex flex-col bg-white rounded-lg shadow-sm overflow-hidden">
      {/* header */}
      <div className="p-4 shrink-0 flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-black tracking-tight">
          Maße. <span className="font-semibold">Eingeben.</span>
        </h2>

        {/* unit toggle */}
        <UnitToggle unit={unit} onChange={setUnit} />
      </div>

      {/* list scroller */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 pt-2 space-y-4">
        {drafts.map((plate, i) => (
          <PlateCard
            key={i}
            index={i}
            plate={plate}
            isActive={i === activeIndex}
            wErr={errors[`${i}-width`]}
            hErr={errors[`${i}-height`]}
            onFocus={setActiveIndex}
            onChange={onChange}
            onBlur={onBlur}
            canRemove={drafts.length > 1}
            onRemove={removePlate}
            unit={unit}
            locale={locale}
          />
        ))}

        {/* add button at the end of the list */}
        <div className="pb-2 shrink-0 flex justify-end">
          <button
            onClick={addPlate}
            disabled={plates.length >= 10}
            type="button"
            className="inline-flex items-center gap-2 px-4 md:px-5 py-2.5 md:py-3 rounded-xl border border-green-500 text-green-600 font-semibold hover:bg-green-50 disabled:opacity-50"
          >
            Rückwand hinzufügen
            <span className="w-5 h-5 text-green-500 flex items-center justify-center text-[16px] leading-none">
              +
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
