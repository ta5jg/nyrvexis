import { z } from "zod";

export const NvOwnedUnit = z
  .object({
    archetype: z.string().min(1),
    level: z.number().int().min(0).max(200)
  })
  .strict();
export type NvOwnedUnit = z.infer<typeof NvOwnedUnit>;

export const NvOwnedUnitsResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    owned: z.array(NvOwnedUnit)
  })
  .strict();
export type NvOwnedUnitsResponse = z.infer<typeof NvOwnedUnitsResponse>;

export const NvUpgradeUnitRequest = z
  .object({
    v: z.literal(1),
    archetype: z.string().min(1)
  })
  .strict();
export type NvUpgradeUnitRequest = z.infer<typeof NvUpgradeUnitRequest>;

export const NvUpgradeUnitResponse = z
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
export type NvUpgradeUnitResponse = z.infer<typeof NvUpgradeUnitResponse>;

