/* =============================================================================
 * File:           apps/companion-web/src/ui/visual/spriteAssets.ts
 * Author:         USDTG GROUP TECHNOLOGY LLC
 * Developer:      Irfan Gedik
 * Created Date:   2026-04-30
 * Last Update:    2026-04-30
 * Version:        0.3.0
 *
 * Description:
 *   File-based sprite frames bundled by Vite. These act as a real asset pack
 *   and will later be replaced by atlas-based spritesheets without changing
 *   the public API.
 *
 * License:
 *   Proprietary. All rights reserved. See LICENSE in the repository root.
 * ============================================================================= */

import idle0 from "../../assets/sprites/char_idle_0.svg";
import idle1 from "../../assets/sprites/char_idle_1.svg";
import idle2 from "../../assets/sprites/char_idle_2.svg";
import idle3 from "../../assets/sprites/char_idle_3.svg";
import atk0 from "../../assets/sprites/char_attack_0.svg";
import atk1 from "../../assets/sprites/char_attack_1.svg";
import atk2 from "../../assets/sprites/char_attack_2.svg";
import death0 from "../../assets/sprites/char_death_0.svg";

import soldierIdle0 from "../../assets/sprites/unit_soldier_idle_0.svg";
import soldierIdle1 from "../../assets/sprites/unit_soldier_idle_1.svg";
import soldierAtk0 from "../../assets/sprites/unit_soldier_attack_0.svg";
import soldierAtk1 from "../../assets/sprites/unit_soldier_attack_1.svg";

import archerIdle0 from "../../assets/sprites/unit_archer_idle_0.svg";
import archerIdle1 from "../../assets/sprites/unit_archer_idle_1.svg";
import archerAtk0 from "../../assets/sprites/unit_archer_attack_0.svg";
import archerAtk1 from "../../assets/sprites/unit_archer_attack_1.svg";

import mageIdle0 from "../../assets/sprites/unit_mage_idle_0.svg";
import mageIdle1 from "../../assets/sprites/unit_mage_idle_1.svg";
import mageAtk0 from "../../assets/sprites/unit_mage_attack_0.svg";
import mageAtk1 from "../../assets/sprites/unit_mage_attack_1.svg";

import clericIdle0 from "../../assets/sprites/unit_cleric_idle_0.svg";
import clericIdle1 from "../../assets/sprites/unit_cleric_idle_1.svg";
import clericAtk0 from "../../assets/sprites/unit_cleric_attack_0.svg";
import clericAtk1 from "../../assets/sprites/unit_cleric_attack_1.svg";

import witchIdle0 from "../../assets/sprites/unit_witch_idle_0.svg";
import witchIdle1 from "../../assets/sprites/unit_witch_idle_1.svg";
import witchAtk0 from "../../assets/sprites/unit_witch_attack_0.svg";
import witchAtk1 from "../../assets/sprites/unit_witch_attack_1.svg";

import knightIdle0 from "../../assets/sprites/unit_knight_idle_0.svg";
import knightIdle1 from "../../assets/sprites/unit_knight_idle_1.svg";
import knightAtk0 from "../../assets/sprites/unit_knight_attack_0.svg";
import knightAtk1 from "../../assets/sprites/unit_knight_attack_1.svg";

/** Default full-body loop for catalog units without bespoke unit_* sprite sheets (not roster icons). */
const GENERIC_UNIT = {
  idle: [idle0, idle1, idle2, idle3],
  attack: [atk0, atk1, atk2],
  death: [death0]
} as const;

export const SPRITE_FRAMES = {
  idle: [idle0, idle1, idle2, idle3],
  attack: [atk0, atk1, atk2],
  death: [death0],
  units: {
    unit_soldier_v1: { idle: [soldierIdle0, soldierIdle1], attack: [soldierAtk0, soldierAtk1], death: [death0] },
    unit_archer_v1: { idle: [archerIdle0, archerIdle1], attack: [archerAtk0, archerAtk1], death: [death0] },
    unit_mage_v1: { idle: [mageIdle0, mageIdle1], attack: [mageAtk0, mageAtk1], death: [death0] },
    unit_cleric_v1: { idle: [clericIdle0, clericIdle1], attack: [clericAtk0, clericAtk1], death: [death0] },
    unit_witch_v1: { idle: [witchIdle0, witchIdle1], attack: [witchAtk0, witchAtk1], death: [death0] },
    unit_knight_v1: { idle: [knightIdle0, knightIdle1], attack: [knightAtk0, knightAtk1], death: [death0] },

    // Bespoke sheets land here later; until then use generic silhouettes (reads as “unit”, not UI icon).
    unit_brute_v1: GENERIC_UNIT,
    unit_guardian_v1: GENERIC_UNIT,
    unit_warden_v1: GENERIC_UNIT,
    unit_paladin_v1: GENERIC_UNIT,
    unit_sentinel_v1: GENERIC_UNIT,
    unit_champion_v1: GENERIC_UNIT,
    unit_gladiator_v1: GENERIC_UNIT,
    unit_barrier_v1: GENERIC_UNIT,
    unit_rogue_v1: GENERIC_UNIT,
    unit_ranger_v1: GENERIC_UNIT,
    unit_monk_v1: GENERIC_UNIT,
    unit_hexer_v1: GENERIC_UNIT
  }
} as const;

/** Idle animation URLs for a catalog `iconId` (e.g. `unit_soldier_v1`), else generic hero loop. */
export function idleFrameUrlsForUnit(iconId?: string | null): readonly string[] {
  if (!iconId) return SPRITE_FRAMES.idle;
  const u = (SPRITE_FRAMES as { units?: Record<string, { idle: readonly string[] }> }).units?.[iconId];
  return u?.idle ?? SPRITE_FRAMES.idle;
}

