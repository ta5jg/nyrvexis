/* =============================================================================
 * File:           services/gateway/src/meta/metaHandlers.ts
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

import type { KrCosmeticDef, KrEconomyTuning, KrMetaContent, KrQuestDef, KrQuestReward } from "@kindrail/protocol";
import { addUtcDays, daysBetweenUtc, weekKeyFromDateUtc } from "../time.js";
import type { MetaBpRow, MetaQuestRow, MetaStreakRow, StoreState } from "../store/store.js";

export function effectiveEconomy(meta: KrMetaContent, override: Partial<KrEconomyTuning>): KrEconomyTuning {
  return { ...meta.economyDefaults, ...override };
}

function mqKey(userId: string, questId: string, periodKey: string): string {
  return `mq:${userId}:${questId}:${periodKey}`;
}

function questPeriodKey(q: KrQuestDef, dateUtc: string, weekKey: string): string {
  return q.scope === "daily" ? `d:${dateUtc}` : weekKey;
}

function ensureStreak(s: StoreState, userId: string): MetaStreakRow {
  const row = (s.metaStreak[userId] ??= {
    current: 0,
    best: 0,
    lastActiveDateUtc: "1970-01-01",
    catchUpTokens: 0
  });
  return row;
}

function ensureBp(s: StoreState, userId: string, seasonId: string): MetaBpRow {
  const k = `${userId}:${seasonId}`;
  return (s.metaBp[k] ??= { xp: 0, claimedFree: [], hasPremium: false });
}

export function touchStreak(s: StoreState, userId: string, todayUtc: string): void {
  const row = ensureStreak(s, userId);
  if (row.lastActiveDateUtc === todayUtc) return;

  const prev = row.lastActiveDateUtc;
  const y = addUtcDays(todayUtc, -1);
  let nextCurrent = 1;
  if (prev === y) {
    nextCurrent = Math.max(1, (row.current | 0) + 1);
  } else if (daysBetweenUtc(prev, todayUtc) === 2 && (row.catchUpTokens | 0) > 0) {
    row.catchUpTokens = (row.catchUpTokens - 1) | 0;
    nextCurrent = Math.max(1, (row.current | 0) + 1);
  } else if (prev === "1970-01-01") {
    nextCurrent = 1;
  } else {
    nextCurrent = 1;
  }

  row.current = nextCurrent;
  row.lastActiveDateUtc = todayUtc;
  row.best = Math.max(row.best | 0, row.current);
}

export function grantBattlePassXp(
  s: StoreState,
  userId: string,
  dateUtc: string,
  seasonId: string,
  amount: number,
  dailyCap: number
): void {
  if (amount <= 0) return;
  const dayKey = `${userId}:${dateUtc}`;
  const used = s.metaBpDayXp[dayKey] ?? 0;
  const room = Math.max(0, dailyCap - used);
  const add = Math.min(amount, room);
  if (add <= 0) return;
  s.metaBpDayXp[dayKey] = used + add;
  const bp = ensureBp(s, userId, seasonId);
  bp.xp = (bp.xp + add) | 0;
}

function bumpQuestTrack(
  s: StoreState,
  userId: string,
  dateUtc: string,
  weekKey: string,
  track: KrQuestDef["track"],
  delta: number,
  defs: KrQuestDef[]
): void {
  for (const q of defs) {
    if (q.track !== track) continue;
    const pk = questPeriodKey(q, dateUtc, weekKey);
    const key = mqKey(userId, q.id, pk);
    const row: MetaQuestRow = (s.metaQuests[key] ??= { progress: 0 });
    if (row.claimedAtMs) continue;
    row.progress = Math.min(q.target, (row.progress | 0) + delta);
  }
}

export function onDailyClaimSuccess(
  s: StoreState,
  meta: KrMetaContent,
  econ: KrEconomyTuning,
  userId: string,
  dateUtc: string
): void {
  const wk = weekKeyFromDateUtc(dateUtc);
  touchStreak(s, userId, dateUtc);
  bumpQuestTrack(s, userId, dateUtc, wk, "daily_claim", 1, meta.quests);
  grantBattlePassXp(s, userId, dateUtc, meta.seasonId, econ.battlePassXpPerDailyClaim, econ.battlePassXpDailyCap);
}

export function onLeaderboardSubmit(
  s: StoreState,
  meta: KrMetaContent,
  econ: KrEconomyTuning,
  userId: string,
  dateUtc: string,
  grantBpFromSubmit: boolean
): void {
  const wk = weekKeyFromDateUtc(dateUtc);
  touchStreak(s, userId, dateUtc);
  bumpQuestTrack(s, userId, dateUtc, wk, "leaderboard_submit", 1, meta.quests);
  if (grantBpFromSubmit) {
    grantBattlePassXp(s, userId, dateUtc, meta.seasonId, econ.battlePassXpPerLeaderboard, econ.battlePassXpDailyCap);
  }
}

export function onShopBuy(s: StoreState, meta: KrMetaContent, userId: string, dateUtc: string): void {
  const wk = weekKeyFromDateUtc(dateUtc);
  bumpQuestTrack(s, userId, dateUtc, wk, "shop_buy", 1, meta.quests);
}

function grantCosmetic(s: StoreState, userId: string, cosmeticId: string | undefined, defs: KrCosmeticDef[]): void {
  if (!cosmeticId) return;
  if (!defs.some((d) => d.id === cosmeticId)) return;
  const bag = (s.cosmeticOwned[userId] ??= {});
  bag[cosmeticId] = true;
}

function applyRewardToInventory(s: StoreState, userId: string, r: KrQuestReward, defs: KrCosmeticDef[]): void {
  const inv = s.inventory[userId];
  if (!inv) return;
  inv.gold = (inv.gold + (r.gold | 0)) | 0;
  inv.shards = (inv.shards + (r.shards | 0)) | 0;
  inv.keys = (inv.keys + (r.keys | 0)) | 0;
  inv.updatedAtMs = Date.now();
  if ((r.catchUpTokens | 0) > 0) {
    const st = ensureStreak(s, userId);
    st.catchUpTokens = (st.catchUpTokens + r.catchUpTokens) | 0;
  }
  grantCosmetic(s, userId, r.cosmeticId, defs);
}

export function tryConsumeIdempotency(s: StoreState, key: string): boolean {
  if (s.idempotencyKeys[key]) return false;
  s.idempotencyKeys[key] = Date.now();
  return true;
}

export function claimQuestReward(
  s: StoreState,
  meta: KrMetaContent,
  userId: string,
  dateUtc: string,
  questId: string,
  idempotencyKey?: string
): { ok: true; granted: KrQuestReward } | { ok: false; error: string } {
  const wk = weekKeyFromDateUtc(dateUtc);
  const q = meta.quests.find((x) => x.id === questId);
  if (!q) return { ok: false, error: "NOT_FOUND" };
  const pk = questPeriodKey(q, dateUtc, wk);
  const key = mqKey(userId, questId, pk);
  const row = s.metaQuests[key];
  if (!row || (row.progress | 0) < q.target) return { ok: false, error: "INCOMPLETE" };
  if (row.claimedAtMs) return { ok: false, error: "CLAIMED" };
  if (idempotencyKey) {
    const ik = `idem:qclaim:${userId}:${idempotencyKey}`;
    if (!tryConsumeIdempotency(s, ik)) return { ok: false, error: "IDEMPOTENT" };
  }

  applyRewardToInventory(s, userId, q.reward, meta.cosmetics);
  if ((q.reward.battlePassXp | 0) > 0) {
    const bp = ensureBp(s, userId, meta.seasonId);
    bp.xp = (bp.xp + q.reward.battlePassXp) | 0;
  }
  row.claimedAtMs = Date.now();
  return { ok: true, granted: q.reward };
}

export function claimBattlePassTier(
  s: StoreState,
  meta: KrMetaContent,
  userId: string,
  _dateUtc: string,
  tier: number,
  track: "free" | "premium",
  idempotencyKey?: string
): { ok: true; granted: KrQuestReward } | { ok: false; error: string } {
  const def = meta.battlePassTiers.find((t) => t.tier === tier);
  if (!def) return { ok: false, error: "NOT_FOUND" };
  const bp = ensureBp(s, userId, meta.seasonId);
  if ((bp.xp | 0) < def.xpCumulative) return { ok: false, error: "INSUFFICIENT_XP" };
  if (track === "premium") {
    if (!bp.hasPremium) return { ok: false, error: "NO_PREMIUM" };
    const claimed = bp.claimedPremium ?? [];
    if (claimed.includes(tier)) return { ok: false, error: "CLAIMED" };
    const prem = def.premiumReward;
    if (!prem) return { ok: false, error: "NO_PREMIUM_REWARD" };
    if (idempotencyKey) {
      const ik = `idem:bp:${userId}:${idempotencyKey}`;
      if (!tryConsumeIdempotency(s, ik)) return { ok: false, error: "IDEMPOTENT" };
    }
    applyRewardToInventory(s, userId, prem, meta.cosmetics);
    bp.claimedPremium = [...claimed, tier];
    return { ok: true, granted: prem };
  }
  if (bp.claimedFree.includes(tier)) return { ok: false, error: "CLAIMED" };
  if (idempotencyKey) {
    const ik = `idem:bp:${userId}:${idempotencyKey}`;
    if (!tryConsumeIdempotency(s, ik)) return { ok: false, error: "IDEMPOTENT" };
  }
  applyRewardToInventory(s, userId, def.freeReward, meta.cosmetics);
  bp.claimedFree = [...bp.claimedFree, tier];
  return { ok: true, granted: def.freeReward };
}

export function setUserBattlePassPremium(s: StoreState, userId: string, seasonId: string, hasPremium: boolean): void {
  const bp = ensureBp(s, userId, seasonId);
  bp.hasPremium = hasPremium;
}

export function buildMetaProgressView(
  s: StoreState,
  meta: KrMetaContent,
  econ: KrEconomyTuning,
  userId: string,
  dateUtc: string
) {
  const weekKey = weekKeyFromDateUtc(dateUtc);
  const streak = ensureStreak(s, userId);
  const bp = ensureBp(s, userId, meta.seasonId);

  const quests = meta.quests.map((q) => {
    const pk = questPeriodKey(q, dateUtc, weekKey);
    const key = mqKey(userId, q.id, pk);
    const row = s.metaQuests[key] ?? { progress: 0 };
    const progress = row.progress | 0;
    const complete = progress >= q.target;
    const claimed = Boolean(row.claimedAtMs);
    return {
      id: q.id,
      scope: q.scope,
      title: q.title,
      target: q.target,
      progress,
      complete,
      claimed,
      reward: q.reward
    };
  });

  return {
    v: 1 as const,
    ok: true as const,
    dateUtc,
    weekPeriodKey: weekKey,
    economy: econ,
    quests,
    streak: {
      current: streak.current | 0,
      best: streak.best | 0,
      lastActiveDateUtc: streak.lastActiveDateUtc,
      catchUpTokens: streak.catchUpTokens | 0
    },
    battlePass: {
      seasonId: meta.seasonId,
      xp: bp.xp | 0,
      claimedFreeTiers: [...(bp.claimedFree ?? [])],
      claimedPremiumTiers: [...(bp.claimedPremium ?? [])],
      hasPremium: Boolean(bp.hasPremium),
      tiers: meta.battlePassTiers
    }
  };
}
