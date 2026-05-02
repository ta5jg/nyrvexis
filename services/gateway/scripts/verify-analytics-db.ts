/* =============================================================================
 * Postgres-only smoke: apply migrations, insert one analytics row, read it back.
 * Usage (repo root): KR_DATABASE_URL=postgres://... pnpm --filter @nyrvexis/gateway db:verify-analytics-db
 * ============================================================================= */

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const gatewayRoot = path.join(__dirname, "..");

async function main() {
  const url = process.env.KR_DATABASE_URL;
  if (!url || url.length < 8) {
    console.error("KR_DATABASE_URL is required (postgres URL).");
    process.exit(1);
  }

  const mig = spawnSync("pnpm", ["exec", "tsx", "scripts/migrate.ts"], {
    cwd: gatewayRoot,
    env: process.env,
    stdio: "inherit"
  });
  if (mig.status !== 0) process.exit(mig.status ?? 1);

  const pool = new pg.Pool({ connectionString: url });
  const name = `verify.db.${Date.now()}`;
  try {
    await pool.query(
      `INSERT INTO analytics_events (user_id, name, props) VALUES ($1, $2, $3::jsonb)`,
      ["verify-user", name, JSON.stringify({ probe: true })]
    );
    const r = await pool.query<{ name: string; props: unknown }>(
      `SELECT name, props FROM analytics_events WHERE name = $1 ORDER BY id DESC LIMIT 1`,
      [name]
    );
    if (r.rows.length !== 1) throw new Error("expected exactly one row");
    const row = r.rows[0];
    if (row.name !== name) throw new Error("name mismatch");
    console.log("verify-analytics-db ok:", row.name, JSON.stringify(row.props));
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
