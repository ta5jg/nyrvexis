/* =============================================================================
 * File:           apps/companion-web/src/ui/visual/vfxPresets.ts
 * Author:         USDTG GROUP TECHNOLOGY LLC
 * Developer:      Irfan Gedik
 * Created Date:   2026-05-01
 * Last Update:    2026-05-01
 * Version:        1.0.0
 *
 * Description:
 *   Event-driven battle VFX tuning (replay scrub perf + prefers-reduced-motion).
 *
 * License:
 *   Proprietary. All rights reserved. See LICENSE in the repository root.
 * ============================================================================= */

export type ArenaVfxTuning = {
  strikeLinesMax: number;
  abilityParticles: number;
  dmgFloatMs: number;
  bobMultiplier: number;
  /** Multiplier for end-of-match vignette / side wash alphas */
  endWashAlpha: number;
  critExpansionRing: boolean;
};

export function arenaVfxTuning(prefersReducedMotion: boolean): ArenaVfxTuning {
  if (prefersReducedMotion) {
    return {
      strikeLinesMax: 2,
      abilityParticles: 2,
      dmgFloatMs: 480,
      bobMultiplier: 0.25,
      endWashAlpha: 0.55,
      critExpansionRing: false
    };
  }
  return {
    strikeLinesMax: 6,
    abilityParticles: 8,
    dmgFloatMs: 820,
    bobMultiplier: 1,
    endWashAlpha: 1,
    critExpansionRing: true
  };
}
