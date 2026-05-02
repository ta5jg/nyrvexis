/* =============================================================================
 * File:           packages/protocol/src/v1/event.ts
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

const IsoUtc = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

export const NvEventDef = z
  .object({
    v: z.literal(1),
    eventId: z.string().min(1).max(64),
    title: z.string().min(1).max(80),
    startsAtUtc: IsoUtc,
    endsAtUtc: IsoUtc,
    /** Optional feature-flag name to gate UI behavior. */
    flag: z.string().min(1).max(80).optional()
  })
  .strict();
export type NvEventDef = z.infer<typeof NvEventDef>;

export const NvEventViewResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    /** Current active event (server decides by time window). */
    event: NvEventDef.optional()
  })
  .strict();
export type NvEventViewResponse = z.infer<typeof NvEventViewResponse>;

