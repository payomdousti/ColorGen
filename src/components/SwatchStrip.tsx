import { useMemo } from "react";
import chroma from "chroma-js";
import { toHex, toLab } from "../engine/parser";

export interface SwatchItem {
  color: chroma.Color;
  locked: boolean;
}

interface SwatchStripProps {
  swatches: SwatchItem[];
}

/**
 * Sort swatches by lightness (L in LAB), lightest first.
 * This mimics how Pantone fan decks and paint swatch books
 * organize colors — creates a smooth light-to-dark gradient
 * that's easy to scan.
 */
function sortByLightness(swatches: SwatchItem[]): SwatchItem[] {
  return [...swatches].sort((a, b) => {
    const [lA] = a.color.lab();
    const [lB] = b.color.lab();
    return lB - lA; // lightest first
  });
}

export function SwatchStrip({ swatches }: SwatchStripProps) {
  const sorted = useMemo(() => sortByLightness(swatches), [swatches]);

  if (sorted.length === 0) {
    return (
      <div className="swatch-strip-empty">
        <p>Add some colors above and generate a palette to see swatches here.</p>
      </div>
    );
  }

  return (
    <div className="swatch-strip">
      {sorted.map((swatch, i) => {
        const hex = toHex(swatch.color).toUpperCase();
        const lab = toLab(swatch.color);
        const textColor =
          chroma.contrast(swatch.color, "white") > 3 ? "#fff" : "#222";

        return (
          <div key={i} className="swatch-card">
            <div
              className="swatch-color"
              style={{ backgroundColor: hex }}
            >
              {swatch.locked && (
                <span className="swatch-lock-badge" style={{ color: textColor }}>
                  🔒
                </span>
              )}
            </div>
            <div className="swatch-info">
              <span className="swatch-hex">{hex}</span>
              <span className="swatch-lab">LAB: {lab}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
