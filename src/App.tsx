import { useState, useCallback } from "react";
import chroma from "chroma-js";
import { ColorInput } from "./components/ColorInput";
import { HarmonySelector } from "./components/HarmonySelector";
import { SwatchStrip } from "./components/SwatchStrip";
import type { SwatchItem } from "./components/SwatchStrip";
import { generateMultiplePalettes } from "./engine/harmonies";
import type { HarmonyMode } from "./engine/harmonies";
import { parseColor } from "./engine/parser";
import "./App.css";

interface PaletteEntry {
  color: chroma.Color | null;
  locked: boolean;
  id: number;
}

interface Suggestion {
  colors: chroma.Color[];
  pinned: boolean;
}

let nextId = 1;

function createEntry(hex?: string): PaletteEntry {
  return {
    color: hex ? chroma(hex) : null,
    locked: true,
    id: nextId++,
  };
}

function createEntryFromColor(color: chroma.Color): PaletteEntry {
  return {
    color,
    locked: true,
    id: nextId++,
  };
}

export default function App() {
  const [entries, setEntries] = useState<PaletteEntry[]>([
    createEntry("#8B7355"),
    createEntry("#E8E0D4"),
  ]);
  const [harmonyMode, setHarmonyMode] = useState<HarmonyMode>("analogous");
  const [colorCount, setColorCount] = useState(4);
  const [suggestionCount, setSuggestionCount] = useState(3);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [csvValue, setCsvValue] = useState("");
  const [csvError, setCsvError] = useState("");

  const handleColorChange = useCallback(
    (id: number, color: chroma.Color | null) => {
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, color } : e))
      );
    },
    []
  );

  const handleToggleLock = useCallback((id: number) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, locked: !e.locked } : e))
    );
  }, []);

  const handleRemove = useCallback((id: number) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const handleAdd = () => {
    setEntries((prev) => [...prev, createEntry()]);
  };

  const handleCsvImport = () => {
    const raw = csvValue.trim();
    if (!raw) {
      setCsvError("Paste some colors first.");
      return;
    }

    const tokens = raw.split(/[,;\n]+/).map((t) => t.trim()).filter(Boolean);

    const parsed: chroma.Color[] = [];
    const failed: string[] = [];

    for (const token of tokens) {
      const color = parseColor(token);
      if (color) {
        parsed.push(color);
      } else {
        failed.push(token);
      }
    }

    if (parsed.length === 0) {
      setCsvError(`Could not parse any colors. Failed: ${failed.join(", ")}`);
      return;
    }

    const newEntries = parsed.map((c) => createEntryFromColor(c));
    setEntries(newEntries);
    setSuggestions([]);
    setCsvError(
      failed.length > 0
        ? `Imported ${parsed.length} colors. Could not parse: ${failed.join(", ")}`
        : ""
    );
    setCsvValue("");
  };

  const handleGenerate = () => {
    const lockedColors = entries
      .filter((e) => e.locked && e.color !== null)
      .map((e) => e.color!);

    if (lockedColors.length === 0) return;

    // Count how many unpinned slots we need to fill
    const pinned = suggestions.filter((s) => s.pinned);
    const slotsToFill = suggestionCount - pinned.length;

    let newSuggestions: Suggestion[];

    if (slotsToFill <= 0) {
      // All slots are pinned, nothing to regenerate
      return;
    }

    const seed = Date.now();
    const freshPalettes = generateMultiplePalettes(
      lockedColors,
      harmonyMode,
      colorCount,
      slotsToFill,
      seed
    );

    // Rebuild: keep pinned in place, fill unpinned slots with fresh palettes
    let freshIdx = 0;
    newSuggestions = [];

    if (suggestions.length === 0) {
      // First generation: all fresh
      for (const colors of freshPalettes) {
        newSuggestions.push({ colors, pinned: false });
      }
    } else {
      // Subsequent: preserve pinned, replace unpinned
      for (const s of suggestions) {
        if (s.pinned) {
          newSuggestions.push(s);
        } else if (freshIdx < freshPalettes.length) {
          newSuggestions.push({ colors: freshPalettes[freshIdx], pinned: false });
          freshIdx++;
        }
      }
      // If suggestion count increased, add remaining fresh palettes
      while (freshIdx < freshPalettes.length) {
        newSuggestions.push({ colors: freshPalettes[freshIdx], pinned: false });
        freshIdx++;
      }
    }

    setSuggestions(newSuggestions);
  };

  const handleTogglePin = (idx: number) => {
    setSuggestions((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, pinned: !s.pinned } : s))
    );
  };

  const handleRemoveSuggestion = (idx: number) => {
    setSuggestions((prev) => prev.filter((_, i) => i !== idx));
  };

  // Build locked swatches (shared across all suggestions)
  const lockedSwatches: SwatchItem[] = entries
    .filter((e) => e.color !== null)
    .map((e) => ({ color: e.color!, locked: e.locked }));

  const pinnedCount = suggestions.filter((s) => s.pinned).length;

  return (
    <div className="app">
      <header className="app-header">
        <h1>ColorGen</h1>
        <p className="app-subtitle">
          Lock your base colors, choose a harmony mode, and generate palette
          suggestions.
        </p>
      </header>

      {/* CSV Import */}
      <section className="csv-section">
        <div className="section-header">
          <h2>Import Colors</h2>
        </div>
        <p className="csv-hint">
          Paste a comma-separated list of colors (hex, LAB, or named). This
          replaces your entire color set.
        </p>
        <div className="csv-row">
          <textarea
            className="csv-input"
            placeholder={"#8B7355, #E8E0D4, #4A6741, steelblue\nor one per line"}
            value={csvValue}
            onChange={(e) => {
              setCsvValue(e.target.value);
              setCsvError("");
            }}
            rows={3}
            spellCheck={false}
          />
          <button className="btn-import" onClick={handleCsvImport}>
            Import
          </button>
        </div>
        {csvError && <p className="csv-error">{csvError}</p>}
      </section>

      {/* Individual color cards */}
      <section className="locked-colors-section">
        <div className="section-header">
          <h2>Your Colors</h2>
          <div className="section-header-actions">
            <button
              className="btn-clear"
              onClick={() => { setEntries([]); setSuggestions([]); }}
              title="Clear all colors"
              disabled={entries.length === 0}
            >
              Clear All
            </button>
            <button className="btn-add" onClick={handleAdd} title="Add a color">
              + Add Color
            </button>
          </div>
        </div>
        <div className="color-inputs-grid">
          {entries.map((entry) => (
            <ColorInput
              key={entry.id}
              color={entry.color}
              locked={entry.locked}
              onColorChange={(c) => handleColorChange(entry.id, c)}
              onToggleLock={() => handleToggleLock(entry.id)}
              onRemove={() => handleRemove(entry.id)}
            />
          ))}
        </div>
      </section>

      <HarmonySelector
        mode={harmonyMode}
        count={colorCount}
        suggestions={suggestionCount}
        onModeChange={setHarmonyMode}
        onCountChange={setColorCount}
        onSuggestionsChange={setSuggestionCount}
        onGenerate={handleGenerate}
      />

      <section className="palette-section">
        <h2>
          {suggestions.length > 0
            ? `Suggestions (${suggestions.length}${pinnedCount > 0 ? `, ${pinnedCount} pinned` : ""})`
            : "Palette"}
        </h2>

        {suggestions.length === 0 && (
          <SwatchStrip swatches={lockedSwatches} />
        )}

        {suggestions.map((suggestion, idx) => {
          const swatches: SwatchItem[] = [
            ...lockedSwatches,
            ...suggestion.colors.map((c) => ({ color: c, locked: false })),
          ];

          return (
            <div
              key={idx}
              className={`suggestion-card ${suggestion.pinned ? "suggestion-pinned" : ""}`}
            >
              <div className="suggestion-header">
                <span className="suggestion-label">
                  Suggestion {idx + 1}
                  {suggestion.pinned && (
                    <span className="pinned-badge">pinned</span>
                  )}
                </span>
                <div className="suggestion-actions">
                  <button
                    className={`btn-pin ${suggestion.pinned ? "active" : ""}`}
                    onClick={() => handleTogglePin(idx)}
                    title={suggestion.pinned ? "Unpin suggestion" : "Pin suggestion"}
                  >
                    {suggestion.pinned ? "📌" : "📌"}
                    <span className="btn-pin-text">
                      {suggestion.pinned ? "Unpin" : "Pin"}
                    </span>
                  </button>
                  <button
                    className="btn-dismiss"
                    onClick={() => handleRemoveSuggestion(idx)}
                    title="Remove suggestion"
                  >
                    ×
                  </button>
                </div>
              </div>
              <SwatchStrip swatches={swatches} />
            </div>
          );
        })}
      </section>
    </div>
  );
}
