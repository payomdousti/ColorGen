/**
 * Catalog of known room items with semantic visual weight.
 *
 * Weight is a continuous 1-10 scale representing approximate
 * percentage of the visual field the item occupies:
 *   10 = ~40%+ (floors, main walls)
 *    7 = ~15-25% (large furniture, accent walls)
 *    5 = ~8-15% (medium furniture, drapes)
 *    3 = ~3-8% (small furniture, doors)
 *    1 = ~1-3% (trim, hardware, small accents)
 */

export type ItemRole = "background" | "ground" | "anchor" | "accent" | "neutral";

export interface CatalogItem {
  name: string;
  weight: number;
  category: ItemCategory;
  /** Expected lightness range [min, max] on 0-100 scale */
  lightnessRange: [number, number];
  /** Role determines how auto-fill prioritizes this item */
  role: ItemRole;
}

export type ItemCategory =
  | "surfaces"
  | "furniture"
  | "textiles"
  | "fixtures"
  | "accents";

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  surfaces: "Surfaces",
  furniture: "Furniture",
  textiles: "Textiles",
  fixtures: "Fixtures",
  accents: "Accents",
};

export const ITEM_CATALOG: CatalogItem[] = [
  // Surfaces — the bones of the room
  // role: background = should recede (light walls), ground = should anchor (floors)
  // accent = the statement piece, neutral = should blend
  { name: "Floors",              weight: 10, category: "surfaces", lightnessRange: [20, 65], role: "ground" },
  { name: "Main Wall",           weight: 10, category: "surfaces", lightnessRange: [75, 97], role: "background" },
  { name: "Accent Wall",         weight: 7,  category: "surfaces", lightnessRange: [25, 75], role: "accent" },
  { name: "Ceiling",             weight: 8,  category: "surfaces", lightnessRange: [85, 98], role: "background" },
  { name: "Backsplash",          weight: 3,  category: "surfaces", lightnessRange: [40, 85], role: "accent" },
  { name: "Countertop",          weight: 4,  category: "surfaces", lightnessRange: [30, 85], role: "anchor" },
  { name: "Fireplace Surround",  weight: 4,  category: "surfaces", lightnessRange: [30, 80], role: "anchor" },

  // Furniture — the big pieces
  { name: "Couch",               weight: 7,  category: "furniture", lightnessRange: [30, 80], role: "anchor" },
  { name: "Sectional",           weight: 8,  category: "furniture", lightnessRange: [30, 80], role: "anchor" },
  { name: "Armchair",            weight: 4,  category: "furniture", lightnessRange: [25, 75], role: "anchor" },
  { name: "Ottoman",             weight: 3,  category: "furniture", lightnessRange: [30, 75], role: "anchor" },
  { name: "Coffee Table",        weight: 3,  category: "furniture", lightnessRange: [20, 65], role: "anchor" },
  { name: "Dining Table",        weight: 6,  category: "furniture", lightnessRange: [25, 70], role: "anchor" },
  { name: "Dining Chairs",       weight: 4,  category: "furniture", lightnessRange: [25, 70], role: "anchor" },
  { name: "Desk",                weight: 4,  category: "furniture", lightnessRange: [25, 65], role: "anchor" },
  { name: "Desk Chair",          weight: 3,  category: "furniture", lightnessRange: [25, 70], role: "anchor" },
  { name: "Bed Frame",           weight: 6,  category: "furniture", lightnessRange: [20, 60], role: "anchor" },
  { name: "Headboard",           weight: 4,  category: "furniture", lightnessRange: [25, 70], role: "anchor" },
  { name: "Nightstand",          weight: 2,  category: "furniture", lightnessRange: [25, 65], role: "anchor" },
  { name: "Dresser",             weight: 4,  category: "furniture", lightnessRange: [25, 65], role: "anchor" },
  { name: "Built-in Bookshelf",  weight: 5,  category: "furniture", lightnessRange: [25, 70], role: "anchor" },
  { name: "TV Console",          weight: 3,  category: "furniture", lightnessRange: [20, 55], role: "anchor" },
  { name: "Bar Cart",            weight: 2,  category: "furniture", lightnessRange: [30, 70], role: "accent" },
  { name: "Side Table",          weight: 2,  category: "furniture", lightnessRange: [25, 65], role: "anchor" },

  // Textiles — soft goods
  { name: "Rug",                 weight: 6,  category: "textiles", lightnessRange: [30, 80], role: "anchor" },
  { name: "Runner Rug",          weight: 3,  category: "textiles", lightnessRange: [30, 75], role: "anchor" },
  { name: "Drapes",              weight: 5,  category: "textiles", lightnessRange: [55, 90], role: "background" },
  { name: "Sheers",              weight: 3,  category: "textiles", lightnessRange: [80, 97], role: "background" },
  { name: "Duvet Cover",         weight: 7,  category: "textiles", lightnessRange: [60, 90], role: "anchor" },
  { name: "Sheets",              weight: 5,  category: "textiles", lightnessRange: [80, 97], role: "background" },
  { name: "Fitted Sheet",        weight: 4,  category: "textiles", lightnessRange: [80, 97], role: "background" },
  { name: "Pillowcases",         weight: 2,  category: "textiles", lightnessRange: [40, 90], role: "accent" },
  { name: "Throw Pillows",       weight: 2,  category: "textiles", lightnessRange: [30, 80], role: "accent" },
  { name: "Throw Blanket",       weight: 2,  category: "textiles", lightnessRange: [40, 80], role: "accent" },
  { name: "Table Runner",        weight: 1,  category: "textiles", lightnessRange: [40, 80], role: "accent" },
  { name: "Upholstery",          weight: 4,  category: "textiles", lightnessRange: [20, 65], role: "anchor" },

  // Fixtures — built-in or structural
  { name: "Doors",               weight: 3,  category: "fixtures", lightnessRange: [75, 97], role: "neutral" },
  { name: "Cabinet Doors",       weight: 4,  category: "fixtures", lightnessRange: [30, 70], role: "anchor" },
  { name: "Window Frames",       weight: 2,  category: "fixtures", lightnessRange: [75, 97], role: "neutral" },
  { name: "Railing",             weight: 2,  category: "fixtures", lightnessRange: [20, 55], role: "anchor" },
  { name: "Stair Treads",        weight: 3,  category: "fixtures", lightnessRange: [25, 55], role: "ground" },
  { name: "Baseboards",          weight: 1,  category: "fixtures", lightnessRange: [80, 97], role: "neutral" },
  { name: "Crown Molding",       weight: 1,  category: "fixtures", lightnessRange: [85, 97], role: "neutral" },
  { name: "Light Fixture",       weight: 2,  category: "fixtures", lightnessRange: [30, 85], role: "accent" },
  { name: "Pendant Light",       weight: 2,  category: "fixtures", lightnessRange: [30, 85], role: "accent" },
  { name: "Sconce",              weight: 1,  category: "fixtures", lightnessRange: [40, 80], role: "accent" },
  { name: "Shelving",            weight: 3,  category: "fixtures", lightnessRange: [30, 70], role: "anchor" },

  // Accents — small decorative items
  { name: "Artwork",             weight: 3,  category: "accents", lightnessRange: [20, 80], role: "accent" },
  { name: "Mirror Frame",        weight: 2,  category: "accents", lightnessRange: [25, 70], role: "accent" },
  { name: "Vase",                weight: 1,  category: "accents", lightnessRange: [20, 80], role: "accent" },
  { name: "Candles",             weight: 1,  category: "accents", lightnessRange: [60, 95], role: "accent" },
  { name: "Books (spines)",      weight: 1,  category: "accents", lightnessRange: [20, 70], role: "accent" },
  { name: "Plant Pot",           weight: 1,  category: "accents", lightnessRange: [25, 75], role: "accent" },
  { name: "Tray",                weight: 1,  category: "accents", lightnessRange: [30, 70], role: "accent" },
];

/**
 * Look up a catalog item by name (case-insensitive).
 */
export function getCatalogItem(name: string): CatalogItem | undefined {
  const lower = name.toLowerCase().trim();
  return ITEM_CATALOG.find((item) => item.name.toLowerCase() === lower);
}

export function getCatalogWeight(name: string): number {
  return getCatalogItem(name)?.weight ?? 3;
}

export function getCatalogLightnessRange(name: string): [number, number] {
  return getCatalogItem(name)?.lightnessRange ?? [20, 90];
}

export function getCatalogRole(name: string): ItemRole {
  return getCatalogItem(name)?.role ?? "anchor";
}

/**
 * Get catalog items grouped by category, for the add-item picker.
 */
export function getCatalogByCategory(): Record<ItemCategory, CatalogItem[]> {
  const result: Record<ItemCategory, CatalogItem[]> = {
    surfaces: [],
    furniture: [],
    textiles: [],
    fixtures: [],
    accents: [],
  };
  for (const item of ITEM_CATALOG) {
    result[item.category].push(item);
  }
  return result;
}
