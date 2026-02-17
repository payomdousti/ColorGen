import { useState, useCallback, useMemo, useEffect, useImperativeHandle, forwardRef } from "react";
import chroma from "chroma-js";
import { ROOM_TEMPLATES } from "../engine/roomTemplates";
import type { RoomItem } from "../engine/roomTemplates";
import { getCatalogByCategory, CATEGORY_LABELS } from "../engine/itemCatalog";
import type { ItemCategory } from "../engine/itemCatalog";
import {
  autoFillRoom,
  computeHarmonyScore,
  itemScoreDelta,
  FILL_LABELS,
  FILL_DESCRIPTIONS,
} from "../engine/roomAssigner";
import type { FillAlgorithm } from "../engine/roomAssigner";
import { RoomItemRow } from "./RoomItemRow";
import { serializeRoomItems, deserializeRoomItems } from "../engine/persistence";
import type { AppState } from "../engine/persistence";

interface Suggestion {
  colors: chroma.Color[];
  pinned: boolean;
}

interface RoomTabProps {
  pinnedSuggestions: Suggestion[];
  baseColors: chroma.Color[];
  savedState?: AppState | null;
  onStateChange?: () => void;
}

export interface RoomTabHandle {
  getState: () => {
    roomItems: ReturnType<typeof serializeRoomItems>;
    selectedTemplate: string;
    fillAlgorithm: string;
    manuallyAssigned: number[];
  };
}

let nextItemId = 1000;

const ALGORITHMS = Object.keys(FILL_LABELS) as FillAlgorithm[];

function instantiateTemplate(templateIdx: number): RoomItem[] {
  const template = ROOM_TEMPLATES[templateIdx];
  return template.items.map((item) => ({
    ...item,
    id: nextItemId++,
  }));
}

export const RoomTab = forwardRef<RoomTabHandle, RoomTabProps>(function RoomTab(
  { pinnedSuggestions, baseColors, savedState, onStateChange },
  ref
) {
  const [roomItems, setRoomItems] = useState<RoomItem[]>(() => {
    if (savedState?.roomItems?.length) {
      const restored = deserializeRoomItems(savedState.roomItems);
      nextItemId = Math.max(nextItemId, ...restored.map((i) => i.id + 1));
      return restored;
    }
    return [];
  });
  const [selectedTemplate, setSelectedTemplate] = useState<string>(savedState?.selectedTemplate ?? "");
  const [selectedPaletteIdx, setSelectedPaletteIdx] = useState<number>(-1);
  const [fillAlgorithm, setFillAlgorithm] = useState<FillAlgorithm>(
    (savedState?.fillAlgorithm as FillAlgorithm) ?? "surface-area"
  );
  const [manuallyAssigned, setManuallyAssigned] = useState<Set<number>>(
    new Set(savedState?.manuallyAssigned ?? [])
  );

  useImperativeHandle(ref, () => ({
    getState: () => ({
      roomItems: serializeRoomItems(roomItems),
      selectedTemplate,
      fillAlgorithm,
      manuallyAssigned: Array.from(manuallyAssigned),
    }),
  }));

  // Trigger save on room state changes
  useEffect(() => {
    onStateChange?.();
  }, [roomItems, selectedTemplate, fillAlgorithm]);

  // Auto-select first pinned palette when one becomes available
  useEffect(() => {
    if (selectedPaletteIdx === -1 && pinnedSuggestions.length > 0) {
      setSelectedPaletteIdx(0);
    }
  }, [pinnedSuggestions.length, selectedPaletteIdx]);

  const handleTemplateChange = (value: string) => {
    setSelectedTemplate(value);
    setManuallyAssigned(new Set());
    if (value === "custom") {
      setRoomItems([]);
    } else {
      const idx = parseInt(value, 10);
      if (!isNaN(idx) && idx >= 0 && idx < ROOM_TEMPLATES.length) {
        setRoomItems(instantiateTemplate(idx));
      }
    }
  };

  const [showCatalog, setShowCatalog] = useState(false);

  const handleAddItem = (name: string, weight: number) => {
    setRoomItems((prev) => [
      ...prev,
      { id: nextItemId++, name, color: null, weight, tendency: "any" as const },
    ]);
    setShowCatalog(false);
  };

  const handleAddCustomItem = () => {
    handleAddItem("New Item", 3);
  };

  const handleUpdateItem = useCallback((updated: RoomItem) => {
    setRoomItems((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
    // If user is assigning/unassigning a color, track it
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
    setRoomItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const activePalette: chroma.Color[] = useMemo(() => {
    const colors = [...baseColors];
    if (
      selectedPaletteIdx >= 0 &&
      selectedPaletteIdx < pinnedSuggestions.length
    ) {
      colors.push(...pinnedSuggestions[selectedPaletteIdx].colors);
    }
    return colors;
  }, [baseColors, pinnedSuggestions, selectedPaletteIdx]);

  const handleAutoFill = () => {
    if (activePalette.length === 0) return;
    // Clear auto-assigned colors first, keep manually assigned ones
    const cleared = roomItems.map((item) =>
      manuallyAssigned.has(item.id) ? item : { ...item, color: null }
    );
    const filled = autoFillRoom(cleared, activePalette, fillAlgorithm);
    setRoomItems(filled);
  };

  const handleClearAssignments = () => {
    setRoomItems((prev) => prev.map((item) => ({ ...item, color: null })));
    setManuallyAssigned(new Set());
  };

  const assignedItems = useMemo(
    () => roomItems.filter((item) => item.color !== null),
    [roomItems]
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

  // Per-item score delta: positive = helping, negative = hurting
  const itemDeltas = useMemo(() => {
    const map = new Map<number, number | null>();
    for (const item of roomItems) {
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
  }, [roomItems, assignedColors, fillAlgorithm, activePalette, assignedWeights]);

  // Average delta across all assigned items (for relative comparison)
  const allDeltas = Array.from(itemDeltas.values()).filter(
    (d): d is number => d !== null
  );
  const avgDelta =
    allDeltas.length > 0
      ? allDeltas.reduce((s, d) => s + d, 0) / allDeltas.length
      : 0;

  const unassignedCount = roomItems.filter(
    (item) => item.color === null
  ).length;
  const assignedCount = assignedColors.length;

  const canFill = activePalette.length > 0 && roomItems.length > 0;

  return (
    <div>
      {/* Guide if no palettes pinned */}
      {pinnedSuggestions.length === 0 && baseColors.length === 0 && (
        <div className="empty-state" style={{ marginBottom: 24 }}>
          <p className="empty-state-text">
            Go to the Palette tab first to create and pin a color palette.
            Then come back here to plan your room.
          </p>
        </div>
      )}

      {/* Room & Palette Selectors */}
      <section className="room-selector-section">
        <div className="room-selector-row">
          <div className="control-group">
            <label className="control-label" htmlFor="room-template">
              Room
            </label>
            <select
              id="room-template"
              className="control-select"
              value={selectedTemplate}
              onChange={(e) => handleTemplateChange(e.target.value)}
            >
              <option value="" disabled>
                Choose a room...
              </option>
              {ROOM_TEMPLATES.map((t, i) => (
                <option key={i} value={String(i)}>
                  {t.name}
                </option>
              ))}
              <option value="custom">Custom Room</option>
            </select>
          </div>

          <div className="control-group">
            <label className="control-label" htmlFor="palette-select">
              Palette
            </label>
            <select
              id="palette-select"
              className="control-select"
              value={selectedPaletteIdx}
              onChange={(e) =>
                setSelectedPaletteIdx(Number(e.target.value))
              }
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

      {/* Harmony Score */}
      {assignedCount >= 2 && (
        <div className="harmony-score-bar">
          <div className="harmony-score-label">
            Room Harmony
          </div>
          <div className="harmony-score-track">
            <div
              className="harmony-score-fill"
              style={{ width: `${harmonyScore}%` }}
            />
          </div>
          <div className="harmony-score-value">
            {harmonyScore}
          </div>
        </div>
      )}

      {/* Room Items */}
      {(roomItems.length > 0 || selectedTemplate !== "") && (
        <section className="room-items-section">
          <div className="section-header">
            <h2>Room Items</h2>
            <div className="section-header-actions">
              {assignedCount > 0 && (
                <button
                  className="btn-clear"
                  onClick={handleClearAssignments}
                >
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
              {(Object.keys(CATEGORY_LABELS) as ItemCategory[]).map((cat) => {
                const items = getCatalogByCategory()[cat];
                const existing = new Set(roomItems.map((i) => i.name.toLowerCase()));
                const available = items.filter(
                  (i) => !existing.has(i.name.toLowerCase())
                );
                if (available.length === 0) return null;
                return (
                  <div key={cat} className="item-catalog-group">
                    <span className="item-catalog-label">{CATEGORY_LABELS[cat]}</span>
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
            {roomItems.map((item) => {
              // Other colors/weights = all assigned items except this one
              const otherItems = assignedItems.filter(
                (ai) => ai.id !== item.id
              );
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

          {/* Auto-fill controls */}
          {roomItems.length > 0 && activePalette.length > 0 && (
            <div className="autofill-controls">
              <select
                className="control-select autofill-algo"
                value={fillAlgorithm}
                onChange={(e) =>
                  setFillAlgorithm(e.target.value as FillAlgorithm)
                }
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
});
