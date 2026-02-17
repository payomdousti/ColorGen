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
 * If no locked colors, generates a random palette from scratch.
 */
export function generateHarmony(
  lockedColors: chroma.Color[],
  mode: HarmonyMode,
  count: number,
  variation: number = 0,
  batchSeed: number = 0
): chroma.Color[] {
  if (count <= 0) return [];

  const rng = mulberry32(batchSeed + variation * 7919);

  // No locked colors: generate a random base, then build from it
  if (lockedColors.length === 0) {
    const baseHue = rng() * 360;
    const baseL = 40 + rng() * 30;
    const baseC = 15 + rng() * 40;
    const base = chroma.lch(baseL, baseC, baseHue);
    return generateFromBase([base], mode, count, rng);
  }

  return generateFromBase(lockedColors, mode, count, rng);
}

function generateFromBase(
  bases: chroma.Color[],
  mode: HarmonyMode,
  count: number,
  rng: () => number
): chroma.Color[] {
  switch (mode) {
    case "complementary":
      return genComplementary(bases, count, rng);
    case "analogous":
      return genAnalogous(bases, count, rng);
    case "triadic":
      return genTriadic(bases, count, rng);
    case "split-complementary":
      return genSplitComplementary(bases, count, rng);
    case "delta-e-smart":
      return genDeltaESmart(bases, count, rng);
    default:
      return genAnalogous(bases, count, rng);
  }
}

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

// ─── Utilities ────────────────────────────────────────────────────

function rotateHue(color: chroma.Color, degrees: number): chroma.Color {
  const [l, c, h] = color.lch();
  const newHue = ((h || 0) + degrees + 360) % 360;
  return chroma.lch(l, c, newHue);
}

function varyLCH(
  color: chroma.Color,
  dL: number,
  dC: number,
  dH: number
): chroma.Color {
  const [l, c, h] = color.lch();
  return chroma.lch(
    Math.max(15, Math.min(97, l + dL)),
    Math.max(0, Math.min(55, c + dC)),
    ((h || 0) + dH + 360) % 360
  );
}

// ─── Generators ───────────────────────────────────────────────────

function genComplementary(
  bases: chroma.Color[],
  count: number,
  rng: () => number
): chroma.Color[] {
  const results: chroma.Color[] = [];
  const complements = bases.map((c) => rotateHue(c, 180));
  const allBases = [...complements, ...bases];

  for (let i = 0; i < count; i++) {
    const base = allBases[i % allBases.length];
    results.push(
      varyLCH(
        base,
        (rng() - 0.5) * 60,  // wide lightness range
        (rng() - 0.7) * 40,  // chroma: biased toward reducing saturation
        (rng() - 0.5) * 30   // moderate hue jitter
      )
    );
  }
  return results;
}

function genAnalogous(
  bases: chroma.Color[],
  count: number,
  rng: () => number
): chroma.Color[] {
  const results: chroma.Color[] = [];

  for (let i = 0; i < count; i++) {
    const base = bases[i % bases.length];
    results.push(
      varyLCH(
        base,
        (rng() - 0.5) * 60,  // wide lightness
        (rng() - 0.7) * 40,  // chroma: biased toward reducing
        (rng() - 0.5) * 70   // +/-35deg hue spread
      )
    );
  }
  return results;
}

function genTriadic(
  bases: chroma.Color[],
  count: number,
  rng: () => number
): chroma.Color[] {
  const results: chroma.Color[] = [];
  const offsets = [0, 120, 240];

  for (let i = 0; i < count; i++) {
    const base = bases[i % bases.length];
    const offset = offsets[i % offsets.length];
    results.push(
      varyLCH(
        rotateHue(base, offset),
        (rng() - 0.5) * 60,
        (rng() - 0.7) * 40,
        (rng() - 0.5) * 30  // jitter around the triadic points
      )
    );
  }
  return results;
}

function genSplitComplementary(
  bases: chroma.Color[],
  count: number,
  rng: () => number
): chroma.Color[] {
  const results: chroma.Color[] = [];
  const offsets = [0, 150, 210];

  for (let i = 0; i < count; i++) {
    const base = bases[i % bases.length];
    const offset = offsets[i % offsets.length];
    results.push(
      varyLCH(
        rotateHue(base, offset),
        (rng() - 0.5) * 60,
        (rng() - 0.7) * 40,
        (rng() - 0.5) * 30
      )
    );
  }
  return results;
}

function genDeltaESmart(
  bases: chroma.Color[],
  count: number,
  rng: () => number
): chroma.Color[] {
  const targetDist = 25 + rng() * 25;
  const candidates: { color: chroma.Color; score: number }[] = [];

  for (let L = 15; L <= 90; L += 8) {
    for (let a = -60; a <= 60; a += 12) {
      for (let b = -60; b <= 60; b += 12) {
        try {
          const c = chroma.lab(L, a, b);
          let score = 0;
          for (const bc of bases) {
            const dist = chroma.deltaE(c, bc);
            score += (dist - targetDist) ** 2;
          }
          score += rng() * 10; // noise per variation
          candidates.push({ color: c, score });
        } catch {
          // skip
        }
      }
    }
  }

  candidates.sort((a, b) => a.score - b.score);

  const minDist = 10 + rng() * 10;
  const picked: chroma.Color[] = [];

  for (const candidate of candidates) {
    if (picked.length >= count) break;
    const ok = picked.every(
      (p) => chroma.deltaE(candidate.color, p) >= minDist
    );
    if (ok) picked.push(candidate.color);
  }

  return picked;
}
