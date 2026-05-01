/* =============================================================================
 * File:           services/gateway/src/time.ts
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

export function utcDate(d = new Date()): string {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function addUtcDays(dateUtc: string, deltaDays: number): string {
  const [y, m, d] = dateUtc.split("-").map(Number);
  const t = Date.UTC(y, m - 1, d) + deltaDays * 86_400_000;
  return utcDate(new Date(t));
}

export function daysBetweenUtc(a: string, b: string): number {
  const [y1, m1, d1] = a.split("-").map(Number);
  const [y2, m2, d2] = b.split("-").map(Number);
  const ta = Date.UTC(y1, m1 - 1, d1);
  const tb = Date.UTC(y2, m2 - 1, d2);
  return Math.round((tb - ta) / 86_400_000);
}

export function weekKeyFromDateUtc(dateUtc: string): string {
  const [y, m, d] = dateUtc.split("-").map(Number);
  const t = Date.UTC(y, m - 1, d);
  const start = Date.UTC(y, 0, 1);
  const dayIdx = Math.floor((t - start) / 86_400_000);
  const w = Math.floor(dayIdx / 7);
  return `w:${y}-${String(w).padStart(2, "0")}`;
}
