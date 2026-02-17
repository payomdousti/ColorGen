/**
 * Outfit templates — generic outfit types, not brand-specific.
 */

export interface OutfitTemplate {
  name: string;
  description: string;
  items: string[];
}

export const OUTFIT_TEMPLATES: OutfitTemplate[] = [
  {
    name: "Casual",
    description: "Everyday basics",
    items: ["T-Shirt", "Jeans", "Sneakers", "Belt", "Watch"],
  },
  {
    name: "Smart Casual",
    description: "Polished but relaxed",
    items: ["Button-Down Shirt", "Chinos", "Loafers", "Belt", "Watch"],
  },
  {
    name: "Formal",
    description: "Suit and tie",
    items: ["Button-Down Shirt", "Trousers", "Blazer", "Dress Shoes", "Belt", "Tie"],
  },
  {
    name: "Evening Out",
    description: "Going out for dinner or drinks",
    items: ["Turtleneck", "Trousers", "Blazer", "Chelsea Boots"],
  },
  {
    name: "Relaxed",
    description: "Comfortable and easy",
    items: ["Sweater", "Drawstring Pants", "Slip-Ons", "Beanie"],
  },
  {
    name: "Workwear",
    description: "Chore coat and denim",
    items: ["Chore Coat", "T-Shirt", "Jeans", "Boots", "Belt"],
  },
  {
    name: "Layered",
    description: "Cardigan or jacket over a tee",
    items: ["Cardigan", "T-Shirt", "Chinos", "Loafers"],
  },
  {
    name: "Minimal",
    description: "Clean knit and wide trousers",
    items: ["Knit Top", "Wide Trousers", "Slip-Ons", "Tote Bag"],
  },
  {
    name: "Dark",
    description: "Head-to-toe dark tones",
    items: ["Turtleneck", "Wide Trousers", "Chelsea Boots", "Crossbody Bag"],
  },
  {
    name: "Summer",
    description: "Warm weather essentials",
    items: ["Band Collar Shirt", "Shorts", "Sandals", "Sunglasses"],
  },
  {
    name: "Winter",
    description: "Cold weather layers",
    items: ["Parka", "Turtleneck", "Jeans", "Boots", "Beanie"],
  },
  {
    name: "Overcoat",
    description: "Coat over a knit, tailored bottoms",
    items: ["Overcoat", "Knit Top", "Trousers", "Dress Shoes", "Scarf"],
  },
  {
    name: "Bomber",
    description: "Bomber jacket over a simple base",
    items: ["Bomber Jacket", "T-Shirt", "Trousers", "Sneakers"],
  },
  {
    name: "Shirt Jacket",
    description: "Light outer layer for mild weather",
    items: ["Shirt Jacket", "T-Shirt", "Drawstring Pants", "Sandals", "Sunglasses"],
  },
  {
    name: "Denim",
    description: "Denim jacket and jeans",
    items: ["Denim Jacket", "T-Shirt", "Jeans", "Chelsea Boots", "Belt"],
  },
  {
    name: "Athleisure",
    description: "Sporty and comfortable",
    items: ["Hoodie", "Joggers", "Sneakers", "Cap"],
  },
  {
    name: "Oversized",
    description: "Relaxed proportions, wide fit",
    items: ["Oversized Tee", "Wide Trousers", "Loafers", "Bracelet"],
  },
  {
    name: "Tailored Dark",
    description: "Dark blazer with a knit underneath",
    items: ["Blazer", "Turtleneck", "Trousers", "Dress Shoes", "Watch"],
  },
  {
    name: "Henley Layer",
    description: "Jacket over henley and denim",
    items: ["Workwear Jacket", "Henley", "Jeans", "Boots", "Watch"],
  },
  {
    name: "Effortless",
    description: "Just a great shirt and great pants",
    items: ["Button-Down Shirt", "Trousers", "Loafers", "Watch"],
  },
  {
    name: "Custom Outfit",
    description: "Build your own",
    items: [],
  },
];
