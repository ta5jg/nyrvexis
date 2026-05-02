#!/usr/bin/env node
/**
 * Calls gateway POST /sim/battle with the canonical 2v2 demo request and writes
 * Unity Resources bundle: request + result (KindrailBattleExportDto).
 *
 * Usage: GATEWAY_URL=http://127.0.0.1:8787 node scripts/export-golden-unity-battle.mjs
 */

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(
  __dirname,
  "../apps/game-unity/UnityPackage/Assets/Kindrail/Resources/kindrail-golden-battle-export.json"
);

const base =
  (process.env.GATEWAY_URL ?? "http://127.0.0.1:8787").replace(/\/+$/, "") + "/sim/battle";

const request = {
  v: 1,
  seed: { seed: `golden-${new Date().toISOString().slice(0, 10)}-export` },
  a: {
    name: "RAIL",
    units: [
      { id: "a1", archetype: "soldier", hp: 30, atk: 8, def: 2, spd: 10, slot: 0, critPct: 10, critMulPct: 150 },
      { id: "a2", archetype: "archer", hp: 18, atk: 10, def: 1, spd: 12, slot: 6, critPct: 5, critMulPct: 175 }
    ]
  },
  b: {
    name: "RIFT",
    units: [
      { id: "b1", archetype: "brute", hp: 40, atk: 7, def: 3, spd: 8, slot: 0, critPct: 0, critMulPct: 150 },
      { id: "b2", archetype: "rogue", hp: 20, atk: 9, def: 1, spd: 14, slot: 6, critPct: 15, critMulPct: 160 }
    ]
  },
  maxTicks: 8000
};

const res = await fetch(base, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(request)
});

if (!res.ok) {
  const t = await res.text();
  console.error(`HTTP ${res.status}: ${t}`);
  process.exit(1);
}

const result = await res.json();
if (result?.ok === false) {
  console.error(result);
  process.exit(1);
}

const bundle = { request, result };
await writeFile(outPath, JSON.stringify(bundle, null, 2), "utf8");

console.log(`Wrote ${outPath}`);
