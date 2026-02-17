import chroma from "chroma-js";
import type { RoomItem } from "./roomTemplates";

// ─── Weight helpers ───────────────────────────────────────────────

/**
 * Expand a color array by repeating each color according to its weight.
 * Weight is a continuous 1-10 scale from the item catalog.
 * This makes prominent items contribute more to statistical measures.
 */
function expandByWeights(
  colors: chroma.Color[],
  weights?: number[]
): chroma.Color[] {
  if (!weights || weights.length !== colors.length) return colors;
  const expanded: chroma.Color[] = [];
  for (let i = 0; i < colors.length; i++) {
    const reps = Math.max(1, Math.round(weights[i]));
    for (let j = 0; j < reps; j++) {
      expanded.push(colors[i]);
    }
  }
  return expanded;
}

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
  "surface-area": "Balanced distribution based on item visual weight.",
  "tonal-gradient": "Strong hue cohesion, gentle lightness variation.",
  "anchor-piece": "Tight cohesion with room for one accent.",
  "minimal-palette": "Fewest distinct colors, maximum cohesion.",
};

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

// ─── Palette hue structure ────────────────────────────────────────

/**
 * Analyze the palette's hue clusters. This is the "allowed" hue structure.
 * Room colors that fall within these clusters are cohesive.
 * Room colors outside all clusters are introducing new hue families.
 */
function getPaletteHueClusters(palette: chroma.Color[]): number[][] {
  const chromatic = palette.filter((c) => c.lch()[1] > 8);
  if (chromatic.length === 0) return [];

  const hues = chromatic.map((c) => c.lch()[2] || 0);
  const clusters: number[][] = [];

  for (const h of hues) {
    let added = false;
    for (const cluster of clusters) {
      const center = cluster.reduce((s, v) => s + v, 0) / cluster.length;
      const dist = Math.min(Math.abs(h - center), 360 - Math.abs(h - center));
      if (dist < 45) {
        cluster.push(h);
        added = true;
        break;
      }
    }
    if (!added) {
      clusters.push([h]);
    }
  }

  return clusters;
}

// ─── Cohesion-Based Harmony Score ─────────────────────────────────

/**
 * Measures how cohesive a set of room colors looks, relative to the
 * palette's hue structure. Colors that fit the palette's established
 * hue families are cohesive. Colors outside are introducing chaos.
 */
export function computeHarmonyScore(
  colors: chroma.Color[],
  algorithm: FillAlgorithm = "surface-area",
  palette: chroma.Color[] = [],
  weights?: number[]
): number {
  if (colors.length < 2) return 100;

  const expanded = expandByWeights(colors, weights);
  const paletteClusters = getPaletteHueClusters(palette);
  const w = ALGORITHM_WEIGHTS[algorithm];
  const hue = hueCohesionScore(expanded, paletteClusters);
  const sat = saturationCoherenceScore(expanded);
  const light = lightnessReasonablenessScore(expanded);

  return Math.max(0, Math.min(100, Math.round(
    hue * w.hueCohesion + sat * w.saturationCoherence + light * w.lightnessReasonableness
  )));
}

/**
 * Hue Cohesion: measured relative to the palette's hue structure.
 * If the palette has N hue clusters, using all N in the room is fine.
 * Introducing hues outside the palette's clusters is penalized.
 * If no palette context, falls back to absolute cluster counting.
 */
function hueCohesionScore(
  colors: chroma.Color[],
  paletteClusters: number[][]
): number {
  const chromatic = colors.filter((c) => c.lch()[1] > 8);
  if (chromatic.length <= 1) return 100;

  const hues = chromatic.map((c) => c.lch()[2] || 0);

  // If we have palette context, measure how well room hues
  // fit within the palette's established clusters.
  // Continuous: each color gets a fit score based on distance to nearest cluster.
  if (paletteClusters.length > 0) {
    let totalFit = 0;

    for (const h of hues) {
      let bestDist = Infinity;
      for (const cluster of paletteClusters) {
        const center = cluster.reduce((s, v) => s + v, 0) / cluster.length;
        const dist = Math.min(Math.abs(h - center), 360 - Math.abs(h - center));
        bestDist = Math.min(bestDist, dist);
      }
      // Continuous: 0 dist → 100, 50+ dist → 0
      totalFit += Math.max(0, 100 - bestDist * 2);
    }

    return totalFit / hues.length;
  }

  // Fallback: absolute cluster counting (no palette context)
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

  const n = clusters.length;
  if (n <= 2) return 100;
  if (n === 3) return 75;
  if (n === 4) return 50;
  return Math.max(0, 40 - (n - 4) * 15);
}

function saturationCoherenceScore(colors: chroma.Color[]): number {
  const chromas = colors.map((c) => c.lch()[1]);
  const mean = chromas.reduce((s, c) => s + c, 0) / chromas.length;
  const variance = chromas.reduce((s, c) => s + (c - mean) ** 2, 0) / chromas.length;
  const stdDev = Math.sqrt(variance);

  // Continuous scoring: smooth decay from 100 at stdDev=0 to ~20 at stdDev=50
  if (stdDev <= 5) return 100;
  return Math.max(0, Math.min(100, 105 - stdDev * 1.8));
}

function lightnessReasonablenessScore(colors: chroma.Color[]): number {
  const Ls = colors.map((c) => c.lab()[0]);
  const sorted = [...Ls].sort((a, b) => a - b);
  const range = sorted[sorted.length - 1] - sorted[0];

  // Wide range is NORMAL in a room (light walls + dark wood).
  // Only penalize if the room is too flat (everything the same lightness).
  let score = 100;
  if (range < 15) {
    score -= (15 - range) * 3;
  }

  // Penalize large gaps between adjacent lightness values.
  // A gap > 20 means there's a "hole" in the tonal range -- no color
  // bridges between the dark and light zones.
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    gaps.push(sorted[i] - sorted[i - 1]);
  }

  for (const gap of gaps) {
    if (gap > 20) {
      score -= (gap - 20) * 1.2;
    }
  }

  // Reward even spacing: a room with smooth tonal transitions
  // looks more cohesive than one with clusters and voids.
  if (gaps.length > 1) {
    const meanGap = gaps.reduce((s, g) => s + g, 0) / gaps.length;
    const gapVariance = gaps.reduce((s, g) => s + (g - meanGap) ** 2, 0) / gaps.length;
    const gapStdDev = Math.sqrt(gapVariance);
    score -= gapStdDev * 0.4;
  }

  return Math.max(0, Math.min(100, score));
}

// ─── Candidate scoring for picker ─────────────────────────────────

export type FitTier = "great" | "ok" | "avoid";

export interface ScoredCandidate {
  color: chroma.Color;
  score: number;
  tier: FitTier;
  inPalette: boolean;
}

export function scoreCandidates(
  palette: chroma.Color[],
  otherRoomColors: chroma.Color[],
  algorithm: FillAlgorithm,
  otherWeights?: number[],
  candidateWeight?: number
): ScoredCandidate[] {
  const paletteHexes = new Set(palette.map((c) => c.hex()));

  // Generate broad spectrum
  const generated: chroma.Color[] = [];
  const hueSteps = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
  const lightnessSteps = [35, 55, 80];
  const chromaSteps = [15, 45];

  for (const h of hueSteps) {
    for (const l of lightnessSteps) {
      for (const c of chromaSteps) {
        try { generated.push(chroma.lch(l, c, h)); } catch { /* skip */ }
      }
    }
  }
  for (const l of [25, 40, 55, 70, 85, 95]) {
    try { generated.push(chroma.lch(l, 3, 0)); } catch { /* skip */ }
  }

  const allColors = [...palette];
  const seenHexes = new Set(palette.map((c) => c.hex()));
  for (const c of generated) {
    const hex = c.hex();
    if (!seenHexes.has(hex)) { seenHexes.add(hex); allColors.push(c); }
  }

  const scored = allColors.map((candidate) => {
    let score: number;
    if (otherRoomColors.length === 0) {
      score = 100;
    } else {
      const testColors = [...otherRoomColors, candidate];
      const testWeights = otherWeights
        ? [...otherWeights, candidateWeight ?? 2]
        : undefined;
      score = computeHarmonyScore(testColors, algorithm, palette, testWeights);
    }
    return { color: candidate, score, inPalette: paletteHexes.has(candidate.hex()) };
  });

  scored.sort((a, b) => b.score - a.score);

  const bestScore = scored[0]?.score ?? 0;
  return scored.map((c) => {
    let tier: FitTier;
    if (c.score >= bestScore - 5) tier = "great";
    else if (c.score >= bestScore - 20) tier = "ok";
    else tier = "avoid";
    return { ...c, tier };
  });
}

// ─── Per-item score delta ─────────────────────────────────────────

export function itemScoreDelta(
  color: chroma.Color,
  allColors: chroma.Color[],
  algorithm: FillAlgorithm,
  palette: chroma.Color[] = [],
  allWeights?: number[],
  _itemWeight?: number
): number {
  const idx = allColors.findIndex((c) => c.hex() === color.hex());
  const without = allColors.filter((c) => c.hex() !== color.hex());
  const weightsWithout = allWeights
    ? allWeights.filter((_, i) => i !== idx)
    : undefined;
  if (without.length < 2) return 0;
  return computeHarmonyScore(allColors, algorithm, palette, allWeights) -
    computeHarmonyScore(without, algorithm, palette, weightsWithout);
}


// ─── Auto-fill ────────────────────────────────────────────────────

import { getCatalogLightnessRange } from "./itemCatalog";

/**
 * Auto-fill assigns palette colors to room items using one principle:
 * each item expects a lightness level, and the palette provides a
 * lightness gradient. Match them.
 *
 * The algorithm:
 * 1. Sort palette colors by lightness.
 * 2. For each unassigned item, compute where it falls in the
 *    lightness gradient (0 = darkest item in room, 1 = lightest).
 * 3. Pick the palette color at the matching position in the gradient.
 * 4. Already-used colors get a small penalty to encourage diversity.
 *
 * That's it. No role heuristics, no multi-term scoring function,
 * no magic numbers. The catalog's lightness ranges encode all the
 * design knowledge — floors are dark, walls are light, furniture
 * is in between — and the sort-and-match does the rest.
 */
export function autoFillRoom(
  items: RoomItem[],
  palette: chroma.Color[],
  _algorithm: FillAlgorithm
): RoomItem[] {
  if (palette.length === 0) return items;

  // Sort palette by lightness (dark → light)
  const sortedPalette = [...palette].sort(
    (a, b) => a.lab()[0] - b.lab()[0]
  );

  // For each unassigned item, compute its "target lightness" —
  // the midpoint of its expected range from the catalog.
  const result = [...items];
  const unassigned = result
    .map((item, idx) => {
      if (item.color !== null) return null;
      const [minL, maxL] = getCatalogLightnessRange(item.name);
      return { idx, targetL: (minL + maxL) / 2, weight: item.weight };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  // Sort items by target lightness (dark items first)
  unassigned.sort((a, b) => a.targetL - b.targetL);

  // Track usage to nudge diversity
  const usageCount = new Map<string, number>();
  for (const c of sortedPalette) usageCount.set(c.hex(), 0);
  for (const item of result) {
    if (item.color) {
      const hex = item.color.hex();
      if (usageCount.has(hex)) usageCount.set(hex, (usageCount.get(hex) || 0) + 1);
    }
  }

  // Match: map each item's position in the lightness-sorted list
  // to the corresponding position in the sorted palette.
  for (let i = 0; i < unassigned.length; i++) {
    const { idx, targetL } = unassigned[i];

    // Find the palette color closest to this item's target lightness,
    // with a small penalty for reuse.
    let bestColor = sortedPalette[0];
    let bestDist = Infinity;

    for (const candidate of sortedPalette) {
      const L = candidate.lab()[0];
      const dist = Math.abs(L - targetL);
      const uses = usageCount.get(candidate.hex()) || 0;
      const reusePenalty = uses * 12;
      const effective = dist + reusePenalty;

      if (effective < bestDist) {
        bestDist = effective;
        bestColor = candidate;
      }
    }

    result[idx] = { ...result[idx], color: bestColor };
    const hex = bestColor.hex();
    usageCount.set(hex, (usageCount.get(hex) || 0) + 1);
  }

  return result;
}
