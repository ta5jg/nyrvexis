import { createHash, timingSafeEqual } from "node:crypto";
import Fastify from "fastify";
import { z } from "zod";
import cors from "@fastify/cors";
import { nanoid } from "nanoid";
import {
  HealthResponse,
  KrAuthGuestRequest,
  KrAuthGuestResponse,
  KrAuthRefreshRequest,
  KrAuthRefreshResponse,
  KrAuthLogoutRequest,
  KrAuthLogoutResponse,
  KrAuthRegisterEmailRequest,
  KrAuthRegisterEmailResponse,
  KrAuthLoginEmailRequest,
  KrAuthLoginEmailResponse,
  KrAuthLinkEmailRequest,
  KrAuthLinkEmailResponse,
  KrAuthGoogleRequest,
  KrAuthGoogleResponse,
  KrAuthLinkGoogleRequest,
  KrAuthLinkGoogleResponse,
  KrCatalogResponse,
  KrDailyClaimResponse,
  KrDailySeedResponse,
  KrDailyShopResponse,
  KrInventoryResponse,
  KrMeResponse,
  KrOwnedUnitsResponse,
  KrLeaderboardMeResponse,
  KrLeaderboardSubmitRequest,
  KrLeaderboardSubmitResponse,
  KrLeaderboardTopResponse,
  KrReferralAcceptRequest,
  KrReferralAcceptResponse,
  KrReferralStatusResponse,
  KrShopBuyRequest,
  KrShopBuyResponse,
  KrShareRedeemRequest,
  KrShareRedeemResponse,
  KrShareTicketCreateResponse,
  KrUpgradeUnitRequest,
  KrUpgradeUnitResponse,
  KrCheckoutCreateRequest,
  KrCheckoutCreateResponse,
  KrOffersResponse,
  KrPurchaseStatusResponse,
  KrBattlePassIapVerifyRequest,
  KrBattlePassIapVerifyResponseOk,
  KrPushWebSubscribeRequest,
  KrPushWebSubscribeResponse,
  KrPushWebUnsubscribeRequest,
  KrPushWebUnsubscribeResponse,
  KrPushWebVapidResponse,
  KrInternalPushDailyRequest,
  KrInternalPushDailyResponse,
  KrEconomyTuning,
  KrMetaProgressResponse,
  KrMetaQuestClaimRequest,
  KrMetaQuestClaimResponse,
  KrMetaBattlePassClaimRequest,
  KrMetaBattlePassClaimResponse,
  KrAdminBalanceGetResponse,
  KrAdminBalanceSetRequest,
  KrAdminBalanceSetResponse,
  KrSeasonViewResponse,
  KrCosmeticsCatalogResponse,
  KrCosmeticsMeResponse,
  KrCosmeticsEquipRequest,
  KrCosmeticsEquipResponse,
  KrLegalPublicResponse,
  KrAnalyticsEventRequest,
  KrAnalyticsEventResponse
} from "@kindrail/protocol";
import { readEnv } from "./env.js";
import { runBattleSim } from "./sim/battleSim.js";
import { registerAuth, requireAuth } from "./auth/middleware.js";
import { issueAccessToken, issueRefreshToken, verifyToken, type TokenPayload } from "./auth/token.js";
import { hashPassword, normalizeEmail, verifyPassword } from "./auth/password.js";
import { verifyGoogleIdToken } from "./auth/googleVerify.js";
import { FileStore, type LeaderboardEntryRow, type StoreState } from "./store/store.js";
import { PgStore } from "./store/pgStore.js";
import { loadContent } from "./content/loader.js";
import { makeDailyOffers, upgradeCost } from "./meta/shop.js";
import { OFFERS, getOffer } from "./monetization/offers.js";
import { grantOfferToUser } from "./monetization/fulfill.js";
import { FixedWindowRateLimiter } from "./ops/ratelimit.js";
import { Metrics } from "./ops/metrics.js";
import { FlagStore } from "./ops/flags.js";
import { pushWebSubscriptionId } from "./push/subscriptionId.js";
import { sendWebPushJson, setVapid } from "./push/webPushSend.js";
import { loadMetaContent } from "./content/metaLoader.js";
import { loadSeasonDef } from "./content/seasonLoader.js";
import { loadBalanceOverride, saveBalanceOverride } from "./meta/balanceFile.js";
import {
  effectiveEconomy,
  onDailyClaimSuccess,
  onLeaderboardSubmit,
  onShopBuy,
  buildMetaProgressView,
  claimQuestReward,
  claimBattlePassTier,
  setUserBattlePassPremium
} from "./meta/metaHandlers.js";
import { utcDate } from "./time.js";
import { verifyAppleBattlePassProduct } from "./iap/appleVerify.js";
import { verifyAndroidProductPurchase } from "./iap/androidVerify.js";
import { iapReceiptFingerprint } from "./iap/fingerprint.js";

const IAP_STUB_RECEIPT = "STUB_PREMIUM";

const env = readEnv();

let pgStore: PgStore | undefined;
let store: FileStore | PgStore;

if (env.KR_DATABASE_URL && env.KR_DATABASE_URL.length >= 8) {
  pgStore = new PgStore(env.KR_DATABASE_URL);
  await pgStore.load();
  store = pgStore;
} else {
  const fsStore = new FileStore({ dir: env.KR_STORE_DIR });
  await fsStore.load();
  store = fsStore;
}
const [contentLoaded, metaLoaded, seasonLoaded, balancePartial] = await Promise.all([
  loadContent(env.KR_CONTENT_VERSION),
  loadMetaContent(env.KR_META_VERSION),
  loadSeasonDef(env.KR_SEASON_VERSION),
  loadBalanceOverride(env.KR_STORE_DIR)
]);
let content = contentLoaded;
let metaContent = metaLoaded;
let seasonDef = seasonLoaded;
let balanceOverride: Partial<KrEconomyTuning> = balancePartial;
const flags = new FlagStore(env.KR_STORE_DIR);
await flags.load();
const limiter = new FixedWindowRateLimiter(env.KR_RATE_WINDOW_MS);
const metrics = new Metrics();

function economyEffective(): KrEconomyTuning {
  return effectiveEconomy(metaContent, balanceOverride);
}

function refreshCredentialValid(s: StoreState, payload: TokenPayload): boolean {
  const tokenJti = typeof payload.jti === "string" && payload.jti.length >= 8 ? payload.jti : undefined;
  if (!tokenJti) return false;
  const row = s.refreshSessions[tokenJti];
  return Boolean(row && row.userId === payload.userId);
}

function issueAuthPair(userId: string, revokeJti?: string): { token: string; refreshToken: string } {
  const jti = nanoid(24);
  store.mutate((state) => {
    if (revokeJti && revokeJti.length >= 8) {
      const prev = state.refreshSessions[revokeJti];
      if (prev?.userId === userId) delete state.refreshSessions[revokeJti];
    }
    state.refreshSessions[jti] = { userId, createdAtMs: Date.now() };
  });
  return {
    token: issueAccessToken({
      userId,
      ttlMs: env.KR_ACCESS_TTL_MS,
      secret: env.KR_AUTH_SECRET
    }),
    refreshToken: issueRefreshToken({
      userId,
      ttlMs: env.KR_REFRESH_TTL_MS,
      secret: env.KR_AUTH_SECRET,
      jti
    })
  };
}

function webPushKeysReady(): boolean {
  return Boolean(env.KR_VAPID_PUBLIC_KEY && env.KR_VAPID_PRIVATE_KEY);
}

function ensureWebPushConfigured(): boolean {
  if (!webPushKeysReady()) return false;
  setVapid(env.KR_PUSH_SUBJECT, env.KR_VAPID_PUBLIC_KEY!, env.KR_VAPID_PRIVATE_KEY!);
  return true;
}

function internalCronSecretValid(provided: string | undefined): boolean {
  const secret = env.KR_INTERNAL_CRON_SECRET;
  if (!secret || typeof provided !== "string" || provided.length < 1) return false;
  const a = createHash("sha256").update(provided, "utf8").digest();
  const b = createHash("sha256").update(secret, "utf8").digest();
  return a.length === b.length && timingSafeEqual(a, b);
}

const app = Fastify({
  bodyLimit: env.KR_BODY_LIMIT_BYTES,
  logger: {
    level: "info"
  }
});

await app.register(cors, {
  origin: env.KR_CORS_ORIGIN === "*" ? true : env.KR_CORS_ORIGIN.split(",").map((s) => s.trim()),
  credentials: false
});

registerAuth(app, { secret: env.KR_AUTH_SECRET });

app.addHook("onRequest", async (req, reply) => {
  reply.header("x-kr-trace-id", nanoid());
  reply.header("x-kr-service", "kindrail-gateway");
  reply.header("x-kr-version", env.KR_SERVICE_VERSION);
  // Basic hardening defaults (can be replaced with helmet later)
  reply.header("x-content-type-options", "nosniff");
  reply.header("referrer-policy", "no-referrer");
  reply.header("cache-control", "no-store");
  req.log.debug({ url: req.url, method: req.method }, "request");
});

app.addHook("preHandler", async (req, reply) => {
  const pathOnly = (req.url.split("?")[0] ?? "") as string;
  if (pathOnly.startsWith("/internal/")) return;

  // basic rate limit (ip or user)
  const userId = req.krUserId;
  const ip = req.ip || "unknown";
  const now = Date.now();

  const key = userId ? `u:${userId}` : `ip:${ip}`;
  const max = userId ? env.KR_RATE_MAX_PER_WINDOW_USER : env.KR_RATE_MAX_PER_WINDOW_IP;
  const r = limiter.allow(key, max, now);
  reply.header("x-kr-rate-remaining", String(r.remaining));
  reply.header("x-kr-rate-reset-ms", String(r.resetAtMs));
  if (!r.ok) {
    metrics.rateLimited += 1;
    reply.code(429);
    return reply.send({ ok: false, error: "RATE_LIMITED" });
  }
});

app.addHook("onResponse", async (req, reply) => {
  const route = (reply.routeOptions?.url ?? req.url.split("?")[0]) || "unknown";
  metrics.incRoute(route);
  metrics.incStatus(reply.statusCode);
});

app.get("/health", async () => {
  let database: "ok" | "skipped" | "error" = "skipped";
  if (pgStore) {
    try {
      database = (await pgStore.ping()) ? "ok" : "error";
    } catch {
      database = "error";
    }
  }
  const alive = database !== "error";
  const body = HealthResponse.parse({
    ok: alive,
    service: "kindrail-gateway",
    version: env.KR_SERVICE_VERSION,
    nowMs: Date.now(),
    checks: { database }
  });
  return body;
});

app.get("/legal/public", async () => {
  const privacyPolicyUrl = env.KR_LEGAL_PRIVACY_URL;
  const termsOfServiceUrl = env.KR_LEGAL_TERMS_URL;
  const supportEmail = env.KR_LEGAL_SUPPORT_EMAIL;
  const accountDeletionUrl = env.KR_LEGAL_ACCOUNT_DELETION_URL;
  const contentDescriptorsHint = env.KR_LEGAL_CONTENT_DESCRIPTORS;
  const ok = Boolean(
    privacyPolicyUrl || termsOfServiceUrl || supportEmail || accountDeletionUrl || contentDescriptorsHint
  );
  return KrLegalPublicResponse.parse({
    v: 1,
    ok,
    ...(privacyPolicyUrl ? { privacyPolicyUrl } : {}),
    ...(termsOfServiceUrl ? { termsOfServiceUrl } : {}),
    ...(supportEmail ? { supportEmail } : {}),
    ...(accountDeletionUrl ? { accountDeletionUrl } : {}),
    ...(contentDescriptorsHint ? { contentDescriptorsHint } : {})
  });
});

app.get("/metrics", async (_req, reply) => {
  reply.header("content-type", "text/plain; charset=utf-8");
  return metrics.renderPrometheus("kindrail-gateway");
});

app.post("/analytics/event", async (req, reply) => {
  if (!pgStore) {
    reply.code(503);
    return { ok: false, error: "ANALYTICS_REQUIRES_DATABASE" };
  }
  try {
    const body = KrAnalyticsEventRequest.parse(req.body);
    const userId = req.krUserId ?? null;
    await pgStore.insertAnalyticsEvent({
      userId,
      name: body.name,
      props: body.props ?? {}
    });
    metrics.incAnalyticsEventsIngested();
    return KrAnalyticsEventResponse.parse({ v: 1, ok: true });
  } catch (err) {
    metrics.incAnalyticsEventsFailed();
    if (err instanceof z.ZodError) {
      req.log.warn({ err }, "analytics event rejected");
      reply.code(400);
      return { ok: false, error: "BAD_REQUEST" };
    }
    req.log.warn({ err }, "analytics event ingest failed");
    reply.code(500);
    return { ok: false, error: "SERVER_ERROR" };
  }
});

app.get("/flags", async () => {
  return { v: 1, ok: true, flags: flags.getAll() };
});

app.get("/push/web/vapid-public", async () => {
  const enabled = flags.isEnabled("push_web") && webPushKeysReady();
  return KrPushWebVapidResponse.parse({
    v: 1,
    ok: true,
    enabled,
    publicKey: enabled ? env.KR_VAPID_PUBLIC_KEY : undefined
  });
});

app.post("/push/web/subscribe", async (req, reply) => {
  try {
    if (!flags.isEnabled("push_web")) {
      reply.code(400);
      return { ok: false, error: "DISABLED" };
    }
    if (!ensureWebPushConfigured()) {
      reply.code(503);
      return { ok: false, error: "PUSH_DISABLED" };
    }
    const userId = requireAuth(req);
    const body = KrPushWebSubscribeRequest.parse(req.body);
    const dateUtc = utcDate();
    const now = Date.now();
    const subId = pushWebSubscriptionId(body.subscription.endpoint);

    const out = store.mutate((s): { t: "ok" } | { t: "rate" } => {
      const bucket = (s.pushWebSubs[userId] ??= {});
      const existing = bucket[subId];
      if (!existing) {
        if (!incCap(s, "pushSubscribe", userId, dateUtc, 50)) return { t: "rate" };
      }
      bucket[subId] = {
        subId,
        endpoint: body.subscription.endpoint,
        p256dh: body.subscription.keys.p256dh,
        auth: body.subscription.keys.auth,
        createdAtMs: existing?.createdAtMs ?? now,
        updatedAtMs: now
      };
      return { t: "ok" };
    });

    if (out.t === "rate") {
      reply.code(429);
      return { ok: false, error: "RATE_LIMITED" };
    }

    return KrPushWebSubscribeResponse.parse({ v: 1, ok: true, subscriptionId: subId });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      reply.code(401);
      return { ok: false, error: "UNAUTHORIZED" };
    }
    req.log.warn({ err }, "push subscribe rejected");
    reply.code(400);
    return { ok: false, error: "BAD_REQUEST" };
  }
});

app.post("/push/web/unsubscribe", async (req, reply) => {
  try {
    const userId = requireAuth(req);
    const body = KrPushWebUnsubscribeRequest.parse(req.body);
    const subId = pushWebSubscriptionId(body.endpoint);
    const removed = store.mutate((s) => {
      const bucket = s.pushWebSubs[userId];
      if (!bucket?.[subId]) return false;
      delete bucket[subId];
      if (Object.keys(bucket).length === 0) delete s.pushWebSubs[userId];
      return true;
    });
    return KrPushWebUnsubscribeResponse.parse({ v: 1, ok: true, removed });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      reply.code(401);
      return { ok: false, error: "UNAUTHORIZED" };
    }
    req.log.warn({ err }, "push unsubscribe rejected");
    reply.code(400);
    return { ok: false, error: "BAD_REQUEST" };
  }
});

app.post("/admin/push/test", async (req, reply) => {
  const token = req.headers["x-kr-admin-token"];
  if (!env.KR_ADMIN_TOKEN || token !== env.KR_ADMIN_TOKEN) {
    reply.code(401);
    return { ok: false, error: "UNAUTHORIZED" };
  }
  if (!flags.isEnabled("push_web") || !ensureWebPushConfigured()) {
    reply.code(503);
    return { ok: false, error: "PUSH_DISABLED" };
  }

  const AdminPushTest = z
    .object({
      userId: z.string().min(1).optional(),
      title: z.string().min(1).max(80).optional(),
      body: z.string().min(1).max(200).optional()
    })
    .strict();

  const body = AdminPushTest.parse(req.body ?? {});
  const title = body.title ?? "KINDRAIL";
  const text = body.body ?? "Daily battle is ready — open the app to claim and play.";

  const snap = store.snapshot().pushWebSubs;
  const targets: Array<{ endpoint: string; keys: { p256dh: string; auth: string } }> = [];
  if (body.userId) {
    const bucket = snap[body.userId] ?? {};
    for (const row of Object.values(bucket)) {
      targets.push({ endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } });
    }
  } else {
    let n = 0;
    outer: for (const bucket of Object.values(snap)) {
      for (const row of Object.values(bucket)) {
        targets.push({ endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } });
        n += 1;
        if (n >= 500) break outer;
      }
    }
  }

  let sent = 0;
  let failed = 0;
  for (const sub of targets) {
    try {
      await sendWebPushJson(sub, { kind: "kindrail.push", v: 1, title, body: text, atMs: Date.now() });
      sent += 1;
    } catch {
      failed += 1;
    }
  }

  return { ok: true, sent, failed, targets: targets.length };
});

app.post("/internal/push/daily", async (req, reply) => {
  if (!env.KR_INTERNAL_CRON_SECRET) {
    reply.code(503);
    return { ok: false, error: "CRON_DISABLED" };
  }
  const hdr = req.headers["x-kr-internal-cron-secret"];
  const provided = Array.isArray(hdr) ? hdr[0] : hdr;
  if (!internalCronSecretValid(provided)) {
    reply.code(401);
    return { ok: false, error: "UNAUTHORIZED" };
  }
  if (!flags.isEnabled("push_web") || !ensureWebPushConfigured()) {
    reply.code(503);
    return { ok: false, error: "PUSH_DISABLED" };
  }

  const body = KrInternalPushDailyRequest.parse(req.body ?? { v: 1 });
  const dateUtc = body.dateUtc ?? utcDate();
  const dryRun = Boolean(body.dryRun);
  const limit = Math.min(10_000, Math.max(1, body.limit ?? 2000));

  let scanned = 0;
  let sent = 0;
  let skipped = 0;
  let failed = 0;
  let removed = 0;

  const snap = store.snapshot().pushWebSubs;
  outer: for (const [userId, bucket] of Object.entries(snap)) {
    for (const row of Object.values(bucket)) {
      if (scanned >= limit) break outer;
      scanned += 1;
      const k = capKey("pushDailySub", row.subId, dateUtc);
      const capVal = (store.snapshot().caps[k] ?? 0) | 0;
      if (capVal >= 1) {
        skipped += 1;
        continue;
      }
      if (dryRun) {
        skipped += 1;
        continue;
      }
      try {
        await sendWebPushJson(
          { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
          {
            kind: "kindrail.push.daily",
            v: 1,
            dateUtc,
            title: "KINDRAIL",
            body: "Daily rewards and battle are ready.",
            atMs: Date.now()
          }
        );
        store.mutate((s) => {
          s.caps[k] = 1;
        });
        sent += 1;
      } catch (e: unknown) {
        const code =
          typeof e === "object" && e !== null && "statusCode" in e
            ? Number((e as { statusCode: number }).statusCode)
            : 0;
        if (code === 410) {
          store.mutate((s) => {
            const b = s.pushWebSubs[userId];
            if (!b?.[row.subId]) return;
            delete b[row.subId];
            if (Object.keys(b).length === 0) delete s.pushWebSubs[userId];
            delete s.caps[k];
          });
          removed += 1;
        } else {
          failed += 1;
        }
      }
    }
  }

  metrics.recordPushDailyRun({ scanned, sent, skipped, failed, removed });

  return KrInternalPushDailyResponse.parse({
    v: 1,
    ok: true,
    dateUtc,
    dryRun,
    scanned,
    sent,
    skipped,
    failed,
    removed
  });
});

app.post("/admin/reload", async (req, reply) => {
  const token = req.headers["x-kr-admin-token"];
  if (!env.KR_ADMIN_TOKEN || token !== env.KR_ADMIN_TOKEN) {
    reply.code(401);
    return { ok: false, error: "UNAUTHORIZED" };
  }
  content = await loadContent(env.KR_CONTENT_VERSION);
  metaContent = await loadMetaContent(env.KR_META_VERSION);
  seasonDef = await loadSeasonDef(env.KR_SEASON_VERSION);
  balanceOverride = await loadBalanceOverride(env.KR_STORE_DIR);
  await flags.load();
  return { ok: true };
});

app.get("/admin/balance", async (req, reply) => {
  const token = req.headers["x-kr-admin-token"];
  if (!env.KR_ADMIN_TOKEN || token !== env.KR_ADMIN_TOKEN) {
    reply.code(401);
    return { ok: false, error: "UNAUTHORIZED" };
  }
  return KrAdminBalanceGetResponse.parse({
    v: 1,
    ok: true,
    override: KrEconomyTuning.partial().parse(balanceOverride),
    effective: economyEffective()
  });
});

app.post("/admin/balance", async (req, reply) => {
  try {
    const token = req.headers["x-kr-admin-token"];
    if (!env.KR_ADMIN_TOKEN || token !== env.KR_ADMIN_TOKEN) {
      reply.code(401);
      return { ok: false, error: "UNAUTHORIZED" };
    }
    const body = KrAdminBalanceSetRequest.parse(req.body);
    balanceOverride = { ...balanceOverride, ...body.patch };
    await saveBalanceOverride(env.KR_STORE_DIR, balanceOverride);
    req.log.info({ krAudit: "admin_balance_set", keys: Object.keys(body.patch) }, "r3_audit");
    return KrAdminBalanceSetResponse.parse({ v: 1, ok: true, effective: economyEffective() });
  } catch (err) {
    req.log.warn({ err }, "admin balance rejected");
    reply.code(400);
    return { ok: false, error: "BAD_REQUEST" };
  }
});

app.post("/admin/meta/grant-battle-pass-premium", async (req, reply) => {
  try {
    const token = req.headers["x-kr-admin-token"];
    if (!env.KR_ADMIN_TOKEN || token !== env.KR_ADMIN_TOKEN) {
      reply.code(401);
      return { ok: false, error: "UNAUTHORIZED" };
    }
    const body = z
      .object({
        userId: z.string().min(1),
        hasPremium: z.boolean().optional().default(true)
      })
      .parse(req.body);
    store.mutate((s) => setUserBattlePassPremium(s, body.userId, metaContent.seasonId, body.hasPremium));
    req.log.info(
      { krAudit: "admin_bp_premium", targetUserId: body.userId, hasPremium: body.hasPremium },
      "r3_audit"
    );
    return { v: 1, ok: true };
  } catch (err) {
    req.log.warn({ err }, "grant bp premium rejected");
    reply.code(400);
    return { ok: false, error: "BAD_REQUEST" };
  }
});

app.get("/daily-seed", async () => {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const dateUtc = `${yyyy}-${mm}-${dd}`;

  // Seed format is stable and safe to publish/share.
  const seed = `daily:${dateUtc}`;

  return KrDailySeedResponse.parse({
    ok: true,
    dateUtc,
    seed
  });
});

app.get("/catalog/units", async () => {
  return KrCatalogResponse.parse({
    v: 1,
    ok: true,
    catalog: content.catalog
  });
});

// ---------- Meta / season / cosmetics (R3) ----------
app.get("/season/view", async () => {
  return KrSeasonViewResponse.parse({ v: 1, ok: true, season: seasonDef });
});

app.get("/meta/progress", async (req, reply) => {
  try {
    const userId = requireAuth(req);
    const dateUtc = utcDate();
    const econ = economyEffective();
    const raw = buildMetaProgressView(store.snapshot(), metaContent, econ, userId, dateUtc);
    return KrMetaProgressResponse.parse(raw);
  } catch {
    reply.code(401);
    return { ok: false, error: "UNAUTHORIZED" };
  }
});

app.post("/meta/quest/claim", async (req, reply) => {
  try {
    const userId = requireAuth(req);
    const body = KrMetaQuestClaimRequest.parse(req.body);
    const dateUtc = utcDate();
    let rateLimited = false;
    let claimResult: ReturnType<typeof claimQuestReward> | undefined;
    store.mutate((s) => {
      if (!incCap(s, "meta_claim_actions", userId, dateUtc, 240)) {
        rateLimited = true;
        return;
      }
      claimResult = claimQuestReward(s, metaContent, userId, dateUtc, body.questId, body.idempotencyKey);
    });

    if (rateLimited) {
      reply.code(429);
      return { ok: false, error: "RATE_LIMITED" };
    }
    if (!claimResult) {
      reply.code(400);
      return { ok: false, error: "BAD_REQUEST" };
    }
    if (!claimResult.ok) {
      reply.code(400);
      return { ok: false, error: claimResult.error };
    }

    const inv = store.snapshot().inventory[userId];
    if (!inv) {
      reply.code(400);
      return { ok: false, error: "NOT_FOUND" };
    }

    req.log.info({ krAudit: "meta_quest_claim", userId, questId: body.questId }, "r3_audit");
    return KrMetaQuestClaimResponse.parse({
      v: 1,
      ok: true,
      questId: body.questId,
      granted: claimResult.granted,
      inventory: { gold: inv.gold, shards: inv.shards, keys: inv.keys }
    });
  } catch (err) {
    req.log.warn({ err }, "meta quest claim rejected");
    reply.code(400);
    return { ok: false, error: "BAD_REQUEST" };
  }
});

app.post("/meta/battle-pass/claim", async (req, reply) => {
  try {
    const userId = requireAuth(req);
    const body = KrMetaBattlePassClaimRequest.parse(req.body);
    const dateUtc = utcDate();
    let rateLimited = false;
    let bpResult: ReturnType<typeof claimBattlePassTier> | undefined;
    store.mutate((s) => {
      if (!incCap(s, "meta_claim_actions", userId, dateUtc, 240)) {
        rateLimited = true;
        return;
      }
      bpResult = claimBattlePassTier(s, metaContent, userId, dateUtc, body.tier, body.track, body.idempotencyKey);
    });

    if (rateLimited) {
      reply.code(429);
      return { ok: false, error: "RATE_LIMITED" };
    }
    if (!bpResult) {
      reply.code(400);
      return { ok: false, error: "BAD_REQUEST" };
    }
    if (!bpResult.ok) {
      reply.code(400);
      return { ok: false, error: bpResult.error };
    }

    const inv = store.snapshot().inventory[userId];
    if (!inv) {
      reply.code(400);
      return { ok: false, error: "NOT_FOUND" };
    }

    req.log.info({ krAudit: "meta_bp_claim", userId, tier: body.tier, track: body.track }, "r3_audit");
    return KrMetaBattlePassClaimResponse.parse({
      v: 1,
      ok: true,
      tier: body.tier,
      track: body.track,
      granted: bpResult.granted,
      inventory: { gold: inv.gold, shards: inv.shards, keys: inv.keys }
    });
  } catch (err) {
    req.log.warn({ err }, "meta battle pass claim rejected");
    reply.code(400);
    return { ok: false, error: "BAD_REQUEST" };
  }
});

app.get("/cosmetics/catalog", async () => {
  return KrCosmeticsCatalogResponse.parse({ v: 1, ok: true, cosmetics: metaContent.cosmetics });
});

app.get("/cosmetics/me", async (req, reply) => {
  try {
    const userId = requireAuth(req);
    const ownedBag = store.snapshot().cosmeticOwned[userId] ?? {};
    const owned = Object.keys(ownedBag).filter((id) => ownedBag[id]);
    const equippedRaw = store.snapshot().cosmeticEquipped[userId] ?? {};
    const equipped: Record<string, string> = {};
    for (const [slot, cid] of Object.entries(equippedRaw)) {
      if (typeof cid === "string" && cid.length > 0) equipped[slot] = cid;
    }
    return KrCosmeticsMeResponse.parse({ v: 1, ok: true, owned, equipped });
  } catch {
    reply.code(401);
    return { ok: false, error: "UNAUTHORIZED" };
  }
});

app.post("/cosmetics/equip", async (req, reply) => {
  try {
    const userId = requireAuth(req);
    const body = KrCosmeticsEquipRequest.parse(req.body);
    const def = metaContent.cosmetics.find((c) => c.id === body.cosmeticId);
    if (!def || def.slot !== body.slot) {
      reply.code(400);
      return { ok: false, error: "BAD_REQUEST" };
    }
    const owned = store.snapshot().cosmeticOwned[userId]?.[body.cosmeticId];
    if (!owned) {
      reply.code(400);
      return { ok: false, error: "NOT_OWNED" };
    }

    store.mutate((s) => {
      const eq = (s.cosmeticEquipped[userId] ??= {});
      eq[body.slot] = body.cosmeticId;
    });

    const equippedRaw = store.snapshot().cosmeticEquipped[userId] ?? {};
    const equipped: Record<string, string> = {};
    for (const [slot, cid] of Object.entries(equippedRaw)) {
      if (typeof cid === "string" && cid.length > 0) equipped[slot] = cid;
    }

    req.log.info({ krAudit: "cosmetics_equip", userId, slot: body.slot, cosmeticId: body.cosmeticId }, "r3_audit");
    return KrCosmeticsEquipResponse.parse({ v: 1, ok: true, equipped });
  } catch (err) {
    req.log.warn({ err }, "cosmetics equip rejected");
    reply.code(400);
    return { ok: false, error: "BAD_REQUEST" };
  }
});

// ---------- Monetization (MVP) ----------
app.get("/offers", async () => {
  if (!flags.isEnabled("monetization_offers")) return { ok: false, error: "DISABLED" };
  return KrOffersResponse.parse({ v: 1, ok: true, offers: OFFERS });
});

app.post("/checkout/create", async (req, reply) => {
  try {
    const userId = requireAuth(req);
    const userRow = store.snapshot().users[userId];
    /** Guests have no `emailNorm`; checkout must tie to a restorable account (R2.P1). */
    if (!userRow?.emailNorm || userRow.emailNorm.trim().length === 0) {
      reply.code(403);
      return { ok: false, error: "IDENTITY_REQUIRED" };
    }
    if (!flags.isEnabled("monetization_offers")) {
      reply.code(400);
      return { ok: false, error: "DISABLED" };
    }
    const body = KrCheckoutCreateRequest.parse(req.body);
    const offer = getOffer(body.offerId);
    if (!offer) {
      reply.code(400);
      return { ok: false, error: "BAD_REQUEST" };
    }

    // Create purchase row first (idempotency later via session id)
    const purchaseId = `p_${nanoid(16)}`;
    store.mutate((s) => {
      s.purchases[purchaseId] = {
        purchaseId,
        userId,
        offerId: offer.offerId,
        provider: env.STRIPE_SECRET_KEY ? "stripe" : "devstub",
        createdAtMs: Date.now()
      };
    });

    // Dev-stub mode: instantly fulfill and "redirect" back
    if (!env.STRIPE_SECRET_KEY) {
      grantOfferToUser(store, { userId, offerId: offer.offerId, purchaseId });
      const url = new URL(env.KR_PUBLIC_BASE_URL);
      url.searchParams.set("purchase", purchaseId);
      url.searchParams.set("status", "success");
      return KrCheckoutCreateResponse.parse({ v: 1, ok: true, url: url.toString(), provider: "devstub" });
    }

    // Stripe mode (skeleton): return a placeholder until keys are configured.
    // We keep this minimal: full Stripe Checkout Session wiring can be enabled by adding STRIPE_SECRET_KEY + webhook.
    const url = new URL(env.KR_PUBLIC_BASE_URL);
    url.searchParams.set("purchase", purchaseId);
    url.searchParams.set("status", "pending");
    return KrCheckoutCreateResponse.parse({ v: 1, ok: true, url: url.toString(), provider: "stripe" });
  } catch (err) {
    req.log.warn({ err }, "checkout create rejected");
    reply.code(400);
    return { ok: false, error: "BAD_REQUEST" };
  }
});

// Stripe webhook skeleton (no signature verification in this repo yet).
// In production: verify Stripe signature with STRIPE_WEBHOOK_SECRET and raw body.
app.post("/stripe/webhook", async (req, reply) => {
  try {
    const evt = req.body as any;
    const eventId = typeof evt?.id === "string" ? evt.id : null;
    if (!eventId) {
      reply.code(400);
      return { ok: false };
    }

    const already = store.snapshot().webhookProcessed[eventId];
    if (already) return { ok: true, ignored: true };

    const purchaseId = evt?.data?.object?.metadata?.purchaseId ?? evt?.data?.object?.client_reference_id;
    if (typeof purchaseId !== "string" || !purchaseId.startsWith("p_")) {
      store.mutate((s) => {
        s.webhookProcessed[eventId] = Date.now();
      });
      return { ok: true, ignored: true };
    }

    const p = store.snapshot().purchases[purchaseId];
    if (p && !p.fulfilledAtMs) {
      grantOfferToUser(store, { userId: p.userId, offerId: p.offerId, purchaseId });
    }

    store.mutate((s) => {
      s.webhookProcessed[eventId] = Date.now();
    });

    return { ok: true };
  } catch (err) {
    req.log.warn({ err }, "stripe webhook failed");
    reply.code(400);
    return { ok: false };
  }
});

app.get("/purchase/status", async (req, reply) => {
  try {
    const userId = requireAuth(req);
    // return latest fulfilled purchase id for UX (simple)
    const purchases = Object.values(store.snapshot().purchases)
      .filter((p) => p.userId === userId && p.fulfilledAtMs)
      .sort((a, b) => (b.fulfilledAtMs ?? 0) - (a.fulfilledAtMs ?? 0));
    return KrPurchaseStatusResponse.parse({
      v: 1,
      ok: true,
      lastPurchaseId: purchases[0]?.purchaseId
    });
  } catch {
    reply.code(401);
    return { ok: false, error: "UNAUTHORIZED" };
  }
});

/** R7 — Premium Battle Pass: mağaza makbuzu / purchase token sunucu doğrulaması. */
app.post("/iap/battle-pass/verify", async (req, reply) => {
  try {
    if (!flags.isEnabled("iap_battle_pass")) {
      reply.code(400);
      return { ok: false, error: "DISABLED" };
    }
    const userId = requireAuth(req);
    const row = store.snapshot().users[userId];
    if (!row?.emailNorm || row.emailNorm.trim().length === 0) {
      reply.code(403);
      return { ok: false, error: "IDENTITY_REQUIRED" };
    }

    const body = KrBattlePassIapVerifyRequest.parse(req.body);
    const expectedSku =
      body.platform === "ios" ? env.KR_IAP_BATTLE_PASS_PRODUCT_ID_IOS : env.KR_IAP_BATTLE_PASS_PRODUCT_ID_ANDROID;
    if (!expectedSku || body.productId !== expectedSku) {
      reply.code(400);
      return { ok: false, error: "BAD_PRODUCT" };
    }

    const dateUtc = utcDate();
    const rateOk = store.mutate((s) => incCap(s, "iap_bp_verify", userId, dateUtc, 40));
    if (!rateOk) {
      reply.code(429);
      return { ok: false, error: "RATE_LIMITED" };
    }

    const receiptTrim = body.receipt.trim();
    const fp = iapReceiptFingerprint(body.platform, body.productId, receiptTrim);

    let verifySource: "stub" | "ios" | "android";

    if (env.KR_IAP_ALLOW_STUB && receiptTrim === IAP_STUB_RECEIPT) {
      verifySource = "stub";
      req.log.warn({ krAudit: "iap_bp_stub", userId }, "r7_audit");
    } else if (body.platform === "ios") {
      const secret = env.KR_APPLE_IAP_SHARED_SECRET;
      if (!secret) {
        reply.code(503);
        return { ok: false, error: "NOT_CONFIGURED" };
      }
      const vr = await verifyAppleBattlePassProduct({
        receiptBase64: receiptTrim,
        sharedSecret: secret,
        expectedProductId: expectedSku
      });
      if (!vr.ok) {
        reply.code(400);
        return { ok: false, error: vr.reason };
      }
      verifySource = "ios";
    } else {
      const pkg = env.KR_GOOGLE_PLAY_PACKAGE_NAME;
      const saPath = env.KR_GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_PATH;
      if (!pkg || !saPath) {
        reply.code(503);
        return { ok: false, error: "NOT_CONFIGURED" };
      }
      const vr = await verifyAndroidProductPurchase({
        packageName: pkg,
        productId: expectedSku,
        purchaseToken: receiptTrim,
        serviceAccountKeyPath: saPath
      });
      if (!vr.ok) {
        reply.code(400);
        return { ok: false, error: vr.reason };
      }
      verifySource = "android";
    }

    try {
      store.mutate((s) => {
        const ex = s.iapGrants[fp];
        if (ex && ex.userId !== userId) throw new Error("TOKEN_OWNER_MISMATCH");
        setUserBattlePassPremium(s, userId, metaContent.seasonId, true);
        s.iapGrants[fp] = {
          userId,
          seasonId: metaContent.seasonId,
          atMs: Date.now(),
          platform: verifySource,
          productId: body.productId
        };
      });
    } catch (e) {
      if (e instanceof Error && e.message === "TOKEN_OWNER_MISMATCH") {
        reply.code(403);
        return { ok: false, error: "TOKEN_ALREADY_USED" };
      }
      throw e;
    }

    req.log.info(
      { krAudit: "iap_bp_verify_ok", userId, platform: body.platform, source: verifySource },
      "r7_audit"
    );

    return KrBattlePassIapVerifyResponseOk.parse({
      v: 1,
      ok: true,
      premium: true,
      seasonId: metaContent.seasonId
    });
  } catch (err) {
    req.log.warn({ err }, "iap battle-pass verify rejected");
    reply.code(400);
    return { ok: false, error: "BAD_REQUEST" };
  }
});

app.post("/auth/guest", async (req, reply) => {
  try {
    const body = KrAuthGuestRequest.parse(req.body);
    const now = Date.now();

    const userId = store.mutate((s) => {
      const existingUserId = s.deviceToUser[body.deviceId];
      if (existingUserId) return existingUserId;

      const uid = `u_${nanoid(12)}`;
      s.deviceToUser[body.deviceId] = uid;
      s.users[uid] = {
        userId: uid,
        deviceId: body.deviceId,
        createdAtMs: now
      };
      s.inventory[uid] = {
        userId: uid,
        gold: 0,
        shards: 0,
        keys: 0,
        updatedAtMs: now
      };
      return uid;
    });

    const { token, refreshToken } = issueAuthPair(userId);

    return KrAuthGuestResponse.parse({ v: 1, ok: true, userId, token, refreshToken });
  } catch (err) {
    req.log.warn({ err }, "guest auth rejected");
    reply.code(400);
    return { ok: false, error: "BAD_REQUEST" };
  }
});

app.post("/auth/refresh", async (req, reply) => {
  try {
    const body = KrAuthRefreshRequest.parse(req.body);
    const payload = verifyToken(body.refreshToken, env.KR_AUTH_SECRET);
    if (!payload || payload.typ !== "refresh") {
      reply.code(401);
      return { ok: false, error: "INVALID_REFRESH" };
    }
    const u = store.snapshot().users[payload.userId];
    if (!u) {
      reply.code(401);
      return { ok: false, error: "INVALID_REFRESH" };
    }
    if (!refreshCredentialValid(store.snapshot(), payload)) {
      reply.code(401);
      return { ok: false, error: "REFRESH_REPLAYED" };
    }
    const oldJti = typeof payload.jti === "string" && payload.jti.length >= 8 ? payload.jti : undefined;
    const { token, refreshToken } = issueAuthPair(payload.userId, oldJti);
    return KrAuthRefreshResponse.parse({ v: 1, ok: true, token, refreshToken });
  } catch (err) {
    req.log.warn({ err }, "refresh rejected");
    reply.code(400);
    return { ok: false, error: "BAD_REQUEST" };
  }
});

app.post("/auth/logout", async (req, reply) => {
  try {
    const userId = requireAuth(req);
    const body = KrAuthLogoutRequest.parse({
      v: 1,
      ...(typeof req.body === "object" && req.body !== null && !Array.isArray(req.body) ? (req.body as object) : {})
    });

    if (body.refreshToken) {
      const p = verifyToken(body.refreshToken, env.KR_AUTH_SECRET);
      if (!p || p.typ !== "refresh" || p.userId !== userId) {
        reply.code(400);
        return { ok: false, error: "BAD_REQUEST" };
      }
      const jti = typeof p.jti === "string" && p.jti.length >= 8 ? p.jti : "";
      if (!jti) {
        reply.code(400);
        return { ok: false, error: "BAD_REQUEST" };
      }
      store.mutate((s) => {
        if (s.refreshSessions[jti]?.userId === userId) delete s.refreshSessions[jti];
      });
    } else {
      store.mutate((s) => {
        for (const key of Object.keys(s.refreshSessions)) {
          if (s.refreshSessions[key]?.userId === userId) delete s.refreshSessions[key];
        }
      });
    }

    return KrAuthLogoutResponse.parse({ v: 1, ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      reply.code(401);
      return { ok: false, error: "UNAUTHORIZED" };
    }
    req.log.warn({ err }, "logout rejected");
    reply.code(400);
    return { ok: false, error: "BAD_REQUEST" };
  }
});

app.post("/auth/register-email", async (req, reply) => {
  try {
    const body = KrAuthRegisterEmailRequest.parse(req.body);
    const emailNorm = normalizeEmail(body.email);
    const now = Date.now();
    const { saltB64, hashB64 } = hashPassword(body.password);

    const created = store.mutate((s): { t: "ok"; userId: string } | { t: "err"; code: string } => {
      if (s.emailToUser[emailNorm]) return { t: "err", code: "EMAIL_TAKEN" };
      const uid = `u_${nanoid(12)}`;
      s.users[uid] = {
        userId: uid,
        deviceId: body.deviceId ?? "",
        createdAtMs: now,
        emailNorm,
        passwordSalt: saltB64,
        passwordHash: hashB64
      };
      s.emailToUser[emailNorm] = uid;
      if (body.deviceId) s.deviceToUser[body.deviceId] = uid;
      s.inventory[uid] = {
        userId: uid,
        gold: 0,
        shards: 0,
        keys: 0,
        updatedAtMs: now
      };
      return { t: "ok", userId: uid };
    });

    if (created.t === "err") {
      reply.code(409);
      return { ok: false, error: created.code };
    }

    const { token, refreshToken } = issueAuthPair(created.userId);
    return KrAuthRegisterEmailResponse.parse({
      v: 1,
      ok: true,
      userId: created.userId,
      token,
      refreshToken
    });
  } catch (err) {
    req.log.warn({ err }, "register-email rejected");
    reply.code(400);
    return { ok: false, error: "BAD_REQUEST" };
  }
});

app.post("/auth/login-email", async (req, reply) => {
  try {
    const body = KrAuthLoginEmailRequest.parse(req.body);
    const emailNorm = normalizeEmail(body.email);
    const snap = store.snapshot();
    const uidFound = snap.emailToUser[emailNorm];
    const u = uidFound ? snap.users[uidFound] : undefined;
    if (
      !u ||
      !u.passwordSalt ||
      !u.passwordHash ||
      !verifyPassword(body.password, u.passwordSalt, u.passwordHash)
    ) {
      reply.code(401);
      return { ok: false, error: "INVALID_CREDENTIALS" };
    }
    if (body.deviceId) {
      const bindDeviceId = body.deviceId;
      store.mutate((s) => {
        s.deviceToUser[bindDeviceId] = u.userId;
      });
    }
    const { token, refreshToken } = issueAuthPair(u.userId);
    return KrAuthLoginEmailResponse.parse({
      v: 1,
      ok: true,
      userId: u.userId,
      token,
      refreshToken
    });
  } catch (err) {
    req.log.warn({ err }, "login-email rejected");
    reply.code(400);
    return { ok: false, error: "BAD_REQUEST" };
  }
});

app.post("/auth/link-email", async (req, reply) => {
  try {
    const userId = requireAuth(req);
    const body = KrAuthLinkEmailRequest.parse(req.body);
    const emailNorm = normalizeEmail(body.email);
    const { saltB64, hashB64 } = hashPassword(body.password);

    const out = store.mutate((s): { t: "ok" } | { t: "err"; code: string } => {
      const u = s.users[userId];
      if (!u) return { t: "err", code: "UNAUTHORIZED" };
      if (u.emailNorm) return { t: "err", code: "ALREADY_LINKED" };
      if (s.emailToUser[emailNorm]) return { t: "err", code: "EMAIL_TAKEN" };
      u.emailNorm = emailNorm;
      u.passwordSalt = saltB64;
      u.passwordHash = hashB64;
      s.emailToUser[emailNorm] = userId;
      return { t: "ok" };
    });

    if (out.t === "err") {
      reply.code(out.code === "UNAUTHORIZED" ? 401 : 409);
      return { ok: false, error: out.code };
    }

    const { token, refreshToken } = issueAuthPair(userId);
    return KrAuthLinkEmailResponse.parse({
      v: 1,
      ok: true,
      userId,
      token,
      refreshToken
    });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      reply.code(401);
      return { ok: false, error: "UNAUTHORIZED" };
    }
    req.log.warn({ err }, "link-email rejected");
    reply.code(400);
    return { ok: false, error: "BAD_REQUEST" };
  }
});

app.post("/auth/oauth/google", async (req, reply) => {
  try {
    if (!env.KR_GOOGLE_CLIENT_ID) {
      reply.code(503);
      return { ok: false, error: "OAUTH_DISABLED" };
    }
    const body = KrAuthGoogleRequest.parse(req.body);
    const { sub, email } = await verifyGoogleIdToken(body.credential, env.KR_GOOGLE_CLIENT_ID);
    const emailNorm = normalizeEmail(email);
    const key = `google:${sub}`;
    const now = Date.now();

    const created = store.mutate((s): { t: "ok"; userId: string } | { t: "err"; code: string } => {
      const mappedUid = s.oauthSubjectToUser[key];
      if (mappedUid) {
        const u = s.users[mappedUid];
        if (u) return { t: "ok", userId: mappedUid };
        delete s.oauthSubjectToUser[key];
      }

      const byEmail = s.emailToUser[emailNorm];
      if (byEmail) {
        const u = s.users[byEmail];
        if (!u) {
          delete s.emailToUser[emailNorm];
        } else {
          if (u.googleSub && u.googleSub !== sub) return { t: "err", code: "GOOGLE_ACCOUNT_CONFLICT" };
          s.oauthSubjectToUser[key] = byEmail;
          u.googleSub = sub;
          if (!u.emailNorm) u.emailNorm = emailNorm;
          return { t: "ok", userId: byEmail };
        }
      }

      const uid = `u_${nanoid(12)}`;
      s.users[uid] = {
        userId: uid,
        deviceId: body.deviceId ?? "",
        createdAtMs: now,
        emailNorm,
        googleSub: sub
      };
      s.emailToUser[emailNorm] = uid;
      s.oauthSubjectToUser[key] = uid;
      s.inventory[uid] = {
        userId: uid,
        gold: 0,
        shards: 0,
        keys: 0,
        updatedAtMs: now
      };
      return { t: "ok", userId: uid };
    });

    if (created.t === "err") {
      reply.code(409);
      return { ok: false, error: created.code };
    }

    if (body.deviceId) {
      const bind = body.deviceId;
      store.mutate((s) => {
        s.deviceToUser[bind] = created.userId;
      });
    }

    const { token, refreshToken } = issueAuthPair(created.userId);
    return KrAuthGoogleResponse.parse({
      v: 1,
      ok: true,
      userId: created.userId,
      token,
      refreshToken
    });
  } catch (err) {
    req.log.warn({ err }, "oauth google rejected");
    if (err instanceof z.ZodError) {
      reply.code(400);
      return { ok: false, error: "BAD_REQUEST" };
    }
    reply.code(401);
    return { ok: false, error: "BAD_GOOGLE_TOKEN" };
  }
});

app.post("/auth/link-google", async (req, reply) => {
  try {
    if (!env.KR_GOOGLE_CLIENT_ID) {
      reply.code(503);
      return { ok: false, error: "OAUTH_DISABLED" };
    }
    const userId = requireAuth(req);
    const body = KrAuthLinkGoogleRequest.parse(req.body);
    const { sub, email } = await verifyGoogleIdToken(body.credential, env.KR_GOOGLE_CLIENT_ID);
    const emailNorm = normalizeEmail(email);
    const key = `google:${sub}`;

    const out = store.mutate((s): { t: "ok" } | { t: "err"; code: string } => {
      const mapped = s.oauthSubjectToUser[key];
      if (mapped === userId) return { t: "ok" };
      if (mapped && mapped !== userId) return { t: "err", code: "GOOGLE_SUB_TAKEN" };

      const u = s.users[userId];
      if (!u) return { t: "err", code: "UNAUTHORIZED" };

      if (u.emailNorm && u.emailNorm !== emailNorm) return { t: "err", code: "GOOGLE_EMAIL_MISMATCH" };

      if (!u.emailNorm) {
        const owner = s.emailToUser[emailNorm];
        if (owner && owner !== userId) return { t: "err", code: "EMAIL_TAKEN" };
        u.emailNorm = emailNorm;
        s.emailToUser[emailNorm] = userId;
      }

      if (u.googleSub && u.googleSub !== sub) return { t: "err", code: "GOOGLE_ACCOUNT_CONFLICT" };

      u.googleSub = sub;
      s.oauthSubjectToUser[key] = userId;
      return { t: "ok" };
    });

    if (out.t === "err") {
      reply.code(out.code === "UNAUTHORIZED" ? 401 : 409);
      return { ok: false, error: out.code };
    }

    const { token, refreshToken } = issueAuthPair(userId);
    return KrAuthLinkGoogleResponse.parse({
      v: 1,
      ok: true,
      userId,
      token,
      refreshToken
    });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      reply.code(401);
      return { ok: false, error: "UNAUTHORIZED" };
    }
    req.log.warn({ err }, "link-google rejected");
    if (err instanceof z.ZodError) {
      reply.code(400);
      return { ok: false, error: "BAD_REQUEST" };
    }
    reply.code(401);
    return { ok: false, error: "BAD_GOOGLE_TOKEN" };
  }
});

app.get("/me", async (req, reply) => {
  try {
    const userId = requireAuth(req);
    const u = store.snapshot().users[userId];
    if (!u) {
      reply.code(401);
      return { ok: false, error: "UNAUTHORIZED" };
    }
    return KrMeResponse.parse({
      v: 1,
      ok: true,
      userId,
      createdAtMs: u.createdAtMs,
      email: u.emailNorm ?? null
    });
  } catch {
    reply.code(401);
    return { ok: false, error: "UNAUTHORIZED" };
  }
});

app.get("/inventory", async (req, reply) => {
  try {
    const userId = requireAuth(req);
    const inv = store.snapshot().inventory[userId];
    if (!inv) {
      reply.code(404);
      return { ok: false, error: "NOT_FOUND" };
    }
    return KrInventoryResponse.parse({
      v: 1,
      ok: true,
      inventory: {
        v: 1,
        userId,
        currency: { gold: inv.gold, shards: inv.shards, keys: inv.keys }
      }
    });
  } catch {
    reply.code(401);
    return { ok: false, error: "UNAUTHORIZED" };
  }
});

function capKey(kind: string, userId: string, dateUtc: string) {
  return `${kind}:${userId}:${dateUtc}`;
}

function incCap(s: any, kind: string, userId: string, dateUtc: string, max: number): boolean {
  const k = capKey(kind, userId, dateUtc);
  const v = (s.caps[k] ?? 0) | 0;
  if (v >= max) return false;
  s.caps[k] = v + 1;
  return true;
}

app.post("/daily/claim", async (req, reply) => {
  try {
    const userId = requireAuth(req);
    const dateUtc = utcDate();
    const key = `${userId}:${dateUtc}`;
    const now = Date.now();
    const econ = economyEffective();

    const out = store.mutate((s) => {
      const inv = s.inventory[userId];
      if (!inv) throw new Error("NOT_FOUND");

      const already = s.dailyClaims[key];
      if (already) {
        return {
          claimed: false,
          delta: null as null | { gold: number; shards: number; keys: number },
          inv
        };
      }

      const delta = { gold: econ.dailyClaimGold, shards: econ.dailyClaimShards, keys: econ.dailyClaimKeys };
      inv.gold = (inv.gold + delta.gold) | 0;
      inv.shards = (inv.shards + delta.shards) | 0;
      inv.keys = (inv.keys + delta.keys) | 0;
      inv.updatedAtMs = now;
      s.dailyClaims[key] = { userId, dateUtc, claimedAtMs: now };

      onDailyClaimSuccess(s, metaContent, econ, userId, dateUtc);

      return { claimed: true, delta, inv };
    });

    return KrDailyClaimResponse.parse({
      v: 1,
      ok: true,
      dateUtc,
      claimed: out.claimed,
      delta: out.delta ?? undefined,
      inventory: {
        v: 1,
        userId,
        currency: { gold: out.inv.gold, shards: out.inv.shards, keys: out.inv.keys }
      }
    });
  } catch (err) {
    req.log.warn({ err }, "daily claim rejected");
    reply.code(401);
    return { ok: false, error: "UNAUTHORIZED" };
  }
});

// ---------- Leaderboard (daily) ----------
app.post("/leaderboard/submit", async (req, reply) => {
  try {
    const userId = requireAuth(req);
    const body = KrLeaderboardSubmitRequest.parse(req.body);

    // Server-run simulation: accept battleRequest (same shape as /sim/battle request)
    const sim = runBattleSim(body.battleRequest);

    const remainingHp =
      Object.values(sim.remaining.a).reduce((a, v) => a + (typeof v === "number" ? v : 0), 0) | 0;
    const win = sim.outcome === "a";
    const score = ((win ? 1000 : 0) + remainingHp - (sim.ticks | 0)) | 0;

    const now = Date.now();
    const econ = economyEffective();

    let rateLimited = false;
    const entry = store.mutate((s): LeaderboardEntryRow | null => {
      if (!incCap(s, "leaderboard_submit", userId, body.dateUtc, 48)) {
        rateLimited = true;
        return null;
      }
      const day = (s.leaderboard[body.dateUtc] ??= {});
      const prev = day[userId];
      if (!prev || score > prev.score) {
        day[userId] = {
          userId,
          dateUtc: body.dateUtc,
          score,
          ticks: sim.ticks | 0,
          remainingHp,
          updatedAtMs: now
        };
      }
      onLeaderboardSubmit(s, metaContent, econ, userId, body.dateUtc, true);
      return day[userId]!;
    });

    if (rateLimited) {
      reply.code(429);
      return { ok: false, error: "RATE_LIMITED" };
    }
    if (!entry) {
      reply.code(400);
      return { ok: false, error: "BAD_REQUEST" };
    }

    const day = store.snapshot().leaderboard[body.dateUtc] ?? {};
    const sorted = Object.values(day).sort((a, b) => b.score - a.score);
    const rank = Math.max(
      1,
      sorted.findIndex((e) => e.userId === userId) + 1
    );

    return KrLeaderboardSubmitResponse.parse({
      v: 1,
      ok: true,
      dateUtc: body.dateUtc,
      entry: { userId: entry.userId, score: entry.score, ticks: entry.ticks, remainingHp: entry.remainingHp },
      rank,
      total: Math.max(1, sorted.length)
    });
  } catch (err) {
    req.log.warn({ err }, "leaderboard submit rejected");
    reply.code(400);
    return { ok: false, error: "BAD_REQUEST" };
  }
});

app.get("/leaderboard/daily", async (req, reply) => {
  const dateUtc = typeof req.query === "object" && req.query && "date" in req.query ? String((req.query as any).date) : utcDate();
  const limit = typeof req.query === "object" && req.query && "limit" in req.query ? Math.max(1, Math.min(200, Number((req.query as any).limit) || 50)) : 50;
  const day = store.snapshot().leaderboard[dateUtc] ?? {};
  const sorted = Object.values(day).sort((a, b) => b.score - a.score).slice(0, limit);
  return KrLeaderboardTopResponse.parse({
    v: 1,
    ok: true,
    dateUtc,
    entries: sorted.map((e) => ({ userId: e.userId, score: e.score, ticks: e.ticks, remainingHp: e.remainingHp }))
  });
});

app.get("/leaderboard/me", async (req, reply) => {
  try {
    const userId = requireAuth(req);
    const dateUtc = typeof req.query === "object" && req.query && "date" in req.query ? String((req.query as any).date) : utcDate();
    const day = store.snapshot().leaderboard[dateUtc] ?? {};
    const sorted = Object.values(day).sort((a, b) => b.score - a.score);
    const total = Math.max(1, sorted.length);
    const entry = day[userId];
    const rank = entry ? sorted.findIndex((e) => e.userId === userId) + 1 : undefined;
    return KrLeaderboardMeResponse.parse({
      v: 1,
      ok: true,
      dateUtc,
      total,
      entry: entry ? { userId: entry.userId, score: entry.score, ticks: entry.ticks, remainingHp: entry.remainingHp } : undefined,
      rank: rank && rank > 0 ? rank : undefined
    });
  } catch {
    reply.code(401);
    return { ok: false, error: "UNAUTHORIZED" };
  }
});

// ---------- Referral ----------
app.post("/referral/accept", async (req, reply) => {
  try {
    const userId = requireAuth(req);
    const body = KrReferralAcceptRequest.parse(req.body);
    if (body.referrerUserId === userId) {
      return KrReferralAcceptResponse.parse({ v: 1, ok: true, accepted: false });
    }
    const dateUtc = utcDate();
    const now = Date.now();
    const reward = { gold: 80, shards: 4 };

    const out = store.mutate((s) => {
      if (s.referrals[userId]) return { accepted: false, rewarded: false };
      // cap referrer daily rewards
      const okCap = incCap(s, "refReward", body.referrerUserId, dateUtc, 10);
      if (!okCap) return { accepted: false, rewarded: false };

      s.referrals[userId] = {
        referrerUserId: body.referrerUserId,
        newUserId: userId,
        createdAtMs: now,
        rewardedAtMs: now
      };

      const invNew = s.inventory[userId];
      const invRef = s.inventory[body.referrerUserId];
      if (invNew) {
        invNew.gold = (invNew.gold + reward.gold) | 0;
        invNew.shards = (invNew.shards + reward.shards) | 0;
        invNew.updatedAtMs = now;
      }
      if (invRef) {
        invRef.gold = (invRef.gold + reward.gold) | 0;
        invRef.shards = (invRef.shards + reward.shards) | 0;
        invRef.updatedAtMs = now;
      }

      return { accepted: true, rewarded: true };
    });

    return KrReferralAcceptResponse.parse({
      v: 1,
      ok: true,
      accepted: out.accepted,
      rewardGold: out.accepted ? reward.gold : undefined,
      rewardShards: out.accepted ? reward.shards : undefined
    });
  } catch (err) {
    req.log.warn({ err }, "referral accept rejected");
    reply.code(400);
    return { ok: false, error: "BAD_REQUEST" };
  }
});

app.get("/referral/status", async (req, reply) => {
  try {
    const userId = requireAuth(req);
    const edge = store.snapshot().referrals[userId];
    return KrReferralStatusResponse.parse({
      v: 1,
      ok: true,
      referrerUserId: edge?.referrerUserId,
      rewarded: Boolean(edge?.rewardedAtMs)
    });
  } catch {
    reply.code(401);
    return { ok: false, error: "UNAUTHORIZED" };
  }
});

// ---------- Share tickets ----------
app.post("/share/ticket", async (req, reply) => {
  try {
    const userId = requireAuth(req);
    const dateUtc = utcDate();
    const now = Date.now();
    const ttlMs = 1000 * 60 * 60 * 24; // 24h
    const maxDaily = 20;

    const out = store.mutate((s) => {
      const okCap = incCap(s, "shareTicket", userId, dateUtc, maxDaily);
      if (!okCap) return null;
      const ticketId = `t_${nanoid(16)}`;
      s.shareTickets[ticketId] = {
        ticketId,
        issuerUserId: userId,
        dateUtc,
        createdAtMs: now,
        expiresAtMs: now + ttlMs
      };
      return { ticketId, expiresAtMs: now + ttlMs };
    });

    if (!out) {
      reply.code(400);
      return { ok: false, error: "BAD_REQUEST" };
    }
    return KrShareTicketCreateResponse.parse({ v: 1, ok: true, ...out });
  } catch (err) {
    req.log.warn({ err }, "share ticket rejected");
    reply.code(400);
    return { ok: false, error: "BAD_REQUEST" };
  }
});

app.post("/share/redeem", async (req, reply) => {
  try {
    const userId = requireAuth(req);
    const body = KrShareRedeemRequest.parse(req.body);
    const now = Date.now();
    const reward = { gold: 40, shards: 2 };

    const out = store.mutate((s) => {
      const t = s.shareTickets[body.ticketId];
      if (!t) return { redeemed: false, rewarded: false };
      if (t.expiresAtMs < now) return { redeemed: false, rewarded: false };
      if (t.redeemedAtMs) return { redeemed: false, rewarded: false };
      if (t.issuerUserId === userId) return { redeemed: false, rewarded: false };

      t.redeemedByUserId = userId;
      t.redeemedAtMs = now;

      const invRedeemer = s.inventory[userId];
      const invIssuer = s.inventory[t.issuerUserId];
      if (invRedeemer) {
        invRedeemer.gold = (invRedeemer.gold + reward.gold) | 0;
        invRedeemer.shards = (invRedeemer.shards + reward.shards) | 0;
        invRedeemer.updatedAtMs = now;
      }
      if (invIssuer) {
        invIssuer.gold = (invIssuer.gold + reward.gold) | 0;
        invIssuer.shards = (invIssuer.shards + reward.shards) | 0;
        invIssuer.updatedAtMs = now;
      }

      return { redeemed: true, rewarded: true };
    });

    return KrShareRedeemResponse.parse({
      v: 1,
      ok: true,
      redeemed: out.redeemed,
      rewardGold: out.redeemed ? reward.gold : undefined,
      rewardShards: out.redeemed ? reward.shards : undefined
    });
  } catch (err) {
    req.log.warn({ err }, "share redeem rejected");
    reply.code(400);
    return { ok: false, error: "BAD_REQUEST" };
  }
});

app.get("/shop/daily", async (req) => {
  const userId = req.krUserId; // optional personalization if logged in
  const dateUtc = utcDate();
  const econ = economyEffective();
  const offers = makeDailyOffers({ dateUtc, content, userId, shopGoldMulPct: econ.shopGoldMulPct }).map((o) => ({
    offerId: o.offerId,
    archetype: o.archetype,
    priceGold: o.priceGold,
    qty: o.qty
  }));

  return KrDailyShopResponse.parse({
    v: 1,
    ok: true,
    dateUtc,
    contentVersion: content.catalog.contentVersion,
    offers
  });
});

app.post("/shop/buy", async (req, reply) => {
  try {
    const userId = requireAuth(req);
    const body = KrShopBuyRequest.parse(req.body);
    const dateUtc = utcDate();
    const econ = economyEffective();
    const offers = makeDailyOffers({ dateUtc, content, userId, shopGoldMulPct: econ.shopGoldMulPct });
    const offer = offers.find((o) => o.offerId === body.offerId);
    if (!offer) {
      reply.code(400);
      return { ok: false, error: "BAD_REQUEST" };
    }

    const out = store.mutate((s) => {
      const inv = s.inventory[userId];
      if (!inv) throw new Error("NOT_FOUND");
      if (inv.gold < offer.priceGold) throw new Error("INSUFFICIENT");
      inv.gold = (inv.gold - offer.priceGold) | 0;
      inv.updatedAtMs = Date.now();

      const owned = (s.ownedUnits[userId] ??= {});
      const row = owned[offer.archetype];
      if (!row) owned[offer.archetype] = { archetype: offer.archetype, level: 1 };
      else row.level = Math.max(1, row.level);

      onShopBuy(s, metaContent, userId, dateUtc);

      return { inv, owned };
    });

    const ownedLevels: Record<string, number> = {};
    for (const [k, v] of Object.entries(out.owned)) ownedLevels[k] = v.level;

    return KrShopBuyResponse.parse({
      v: 1,
      ok: true,
      offerId: body.offerId,
      gold: out.inv.gold,
      shards: out.inv.shards,
      keys: out.inv.keys,
      owned: ownedLevels
    });
  } catch (err) {
    req.log.warn({ err }, "shop buy rejected");
    reply.code(400);
    return { ok: false, error: "BAD_REQUEST" };
  }
});

app.get("/units/owned", async (req, reply) => {
  try {
    const userId = requireAuth(req);
    const owned = store.snapshot().ownedUnits[userId] ?? {};
    return KrOwnedUnitsResponse.parse({
      v: 1,
      ok: true,
      owned: Object.values(owned).map((u) => ({ archetype: u.archetype, level: u.level }))
    });
  } catch {
    reply.code(401);
    return { ok: false, error: "UNAUTHORIZED" };
  }
});

app.post("/units/upgrade", async (req, reply) => {
  try {
    const userId = requireAuth(req);
    const body = KrUpgradeUnitRequest.parse(req.body);
    if (!content.unitById.has(body.archetype)) {
      reply.code(400);
      return { ok: false, error: "BAD_REQUEST" };
    }

    const out = store.mutate((s) => {
      const inv = s.inventory[userId];
      if (!inv) throw new Error("NOT_FOUND");
      const owned = (s.ownedUnits[userId] ??= {});
      const row = owned[body.archetype];
      if (!row) throw new Error("NOT_OWNED");

      const econ = economyEffective();
      const cost = upgradeCost(row.level, econ.upgradeGoldMulPct, econ.upgradeShardMulPct);
      if (inv.gold < cost.gold || inv.shards < cost.shards) throw new Error("INSUFFICIENT");
      inv.gold = (inv.gold - cost.gold) | 0;
      inv.shards = (inv.shards - cost.shards) | 0;
      inv.updatedAtMs = Date.now();
      row.level = (row.level + 1) | 0;

      return { inv, level: row.level };
    });

    return KrUpgradeUnitResponse.parse({
      v: 1,
      ok: true,
      archetype: body.archetype,
      level: out.level,
      gold: out.inv.gold,
      shards: out.inv.shards,
      keys: out.inv.keys
    });
  } catch (err) {
    req.log.warn({ err }, "upgrade rejected");
    reply.code(400);
    return { ok: false, error: "BAD_REQUEST" };
  }
});

app.post("/sim/battle", async (req, reply) => {
  try {
    const res = runBattleSim(req.body);
    return res;
  } catch (err) {
    req.log.warn({ err }, "battle sim request rejected");
    reply.code(400);
    return {
      ok: false,
      error: "BAD_REQUEST"
    };
  }
});

await app.listen({ port: env.KR_PORT, host: env.KR_HOST });

