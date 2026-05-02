import { z } from "zod";

export const NvErrorResponse = z
  .object({
    ok: z.literal(false),
    error: z.string().min(1)
  })
  .strict();

export type NvErrorResponse = z.infer<typeof NvErrorResponse>;

