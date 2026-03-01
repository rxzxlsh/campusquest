// components/AvatarRenderer.tsx
// Minecraft-style 2D pixel character renderer.
// Each "pixel" is a React Native View with a background color.
// Items are layered overlays composited onto the base sprite.
//
// BUG FIX: Never use Array(n).fill(row) — all rows share the same reference.
// Always use Array.from({ length: n }, () => [...row]) or the rows() helper below.

import React, { useMemo } from "react";
import { View } from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────
type PixelGrid = (string | null)[][];

// ─── Safe empty row helpers ───────────────────────────────────────────────────
// CRITICAL: never use Array(n).fill(Array(8).fill(null)) — shared references!
const E = (): (string | null)[] => [null, null, null, null, null, null, null, null];
const rows = (n: number): PixelGrid => Array.from({ length: n }, () => E());

// ─── Base Palette ─────────────────────────────────────────────────────────────
const SK = "#d4a96a";  // skin
const SD = "#b8905a";  // skin dark
const EY = "#1a1a2e";  // eye dark
const WH = "#e8e8f8";  // eye white
const SH = "#3c78d8";  // default shirt
const PA = "#1a3a6e";  // pants
const PD = "#0e2448";  // pants dark
const BO = "#2a1a0e";  // boot
const BD = "#180e06";  // boot dark

// ─── Base Sprite (8 wide × 16 tall) ──────────────────────────────────────────
const BASE_SPRITE: PixelGrid = [
  [null, null,  SK,   SK,   SK,   SK,  null, null],  // 0 head top
  [null,  SK,   SK,   SK,   SK,   SK,   SK,  null],  // 1 head
  [null,  SK,   EY,   WH,   WH,   EY,   SK,  null],  // 2 eyes
  [null,  SK,   SK,   SD,   SD,   SK,   SK,  null],  // 3 mouth
  [null, null, null,  SK,   SK,  null, null, null],  // 4 neck
  [null,  SH,   SH,   SH,   SH,   SH,   SH,  null],  // 5 shoulders
  [ SH,   SH,   SH,   SH,   SH,   SH,   SH,   SH],  // 6 body+arms
  [ SH,   SH,   SH,   SH,   SH,   SH,   SH,   SH],  // 7 body
  [ SH,   SH,   SH,   SH,   SH,   SH,   SH,   SH],  // 8 body
  [null,  SH,   SH,   SH,   SH,   SH,   SH,  null],  // 9 waist
  [null,  PA,   PA,  null, null,  PA,   PA,  null],  // 10 legs
  [null,  PA,   PA,  null, null,  PA,   PA,  null],  // 11
  [null,  PD,   PA,  null, null,  PA,   PD,  null],  // 12
  [null,  PD,   PA,  null, null,  PA,   PD,  null],  // 13
  [null,  BO,   BO,  null, null,  BO,   BO,  null],  // 14 boots
  [ BD,   BO,   BO,   BD,   BD,   BO,   BO,   BD],  // 15
];

// ─── Item Overlay Registry ────────────────────────────────────────────────────
// Each overlay is exactly 16 rows × 8 cols.
// null = transparent. Applied in order: base → tops → hats → eyes → accessories → base layer.

const ITEM_OVERLAYS: Record<string, PixelGrid> = {

  // ════════════════════════════════════════════════════════════════════════
  // HATS
  // ════════════════════════════════════════════════════════════════════════

  HAT_DEFAULT: [
    [null, "#0d4a8a", "#0d4a8a", "#0d4a8a", "#0d4a8a", "#0d4a8a", "#0d4a8a", null],
    ["#0d4a8a", "#1a5fa8", "#1a5fa8", "#1a5fa8", "#1a5fa8", "#1a5fa8", "#1a5fa8", "#0d4a8a"],
    ...rows(14),
  ],

  HAT_GHOST: [
    [null, "#9b7fd4", "#b49be0", "#c8b4ff", "#c8b4ff", "#b49be0", "#9b7fd4", null],
    ["#7a60b0", "#c8b4ff", "#ddd0ff", "#c8b4ff", "#c8b4ff", "#ddd0ff", "#c8b4ff", "#7a60b0"],
    [null, "#7a60b0", "#9b7fd4", "#b49be0", "#b49be0", "#9b7fd4", "#7a60b0", null],
    ...rows(13),
  ],

  HAT_PROF_CAP: [
    ["#1a1a1a", "#1a1a1a", "#1a1a1a", "#1a1a1a", "#1a1a1a", "#1a1a1a", "#1a1a1a", "#ffd700"],
    [null, "#2a2a2a", "#2a2a2a", "#2a2a2a", "#2a2a2a", "#2a2a2a", "#2a2a2a", null],
    ...rows(14),
  ],

  HAT_CROWN: [
    [null, "#ffd700", null, "#e6b800", "#e6b800", null, "#ffd700", null],
    ["#ffd700", "#ffd700", "#ffd700", "#ffd700", "#ffd700", "#ffd700", "#ffd700", "#ffd700"],
    [null, "#e6b800", "#ffd700", "#ffd700", "#ffd700", "#ffd700", "#e6b800", null],
    ...rows(13),
  ],

  HAT_HOLDEN: [
    [null, "#cc2222", "#cc2222", "#cc2222", "#cc2222", "#cc2222", "#cc2222", null],
    ["#cc2222", "#ff4444", "#cc2222", "#ffffff", "#ffffff", "#cc2222", "#ff4444", "#cc2222"],
    [null, "#cc2222", "#ff4444", "#cc2222", "#cc2222", "#ff4444", "#cc2222", null],
    ...rows(13),
  ],

  HAT_HUYNH: [
    [null, "#1a7a3a", "#1a7a3a", "#1a7a3a", "#1a7a3a", "#1a7a3a", "#1a7a3a", null],
    ["#1a7a3a", "#2aaa50", "#1a7a3a", "#74ffb0", "#1a7a3a", "#1a7a3a", "#2aaa50", "#1a7a3a"],
    ...rows(14),
  ],

  HAT_DEER: [
    [null, "#8b6914", "#c8a060", "#c8a060", "#c8a060", "#c8a060", "#8b6914", null],
    ["#c8a060", "#ddb870", "#c8a060", "#c8a060", "#c8a060", "#c8a060", "#ddb870", "#c8a060"],
    ["#c8a060", "#c8a060", "#c8a060", "#c8a060", "#c8a060", "#c8a060", "#c8a060", "#c8a060"],
    ...rows(13),
  ],

  HAT_ARIZONA: [
    [null, "#b85000", "#ff7800", "#ff9500", "#ff9500", "#ff7800", "#b85000", null],
    ["#ff7800", "#ff9500", "#ff7800", "#ffd090", "#ffd090", "#ff7800", "#ff9500", "#ff7800"],
    ...rows(14),
  ],

  HAT_SHUTTLE: [
    [null, "#1a3a7a", "#2a5ab0", "#2a5ab0", "#2a5ab0", "#2a5ab0", "#1a3a7a", null],
    ["#1a3a7a", "#2a5ab0", "#4a7ad0", "#4a7ad0", "#4a7ad0", "#4a7ad0", "#2a5ab0", "#1a3a7a"],
    ...rows(14),
  ],

  HAT_RAWC: [
    E(),
    [null, "#cc2222", "#cc2222", "#cc2222", "#cc2222", "#cc2222", "#cc2222", null],
    [null, "#ff4444", "#cc2222", "#ff9090", "#ff9090", "#cc2222", "#ff4444", null],
    ...rows(13),
  ],

  HAT_CSSC: [
    [null, "#0a1e5a", "#1a3a8a", "#1a3a8a", "#1a3a8a", "#1a3a8a", "#0a1e5a", null],
    ["#0a1e5a", "#1a3a8a", "#2a5ab0", "#7ab0ff", "#7ab0ff", "#2a5ab0", "#1a3a8a", "#0a1e5a"],
    [null, "#0a1e5a", "#1a3a8a", "#1a3a8a", "#1a3a8a", "#1a3a8a", "#0a1e5a", null],
    ...rows(13),
  ],

  HAT_CAMERA: [
    ["#e060a0", "#ff80c0", "#ffb0d8", "#ffb0d8", "#ffb0d8", "#ffb0d8", "#ff80c0", "#e060a0"],
    [null, "#e060a0", "#ff80c0", "#ff80c0", "#ff80c0", "#ff80c0", "#e060a0", null],
    ...rows(14),
  ],

  HAT_GREEN: [
    [null, "#1a6628", "#2a8a38", "#3aaa48", "#3aaa48", "#2a8a38", "#1a6628", null],
    ["#1a6628", "#2a8a38", "#4ecb60", "#2a8a38", "#2a8a38", "#4ecb60", "#2a8a38", "#1a6628"],
    ["#2a8a38", "#2a8a38", "#2a8a38", "#2a8a38", "#2a8a38", "#2a8a38", "#2a8a38", "#2a8a38"],
    ...rows(13),
  ],

  HAT_FITNESS: [
    [null, "#b88000", "#ffd700", "#ffd700", "#ffd700", "#ffd700", "#b88000", null],
    ["#b88000", "#ffd700", "#ffe860", "#ffd700", "#ffd700", "#ffe860", "#ffd700", "#b88000"],
    ...rows(14),
  ],

  HAT_DEBATE: [
    ["#606060", "#808080", "#a0a0a0", "#a0a0a0", "#a0a0a0", "#a0a0a0", "#808080", "#606060"],
    [null, "#1a1a1a", "#1a1a1a", "#1a1a1a", "#1a1a1a", "#1a1a1a", "#1a1a1a", null],
    [null, "#606060", "#808080", "#808080", "#808080", "#808080", "#606060", null],
    ...rows(13),
  ],

  HAT_ENTREPRENEURSHIP: [
    E(),
    ["#40a030", "#60c050", "#a0ff90", "#a0ff90", "#a0ff90", "#a0ff90", "#60c050", "#40a030"],
    ...rows(14),
  ],

  HAT_CS: [
    [null, "#303050", "#404060", "#606080", "#606080", "#404060", "#303050", null],
    ["#303050", "#606080", "#8080a0", "#7ab0ff", "#7ab0ff", "#8080a0", "#606080", "#303050"],
    [null, "#404060", "#606080", "#606080", "#606080", "#606080", "#404060", null],
    ...rows(13),
  ],

  HAT_BIO: [
    [null, "#d0f0d0", "#e8ffe8", "#e8ffe8", "#e8ffe8", "#e8ffe8", "#d0f0d0", null],
    ["#d0f0d0", "#e8ffe8", "#2a8a38", "#e8ffe8", "#e8ffe8", "#2a8a38", "#e8ffe8", "#d0f0d0"],
    ...rows(14),
  ],

  HAT_PSYCH: [
    [null, "#6a30a0", "#9040d0", "#b060f0", "#b060f0", "#9040d0", "#6a30a0", null],
    ["#6a30a0", "#9040d0", "#b878e8", "#d4a0ff", "#d4a0ff", "#b878e8", "#9040d0", "#6a30a0"],
    [null, "#6a30a0", "#9040d0", "#9040d0", "#9040d0", "#9040d0", "#6a30a0", null],
    ...rows(13),
  ],

  HAT_ECON: [
    E(),
    [null, "#006080", "#00a0b0", "#90e8ff", "#90e8ff", "#00a0b0", "#006080", null],
    [null, "#006080", "#00a0b0", "#00a0b0", "#00a0b0", "#00a0b0", "#006080", null],
    ...rows(13),
  ],

  HAT_MGMT: [
    [null, "#7a4800", "#b86800", "#ffa030", "#ffa030", "#b86800", "#7a4800", null],
    ["#7a4800", "#b86800", "#ffc060", "#b86800", "#b86800", "#ffc060", "#b86800", "#7a4800"],
    ...rows(14),
  ],

  HAT_COMM: [
    ["#b020a0", "#d040c0", "#e878d8", "#ff90e0", "#ff90e0", "#e878d8", "#d040c0", "#b020a0"],
    [null, "#b020a0", "#d040c0", "#d040c0", "#d040c0", "#d040c0", "#b020a0", null],
    ...rows(14),
  ],

  HAT_MATH: [
    ["#800000", "#a00000", "#c00000", "#c00000", "#c00000", "#c00000", "#a00000", "#ffffff"],
    [null, "#800000", "#a00000", "#a00000", "#a00000", "#a00000", "#800000", null],
    ...rows(14),
  ],

  // ════════════════════════════════════════════════════════════════════════
  // TOPS
  // ════════════════════════════════════════════════════════════════════════

  TOP_DEFAULT: [
    ...rows(5),
    [null, "#2a5fb0", "#2a5fb0", "#2a5fb0", "#2a5fb0", "#2a5fb0", "#2a5fb0", null],
    ["#2a5fb0", "#3c78d8", "#3c78d8", "#3c78d8", "#3c78d8", "#3c78d8", "#3c78d8", "#2a5fb0"],
    ["#2a5fb0", "#3c78d8", "#5a90f0", "#3c78d8", "#3c78d8", "#5a90f0", "#3c78d8", "#2a5fb0"],
    ["#2a5fb0", "#3c78d8", "#3c78d8", "#3c78d8", "#3c78d8", "#3c78d8", "#3c78d8", "#2a5fb0"],
    [null, "#2a5fb0", "#2a5fb0", "#2a5fb0", "#2a5fb0", "#2a5fb0", "#2a5fb0", null],
    ...rows(6),
  ],

  ARMOUR_MN: [
    ...rows(5),
    [null, "#c8a800", "#c8a800", "#ffd700", "#ffd700", "#c8a800", "#c8a800", null],
    ["#c8a800", "#ffd700", "#e6c000", "#ffd700", "#ffd700", "#e6c000", "#ffd700", "#c8a800"],
    ["#c8a800", "#e6c000", "#ffd700", "#e6c000", "#e6c000", "#ffd700", "#e6c000", "#c8a800"],
    ["#c8a800", "#ffd700", "#e6c000", "#ffd700", "#ffd700", "#e6c000", "#ffd700", "#c8a800"],
    [null, "#c8a800", "#c8a800", "#c8a800", "#c8a800", "#c8a800", "#c8a800", null],
    ...rows(6),
  ],

  HOODIE_CCT: [
    ...rows(5),
    [null, "#1a1a1a", "#1a1a1a", "#1a1a1a", "#1a1a1a", "#1a1a1a", "#1a1a1a", null],
    ["#1a1a1a", "#2a2a2a", "#74ffb0", "#1a1a1a", "#1a1a1a", "#74ffb0", "#2a2a2a", "#1a1a1a"],
    ["#1a1a1a", "#2a2a2a", "#1a1a1a", "#2a2a2a", "#2a2a2a", "#1a1a1a", "#2a2a2a", "#1a1a1a"],
    ["#1a1a1a", "#1a1a1a", "#2a2a2a", "#1a1a1a", "#1a1a1a", "#2a2a2a", "#1a1a1a", "#1a1a1a"],
    [null, "#1a1a1a", "#1a1a1a", "#1a1a1a", "#1a1a1a", "#1a1a1a", "#1a1a1a", null],
    ...rows(6),
  ],

  HOODIE_GHOST: [
    ...rows(5),
    [null, "#7a60b0", "#9b7fd4", "#b49be0", "#b49be0", "#9b7fd4", "#7a60b0", null],
    ["#7a60b0", "#c8b4ff", "#ddd0ff", "#c8b4ff", "#c8b4ff", "#ddd0ff", "#c8b4ff", "#7a60b0"],
    ["#7a60b0", "#9b7fd4", "#c8b4ff", "#9b7fd4", "#9b7fd4", "#c8b4ff", "#9b7fd4", "#7a60b0"],
    ["#7a60b0", "#c8b4ff", "#9b7fd4", "#c8b4ff", "#c8b4ff", "#9b7fd4", "#c8b4ff", "#7a60b0"],
    [null, "#7a60b0", "#9b7fd4", "#9b7fd4", "#9b7fd4", "#9b7fd4", "#7a60b0", null],
    ...rows(6),
  ],

  TOP_HOLDEN: [
    ...rows(5),
    [null, "#aa1111", "#cc2222", "#cc2222", "#cc2222", "#cc2222", "#aa1111", null],
    ["#aa1111", "#cc2222", "#ff4444", "#ffffff", "#ffffff", "#ff4444", "#cc2222", "#aa1111"],
    ["#aa1111", "#cc2222", "#cc2222", "#ff4444", "#ff4444", "#cc2222", "#cc2222", "#aa1111"],
    ["#aa1111", "#cc2222", "#ff4444", "#cc2222", "#cc2222", "#ff4444", "#cc2222", "#aa1111"],
    [null, "#aa1111", "#cc2222", "#cc2222", "#cc2222", "#cc2222", "#aa1111", null],
    ...rows(6),
  ],

  TOP_HOLDEN2: [
    ...rows(5),
    [null, "#7a0000", "#aa1111", "#aa1111", "#aa1111", "#aa1111", "#7a0000", null],
    ["#7a0000", "#aa1111", "#ffffff", "#aa1111", "#aa1111", "#ffffff", "#aa1111", "#7a0000"],
    ["#7a0000", "#aa1111", "#aa1111", "#aa1111", "#aa1111", "#aa1111", "#aa1111", "#7a0000"],
    ["#7a0000", "#ffffff", "#aa1111", "#ffffff", "#ffffff", "#aa1111", "#ffffff", "#7a0000"],
    [null, "#7a0000", "#aa1111", "#aa1111", "#aa1111", "#aa1111", "#7a0000", null],
    ...rows(6),
  ],

  TOP_REJECT: [
    ...rows(5),
    [null, "#d06060", "#e87878", "#e87878", "#e87878", "#e87878", "#d06060", null],
    ["#d06060", "#e87878", "#ffb0b0", "#e87878", "#e87878", "#ffb0b0", "#e87878", "#d06060"],
    ["#d06060", "#e87878", "#e87878", "#ffb0b0", "#ffb0b0", "#e87878", "#e87878", "#d06060"],
    ["#d06060", "#e87878", "#ffb0b0", "#e87878", "#e87878", "#ffb0b0", "#e87878", "#d06060"],
    [null, "#d06060", "#e87878", "#e87878", "#e87878", "#e87878", "#d06060", null],
    ...rows(6),
  ],

  TOP_POST: [
    ...rows(5),
    [null, "#2a4a7a", "#3a6aaa", "#3a6aaa", "#3a6aaa", "#3a6aaa", "#2a4a7a", null],
    ["#2a4a7a", "#3a6aaa", "#5a8aca", "#ffd700", "#ffd700", "#5a8aca", "#3a6aaa", "#2a4a7a"],
    ["#2a4a7a", "#3a6aaa", "#5a8aca", "#3a6aaa", "#3a6aaa", "#5a8aca", "#3a6aaa", "#2a4a7a"],
    ["#2a4a7a", "#3a6aaa", "#3a6aaa", "#5a8aca", "#5a8aca", "#3a6aaa", "#3a6aaa", "#2a4a7a"],
    [null, "#2a4a7a", "#3a6aaa", "#3a6aaa", "#3a6aaa", "#3a6aaa", "#2a4a7a", null],
    ...rows(6),
  ],

  TOP_COMMUTER: [
    ...rows(5),
    [null, "#384858", "#4a6070", "#4a6070", "#4a6070", "#4a6070", "#384858", null],
    ["#384858", "#4a6070", "#90c0ff", "#4a6070", "#4a6070", "#90c0ff", "#4a6070", "#384858"],
    ["#384858", "#4a6070", "#4a6070", "#4a6070", "#4a6070", "#4a6070", "#4a6070", "#384858"],
    ["#384858", "#90c0ff", "#4a6070", "#90c0ff", "#90c0ff", "#4a6070", "#90c0ff", "#384858"],
    [null, "#384858", "#4a6070", "#4a6070", "#4a6070", "#4a6070", "#384858", null],
    ...rows(6),
  ],

  TOP_ALLNIGHTER: [
    ...rows(5),
    [null, "#0a0a2a", "#1a1a4a", "#1a1a4a", "#1a1a4a", "#1a1a4a", "#0a0a2a", null],
    ["#0a0a2a", "#1a1a4a", "#2a2a6a", "#c8e0ff", "#c8e0ff", "#2a2a6a", "#1a1a4a", "#0a0a2a"],
    ["#0a0a2a", "#1a1a4a", "#1a1a4a", "#2a2a6a", "#2a2a6a", "#1a1a4a", "#1a1a4a", "#0a0a2a"],
    ["#0a0a2a", "#2a2a6a", "#1a1a4a", "#1a1a4a", "#1a1a4a", "#1a1a4a", "#2a2a6a", "#0a0a2a"],
    [null, "#0a0a2a", "#1a1a4a", "#1a1a4a", "#1a1a4a", "#1a1a4a", "#0a0a2a", null],
    ...rows(6),
  ],

  TOP_RAWC: [
    ...rows(5),
    [null, "#aa1111", "#cc2222", "#cc2222", "#cc2222", "#cc2222", "#aa1111", null],
    ["#aa1111", "#cc2222", "#ffffff", "#cc2222", "#cc2222", "#ffffff", "#cc2222", "#aa1111"],
    ["#aa1111", "#cc2222", "#cc2222", "#cc2222", "#cc2222", "#cc2222", "#cc2222", "#aa1111"],
    ["#aa1111", "#ffffff", "#cc2222", "#ffffff", "#ffffff", "#cc2222", "#ffffff", "#aa1111"],
    [null, "#aa1111", "#cc2222", "#cc2222", "#cc2222", "#cc2222", "#aa1111", null],
    ...rows(6),
  ],

  TOP_CSSC: [
    ...rows(5),
    [null, "#0a1e5a", "#1a3a8a", "#1a3a8a", "#1a3a8a", "#1a3a8a", "#0a1e5a", null],
    ["#0a1e5a", "#1a3a8a", "#7ab0ff", "#1a3a8a", "#1a3a8a", "#7ab0ff", "#1a3a8a", "#0a1e5a"],
    ["#0a1e5a", "#1a3a8a", "#1a3a8a", "#7ab0ff", "#7ab0ff", "#1a3a8a", "#1a3a8a", "#0a1e5a"],
    ["#0a1e5a", "#7ab0ff", "#1a3a8a", "#1a3a8a", "#1a3a8a", "#1a3a8a", "#7ab0ff", "#0a1e5a"],
    [null, "#0a1e5a", "#1a3a8a", "#1a3a8a", "#1a3a8a", "#1a3a8a", "#0a1e5a", null],
    ...rows(6),
  ],

  TOP_GREEN: [
    ...rows(5),
    [null, "#1a6028", "#2a8838", "#2a8838", "#2a8838", "#2a8838", "#1a6028", null],
    ["#1a6028", "#2a8838", "#4ecb60", "#2a8838", "#2a8838", "#4ecb60", "#2a8838", "#1a6028"],
    ["#1a6028", "#2a8838", "#2a8838", "#4ecb60", "#4ecb60", "#2a8838", "#2a8838", "#1a6028"],
    ["#1a6028", "#4ecb60", "#2a8838", "#2a8838", "#2a8838", "#2a8838", "#4ecb60", "#1a6028"],
    [null, "#1a6028", "#2a8838", "#2a8838", "#2a8838", "#2a8838", "#1a6028", null],
    ...rows(6),
  ],

  TOP_FITNESS: [
    ...rows(5),
    [null, "#b08800", "#d4a800", "#d4a800", "#d4a800", "#d4a800", "#b08800", null],
    ["#b08800", "#d4a800", "#ffd700", "#d4a800", "#ffd700", "#ffd700", "#d4a800", "#b08800"],
    ["#b08800", "#ffd700", "#d4a800", "#ffd700", "#d4a800", "#ffd700", "#ffd700", "#b08800"],
    ["#b08800", "#d4a800", "#ffd700", "#d4a800", "#ffd700", "#d4a800", "#ffd700", "#b08800"],
    [null, "#b08800", "#d4a800", "#d4a800", "#d4a800", "#d4a800", "#b08800", null],
    ...rows(6),
  ],

  TOP_CAMERA: [
    ...rows(5),
    [null, "#b03080", "#d050a0", "#d050a0", "#d050a0", "#d050a0", "#b03080", null],
    ["#b03080", "#d050a0", "#ff80c0", "#d050a0", "#d050a0", "#ff80c0", "#d050a0", "#b03080"],
    ["#b03080", "#d050a0", "#d050a0", "#ff80c0", "#ff80c0", "#d050a0", "#d050a0", "#b03080"],
    ["#b03080", "#ff80c0", "#d050a0", "#d050a0", "#d050a0", "#d050a0", "#ff80c0", "#b03080"],
    [null, "#b03080", "#d050a0", "#d050a0", "#d050a0", "#d050a0", "#b03080", null],
    ...rows(6),
  ],

  TOP_SPORT: [
    ...rows(5),
    [null, "#aa0000", "#cc1111", "#cc1111", "#cc1111", "#cc1111", "#aa0000", null],
    ["#aa0000", "#cc1111", "#ffffff", "#cc1111", "#cc1111", "#ffffff", "#cc1111", "#aa0000"],
    ["#aa0000", "#cc1111", "#ffffff", "#cc1111", "#cc1111", "#ffffff", "#cc1111", "#aa0000"],
    ["#aa0000", "#cc1111", "#cc1111", "#cc1111", "#cc1111", "#cc1111", "#cc1111", "#aa0000"],
    [null, "#aa0000", "#cc1111", "#cc1111", "#cc1111", "#cc1111", "#aa0000", null],
    ...rows(6),
  ],

  TOP_ENGSCI: [
    ...rows(5),
    [null, "#c0c0d8", "#e0e0f0", "#e0e0f0", "#e0e0f0", "#e0e0f0", "#c0c0d8", null],
    ["#c0c0d8", "#e0e0f0", "#f8f8ff", "#4060c0", "#4060c0", "#f8f8ff", "#e0e0f0", "#c0c0d8"],
    ["#c0c0d8", "#e0e0f0", "#f8f8ff", "#e0e0f0", "#e0e0f0", "#f8f8ff", "#e0e0f0", "#c0c0d8"],
    ["#c0c0d8", "#e0e0f0", "#f8f8ff", "#e0e0f0", "#e0e0f0", "#f8f8ff", "#e0e0f0", "#c0c0d8"],
    [null, "#c0c0d8", "#e0e0f0", "#e0e0f0", "#e0e0f0", "#e0e0f0", "#c0c0d8", null],
    ...rows(6),
  ],

  TOP_CS: [
    ...rows(5),
    [null, "#202040", "#303060", "#303060", "#303060", "#303060", "#202040", null],
    ["#202040", "#303060", "#7ab0ff", "#303060", "#303060", "#7ab0ff", "#303060", "#202040"],
    ["#202040", "#303060", "#303060", "#7ab0ff", "#7ab0ff", "#303060", "#303060", "#202040"],
    ["#202040", "#7ab0ff", "#303060", "#303060", "#303060", "#303060", "#7ab0ff", "#202040"],
    [null, "#202040", "#303060", "#303060", "#303060", "#303060", "#202040", null],
    ...rows(6),
  ],

  TOP_BIO: [
    ...rows(5),
    [null, "#b0d8b0", "#d0f0d0", "#d0f0d0", "#d0f0d0", "#d0f0d0", "#b0d8b0", null],
    ["#b0d8b0", "#d0f0d0", "#f0fff0", "#2a8a38", "#2a8a38", "#f0fff0", "#d0f0d0", "#b0d8b0"],
    ["#b0d8b0", "#d0f0d0", "#f0fff0", "#d0f0d0", "#d0f0d0", "#f0fff0", "#d0f0d0", "#b0d8b0"],
    ["#b0d8b0", "#d0f0d0", "#2a8a38", "#d0f0d0", "#d0f0d0", "#2a8a38", "#d0f0d0", "#b0d8b0"],
    [null, "#b0d8b0", "#d0f0d0", "#d0f0d0", "#d0f0d0", "#d0f0d0", "#b0d8b0", null],
    ...rows(6),
  ],

  TOP_PSYCH: [
    ...rows(5),
    [null, "#5a2080", "#8040b0", "#8040b0", "#8040b0", "#8040b0", "#5a2080", null],
    ["#5a2080", "#8040b0", "#d4a0ff", "#8040b0", "#8040b0", "#d4a0ff", "#8040b0", "#5a2080"],
    ["#5a2080", "#8040b0", "#8040b0", "#d4a0ff", "#d4a0ff", "#8040b0", "#8040b0", "#5a2080"],
    ["#5a2080", "#d4a0ff", "#8040b0", "#8040b0", "#8040b0", "#8040b0", "#d4a0ff", "#5a2080"],
    [null, "#5a2080", "#8040b0", "#8040b0", "#8040b0", "#8040b0", "#5a2080", null],
    ...rows(6),
  ],

  TOP_ECON: [
    ...rows(5),
    [null, "#005060", "#007080", "#007080", "#007080", "#007080", "#005060", null],
    ["#005060", "#007080", "#90e8ff", "#007080", "#007080", "#90e8ff", "#007080", "#005060"],
    ["#005060", "#007080", "#007080", "#90e8ff", "#90e8ff", "#007080", "#007080", "#005060"],
    ["#005060", "#90e8ff", "#007080", "#007080", "#007080", "#007080", "#90e8ff", "#005060"],
    [null, "#005060", "#007080", "#007080", "#007080", "#007080", "#005060", null],
    ...rows(6),
  ],

  TOP_MATH: [
    ...rows(5),
    [null, "#5a0000", "#800000", "#800000", "#800000", "#800000", "#5a0000", null],
    ["#5a0000", "#800000", "#c00000", "#ffffff", "#ffffff", "#c00000", "#800000", "#5a0000"],
    ["#5a0000", "#c00000", "#800000", "#c00000", "#c00000", "#800000", "#c00000", "#5a0000"],
    ["#5a0000", "#800000", "#ffffff", "#800000", "#800000", "#ffffff", "#800000", "#5a0000"],
    [null, "#5a0000", "#800000", "#800000", "#800000", "#800000", "#5a0000", null],
    ...rows(6),
  ],

  // ════════════════════════════════════════════════════════════════════════
  // EYES  (rows 1–3 face area)
  // ════════════════════════════════════════════════════════════════════════

  EYES_DEFAULT: [...rows(16)],

  EYES_SUNGLASSES: [
    ...rows(2),
    [null, null, "#8a6000", "#ffd700", "#ffd700", "#8a6000", null, null],
    [null, null, "#8a6000", "#8a6000", "#8a6000", "#8a6000", null, null],
    ...rows(12),
  ],

  EYES_EPSILON: [
    ...rows(2),
    [null, null, "#880000", "#ff4040", "#ff4040", "#880000", null, null],
    [null, null, "#880000", "#880000", "#880000", "#880000", null, null],
    ...rows(12),
  ],

  EYES_DEER: [
    ...rows(2),
    [null, null, "#6a3a00", "#c8a060", "#c8a060", "#6a3a00", null, null],
    [null, null, "#6a3a00", "#6a3a00", "#6a3a00", "#6a3a00", null, null],
    ...rows(12),
  ],

  EYES_COFFEE: [
    ...rows(2),
    [null, null, "#cc0000", "#ff6060", "#ff6060", "#cc0000", null, null],
    [null, null, "#cc0000", "#cc0000", "#cc0000", "#cc0000", null, null],
    ...rows(12),
  ],

  EYES_NERD: [
    E(),
    [null, "#1a1a1a", "#1a1a1a", "#1a1a1a", "#1a1a1a", "#1a1a1a", "#1a1a1a", null],
    [null, "#1a1a1a", "#c8e0ff", "#1a1a1a", "#1a1a1a", "#c8e0ff", "#1a1a1a", null],
    [null, "#1a1a1a", "#1a1a1a", "#1a1a1a", "#1a1a1a", "#1a1a1a", "#1a1a1a", null],
    ...rows(12),
  ],

  EYES_CODE: [
    E(),
    [null, "#0a3a7a", "#1a5ab0", "#1a5ab0", "#1a5ab0", "#1a5ab0", "#0a3a7a", null],
    [null, "#1a5ab0", "#7ab0ff", "#1a5ab0", "#1a5ab0", "#7ab0ff", "#1a5ab0", null],
    [null, "#0a3a7a", "#1a5ab0", "#1a5ab0", "#1a5ab0", "#1a5ab0", "#0a3a7a", null],
    ...rows(12),
  ],

  EYES_MAP: [
    ...rows(2),
    [null, null, "#004060", "#0090b0", "#0090b0", "#004060", null, null],
    [null, null, "#004060", "#0090b0", "#0090b0", "#004060", null, null],
    ...rows(12),
  ],

  EYES_STAR: [
    ...rows(2),
    [null, null, "#b08800", "#ffd700", "#ffd700", "#b08800", null, null],
    [null, null, "#ffd700", "#ffe860", "#ffe860", "#ffd700", null, null],
    ...rows(12),
  ],

  EYES_PSYCH: [
    E(),
    [null, null, "#6a30a0", "#9040d0", "#9040d0", "#6a30a0", null, null],
    [null, null, "#9040d0", "#d4a0ff", "#d4a0ff", "#9040d0", null, null],
    [null, null, "#6a30a0", "#9040d0", "#9040d0", "#6a30a0", null, null],
    ...rows(12),
  ],

  EYES_LAB: [
    E(),
    ["#2a7a30", "#2a7a30", "#2a7a30", "#2a7a30", "#2a7a30", "#2a7a30", "#2a7a30", "#2a7a30"],
    [null, "#2a7a30", "#90ffb0", "#2a7a30", "#2a7a30", "#90ffb0", "#2a7a30", null],
    ["#2a7a30", "#2a7a30", "#2a7a30", "#2a7a30", "#2a7a30", "#2a7a30", "#2a7a30", "#2a7a30"],
    ...rows(12),
  ],

  EYES_VISOR: [
    E(),
    ["#30a020", "#40c030", "#80ff70", "#80ff70", "#80ff70", "#80ff70", "#40c030", "#30a020"],
    [null, "#30a020", "#40c030", "#40c030", "#40c030", "#40c030", "#30a020", null],
    ...rows(13),
  ],

  EYES_CHAMPION: [
    E(),
    ["#b08800", "#c8a800", "#ffd700", "#ffd700", "#ffd700", "#ffd700", "#c8a800", "#b08800"],
    [null, "#b08800", "#e6c000", "#ffd700", "#ffd700", "#e6c000", "#b08800", null],
    ...rows(13),
  ],

  // ════════════════════════════════════════════════════════════════════════
  // ACCESSORIES
  // ════════════════════════════════════════════════════════════════════════

  ACC_BACKPACK: [
    ...rows(5),
    ...Array.from({ length: 5 }, () => [null, null, null, null, null, null, "#8a5828", null] as (string|null)[]),
    [null, null, null, null, null, null, "#a07040", null],
    ...rows(5),
  ],

  ACC_BADGE: [
    ...rows(6),
    [null, null, null, "#ffdf7f", null, null, null, null],
    [null, null, "#ffdf7f", "#ffd700", "#ffdf7f", null, null, null],
    [null, null, null, "#ffdf7f", null, null, null, null],
    ...rows(7),
  ],

  ACC_SHUTTLE: [
    ...rows(14),
    [null, null, null, null, "#1a5fa8", "#2a7ad0", null, null],
    [null, null, null, "#1a5fa8", "#4a90e2", "#1a5fa8", null, null],
  ],

  ACC_DEER: [
    ...rows(4),
    [null, null, null, "#c8a060", null, null, null, null],
    [null, null, "#c8a060", "#c8a060", "#c8a060", null, null, null],
    ...rows(10),
  ],

  ACC_DAVIS: [
    ...rows(13),
    [null, null, null, null, "#888888", "#aaaaaa", null, null],
    [null, null, null, null, "#666666", "#888888", null, null],
    [null, null, null, null, "#444444", "#666666", null, null],
  ],

  ACC_ICLICKER: [
    ...rows(6),
    [null, null, null, null, null, "#5a8aff", "#7aacff", null],
    [null, null, null, null, null, "#7aacff", "#5a8aff", null],
    ...rows(8),
  ],

  ACC_COFFEE: [
    ...rows(13),
    [null, null, null, null, "#a05820", "#c87830", null, null],
    [null, null, null, "#c87830", "#e09040", "#c87830", null, null],
    [null, null, null, null, "#c87830", null, null, null],
  ],

  ACC_TEXTBOOK: [
    ...rows(5),
    [null, null, null, null, null, null, "#5060a0", "#7080c0"] as (string|null)[],
    [null, null, null, null, null, null, "#7080c0", "#9090d0"] as (string|null)[],
    [null, null, null, null, null, null, "#5060a0", "#7080c0"] as (string|null)[],
    [null, null, null, null, null, null, "#7080c0", "#9090d0"] as (string|null)[],
    [null, null, null, null, null, null, "#5060a0", null] as (string|null)[],
    ...rows(6),
  ],

  ACC_HOLDEN: [
    ...rows(7),
    [null, null, null, "#cc2222", "#ff4444", null, null, null],
    [null, null, "#ff4444", "#cc2222", null, null, null, null],
    ...rows(7),
  ],

  ACC_HUYNH_BOOK: [
    ...rows(12),
    [null, null, null, null, "#2a8a38", "#4aaa58", null, null],
    [null, null, null, "#2a8a38", "#4aaa58", "#2a8a38", null, null],
    [null, null, null, null, "#2a8a38", null, null, null],
  ],

  ACC_CAMERA_LENS: [
    ...rows(7),
    [null, null, null, null, "#d050a0", "#ff80c0", null, null],
    [null, null, null, null, "#ff80c0", "#d050a0", null, null],
    ...rows(7),
  ],

  ACC_CIRCUIT: [
    ...rows(6),
    [null, null, null, null, null, "#7ab0ff", "#4a80d0", null],
    [null, null, null, null, null, "#4a80d0", "#7ab0ff", null],
    ...rows(8),
  ],

  ACC_LEAF: [
    ...rows(4),
    [null, null, null, "#4ecb60", null, null, null, null],
    [null, null, "#4ecb60", "#2a8a38", "#4ecb60", null, null, null],
    [null, null, null, "#4ecb60", null, null, null, null],
    ...rows(9),
  ],

  ACC_DUMBBELL: [
    ...rows(14),
    [null, null, null, "#ffd274", "#ffd274", null, null, null],
    [null, null, null, "#b08000", "#b08000", null, null, null],
  ],

  ACC_PITCH_DECK: [
    ...rows(5),
    [null, null, null, null, null, null, "#80ff80", "#60d060"] as (string|null)[],
    [null, null, null, null, null, null, "#60d060", "#80ff80"] as (string|null)[],
    [null, null, null, null, null, null, "#80ff80", "#60d060"] as (string|null)[],
    ...rows(8),
  ],

  ACC_PIPETTE: [
    ...rows(5),
    [null, null, null, null, null, null, "#88ffaa", "#60cc80"] as (string|null)[],
    [null, null, null, null, null, null, "#60cc80", "#88ffaa"] as (string|null)[],
    [null, null, null, null, null, null, "#88ffaa", "#60cc80"] as (string|null)[],
    ...rows(8),
  ],

  ACC_BINARY: [
    ...rows(7),
    [null, null, null, null, "#7ab0ff", "#4a80d0", null, null],
    [null, null, null, "#4a80d0", "#7ab0ff", null, null, null],
    ...rows(7),
  ],

  ACC_COUCH: [
    ...rows(13),
    [null, null, null, "#d4a0ff", "#b070e0", null, null, null],
    [null, null, "#b070e0", "#d4a0ff", "#d4a0ff", "#b070e0", null, null],
    [null, null, null, "#b070e0", "#b070e0", null, null, null],
  ],

  ACC_STONKS: [
    ...rows(6),
    [null, null, null, null, null, "#90e8ff", "#60b8d0", null],
    [null, null, null, null, null, "#60b8d0", "#90e8ff", null],
    ...rows(8),
  ],

  ACC_INTEGRAL: [
    ...rows(7),
    [null, null, null, null, "#ff8080", "#cc4040", null, null],
    [null, null, null, "#cc4040", "#ff8080", null, null, null],
    ...rows(7),
  ],

  ACC_NOTES: [
    ...rows(12),
    [null, null, null, null, "#ffe080", "#e0c060", null, null],
    [null, null, null, "#e0c060", "#ffe080", "#e0c060", null, null],
    [null, null, null, null, "#e0c060", null, null, null],
  ],

  ACC_DEERHACKS: [
    ...rows(7),
    [null, null, null, "#ffd700", "#e6b800", null, null, null],
    [null, null, "#e6b800", "#ffd700", null, null, null, null],
    ...rows(7),
  ],

  // ════════════════════════════════════════════════════════════════════════
  // BASE / SHOES
  // ════════════════════════════════════════════════════════════════════════

  BASE_DEFAULT: [
    ...rows(14),
    [null, "#e0e0f0", "#e0e0f0", null, null, "#e0e0f0", "#e0e0f0", null],
    ["#3c78d8", "#e0e0f0", "#e0e0f0", "#3c78d8", "#3c78d8", "#e0e0f0", "#e0e0f0", "#3c78d8"],
  ],

  BASE_MAP_SOCKS: [
    ...rows(10),
    [null, "#0090b0", "#0090b0", null, null, "#0090b0", "#0090b0", null],
    [null, "#00b0d0", "#0090b0", null, null, "#0090b0", "#00b0d0", null],
    [null, "#0090b0", "#00b0d0", null, null, "#00b0d0", "#0090b0", null],
    [null, "#0090b0", "#0090b0", null, null, "#0090b0", "#0090b0", null],
    [null, "#007090", "#0090b0", null, null, "#0090b0", "#007090", null],
    ["#004060", "#007090", "#007090", "#004060", "#004060", "#007090", "#007090", "#004060"],
  ],

  BASE_DEER_SOCKS: [
    ...rows(10),
    [null, "#c8a060", "#c8a060", null, null, "#c8a060", "#c8a060", null],
    [null, "#ddb870", "#c8a060", null, null, "#c8a060", "#ddb870", null],
    [null, "#c8a060", "#8b6914", null, null, "#8b6914", "#c8a060", null],
    [null, "#c8a060", "#c8a060", null, null, "#c8a060", "#c8a060", null],
    [null, "#8b6914", "#c8a060", null, null, "#c8a060", "#8b6914", null],
    ["#6a4a00", "#8b6914", "#8b6914", "#6a4a00", "#6a4a00", "#8b6914", "#8b6914", "#6a4a00"],
  ],

  BASE_SHUTTLE: [
    ...rows(10),
    [null, "#1a3a7a", "#2a5ab0", null, null, "#2a5ab0", "#1a3a7a", null],
    [null, "#2a5ab0", "#4a7ad0", null, null, "#4a7ad0", "#2a5ab0", null],
    [null, "#4a7ad0", "#2a5ab0", null, null, "#2a5ab0", "#4a7ad0", null],
    [null, "#2a5ab0", "#1a3a7a", null, null, "#1a3a7a", "#2a5ab0", null],
    [null, "#1a3a7a", "#2a5ab0", null, null, "#2a5ab0", "#1a3a7a", null],
    ["#0a1e5a", "#1a3a7a", "#1a3a7a", "#0a1e5a", "#0a1e5a", "#1a3a7a", "#1a3a7a", "#0a1e5a"],
  ],

  BASE_THERMAL: [
    ...rows(10),
    [null, "#0a0a2a", "#1a1a4a", null, null, "#1a1a4a", "#0a0a2a", null],
    [null, "#1a1a4a", "#c8e0ff", null, null, "#c8e0ff", "#1a1a4a", null],
    [null, "#1a1a4a", "#0a0a2a", null, null, "#0a0a2a", "#1a1a4a", null],
    [null, "#0a0a2a", "#1a1a4a", null, null, "#1a1a4a", "#0a0a2a", null],
    [null, "#1a1a4a", "#0a0a2a", null, null, "#0a0a2a", "#1a1a4a", null],
    ["#040418", "#0a0a2a", "#0a0a2a", "#040418", "#040418", "#0a0a2a", "#0a0a2a", "#040418"],
  ],

  BASE_BINARY: [
    ...rows(10),
    [null, "#0a1e5a", "#7ab0ff", null, null, "#7ab0ff", "#0a1e5a", null],
    [null, "#7ab0ff", "#0a1e5a", null, null, "#0a1e5a", "#7ab0ff", null],
    [null, "#0a1e5a", "#7ab0ff", null, null, "#7ab0ff", "#0a1e5a", null],
    [null, "#7ab0ff", "#0a1e5a", null, null, "#0a1e5a", "#7ab0ff", null],
    [null, "#0a1e5a", "#7ab0ff", null, null, "#7ab0ff", "#0a1e5a", null],
    ["#040418", "#0a1e5a", "#0a1e5a", "#040418", "#040418", "#0a1e5a", "#0a1e5a", "#040418"],
  ],

  BASE_RAWC: [
    ...rows(14),
    [null, "#cc2222", "#cc2222", null, null, "#cc2222", "#cc2222", null],
    ["#aa0000", "#cc2222", "#ff4444", "#aa0000", "#aa0000", "#ff4444", "#cc2222", "#aa0000"],
  ],

  BASE_HOLDEN: [
    ...rows(10),
    [null, "#5a0000", "#800000", null, null, "#800000", "#5a0000", null],
    [null, "#800000", "#aa1111", null, null, "#aa1111", "#800000", null],
    [null, "#5a0000", "#800000", null, null, "#800000", "#5a0000", null],
    [null, "#800000", "#5a0000", null, null, "#5a0000", "#800000", null],
    [null, "#5a0000", "#aa1111", null, null, "#aa1111", "#5a0000", null],
    ["#380000", "#5a0000", "#800000", "#380000", "#380000", "#800000", "#5a0000", "#380000"],
  ],

  BASE_LAB_SHOES: [
    ...rows(14),
    [null, "#c0e8c0", "#d8f8d8", null, null, "#d8f8d8", "#c0e8c0", null],
    ["#90c890", "#c0e8c0", "#d8f8d8", "#90c890", "#90c890", "#d8f8d8", "#c0e8c0", "#90c890"],
  ],

  BASE_ECON: [
    ...rows(14),
    [null, "#005060", "#0090a0", null, null, "#0090a0", "#005060", null],
    ["#003040", "#005060", "#00b0c0", "#003040", "#003040", "#00b0c0", "#005060", "#003040"],
  ],

  BASE_PSYCH: [
    ...rows(14),
    [null, "#8040b0", "#b070d8", null, null, "#b070d8", "#8040b0", null],
    ["#6020a0", "#8040b0", "#d4a0ff", "#6020a0", "#6020a0", "#d4a0ff", "#8040b0", "#6020a0"],
  ],

  BASE_DEERHACKS: [
    ...rows(14),
    [null, "#b08800", "#ffd700", null, null, "#ffd700", "#b08800", null],
    ["#806000", "#b08800", "#ffe860", "#806000", "#806000", "#ffe860", "#b08800", "#806000"],
  ],

  BASE_COMMUTER: [
    ...rows(10),
    [null, "#384858", "#4a6070", null, null, "#4a6070", "#384858", null],
    [null, "#4a6070", "#607890", null, null, "#607890", "#4a6070", null],
    [null, "#384858", "#4a6070", null, null, "#4a6070", "#384858", null],
    [null, "#4a6070", "#384858", null, null, "#384858", "#4a6070", null],
    [null, "#384858", "#607890", null, null, "#607890", "#384858", null],
    ["#202830", "#384858", "#384858", "#202830", "#202830", "#384858", "#384858", "#202830"],
  ],

  BASE_CHAMPION: [
    ...rows(10),
    [null, "#b08800", "#c8a800", null, null, "#c8a800", "#b08800", null],
    [null, "#c8a800", "#e6c000", null, null, "#e6c000", "#c8a800", null],
    [null, "#e6c000", "#ffd700", null, null, "#ffd700", "#e6c000", null],
    [null, "#ffd700", "#e6c000", null, null, "#e6c000", "#ffd700", null],
    [null, "#c8a800", "#ffd700", null, null, "#ffd700", "#c8a800", null],
    ["#806000", "#b08800", "#c8a800", "#806000", "#806000", "#c8a800", "#b08800", "#806000"],
  ],
};

// ─── Composite Renderer ───────────────────────────────────────────────────────
function compositeSprite(equipped: string[]): PixelGrid {
  const result: PixelGrid = BASE_SPRITE.map((row) => [...row]);
  for (const itemId of equipped) {
    const overlay = ITEM_OVERLAYS[itemId];
    if (!overlay) continue;
    for (let r = 0; r < Math.min(overlay.length, result.length); r++) {
      const oRow = overlay[r];
      if (!oRow) continue;
      for (let c = 0; c < Math.min(oRow.length, result[r].length); c++) {
        const px = oRow[c];
        if (px !== null) result[r][c] = px;
      }
    }
  }
  return result;
}

// ─── Component ────────────────────────────────────────────────────────────────
type Props = {
  equippedItems?: string[];
  pixelSize?: number;
  style?: object;
};

export default function AvatarRenderer({ equippedItems = [], pixelSize = 8, style }: Props) {
  const grid = useMemo(() => compositeSprite(equippedItems), [equippedItems]);

  return (
    <View style={[{ width: pixelSize * 8, height: pixelSize * 16 }, style]}>
      {grid.map((row, ri) => (
        <View key={ri} style={{ flexDirection: "row" }}>
          {row.map((color, ci) => (
            <View
              key={ci}
              style={{ width: pixelSize, height: pixelSize, backgroundColor: color ?? "transparent" }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

export { ITEM_OVERLAYS };