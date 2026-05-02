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
import { NvCosmeticDef } from "./cosmetics.js";
import { NvContentVersion } from "./content.js";

export const NvEconomyTuning = z
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
export type NvEconomyTuning = z.infer<typeof NvEconomyTuning>;

export const NvQuestScope = z.enum(["daily", "weekly"]);
export type NvQuestScope = z.infer<typeof NvQuestScope>;

export const NvQuestTrack = z.enum(["daily_claim", "leaderboard_submit", "shop_buy"]);
export type NvQuestTrack = z.infer<typeof NvQuestTrack>;

export const NvQuestReward = z
  .object({
    gold: z.number().int().min(0).default(0),
    shards: z.number().int().min(0).default(0),
    keys: z.number().int().min(0).default(0),
    battlePassXp: z.number().int().min(0).default(0),
    catchUpTokens: z.number().int().min(0).default(0),
    /** Kozmetik ödülü — id `NvMetaContent.cosmetics` içinde tanımlı olmalı. */
    cosmeticId: z.string().min(1).max(80).optional()
  })
  .strict();
export type NvQuestReward = z.infer<typeof NvQuestReward>;

export const NvQuestDef = z
  .object({
    id: z.string().min(1),
    scope: NvQuestScope,
    title: z.string().min(1),
    target: z.number().int().min(1).max(999),
    track: NvQuestTrack,
    reward: NvQuestReward
  })
  .strict();
export type NvQuestDef = z.infer<typeof NvQuestDef>;

export const NvBattlePassTierDef = z
  .object({
    tier: z.number().int().min(1).max(999),
    xpCumulative: z.number().int().min(0),
    freeReward: NvQuestReward,
    premiumReward: NvQuestReward.optional()
  })
  .strict();
export type NvBattlePassTierDef = z.infer<typeof NvBattlePassTierDef>;

export const NvMetaContent = z
  .object({
    v: z.literal(1),
    contentVersion: NvContentVersion,
    seasonId: z.string().min(1),
    economyDefaults: NvEconomyTuning,
    quests: z.array(NvQuestDef).min(1).max(64),
    battlePassTiers: z.array(NvBattlePassTierDef).min(1).max(200),
    cosmetics: z.array(NvCosmeticDef).max(64).default([])
  })
  .strict();
export type NvMetaContent = z.infer<typeof NvMetaContent>;

export const NvQuestProgressView = z
  .object({
    id: z.string().min(1),
    scope: NvQuestScope,
    title: z.string().min(1),
    target: z.number().int(),
    progress: z.number().int().nonnegative(),
    complete: z.boolean(),
    claimed: z.boolean(),
    reward: NvQuestReward
  })
  .strict();
export type NvQuestProgressView = z.infer<typeof NvQuestProgressView>;

export const NvStreakView = z
  .object({
    current: z.number().int().nonnegative(),
    best: z.number().int().nonnegative(),
    lastActiveDateUtc: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    catchUpTokens: z.number().int().nonnegative()
  })
  .strict();
export type NvStreakView = z.infer<typeof NvStreakView>;

export const NvBattlePassView = z
  .object({
    seasonId: z.string().min(1),
    xp: z.number().int().nonnegative(),
    claimedFreeTiers: z.array(z.number().int().min(1)).max(200),
    claimedPremiumTiers: z.array(z.number().int().min(1)).max(200).default([]),
    hasPremium: z.boolean(),
    tiers: z.array(NvBattlePassTierDef).max(200)
  })
  .strict();
export type NvBattlePassView = z.infer<typeof NvBattlePassView>;

export const NvMetaProgressResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    dateUtc: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    weekPeriodKey: z.string().min(1),
    economy: NvEconomyTuning,
    quests: z.array(NvQuestProgressView).max(64),
    streak: NvStreakView,
    battlePass: NvBattlePassView
  })
  .strict();
export type NvMetaProgressResponse = z.infer<typeof NvMetaProgressResponse>;

export const NvMetaQuestClaimRequest = z
  .object({
    v: z.literal(1),
    questId: z.string().min(1),
    idempotencyKey: z.string().min(8).max(80).optional()
  })
  .strict();
export type NvMetaQuestClaimRequest = z.infer<typeof NvMetaQuestClaimRequest>;

export const NvMetaQuestClaimResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    questId: z.string().min(1),
    granted: NvQuestReward,
    inventory: z.object({ gold: z.number().int(), shards: z.number().int(), keys: z.number().int() }).strict()
  })
  .strict();
export type NvMetaQuestClaimResponse = z.infer<typeof NvMetaQuestClaimResponse>;

export const NvMetaBattlePassClaimRequest = z
  .object({
    v: z.literal(1),
    tier: z.number().int().min(1),
    track: z.enum(["free", "premium"]),
    idempotencyKey: z.string().min(8).max(80).optional()
  })
  .strict();
export type NvMetaBattlePassClaimRequest = z.infer<typeof NvMetaBattlePassClaimRequest>;

export const NvMetaBattlePassClaimResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    tier: z.number().int(),
    track: z.enum(["free", "premium"]),
    granted: NvQuestReward,
    inventory: z.object({ gold: z.number().int(), shards: z.number().int(), keys: z.number().int() }).strict()
  })
  .strict();
export type NvMetaBattlePassClaimResponse = z.infer<typeof NvMetaBattlePassClaimResponse>;

export const NvAdminBalanceGetResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    override: NvEconomyTuning.partial(),
    effective: NvEconomyTuning
  })
  .strict();
export type NvAdminBalanceGetResponse = z.infer<typeof NvAdminBalanceGetResponse>;

export const NvAdminBalanceSetRequest = z
  .object({
    v: z.literal(1),
    patch: NvEconomyTuning.partial(),
    idempotencyKey: z.string().min(8).max(80).optional()
  })
  .strict();
export type NvAdminBalanceSetRequest = z.infer<typeof NvAdminBalanceSetRequest>;

export const NvAdminBalanceSetResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    effective: NvEconomyTuning
  })
  .strict();
export type NvAdminBalanceSetResponse = z.infer<typeof NvAdminBalanceSetResponse>;
