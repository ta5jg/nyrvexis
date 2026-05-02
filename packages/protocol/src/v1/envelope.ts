import { z } from "zod";

/**
 * SSOT transport envelope.
 * - Designed for: Unity client ↔ gateway ↔ ecosystem services
 * - Deterministic: use strings/ints only; avoid floats where possible.
 */
export const NvV1Meta = z
  .object({
    traceId: z.string().min(8),
    tsMs: z.number().int().nonnegative(),
    clientVersion: z.string().min(1).optional()
  })
  .strict();
export type NvV1Meta = z.infer<typeof NvV1Meta>;

export const NvV1Envelope = z
  .object({
    v: z.literal(1),
    kind: z.string().min(1),
    meta: NvV1Meta,
    payload: z.unknown()
  })
  .strict();
export type NvV1Envelope = z.infer<typeof NvV1Envelope>;

