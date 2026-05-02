/* =============================================================================
 * File:           apps/companion-web/src/ui/visual/visualModels.ts
 * Author:         USDTG GROUP TECHNOLOGY LLC
 * Developer:      Irfan Gedik
 * Created Date:   2026-04-30
 * Last Update:    2026-04-30
 * Version:        1.0.0
 *
 * Description:
 *   Asset-driven visual model contracts for web/mobile renderer layer.
 *
 * License:
 *   Proprietary. All rights reserved. See LICENSE in the repository root.
 * ============================================================================= */

export type RarityTier = "common" | "rare" | "epic" | "legendary";

export type IdleAnimationPlaceholder =
  | {
      kind: "bob";
      amplitudePx: number;
      speed: number;
    }
  | {
      kind: "pulse";
      scaleAmplitude: number;
      speed: number;
    };

export type VisualCropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type UnitVisualConfig = {
  id: string;
  portraitImage: string | null;
  portraitCrop?: VisualCropRect;
  battlefieldSprite: string | null;
  battlefieldCrop?: VisualCropRect;
  roleIcon: string;
  rarity: RarityTier;
  rarityFrame: string;
  idleAnimationPlaceholder: IdleAnimationPlaceholder;
};

export type ArenaVisualVariant = {
  id: string;
  crop?: VisualCropRect;
};

/** Arena-wide canvas tuning (presentation only; sim SSOT değişmez). */
export type ArenaPresentationConfig = {
  /**
   * 0–1 outer ink ring + cel outline around clipped portrait / sheet body.
   * `0` = grounded look (no “fanus” halo); `1` = legacy thick ring read.
   */
  portraitRingStrength: number;
};

export type ArenaVisualConfig = {
  id: string;
  style: "dark-fantasy-sci-fi";
  image: string;
  defaultVariant: string;
  variants: readonly ArenaVisualVariant[];
  /** Partial merge over `DEFAULT_ARENA_PRESENTATION` in `visualConfigs.ts`. */
  presentation?: Partial<ArenaPresentationConfig>;
};

export type RarityVisualConfig = {
  rarity: RarityTier;
  frameImage: string;
  glowColor: number;
  labelColor: number;
};
