/**
 * Wardrobe item catalog.
 *
 * Unlike rooms where each item appears once, a wardrobe has
 * CATEGORIES of items. You might own 3 pairs of pants and 5 shirts.
 * The catalog defines item types with their visual weight in an
 * outfit and their expected lightness/chroma characteristics.
 *
 * Visual weight (1-10): how much of the outfit this piece dominates.
 * Role: same concept as rooms — foundation pieces want neutrals,
 * accent pieces want the palette's chromatic colors.
 */

export interface WardrobeItemType {
  name: string;
  weight: number;
  category: WardrobeCategory;
  lightnessRange: [number, number];
  role: "foundation" | "core" | "accent";
}

export type WardrobeCategory =
  | "bottoms"
  | "tops"
  | "outerwear"
  | "dresses"
  | "shoes"
  | "accessories";

export const WARDROBE_CATEGORY_LABELS: Record<WardrobeCategory, string> = {
  bottoms: "Bottoms",
  tops: "Tops",
  outerwear: "Outerwear",
  dresses: "Dresses & Jumpsuits",
  shoes: "Shoes",
  accessories: "Accessories",
};

export const WARDROBE_CATALOG: WardrobeItemType[] = [
  // Bottoms
  { name: "Trousers",            weight: 8, category: "bottoms",     lightnessRange: [15, 55], role: "foundation" },
  { name: "Wide Trousers",       weight: 8, category: "bottoms",     lightnessRange: [15, 55], role: "foundation" },
  { name: "Jeans",               weight: 8, category: "bottoms",     lightnessRange: [20, 50], role: "foundation" },
  { name: "Chinos",              weight: 8, category: "bottoms",     lightnessRange: [30, 70], role: "foundation" },
  { name: "Shorts",              weight: 6, category: "bottoms",     lightnessRange: [25, 70], role: "foundation" },
  { name: "Joggers",             weight: 7, category: "bottoms",     lightnessRange: [15, 50], role: "foundation" },
  { name: "Drawstring Pants",    weight: 7, category: "bottoms",     lightnessRange: [15, 55], role: "foundation" },
  { name: "Skirt",               weight: 6, category: "bottoms",     lightnessRange: [15, 75], role: "core" },

  // Tops
  { name: "T-Shirt",             weight: 6, category: "tops",        lightnessRange: [15, 92], role: "core" },
  { name: "Oversized Tee",       weight: 7, category: "tops",        lightnessRange: [15, 92], role: "core" },
  { name: "Button-Down Shirt",   weight: 6, category: "tops",        lightnessRange: [60, 95], role: "core" },
  { name: "Band Collar Shirt",   weight: 6, category: "tops",        lightnessRange: [50, 95], role: "core" },
  { name: "Knit Top",            weight: 6, category: "tops",        lightnessRange: [15, 80], role: "core" },
  { name: "Blouse",              weight: 6, category: "tops",        lightnessRange: [40, 90], role: "core" },
  { name: "Sweater",             weight: 7, category: "tops",        lightnessRange: [15, 80], role: "core" },
  { name: "Turtleneck",          weight: 7, category: "tops",        lightnessRange: [10, 75], role: "core" },
  { name: "Hoodie",              weight: 7, category: "tops",        lightnessRange: [15, 65], role: "core" },
  { name: "Henley",              weight: 6, category: "tops",        lightnessRange: [20, 85], role: "core" },
  { name: "Polo",                weight: 6, category: "tops",        lightnessRange: [25, 85], role: "core" },
  { name: "Tank Top",            weight: 4, category: "tops",        lightnessRange: [15, 92], role: "core" },

  // Outerwear
  { name: "Blazer",              weight: 8, category: "outerwear",   lightnessRange: [15, 55], role: "foundation" },
  { name: "Overcoat",            weight: 9, category: "outerwear",   lightnessRange: [15, 50], role: "foundation" },
  { name: "Workwear Jacket",     weight: 8, category: "outerwear",   lightnessRange: [20, 60], role: "core" },
  { name: "Chore Coat",          weight: 8, category: "outerwear",   lightnessRange: [20, 60], role: "core" },
  { name: "Bomber Jacket",       weight: 7, category: "outerwear",   lightnessRange: [15, 50], role: "foundation" },
  { name: "Denim Jacket",        weight: 7, category: "outerwear",   lightnessRange: [30, 60], role: "core" },
  { name: "Leather Jacket",      weight: 8, category: "outerwear",   lightnessRange: [10, 30], role: "foundation" },
  { name: "Cardigan",            weight: 6, category: "outerwear",   lightnessRange: [20, 75], role: "core" },
  { name: "Vest",                weight: 5, category: "outerwear",   lightnessRange: [15, 55], role: "core" },
  { name: "Raincoat",            weight: 7, category: "outerwear",   lightnessRange: [15, 65], role: "foundation" },
  { name: "Parka",               weight: 9, category: "outerwear",   lightnessRange: [15, 45], role: "foundation" },
  { name: "Shirt Jacket",        weight: 7, category: "outerwear",   lightnessRange: [20, 65], role: "core" },

  // Full-body
  { name: "Dress",               weight: 9, category: "dresses",     lightnessRange: [15, 85], role: "core" },
  { name: "Jumpsuit",            weight: 9, category: "dresses",     lightnessRange: [15, 65], role: "core" },

  // Shoes
  { name: "Dress Shoes",         weight: 3, category: "shoes",       lightnessRange: [10, 35], role: "foundation" },
  { name: "Sneakers",            weight: 3, category: "shoes",       lightnessRange: [60, 97], role: "accent" },
  { name: "Boots",               weight: 4, category: "shoes",       lightnessRange: [10, 35], role: "foundation" },
  { name: "Chelsea Boots",       weight: 4, category: "shoes",       lightnessRange: [10, 40], role: "foundation" },
  { name: "Loafers",             weight: 3, category: "shoes",       lightnessRange: [15, 45], role: "foundation" },
  { name: "Sandals",             weight: 2, category: "shoes",       lightnessRange: [25, 60], role: "accent" },
  { name: "High-Tops",           weight: 4, category: "shoes",       lightnessRange: [10, 40], role: "foundation" },
  { name: "Slip-Ons",            weight: 3, category: "shoes",       lightnessRange: [15, 55], role: "foundation" },

  // Accessories
  { name: "Belt",                weight: 1, category: "accessories", lightnessRange: [10, 40], role: "foundation" },
  { name: "Watch",               weight: 1, category: "accessories", lightnessRange: [20, 70], role: "accent" },
  { name: "Scarf",               weight: 3, category: "accessories", lightnessRange: [20, 75], role: "accent" },
  { name: "Tote Bag",            weight: 4, category: "accessories", lightnessRange: [20, 65], role: "accent" },
  { name: "Crossbody Bag",       weight: 3, category: "accessories", lightnessRange: [15, 50], role: "accent" },
  { name: "Beanie",              weight: 2, category: "accessories", lightnessRange: [10, 50], role: "accent" },
  { name: "Cap",                 weight: 2, category: "accessories", lightnessRange: [15, 55], role: "accent" },
  { name: "Sunglasses",          weight: 1, category: "accessories", lightnessRange: [10, 30], role: "foundation" },
  { name: "Bracelet",            weight: 1, category: "accessories", lightnessRange: [20, 70], role: "accent" },
  { name: "Ring",                weight: 1, category: "accessories", lightnessRange: [30, 80], role: "accent" },
  { name: "Tie",                 weight: 2, category: "accessories", lightnessRange: [15, 65], role: "accent" },
  { name: "Pocket Square",       weight: 1, category: "accessories", lightnessRange: [30, 85], role: "accent" },
  { name: "Hat",                 weight: 3, category: "accessories", lightnessRange: [15, 55], role: "accent" },
  { name: "Bag",                 weight: 4, category: "accessories", lightnessRange: [15, 55], role: "accent" },
  { name: "Jewelry",             weight: 1, category: "accessories", lightnessRange: [40, 80], role: "accent" },
  { name: "Heels",               weight: 3, category: "shoes",       lightnessRange: [10, 45], role: "accent" },
];

export function getWardrobeItem(name: string): WardrobeItemType | undefined {
  return WARDROBE_CATALOG.find(
    (item) => item.name.toLowerCase() === name.toLowerCase().trim()
  );
}

export function getWardrobeByCategory(): Record<WardrobeCategory, WardrobeItemType[]> {
  const result: Record<WardrobeCategory, WardrobeItemType[]> = {
    bottoms: [],
    tops: [],
    outerwear: [],
    dresses: [],
    shoes: [],
    accessories: [],
  };
  for (const item of WARDROBE_CATALOG) {
    result[item.category].push(item);
  }
  return result;
}
