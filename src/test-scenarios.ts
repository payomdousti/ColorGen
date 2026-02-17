/**
 * Quick test: run auto-fill against 5 different place scenarios
 * and print the results for judgment.
 *
 * Run with: npx tsx src/test-scenarios.ts
 */
import chroma from "chroma-js";
import { autoFillRoom } from "./engine/roomAssigner";
import { generateHarmony } from "./engine/harmonies";
import { computeHarmonyScore } from "./engine/roomAssigner";
import type { RoomItem } from "./engine/roomTemplates";
import type { FillAlgorithm } from "./engine/roomAssigner";

function makeItem(id: number, name: string, weight: "large" | "medium" | "small", tendency: any = "any", color: chroma.Color | null = null): RoomItem {
  return { id, name, weight, tendency, color };
}

function hex(c: chroma.Color): string {
  return c.hex().toUpperCase();
}

interface Scenario {
  name: string;
  description: string;
  baseColors: string[];
  items: RoomItem[];
}

const scenarios: Scenario[] = [
  {
    name: "1. Venice Spanish House - Living Room",
    description: "Terracotta floors, off-white walls, sage accent, reddish wood, black iron",
    baseColors: ["#B5651D", "#F5F0E8", "#9CAF88", "#8B4513", "#1C1C1C"],
    items: [
      makeItem(1, "Floors", "large", "any"),
      makeItem(2, "Main Wall", "large", "lighter"),
      makeItem(3, "Accent Wall", "medium", "any"),
      makeItem(4, "Built-in Bookshelf", "medium", "any"),
      makeItem(5, "Doors", "medium", "neutral"),
      makeItem(6, "Drapes", "medium", "any"),
      makeItem(7, "Couch", "medium", "any"),
      makeItem(8, "Rug", "medium", "any"),
    ],
  },
  {
    name: "2. Venice Spanish House - Bedroom",
    description: "Same house, bedroom with same architectural colors",
    baseColors: ["#B5651D", "#F5F0E8", "#9CAF88", "#8B4513", "#1C1C1C"],
    items: [
      makeItem(10, "Floors", "large", "any"),
      makeItem(11, "Main Wall", "large", "lighter"),
      makeItem(12, "Accent Wall", "medium", "any"),
      makeItem(13, "Doors", "medium", "neutral"),
      makeItem(14, "Built-in Bookcase", "medium", "any"),
      makeItem(15, "Duvet Cover", "large", "any"),
      makeItem(16, "Sheets", "large", "lighter"),
      makeItem(17, "Fitted Sheet", "large", "lighter"),
      makeItem(18, "Pillowcases", "small", "any"),
      makeItem(19, "Reading Nook", "small", "any"),
      makeItem(20, "Rug", "medium", "any"),
    ],
  },
  {
    name: "3. Manhattan Modern Condo - Living Room",
    description: "Concrete-look floors, white walls, steel grey, dark walnut, glass",
    baseColors: ["#8C8C8C", "#FAFAFA", "#2C2C2C", "#5C4033", "#D4D4D4"],
    items: [
      makeItem(30, "Floors", "large", "any"),
      makeItem(31, "Main Wall", "large", "lighter"),
      makeItem(32, "Accent Wall", "medium", "any"),
      makeItem(33, "Built-in Shelving", "medium", "any"),
      makeItem(34, "Doors", "medium", "neutral"),
      makeItem(35, "Window Treatments", "medium", "any"),
      makeItem(36, "Sofa", "medium", "any"),
      makeItem(37, "Rug", "medium", "any"),
    ],
  },
  {
    name: "4. Scandinavian Cabin - Living Room",
    description: "Light pine floors, white walls, wool textures, natural materials",
    baseColors: ["#D4B896", "#F8F4EF", "#B8A88A", "#FFFFFF", "#4A4A4A"],
    items: [
      makeItem(40, "Floors", "large", "any"),
      makeItem(41, "Main Wall", "large", "lighter"),
      makeItem(42, "Fireplace Wall", "medium", "warmer"),
      makeItem(43, "Built-in Bench", "medium", "any"),
      makeItem(44, "Doors", "medium", "neutral"),
      makeItem(45, "Curtains", "medium", "lighter"),
      makeItem(46, "Sofa", "medium", "any"),
      makeItem(47, "Rug", "medium", "any"),
    ],
  },
  {
    name: "5. Tropical Bali Villa - Bedroom",
    description: "Dark teak floors, white lime walls, rattan, tropical greenery",
    baseColors: ["#5C3A1E", "#F2EDE6", "#8DB580", "#C4A76C", "#3B2F1A"],
    items: [
      makeItem(50, "Floors", "large", "any"),
      makeItem(51, "Main Wall", "large", "lighter"),
      makeItem(52, "Feature Wall", "medium", "any"),
      makeItem(53, "Doors", "medium", "neutral"),
      makeItem(54, "Bed Frame", "medium", "warmer"),
      makeItem(55, "Duvet Cover", "large", "lighter"),
      makeItem(56, "Sheets", "large", "lighter"),
      makeItem(57, "Pillowcases", "small", "any"),
      makeItem(58, "Rattan Chair", "small", "warmer"),
      makeItem(59, "Rug", "medium", "any"),
    ],
  },
];

const algorithm: FillAlgorithm = "surface-area";

for (const scenario of scenarios) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(scenario.name);
  console.log(scenario.description);
  console.log(`${"=".repeat(60)}`);

  // Generate palette: base + 6 analogous colors
  const bases = scenario.baseColors.map((h) => chroma(h));
  const generated = generateHarmony(bases, "analogous", 6, 0, Date.now());
  const palette = [...bases, ...generated];

  console.log(`\nPalette (${palette.length} colors):`);
  for (const c of palette) {
    const [L] = c.lab();
    const [, C, H] = c.lch();
    console.log(`  ${hex(c)}  L:${L.toFixed(0)} C:${C.toFixed(0)} H:${H.toFixed(0)}`);
  }

  // Auto-fill
  const filled = autoFillRoom(scenario.items, palette, algorithm);
  const assignedColors = filled.filter((i) => i.color !== null).map((i) => i.color!);
  const score = computeHarmonyScore(assignedColors, algorithm, palette);

  console.log(`\nRoom (harmony: ${score}):`);
  for (const item of filled) {
    if (item.color) {
      console.log(`  ${item.name.padEnd(22)} ${hex(item.color)}  (${item.weight}, ${item.tendency})`);
    } else {
      console.log(`  ${item.name.padEnd(22)} UNASSIGNED`);
    }
  }

  // Count unique colors used
  const uniqueHexes = new Set(filled.filter((i) => i.color).map((i) => hex(i.color!)));
  console.log(`\nUnique colors used: ${uniqueHexes.size} / ${palette.length} palette colors`);

  // Judge
  console.log(`\n--- JUDGMENT ---`);
  if (uniqueHexes.size <= 2 && filled.length > 4) {
    console.log("BAD: Too few unique colors. Room would look monotone.");
  } else if (uniqueHexes.size >= filled.length * 0.7) {
    console.log("GOOD: Good variety of palette colors used.");
  } else {
    console.log("OK: Moderate variety. Some repetition but not monotone.");
  }
}
