import { z } from "zod";

export const NvPushWebVapidResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    enabled: z.boolean(),
    publicKey: z.string().min(1).optional()
  })
  .strict();
export type NvPushWebVapidResponse = z.infer<typeof NvPushWebVapidResponse>;

export const NvPushWebSubscription = z
  .object({
    endpoint: z.string().url().min(10),
    keys: z
      .object({
        p256dh: z.string().min(1),
        auth: z.string().min(1)
      })
      .strict()
  })
  .strict();
export type NvPushWebSubscription = z.infer<typeof NvPushWebSubscription>;

export const NvPushWebSubscribeRequest = z
  .object({
    v: z.literal(1),
    subscription: NvPushWebSubscription
  })
  .strict();
export type NvPushWebSubscribeRequest = z.infer<typeof NvPushWebSubscribeRequest>;

export const NvPushWebSubscribeResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    subscriptionId: z.string().min(1)
  })
  .strict();
export type NvPushWebSubscribeResponse = z.infer<typeof NvPushWebSubscribeResponse>;

export const NvPushWebUnsubscribeRequest = z
  .object({
    v: z.literal(1),
    endpoint: z.string().min(10)
  })
  .strict();
export type NvPushWebUnsubscribeRequest = z.infer<typeof NvPushWebUnsubscribeRequest>;

export const NvPushWebUnsubscribeResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    removed: z.boolean()
  })
  .strict();
export type NvPushWebUnsubscribeResponse = z.infer<typeof NvPushWebUnsubscribeResponse>;
