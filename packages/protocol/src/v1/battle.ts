import { z } from "zod";

/**
 * v0 auto-battler simulation contract.
 * - Deterministic: all randomness comes from seed + deterministic tick loop
 * - Minimal: small surface area to iterate quickly
 * - Optional `presentation` on events is derived in sim for clients only (Animator hints); must not affect outcomes.
 */

export const NvBattleSeed = z
  .object({
    seed: z.string().min(1)
  })
  .strict();
export type NvBattleSeed = z.infer<typeof NvBattleSeed>;

export const NvUnitArchetypeId = z.string().min(1);
export type NvUnitArchetypeId = z.infer<typeof NvUnitArchetypeId>;

export const NvUnit = z
  .object({
    id: z.string().min(1),
    archetype: NvUnitArchetypeId,
    // Core stats (ints only for determinism)
    hp: z.number().int().min(1),
    atk: z.number().int().min(0),
    def: z.number().int().min(0),
    spd: z.number().int().min(1),
    // Optional tuning knobs
    critPct: z.number().int().min(0).max(100).default(0),
    critMulPct: z.number().int().min(100).max(500).default(150),
    // Formation index: 0..(units.length-1). Lower indexes are "front row" by convention.
    slot: z.number().int().min(0).max(11).default(0)
  })
  .strict();
export type NvUnit = z.infer<typeof NvUnit>;

export const NvTeam = z
  .object({
    name: z.string().min(1),
    units: z.array(NvUnit).min(1).max(12)
  })
  .strict();
export type NvTeam = z.infer<typeof NvTeam>;

export const NvStatusKind = z.enum(["shield", "bleed", "taunt", "stun"]);
export type NvStatusKind = z.infer<typeof NvStatusKind>;

export const NvStatusApply = z
  .object({
    kind: NvStatusKind,
    // duration in ticks
    dur: z.number().int().min(0).max(2000),
    // magnitude depends on status
    // - shield: absorbs dmg
    // - bleed: dmg per tick
    // - taunt/stun: usually magnitude=1
    mag: z.number().int().min(0).max(1_000_000).default(0)
  })
  .strict();
export type NvStatusApply = z.infer<typeof NvStatusApply>;

export const NvBattleSimRequest = z
  .object({
    v: z.literal(1),
    seed: NvBattleSeed,
    a: NvTeam,
    b: NvTeam,
    maxTicks: z.number().int().min(1).max(100_000).default(8000)
  })
  .strict();
export type NvBattleSimRequest = z.infer<typeof NvBattleSimRequest>;

/** Matches Unity `NyrvexisAnimStates`; presentation-only, never affects outcomes. */
export const NvBattleAnimIntent = z.enum(["idle", "advance", "attack", "hit", "death"]);
export type NvBattleAnimIntent = z.infer<typeof NvBattleAnimIntent>;

/** Optional per-event hints for web / Unity; derived deterministically in sim; clients must not branch gameplay on this. */
export const NvBattleEventPresentation = z
  .object({
    srcIntent: NvBattleAnimIntent.optional(),
    dstIntent: NvBattleAnimIntent.optional()
  })
  .strict();
export type NvBattleEventPresentation = z.infer<typeof NvBattleEventPresentation>;

export const NvBattleEvent = z
  .object({
    t: z.number().int().nonnegative(),
    kind: z.enum(["hit", "death", "end", "status_apply", "status_tick", "ability"]),
    src: z.string().min(1).optional(),
    dst: z.string().min(1).optional(),
    dmg: z.number().int().min(0).optional(),
    crit: z.boolean().optional(),
    status: NvStatusApply.optional(),
    // for ability events
    abilityId: z.string().min(1).optional(),
    presentation: NvBattleEventPresentation.optional()
  })
  .strict();
export type NvBattleEvent = z.infer<typeof NvBattleEvent>;

export const NvBattleOutcome = z.enum(["a", "b", "draw"]);
export type NvBattleOutcome = z.infer<typeof NvBattleOutcome>;

export const NvBattleSimResult = z
  .object({
    v: z.literal(1),
    seed: NvBattleSeed,
    outcome: NvBattleOutcome,
    ticks: z.number().int().nonnegative(),
    // remaining HP snapshot
    remaining: z
      .object({
        a: z.record(z.string(), z.number().int().nonnegative()),
        b: z.record(z.string(), z.number().int().nonnegative())
      })
      .strict(),
    events: z.array(NvBattleEvent).max(50_000)
  })
  .strict();
export type NvBattleSimResult = z.infer<typeof NvBattleSimResult>;

