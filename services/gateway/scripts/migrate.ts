/* =============================================================================
 * File:           services/gateway/scripts/migrate.ts
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
 * Applies SQL files in services/gateway/migrations/*.sql in lexical order.
 * Usage: KR_DATABASE_URL=postgres://... pnpm --filter @nyrvexis/gateway db:migrate
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, "..", "migrations");

async function main() {
  const url = process.env.KR_DATABASE_URL;
  if (!url || url.length < 8) {
    console.error("KR_DATABASE_URL is required (postgres connection string).");
    process.exit(1);
  }
  const pool = new pg.Pool({ connectionString: url });
  try {
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
    if (files.length === 0) {
      console.error("No .sql files in migrations/");
      process.exit(1);
    }
    for (const f of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, f), "utf8");
      console.log("apply:", f);
      await pool.query(sql);
    }
    console.log("migrations ok");
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
