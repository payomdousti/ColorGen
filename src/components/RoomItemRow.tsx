import { useState, useMemo } from "react";
import chroma from "chroma-js";
import type { RoomItem, ItemWeight, Tendency } from "../engine/roomTemplates";
import { WEIGHT_LABELS, TENDENCY_LABELS } from "../engine/roomTemplates";
import { toHex } from "../engine/parser";
import { scoreCandidates } from "../engine/roomAssigner";
import type { FillAlgorithm } from "../engine/roomAssigner";
import { SwatchPicker } from "./SwatchPicker";

interface RoomItemRowProps {
  item: RoomItem;
  palette: chroma.Color[];
  otherRoomColors: chroma.Color[];
  algorithm: FillAlgorithm;
  scoreDelta: number | null;
  avgDelta: number;
  onUpdate: (item: RoomItem) => void;
  onRemove: () => void;
}

const WEIGHT_CYCLE: ItemWeight[] = ["large", "medium", "small"];
const TENDENCIES: Tendency[] = [
  "any", "lighter", "darker", "warmer", "cooler", "neutral", "bold",
];

export function RoomItemRow({
  item,
  palette,
  otherRoomColors,
  algorithm,
  scoreDelta,
  avgDelta,
  onUpdate,
  onRemove,
}: RoomItemRowProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const bgHex = item.color ? toHex(item.color) : "#e8e5e0";
  const textColor = item.color
    ? chroma.contrast(item.color, "white") > 3
      ? "#fff"
      : "#222"
    : "#aaa";

  const isHurting = scoreDelta !== null && scoreDelta < avgDelta - 3;
  const isHelping = scoreDelta !== null && scoreDelta > avgDelta + 1;

  const cycleWeight = () => {
    const idx = WEIGHT_CYCLE.indexOf(item.weight);
    const next = WEIGHT_CYCLE[(idx + 1) % WEIGHT_CYCLE.length];
    onUpdate({ ...item, weight: next });
  };

  const candidates = useMemo(
    () => scoreCandidates(palette, otherRoomColors, algorithm),
    [palette, otherRoomColors, algorithm]
  );

  return (
    <div className={`room-item-row ${isHurting ? "room-item-clash" : ""}`}>
      <div
        className="room-item-swatch"
        style={{ backgroundColor: bgHex, cursor: "pointer" }}
        onClick={() => setPickerOpen(true)}
        title="Click to pick a color"
      >
        <span
          className="room-item-swatch-label"
          style={{ color: textColor }}
        >
          {item.color ? toHex(item.color).toUpperCase() : "--"}
        </span>
      </div>

      <div className="room-item-details">
        <div className="room-item-name-row">
          <input
            type="text"
            className="room-item-name"
            value={item.name}
            onChange={(e) => onUpdate({ ...item, name: e.target.value })}
            spellCheck={false}
          />
          <button
            className={`weight-badge weight-${item.weight}`}
            onClick={cycleWeight}
            title={`Visual weight: ${item.weight}. Click to cycle.`}
          >
            {WEIGHT_LABELS[item.weight]}
          </button>
          <select
            className="tendency-select"
            value={item.tendency}
            onChange={(e) =>
              onUpdate({ ...item, tendency: e.target.value as Tendency })
            }
            title="Color tendency hint for auto-fill"
          >
            {TENDENCIES.map((t) => (
              <option key={t} value={t}>
                {TENDENCY_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {item.color !== null && scoreDelta !== null && (
        <span
          className={`room-item-fit ${isHurting ? "fit-hurt" : isHelping ? "fit-good" : "fit-neutral"}`}
          title={`${scoreDelta >= 0 ? "+" : ""}${scoreDelta} to cohesion (avg: ${avgDelta >= 0 ? "+" : ""}${Math.round(avgDelta)})`}
        >
          {scoreDelta >= 0 ? `+${scoreDelta}` : scoreDelta}
        </span>
      )}

      <button
        className="btn-pick-color"
        onClick={() => setPickerOpen(true)}
        title="Pick a color"
      >
        {item.color ? "Change" : "Pick"}
      </button>

      <button
        className="btn-dismiss room-item-remove"
        onClick={onRemove}
        title="Remove item"
      >
        ×
      </button>

      {pickerOpen && (
        <SwatchPicker
          candidates={candidates}
          currentColor={item.color}
          onPick={(color) => {
            onUpdate({ ...item, color });
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
