import { useState, useMemo } from "react";
import chroma from "chroma-js";
import type { RoomItem } from "../engine/roomTemplates";
import { toHex } from "../engine/parser";
import { scoreCandidates, itemWeightToNumber } from "../engine/roomAssigner";
import type { FillAlgorithm } from "../engine/roomAssigner";
import { SwatchPicker } from "./SwatchPicker";

interface RoomItemRowProps {
  item: RoomItem;
  palette: chroma.Color[];
  otherRoomColors: chroma.Color[];
  otherRoomWeights: number[];
  algorithm: FillAlgorithm;
  scoreDelta: number | null;
  avgDelta: number;
  onUpdate: (item: RoomItem) => void;
  onRemove: () => void;
}

export function RoomItemRow({
  item,
  palette,
  otherRoomColors,
  otherRoomWeights,
  algorithm,
  scoreDelta,
  avgDelta,
  onUpdate,
  onRemove,
}: RoomItemRowProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [stripOpen, setStripOpen] = useState(false);

  const bgHex = item.color ? toHex(item.color) : "#e8e5e0";
  const textColor = item.color
    ? chroma.contrast(item.color, "white") > 3
      ? "#fff"
      : "#222"
    : "#aaa";

  const isHurting = scoreDelta !== null && scoreDelta < avgDelta - 3;
  const isHelping = scoreDelta !== null && scoreDelta > avgDelta + 1;

  const myWeight = itemWeightToNumber(item.weight);

  const candidates = useMemo(
    () => scoreCandidates(palette, otherRoomColors, algorithm, otherRoomWeights, myWeight),
    [palette, otherRoomColors, algorithm, otherRoomWeights, myWeight]
  );

  const currentHex = item.color ? toHex(item.color) : null;

  const handleQuickPick = (color: chroma.Color) => {
    onUpdate({ ...item, color });
    setStripOpen(false);
  };

  const handleUnassign = () => {
    onUpdate({ ...item, color: null });
    setStripOpen(false);
  };

  return (
    <div className={`room-item-row ${isHurting ? "room-item-clash" : ""}`}>
      <div
        className="room-item-swatch"
        style={{ backgroundColor: bgHex, cursor: "pointer" }}
        onClick={() => setStripOpen(!stripOpen)}
        title="Click to assign a color"
      >
        <span
          className="room-item-swatch-label"
          style={{ color: textColor }}
        >
          {item.color ? toHex(item.color).toUpperCase() : "--"}
        </span>
      </div>

      <div className="room-item-details">
        <input
          type="text"
          className="room-item-name"
          value={item.name}
          onChange={(e) => onUpdate({ ...item, name: e.target.value })}
          spellCheck={false}
        />
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
        className={`btn-pick-color ${stripOpen ? "active" : ""}`}
        onClick={() => setStripOpen(!stripOpen)}
        title="Quick-assign from palette"
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

      {stripOpen && (
        <div className="palette-strip">
          {palette.map((color, i) => {
            const hex = toHex(color);
            const isSelected = currentHex === hex;
            return (
              <button
                key={i}
                className={`palette-strip-swatch ${isSelected ? "selected" : ""}`}
                style={{ backgroundColor: hex }}
                onClick={() => handleQuickPick(color)}
                title={hex.toUpperCase()}
              />
            );
          })}
          {item.color && (
            <button
              className="palette-strip-unassign"
              onClick={handleUnassign}
              title="Remove color"
            >
              ×
            </button>
          )}
          <button
            className="palette-strip-browse"
            onClick={() => {
              setStripOpen(false);
              setPickerOpen(true);
            }}
            title="Browse all colors with fit scores"
          >
            Browse all…
          </button>
        </div>
      )}

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
