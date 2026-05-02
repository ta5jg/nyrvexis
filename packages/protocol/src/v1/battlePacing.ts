import type { NvUnit } from "./battle.js";

/**
 * Match pacing for gateway sim + web replay: catalog stats stay compact;
 * runtime scales HP/ATK so ticks align with ~5–7 min cinematic sessions.
 */
export const MATCH_PACING = {
  hpMul: 6,
  atkMul: 0.88,
  /** Higher threshold ⇒ fewer actions per tick ⇒ sparser combat. Tuned for publish-feel density (R9). */
  actThreshold: 220,
  /** Basic attack miss chance (deterministic roll). On miss, no damage / on-hit effects. */
  baseHitPct: 88
} as const;

export function scaleUnitForMatchPacing(u: NvUnit): NvUnit {
  return {
    ...u,
    hp: Math.max(1, Math.floor((u.hp | 0) * MATCH_PACING.hpMul)),
    atk: Math.max(1, Math.floor((u.atk | 0) * MATCH_PACING.atkMul))
  };
}

/** HP baseline used by replay/UI — must match sim after `scaleUnitForMatchPacing`. */
export function scaledMatchHp(u: Pick<NvUnit, "hp">): number {
  return Math.max(1, Math.floor((u.hp | 0) * MATCH_PACING.hpMul));
}
