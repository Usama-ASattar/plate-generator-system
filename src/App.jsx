import PlatePreview from "./components/preview/PlatePreview";
import PlateControls from "./components/plates/PlateControls";
import SocketControls from "./components/sockets/SocketControls";
import "./index.css";

function App() {
  return (
    <div className="min-h-dvh bg-white px-4 md:px-6 py-4 md:py-6 flex flex-col">
      {/* Main row: preview + controls */}
      <div className="flex-1 min-h-0">
        <div className="h-[92dvh] flex flex-col md:flex-row gap-4 md:gap-6">
          {/* LEFT: Preview (fixed height on mobile, full height on desktop) */}
          <div className="h-[50dvh] md:h-full md:flex-[3] min-h-0 overflow-hidden">
            <PlatePreview verticalAlign="bottom" />
          </div>

          {/* RIGHT: One scrollable column (PlateControls + SocketControls) */}
          <aside className="flex-1 md:flex-[2] md:h-full min-h-0 overflow-hidden">
            <div className="h-full min-h-0 flex flex-col gap-4 overflow-y-auto pr-1">
              <PlateControls />
              <SocketControls />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default App;
