import chroma from "chroma-js";

export type HarmonyMode =
  | "complementary"
  | "analogous"
  | "triadic"
  | "split-complementary"
  | "delta-e-smart";

export const HARMONY_LABELS: Record<HarmonyMode, string> = {
  complementary: "Complementary",
  analogous: "Analogous",
  triadic: "Triadic",
  "split-complementary": "Split-Complementary",
  "delta-e-smart": "Delta-E Smart",
};

/**
 * Simple seeded PRNG (mulberry32) so each variation index
 * produces a deterministic but different set of colors.
 */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate `count` new colors that harmonize with the given locked colors.
 * The `variation` parameter (0-based) seeds the randomness so each
 * variation produces a distinct but reproducible palette.
 */
export function generateHarmony(
  lockedColors: chroma.Color[],
  mode: HarmonyMode,
  count: number,
  variation: number = 0,
  batchSeed: number = 0
): chroma.Color[] {
  if (lockedColors.length === 0 || count <= 0) return [];

  const rng = mulberry32(batchSeed + variation * 7919);

  switch (mode) {
    case "complementary":
      return generateComplementary(lockedColors, count, rng);
    case "analogous":
      return generateAnalogous(lockedColors, count, rng);
    case "triadic":
      return generateTriadic(lockedColors, count, rng);
    case "split-complementary":
      return generateSplitComplementary(lockedColors, count, rng);
    case "delta-e-smart":
      return generateDeltaESmart(lockedColors, count, rng);
    default:
      return generateAnalogous(lockedColors, count, rng);
  }
}

/**
 * Generate multiple palette suggestions at once.
 */
export function generateMultiplePalettes(
  lockedColors: chroma.Color[],
  mode: HarmonyMode,
  count: number,
  numSuggestions: number,
  batchSeed: number = 0
): chroma.Color[][] {
  const palettes: chroma.Color[][] = [];
  for (let v = 0; v < numSuggestions; v++) {
    palettes.push(generateHarmony(lockedColors, mode, count, v, batchSeed));
  }
  return palettes;
}

function rotateHue(color: chroma.Color, degrees: number): chroma.Color {
  const [l, c, h] = color.lch();
  const newHue = ((h || 0) + degrees + 360) % 360;
  return chroma.lch(l, c, newHue);
}

function varyLightness(color: chroma.Color, offset: number): chroma.Color {
  const [l, c, h] = color.lch();
  const newL = Math.max(10, Math.min(95, l + offset));
  return chroma.lch(newL, c, h);
}

function varyChroma(color: chroma.Color, offset: number): chroma.Color {
  const [l, c, h] = color.lch();
  const newC = Math.max(0, Math.min(130, c + offset));
  return chroma.lch(l, newC, h);
}

/**
 * Complementary: rotate hue 180deg, then vary with seeded randomness.
 */
function generateComplementary(
  locked: chroma.Color[],
  count: number,
  rng: () => number
): chroma.Color[] {
  const results: chroma.Color[] = [];
  const baseComplements = locked.map((c) => rotateHue(c, 180));

  for (let i = 0; i < count; i++) {
    const base = baseComplements[i % baseComplements.length];
    const hueShift = (rng() - 0.5) * 24;
    const lightnessShift = (rng() - 0.5) * 30;
    const chromaShift = (rng() - 0.5) * 20;
    results.push(
      varyChroma(varyLightness(rotateHue(base, hueShift), lightnessShift), chromaShift)
    );
  }

  return results;
}

/**
 * Analogous: spread within +/-30deg of locked hues, with variation.
 */
function generateAnalogous(
  locked: chroma.Color[],
  count: number,
  rng: () => number
): chroma.Color[] {
  const results: chroma.Color[] = [];
  const spreadRange = 35;

  for (let i = 0; i < count; i++) {
    const base = locked[i % locked.length];
    const hueOffset = (rng() - 0.5) * 2 * spreadRange;
    const lightnessShift = (rng() - 0.5) * 30;
    const chromaShift = (rng() - 0.5) * 20;
    results.push(
      varyChroma(varyLightness(rotateHue(base, hueOffset), lightnessShift), chromaShift)
    );
  }

  return results;
}

/**
 * Triadic: rotate locked hues by ~120deg and ~240deg, with jitter.
 */
function generateTriadic(
  locked: chroma.Color[],
  count: number,
  rng: () => number
): chroma.Color[] {
  const results: chroma.Color[] = [];
  const offsets = [120, 240];

  for (let i = 0; i < count; i++) {
    const base = locked[i % locked.length];
    const offset = offsets[i % offsets.length];
    const hueJitter = (rng() - 0.5) * 20;
    const lightnessShift = (rng() - 0.5) * 30;
    const chromaShift = (rng() - 0.5) * 20;
    results.push(
      varyChroma(
        varyLightness(rotateHue(base, offset + hueJitter), lightnessShift),
        chromaShift
      )
    );
  }

  return results;
}

/**
 * Split-complementary: rotate by ~150deg and ~210deg, with jitter.
 */
function generateSplitComplementary(
  locked: chroma.Color[],
  count: number,
  rng: () => number
): chroma.Color[] {
  const results: chroma.Color[] = [];
  const offsets = [150, 210];

  for (let i = 0; i < count; i++) {
    const base = locked[i % locked.length];
    const offset = offsets[i % offsets.length];
    const hueJitter = (rng() - 0.5) * 20;
    const lightnessShift = (rng() - 0.5) * 30;
    const chromaShift = (rng() - 0.5) * 20;
    results.push(
      varyChroma(
        varyLightness(rotateHue(base, offset + hueJitter), lightnessShift),
        chromaShift
      )
    );
  }

  return results;
}

/**
 * Delta-E Smart: generate candidates in LAB space, score by distance
 * to locked colors, pick mutually distinct ones. The RNG shuffles
 * candidates to produce different selections per variation.
 */
function generateDeltaESmart(
  locked: chroma.Color[],
  count: number,
  rng: () => number
): chroma.Color[] {
  const targetDist = 30 + rng() * 20;
  const candidates: { color: chroma.Color; score: number }[] = [];

  for (let L = 15; L <= 90; L += 8) {
    for (let a = -60; a <= 60; a += 12) {
      for (let b = -60; b <= 60; b += 12) {
        try {
          const c = chroma.lab(L, a, b);
          let score = 0;
          for (const lc of locked) {
            const dist = chroma.deltaE(c, lc);
            score += (dist - targetDist) ** 2;
          }
          // Add small random noise to break ties differently per variation
          score += rng() * 5;
          candidates.push({ color: c, score });
        } catch {
          // skip invalid LAB values
        }
      }
    }
  }

  candidates.sort((a, b) => a.score - b.score);

  const minMutualDist = 12 + rng() * 8;
  const picked: chroma.Color[] = [];

  for (const candidate of candidates) {
    if (picked.length >= count) break;
    const isFarEnough = picked.every(
      (p) => chroma.deltaE(candidate.color, p) >= minMutualDist
    );
    if (isFarEnough) {
      picked.push(candidate.color);
    }
  }

  return picked;
}
