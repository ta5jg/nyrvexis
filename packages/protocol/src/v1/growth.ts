import { z } from "zod";
import { NvUserId } from "./account.js";

export const NvUtcDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export type NvUtcDate = z.infer<typeof NvUtcDate>;

// ---------- Leaderboard ----------

export const NvLeaderboardSubmitRequest = z
  .object({
    v: z.literal(1),
    dateUtc: NvUtcDate,
    // build/request to simulate (server-run)
    battleRequest: z.unknown()
  })
  .strict();
export type NvLeaderboardSubmitRequest = z.infer<typeof NvLeaderboardSubmitRequest>;

export const NvLeaderboardEntry = z
  .object({
    userId: NvUserId,
    score: z.number().int(),
    ticks: z.number().int().nonnegative(),
    remainingHp: z.number().int().nonnegative()
  })
  .strict();
export type NvLeaderboardEntry = z.infer<typeof NvLeaderboardEntry>;

export const NvLeaderboardSubmitResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    dateUtc: NvUtcDate,
    entry: NvLeaderboardEntry,
    rank: z.number().int().min(1),
    total: z.number().int().min(1)
  })
  .strict();
export type NvLeaderboardSubmitResponse = z.infer<typeof NvLeaderboardSubmitResponse>;

export const NvLeaderboardTopResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    dateUtc: NvUtcDate,
    entries: z.array(NvLeaderboardEntry).max(200)
  })
  .strict();
export type NvLeaderboardTopResponse = z.infer<typeof NvLeaderboardTopResponse>;

export const NvLeaderboardMeResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    dateUtc: NvUtcDate,
    entry: NvLeaderboardEntry.optional(),
    rank: z.number().int().min(1).optional(),
    total: z.number().int().min(1)
  })
  .strict();
export type NvLeaderboardMeResponse = z.infer<typeof NvLeaderboardMeResponse>;

// ---------- Referral ----------

export const NvReferralAcceptRequest = z
  .object({
    v: z.literal(1),
    referrerUserId: NvUserId
  })
  .strict();
export type NvReferralAcceptRequest = z.infer<typeof NvReferralAcceptRequest>;

export const NvReferralAcceptResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    accepted: z.boolean(),
    // if accepted now
    rewardGold: z.number().int().nonnegative().optional(),
    rewardShards: z.number().int().nonnegative().optional()
  })
  .strict();
export type NvReferralAcceptResponse = z.infer<typeof NvReferralAcceptResponse>;

export const NvReferralStatusResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    referrerUserId: NvUserId.optional(),
    rewarded: z.boolean()
  })
  .strict();
export type NvReferralStatusResponse = z.infer<typeof NvReferralStatusResponse>;

// ---------- Share tickets ----------

export const NvShareTicketCreateResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    ticketId: z.string().min(8),
    expiresAtMs: z.number().int().nonnegative()
  })
  .strict();
export type NvShareTicketCreateResponse = z.infer<typeof NvShareTicketCreateResponse>;

export const NvShareRedeemRequest = z
  .object({
    v: z.literal(1),
    ticketId: z.string().min(8)
  })
  .strict();
export type NvShareRedeemRequest = z.infer<typeof NvShareRedeemRequest>;

export const NvShareRedeemResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    redeemed: z.boolean(),
    rewardGold: z.number().int().nonnegative().optional(),
    rewardShards: z.number().int().nonnegative().optional()
  })
  .strict();
export type NvShareRedeemResponse = z.infer<typeof NvShareRedeemResponse>;

