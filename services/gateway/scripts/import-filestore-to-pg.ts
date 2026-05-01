/* =============================================================================
 * File:           services/gateway/scripts/import-filestore-to-pg.ts
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
 * One-shot: copy .kr-data/store.json into Postgres gateway_state row.
 * Usage: KR_DATABASE_URL=... KR_STORE_DIR=.kr-data pnpm --filter @kindrail/gateway db:import-filestore
 */
import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { normalizePartialStoreState, type StoreState } from "../src/store/store.js";

async function main() {
  const url = process.env.KR_DATABASE_URL;
  const dir = process.env.KR_STORE_DIR ?? ".kr-data";
  if (!url) {
    console.error("KR_DATABASE_URL required");
    process.exit(1);
  }
  const file = path.join(dir, "store.json");
  const raw = fs.readFileSync(file, "utf8");
  const parsed = JSON.parse(raw) as Partial<StoreState>;
  const state = normalizePartialStoreState(parsed);
  const pool = new pg.Pool({ connectionString: url });
  try {
    await pool.query(
      `INSERT INTO gateway_state (id, body, updated_at)
       VALUES ($1, $2::jsonb, now())
       ON CONFLICT (id) DO UPDATE SET body = EXCLUDED.body, updated_at = now()`,
      ["main", JSON.stringify(state)]
    );
    console.log("import ok from", file);
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
