/* =============================================================================
 * File:           apps/companion-web/src/ui/visual/iconRegistry.ts
 * Author:         USDTG GROUP TECHNOLOGY LLC
 * Developer:      Irfan Gedik
 * Created Date:   2026-04-30
 * Last Update:    2026-04-30
 * Version:        0.3.0
 *
 * Description:
 *   iconId -> asset URL registry (build-time bundled by Vite).
 *
 * License:
 *   Proprietary. All rights reserved. See LICENSE in the repository root.
 * ============================================================================= */

import soldier from "../../assets/icons/unit_soldier_v1.svg";
import archer from "../../assets/icons/unit_archer_v1.svg";
import brute from "../../assets/icons/unit_brute_v1.svg";
import knight from "../../assets/icons/unit_knight_v1.svg";
import guardian from "../../assets/icons/unit_guardian_v1.svg";
import warden from "../../assets/icons/unit_warden_v1.svg";
import paladin from "../../assets/icons/unit_paladin_v1.svg";
import sentinel from "../../assets/icons/unit_sentinel_v1.svg";
import champion from "../../assets/icons/unit_champion_v1.svg";
import gladiator from "../../assets/icons/unit_gladiator_v1.svg";
import barrier from "../../assets/icons/unit_barrier_v1.svg";
import mage from "../../assets/icons/unit_mage_v1.svg";
import rogue from "../../assets/icons/unit_rogue_v1.svg";
import ranger from "../../assets/icons/unit_ranger_v1.svg";
import cleric from "../../assets/icons/unit_cleric_v1.svg";
import monk from "../../assets/icons/unit_monk_v1.svg";
import witch from "../../assets/icons/unit_witch_v1.svg";
import hexer from "../../assets/icons/unit_hexer_v1.svg";
import warmachine from "../../assets/icons/aug_warmachine_v1.svg";
import bulwark from "../../assets/icons/aug_bulwark_v1.svg";

const ICONS: Record<string, string> = {
  unit_soldier_v1: soldier,
  unit_archer_v1: archer,
  unit_brute_v1: brute,
  unit_knight_v1: knight,
  unit_guardian_v1: guardian,
  unit_warden_v1: warden,
  unit_paladin_v1: paladin,
  unit_sentinel_v1: sentinel,
  unit_champion_v1: champion,
  unit_gladiator_v1: gladiator,
  unit_barrier_v1: barrier,
  unit_mage_v1: mage,
  unit_rogue_v1: rogue,
  unit_ranger_v1: ranger,
  unit_cleric_v1: cleric,
  unit_monk_v1: monk,
  unit_witch_v1: witch,
  unit_hexer_v1: hexer,
  aug_warmachine_v1: warmachine,
  aug_bulwark_v1: bulwark
};

export function iconUrl(iconId: string | undefined | null): string | null {
  if (!iconId) return null;
  return ICONS[iconId] ?? null;
}

