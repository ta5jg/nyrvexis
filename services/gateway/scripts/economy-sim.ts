/* =============================================================================
 * File:           services/gateway/scripts/economy-sim.ts
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

/**
 * Faz 11 — lightweight economy projection (offline, read-only).
 * Keeps formulas aligned with `meta.v0.1.0.json` defaults + shop base prices.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { KrMetaContent } from "@kindrail/protocol";
import { dailyOfferBaseGold, upgradeCost } from "../src/meta/shop.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const metaPath = path.join(__dirname, "../src/content/catalogs/meta.v0.1.0.json");

const meta = KrMetaContent.parse(JSON.parse(readFileSync(metaPath, "utf8")));
const e = meta.economyDefaults;

const days = Number(process.argv[2] || 30);
let gold = 400;
let shards = 40;
let shopBuys = 0;
let upgrades = 0;

for (let d = 0; d < days; d++) {
  gold += e.dailyClaimGold;
  shards += e.dailyClaimShards;
  const price0 = Math.max(1, Math.floor((dailyOfferBaseGold(0) * e.shopGoldMulPct) / 100));
  if (gold >= price0) {
    gold -= price0;
    shopBuys += 1;
  }
  const cost = upgradeCost(1, e.upgradeGoldMulPct, e.upgradeShardMulPct);
  if (gold >= cost.gold && shards >= cost.shards) {
    gold -= cost.gold;
    shards -= cost.shards;
    upgrades += 1;
  }
}

console.log(`KINDRAIL economy sim — ${days} days (defaults from ${meta.contentVersion})`);
console.log({ endGold: gold, endShards: shards, shopBuys, upgrades, dailyClaimGold: e.dailyClaimGold });
