import { useState, useCallback, useMemo, useEffect } from "react";
import chroma from "chroma-js";
import { OUTFIT_TEMPLATES } from "../engine/wardrobeTemplates";
import { getWardrobeItem, getWardrobeByCategory, WARDROBE_CATEGORY_LABELS } from "../engine/wardrobeCatalog";
import type { WardrobeCategory } from "../engine/wardrobeCatalog";
import type { RoomItem } from "../engine/roomTemplates";
import { autoFillWardrobe } from "../engine/wardrobeAssigner";
import {
  computeHarmonyScore,
  itemScoreDelta,
  FILL_LABELS,
  FILL_DESCRIPTIONS,
} from "../engine/roomAssigner";
import type { FillAlgorithm } from "../engine/roomAssigner";
import { RoomItemRow } from "./RoomItemRow";

interface Suggestion {
  colors: chroma.Color[];
  pinned: boolean;
}

interface WardrobeTabProps {
  pinnedSuggestions: Suggestion[];
  baseColors: chroma.Color[];
}

let nextItemId = 5000;

const ALGORITHMS = Object.keys(FILL_LABELS) as FillAlgorithm[];

function instantiateOutfit(templateIdx: number): RoomItem[] {
  const template = OUTFIT_TEMPLATES[templateIdx];
  return template.items.map((name) => {
    const wi = getWardrobeItem(name);
    return {
      id: nextItemId++,
      name,
      color: null,
      weight: wi?.weight ?? 5,
      tendency: "any" as const,
    };
  });
}

export function WardrobeTab({ pinnedSuggestions, baseColors }: WardrobeTabProps) {
  const [outfitItems, setOutfitItems] = useState<RoomItem[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedPaletteIdx, setSelectedPaletteIdx] = useState<number>(-1);
  const [fillAlgorithm, setFillAlgorithm] = useState<FillAlgorithm>("surface-area");
  const [manuallyAssigned, setManuallyAssigned] = useState<Set<number>>(new Set());
  const [showCatalog, setShowCatalog] = useState(false);

  useEffect(() => {
    if (selectedPaletteIdx === -1 && pinnedSuggestions.length > 0) {
      setSelectedPaletteIdx(0);
    }
  }, [pinnedSuggestions.length, selectedPaletteIdx]);

  const handleTemplateChange = (value: string) => {
    setSelectedTemplate(value);
    setManuallyAssigned(new Set());
    const last = OUTFIT_TEMPLATES.length - 1;
    if (value === String(last)) {
      // "Custom Outfit" — empty
      setOutfitItems([]);
    } else {
      const idx = parseInt(value, 10);
      if (!isNaN(idx) && idx >= 0 && idx < OUTFIT_TEMPLATES.length) {
        setOutfitItems(instantiateOutfit(idx));
      }
    }
  };

  const handleAddItem = (name: string, weight: number) => {
    setOutfitItems((prev) => [
      ...prev,
      { id: nextItemId++, name, color: null, weight, tendency: "any" as const },
    ]);
    setShowCatalog(false);
  };

  const handleAddCustomItem = () => {
    handleAddItem("New Item", 5);
  };

  const handleUpdateItem = useCallback((updated: RoomItem) => {
    setOutfitItems((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
    if (updated.color !== null) {
      setManuallyAssigned((prev) => new Set(prev).add(updated.id));
    } else {
      setManuallyAssigned((prev) => {
        const next = new Set(prev);
        next.delete(updated.id);
        return next;
      });
    }
  }, []);

  const handleRemoveItem = useCallback((id: number) => {
    setOutfitItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const activePalette: chroma.Color[] = useMemo(() => {
    const colors = [...baseColors];
    if (selectedPaletteIdx >= 0 && selectedPaletteIdx < pinnedSuggestions.length) {
      colors.push(...pinnedSuggestions[selectedPaletteIdx].colors);
    }
    return colors;
  }, [baseColors, pinnedSuggestions, selectedPaletteIdx]);

  const handleAutoFill = () => {
    if (activePalette.length === 0) return;
    const cleared = outfitItems.map((item) =>
      manuallyAssigned.has(item.id) ? item : { ...item, color: null }
    );
    const filled = autoFillWardrobe(cleared, activePalette);
    setOutfitItems(filled);
  };

  const handleClearAssignments = () => {
    setOutfitItems((prev) => prev.map((item) => ({ ...item, color: null })));
    setManuallyAssigned(new Set());
  };

  const assignedItems = useMemo(
    () => outfitItems.filter((item) => item.color !== null),
    [outfitItems]
  );

  const assignedColors = useMemo(
    () => assignedItems.map((item) => item.color!),
    [assignedItems]
  );

  const assignedWeights = useMemo(
    () => assignedItems.map((item) => item.weight),
    [assignedItems]
  );

  const harmonyScore = useMemo(
    () => computeHarmonyScore(assignedColors, fillAlgorithm, activePalette, assignedWeights),
    [assignedColors, fillAlgorithm, activePalette, assignedWeights]
  );

  const itemDeltas = useMemo(() => {
    const map = new Map<number, number | null>();
    for (const item of outfitItems) {
      if (item.color === null || assignedColors.length < 2) {
        map.set(item.id, null);
      } else {
        map.set(
          item.id,
          itemScoreDelta(
            item.color,
            assignedColors,
            fillAlgorithm,
            activePalette,
            assignedWeights,
            item.weight
          )
        );
      }
    }
    return map;
  }, [outfitItems, assignedColors, fillAlgorithm, activePalette, assignedWeights]);

  const allDeltas = Array.from(itemDeltas.values()).filter(
    (d): d is number => d !== null
  );
  const avgDelta =
    allDeltas.length > 0
      ? allDeltas.reduce((s, d) => s + d, 0) / allDeltas.length
      : 0;

  const unassignedCount = outfitItems.filter((item) => item.color === null).length;
  const assignedCount = assignedColors.length;
  const canFill = activePalette.length > 0 && outfitItems.length > 0;

  return (
    <div>
      {pinnedSuggestions.length === 0 && baseColors.length === 0 && (
        <div className="empty-state" style={{ marginBottom: 24 }}>
          <p className="empty-state-text">
            Go to the Palette tab first to create and pin a color palette.
            Then come back here to build outfits.
          </p>
        </div>
      )}

      <section className="room-selector-section">
        <div className="room-selector-row">
          <div className="control-group">
            <label className="control-label" htmlFor="outfit-template">
              Outfit
            </label>
            <select
              id="outfit-template"
              className="control-select"
              value={selectedTemplate}
              onChange={(e) => handleTemplateChange(e.target.value)}
            >
              <option value="" disabled>
                Choose an outfit...
              </option>
              {OUTFIT_TEMPLATES.map((t, i) => (
                <option key={i} value={String(i)}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label className="control-label" htmlFor="outfit-palette-select">
              Palette
            </label>
            <select
              id="outfit-palette-select"
              className="control-select"
              value={selectedPaletteIdx}
              onChange={(e) => setSelectedPaletteIdx(Number(e.target.value))}
            >
              <option value={-1}>
                {baseColors.length > 0
                  ? `Base colors only (${baseColors.length})`
                  : "No colors yet"}
              </option>
              {pinnedSuggestions.map((_, i) => (
                <option key={i} value={i}>
                  Pinned Suggestion {i + 1}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {assignedCount >= 2 && (
        <div className="harmony-score-bar">
          <div className="harmony-score-label">Outfit Harmony</div>
          <div className="harmony-score-track">
            <div
              className="harmony-score-fill"
              style={{ width: `${harmonyScore}%` }}
            />
          </div>
          <div className="harmony-score-value">{harmonyScore}</div>
        </div>
      )}

      {(outfitItems.length > 0 || selectedTemplate !== "") && (
        <section className="room-items-section">
          <div className="section-header">
            <h2>Outfit</h2>
            <div className="section-header-actions">
              {assignedCount > 0 && (
                <button className="btn-clear" onClick={handleClearAssignments}>
                  Clear Colors
                </button>
              )}
              <button className="btn-add" onClick={() => setShowCatalog(!showCatalog)}>
                + Add Item
              </button>
            </div>
          </div>

          {showCatalog && (
            <div className="item-catalog">
              {(Object.keys(WARDROBE_CATEGORY_LABELS) as WardrobeCategory[]).map((cat) => {
                const items = getWardrobeByCategory()[cat];
                const existing = new Set(outfitItems.map((i) => i.name.toLowerCase()));
                const available = items.filter(
                  (i) => !existing.has(i.name.toLowerCase())
                );
                if (available.length === 0) return null;
                return (
                  <div key={cat} className="item-catalog-group">
                    <span className="item-catalog-label">
                      {WARDROBE_CATEGORY_LABELS[cat]}
                    </span>
                    <div className="item-catalog-items">
                      {available.map((ci) => (
                        <button
                          key={ci.name}
                          className="item-catalog-btn"
                          onClick={() => handleAddItem(ci.name, ci.weight)}
                          title={`Visual weight: ${ci.weight}/10`}
                        >
                          {ci.name}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              <div className="item-catalog-group">
                <button
                  className="item-catalog-btn item-catalog-custom"
                  onClick={handleAddCustomItem}
                >
                  + Custom item…
                </button>
              </div>
            </div>
          )}

          <div className="room-items-list">
            {outfitItems.map((item) => {
              const otherItems = assignedItems.filter((ai) => ai.id !== item.id);
              const otherColors = otherItems.map((ai) => ai.color!);
              const otherWeights = otherItems.map((ai) => ai.weight);
              return (
                <RoomItemRow
                  key={item.id}
                  item={item}
                  palette={activePalette}
                  otherRoomColors={otherColors}
                  otherRoomWeights={otherWeights}
                  algorithm={fillAlgorithm}
                  scoreDelta={itemDeltas.get(item.id) ?? null}
                  avgDelta={avgDelta}
                  onUpdate={handleUpdateItem}
                  onRemove={() => handleRemoveItem(item.id)}
                />
              );
            })}
          </div>

          {outfitItems.length > 0 && activePalette.length > 0 && (
            <div className="autofill-controls">
              <select
                className="control-select autofill-algo"
                value={fillAlgorithm}
                onChange={(e) => setFillAlgorithm(e.target.value as FillAlgorithm)}
                title={FILL_DESCRIPTIONS[fillAlgorithm]}
              >
                {ALGORITHMS.map((a) => (
                  <option key={a} value={a}>
                    {FILL_LABELS[a]}
                  </option>
                ))}
              </select>
              <button
                className="btn-generate btn-autofill"
                onClick={handleAutoFill}
                disabled={!canFill}
              >
                {activePalette.length === 0
                  ? "No palette selected"
                  : unassignedCount > 0
                    ? `Auto-Fill ${unassignedCount} Item${unassignedCount > 1 ? "s" : ""}`
                    : "Re-Fill"}
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
