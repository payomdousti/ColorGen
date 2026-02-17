import chroma from "chroma-js";
import type { RoomItem, ItemWeight, Tendency } from "../engine/roomTemplates";
import { WEIGHT_LABELS, TENDENCY_LABELS } from "../engine/roomTemplates";
import { toHex } from "../engine/parser";

interface RoomItemRowProps {
  item: RoomItem;
  palette: chroma.Color[];
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
  scoreDelta,
  avgDelta,
  onUpdate,
  onRemove,
}: RoomItemRowProps) {
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

  return (
    <div className={`room-item-row ${isHurting ? "room-item-clash" : ""}`}>
      <div
        className="room-item-swatch"
        style={{ backgroundColor: bgHex }}
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

      <div className="room-item-color-picker">
        <select
          className="room-item-color-select"
          value={item.color ? toHex(item.color) : ""}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "") {
              onUpdate({ ...item, color: null });
            } else {
              try {
                onUpdate({ ...item, color: chroma(val) });
              } catch {
                // ignore
              }
            }
          }}
        >
          <option value="">Unassigned</option>
          {palette.map((c, i) => {
            const hex = toHex(c).toUpperCase();
            return (
              <option key={i} value={toHex(c)}>
                {hex}
              </option>
            );
          })}
        </select>
      </div>

      <button
        className="btn-dismiss room-item-remove"
        onClick={onRemove}
        title="Remove item"
      >
        ×
      </button>
    </div>
  );
}
