/**
 * Outfit templates — each represents a single outfit you'd wear.
 * Designed around: Le Laboureur / Maison Margiela / Issey Miyake /
 * The Row / Rick Owens / John Elliott / Norse Projects / Bode.
 */

export interface OutfitTemplate {
  name: string;
  description: string;
  items: string[];
}

export const OUTFIT_TEMPLATES: OutfitTemplate[] = [
  {
    name: "French Workwear",
    description: "Le Laboureur chore coat, Margiela tee, dark denim",
    items: ["Chore Coat", "T-Shirt", "Jeans", "Boots", "Belt"],
  },
  {
    name: "The Row Lunch",
    description: "Clean knit, tailored wide trousers, slip-ons",
    items: ["Knit Top", "Wide Trousers", "Slip-Ons", "Tote Bag"],
  },
  {
    name: "Rick Layered",
    description: "Dark draped layers",
    items: ["Tank Top", "Hoodie", "Drawstring Pants", "High-Tops"],
  },
  {
    name: "Norse Minimal",
    description: "Scandinavian clean lines",
    items: ["Sweater", "Chinos", "Sneakers", "Watch"],
  },
  {
    name: "Gallery Opening",
    description: "Oversized Margiela with wide pants",
    items: ["Oversized Tee", "Wide Trousers", "Loafers", "Bracelet"],
  },
  {
    name: "Issey Evening",
    description: "Architectural layers for going out",
    items: ["Turtleneck", "Trousers", "Blazer", "Chelsea Boots"],
  },
  {
    name: "John Elliott Basics",
    description: "Elevated essential menswear",
    items: ["T-Shirt", "Joggers", "Sneakers", "Cap"],
  },
  {
    name: "Workwear Layers",
    description: "French jacket over henley and denim",
    items: ["Workwear Jacket", "Henley", "Jeans", "Boots", "Watch"],
  },
  {
    name: "All Black",
    description: "Head-to-toe dark — Rick meets Margiela",
    items: ["Turtleneck", "Wide Trousers", "Chelsea Boots", "Crossbody Bag"],
  },
  {
    name: "Weekend Venice",
    description: "LA easy — shirt jacket and drawstring",
    items: ["Shirt Jacket", "T-Shirt", "Drawstring Pants", "Sandals", "Sunglasses"],
  },
  {
    name: "Smart Overcoat",
    description: "Overcoat over knit, tailored bottoms",
    items: ["Overcoat", "Knit Top", "Trousers", "Dress Shoes", "Scarf"],
  },
  {
    name: "Margiela Decon",
    description: "Oversized proportions, minimal accessories",
    items: ["Oversized Tee", "Jeans", "Boots", "Ring"],
  },
  {
    name: "Summer Minimal",
    description: "Warm weather, pared back",
    items: ["Band Collar Shirt", "Shorts", "Sandals", "Sunglasses"],
  },
  {
    name: "Norse Layered",
    description: "Cardigan over tee, clean bottoms",
    items: ["Cardigan", "T-Shirt", "Chinos", "Loafers"],
  },
  {
    name: "Dark Tailored",
    description: "Blazer with turtleneck, evening-ready",
    items: ["Blazer", "Turtleneck", "Trousers", "Dress Shoes", "Watch"],
  },
  {
    name: "Studio Day",
    description: "Comfortable creative work outfit",
    items: ["Sweater", "Drawstring Pants", "Slip-Ons", "Beanie"],
  },
  {
    name: "Bomber Clean",
    description: "Bomber over minimal base",
    items: ["Bomber Jacket", "T-Shirt", "Trousers", "Sneakers"],
  },
  {
    name: "Denim on Denim",
    description: "Tonal denim with contrast",
    items: ["Denim Jacket", "T-Shirt", "Jeans", "Chelsea Boots", "Belt"],
  },
  {
    name: "Parka Weather",
    description: "Cold weather, bundled up",
    items: ["Parka", "Turtleneck", "Jeans", "Boots", "Beanie"],
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
