export default function SocketsHeader({ enabled, onToggle }) {
  return (
    <div className="px-4 pb-3">
      <div className="w-full rounded-2xl border border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="font-medium">Ausschnitte für Steckdosen angeben?</div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={onToggle}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
            enabled ? "bg-emerald-500" : "bg-gray-300"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
              enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
