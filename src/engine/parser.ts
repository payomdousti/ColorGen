import chroma from "chroma-js";

/**
 * Attempts to parse a user-provided color string into a chroma.Color.
 * Supports hex (#RRGGBB, RRGGBB), lab(L, a, b), rgb(R, G, B),
 * comma-separated LAB numbers, and CSS named colors.
 * Returns null if the string cannot be parsed.
 */
export function parseColor(input: string): chroma.Color | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Try lab(L, a, b) format
  const labMatch = trimmed.match(
    /^lab\s*\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)$/i
  );
  if (labMatch) {
    const [, L, a, b] = labMatch.map(Number);
    try {
      return chroma.lab(L, a, b);
    } catch {
      return null;
    }
  }

  // Try bare comma-separated numbers as LAB (e.g. "50, 20, -10")
  const commaMatch = trimmed.match(
    /^(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)$/
  );
  if (commaMatch) {
    const [, L, a, b] = commaMatch.map(Number);
    try {
      return chroma.lab(L, a, b);
    } catch {
      return null;
    }
  }

  // Try bare hex without #
  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) {
    try {
      return chroma(`#${trimmed}`);
    } catch {
      return null;
    }
  }

  // Fallback: let chroma try to parse it (hex with #, rgb(), named colors, etc.)
  try {
    return chroma(trimmed);
  } catch {
    return null;
  }
}

/**
 * Format a chroma color to hex string.
 */
export function toHex(color: chroma.Color): string {
  return color.hex();
}

/**
 * Format a chroma color to LAB string.
 */
export function toLab(color: chroma.Color): string {
  const [L, a, b] = color.lab();
  return `${L.toFixed(1)}, ${a.toFixed(1)}, ${b.toFixed(1)}`;
}
