/* =============================================================================
 * File:           apps/companion-web/src/ui/visual/artDirection.ts
 * Author:         USDTG GROUP TECHNOLOGY LLC
 * Developer:      Irfan Gedik
 * Created Date:   2026-05-01
 * Last Update:    2026-05-01
 * Version:        1.0.0
 *
 * Description:
 *   Presentation SSOT — palette + theme id (sync role hex with :root in styles.css).
 *
 * License:
 *   Proprietary. All rights reserved. See LICENSE in the repository root.
 * ============================================================================= */

export const KINDRAIL_ART = {
  id: "nyrvexa_twilight_v1",
  accent: "#7c5cff",
  good: "#35d07f",
  bad: "#ff5c7c",
  critGold: "#ffd740",
  roles: {
    tank: "#35d07f",
    dps: "#ff5c7c",
    support: "#7c5cff",
    control: "#56c2ff"
  },
  teamTintA: "rgba(124, 92, 255, 0.12)",
  teamTintB: "rgba(53, 208, 127, 0.10)"
} as const;

export type KindrailRoleKey = keyof typeof KINDRAIL_ART.roles;

export function roleStroke(role: string): string {
  const k = role as KindrailRoleKey;
  return KINDRAIL_ART.roles[k] ?? KINDRAIL_ART.roles.control;
}
