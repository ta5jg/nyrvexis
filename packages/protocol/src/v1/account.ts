import { z } from "zod";

export const NvDeviceId = z.string().min(8).max(200);
export type NvDeviceId = z.infer<typeof NvDeviceId>;

export const NvUserId = z.string().min(6).max(80);
export type NvUserId = z.infer<typeof NvUserId>;

export const NvSessionToken = z.string().min(20);
export type NvSessionToken = z.infer<typeof NvSessionToken>;

export const NvAuthGuestRequest = z
  .object({
    v: z.literal(1),
    deviceId: NvDeviceId
  })
  .strict();
export type NvAuthGuestRequest = z.infer<typeof NvAuthGuestRequest>;

/** Issued after guest login, email register/login, or linking email to a guest account. */
export const NvAuthSessionIssued = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    userId: NvUserId,
    token: NvSessionToken,
    refreshToken: NvSessionToken
  })
  .strict();
export type NvAuthSessionIssued = z.infer<typeof NvAuthSessionIssued>;

export const NvAuthGuestResponse = NvAuthSessionIssued;
export type NvAuthGuestResponse = NvAuthSessionIssued;

export const NvAuthRefreshRequest = z
  .object({
    v: z.literal(1),
    refreshToken: NvSessionToken
  })
  .strict();
export type NvAuthRefreshRequest = z.infer<typeof NvAuthRefreshRequest>;

/** Rotated refresh pair: clients must persist `refreshToken` and discard the previous one. */
export const NvAuthRefreshResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    token: NvSessionToken,
    refreshToken: NvSessionToken
  })
  .strict();
export type NvAuthRefreshResponse = z.infer<typeof NvAuthRefreshResponse>;

export const NvAuthLogoutRequest = z
  .object({
    v: z.literal(1),
    /** Revoke only this device/session. Omit to revoke every refresh session for the user. */
    refreshToken: NvSessionToken.optional()
  })
  .strict();
export type NvAuthLogoutRequest = z.infer<typeof NvAuthLogoutRequest>;

export const NvAuthLogoutResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true)
  })
  .strict();
export type NvAuthLogoutResponse = z.infer<typeof NvAuthLogoutResponse>;

export const NvAuthRegisterEmailRequest = z
  .object({
    v: z.literal(1),
    email: z.string().email(),
    password: z.string().min(8).max(128),
    deviceId: NvDeviceId.optional()
  })
  .strict();
export type NvAuthRegisterEmailRequest = z.infer<typeof NvAuthRegisterEmailRequest>;

export const NvAuthRegisterEmailResponse = NvAuthSessionIssued;
export type NvAuthRegisterEmailResponse = NvAuthSessionIssued;

export const NvAuthLoginEmailRequest = z
  .object({
    v: z.literal(1),
    email: z.string().email(),
    password: z.string().min(1).max(128),
    deviceId: NvDeviceId.optional()
  })
  .strict();
export type NvAuthLoginEmailRequest = z.infer<typeof NvAuthLoginEmailRequest>;

export const NvAuthLoginEmailResponse = NvAuthSessionIssued;
export type NvAuthLoginEmailResponse = NvAuthSessionIssued;

export const NvAuthLinkEmailRequest = z
  .object({
    v: z.literal(1),
    email: z.string().email(),
    password: z.string().min(8).max(128)
  })
  .strict();
export type NvAuthLinkEmailRequest = z.infer<typeof NvAuthLinkEmailRequest>;

export const NvAuthLinkEmailResponse = NvAuthSessionIssued;
export type NvAuthLinkEmailResponse = NvAuthSessionIssued;

/** Google Identity Services JWT (`credential` field from One Tap / button). */
export const NvAuthGoogleRequest = z
  .object({
    v: z.literal(1),
    credential: z.string().min(40).max(16_000),
    deviceId: NvDeviceId.optional()
  })
  .strict();
export type NvAuthGoogleRequest = z.infer<typeof NvAuthGoogleRequest>;

export const NvAuthGoogleResponse = NvAuthSessionIssued;
export type NvAuthGoogleResponse = NvAuthSessionIssued;

export const NvAuthLinkGoogleRequest = z
  .object({
    v: z.literal(1),
    credential: z.string().min(40).max(16_000)
  })
  .strict();
export type NvAuthLinkGoogleRequest = z.infer<typeof NvAuthLinkGoogleRequest>;

export const NvAuthLinkGoogleResponse = NvAuthSessionIssued;
export type NvAuthLinkGoogleResponse = NvAuthSessionIssued;

export const NvMeResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    userId: NvUserId,
    createdAtMs: z.number().int().nonnegative(),
    /** Present when the account has a linked email login; omit on older gateways (treat as unknown). */
    email: z.union([z.string().email(), z.null()]).optional()
  })
  .strict();
export type NvMeResponse = z.infer<typeof NvMeResponse>;
