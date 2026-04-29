import { z } from "zod";
import { KrContentVersion } from "./content.js";

export const KrShopOffer = z
  .object({
    offerId: z.string().min(1),
    archetype: z.string().min(1),
    priceGold: z.number().int().min(0),
    // for future: rarity, limited, etc.
    qty: z.number().int().min(1).default(1)
  })
  .strict();
export type KrShopOffer = z.infer<typeof KrShopOffer>;

export const KrDailyShopResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    dateUtc: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    contentVersion: KrContentVersion,
    offers: z.array(KrShopOffer).min(1).max(12)
  })
  .strict();
export type KrDailyShopResponse = z.infer<typeof KrDailyShopResponse>;

export const KrShopBuyRequest = z
  .object({
    v: z.literal(1),
    offerId: z.string().min(1)
  })
  .strict();
export type KrShopBuyRequest = z.infer<typeof KrShopBuyRequest>;

export const KrShopBuyResponse = z
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
export type KrShopBuyResponse = z.infer<typeof KrShopBuyResponse>;

