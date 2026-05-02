import { z } from "zod";
import { NvContentVersion } from "./content.js";

export const NvShopOffer = z
  .object({
    offerId: z.string().min(1),
    archetype: z.string().min(1),
    priceGold: z.number().int().min(0),
    // for future: rarity, limited, etc.
    qty: z.number().int().min(1).default(1)
  })
  .strict();
export type NvShopOffer = z.infer<typeof NvShopOffer>;

export const NvDailyShopResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    dateUtc: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    contentVersion: NvContentVersion,
    offers: z.array(NvShopOffer).min(1).max(12)
  })
  .strict();
export type NvDailyShopResponse = z.infer<typeof NvDailyShopResponse>;

export const NvShopBuyRequest = z
  .object({
    v: z.literal(1),
    offerId: z.string().min(1)
  })
  .strict();
export type NvShopBuyRequest = z.infer<typeof NvShopBuyRequest>;

export const NvShopBuyResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    offerId: z.string().min(1),
    // updated balances
    gold: z.number().int().nonnegative(),
    shards: z.number().int().nonnegative(),
    keys: z.number().int().nonnegative(),
    // owned units summary
    owned: z.record(z.string(), z.number().int().min(0)) // archetype -> level
  })
  .strict();
export type NvShopBuyResponse = z.infer<typeof NvShopBuyResponse>;

