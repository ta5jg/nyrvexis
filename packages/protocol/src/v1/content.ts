import { z } from "zod";

export const KrContentVersion = z.string().min(1);
export type KrContentVersion = z.infer<typeof KrContentVersion>;

export const KrUnitRole = z.enum(["tank", "dps", "support", "control"]);
export type KrUnitRole = z.infer<typeof KrUnitRole>;

export const KrUnitArchetypeDef = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    role: KrUnitRole,
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
export type KrUnitArchetypeDef = z.infer<typeof KrUnitArchetypeDef>;

export const KrUnitCatalog = z
  .object({
    v: z.literal(1),
    contentVersion: KrContentVersion,
    units: z.array(KrUnitArchetypeDef).min(1)
  })
  .strict();
export type KrUnitCatalog = z.infer<typeof KrUnitCatalog>;

export const KrCatalogResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    catalog: KrUnitCatalog
  })
  .strict();
export type KrCatalogResponse = z.infer<typeof KrCatalogResponse>;

