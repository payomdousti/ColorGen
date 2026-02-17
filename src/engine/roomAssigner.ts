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
  palette: chroma.Color[] = []
): number {
  if (colors.length < 2) return 100;

  const paletteClusters = getPaletteHueClusters(palette);
  const w = ALGORITHM_WEIGHTS[algorithm];
  const hue = hueCohesionScore(colors, paletteClusters);
  const sat = saturationCoherenceScore(colors);
  const light = lightnessReasonablenessScore(colors);

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
  // fit within the palette's established clusters
  if (paletteClusters.length > 0) {
    let outsideCount = 0;

    for (const h of hues) {
      let fitsAny = false;
      for (const cluster of paletteClusters) {
        const center = cluster.reduce((s, v) => s + v, 0) / cluster.length;
        const dist = Math.min(Math.abs(h - center), 360 - Math.abs(h - center));
        if (dist < 50) {
          fitsAny = true;
          break;
        }
      }
      if (!fitsAny) outsideCount++;
    }

    const outsideRatio = outsideCount / hues.length;
    if (outsideRatio === 0) return 100;     // all hues fit palette clusters
    if (outsideRatio < 0.15) return 85;     // mostly fits, one outlier
    if (outsideRatio < 0.3) return 65;
    return Math.max(20, 100 - outsideRatio * 150);
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

  if (stdDev < 10) return 100;
  if (stdDev < 18) return 85;
  if (stdDev < 28) return 65;
  if (stdDev < 38) return 45;
  return Math.max(0, 40 - (stdDev - 38));
}

function lightnessReasonablenessScore(colors: chroma.Color[]): number {
  const Ls = colors.map((c) => c.lab()[0]);
  const sorted = [...Ls].sort((a, b) => a - b);
  const range = sorted[sorted.length - 1] - sorted[0];

  let rangeScore: number;
  if (range >= 15 && range <= 55) {
    rangeScore = 100;
  } else if (range < 15) {
    rangeScore = 50 + (range / 15) * 50;
  } else {
    rangeScore = Math.max(40, 100 - (range - 55) * 1.2);
  }

  let jumpPenalty = 0;
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i] - sorted[i - 1];
    if (gap > 35) jumpPenalty += 8;
  }

  return Math.max(0, Math.min(100, rangeScore - jumpPenalty));
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
  algorithm: FillAlgorithm
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
      score = computeHarmonyScore(testColors, algorithm, palette);
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
  palette: chroma.Color[] = []
): number {
  const without = allColors.filter((c) => c.hex() !== color.hex());
  if (without.length < 2) return 0;
  return computeHarmonyScore(allColors, algorithm, palette) -
    computeHarmonyScore(without, algorithm, palette);
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

  // Track how many times each palette color has been used
  // to nudge toward palette breadth
  const usageCount = new Map<string, number>();
  for (const c of palette) usageCount.set(c.hex(), 0);
  for (const c of fixedColors) {
    const hex = c.hex();
    if (usageCount.has(hex)) usageCount.set(hex, (usageCount.get(hex) || 0) + 1);
  }

  for (let i = 0; i < result.length; i++) {
    if (result[i].color !== null) continue;

    let bestColor: chroma.Color | null = null;
    let bestScore = -Infinity;

    for (const candidate of palette) {
      const testColors = [...roomColors, candidate];
      const cohesion = computeHarmonyScore(testColors, algorithm, palette);
      const tiebreak = tendencyBonus(candidate, result[i].tendency);

      // Diversity nudge: mild preference for less-used palette colors.
      // This encourages the algorithm to use the breadth of the palette
      // rather than repeating the safest color. The nudge is small enough
      // that cohesion still dominates -- it only matters when multiple
      // colors score similarly.
      const uses = usageCount.get(candidate.hex()) || 0;
      const diversityNudge = Math.max(0, 3 - uses * 1.5);

      const score = cohesion + tiebreak + diversityNudge;

      if (score > bestScore) {
        bestScore = score;
        bestColor = candidate;
      }
    }

    if (bestColor) {
      roomColors.push(bestColor);
      const hex = bestColor.hex();
      usageCount.set(hex, (usageCount.get(hex) || 0) + 1);
      result[i] = { ...result[i], color: bestColor };
    }
  }

  return result;
}
