import { z } from "zod";

/** 4×4 placement grid; cosmetic slot `hub` pieces only (server-validated). */
export const KR_HUB_CELL_IDS = [
  "c0",
  "c1",
  "c2",
  "c3",
  "c4",
  "c5",
  "c6",
  "c7",
  "c8",
  "c9",
  "c10",
  "c11",
  "c12",
  "c13",
  "c14",
  "c15"
] as const;
export type NvHubCellId = (typeof KR_HUB_CELL_IDS)[number];

const HubCellId = z.enum(KR_HUB_CELL_IDS);

const CosmeticOrClear = z.union([z.string().min(1).max(80), z.null()]);

/** Full layout returned by GET /hub/layout — every cell key present. */
export const NvHubCellsMap = z.record(HubCellId, CosmeticOrClear);

export const NvHubLayoutResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    cells: NvHubCellsMap
  })
  .strict();
export type NvHubLayoutResponse = z.infer<typeof NvHubLayoutResponse>;

export const NvHubLayoutPutRequest = z
  .object({
    v: z.literal(1),
    placements: z
      .array(
        z
          .object({
            cellId: HubCellId,
            cosmeticId: CosmeticOrClear
          })
          .strict()
      )
      .max(32)
  })
  .strict();
export type NvHubLayoutPutRequest = z.infer<typeof NvHubLayoutPutRequest>;

/** Mint read-only planet preview link (snapshot). */
export const NvHubShareCreateRequest = z.object({ v: z.literal(1) }).strict();
export type NvHubShareCreateRequest = z.infer<typeof NvHubShareCreateRequest>;

export const NvHubShareCreateResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    ticketId: z.string().min(8),
    expiresAtMs: z.number().int().nonnegative()
  })
  .strict();
export type NvHubShareCreateResponse = z.infer<typeof NvHubShareCreateResponse>;

export const NvHubSharePublicCell = z
  .object({
    cosmeticId: CosmeticOrClear,
    title: z.union([z.string().min(1).max(120), z.null()]),
    iconId: z.union([z.string().min(1).max(80), z.null()])
  })
  .strict();

export const NvHubSharePublicCellsMap = z.record(HubCellId, NvHubSharePublicCell);

export const NvHubSharePublicResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    expiresAtMs: z.number().int().nonnegative(),
    cells: NvHubSharePublicCellsMap
  })
  .strict();
export type NvHubSharePublicResponse = z.infer<typeof NvHubSharePublicResponse>;
