import chroma from "chroma-js";
import type { RoomItem, Tendency } from "./roomTemplates";

export type FillAlgorithm =
  | "surface-area"
  | "tonal-gradient"
  | "anchor-piece"
  | "minimal-palette";

export const FILL_LABELS: Record<FillAlgorithm, string> = {
  "surface-area": "Surface Area",
  "tonal-gradient": "Tonal Gradient",
  "anchor-piece": "Anchor Piece",
  "minimal-palette": "Minimal Palette",
};

export const FILL_DESCRIPTIONS: Record<FillAlgorithm, string> = {
  "surface-area":
    "Balanced distribution based on item visual weight.",
  "tonal-gradient":
    "Strong hue cohesion, gentle lightness variation.",
  "anchor-piece":
    "Tight cohesion with room for one accent.",
  "minimal-palette":
    "Fewest distinct colors, maximum cohesion.",
};

// ─── Cohesion Weights per Algorithm ───────────────────────────────

interface CohesionWeights {
  hueCohesion: number;
  saturationCoherence: number;
  lightnessReasonableness: number;
}

const ALGORITHM_WEIGHTS: Record<FillAlgorithm, CohesionWeights> = {
  "surface-area":     { hueCohesion: 0.45, saturationCoherence: 0.25, lightnessReasonableness: 0.30 },
  "tonal-gradient":   { hueCohesion: 0.55, saturationCoherence: 0.20, lightnessReasonableness: 0.25 },
  "anchor-piece":     { hueCohesion: 0.40, saturationCoherence: 0.30, lightnessReasonableness: 0.30 },
  "minimal-palette":  { hueCohesion: 0.50, saturationCoherence: 0.30, lightnessReasonableness: 0.20 },
};

// ─── Cohesion-Based Harmony Score ─────────────────────────────────

/**
 * Measures how cohesive a set of colors looks together.
 * Rewards: few hue families, consistent saturation, gentle lightness variation.
 * Penalizes: many unrelated hues, chaotic saturation, jarring lightness.
 */
export function computeHarmonyScore(
  colors: chroma.Color[],
  algorithm: FillAlgorithm = "surface-area"
): number {
  if (colors.length < 2) return 100;

  const w = ALGORITHM_WEIGHTS[algorithm];
  const hue = hueCohesionScore(colors);
  const sat = saturationCoherenceScore(colors);
  const light = lightnessReasonablenessScore(colors);

  return Math.max(0, Math.min(100, Math.round(
    hue * w.hueCohesion + sat * w.saturationCoherence + light * w.lightnessReasonableness
  )));
}

/**
 * Hue Cohesion: cluster colors by hue, penalize having too many clusters.
 * 1 cluster = perfect. 2 = great. 3 = OK if one is an accent. 4+ = chaos.
 * Low-chroma colors (neutrals) are excluded from hue clustering since
 * grey/beige/white don't belong to a hue family.
 */
function hueCohesionScore(colors: chroma.Color[]): number {
  // Only consider colors with meaningful chroma for hue clustering
  const chromatic = colors.filter((c) => c.lch()[1] > 8);

  if (chromatic.length <= 1) return 100; // all neutrals or just one hue = perfect

  const hues = chromatic.map((c) => c.lch()[2] || 0);

  // Simple greedy clustering with 40deg threshold
  const clusters: number[][] = [];
  for (const h of hues) {
    let added = false;
    for (const cluster of clusters) {
      const center = cluster.reduce((s, v) => s + v, 0) / cluster.length;
      const dist = Math.min(Math.abs(h - center), 360 - Math.abs(h - center));
      if (dist < 40) {
        cluster.push(h);
        added = true;
        break;
      }
    }
    if (!added) {
      clusters.push([h]);
    }
  }

  const numClusters = clusters.length;

  if (numClusters === 1) return 100;
  if (numClusters === 2) return 80;
  if (numClusters === 3) return 55;
  if (numClusters === 4) return 30;
  return Math.max(0, 20 - (numClusters - 4) * 10);
}

/**
 * Saturation Coherence: most colors should have similar chroma levels.
 * One outlier (accent) is fine. Multiple high-chroma items in different
 * hue families is what makes a room look chaotic.
 */
function saturationCoherenceScore(colors: chroma.Color[]): number {
  const chromas = colors.map((c) => c.lch()[1]);
  const mean = chromas.reduce((s, c) => s + c, 0) / chromas.length;

  // Standard deviation of chroma
  const variance = chromas.reduce((s, c) => s + (c - mean) ** 2, 0) / chromas.length;
  const stdDev = Math.sqrt(variance);

  // Low std dev = coherent saturation = good
  if (stdDev < 8) return 100;
  if (stdDev < 15) return 85;
  if (stdDev < 25) return 65;
  if (stdDev < 35) return 45;
  return Math.max(0, 40 - (stdDev - 35));
}

/**
 * Lightness Reasonableness: reward gentle variation, penalize jarring jumps
 * or everything being the same.
 */
function lightnessReasonablenessScore(colors: chroma.Color[]): number {
  const Ls = colors.map((c) => c.lab()[0]);
  const sorted = [...Ls].sort((a, b) => a - b);

  // Range
  const range = sorted[sorted.length - 1] - sorted[0];

  // Gentle variation: 15-50 L-units of range is ideal
  let rangeScore: number;
  if (range >= 15 && range <= 50) {
    rangeScore = 100;
  } else if (range < 15) {
    // Too flat
    rangeScore = 50 + (range / 15) * 50;
  } else {
    // Too much contrast (> 50)
    rangeScore = Math.max(40, 100 - (range - 50) * 1.5);
  }

  // Check for jarring jumps: any adjacent pair (when sorted) with > 30 L-unit gap
  let jumpPenalty = 0;
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i] - sorted[i - 1];
    if (gap > 30) jumpPenalty += 10;
  }

  return Math.max(0, Math.min(100, rangeScore - jumpPenalty));
}

// ─── Per-item score delta ─────────────────────────────────────────

export function itemScoreDelta(
  color: chroma.Color,
  allColors: chroma.Color[],
  algorithm: FillAlgorithm
): number {
  const without = allColors.filter((c) => c.hex() !== color.hex());
  if (without.length < 2) return 0;
  return computeHarmonyScore(allColors, algorithm) - computeHarmonyScore(without, algorithm);
}

// ─── Tendency bonus (tiebreaker only) ─────────────────────────────

function tendencyBonus(candidate: chroma.Color, tendency: Tendency): number {
  if (tendency === "any") return 0;

  const [L] = candidate.lab();
  const [, C, H] = candidate.lch();

  switch (tendency) {
    case "lighter":
      return L * 0.03; // very small bonus for high L
    case "darker":
      return (100 - L) * 0.03;
    case "warmer": {
      // Warm hues: roughly 0-90 and 300-360
      const isWarm = H <= 90 || H >= 300;
      return isWarm ? 2 : 0;
    }
    case "cooler": {
      // Cool hues: roughly 180-270
      const isCool = H >= 180 && H <= 270;
      return isCool ? 2 : 0;
    }
    case "neutral":
      return Math.max(0, (20 - C) * 0.1); // bonus for low chroma
    case "bold":
      return C * 0.03; // bonus for high chroma
  }
}

// ─── Auto-fill ────────────────────────────────────────────────────

/**
 * Auto-fill: assign palette colors to all unassigned items.
 * Colors CAN be reused across multiple items.
 * Each pick maximizes cohesion score, with tendency as tiebreaker.
 */
export function autoFillRoom(
  items: RoomItem[],
  palette: chroma.Color[],
  algorithm: FillAlgorithm
): RoomItem[] {
  if (palette.length === 0) return items;

  const result = [...items];

  const fixedColors = result
    .filter((item) => item.color !== null)
    .map((item) => item.color!);

  const roomColors = [...fixedColors];

  for (let i = 0; i < result.length; i++) {
    if (result[i].color !== null) continue;

    let bestColor: chroma.Color | null = null;
    let bestScore = -Infinity;

    for (const candidate of palette) {
      const testColors = [...roomColors, candidate];
      const cohesion = computeHarmonyScore(testColors, algorithm);
      const tiebreak = tendencyBonus(candidate, result[i].tendency);
      const score = cohesion + tiebreak;

      if (score > bestScore) {
        bestScore = score;
        bestColor = candidate;
      }
    }

    if (bestColor) {
      roomColors.push(bestColor);
      result[i] = { ...result[i], color: bestColor };
    }
  }

  return result;
}
