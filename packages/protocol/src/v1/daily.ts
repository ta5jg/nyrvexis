import { z } from "zod";

export const NvDailySeedResponse = z
  .object({
    ok: z.literal(true),
    // YYYY-MM-DD in UTC
    dateUtc: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    seed: z.string().min(1)
  })
  .strict();

export type NvDailySeedResponse = z.infer<typeof NvDailySeedResponse>;

