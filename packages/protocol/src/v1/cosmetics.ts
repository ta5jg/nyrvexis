/* =============================================================================
 * Kosmetik MVP (R3.M2): sunucu doğrulamalı sahiplik + slot equip (P2W yok).
 * ============================================================================= */

import { z } from "zod";

export const NvCosmeticSlot = z.enum(["frame", "arena", "title", "hub"]);
export type NvCosmeticSlot = z.infer<typeof NvCosmeticSlot>;

export const NvCosmeticDef = z
  .object({
    id: z.string().min(1).max(80),
    title: z.string().min(1).max(120),
    slot: NvCosmeticSlot,
    /** Companion `iconRegistry` anahtarı (hub ve diğer kozmetikler için opsiyonel). */
    iconId: z.string().min(1).max(80).optional()
  })
  .strict();
export type NvCosmeticDef = z.infer<typeof NvCosmeticDef>;

export const NvCosmeticsCatalogResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    cosmetics: z.array(NvCosmeticDef).max(128)
  })
  .strict();
export type NvCosmeticsCatalogResponse = z.infer<typeof NvCosmeticsCatalogResponse>;

export const NvCosmeticsMeResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    owned: z.array(z.string().min(1)).max(256),
    /** slot → cosmeticId */
    equipped: z.record(z.string().min(1).max(32), z.string().min(1).max(80))
  })
  .strict();
export type NvCosmeticsMeResponse = z.infer<typeof NvCosmeticsMeResponse>;

export const NvCosmeticsEquipRequest = z
  .object({
    v: z.literal(1),
    slot: NvCosmeticSlot,
    cosmeticId: z.string().min(1).max(80)
  })
  .strict();
export type NvCosmeticsEquipRequest = z.infer<typeof NvCosmeticsEquipRequest>;

export const NvCosmeticsEquipResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    equipped: z.record(z.string().min(1).max(32), z.string().min(1).max(80))
  })
  .strict();
export type NvCosmeticsEquipResponse = z.infer<typeof NvCosmeticsEquipResponse>;
