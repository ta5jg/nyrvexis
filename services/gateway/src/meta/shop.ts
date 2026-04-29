import type { LoadedContent } from "../content/loader.js";
import { seedToU32, XorShift32 } from "../sim/rng.js";

export type DailyOffer = {
  offerId: string;
  archetype: string;
  priceGold: number;
  qty: number;
};

export function makeDailyOffers(input: {
  dateUtc: string;
  content: LoadedContent;
  userId?: string;
}): DailyOffer[] {
  // Deterministic rotation based on date + optional userId (personalized but stable)
  const seed = `shop:${input.dateUtc}:${input.userId ?? "global"}`;
  const rng = new XorShift32(seedToU32(seed));

  const ids = input.content.catalog.units.map((u) => u.id);
  const picks: string[] = [];
  while (picks.length < Math.min(3, ids.length)) {
    const id = ids[rng.nextInt(0, ids.length - 1)]!;
    if (!picks.includes(id)) picks.push(id);
  }

  return picks.map((archetype, idx) => ({
    offerId: `d${input.dateUtc.replace(/-/g, "")}_${idx}_${archetype}`,
    archetype,
    priceGold: 100 + idx * 50,
    qty: 1
  }));
}

export function upgradeCost(level: number): { gold: number; shards: number } {
  // v0 curve: fast early, then ramps
  const next = Math.max(0, level + 1);
  const gold = 150 + next * 75;
  const shards = 5 + Math.floor(next / 2) * 3;
  return { gold, shards };
}

