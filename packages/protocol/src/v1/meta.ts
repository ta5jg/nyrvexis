/* =============================================================================
 * File:           packages/protocol/src/v1/meta.ts
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
import { KrCosmeticDef } from "./cosmetics.js";
import { KrContentVersion } from "./content.js";

export const KrEconomyTuning = z
  .object({
    dailyClaimGold: z.number().int().min(0).default(120),
    dailyClaimShards: z.number().int().min(0).default(8),
    dailyClaimKeys: z.number().int().min(0).default(0),
    shopGoldMulPct: z.number().int().min(10).max(500).default(100),
    upgradeGoldMulPct: z.number().int().min(10).max(500).default(100),
    upgradeShardMulPct: z.number().int().min(10).max(500).default(100),
    battlePassXpPerDailyClaim: z.number().int().min(0).default(40),
    battlePassXpPerLeaderboard: z.number().int().min(0).default(35),
    battlePassXpDailyCap: z.number().int().min(0).default(500)
  })
  .strict();
export type KrEconomyTuning = z.infer<typeof KrEconomyTuning>;

export const KrQuestScope = z.enum(["daily", "weekly"]);
export type KrQuestScope = z.infer<typeof KrQuestScope>;

export const KrQuestTrack = z.enum(["daily_claim", "leaderboard_submit", "shop_buy"]);
export type KrQuestTrack = z.infer<typeof KrQuestTrack>;

export const KrQuestReward = z
  .object({
    gold: z.number().int().min(0).default(0),
    shards: z.number().int().min(0).default(0),
    keys: z.number().int().min(0).default(0),
    battlePassXp: z.number().int().min(0).default(0),
    catchUpTokens: z.number().int().min(0).default(0),
    /** Kozmetik ödülü — id `KrMetaContent.cosmetics` içinde tanımlı olmalı. */
    cosmeticId: z.string().min(1).max(80).optional()
  })
  .strict();
export type KrQuestReward = z.infer<typeof KrQuestReward>;

export const KrQuestDef = z
  .object({
    id: z.string().min(1),
    scope: KrQuestScope,
    title: z.string().min(1),
    target: z.number().int().min(1).max(999),
    track: KrQuestTrack,
    reward: KrQuestReward
  })
  .strict();
export type KrQuestDef = z.infer<typeof KrQuestDef>;

export const KrBattlePassTierDef = z
  .object({
    tier: z.number().int().min(1).max(999),
    xpCumulative: z.number().int().min(0),
    freeReward: KrQuestReward,
    premiumReward: KrQuestReward.optional()
  })
  .strict();
export type KrBattlePassTierDef = z.infer<typeof KrBattlePassTierDef>;

export const KrMetaContent = z
  .object({
    v: z.literal(1),
    contentVersion: KrContentVersion,
    seasonId: z.string().min(1),
    economyDefaults: KrEconomyTuning,
    quests: z.array(KrQuestDef).min(1).max(64),
    battlePassTiers: z.array(KrBattlePassTierDef).min(1).max(200),
    cosmetics: z.array(KrCosmeticDef).max(64).default([])
  })
  .strict();
export type KrMetaContent = z.infer<typeof KrMetaContent>;

export const KrQuestProgressView = z
  .object({
    id: z.string().min(1),
    scope: KrQuestScope,
    title: z.string().min(1),
    target: z.number().int(),
    progress: z.number().int().nonnegative(),
    complete: z.boolean(),
    claimed: z.boolean(),
    reward: KrQuestReward
  })
  .strict();
export type KrQuestProgressView = z.infer<typeof KrQuestProgressView>;

export const KrStreakView = z
  .object({
    current: z.number().int().nonnegative(),
    best: z.number().int().nonnegative(),
    lastActiveDateUtc: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    catchUpTokens: z.number().int().nonnegative()
  })
  .strict();
export type KrStreakView = z.infer<typeof KrStreakView>;

export const KrBattlePassView = z
  .object({
    seasonId: z.string().min(1),
    xp: z.number().int().nonnegative(),
    claimedFreeTiers: z.array(z.number().int().min(1)).max(200),
    claimedPremiumTiers: z.array(z.number().int().min(1)).max(200).default([]),
    hasPremium: z.boolean(),
    tiers: z.array(KrBattlePassTierDef).max(200)
  })
  .strict();
export type KrBattlePassView = z.infer<typeof KrBattlePassView>;

export const KrMetaProgressResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    dateUtc: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    weekPeriodKey: z.string().min(1),
    economy: KrEconomyTuning,
    quests: z.array(KrQuestProgressView).max(64),
    streak: KrStreakView,
    battlePass: KrBattlePassView
  })
  .strict();
export type KrMetaProgressResponse = z.infer<typeof KrMetaProgressResponse>;

export const KrMetaQuestClaimRequest = z
  .object({
    v: z.literal(1),
    questId: z.string().min(1),
    idempotencyKey: z.string().min(8).max(80).optional()
  })
  .strict();
export type KrMetaQuestClaimRequest = z.infer<typeof KrMetaQuestClaimRequest>;

export const KrMetaQuestClaimResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    questId: z.string().min(1),
    granted: KrQuestReward,
    inventory: z.object({ gold: z.number().int(), shards: z.number().int(), keys: z.number().int() }).strict()
  })
  .strict();
export type KrMetaQuestClaimResponse = z.infer<typeof KrMetaQuestClaimResponse>;

export const KrMetaBattlePassClaimRequest = z
  .object({
    v: z.literal(1),
    tier: z.number().int().min(1),
    track: z.enum(["free", "premium"]),
    idempotencyKey: z.string().min(8).max(80).optional()
  })
  .strict();
export type KrMetaBattlePassClaimRequest = z.infer<typeof KrMetaBattlePassClaimRequest>;

export const KrMetaBattlePassClaimResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    tier: z.number().int(),
    track: z.enum(["free", "premium"]),
    granted: KrQuestReward,
    inventory: z.object({ gold: z.number().int(), shards: z.number().int(), keys: z.number().int() }).strict()
  })
  .strict();
export type KrMetaBattlePassClaimResponse = z.infer<typeof KrMetaBattlePassClaimResponse>;

export const KrAdminBalanceGetResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    override: KrEconomyTuning.partial(),
    effective: KrEconomyTuning
  })
  .strict();
export type KrAdminBalanceGetResponse = z.infer<typeof KrAdminBalanceGetResponse>;

export const KrAdminBalanceSetRequest = z
  .object({
    v: z.literal(1),
    patch: KrEconomyTuning.partial(),
    idempotencyKey: z.string().min(8).max(80).optional()
  })
  .strict();
export type KrAdminBalanceSetRequest = z.infer<typeof KrAdminBalanceSetRequest>;

export const KrAdminBalanceSetResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    effective: KrEconomyTuning
  })
  .strict();
export type KrAdminBalanceSetResponse = z.infer<typeof KrAdminBalanceSetResponse>;
