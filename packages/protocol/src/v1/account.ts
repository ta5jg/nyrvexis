import { z } from "zod";

export const KrDeviceId = z.string().min(8).max(200);
export type KrDeviceId = z.infer<typeof KrDeviceId>;

export const KrUserId = z.string().min(6).max(80);
export type KrUserId = z.infer<typeof KrUserId>;

export const KrSessionToken = z.string().min(20);
export type KrSessionToken = z.infer<typeof KrSessionToken>;

export const KrAuthGuestRequest = z
  .object({
    v: z.literal(1),
    deviceId: KrDeviceId
  })
  .strict();
export type KrAuthGuestRequest = z.infer<typeof KrAuthGuestRequest>;

/** Issued after guest login, email register/login, or linking email to a guest account. */
export const KrAuthSessionIssued = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    userId: KrUserId,
    token: KrSessionToken,
    refreshToken: KrSessionToken
  })
  .strict();
export type KrAuthSessionIssued = z.infer<typeof KrAuthSessionIssued>;

export const KrAuthGuestResponse = KrAuthSessionIssued;
export type KrAuthGuestResponse = KrAuthSessionIssued;

export const KrAuthRefreshRequest = z
  .object({
    v: z.literal(1),
    refreshToken: KrSessionToken
  })
  .strict();
export type KrAuthRefreshRequest = z.infer<typeof KrAuthRefreshRequest>;

/** Rotated refresh pair: clients must persist `refreshToken` and discard the previous one. */
export const KrAuthRefreshResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    token: KrSessionToken,
    refreshToken: KrSessionToken
  })
  .strict();
export type KrAuthRefreshResponse = z.infer<typeof KrAuthRefreshResponse>;

export const KrAuthLogoutRequest = z
  .object({
    v: z.literal(1),
    /** Revoke only this device/session. Omit to revoke every refresh session for the user. */
    refreshToken: KrSessionToken.optional()
  })
  .strict();
export type KrAuthLogoutRequest = z.infer<typeof KrAuthLogoutRequest>;

export const KrAuthLogoutResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true)
  })
  .strict();
export type KrAuthLogoutResponse = z.infer<typeof KrAuthLogoutResponse>;

export const KrAuthRegisterEmailRequest = z
  .object({
    v: z.literal(1),
    email: z.string().email(),
    password: z.string().min(8).max(128),
    deviceId: KrDeviceId.optional()
  })
  .strict();
export type KrAuthRegisterEmailRequest = z.infer<typeof KrAuthRegisterEmailRequest>;

export const KrAuthRegisterEmailResponse = KrAuthSessionIssued;
export type KrAuthRegisterEmailResponse = KrAuthSessionIssued;

export const KrAuthLoginEmailRequest = z
  .object({
    v: z.literal(1),
    email: z.string().email(),
    password: z.string().min(1).max(128),
    deviceId: KrDeviceId.optional()
  })
  .strict();
export type KrAuthLoginEmailRequest = z.infer<typeof KrAuthLoginEmailRequest>;

export const KrAuthLoginEmailResponse = KrAuthSessionIssued;
export type KrAuthLoginEmailResponse = KrAuthSessionIssued;

export const KrAuthLinkEmailRequest = z
  .object({
    v: z.literal(1),
    email: z.string().email(),
    password: z.string().min(8).max(128)
  })
  .strict();
export type KrAuthLinkEmailRequest = z.infer<typeof KrAuthLinkEmailRequest>;

export const KrAuthLinkEmailResponse = KrAuthSessionIssued;
export type KrAuthLinkEmailResponse = KrAuthSessionIssued;

/** Google Identity Services JWT (`credential` field from One Tap / button). */
export const KrAuthGoogleRequest = z
  .object({
    v: z.literal(1),
    credential: z.string().min(40).max(16_000),
    deviceId: KrDeviceId.optional()
  })
  .strict();
export type KrAuthGoogleRequest = z.infer<typeof KrAuthGoogleRequest>;

export const KrAuthGoogleResponse = KrAuthSessionIssued;
export type KrAuthGoogleResponse = KrAuthSessionIssued;

export const KrAuthLinkGoogleRequest = z
  .object({
    v: z.literal(1),
    credential: z.string().min(40).max(16_000)
  })
  .strict();
export type KrAuthLinkGoogleRequest = z.infer<typeof KrAuthLinkGoogleRequest>;

export const KrAuthLinkGoogleResponse = KrAuthSessionIssued;
export type KrAuthLinkGoogleResponse = KrAuthSessionIssued;

export const KrMeResponse = z
  .object({
    v: z.literal(1),
    ok: z.literal(true),
    userId: KrUserId,
    createdAtMs: z.number().int().nonnegative(),
    /** Present when the account has a linked email login; omit on older gateways (treat as unknown). */
    email: z.union([z.string().email(), z.null()]).optional()
  })
  .strict();
export type KrMeResponse = z.infer<typeof KrMeResponse>;
