import PlatePreview from "./components/PlatePreview";
import PlateControls from "./components/PlateControls";
import "./index.css";

function App() {
  return (
    <div className="min-h-dvh bg-white px-4 md:px-6 py-4 md:py-6 flex flex-col">
      {/* Fixed-height row so preview never grows with controls */}
      <div className="flex-1 min-h-0">
        <div className="h-[92dvh] flex flex-col md:flex-row gap-4 md:gap-6">
          {/* Preview - fixed height, never scrolls */}
          <div className="h-[50dvh] md:h-full md:flex-[3] min-h-0 overflow-hidden">
            <PlatePreview verticalAlign="bottom" />
          </div>

          {/* Controls - same fixed height, owns the scroll */}
          <div className="flex-1 md:flex-[2] md:h-full min-h-0 overflow-hidden">
            <PlateControls />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
