import { z } from "zod";

const EnvRaw = z
  .object({
    KR_PORT: z.coerce.number().int().min(1).max(65535).default(8787),
    KR_HOST: z.string().min(1).default("0.0.0.0"),
    KR_SERVICE_VERSION: z.string().min(1).default("0.0.1"),
    KR_AUTH_SECRET: z.string().min(16).default("dev-only-change-me-please"),
    /** Access token lifetime (JWT Bearer). */
    KR_ACCESS_TTL_MS: z.coerce.number().int().min(60_000).max(1000 * 60 * 60 * 24 * 30).default(1000 * 60 * 30),
    /** Refresh token lifetime (long-lived). */
    KR_REFRESH_TTL_MS: z.coerce.number().int().min(60_000).max(1000 * 60 * 60 * 24 * 366).default(1000 * 60 * 60 * 24 * 30),
    /** @deprecated Use KR_ACCESS_TTL_MS; when set, overrides KR_ACCESS_TTL_MS. */
    KR_SESSION_TTL_MS: z.coerce.number().int().min(60_000).max(1000 * 60 * 60 * 24 * 30).optional(),
    KR_STORE_DIR: z.string().min(1).default(".kr-data"),
    /** When set, gateway persists `StoreState` in Postgres (`gateway_state`) instead of `store.json`. */
    KR_DATABASE_URL: z.preprocess(
      (v) => (v === "" || v == null ? undefined : String(v).trim()),
      z.string().min(8).optional()
    ),
    KR_PUBLIC_BASE_URL: z.string().min(1).default("http://localhost:5173"),
    KR_CORS_ORIGIN: z.string().min(1).default("*"),
    KR_BODY_LIMIT_BYTES: z.coerce.number().int().min(1024).max(50_000_000).default(1_000_000),
    KR_ADMIN_TOKEN: z.string().min(16).optional(),
    KR_CONTENT_VERSION: z.string().min(1).default("v0.0.1"),
    KR_RATE_WINDOW_MS: z.coerce.number().int().min(1000).max(60 * 60 * 1000).default(60_000),
    KR_RATE_MAX_PER_WINDOW_IP: z.coerce.number().int().min(1).max(10000).default(120),
    KR_RATE_MAX_PER_WINDOW_USER: z.coerce.number().int().min(1).max(10000).default(240),
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    KR_VAPID_PUBLIC_KEY: z.string().min(1).optional(),
    KR_VAPID_PRIVATE_KEY: z.string().min(1).optional(),
    KR_PUSH_SUBJECT: z.string().min(3).default("mailto:ops@nyrvexis.local"),
    KR_INTERNAL_CRON_SECRET: z.string().min(24).optional(),
    /** Google OAuth Web client ID (GIS); omit to disable `/auth/oauth/google`. */
    KR_GOOGLE_CLIENT_ID: z.string().min(8).optional(),
    /** Meta catalog (`services/gateway/src/content/catalogs/meta.<ver>.json`). */
    KR_META_VERSION: z.string().min(1).default("v0.1.0"),
    /** Season def (`season.<ver>.json`). */
    KR_SEASON_VERSION: z.string().min(1).default("v0.1.0"),
    /** App Store shared secret (legacy verifyReceipt). */
    KR_APPLE_IAP_SHARED_SECRET: z.string().min(8).optional(),
    KR_GOOGLE_PLAY_PACKAGE_NAME: z.string().min(3).optional(),
    /** Service account JSON path (Play Developer API). */
    KR_GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_PATH: z.string().min(1).optional(),
    KR_IAP_BATTLE_PASS_PRODUCT_ID_IOS: z.string().min(1).optional(),
    KR_IAP_BATTLE_PASS_PRODUCT_ID_ANDROID: z.string().min(1).optional(),
    /**
     * Yalnız geliştirme: `receipt` tam olarak `STUB_PREMIUM` ise ürün kimliği eşleşiyorsa premium verilir.
     * Prod’da kapalı tutun.
     */
    KR_IAP_ALLOW_STUB: z.coerce.boolean().default(false),
    /** Public privacy policy URL (HTTPS). */
    KR_LEGAL_PRIVACY_URL: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.string().url().optional()),
    /** Terms of service URL. */
    KR_LEGAL_TERMS_URL: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.string().url().optional()),
    /** Player support / legal contact email. */
    KR_LEGAL_SUPPORT_EMAIL: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.string().email().optional()),
    /** Account deletion or data-request instructions URL. */
    KR_LEGAL_ACCOUNT_DELETION_URL: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.string().url().optional()),
    /** Short plain-text hints for store questionnaires (violence / IAP / ads) — not legal advice. */
    KR_LEGAL_CONTENT_DESCRIPTORS: z.preprocess(
      (v) => (v === "" || v == null ? undefined : v),
      z.string().max(2000).optional()
    )
  });

export type GatewayEnv = Omit<z.infer<typeof EnvRaw>, "KR_SESSION_TTL_MS"> & {
  KR_ACCESS_TTL_MS: number;
  KR_REFRESH_TTL_MS: number;
};

export function readEnv(input: NodeJS.ProcessEnv = process.env): GatewayEnv {
  const p = EnvRaw.parse(input);
  const { KR_SESSION_TTL_MS, ...rest } = p;
  return {
    ...rest,
    KR_ACCESS_TTL_MS: KR_SESSION_TTL_MS ?? rest.KR_ACCESS_TTL_MS,
    KR_REFRESH_TTL_MS: rest.KR_REFRESH_TTL_MS
  };
}

