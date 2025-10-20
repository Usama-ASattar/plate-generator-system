import React, { useEffect, useState } from "react";
import {
  usePlatesStore,
  addPlate,
  removePlate,
  updatePlate,
} from "../../store/platesStore";
import {
  clearForPlate,
  shiftAfterPlateRemoved,
} from "../../store/socketsStore";

import PlateCard from "./PlateCard";
import UnitToggle from "../../features/units/UnitToggle";

import {
  useUnitStore,
  setUnit as setGlobalUnit,
} from "../../features/units/unitStore";
import { parseDimension } from "../../utils/parseDimension";
import {
  fmt,
  parseLocaleNumber,
  toInches,
  toCm,
  useLocale,
} from "../../utils/utils";

export default function PlateControls() {
  const { plates } = usePlatesStore();
  const { unit } = useUnitStore();
  const locale = useLocale();

  const [drafts, setDrafts] = useState(() =>
    plates.map((p) => ({
      width: fmt(p.width, locale, 2),
      height: fmt(p.height, locale, 2),
    }))
  );
  const [errors, setErrors] = useState({});
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setDrafts(
      plates.map((p) => {
        const w = unit === "cm" ? p.width : toInches(p.width);
        const h = unit === "cm" ? p.height : toInches(p.height);
        return { width: fmt(w, locale, 2), height: fmt(h, locale, 2) };
      })
    );
    setActiveIndex((i) => Math.min(i, Math.max(plates.length - 1, 0)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plates, unit, locale]);

  const onChange = (i, key, val) => {
    setDrafts((prev) => {
      const next = prev.slice();
      next[i] = { ...next[i], [key]: val };
      return next;
    });
  };

  const commit = (i, key) => {
    const raw = drafts[i]?.[key];
    let numeric = parseLocaleNumber(raw);
    if (!Number.isFinite(numeric)) {
      const parsed = parseDimension(raw);
      numeric = Number.isFinite(parsed) ? parsed : NaN;
    }
    if (!Number.isFinite(numeric)) {
      setErrors((e) => ({ ...e, [`${i}-${key}`]: "Invalid number" }));
      return;
    }

    const cm = unit === "cm" ? numeric : toCm(numeric);
    const [min, max] = key === "width" ? [20, 300] : [30, 128];
    if (cm < min || cm > max) {
      setErrors((e) => ({ ...e, [`${i}-${key}`]: `Must be ${min}–${max} cm` }));
      const stored = plates[i][key];
      const show = unit === "cm" ? stored : toInches(stored);
      setDrafts((prev) => {
        const next = prev.slice();
        next[i] = { ...next[i], [key]: fmt(show, locale, 2) };
        return next;
      });
      return;
    }

    setErrors((e) => {
      const x = { ...e };
      delete x[`${i}-${key}`];
      return x;
    });

    clearForPlate(i);
    updatePlate(i, key, cm);

    const show = unit === "cm" ? cm : toInches(cm);
    setDrafts((prev) => {
      const next = prev.slice();
      next[i] = { ...next[i], [key]: fmt(show, locale, 2) };
      return next;
    });
  };

  const remove = (idx) => {
    removePlate(idx);
    shiftAfterPlateRemoved(idx);
  };

  return (
    <div className="flex flex-col bg-white rounded-lg shadow-sm">
      <div className="p-4 shrink-0 flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-black tracking-tight">
          Maße. <span className="font-semibold">Eingeben.</span>
        </h2>
        {/* Single global cm/in toggle lives here */}
        <UnitToggle unit={unit} onChange={setGlobalUnit} />
      </div>

      <div className="p-4 pt-2 space-y-4">
        {drafts.map((plate, i) => (
          <PlateCard
            key={i}
            index={i}
            plate={plate}
            isActive={i === activeIndex}
            wErr={errors[`${i}-width`]}
            hErr={errors[`${i}-height`]}
            unit={unit}
            locale={locale}
            onFocus={setActiveIndex}
            onChange={onChange}
            onBlur={commit}
            canRemove={drafts.length > 1}
            onRemove={remove}
          />
        ))}

        <div className="pb-2 shrink-0 flex justify-end">
          <button
            onClick={addPlate}
            type="button"
            className="inline-flex items-center gap-2 px-4 md:px-5 py-2.5 md:py-3 rounded-xl border border-green-500 text-green-600 font-semibold hover:bg-green-50"
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
