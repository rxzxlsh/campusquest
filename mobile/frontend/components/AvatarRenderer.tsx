// components/AvatarRenderer.tsx
// Draws a Minecraft-style 2D pixel character using React Native Views.
// Each "pixel" is a tiny View with a background color.
// Items are layered on top via the equipped items list.

import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";

// ─── Pixel Grid Type ─────────────────────────────────────────────────────────
// Each row is an array of color strings or null (transparent).
type PixelGrid = (string | null)[][];

// ─── Base Character Sprite ────────────────────────────────────────────────────
// 8×16 grid. Classic Minecraft Steve proportions.
const BASE_SKIN = "#d4a96a";
const BASE_DARK = "#b8905a";
const EYE_COLOR = "#1a1a2e";
const SHIRT_COLOR = "#3c78d8"; // default UTM blue shirt
const PANTS_COLOR = "#1a3a6e";
const SHOE_COLOR = "#2a1a0e";

const BASE_SPRITE: PixelGrid = [
  // Row 0-3: Head
  [null, null, BASE_SKIN, BASE_SKIN, BASE_SKIN, BASE_SKIN, null, null],
  [null, BASE_SKIN, BASE_SKIN, BASE_SKIN, BASE_SKIN, BASE_SKIN, BASE_SKIN, null],
  [null, BASE_SKIN, EYE_COLOR, BASE_SKIN, BASE_SKIN, EYE_COLOR, BASE_SKIN, null],
  [null, BASE_SKIN, BASE_SKIN, BASE_DARK, BASE_DARK, BASE_SKIN, BASE_SKIN, null],
  // Row 4: Neck
  [null, null, null, BASE_SKIN, BASE_SKIN, null, null, null],
  // Row 5-9: Body (shirt)
  [null, SHIRT_COLOR, SHIRT_COLOR, SHIRT_COLOR, SHIRT_COLOR, SHIRT_COLOR, SHIRT_COLOR, null],
  [SHIRT_COLOR, SHIRT_COLOR, SHIRT_COLOR, SHIRT_COLOR, SHIRT_COLOR, SHIRT_COLOR, SHIRT_COLOR, SHIRT_COLOR],
  [SHIRT_COLOR, SHIRT_COLOR, SHIRT_COLOR, SHIRT_COLOR, SHIRT_COLOR, SHIRT_COLOR, SHIRT_COLOR, SHIRT_COLOR],
  [SHIRT_COLOR, SHIRT_COLOR, SHIRT_COLOR, SHIRT_COLOR, SHIRT_COLOR, SHIRT_COLOR, SHIRT_COLOR, SHIRT_COLOR],
  [null, SHIRT_COLOR, SHIRT_COLOR, SHIRT_COLOR, SHIRT_COLOR, SHIRT_COLOR, SHIRT_COLOR, null],
  // Row 10-13: Legs (pants)
  [null, PANTS_COLOR, PANTS_COLOR, null, null, PANTS_COLOR, PANTS_COLOR, null],
  [null, PANTS_COLOR, PANTS_COLOR, null, null, PANTS_COLOR, PANTS_COLOR, null],
  [null, PANTS_COLOR, PANTS_COLOR, null, null, PANTS_COLOR, PANTS_COLOR, null],
  [null, PANTS_COLOR, PANTS_COLOR, null, null, PANTS_COLOR, PANTS_COLOR, null],
  // Row 14-15: Shoes
  [null, SHOE_COLOR, SHOE_COLOR, null, null, SHOE_COLOR, SHOE_COLOR, null],
  [null, SHOE_COLOR, SHOE_COLOR, null, null, SHOE_COLOR, SHOE_COLOR, null],
];

// ─── Item Overlay Layers ──────────────────────────────────────────────────────
// Each item overlay is a sparse PixelGrid (same 8×16 dimensions).
// null = transparent (show base layer underneath).

const ITEM_OVERLAYS: Record<string, PixelGrid> = {
  // ── Hats ──
  HAT_DEFAULT: [
    [null, "#1a5fa8", "#1a5fa8", "#1a5fa8", "#1a5fa8", "#1a5fa8", "#1a5fa8", null],
    ["#1a5fa8", "#1a5fa8", "#1a5fa8", "#1a5fa8", "#1a5fa8", "#1a5fa8", "#1a5fa8", "#1a5fa8"],
    ...Array(14).fill(Array(8).fill(null)),
  ],
  HAT_PROF: [
    [null, "#1a1a1a", "#1a1a1a", "#1a1a1a", "#1a1a1a", "#1a1a1a", "#1a1a1a", null],
    ["#1a1a1a", "#1a1a1a", "#2a2a2a", "#2a2a2a", "#2a2a2a", "#2a2a2a", "#1a1a1a", "#1a1a1a"],
    ...Array(14).fill(Array(8).fill(null)),
  ],
  HAT_CROWN: [
    [null, "#ffd700", null, "#ffd700", "#ffd700", null, "#ffd700", null],
    [null, "#ffd700", "#ffd700", "#ffd700", "#ffd700", "#ffd700", "#ffd700", null],
    ...Array(14).fill(Array(8).fill(null)),
  ],

  // ── Tops ──
  ARMOUR_MN: [
    ...Array(5).fill(Array(8).fill(null)),
    [null, "#c8a800", "#c8a800", "#c8a800", "#c8a800", "#c8a800", "#c8a800", null],
    ["#c8a800", "#ffd700", "#c8a800", "#c8a800", "#c8a800", "#c8a800", "#ffd700", "#c8a800"],
    ["#c8a800", "#c8a800", "#ffd700", "#c8a800", "#c8a800", "#ffd700", "#c8a800", "#c8a800"],
    ["#c8a800", "#c8a800", "#c8a800", "#c8a800", "#c8a800", "#c8a800", "#c8a800", "#c8a800"],
    [null, "#c8a800", "#c8a800", "#c8a800", "#c8a800", "#c8a800", "#c8a800", null],
    ...Array(6).fill(Array(8).fill(null)),
  ],
  HOODIE_CCT: [
    ...Array(5).fill(Array(8).fill(null)),
    [null, "#1a1a1a", "#1a1a1a", "#1a1a1a", "#1a1a1a", "#1a1a1a", "#1a1a1a", null],
    ["#1a1a1a", "#2a2a2a", "#74ffb0", "#1a1a1a", "#1a1a1a", "#74ffb0", "#2a2a2a", "#1a1a1a"],
    ["#1a1a1a", "#2a2a2a", "#1a1a1a", "#1a1a1a", "#1a1a1a", "#1a1a1a", "#2a2a2a", "#1a1a1a"],
    ["#1a1a1a", "#1a1a1a", "#1a1a1a", "#1a1a1a", "#1a1a1a", "#1a1a1a", "#1a1a1a", "#1a1a1a"],
    [null, "#1a1a1a", "#1a1a1a", "#1a1a1a", "#1a1a1a", "#1a1a1a", "#1a1a1a", null],
    ...Array(6).fill(Array(8).fill(null)),
  ],
  HOODIE_GHOST: [
    ...Array(5).fill(Array(8).fill(null)),
    [null, "#9c7bff", "#9c7bff", "#9c7bff", "#9c7bff", "#9c7bff", "#9c7bff", null],
    ["#9c7bff", "#b29eff", "#e6ddff", "#9c7bff", "#9c7bff", "#e6ddff", "#b29eff", "#9c7bff"],
    ["#9c7bff", "#b29eff", "#9c7bff", "#9c7bff", "#9c7bff", "#9c7bff", "#b29eff", "#9c7bff"],
    ["#9c7bff", "#9c7bff", "#9c7bff", "#9c7bff", "#9c7bff", "#9c7bff", "#9c7bff", "#9c7bff"],
    [null, "#9c7bff", "#9c7bff", "#9c7bff", "#9c7bff", "#9c7bff", "#9c7bff", null],
    ...Array(6).fill(Array(8).fill(null)),
  ],
  TOP_SPORT: [
    ...Array(5).fill(Array(8).fill(null)),
    [null, "#cc0000", "#cc0000", "#cc0000", "#cc0000", "#cc0000", "#cc0000", null],
    ["#cc0000", "#ff3333", "#cc0000", "#ffffff", "#ffffff", "#cc0000", "#ff3333", "#cc0000"],
    ["#cc0000", "#ff3333", "#cc0000", "#cc0000", "#cc0000", "#cc0000", "#ff3333", "#cc0000"],
    ["#cc0000", "#cc0000", "#cc0000", "#cc0000", "#cc0000", "#cc0000", "#cc0000", "#cc0000"],
    [null, "#cc0000", "#cc0000", "#cc0000", "#cc0000", "#cc0000", "#cc0000", null],
    ...Array(6).fill(Array(8).fill(null)),
  ],

  // ── Accessories ──
  ACC_BACKPACK: [
    ...Array(5).fill(Array(8).fill(null)),
    ...Array(5).fill([null, null, null, null, null, null, "#a07040", null]),
    ...Array(6).fill(Array(8).fill(null)),
  ],
  ACC_BADGE: [
    ...Array(6).fill(Array(8).fill(null)),
    [null, null, null, "#ffdf7f", null, null, null, null],
    ...Array(9).fill(Array(8).fill(null)),
  ],
};

// ─── Composite Renderer ───────────────────────────────────────────────────────
function compositeSprite(equipped: string[]): PixelGrid {
  // Start with base, then apply overlays in order
  const result: PixelGrid = BASE_SPRITE.map((row) => [...row]);

  for (const itemId of equipped) {
    const overlay = ITEM_OVERLAYS[itemId];
    if (!overlay) continue;
    for (let r = 0; r < Math.min(overlay.length, result.length); r++) {
      for (let c = 0; c < Math.min(overlay[r].length, result[r].length); c++) {
        const pixel = overlay[r][c];
        if (pixel !== null) {
          result[r][c] = pixel;
        }
      }
    }
  }
  return result;
}

// ─── Component ────────────────────────────────────────────────────────────────
type Props = {
  equippedItems?: string[];
  pixelSize?: number;  // size of each "pixel" in dp, default 8
  style?: object;
};

export default function AvatarRenderer({ equippedItems = [], pixelSize = 8, style }: Props) {
  const grid = useMemo(() => compositeSprite(equippedItems), [equippedItems]);

  return (
    <View style={[{ width: pixelSize * 8, height: pixelSize * 16 }, style]}>
      {grid.map((row, rowIndex) => (
        <View key={rowIndex} style={{ flexDirection: "row" }}>
          {row.map((color, colIndex) => (
            <View
              key={colIndex}
              style={{
                width: pixelSize,
                height: pixelSize,
                backgroundColor: color ?? "transparent",
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

// ─── Preview Mode (Dev) ───────────────────────────────────────────────────────
export function AvatarPreviewRow({ pixelSize = 6 }: { pixelSize?: number }) {
  const allItems = Object.keys(ITEM_OVERLAYS);
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16, padding: 16 }}>
      <AvatarRenderer equippedItems={[]} pixelSize={pixelSize} />
      {allItems.slice(0, 4).map((item) => (
        <AvatarRenderer key={item} equippedItems={[item]} pixelSize={pixelSize} />
      ))}
    </View>
  );
}

export { ITEM_OVERLAYS };