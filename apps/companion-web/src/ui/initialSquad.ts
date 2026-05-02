import type { NvBattleSimRequest } from "@nyrvexis/protocol";
import { decodeJsonFromUrlParam } from "./share";

const MAP_SLOTS = [0, 1, 6, 7] as const;

/** Default + optional restore from `?q=` share link or compact `?squad=` (front L,R then back L,R archetype ids). */
export function readInitialSquadFromUrl(): Array<string | null> {
  const fallback: Array<string | null> = ["soldier", "archer", null, null];
  try {
    const url = new URL(window.location.href);
    const q = url.searchParams.get("q");
    if (q) {
      const req = decodeJsonFromUrlParam<NvBattleSimRequest>(q);
      const slots: Array<string | null> = [null, null, null, null];
      for (const u of req.a.units) {
        const slot = (u.slot ?? 0) | 0;
        const idx = MAP_SLOTS.indexOf(slot as (typeof MAP_SLOTS)[number]);
        if (idx >= 0) slots[idx] = u.archetype;
      }
      if (slots.every((s) => !s)) return fallback;
      return slots;
    }

    const squad = url.searchParams.get("squad")?.trim();
    if (squad && squad.length > 0) {
      const parts = squad.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
      const slots: Array<string | null> = [null, null, null, null];
      for (let i = 0; i < Math.min(parts.length, MAP_SLOTS.length); i++) {
        slots[i] = parts[i]!;
      }
      if (slots.every((s) => !s)) return fallback;
      return slots;
    }

    return fallback;
  } catch {
    return fallback;
  }
}
