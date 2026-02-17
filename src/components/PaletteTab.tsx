import { useState, useCallback, useEffect, useImperativeHandle, forwardRef } from "react";
import chroma from "chroma-js";
import { ColorInput } from "./ColorInput";
import { HarmonySelector } from "./HarmonySelector";
import { SwatchStrip } from "./SwatchStrip";
import type { SwatchItem } from "./SwatchStrip";
import { generateMultiplePalettes } from "../engine/harmonies";
import type { HarmonyMode } from "../engine/harmonies";
import { parseColor } from "../engine/parser";
import {
  serializeEntries,
  serializeSuggestions,
  deserializeEntries,
} from "../engine/persistence";
import type { AppState } from "../engine/persistence";

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
  savedState?: AppState | null;
}

export interface PaletteTabHandle {
  getState: () => {
    entries: ReturnType<typeof serializeEntries>;
    suggestions: ReturnType<typeof serializeSuggestions>;
    harmonyMode: string;
    colorCount: number;
    suggestionCount: number;
  };
}

export const PaletteTab = forwardRef<PaletteTabHandle, PaletteTabProps>(function PaletteTab({
  suggestions,
  onSuggestionsChange,
  onBaseColorsChange,
  savedState,
}, ref) {
  const [entries, setEntries] = useState<PaletteEntry[]>(() => {
    if (savedState?.entries?.length) {
      const restored = deserializeEntries(savedState.entries);
      nextId = Math.max(nextId, ...restored.map((e) => e.id + 1));
      return restored as PaletteEntry[];
    }
    return [];
  });
  const [harmonyMode, setHarmonyMode] = useState<HarmonyMode>(
    (savedState?.harmonyMode as HarmonyMode) ?? "analogous"
  );
  const [colorCount, setColorCount] = useState(savedState?.colorCount ?? 4);
  const [suggestionCount, setSuggestionCount] = useState(savedState?.suggestionCount ?? 3);
  const [csvValue, setCsvValue] = useState("");
  const [csvError, setCsvError] = useState("");

  useImperativeHandle(ref, () => ({
    getState: () => ({
      entries: serializeEntries(entries),
      suggestions: serializeSuggestions(suggestions),
      harmonyMode,
      colorCount,
      suggestionCount,
    }),
  }));

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

  const hasColors = entries.length > 0;

  return (
    <div>
      {/* Your Colors */}
      <section className="locked-colors-section">
        <div className="section-header">
          <h2>Your Base Colors</h2>
          <div className="section-header-actions">
            {hasColors && (
              <button
                className="btn-clear"
                onClick={() => {
                  updateEntries([]);
                  onSuggestionsChange([]);
                }}
                title="Clear all colors"
              >
                Clear All
              </button>
            )}
            <button
              className="btn-add"
              onClick={handleAdd}
              title="Add a color"
            >
              + Add Color
            </button>
          </div>
        </div>

        {!hasColors && suggestions.length === 0 && (
          <div className="empty-state">
            <p className="empty-state-text">
              Add colors you already have, paste a list of hex codes, or generate a random palette to start exploring.
            </p>
            <div className="empty-state-actions">
              <button className="btn-add" onClick={handleAdd}>
                + Add a Color
              </button>
              <button className="btn-generate" onClick={handleGenerate}>
                Generate Random
              </button>
            </div>
            <div className="csv-inline">
              <textarea
                className="csv-input"
                placeholder={"Paste hex codes: #B5651D, #F5F0E8, #9CAF88"}
                value={csvValue}
                onChange={(e) => {
                  setCsvValue(e.target.value);
                  setCsvError("");
                }}
                rows={2}
                spellCheck={false}
              />
              <button className="btn-import" onClick={handleCsvImport}>
                Import
              </button>
            </div>
            {csvError && <p className="csv-error">{csvError}</p>}
          </div>
        )}

        {hasColors && (
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
        )}
      </section>

      {/* CSV Import - collapsible, secondary */}
      {hasColors && (
        <details className="csv-details">
          <summary className="csv-summary">Bulk import colors (CSV)</summary>
          <div className="csv-section">
            <p className="csv-hint">
              Paste hex codes, LAB values, or color names separated by commas.
              This replaces all your current colors.
            </p>
            <div className="csv-row">
              <textarea
                className="csv-input"
                placeholder={"#B5651D, #F5F0E8, #9CAF88\nor one per line"}
                value={csvValue}
                onChange={(e) => {
                  setCsvValue(e.target.value);
                  setCsvError("");
                }}
                rows={2}
                spellCheck={false}
              />
              <button className="btn-import" onClick={handleCsvImport}>
                Import
              </button>
            </div>
            {csvError && <p className="csv-error">{csvError}</p>}
          </div>
        </details>
      )}

      {/* Generation controls */}
      {(hasColors || suggestions.length > 0) && (
        <HarmonySelector
          mode={harmonyMode}
          count={colorCount}
          suggestions={suggestionCount}
          onModeChange={setHarmonyMode}
          onCountChange={setColorCount}
          onSuggestionsChange={setSuggestionCount}
          onGenerate={handleGenerate}
        />
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <section className="palette-section">
          <h2>
            Suggestions ({suggestions.length}{pinnedCount > 0 ? `, ${pinnedCount} pinned` : ""})
          </h2>
          <p className="palette-hint">
            Pin a palette you like, then use it in the Room Planner tab.
          </p>

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
    )}
    </div>
  );
});
