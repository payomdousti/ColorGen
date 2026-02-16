import type chroma from "chroma-js";

export interface RoomItem {
  id: number;
  name: string;
  color: chroma.Color | null;
}

export interface RoomTemplate {
  name: string;
  items: Omit<RoomItem, "id">[];
}

export const ROOM_TEMPLATES: RoomTemplate[] = [
  {
    name: "Living Room",
    items: [
      { name: "Floors", color: null },
      { name: "Main Wall", color: null },
      { name: "Accent Wall", color: null },
      { name: "Built-in Bookshelf", color: null },
      { name: "Doors", color: null },
      { name: "Drapes", color: null },
      { name: "Couch", color: null },
      { name: "Rug", color: null },
    ],
  },
  {
    name: "Bedroom",
    items: [
      { name: "Floors", color: null },
      { name: "Main Wall", color: null },
      { name: "Accent Wall", color: null },
      { name: "Doors", color: null },
      { name: "Built-in Bookcase", color: null },
      { name: "Duvet Cover", color: null },
      { name: "Sheets", color: null },
      { name: "Fitted Sheet", color: null },
      { name: "Pillowcases", color: null },
      { name: "Reading Nook Upholstery", color: null },
      { name: "Rug", color: null },
    ],
  },
];
