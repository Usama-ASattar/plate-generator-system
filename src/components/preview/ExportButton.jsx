export default function ExportButton({ onExport }) {
  return (
    <button
      type="button"
      onClick={onExport}
      className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
      title="Als PNG speichern"
    >
      PNG exportieren
      <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
        <path
          d="M10 3v8m0 0l3-3m-3 3L7 8m9 6v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
