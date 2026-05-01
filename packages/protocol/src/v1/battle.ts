import { z } from "zod";

/**
 * v0 auto-battler simulation contract.
 * - Deterministic: all randomness comes from seed + deterministic tick loop
 * - Minimal: small surface area to iterate quickly
 */

export const KrBattleSeed = z
  .object({
    seed: z.string().min(1)
  })
  .strict();
export type KrBattleSeed = z.infer<typeof KrBattleSeed>;

export const KrUnitArchetypeId = z.string().min(1);
export type KrUnitArchetypeId = z.infer<typeof KrUnitArchetypeId>;

export const KrUnit = z
  .object({
    id: z.string().min(1),
    archetype: KrUnitArchetypeId,
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
export type KrUnit = z.infer<typeof KrUnit>;

export const KrTeam = z
  .object({
    name: z.string().min(1),
    units: z.array(KrUnit).min(1).max(12)
  })
  .strict();
export type KrTeam = z.infer<typeof KrTeam>;

export const KrStatusKind = z.enum(["shield", "bleed", "taunt", "stun"]);
export type KrStatusKind = z.infer<typeof KrStatusKind>;

export const KrStatusApply = z
  .object({
    kind: KrStatusKind,
    // duration in ticks
    dur: z.number().int().min(0).max(2000),
    // magnitude depends on status
    // - shield: absorbs dmg
    // - bleed: dmg per tick
    // - taunt/stun: usually magnitude=1
    mag: z.number().int().min(0).max(1_000_000).default(0)
  })
  .strict();
export type KrStatusApply = z.infer<typeof KrStatusApply>;

export const KrBattleSimRequest = z
  .object({
    v: z.literal(1),
    seed: KrBattleSeed,
    a: KrTeam,
    b: KrTeam,
    maxTicks: z.number().int().min(1).max(100_000).default(8000)
  })
  .strict();
export type KrBattleSimRequest = z.infer<typeof KrBattleSimRequest>;

export const KrBattleEvent = z
  .object({
    t: z.number().int().nonnegative(),
    kind: z.enum(["hit", "death", "end", "status_apply", "status_tick", "ability"]),
    src: z.string().min(1).optional(),
    dst: z.string().min(1).optional(),
    dmg: z.number().int().min(0).optional(),
    crit: z.boolean().optional(),
    status: KrStatusApply.optional(),
    // for ability events
    abilityId: z.string().min(1).optional()
  })
  .strict();
export type KrBattleEvent = z.infer<typeof KrBattleEvent>;

export const KrBattleOutcome = z.enum(["a", "b", "draw"]);
export type KrBattleOutcome = z.infer<typeof KrBattleOutcome>;

export const KrBattleSimResult = z
  .object({
    v: z.literal(1),
    seed: KrBattleSeed,
    outcome: KrBattleOutcome,
    ticks: z.number().int().nonnegative(),
    // remaining HP snapshot
    remaining: z
      .object({
        a: z.record(z.string(), z.number().int().nonnegative()),
        b: z.record(z.string(), z.number().int().nonnegative())
      })
      .strict(),
    events: z.array(KrBattleEvent).max(5000)
  })
  .strict();
export type KrBattleSimResult = z.infer<typeof KrBattleSimResult>;

