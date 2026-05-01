/* =============================================================================
 * File:           packages/protocol/src/v1/analytics.ts
 * Author:         USDTG GROUP TECHNOLOGY LLC
 * Developer:      Irfan Gedik
 * Created Date:   2026-04-30
 * Last Update:    2026-04-30
 * Version:        0.3.0
 *
 * Description:
 *   
 *
 * License:
 *   Proprietary. All rights reserved. See LICENSE in the repository root.
 * ============================================================================= */

import { z } from "zod";

export const KrAnalyticsEventRequest = z
  .object({
    v: z.literal(1),
    name: z.string().min(1).max(128),
    props: z.record(z.string(), z.unknown()).optional()
  })
  .strict();

export type KrAnalyticsEventRequest = z.infer<typeof KrAnalyticsEventRequest>;

export const KrAnalyticsEventResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true)
  })
  .strict();

export type KrAnalyticsEventResponse = z.infer<typeof KrAnalyticsEventResponse>;
