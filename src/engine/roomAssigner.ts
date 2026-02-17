import chroma from "chroma-js";
import type { RoomItem, Tendency } from "./roomTemplates";

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

// ─── Tendency bonus (tiebreaker) ──────────────────────────────────

function tendencyBonus(candidate: chroma.Color, tendency: Tendency): number {
  if (tendency === "any") return 0;
  const [L] = candidate.lab();
  const [, C, H] = candidate.lch();

  // Tendencies should be meaningful enough to influence picks
  // when cohesion scores are similar (within ~5 points).
  switch (tendency) {
    case "lighter": {
      // Lighter = high lightness AND low-to-moderate chroma
      // Strong enough to meaningfully shift wall/sheet picks toward lights
      const lBonus = L > 80 ? 8 : L > 65 ? 3 : L > 50 ? 0 : -5;
      const cPenalty = C > 35 ? -4 : C > 20 ? -1 : 0;
      return lBonus + cPenalty;
    }
    case "darker": return L < 40 ? 4 : L < 55 ? 1 : -3;
    case "warmer": return (H <= 90 || H >= 300) ? 4 : -1;
    case "cooler": return (H >= 150 && H <= 270) ? 4 : -1;
    case "neutral": {
      // Neutral = low chroma AND moderate-to-high lightness
      const cBonus = C < 8 ? 6 : C < 15 ? 3 : -3;
      const lBonus2 = L > 50 ? 1 : -1;
      return cBonus + lBonus2;
    }
    case "bold": return C > 30 ? 4 : C > 15 ? 1 : -2;
  }
}

// ─── Auto-fill ────────────────────────────────────────────────────

import { getCatalogLightnessRange, getCatalogRole } from "./itemCatalog";
import type { ItemRole } from "./itemCatalog";

/**
 * Score how well a palette color fits a specific item based on:
 * 1. Lightness fit: does the color's L fall in the item's expected range?
 * 2. Role fit: accent items prefer saturated colors, background prefers desaturated
 * 3. Diversity: unused palette colors get a strong bonus
 * 4. Harmony: how does adding this color affect overall room cohesion?
 */
function itemFitScore(
  candidate: chroma.Color,
  _itemName: string,
  itemRole: ItemRole,
  lightnessRange: [number, number],
  roomColors: chroma.Color[],
  roomWeights: number[],
  itemWeight: number,
  algorithm: FillAlgorithm,
  palette: chroma.Color[],
  usageCount: Map<string, number>,
  totalUnassigned: number,
  tendency: Tendency
): number {
  const [L] = candidate.lab();
  const [, C] = candidate.lch();

  // 1. Lightness fit (0-30 points)
  // Strong reward for being in range, penalty for being outside
  let lightnessFit = 0;
  const [minL, maxL] = lightnessRange;
  const midL = (minL + maxL) / 2;
  if (L >= minL && L <= maxL) {
    // In range: bonus proportional to how close to the center
    const dist = Math.abs(L - midL);
    const halfRange = (maxL - minL) / 2;
    lightnessFit = 30 - (dist / halfRange) * 10;
  } else {
    // Out of range: penalty proportional to distance
    const dist = L < minL ? minL - L : L - maxL;
    lightnessFit = -dist * 0.8;
  }

  // 2. Role fit (0-15 points)
  let roleFit = 0;
  switch (itemRole) {
    case "background":
      // Background items prefer low saturation and high lightness
      roleFit = (C < 10 ? 10 : C < 20 ? 5 : -5) + (L > 75 ? 5 : 0);
      break;
    case "ground":
      // Ground items (floors) prefer medium-low lightness and moderate saturation
      roleFit = (L < 65 ? 8 : -5) + (C > 5 && C < 35 ? 7 : 0);
      break;
    case "accent":
      // Accent items prefer higher saturation — they're the statement
      roleFit = C > 20 ? 12 : C > 10 ? 6 : 0;
      break;
    case "anchor":
      // Anchor items (furniture) are flexible but prefer mid-range
      roleFit = (L > 25 && L < 80 ? 5 : 0) + (C > 5 ? 3 : 0);
      break;
    case "neutral":
      // Neutral items (doors, trim) should match walls or be unobtrusive
      roleFit = C < 12 ? 10 : C < 20 ? 3 : -8;
      break;
  }

  // 3. Diversity bonus (0-25 points)
  // STRONG bonus for unused palette colors to ensure variety
  const uses = usageCount.get(candidate.hex()) || 0;
  const paletteSize = palette.length;
  let diversityBonus = 0;
  if (uses === 0) {
    // Unused color: big bonus, especially if many items left to fill
    diversityBonus = 25;
  } else if (uses === 1) {
    diversityBonus = 8;
  } else {
    // Penalize heavy reuse unless the palette is very small
    diversityBonus = Math.max(-10, 5 - uses * 5);
  }

  // If palette is larger than unassigned items, push harder for diversity
  if (paletteSize > totalUnassigned && uses > 0) {
    diversityBonus -= 10;
  }

  // 4. Harmony (0-~100 points, but scaled down)
  // Use harmony as a tiebreaker, not the primary driver
  const testColors = [...roomColors, candidate];
  const testWeights = [...roomWeights, itemWeight];
  const harmony = computeHarmonyScore(testColors, algorithm, palette, testWeights);
  const harmonyScore = harmony * 0.3; // scale to ~0-30

  // 5. Tendency bonus (small tiebreaker)
  const tiebreak = tendencyBonus(candidate, tendency);

  return lightnessFit + roleFit + diversityBonus + harmonyScore + tiebreak;
}

export function autoFillRoom(
  items: RoomItem[],
  palette: chroma.Color[],
  algorithm: FillAlgorithm
): RoomItem[] {
  if (palette.length === 0) return items;

  const result = [...items];
  const fixedColors: chroma.Color[] = [];
  const fixedWeights: number[] = [];

  for (const item of result) {
    if (item.color !== null) {
      fixedColors.push(item.color);
      fixedWeights.push(item.weight);
    }
  }

  const roomColors = [...fixedColors];
  const roomWeights = [...fixedWeights];

  const usageCount = new Map<string, number>();
  for (const c of palette) usageCount.set(c.hex(), 0);
  for (const c of fixedColors) {
    const hex = c.hex();
    if (usageCount.has(hex)) usageCount.set(hex, (usageCount.get(hex) || 0) + 1);
  }

  const unassignedCount = result.filter((i) => i.color === null).length;

  // Sort unassigned items: assign high-weight items first (floors, walls before pillows)
  // This ensures the foundation is set before filling details
  const unassignedIndices = result
    .map((item, idx) => ({ item, idx }))
    .filter(({ item }) => item.color === null)
    .sort((a, b) => b.item.weight - a.item.weight);

  let remaining = unassignedCount;

  for (const { idx } of unassignedIndices) {
    const item = result[idx];
    const lightnessRange = getCatalogLightnessRange(item.name);
    const role = getCatalogRole(item.name);

    let bestColor: chroma.Color | null = null;
    let bestScore = -Infinity;

    for (const candidate of palette) {
      const score = itemFitScore(
        candidate,
        item.name,
        role,
        lightnessRange,
        roomColors,
        roomWeights,
        item.weight,
        algorithm,
        palette,
        usageCount,
        remaining,
        item.tendency
      );

      if (score > bestScore) {
        bestScore = score;
        bestColor = candidate;
      }
    }

    if (bestColor) {
      roomColors.push(bestColor);
      roomWeights.push(item.weight);
      const hex = bestColor.hex();
      usageCount.set(hex, (usageCount.get(hex) || 0) + 1);
      result[idx] = { ...result[idx], color: bestColor };
    }

    remaining--;
  }

  return result;
}
