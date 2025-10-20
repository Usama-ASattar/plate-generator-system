import React from "react";
import PlatePicker from "./PlatePicker";
import CountDirection from "./CountDirection";
import PositionInputs from "./PositionInputs";

export default function GroupCard({
  index,
  group,
  dimsLabel,
  open,
  onToggleOpen,
  menuOpen,
  onOpenMenu,
  onCloseMenu,
  onRemove,
  plates,
  eligibleFn,
  unit,
  fmt,
  toInches,
  setGroup,
  drafts,
  errors,
  changePos,
  nfEUR,
  pricePerSocket,
}) {
  const g = group;

  return (
    <div className="rounded-2xl border-gray-200 overflow-hidden">
      {/* Header pill with kebab */}
      <div className="px-2">
        <div className="mt-2 mb-2 rounded-full border border-gray-200 bg-white flex items-center justify-between">
          <button
            type="button"
            onClick={onToggleOpen}
            className="flex-1 text-left px-3 py-2 rounded-full hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-gray-900">
                {index + 1}. Rückwand – {dimsLabel}
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-900">
                {g.count}× Steckdose{g.count > 1 ? "n" : ""}{" "}
                <span className="text-gray-500">
                  + {nfEUR.format(g.count * pricePerSocket)}
                </span>
              </span>
            </div>
          </button>

          {/* Kebab */}
          <div className="relative pr-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                menuOpen ? onCloseMenu() : onOpenMenu();
              }}
              className="w-8 h-8 rounded-full text-gray-600 hover:bg-gray-100 flex items-center justify-center"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Optionen"
            >
              <span className="text-lg leading-none">⋮</span>
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 mt-1 w-40 rounded-xl border border-gray-200 bg-white shadow-lg z-10 py-1"
                role="menu"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={onRemove}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  role="menuitem"
                >
                  Entfernen
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Panel */}
      {open && (
        <div className="p-3 md:p-4">
          <PlatePicker
            plates={plates}
            selectedIndex={g.plateIndex}
            eligibleFn={eligibleFn}
            unit={unit}
            fmt={fmt}
            toInches={toInches}
            onSelect={(i) => setGroup(g, { plateIndex: i })}
          />

          <CountDirection
            dir={g.dir}
            count={g.count}
            onChangeDir={(k) => setGroup(g, { dir: k })}
            onChangeCount={(n) => setGroup(g, { count: n })}
          />

          <PositionInputs
            drafts={drafts}
            errors={errors}
            onChangeX={(val) => changePos(g, "x", val)}
            onChangeY={(val) => changePos(g, "y", val)}
          />
        </div>
      )}
    </div>
  );
}
