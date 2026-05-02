import { z } from "zod";

export const NvOfferId = z.string().min(1);
export type NvOfferId = z.infer<typeof NvOfferId>;

export const NvOffer = z
  .object({
    offerId: NvOfferId,
    name: z.string().min(1),
    // display-only; server still enforces grants
    priceCents: z.number().int().min(0),
    currency: z.string().min(1),
    grants: z
      .object({
        gold: z.number().int().nonnegative(),
        shards: z.number().int().nonnegative(),
        keys: z.number().int().nonnegative()
      })
      .strict()
  })
  .strict();
export type NvOffer = z.infer<typeof NvOffer>;

export const NvOffersResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    offers: z.array(NvOffer).min(1)
  })
  .strict();
export type NvOffersResponse = z.infer<typeof NvOffersResponse>;

export const NvCheckoutCreateRequest = z
  .object({
    v: z.literal(1),
    offerId: NvOfferId
  })
  .strict();
export type NvCheckoutCreateRequest = z.infer<typeof NvCheckoutCreateRequest>;

export const NvCheckoutCreateResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    // for Stripe Checkout, this is the URL to redirect to
    url: z.string().url(),
    provider: z.enum(["stripe", "devstub"])
  })
  .strict();
export type NvCheckoutCreateResponse = z.infer<typeof NvCheckoutCreateResponse>;

export const NvPurchaseStatusResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    // last processed purchase (optional)
    lastPurchaseId: z.string().min(1).optional()
  })
  .strict();
export type NvPurchaseStatusResponse = z.infer<typeof NvPurchaseStatusResponse>;

/** R7 — mağaza satın alındıktan sonra sunucuda doğrulama (Premium Battle Pass açma). */
export const NvIapPlatform = z.enum(["ios", "android"]);
export type NvIapPlatform = z.infer<typeof NvIapPlatform>;

export const NvBattlePassIapVerifyRequest = z
  .object({
    v: z.literal(1),
    platform: NvIapPlatform,
    /** App Store veya Play Console‘daki ürün kimliği (gateway env ile eşleşmeli). */
    productId: z.string().min(1).max(120),
    /**
     * iOS: App Receipt (base64) veya `verifyReceipt` gövdesi için kullanılan payload.
     * Android: satın alma `purchaseToken`.
     */
    receipt: z.string().min(4).max(500_000)
  })
  .strict();
export type NvBattlePassIapVerifyRequest = z.infer<typeof NvBattlePassIapVerifyRequest>;

export const NvBattlePassIapVerifyResponseOk = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    premium: z.literal(true),
    seasonId: z.string().min(1)
  })
  .strict();
export type NvBattlePassIapVerifyResponseOk = z.infer<typeof NvBattlePassIapVerifyResponseOk>;

