import { z } from "zod";

export const KrOfferId = z.string().min(1);
export type KrOfferId = z.infer<typeof KrOfferId>;

export const KrOffer = z
  .object({
    offerId: KrOfferId,
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
export type KrOffer = z.infer<typeof KrOffer>;

export const KrOffersResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    offers: z.array(KrOffer).min(1)
  })
  .strict();
export type KrOffersResponse = z.infer<typeof KrOffersResponse>;

export const KrCheckoutCreateRequest = z
  .object({
    v: z.literal(1),
    offerId: KrOfferId
  })
  .strict();
export type KrCheckoutCreateRequest = z.infer<typeof KrCheckoutCreateRequest>;

export const KrCheckoutCreateResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    // for Stripe Checkout, this is the URL to redirect to
    url: z.string().url(),
    provider: z.enum(["stripe", "devstub"])
  })
  .strict();
export type KrCheckoutCreateResponse = z.infer<typeof KrCheckoutCreateResponse>;

export const KrPurchaseStatusResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    // last processed purchase (optional)
    lastPurchaseId: z.string().min(1).optional()
  })
  .strict();
export type KrPurchaseStatusResponse = z.infer<typeof KrPurchaseStatusResponse>;

/** R7 — mağaza satın alındıktan sonra sunucuda doğrulama (Premium Battle Pass açma). */
export const KrIapPlatform = z.enum(["ios", "android"]);
export type KrIapPlatform = z.infer<typeof KrIapPlatform>;

export const KrBattlePassIapVerifyRequest = z
  .object({
    v: z.literal(1),
    platform: KrIapPlatform,
    /** App Store veya Play Console‘daki ürün kimliği (gateway env ile eşleşmeli). */
    productId: z.string().min(1).max(120),
    /**
     * iOS: App Receipt (base64) veya `verifyReceipt` gövdesi için kullanılan payload.
     * Android: satın alma `purchaseToken`.
     */
    receipt: z.string().min(4).max(500_000)
  })
  .strict();
export type KrBattlePassIapVerifyRequest = z.infer<typeof KrBattlePassIapVerifyRequest>;

export const KrBattlePassIapVerifyResponseOk = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    premium: z.literal(true),
    seasonId: z.string().min(1)
  })
  .strict();
export type KrBattlePassIapVerifyResponseOk = z.infer<typeof KrBattlePassIapVerifyResponseOk>;

