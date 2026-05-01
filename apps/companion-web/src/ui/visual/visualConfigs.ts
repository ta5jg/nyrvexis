/* =============================================================================
 * File:           apps/companion-web/src/ui/visual/visualConfigs.ts
 * Author:         USDTG GROUP TECHNOLOGY LLC
 * Developer:      Irfan Gedik
 * Created Date:   2026-04-30
 * Last Update:    2026-04-30
 * Version:        1.0.0
 *
 * Description:
 *   Central visual configs for units, rarity frames, and arena backgrounds.
 *
 * License:
 *   Proprietary. All rights reserved. See LICENSE in the repository root.
 * ============================================================================= */

import type { KrUnitRole } from "@kindrail/protocol";
import type {
  ArenaVisualConfig,
  ArenaVisualVariant,
  RarityTier,
  RarityVisualConfig,
  UnitVisualConfig,
  VisualCropRect
} from "./visualModels";
import { UNIT_RAW, cropSet01, cropSet02 } from "./unitSpriteSheets";

const ROLE_ICON_BY_ROLE: Record<KrUnitRole, string> = {
  tank: "/assets/icons/role_tank.svg",
  dps: "/assets/icons/role_dps.svg",
  support: "/assets/icons/role_support.svg",
  control: "/assets/icons/role_control.svg"
};

const RARITY_FRAMES: Record<RarityTier, string> = {
  common: "/assets/ui/rarity_common.svg",
  rare: "/assets/ui/rarity_rare.svg",
  epic: "/assets/ui/rarity_epic.svg",
  legendary: "/assets/ui/rarity_legendary.svg"
};

export const RARITY_VISUALS: Record<RarityTier, RarityVisualConfig> = {
  common: { rarity: "common", frameImage: RARITY_FRAMES.common, glowColor: 0x7f8da3, labelColor: 0xc8d4e8 },
  rare: { rarity: "rare", frameImage: RARITY_FRAMES.rare, glowColor: 0x42a5ff, labelColor: 0xb6e4ff },
  epic: { rarity: "epic", frameImage: RARITY_FRAMES.epic, glowColor: 0xc57cff, labelColor: 0xe8ccff },
  legendary: { rarity: "legendary", frameImage: RARITY_FRAMES.legendary, glowColor: 0xffb547, labelColor: 0xffe2a5 }
};

const crop = (x: number, y: number, width: number, height: number): VisualCropRect => ({ x, y, width, height });

/**
 * Battlefield portrait crops: archetype id → sheet + rectangle.
 * Multi-hero PNGs use grid helpers in `unitSpriteSheets.ts` (never guess raw x/y).
 */
const UNIT_IMAGE_HINTS: Record<
  string,
  {
    image: string;
    crop: VisualCropRect;
    rarity?: RarityTier;
  }
> = {
  soldier: { image: UNIT_RAW.set01, crop: cropSet01("soldier"), rarity: "common" },
  archer: { image: UNIT_RAW.set01, crop: cropSet01("archer"), rarity: "common" },
  brute: { image: UNIT_RAW.set01, crop: cropSet01("brute"), rarity: "rare" },
  rogue: { image: UNIT_RAW.set01, crop: cropSet01("rogue"), rarity: "rare" },
  knight: { image: "/assets/units/raw/units_set_04.png", crop: crop(18, 12, 330, 320), rarity: "rare" },
  guardian: { image: "/assets/units/raw/units_set_04.png", crop: crop(1040, 338, 420, 320), rarity: "epic" },
  warden: { image: UNIT_RAW.set01, crop: cropSet01("voidKnight"), rarity: "rare" },
  paladin: { image: "/assets/units/raw/units_set_03.png", crop: crop(0, 0, 330, 316), rarity: "epic" },
  sentinel: { image: "/assets/units/raw/units_set_03.png", crop: crop(392, 0, 350, 316), rarity: "rare" },
  champion: { image: "/assets/units/raw/units_set_03.png", crop: crop(736, 0, 380, 316), rarity: "epic" },
  gladiator: { image: "/assets/units/raw/units_set_03.png", crop: crop(0, 340, 330, 300), rarity: "epic" },
  barrier: { image: "/assets/units/raw/units_set_03.png", crop: crop(370, 338, 360, 310), rarity: "rare" },
  archer2: { image: UNIT_RAW.set02, crop: cropSet02("rangerBow"), rarity: "common" },
  ranger: { image: UNIT_RAW.set02, crop: cropSet02("rangerBow"), rarity: "rare" },
  mage: { image: UNIT_RAW.set02, crop: cropSet02("darkMage"), rarity: "epic" },
  cleric: { image: UNIT_RAW.set02, crop: cropSet02("clericBlue"), rarity: "rare" },
  monk: { image: UNIT_RAW.set02, crop: cropSet02("druid"), rarity: "rare" },
  witch: { image: UNIT_RAW.set02, crop: cropSet02("spellblade"), rarity: "epic" },
  hexer: { image: UNIT_RAW.set02, crop: cropSet02("shadowPurple"), rarity: "epic" },
  berserker: { image: "/assets/units/raw/units_set_05.png", crop: crop(8, 4, 340, 306), rarity: "rare" },
  assassin: { image: "/assets/units/raw/units_set_05.png", crop: crop(348, 8, 340, 302), rarity: "rare" },
  spearman: { image: "/assets/units/raw/units_set_05.png", crop: crop(692, 8, 340, 302), rarity: "rare" },
  warlock: { image: "/assets/units/raw/units_set_05.png", crop: crop(1038, 10, 360, 298), rarity: "epic" },
  duelist: { image: "/assets/units/raw/units_set_05.png", crop: crop(20, 338, 340, 300), rarity: "rare" },
  sniper: { image: "/assets/units/raw/units_set_06.png", crop: crop(0, 0, 360, 300), rarity: "rare" },
  pyromancer: { image: "/assets/units/raw/units_set_06.png", crop: crop(0, 300, 360, 330), rarity: "epic" },
  reaper: { image: "/assets/units/raw/units_set_04.png", crop: crop(354, 338, 340, 314), rarity: "epic" },
  brawler: { image: "/assets/units/raw/units_set_06.png", crop: crop(1112, 0, 350, 316), rarity: "rare" },
  lancer: { image: "/assets/units/raw/units_set_06.png", crop: crop(1108, 332, 370, 310), rarity: "rare" },
  bard: { image: "/assets/units/raw/units_set_03.png", crop: crop(736, 338, 360, 300), rarity: "common" },
  druid: { image: "/assets/units/raw/units_set_04.png", crop: crop(348, 0, 350, 322), rarity: "rare" },
  engineer: { image: "/assets/units/raw/units_set_04.png", crop: crop(696, 0, 350, 320), rarity: "rare" },
  alchemist: { image: "/assets/units/raw/units_set_04.png", crop: crop(1040, 2, 350, 320), rarity: "epic" },
  banneret: { image: UNIT_RAW.set01, crop: cropSet01("paladin"), rarity: "common" },
  scribe: { image: "/assets/units/raw/units_set_03.png", crop: crop(1088, 338, 360, 300), rarity: "rare" },
  frostcaller: { image: "/assets/units/raw/units_set_05.png", crop: crop(352, 338, 340, 300), rarity: "epic" },
  stormseer: { image: "/assets/units/raw/units_set_05.png", crop: crop(698, 336, 340, 302), rarity: "epic" },
  trapper: { image: "/assets/units/raw/units_set_06.png", crop: crop(362, 0, 340, 300), rarity: "rare" },
  inquisitor: { image: "/assets/units/raw/units_set_06.png", crop: crop(734, 304, 360, 328), rarity: "epic" }
};

const ARENA_CONFIGS: Record<string, ArenaVisualConfig> = {
  arena_darkfantasy_v2: {
    id: "arena_darkfantasy_v2",
    style: "dark-fantasy-sci-fi",
    image: "/assets/arenas/arena_darkfantasy_v2.png",
    defaultVariant: "full",
    variants: [{ id: "full" }]
  },
  arena_darkfantasy_v1: {
    id: "arena_darkfantasy_v1",
    style: "dark-fantasy-sci-fi",
    image: "/assets/arenas/arena_darkfantasy_v1.png",
    defaultVariant: "mid",
    variants: [
      { id: "top", crop: crop(0, 0, 1536, 341) },
      { id: "mid", crop: crop(0, 341, 1536, 341) },
      { id: "bot", crop: crop(0, 682, 1536, 342) }
    ]
  }
};

function hash32(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rarityForArchetype(archetypeId: string): RarityTier {
  return UNIT_IMAGE_HINTS[archetypeId]?.rarity ?? "common";
}

export function resolveRarityVisual(rarity: RarityTier): RarityVisualConfig {
  return RARITY_VISUALS[rarity] ?? RARITY_VISUALS.common;
}

export function resolveUnitVisualConfig(params: {
  archetypeId: string;
  role: KrUnitRole;
}): UnitVisualConfig {
  const hint = UNIT_IMAGE_HINTS[params.archetypeId];
  const rarity = rarityForArchetype(params.archetypeId);
  return {
    id: params.archetypeId,
    portraitImage: hint?.image ?? null,
    portraitCrop: hint?.crop,
    battlefieldSprite: hint?.image ?? null,
    battlefieldCrop: hint?.crop,
    roleIcon: ROLE_ICON_BY_ROLE[params.role] ?? ROLE_ICON_BY_ROLE.dps,
    rarity,
    rarityFrame: RARITY_FRAMES[rarity],
    idleAnimationPlaceholder: params.role === "tank" ? { kind: "pulse", speed: 1.6, scaleAmplitude: 0.022 } : { kind: "bob", speed: 2.0, amplitudePx: 1.9 }
  };
}

export function resolveArenaVisual(seedLike: string | null | undefined): {
  config: ArenaVisualConfig;
  variant: ArenaVisualVariant;
} {
  // Prefer v2 full board; use v1 strip variants for seeded variety.
  const arena = ARENA_CONFIGS.arena_darkfantasy_v2;
  const seed = seedLike && seedLike.length > 0 ? seedLike : "kindrail-default-arena";
  const v1 = ARENA_CONFIGS.arena_darkfantasy_v1;
  const useV1 = (hash32(seed) & 1) === 1;
  const active = useV1 ? v1 : arena;
  const idx = hash32(`${seed}|${active.id}`) % active.variants.length;
  const variant = active.variants[idx] ?? active.variants[0] ?? { id: "full" };
  return { config: active, variant };
}
