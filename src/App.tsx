import { useState, useEffect, useCallback, useRef } from "react";
import chroma from "chroma-js";
import { PaletteTab } from "./components/PaletteTab";
import type { Suggestion, PaletteTabHandle } from "./components/PaletteTab";
import { RoomTab } from "./components/RoomTab";
import type { RoomTabHandle } from "./components/RoomTab";
import {
  loadState,
  saveState,
  deserializeSuggestions,
} from "./engine/persistence";
import "./App.css";

type TabId = "palette" | "room";

const saved = loadState();

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>(saved?.activeTab ?? "palette");
  const [suggestions, setSuggestions] = useState<Suggestion[]>(
    saved?.suggestions ? deserializeSuggestions(saved.suggestions) : []
  );
  const [baseColors, setBaseColors] = useState<chroma.Color[]>([]);

  const paletteRef = useRef<PaletteTabHandle>(null);
  const roomRef = useRef<RoomTabHandle>(null);

  // Auto-save on any state change
  const save = useCallback(() => {
    const paletteState = paletteRef.current?.getState();
    const roomState = roomRef.current?.getState();
    saveState({
      activeTab,
      entries: paletteState?.entries ?? [],
      suggestions: paletteState?.suggestions ?? [],
      harmonyMode: paletteState?.harmonyMode ?? "analogous",
      colorCount: paletteState?.colorCount ?? 4,
      suggestionCount: paletteState?.suggestionCount ?? 3,
      roomItems: roomState?.roomItems ?? [],
      selectedTemplate: roomState?.selectedTemplate ?? "",
      fillAlgorithm: roomState?.fillAlgorithm ?? "surface-area",
      manuallyAssigned: roomState?.manuallyAssigned ?? [],
    });
  }, [activeTab]);

  useEffect(() => {
    save();
  }, [activeTab, suggestions, baseColors, save]);

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
            ref={paletteRef}
            suggestions={suggestions}
            onSuggestionsChange={(s) => { setSuggestions(s); requestAnimationFrame(save); }}
            onBaseColorsChange={(c) => { setBaseColors(c); requestAnimationFrame(save); }}
            savedState={saved}
          />
        </div>
        <div className={activeTab === "room" ? "tab-panel-active" : "tab-panel-hidden"}>
          <RoomTab
            ref={roomRef}
            pinnedSuggestions={pinnedSuggestions}
            baseColors={baseColors}
            savedState={saved}
            onStateChange={save}
          />
        </div>
      </div>
    </div>
  );
}
