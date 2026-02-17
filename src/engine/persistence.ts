import chroma from "chroma-js";
import type { RoomItem, ItemWeight, Tendency } from "./roomTemplates";

const STORAGE_KEY = "colorgen_state";

// ─── Serializable shapes ─────────────────────────────────────────

interface SerializedEntry {
  hex: string | null;
  locked: boolean;
  id: number;
}

interface SerializedSuggestion {
  hexes: string[];
  pinned: boolean;
}

interface SerializedRoomItem {
  id: number;
  name: string;
  hex: string | null;
  weight: ItemWeight;
  tendency: Tendency;
}

export interface AppState {
  activeTab: "palette" | "room";

  // Palette tab
  entries: SerializedEntry[];
  suggestions: SerializedSuggestion[];
  harmonyMode: string;
  colorCount: number;
  suggestionCount: number;

  // Room tab
  roomItems: SerializedRoomItem[];
  selectedTemplate: string;
  fillAlgorithm: string;
  manuallyAssigned: number[];
}

// ─── Save ─────────────────────────────────────────────────────────

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage full or unavailable -- silently fail
  }
}

// ─── Load ─────────────────────────────────────────────────────────

export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AppState;
  } catch {
    return null;
  }
}

// ─── Converters ───────────────────────────────────────────────────

export function serializeEntries(
  entries: { color: chroma.Color | null; locked: boolean; id: number }[]
): SerializedEntry[] {
  return entries.map((e) => ({
    hex: e.color ? e.color.hex() : null,
    locked: e.locked,
    id: e.id,
  }));
}

export function deserializeEntries(
  entries: SerializedEntry[]
): { color: chroma.Color | null; locked: boolean; id: number }[] {
  return entries.map((e) => ({
    color: e.hex ? chroma(e.hex) : null,
    locked: e.locked,
    id: e.id,
  }));
}

export function serializeSuggestions(
  suggestions: { colors: chroma.Color[]; pinned: boolean }[]
): SerializedSuggestion[] {
  return suggestions.map((s) => ({
    hexes: s.colors.map((c) => c.hex()),
    pinned: s.pinned,
  }));
}

export function deserializeSuggestions(
  suggestions: SerializedSuggestion[]
): { colors: chroma.Color[]; pinned: boolean }[] {
  return suggestions.map((s) => ({
    colors: s.hexes.map((h) => chroma(h)),
    pinned: s.pinned,
  }));
}

export function serializeRoomItems(items: RoomItem[]): SerializedRoomItem[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    hex: item.color ? item.color.hex() : null,
    weight: item.weight,
    tendency: item.tendency,
  }));
}

export function deserializeRoomItems(items: SerializedRoomItem[]): RoomItem[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    color: item.hex ? chroma(item.hex) : null,
    weight: item.weight,
    tendency: item.tendency,
  }));
}
