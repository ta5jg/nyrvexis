/* =============================================================================
 * Kosmetik MVP (R3.M2): sunucu doğrulamalı sahiplik + slot equip (P2W yok).
 * ============================================================================= */

import { z } from "zod";

export const KrCosmeticSlot = z.enum(["frame", "arena", "title"]);
export type KrCosmeticSlot = z.infer<typeof KrCosmeticSlot>;

export const KrCosmeticDef = z
  .object({
    id: z.string().min(1).max(80),
    title: z.string().min(1).max(120),
    slot: KrCosmeticSlot
  })
  .strict();
export type KrCosmeticDef = z.infer<typeof KrCosmeticDef>;

export const KrCosmeticsCatalogResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    cosmetics: z.array(KrCosmeticDef).max(128)
  })
  .strict();
export type KrCosmeticsCatalogResponse = z.infer<typeof KrCosmeticsCatalogResponse>;

export const KrCosmeticsMeResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    owned: z.array(z.string().min(1)).max(256),
    /** slot → cosmeticId */
    equipped: z.record(z.string().min(1).max(32), z.string().min(1).max(80))
  })
  .strict();
export type KrCosmeticsMeResponse = z.infer<typeof KrCosmeticsMeResponse>;

export const KrCosmeticsEquipRequest = z
  .object({
    v: z.literal(1),
    slot: KrCosmeticSlot,
    cosmeticId: z.string().min(1).max(80)
  })
  .strict();
export type KrCosmeticsEquipRequest = z.infer<typeof KrCosmeticsEquipRequest>;

export const KrCosmeticsEquipResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    equipped: z.record(z.string().min(1).max(32), z.string().min(1).max(80))
  })
  .strict();
export type KrCosmeticsEquipResponse = z.infer<typeof KrCosmeticsEquipResponse>;
