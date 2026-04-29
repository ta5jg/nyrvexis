import { z } from "zod";
import { KrUserId } from "./account.js";

export const KrUtcDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export type KrUtcDate = z.infer<typeof KrUtcDate>;

// ---------- Leaderboard ----------

export const KrLeaderboardSubmitRequest = z
  .object({
    v: z.literal(1),
    dateUtc: KrUtcDate,
    // build/request to simulate (server-run)
    battleRequest: z.unknown()
  })
  .strict();
export type KrLeaderboardSubmitRequest = z.infer<typeof KrLeaderboardSubmitRequest>;

export const KrLeaderboardEntry = z
  .object({
    userId: KrUserId,
    score: z.number().int(),
    ticks: z.number().int().nonnegative(),
    remainingHp: z.number().int().nonnegative()
  })
  .strict();
export type KrLeaderboardEntry = z.infer<typeof KrLeaderboardEntry>;

export const KrLeaderboardSubmitResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    dateUtc: KrUtcDate,
    entry: KrLeaderboardEntry,
    rank: z.number().int().min(1),
    total: z.number().int().min(1)
  })
  .strict();
export type KrLeaderboardSubmitResponse = z.infer<typeof KrLeaderboardSubmitResponse>;

export const KrLeaderboardTopResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    dateUtc: KrUtcDate,
    entries: z.array(KrLeaderboardEntry).max(200)
  })
  .strict();
export type KrLeaderboardTopResponse = z.infer<typeof KrLeaderboardTopResponse>;

export const KrLeaderboardMeResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    dateUtc: KrUtcDate,
    entry: KrLeaderboardEntry.optional(),
    rank: z.number().int().min(1).optional(),
    total: z.number().int().min(1)
  })
  .strict();
export type KrLeaderboardMeResponse = z.infer<typeof KrLeaderboardMeResponse>;

// ---------- Referral ----------

export const KrReferralAcceptRequest = z
  .object({
    v: z.literal(1),
    referrerUserId: KrUserId
  })
  .strict();
export type KrReferralAcceptRequest = z.infer<typeof KrReferralAcceptRequest>;

export const KrReferralAcceptResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    accepted: z.boolean(),
    // if accepted now
    rewardGold: z.number().int().nonnegative().optional(),
    rewardShards: z.number().int().nonnegative().optional()
  })
  .strict();
export type KrReferralAcceptResponse = z.infer<typeof KrReferralAcceptResponse>;

export const KrReferralStatusResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    referrerUserId: KrUserId.optional(),
    rewarded: z.boolean()
  })
  .strict();
export type KrReferralStatusResponse = z.infer<typeof KrReferralStatusResponse>;

// ---------- Share tickets ----------

export const KrShareTicketCreateResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    ticketId: z.string().min(8),
    expiresAtMs: z.number().int().nonnegative()
  })
  .strict();
export type KrShareTicketCreateResponse = z.infer<typeof KrShareTicketCreateResponse>;

export const KrShareRedeemRequest = z
  .object({
    v: z.literal(1),
    ticketId: z.string().min(8)
  })
  .strict();
export type KrShareRedeemRequest = z.infer<typeof KrShareRedeemRequest>;

export const KrShareRedeemResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    redeemed: z.boolean(),
    rewardGold: z.number().int().nonnegative().optional(),
    rewardShards: z.number().int().nonnegative().optional()
  })
  .strict();
export type KrShareRedeemResponse = z.infer<typeof KrShareRedeemResponse>;

