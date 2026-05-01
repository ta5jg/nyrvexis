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
  /** Percent multiplier on gold prices (100 = default). */
  shopGoldMulPct?: number;
}): DailyOffer[] {
  const mulPct = input.shopGoldMulPct ?? 100;
  // Deterministic rotation based on date + optional userId (personalized but stable)
  const seed = `shop:${input.dateUtc}:${input.userId ?? "global"}`;
  const rng = new XorShift32(seedToU32(seed));

  const ids = input.content.catalog.units.map((u) => u.id);
  const picks: string[] = [];
  while (picks.length < Math.min(3, ids.length)) {
    const id = ids[rng.nextInt(0, ids.length - 1)]!;
    if (!picks.includes(id)) picks.push(id);
  }

  return picks.map((archetype, idx) => {
    const base = 100 + idx * 50;
    const priceGold = Math.max(1, Math.ceil((base * mulPct) / 100));
    return {
      offerId: `d${input.dateUtc.replace(/-/g, "")}_${idx}_${archetype}`,
      archetype,
      priceGold,
      qty: 1
    };
  });
}

export function upgradeCost(
  level: number,
  upgradeGoldMulPct = 100,
  upgradeShardMulPct = 100
): { gold: number; shards: number } {
  const next = Math.max(0, level + 1);
  const goldBase = 150 + next * 75;
  const shardsBase = 5 + Math.floor(next / 2) * 3;
  return {
    gold: Math.max(1, Math.ceil((goldBase * upgradeGoldMulPct) / 100)),
    shards: Math.max(1, Math.ceil((shardsBase * upgradeShardMulPct) / 100))
  };
}

