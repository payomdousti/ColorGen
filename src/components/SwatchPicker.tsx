import chroma from "chroma-js";
import { toHex } from "../engine/parser";
import type { ScoredCandidate, FitTier } from "../engine/roomAssigner";

interface SwatchPickerProps {
  candidates: ScoredCandidate[];
  currentColor: chroma.Color | null;
  onPick: (color: chroma.Color | null) => void;
  onClose: () => void;
}

const TIER_LABELS: Record<FitTier, string> = {
  great: "Great fit",
  ok: "Could work",
  avoid: "Avoid",
};

export function SwatchPicker({
  candidates,
  currentColor,
  onPick,
  onClose,
}: SwatchPickerProps) {
  const currentHex = currentColor ? toHex(currentColor) : null;

  // Group by tier
  const grouped: Record<FitTier, ScoredCandidate[]> = {
    great: [],
    ok: [],
    avoid: [],
  };
  for (const c of candidates) {
    grouped[c.tier].push(c);
  }

  const tiers: FitTier[] = ["great", "ok", "avoid"];

  return (
    <div className="swatch-picker-overlay" onClick={onClose}>
      <div className="swatch-picker" onClick={(e) => e.stopPropagation()}>
        <div className="swatch-picker-header">
          <span className="swatch-picker-title">Pick a color</span>
          <button className="swatch-picker-unassign" onClick={() => onPick(null)}>
            Unassign
          </button>
          <button className="swatch-picker-close" onClick={onClose}>
            ×
          </button>
        </div>

        {tiers.map((tier) => {
          const items = grouped[tier];
          if (items.length === 0) return null;

          return (
            <div key={tier} className={`swatch-picker-tier tier-${tier}`}>
              <span className="swatch-picker-tier-label">
                {TIER_LABELS[tier]}
                <span className="swatch-picker-tier-count">
                  {items.length}
                </span>
              </span>
              <div className="swatch-picker-grid">
                {items.map((candidate, i) => {
                  const hex = toHex(candidate.color);
                  const isSelected = currentHex === hex;
                  const textColor =
                    chroma.contrast(candidate.color, "white") > 3
                      ? "#fff"
                      : "#222";

                  return (
                    <button
                      key={i}
                      className={`swatch-picker-item ${isSelected ? "selected" : ""} ${candidate.inPalette ? "in-palette" : ""}`}
                      style={{ backgroundColor: hex }}
                      onClick={() => onPick(candidate.color)}
                      title={`${hex.toUpperCase()} (score: ${candidate.score})${candidate.inPalette ? " — in your palette" : ""}`}
                    >
                      {candidate.inPalette && (
                        <span className="swatch-palette-dot" style={{ background: textColor }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
