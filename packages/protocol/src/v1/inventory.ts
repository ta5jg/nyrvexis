import { z } from "zod";
import { NvUserId } from "./account.js";

export const NvCurrency = z
  .object({
    gold: z.number().int().nonnegative(),
    shards: z.number().int().nonnegative(),
    keys: z.number().int().nonnegative()
  })
  .strict();
export type NvCurrency = z.infer<typeof NvCurrency>;

export const NvInventory = z
  .object({
    v: z.literal(1),
    userId: NvUserId,
    currency: NvCurrency
  })
  .strict();
export type NvInventory = z.infer<typeof NvInventory>;

export const NvInventoryResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    inventory: NvInventory
  })
  .strict();
export type NvInventoryResponse = z.infer<typeof NvInventoryResponse>;

export const NvDailyClaimResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    dateUtc: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    claimed: z.boolean(),
    // if claimed just now, includes delta
    delta: NvCurrency.optional(),
    inventory: NvInventory
  })
  .strict();
export type NvDailyClaimResponse = z.infer<typeof NvDailyClaimResponse>;

