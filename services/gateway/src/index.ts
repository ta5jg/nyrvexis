import Fastify from "fastify";
import cors from "@fastify/cors";
import { nanoid } from "nanoid";
import {
  HealthResponse,
  KrAuthGuestRequest,
  KrAuthGuestResponse,
  KrCatalogResponse,
  KrDailyClaimResponse,
  KrDailySeedResponse,
  KrDailyShopResponse,
  KrInventoryResponse,
  KrMeResponse,
  KrOwnedUnitsResponse,
  KrShopBuyRequest,
  KrShopBuyResponse,
  KrUpgradeUnitRequest,
  KrUpgradeUnitResponse
} from "@kindrail/protocol";
import { readEnv } from "./env.js";
import { runBattleSim } from "./sim/battleSim.js";
import { registerAuth, requireAuth } from "./auth/middleware.js";
import { issueSessionToken } from "./auth/token.js";
import { FileStore } from "./store/store.js";
import { loadContent } from "./content/loader.js";
import { makeDailyOffers, upgradeCost } from "./meta/shop.js";

const env = readEnv();

const store = new FileStore({ dir: env.KR_STORE_DIR });
await store.load();
const content = await loadContent();

const app = Fastify({
  logger: {
    level: "info"
  }
});

await app.register(cors, {
  origin: true,
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

app.get("/health", async () => {
  const body = HealthResponse.parse({
    ok: true,
    service: "kindrail-gateway",
    version: env.KR_SERVICE_VERSION,
    nowMs: Date.now()
  });
  return body;
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

    const token = issueSessionToken({
      userId,
      ttlMs: env.KR_SESSION_TTL_MS,
      secret: env.KR_AUTH_SECRET
    });

    return KrAuthGuestResponse.parse({ v: 1, ok: true, userId, token });
  } catch (err) {
    req.log.warn({ err }, "guest auth rejected");
    reply.code(400);
    return { ok: false, error: "BAD_REQUEST" };
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
    return KrMeResponse.parse({ v: 1, ok: true, userId, createdAtMs: u.createdAtMs });
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

function utcDate(d: Date = new Date()): string {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

app.post("/daily/claim", async (req, reply) => {
  try {
    const userId = requireAuth(req);
    const dateUtc = utcDate();
    const key = `${userId}:${dateUtc}`;
    const now = Date.now();

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

      // v0 rewards (tunable later)
      const delta = { gold: 120, shards: 8, keys: 0 };
      inv.gold = (inv.gold + delta.gold) | 0;
      inv.shards = (inv.shards + delta.shards) | 0;
      inv.keys = (inv.keys + delta.keys) | 0;
      inv.updatedAtMs = now;
      s.dailyClaims[key] = { userId, dateUtc, claimedAtMs: now };

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

app.get("/shop/daily", async (req) => {
  const userId = req.krUserId; // optional personalization if logged in
  const dateUtc = utcDate();
  const offers = makeDailyOffers({ dateUtc, content, userId }).map((o) => ({
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
    const offers = makeDailyOffers({ dateUtc, content, userId });
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

      const cost = upgradeCost(row.level);
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

