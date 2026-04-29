import { z } from "zod";

export const KrOwnedUnit = z
  .object({
    archetype: z.string().min(1),
    level: z.number().int().min(0).max(200)
  })
  .strict();
export type KrOwnedUnit = z.infer<typeof KrOwnedUnit>;

export const KrOwnedUnitsResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    owned: z.array(KrOwnedUnit)
  })
  .strict();
export type KrOwnedUnitsResponse = z.infer<typeof KrOwnedUnitsResponse>;

export const KrUpgradeUnitRequest = z
  .object({
    v: z.literal(1),
    archetype: z.string().min(1)
  })
  .strict();
export type KrUpgradeUnitRequest = z.infer<typeof KrUpgradeUnitRequest>;

export const KrUpgradeUnitResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    archetype: z.string().min(1),
    level: z.number().int().min(0),
    // balances after upgrade
    gold: z.number().int().nonnegative(),
    shards: z.number().int().nonnegative(),
    keys: z.number().int().nonnegative()
  })
  .strict();
export type KrUpgradeUnitResponse = z.infer<typeof KrUpgradeUnitResponse>;

