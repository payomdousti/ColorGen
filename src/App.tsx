import { useState } from "react";
import chroma from "chroma-js";
import { PaletteTab } from "./components/PaletteTab";
import type { Suggestion } from "./components/PaletteTab";
import { RoomTab } from "./components/RoomTab";
import "./App.css";

type TabId = "palette" | "room";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("palette");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [baseColors, setBaseColors] = useState<chroma.Color[]>([]);

  const pinnedSuggestions = suggestions.filter((s) => s.pinned);

  return (
    <div className="app">
      <header className="app-header">
        <h1>ColorGen</h1>
        <p className="app-subtitle">
          Create a personal color palette and plan your rooms.
        </p>
      </header>

      <nav className="tab-bar">
        <button
          className={`tab-btn ${activeTab === "palette" ? "active" : ""}`}
          onClick={() => setActiveTab("palette")}
        >
          Palette
        </button>
        <button
          className={`tab-btn ${activeTab === "room" ? "active" : ""}`}
          onClick={() => setActiveTab("room")}
        >
          Room Planner
          {pinnedSuggestions.length > 0 && (
            <span className="tab-badge">{pinnedSuggestions.length}</span>
          )}
        </button>
      </nav>

      <div className="tab-content" style={{ position: "relative" }}>
        <div className={activeTab === "palette" ? "tab-panel-active" : "tab-panel-hidden"}>
          <PaletteTab
            suggestions={suggestions}
            onSuggestionsChange={setSuggestions}
            onBaseColorsChange={setBaseColors}
          />
        </div>
        <div className={activeTab === "room" ? "tab-panel-active" : "tab-panel-hidden"}>
          <RoomTab
            pinnedSuggestions={pinnedSuggestions}
            baseColors={baseColors}
          />
        </div>
      </div>
    </div>
  );
}
