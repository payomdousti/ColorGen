import { useState, useCallback, useMemo } from "react";
import chroma from "chroma-js";
import { ROOM_TEMPLATES } from "../engine/roomTemplates";
import type { RoomItem } from "../engine/roomTemplates";
import {
  autoFillRoom,
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

interface RoomTabProps {
  pinnedSuggestions: Suggestion[];
  baseColors: chroma.Color[];
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

export function RoomTab({ pinnedSuggestions, baseColors }: RoomTabProps) {
  const [roomItems, setRoomItems] = useState<RoomItem[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedPaletteIdx, setSelectedPaletteIdx] = useState<number>(-1);
  const [fillAlgorithm, setFillAlgorithm] = useState<FillAlgorithm>("surface-area");
  // Track which items the user manually assigned (so auto-fill doesn't overwrite them)
  const [manuallyAssigned, setManuallyAssigned] = useState<Set<number>>(new Set());

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

  const handleAddItem = () => {
    setRoomItems((prev) => [
      ...prev,
      { id: nextItemId++, name: "New Item", color: null, weight: "medium", tendency: "any" as const },
    ]);
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

  const assignedColors = useMemo(
    () =>
      roomItems
        .filter((item) => item.color !== null)
        .map((item) => item.color!),
    [roomItems]
  );

  const harmonyScore = useMemo(
    () => computeHarmonyScore(assignedColors, fillAlgorithm, activePalette),
    [assignedColors, fillAlgorithm, activePalette]
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
          itemScoreDelta(item.color, assignedColors, fillAlgorithm, activePalette)
        );
      }
    }
    return map;
  }, [roomItems, assignedColors, fillAlgorithm, activePalette]);

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

  const scoreLabel =
    harmonyScore >= 80
      ? "Strong"
      : harmonyScore >= 60
        ? "Good"
        : harmonyScore >= 40
          ? "Moderate"
          : "Weak";

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
            <span className="harmony-score-text">{scoreLabel}</span>
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
              <button className="btn-add" onClick={handleAddItem}>
                + Add Item
              </button>
            </div>
          </div>

          <div className="room-items-list">
            {roomItems.map((item) => {
              // Other colors = all assigned colors except this item's
              const otherColors = assignedColors.filter(
                (c) => !item.color || c.hex() !== item.color.hex()
              );
              return (
                <RoomItemRow
                  key={item.id}
                  item={item}
                  palette={activePalette}
                  otherRoomColors={otherColors}
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
}
