export default function CountDirection({
  dir,
  count,
  onChangeDir,
  onChangeCount,
}) {
  return (
    <div className="mb-4">
      <div className="text-sm font-medium mb-2">
        Bestimme Anzhal und Ausrichtung der Steckdosen
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-200 pt-3 pb-3 pl-2 pr-4 rounded-lg">
        <div className="min-w-0">
          <div className="text-sm font-medium mb-2">Anzahl</div>
          <div className="inline-flex rounded-lg border border-gray-200 bg-gray-200 overflow-hidden">
            {[1, 2, 3, 4, 5].map((n) => {
              const active = count === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => onChangeCount(n)}
                  className={`px-4 h-9 text-sm font-semibold transition ${
                    active
                      ? "bg-emerald-500 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-w-0">
          <div className="text-sm font-medium mb-2">Steckdosen-Ausrichtung</div>
          <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
            {[
              { k: "h", label: "Horizontal" },
              { k: "v", label: "Vertikal" },
            ].map((opt) => {
              const active = dir === opt.k;
              return (
                <button
                  key={opt.k}
                  type="button"
                  onClick={() => onChangeDir(opt.k)}
                  className={`px-4 h-9 text-sm font-semibold transition ${
                    active
                      ? "bg-emerald-500 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
