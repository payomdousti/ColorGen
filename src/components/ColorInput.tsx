import { useState, useEffect, useRef } from "react";
import chroma from "chroma-js";
import { parseColor, toHex, toLab } from "../engine/parser";

interface ColorInputProps {
  color: chroma.Color | null;
  locked: boolean;
  onColorChange: (color: chroma.Color | null) => void;
  onToggleLock: () => void;
  onRemove: () => void;
}

export function ColorInput({
  color,
  locked,
  onColorChange,
  onToggleLock,
  onRemove,
}: ColorInputProps) {
  const [inputValue, setInputValue] = useState(color ? toHex(color) : "");
  const [isValid, setIsValid] = useState(color !== null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (color && document.activeElement !== inputRef.current) {
      setInputValue(toHex(color));
      setIsValid(true);
    }
  }, [color]);

  const handleChange = (value: string) => {
    setInputValue(value);
    const parsed = parseColor(value);
    setIsValid(parsed !== null || value === "");
    if (parsed) {
      onColorChange(parsed);
    }
  };

  const handleNativeColorChange = (hex: string) => {
    setInputValue(hex);
    const parsed = parseColor(hex);
    setIsValid(true);
    if (parsed) {
      onColorChange(parsed);
    }
  };

  const bgHex = color ? toHex(color) : "#e0e0e0";
  const textColor = color
    ? chroma.contrast(color, "white") > 3
      ? "#fff"
      : "#222"
    : "#999";

  return (
    <div className="color-input-card">
      <div
        className="color-input-swatch"
        style={{ backgroundColor: bgHex }}
      >
        {color && (
          <span className="color-input-label" style={{ color: textColor }}>
            {toHex(color).toUpperCase()}
          </span>
        )}
        {!color && (
          <span className="color-input-label" style={{ color: "#999" }}>
            No color
          </span>
        )}
      </div>

      <div className="color-input-controls">
        <div className="color-input-row">
          <input
            ref={inputRef}
            type="text"
            className={`color-text-input ${!isValid && inputValue ? "invalid" : ""}`}
            value={inputValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="#hex, lab(L,a,b), or name"
            spellCheck={false}
          />
          <input
            type="color"
            className="color-native-picker"
            value={color ? toHex(color) : "#808080"}
            onChange={(e) => handleNativeColorChange(e.target.value)}
            title="Pick a color"
          />
        </div>

        {color && (
          <span className="color-lab-value">LAB: {toLab(color)}</span>
        )}
      </div>

      <div className="color-input-actions">
        <button
          className={`btn-icon ${locked ? "locked" : ""}`}
          onClick={onToggleLock}
          title={locked ? "Unlock color" : "Lock color"}
        >
          {locked ? "🔒" : "🔓"}
        </button>
        <button
          className="btn-icon btn-remove"
          onClick={onRemove}
          title="Remove color"
        >
          ×
        </button>
      </div>
    </div>
  );
}
