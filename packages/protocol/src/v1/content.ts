import { z } from "zod";

export const NvContentVersion = z.string().min(1);
export type NvContentVersion = z.infer<typeof NvContentVersion>;

export const NvUnitRole = z.enum(["tank", "dps", "support", "control"]);
export type NvUnitRole = z.infer<typeof NvUnitRole>;

export const NvUnitFaction = z.enum(["vanguard", "marauder", "arcane", "ranger", "order"]);
export type NvUnitFaction = z.infer<typeof NvUnitFaction>;

export const NvStatBonus = z
  .object({
    hpFlat: z.number().int().optional(),
    atkFlat: z.number().int().optional(),
    defFlat: z.number().int().optional(),
    spdFlat: z.number().int().optional()
  })
  .strict();
export type NvStatBonus = z.infer<typeof NvStatBonus>;

export const NvSynergyRule = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    requireRole: NvUnitRole.optional(),
    requireFaction: NvUnitFaction.optional(),
    minCount: z.number().int().min(1).max(12),
    bonus: NvStatBonus
  })
  .strict()
  .refine(
    (s) => Boolean(s.requireRole) !== Boolean(s.requireFaction),
    { message: "Synergy must specify exactly one of requireRole or requireFaction" }
  );
export type NvSynergyRule = z.infer<typeof NvSynergyRule>;

export const NvAugmentDef = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    iconId: z.string().optional(),
    rarity: z.enum(["common", "rare", "epic"]).optional(),
    uiHint: z.string().optional(),
    bonus: NvStatBonus
  })
  .strict();
export type NvAugmentDef = z.infer<typeof NvAugmentDef>;

export const NvUnitArchetypeDef = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    role: NvUnitRole,
    faction: NvUnitFaction.optional(),
    iconId: z.string().optional(),
    fxProfileId: z.string().optional(),
    base: z
      .object({
        hp: z.number().int().min(1),
        atk: z.number().int().min(0),
        def: z.number().int().min(0),
        spd: z.number().int().min(1)
      })
      .strict()
  })
  .strict();
export type NvUnitArchetypeDef = z.infer<typeof NvUnitArchetypeDef>;

export const NvUnitCatalog = z
  .object({
    v: z.literal(1),
    contentVersion: NvContentVersion,
    units: z.array(NvUnitArchetypeDef).min(1),
    synergies: z.array(NvSynergyRule).optional(),
    augments: z.array(NvAugmentDef).optional()
  })
  .strict();
export type NvUnitCatalog = z.infer<typeof NvUnitCatalog>;

export const NvCatalogResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    catalog: NvUnitCatalog
  })
  .strict();
export type NvCatalogResponse = z.infer<typeof NvCatalogResponse>;
