import type { HarmonyMode } from "../engine/harmonies";
import { HARMONY_LABELS } from "../engine/harmonies";

interface HarmonySelectorProps {
  mode: HarmonyMode;
  count: number;
  suggestions: number;
  onModeChange: (mode: HarmonyMode) => void;
  onCountChange: (count: number) => void;
  onSuggestionsChange: (count: number) => void;
  onGenerate: () => void;
}

const MODES = Object.keys(HARMONY_LABELS) as HarmonyMode[];

const MODE_DESCRIPTIONS: Record<HarmonyMode, string> = {
  complementary: "Opposite colors for contrast",
  analogous: "Nearby colors for cohesion",
  triadic: "Three evenly spaced hues",
  "split-complementary": "Contrast with nuance",
  "delta-e-smart": "Perceptually balanced",
};

export function HarmonySelector({
  mode,
  count,
  suggestions,
  onModeChange,
  onCountChange,
  onSuggestionsChange,
  onGenerate,
}: HarmonySelectorProps) {
  return (
    <div className="controls-bar">
      <div className="control-group">
        <label className="control-label" htmlFor="harmony-mode">
          Color Style
        </label>
        <select
          id="harmony-mode"
          className="control-select"
          value={mode}
          onChange={(e) => onModeChange(e.target.value as HarmonyMode)}
          title={MODE_DESCRIPTIONS[mode]}
        >
          {MODES.map((m) => (
            <option key={m} value={m}>
              {HARMONY_LABELS[m]}
            </option>
          ))}
        </select>
      </div>

      <div className="control-group">
        <label className="control-label" htmlFor="color-count">
          Colors to generate: {count}
        </label>
        <input
          id="color-count"
          type="range"
          className="control-slider"
          min={1}
          max={10}
          value={count}
          onChange={(e) => onCountChange(Number(e.target.value))}
        />
      </div>

      <div className="control-group">
        <label className="control-label" htmlFor="suggestion-count">
          Variations to show: {suggestions}
        </label>
        <input
          id="suggestion-count"
          type="range"
          className="control-slider"
          min={1}
          max={10}
          value={suggestions}
          onChange={(e) => onSuggestionsChange(Number(e.target.value))}
        />
      </div>

      <button className="btn-generate" onClick={onGenerate}>
        Generate
      </button>
    </div>
  );
}
