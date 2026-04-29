import Fastify from "fastify";
import cors from "@fastify/cors";
import { nanoid } from "nanoid";
import { HealthResponse, KrDailySeedResponse } from "@kindrail/protocol";
import { readEnv } from "./env.js";
import { runBattleSim } from "./sim/battleSim.js";

const env = readEnv();

const app = Fastify({
  logger: {
    level: "info"
  }
});

await app.register(cors, {
  origin: true,
  credentials: false
});

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

