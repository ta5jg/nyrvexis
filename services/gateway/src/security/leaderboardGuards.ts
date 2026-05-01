/* =============================================================================
 * File:           services/gateway/src/security/leaderboardGuards.ts
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

import type { KrBattleSimRequest } from "@kindrail/protocol";

export function expectedDailyLeaderboardSeed(dateUtc: string): string {
  return `daily:${dateUtc}`;
}

export function assertOfficialDailySeed(battleRequest: KrBattleSimRequest, dateUtc: string): void {
  if (battleRequest.seed.seed !== expectedDailyLeaderboardSeed(dateUtc)) {
    throw new Error("LEADERBOARD_SEED_MISMATCH");
  }
}
