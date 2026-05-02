import { z } from "zod";

export const NvContentVersion = z.string().min(1);
export type NvContentVersion = z.infer<typeof NvContentVersion>;

export const NvUnitRole = z.enum(["tank", "dps", "support", "control"]);
export type NvUnitRole = z.infer<typeof NvUnitRole>;

export const NvUnitArchetypeDef = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    role: NvUnitRole,
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
    units: z.array(NvUnitArchetypeDef).min(1)
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

