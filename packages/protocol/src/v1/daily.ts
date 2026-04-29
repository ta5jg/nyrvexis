import { z } from "zod";

export const KrDailySeedResponse = z
  .object({
    ok: z.literal(true),
    // YYYY-MM-DD in UTC
    dateUtc: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    seed: z.string().min(1)
  })
  .strict();

export type KrDailySeedResponse = z.infer<typeof KrDailySeedResponse>;

