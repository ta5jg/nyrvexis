/* =============================================================================
 * File:           apps/companion-web/src/ui/visual/spriteProfiles.ts
 * Author:         USDTG GROUP TECHNOLOGY LLC
 * Developer:      Irfan Gedik
 * Created Date:   2026-04-30
 * Last Update:    2026-04-30
 * Version:        0.3.0
 *
 * Description:
 *   Lightweight render tuning by fxProfileId/iconId (presentation only).
 *
 * License:
 *   Proprietary. All rights reserved. See LICENSE in the repository root.
 * ============================================================================= */

export type SpriteProfile = {
  /** Base sprite size in pixels (canvas) */
  size: number;
  /** Shadow intensity multiplier */
  shadow: number;
  /** Outline/glow intensity multiplier */
  glow: number;
  /** Idle bob amplitude in px */
  bob: number;
};

const DEFAULT: SpriteProfile = { size: 46, shadow: 1, glow: 1, bob: 2.2 };
/** Role-colored battlefield tuning; palette SSOT: `artDirection.ts` + CSS `--role-*`. */

const FX: Record<string, Partial<SpriteProfile>> = {
  fx_tank_heavy: { size: 30, shadow: 1.25, glow: 0.9, bob: 1.6 },
  fx_tank_guard: { size: 29, shadow: 1.15, glow: 0.95, bob: 1.8 },
  fx_tank_light: { size: 28, shadow: 1.05, glow: 1.0, bob: 2.0 },
  fx_dps_fast: { size: 28, shadow: 1.0, glow: 1.05, bob: 2.6 },
  fx_dps_ranged: { size: 28, shadow: 1.0, glow: 1.05, bob: 2.3 },
  fx_dps_magic: { size: 29, shadow: 1.0, glow: 1.15, bob: 2.4 },
  fx_support_heal: { size: 28, shadow: 1.0, glow: 1.1, bob: 2.1 },
  fx_support_buff: { size: 28, shadow: 1.0, glow: 1.1, bob: 2.2 },
  fx_control_hex: { size: 28, shadow: 1.0, glow: 1.2, bob: 2.3 }
};

export function spriteProfile(params: { fxProfileId?: string | null; iconId?: string | null }): SpriteProfile {
  const fx = params.fxProfileId ? FX[params.fxProfileId] : undefined;
  return { ...DEFAULT, ...(fx ?? {}) };
}

