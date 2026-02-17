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

export interface CatalogItem {
  name: string;
  weight: number;
  category: ItemCategory;
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
  { name: "Floors",              weight: 10, category: "surfaces" },
  { name: "Main Wall",           weight: 10, category: "surfaces" },
  { name: "Accent Wall",         weight: 7,  category: "surfaces" },
  { name: "Ceiling",             weight: 8,  category: "surfaces" },
  { name: "Backsplash",          weight: 3,  category: "surfaces" },
  { name: "Countertop",          weight: 4,  category: "surfaces" },
  { name: "Fireplace Surround",  weight: 4,  category: "surfaces" },

  // Furniture — the big pieces
  { name: "Couch",               weight: 7,  category: "furniture" },
  { name: "Sectional",           weight: 8,  category: "furniture" },
  { name: "Armchair",            weight: 4,  category: "furniture" },
  { name: "Ottoman",             weight: 3,  category: "furniture" },
  { name: "Coffee Table",        weight: 3,  category: "furniture" },
  { name: "Dining Table",        weight: 6,  category: "furniture" },
  { name: "Dining Chairs",       weight: 4,  category: "furniture" },
  { name: "Desk",                weight: 4,  category: "furniture" },
  { name: "Desk Chair",          weight: 3,  category: "furniture" },
  { name: "Bed Frame",           weight: 6,  category: "furniture" },
  { name: "Headboard",           weight: 4,  category: "furniture" },
  { name: "Nightstand",          weight: 2,  category: "furniture" },
  { name: "Dresser",             weight: 4,  category: "furniture" },
  { name: "Built-in Bookshelf",  weight: 5,  category: "furniture" },
  { name: "TV Console",          weight: 3,  category: "furniture" },
  { name: "Bar Cart",            weight: 2,  category: "furniture" },
  { name: "Side Table",          weight: 2,  category: "furniture" },

  // Textiles — soft goods
  { name: "Rug",                 weight: 6,  category: "textiles" },
  { name: "Runner Rug",          weight: 3,  category: "textiles" },
  { name: "Drapes",              weight: 5,  category: "textiles" },
  { name: "Sheers",              weight: 3,  category: "textiles" },
  { name: "Duvet Cover",         weight: 7,  category: "textiles" },
  { name: "Sheets",              weight: 5,  category: "textiles" },
  { name: "Fitted Sheet",        weight: 4,  category: "textiles" },
  { name: "Pillowcases",         weight: 2,  category: "textiles" },
  { name: "Throw Pillows",       weight: 2,  category: "textiles" },
  { name: "Throw Blanket",       weight: 2,  category: "textiles" },
  { name: "Table Runner",        weight: 1,  category: "textiles" },
  { name: "Upholstery",          weight: 4,  category: "textiles" },

  // Fixtures — built-in or structural
  { name: "Doors",               weight: 3,  category: "fixtures" },
  { name: "Cabinet Doors",       weight: 4,  category: "fixtures" },
  { name: "Window Frames",       weight: 2,  category: "fixtures" },
  { name: "Railing",             weight: 2,  category: "fixtures" },
  { name: "Stair Treads",        weight: 3,  category: "fixtures" },
  { name: "Baseboards",          weight: 1,  category: "fixtures" },
  { name: "Crown Molding",       weight: 1,  category: "fixtures" },
  { name: "Light Fixture",       weight: 2,  category: "fixtures" },
  { name: "Pendant Light",       weight: 2,  category: "fixtures" },
  { name: "Sconce",              weight: 1,  category: "fixtures" },
  { name: "Shelving",            weight: 3,  category: "fixtures" },

  // Accents — small decorative items
  { name: "Artwork",             weight: 3,  category: "accents" },
  { name: "Mirror Frame",        weight: 2,  category: "accents" },
  { name: "Vase",                weight: 1,  category: "accents" },
  { name: "Candles",             weight: 1,  category: "accents" },
  { name: "Books (spines)",      weight: 1,  category: "accents" },
  { name: "Plant Pot",           weight: 1,  category: "accents" },
  { name: "Tray",                weight: 1,  category: "accents" },
];

/**
 * Look up a catalog item by name (case-insensitive).
 * Returns the default weight for known items, or 3 for unknown.
 */
export function getCatalogWeight(name: string): number {
  const lower = name.toLowerCase().trim();
  const match = ITEM_CATALOG.find((item) => item.name.toLowerCase() === lower);
  return match?.weight ?? 3;
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
