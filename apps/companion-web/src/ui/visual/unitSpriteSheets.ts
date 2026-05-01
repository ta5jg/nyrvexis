/* =============================================================================
 * File:           apps/companion-web/src/ui/visual/unitSpriteSheets.ts
 * Description:
 *   Geometry for raw roster PNGs under `public/assets/units/raw/`.
 *   Each sheet packs multiple heroes; battlefield crops MUST use grid cells,
 *   not hand-tuned rectangles that drift into neighbouring sprites.
 * ============================================================================= */

import type { VisualCropRect } from "./visualModels";

export const UNIT_RAW = {
  set01: "/assets/units/raw/units_set_01.png",
  set02: "/assets/units/raw/units_set_02.png",
  set03: "/assets/units/raw/units_set_03.png",
  set04: "/assets/units/raw/units_set_04.png",
  set05: "/assets/units/raw/units_set_05.png",
  set06: "/assets/units/raw/units_set_06.png"
} as const;

/** 1536×1024 sheets: five columns × two rows (10 portraits). */
const SHEET_1536_COL_X = [0, 307, 614, 921, 1228] as const;
const SHEET_1536_COL_W = [307, 307, 307, 307, 308] as const;
const SHEET_1536_ROW_H = 512;

/**
 * Crop one cell from a 1536×1024 roster sheet.
 * Column index 0 = left edge; row 0 = top row.
 */
export function cropRoster1536x1024(col: 0 | 1 | 2 | 3 | 4, row: 0 | 1, inset = 16): VisualCropRect {
  const x0 = SHEET_1536_COL_X[col];
  const w0 = SHEET_1536_COL_W[col];
  const y0 = row * SHEET_1536_ROW_H;
  return {
    x: x0 + inset,
    y: y0 + inset,
    width: w0 - inset * 2,
    height: SHEET_1536_ROW_H - inset * 2
  };
}

/** units_set_02.png is 1024×1536: three columns × four rows. */
const SHEET_1024_COL_X = [0, 341, 682] as const;
const SHEET_1024_COL_W = [341, 341, 342] as const;
const SHEET_1024_ROW_H = 384;

/**
 * Crop one cell from the 1024×1536 sheet (set_02).
 */
export function cropRoster1024x1536(col: 0 | 1 | 2, row: 0 | 1 | 2 | 3, inset = 16): VisualCropRect {
  const x0 = SHEET_1024_COL_X[col];
  const w0 = SHEET_1024_COL_W[col];
  const y0 = row * SHEET_1024_ROW_H;
  return {
    x: x0 + inset,
    y: y0 + inset,
    width: w0 - inset * 2,
    height: SHEET_1024_ROW_H - inset * 2
  };
}

/**
 * units_set_01.png layout (left→right, top then bottom), for documentation / mapping:
 * Row0: knight | archer | heavy berserker | assassin | dark mage
 * Row1: paladin | void knight | cleric | hammer | fire elemental
 */
export const SET01_LAYOUT = {
  soldier: [0, 0],
  archer: [1, 0],
  brute: [2, 0],
  rogue: [3, 0],
  darkMageTop: [4, 0],
  paladin: [0, 1],
  voidKnight: [1, 1],
  cleric: [2, 1],
  hammer: [3, 1],
  fireElemental: [4, 1]
} as const satisfies Record<string, readonly [0 | 1 | 2 | 3 | 4, 0 | 1]>;

/**
 * units_set_02.png layout:
 * Row0: armored knight | juggernaut | hooded ranger(bow)
 * Row1: dark mage | spellblade | golden paladin
 * Row2: shadow caster | druid | armored cleric
 * Row3: (mostly empty) | infernal warrior | (mostly empty)  → use middle column cell [1,3]
 */
export const SET02_LAYOUT = {
  knightBlue: [0, 0],
  juggernaut: [1, 0],
  rangerBow: [2, 0],
  darkMage: [0, 1],
  spellblade: [1, 1],
  paladinGold: [2, 1],
  shadowPurple: [0, 2],
  druid: [1, 2],
  clericBlue: [2, 2],
  infernalCenter: [1, 3]
} as const satisfies Record<string, readonly [0 | 1 | 2, 0 | 1 | 2 | 3]>;

export function cropSet01(key: keyof typeof SET01_LAYOUT, inset?: number): VisualCropRect {
  const [c, r] = SET01_LAYOUT[key];
  return cropRoster1536x1024(c, r, inset);
}

export function cropSet02(key: keyof typeof SET02_LAYOUT, inset?: number): VisualCropRect {
  const [c, r] = SET02_LAYOUT[key];
  return cropRoster1024x1536(c, r, inset);
}
