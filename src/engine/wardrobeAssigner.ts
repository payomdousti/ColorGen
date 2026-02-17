import chroma from "chroma-js";
import type { RoomItem } from "./roomTemplates";
import { getWardrobeItem } from "./wardrobeCatalog";

/**
 * Auto-fill wardrobe using two lanes (same principle as rooms):
 * foundation pieces get neutrals, core/accent get chromatic colors.
 *
 * Key difference from rooms: when an item type appears multiple times
 * (e.g. 3 t-shirts), spread the instances across the lightness range
 * so you get a dark tee, a mid tee, and a light tee — not three of
 * the same shade.
 */
export function autoFillWardrobe(
  items: RoomItem[],
  palette: chroma.Color[]
): RoomItem[] {
  if (palette.length === 0) return items;
  const result = [...items];

  type LaneItem = { idx: number; targetL: number; rangeWidth: number };
  const foundation: LaneItem[] = [];
  const accent: LaneItem[] = [];

  // For items with multiple instances, spread their target lightness
  // across their range instead of clustering at the midpoint.
  // Extract base type name by stripping trailing " 1", " 2", etc.
  function baseName(name: string): string {
    return name.replace(/\s+\d+$/, "");
  }

  const typeCounts = new Map<string, number>();
  const typeIdx = new Map<string, number>();
  for (const item of result) {
    if (item.color !== null) continue;
    const base = baseName(item.name);
    typeCounts.set(base, (typeCounts.get(base) || 0) + 1);
  }

  for (let i = 0; i < result.length; i++) {
    if (result[i].color !== null) continue;

    const base = baseName(result[i].name);
    const count = typeCounts.get(base) || 1;
    const instance = typeIdx.get(base) || 0;
    typeIdx.set(base, instance + 1);

    const wi = getWardrobeItem(base);
    const [minL, maxL] = wi
      ? wi.lightnessRange
      : [20, 80];
    const role = wi?.role ?? "core";

    // Spread instances across the lightness range
    const targetL = count > 1
      ? minL + (instance / (count - 1)) * (maxL - minL)
      : (minL + maxL) / 2;

    const rangeWidth = maxL - minL;
    if (role === "foundation") {
      foundation.push({ idx: i, targetL, rangeWidth });
    } else {
      accent.push({ idx: i, targetL, rangeWidth });
    }
  }

  // Split palette into chromatic and neutral
  const chromatic = [...palette]
    .filter((c) => c.lch()[1] > 12)
    .sort((a, b) => b.lch()[1] - a.lch()[1]);
  const neutral = [...palette].filter((c) => c.lch()[1] <= 12);

  // Greedy diverse selection for accent/core colors
  const accentColors: chroma.Color[] = [];
  const remaining = [...chromatic];
  for (let i = 0; i < accent.length && remaining.length > 0; i++) {
    if (i === 0) {
      accentColors.push(remaining.shift()!);
    } else {
      let bestIdx = 0, bestDist = -1;
      for (let j = 0; j < remaining.length; j++) {
        const md = Math.min(
          ...accentColors.map((ac) => chroma.deltaE(remaining[j], ac))
        );
        if (md > bestDist) { bestDist = md; bestIdx = j; }
      }
      accentColors.push(remaining.splice(bestIdx, 1)[0]);
    }
  }

  // Foundation gets neutrals + least-chromatic leftovers if needed
  const needed = Math.max(0, foundation.length - neutral.length);
  const extras = remaining
    .sort((a, b) => a.lch()[1] - b.lch()[1])
    .slice(0, needed);
  const foundationColors = [...neutral, ...extras];

  /**
   * Nearest-target assignment. Each item picks the color whose
   * lightness is closest to its targetL.
   *
   * deplete=true (accent/core): remove each picked color from the
   * pool so different items get different colors.
   *
   * deplete=false (foundation): items pick independently, so
   * multiple dark items can share the same dark color. This is
   * how people actually dress — matching belt and boots is normal.
   */
  function matchByTarget(
    lane: { idx: number; targetL: number }[],
    colors: chroma.Color[],
    deplete: boolean = true
  ) {
    if (lane.length === 0 || colors.length === 0) return;
    const pool = colors.map((c) => ({ color: c, L: c.lab()[0] }));

    for (const item of lane) {
      if (pool.length === 0) break;
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let j = 0; j < pool.length; j++) {
        const dist = Math.abs(pool[j].L - item.targetL);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = j;
        }
      }
      result[item.idx] = {
        ...result[item.idx],
        color: pool[bestIdx].color,
      };
      if (deplete) {
        pool.splice(bestIdx, 1);
      }
    }
  }

  // Most constrained accent items pick first (narrowest lightness range)
  accent.sort((a, b) => a.rangeWidth - b.rangeWidth);

  if (accentColors.length === 0) {
    matchByTarget([...foundation, ...accent], [...palette], false);
  } else if (foundationColors.length === 0) {
    matchByTarget([...foundation, ...accent], [...palette], true);
  } else {
    matchByTarget(accent, accentColors, true);
    matchByTarget(foundation, foundationColors, false);
  }

  return result;
}
