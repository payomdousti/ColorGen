import chroma from "chroma-js";
import type { RoomItem } from "./roomTemplates";

export type FillAlgorithm =
  | "tonal"
  | "contrast"
  | "complementary-pop"
  | "neutral-ground";

export const FILL_LABELS: Record<FillAlgorithm, string> = {
  tonal: "Tonal / Monochromatic",
  contrast: "Contrast Balance",
  "complementary-pop": "Complementary Pop",
  "neutral-ground": "Neutral Ground",
};

export const FILL_DESCRIPTIONS: Record<FillAlgorithm, string> = {
  tonal: "Stay in the same hue family, vary lightness and saturation",
  contrast: "Fill gaps -- add lightness, chroma, or hue variety where missing",
  "complementary-pop":
    "Mostly tonal, but pick one or two items for a contrasting hue",
  "neutral-ground":
    "Push unassigned items toward low-chroma neutrals",
};

/**
 * Weights for the three harmony components.
 * Each algorithm is a different weighting of the same score.
 */
interface HarmonyWeights {
  spacing: number;    // Delta-E pair spacing (not too close, not too far)
  contrast: number;   // Lightness range
  hueCoherence: number; // Hue relationship quality
}

const ALGORITHM_WEIGHTS: Record<FillAlgorithm, HarmonyWeights> = {
  tonal:               { spacing: 0.3, contrast: 0.2, hueCoherence: 0.5 },
  contrast:            { spacing: 0.3, contrast: 0.5, hueCoherence: 0.2 },
  "complementary-pop": { spacing: 0.3, contrast: 0.3, hueCoherence: 0.4 },
  "neutral-ground":    { spacing: 0.4, contrast: 0.3, hueCoherence: 0.3 },
};

/**
 * The single harmony scoring function used everywhere.
 * Returns 0-100. Higher is better.
 *
 * Three components:
 * 1. Spacing: Delta-E between all pairs. Ideal range 10-50.
 *    Penalizes near-duplicates (< 5) and jarring jumps (> 70).
 * 2. Contrast: Lightness spread across the palette.
 *    Wants at least 30 L-units of range.
 * 3. Hue coherence: How well the hues relate.
 *    Rewards analogous (< 40deg) or complementary (140-220deg) clusters.
 */
export function computeHarmonyScore(
  colors: chroma.Color[],
  algorithm: FillAlgorithm = "contrast"
): number {
  if (colors.length < 2) return 100;

  const w = ALGORITHM_WEIGHTS[algorithm];

  const spacingScore = computeSpacingScore(colors);
  const contrastScore = computeContrastScore(colors);
  const hueScore = computeHueScore(colors, algorithm);

  const raw =
    spacingScore * w.spacing +
    contrastScore * w.contrast +
    hueScore * w.hueCoherence;

  return Math.max(0, Math.min(100, Math.round(raw)));
}

/**
 * Spacing: penalizes near-duplicate colors and jarring jumps.
 */
function computeSpacingScore(colors: chroma.Color[]): number {
  const distances: number[] = [];
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      distances.push(chroma.deltaE(colors[i], colors[j]));
    }
  }

  let score = 100;

  // Penalize near-duplicates heavily (Delta-E < 5)
  const dupes = distances.filter((d) => d < 5).length;
  score -= dupes * 15;

  // Penalize very close pairs (5-10)
  const tooClose = distances.filter((d) => d >= 5 && d < 10).length;
  score -= tooClose * 5;

  // Penalize jarring jumps (> 70)
  const jarring = distances.filter((d) => d > 70).length;
  score -= jarring * 8;

  // Reward good average spacing (15-45 is ideal)
  const avgDist = distances.reduce((s, d) => s + d, 0) / distances.length;
  if (avgDist >= 15 && avgDist <= 45) {
    score += 10;
  } else if (avgDist < 10) {
    score -= 15;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Contrast: lightness range across the palette.
 */
function computeContrastScore(colors: chroma.Color[]): number {
  const Ls = colors.map((c) => c.lab()[0]);
  const spread = Math.max(...Ls) - Math.min(...Ls);

  // 0-100 based on spread. Want at least 35 units for full score.
  if (spread >= 35) return 100;
  if (spread >= 25) return 80;
  if (spread >= 15) return 60;
  return Math.max(0, (spread / 15) * 60);
}

/**
 * Hue coherence: how well the hues relate to each other.
 * Different algorithms value different hue relationships.
 */
function computeHueScore(
  colors: chroma.Color[],
  algorithm: FillAlgorithm
): number {
  const hues = colors.map((c) => c.lch()[2] || 0);
  const chromas = colors.map((c) => c.lch()[1]);
  if (hues.length < 2) return 100;

  // Compute pairwise hue distances
  const hueDistances: number[] = [];
  for (let i = 0; i < hues.length; i++) {
    for (let j = i + 1; j < hues.length; j++) {
      const diff = Math.abs(hues[i] - hues[j]);
      hueDistances.push(Math.min(diff, 360 - diff));
    }
  }
  const avgHueDist =
    hueDistances.reduce((s, d) => s + d, 0) / hueDistances.length;
  const avgChroma = chromas.reduce((s, c) => s + c, 0) / chromas.length;

  switch (algorithm) {
    case "tonal": {
      // Reward tight hue clustering
      if (avgHueDist < 20) return 100;
      if (avgHueDist < 40) return 85;
      if (avgHueDist < 60) return 60;
      return Math.max(20, 100 - avgHueDist);
    }
    case "contrast": {
      // Reward any coherent relationship
      if (avgHueDist < 40) return 95;  // analogous
      if (avgHueDist >= 140 && avgHueDist <= 220) return 90; // complementary
      if (avgHueDist < 80) return 70;
      return 55;
    }
    case "complementary-pop": {
      // Reward having SOME complementary pairs
      const compPairs = hueDistances.filter(
        (d) => d >= 120 && d <= 240
      ).length;
      const analogPairs = hueDistances.filter((d) => d < 50).length;
      const total = hueDistances.length;
      // Best: mostly analogous with 1-2 complementary pops
      if (compPairs >= 1 && analogPairs >= total * 0.5) return 100;
      if (compPairs >= 1) return 85;
      if (analogPairs >= total * 0.7) return 75;
      return 60;
    }
    case "neutral-ground": {
      // Reward low chroma (neutral) + tight hues
      const chromaPenalty = Math.max(0, avgChroma - 15) * 1.5;
      const hueBonus = avgHueDist < 40 ? 20 : 0;
      return Math.max(0, Math.min(100, 100 - chromaPenalty + hueBonus));
    }
  }
}

/**
 * Per-item contribution: does this color help or hurt the overall score?
 * Returns the score delta: positive means it's helping, negative means hurting.
 */
export function itemScoreDelta(
  color: chroma.Color,
  allColors: chroma.Color[],
  algorithm: FillAlgorithm
): number {
  const without = allColors.filter((c) => c.hex() !== color.hex());
  if (without.length < 2) return 0;

  const scoreWith = computeHarmonyScore(allColors, algorithm);
  const scoreWithout = computeHarmonyScore(without, algorithm);

  return scoreWith - scoreWithout;
}

/**
 * Auto-fill: greedily assign palette colors to unassigned items,
 * picking whichever color maximizes the harmony score after each step.
 */
export function autoFillRoom(
  items: RoomItem[],
  palette: chroma.Color[],
  algorithm: FillAlgorithm
): RoomItem[] {
  const assignedColors = items
    .filter((item) => item.color !== null)
    .map((item) => item.color!);

  const usedHexes = new Set(assignedColors.map((c) => c.hex()));
  const available = palette.filter((c) => !usedHexes.has(c.hex()));

  if (available.length === 0) return items;

  const currentColors = [...assignedColors];
  const assignedInFill = new Set<string>();
  const result = [...items];

  for (let i = 0; i < result.length; i++) {
    if (result[i].color !== null) continue;

    let bestColor: chroma.Color | null = null;
    let bestScore = -Infinity;

    for (const candidate of available) {
      if (assignedInFill.has(candidate.hex())) continue;

      // Score = harmony of all current colors + this candidate
      const testColors = [...currentColors, candidate];
      const score = computeHarmonyScore(testColors, algorithm);

      if (score > bestScore) {
        bestScore = score;
        bestColor = candidate;
      }
    }

    if (bestColor) {
      assignedInFill.add(bestColor.hex());
      currentColors.push(bestColor);
      result[i] = { ...result[i], color: bestColor };
    }
  }

  return result;
}
