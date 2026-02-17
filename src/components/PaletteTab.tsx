import { useState, useCallback, useEffect } from "react";
import chroma from "chroma-js";
import { ColorInput } from "./ColorInput";
import { HarmonySelector } from "./HarmonySelector";
import { SwatchStrip } from "./SwatchStrip";
import type { SwatchItem } from "./SwatchStrip";
import { generateMultiplePalettes } from "../engine/harmonies";
import type { HarmonyMode } from "../engine/harmonies";
import { parseColor } from "../engine/parser";

export interface Suggestion {
  colors: chroma.Color[];
  pinned: boolean;
}

interface PaletteEntry {
  color: chroma.Color | null;
  locked: boolean;
  id: number;
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

interface PaletteTabProps {
  suggestions: Suggestion[];
  onSuggestionsChange: (suggestions: Suggestion[]) => void;
  onBaseColorsChange: (colors: chroma.Color[]) => void;
}

export function PaletteTab({
  suggestions,
  onSuggestionsChange,
  onBaseColorsChange,
}: PaletteTabProps) {
  const [entries, setEntries] = useState<PaletteEntry[]>(() => [
    createEntry("#8B7355"),
    createEntry("#E8E0D4"),
  ]);
  const [harmonyMode, setHarmonyMode] = useState<HarmonyMode>("analogous");
  const [colorCount, setColorCount] = useState(4);
  const [suggestionCount, setSuggestionCount] = useState(3);
  const [csvValue, setCsvValue] = useState("");
  const [csvError, setCsvError] = useState("");

  // Sync base colors on mount
  useEffect(() => {
    syncBaseColors(entries);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncBaseColors = (newEntries: PaletteEntry[]) => {
    const colors = newEntries
      .filter((e) => e.locked && e.color !== null)
      .map((e) => e.color!);
    onBaseColorsChange(colors);
  };

  const updateEntries = (newEntries: PaletteEntry[]) => {
    setEntries(newEntries);
    syncBaseColors(newEntries);
  };

  const handleColorChange = useCallback(
    (id: number, color: chroma.Color | null) => {
      setEntries((prev) => {
        const next = prev.map((e) => (e.id === id ? { ...e, color } : e));
        const colors = next
          .filter((e) => e.locked && e.color !== null)
          .map((e) => e.color!);
        onBaseColorsChange(colors);
        return next;
      });
    },
    [onBaseColorsChange]
  );

  const handleToggleLock = useCallback(
    (id: number) => {
      setEntries((prev) => {
        const next = prev.map((e) =>
          e.id === id ? { ...e, locked: !e.locked } : e
        );
        const colors = next
          .filter((e) => e.locked && e.color !== null)
          .map((e) => e.color!);
        onBaseColorsChange(colors);
        return next;
      });
    },
    [onBaseColorsChange]
  );

  const handleRemove = useCallback(
    (id: number) => {
      setEntries((prev) => {
        const next = prev.filter((e) => e.id !== id);
        const colors = next
          .filter((e) => e.locked && e.color !== null)
          .map((e) => e.color!);
        onBaseColorsChange(colors);
        return next;
      });
    },
    [onBaseColorsChange]
  );

  const handleAdd = () => {
    setEntries((prev) => [...prev, createEntry()]);
  };

  const handleCsvImport = () => {
    const raw = csvValue.trim();
    if (!raw) {
      setCsvError("Paste some colors first.");
      return;
    }

    const tokens = raw
      .split(/[,;\n]+/)
      .map((t) => t.trim())
      .filter(Boolean);

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
      setCsvError(
        `Could not parse any colors. Failed: ${failed.join(", ")}`
      );
      return;
    }

    const newEntries = parsed.map((c) => createEntryFromColor(c));
    updateEntries(newEntries);
    onSuggestionsChange([]);
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

    const pinned = suggestions.filter((s) => s.pinned);
    const slotsToFill = suggestionCount - pinned.length;

    if (slotsToFill <= 0) return;

    const seed = Date.now();
    const freshPalettes = generateMultiplePalettes(
      lockedColors,
      harmonyMode,
      colorCount,
      slotsToFill,
      seed
    );

    let freshIdx = 0;
    let newSuggestions: Suggestion[] = [];

    if (suggestions.length === 0) {
      for (const colors of freshPalettes) {
        newSuggestions.push({ colors, pinned: false });
      }
    } else {
      for (const s of suggestions) {
        if (s.pinned) {
          newSuggestions.push(s);
        } else if (freshIdx < freshPalettes.length) {
          newSuggestions.push({
            colors: freshPalettes[freshIdx],
            pinned: false,
          });
          freshIdx++;
        }
      }
      while (freshIdx < freshPalettes.length) {
        newSuggestions.push({
          colors: freshPalettes[freshIdx],
          pinned: false,
        });
        freshIdx++;
      }
    }

    onSuggestionsChange(newSuggestions);
  };

  const handleTogglePin = (idx: number) => {
    onSuggestionsChange(
      suggestions.map((s, i) =>
        i === idx ? { ...s, pinned: !s.pinned } : s
      )
    );
  };

  const handleRemoveSuggestion = (idx: number) => {
    onSuggestionsChange(suggestions.filter((_, i) => i !== idx));
  };

  const lockedSwatches: SwatchItem[] = entries
    .filter((e) => e.color !== null)
    .map((e) => ({ color: e.color!, locked: e.locked }));

  const pinnedCount = suggestions.filter((s) => s.pinned).length;

  return (
    <div>
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
            placeholder={
              "#8B7355, #E8E0D4, #4A6741, steelblue\nor one per line"
            }
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
              onClick={() => {
                updateEntries([]);
                onSuggestionsChange([]);
              }}
              title="Clear all colors"
              disabled={entries.length === 0}
            >
              Clear All
            </button>
            <button
              className="btn-add"
              onClick={handleAdd}
              title="Add a color"
            >
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
            ...suggestion.colors.map((c) => ({
              color: c,
              locked: false,
            })),
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
                    title={
                      suggestion.pinned
                        ? "Unpin suggestion"
                        : "Pin suggestion"
                    }
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
