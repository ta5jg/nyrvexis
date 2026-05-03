import type { NvUnit } from "./battle.js";

/**
 * Match pacing for gateway sim + web replay: catalog stats stay compact;
 * runtime scales HP/ATK so battles align with ~60–90 sec mobile-friendly
 * sessions (target avg ~75 sec). Peer async battlers (AFK, RAID, MSF, Hero
 * Wars) all sit in the 1–2 min band — that's where retention math works.
 */
export const MATCH_PACING = {
  hpMul: 2.5,
  atkMul: 0.95,
  /** Lower threshold ⇒ more actions per tick ⇒ denser combat read. Combined
   *  with hpMul reduction, average match resolves in ~200–400 ticks. */
  actThreshold: 130,
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
