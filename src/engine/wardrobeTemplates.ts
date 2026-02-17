/**
 * Wardrobe templates represent capsule wardrobes — curated sets of
 * items that combine to create many outfits. Unlike rooms (one fixed
 * arrangement), a wardrobe is a POOL of pieces that mix and match.
 *
 * Each template defines the items in the capsule. The auto-fill
 * assigns colors using the same two-lane approach as rooms:
 * foundation pieces get neutrals, core/accent pieces get chromatic.
 */

export interface WardrobeTemplate {
  name: string;
  description: string;
  items: { name: string; count: number }[];
}

export const WARDROBE_TEMPLATES: WardrobeTemplate[] = [
  {
    name: "Casual Essentials",
    description: "Everyday basics that mix and match",
    items: [
      { name: "Jeans", count: 2 },
      { name: "Chinos", count: 1 },
      { name: "T-Shirt", count: 3 },
      { name: "Button-Down Shirt", count: 2 },
      { name: "Sweater", count: 2 },
      { name: "Denim Jacket", count: 1 },
      { name: "Sneakers", count: 2 },
      { name: "Belt", count: 1 },
    ],
  },
  {
    name: "Smart Casual",
    description: "Polished but not formal",
    items: [
      { name: "Trousers", count: 2 },
      { name: "Chinos", count: 2 },
      { name: "Button-Down Shirt", count: 3 },
      { name: "Polo", count: 2 },
      { name: "Blazer", count: 1 },
      { name: "Cardigan", count: 1 },
      { name: "Loafers", count: 2 },
      { name: "Belt", count: 1 },
      { name: "Watch", count: 1 },
    ],
  },
  {
    name: "Workwear",
    description: "Office-ready professional wardrobe",
    items: [
      { name: "Trousers", count: 3 },
      { name: "Button-Down Shirt", count: 4 },
      { name: "Blazer", count: 2 },
      { name: "Tie", count: 2 },
      { name: "Dress Shoes", count: 2 },
      { name: "Belt", count: 1 },
      { name: "Watch", count: 1 },
      { name: "Pocket Square", count: 2 },
    ],
  },
  {
    name: "Minimal Capsule",
    description: "The smallest wardrobe that works",
    items: [
      { name: "Jeans", count: 1 },
      { name: "Trousers", count: 1 },
      { name: "T-Shirt", count: 2 },
      { name: "Button-Down Shirt", count: 1 },
      { name: "Sweater", count: 1 },
      { name: "Overcoat", count: 1 },
      { name: "Sneakers", count: 1 },
      { name: "Dress Shoes", count: 1 },
    ],
  },
  {
    name: "Weekend Getaway",
    description: "Pack light, look good",
    items: [
      { name: "Shorts", count: 2 },
      { name: "Jeans", count: 1 },
      { name: "T-Shirt", count: 3 },
      { name: "Button-Down Shirt", count: 1 },
      { name: "Hoodie", count: 1 },
      { name: "Sandals", count: 1 },
      { name: "Sneakers", count: 1 },
      { name: "Hat", count: 1 },
      { name: "Sunglasses", count: 1 },
    ],
  },
];
