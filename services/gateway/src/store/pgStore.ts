/* =============================================================================
 * File:           services/gateway/src/store/pgStore.ts
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

import { Pool } from "pg";
import { normalizePartialStoreState, migrateLegacyRefreshSessions, type StoreState } from "./store.js";

const DOCUMENT_ID = "main";

/**
 * Persists the same `StoreState` JSON as FileStore, backed by Postgres (single row).
 * Enables pg_dump backups and prod deploy without rewriting handlers.
 */
export class PgStore {
  private readonly pool: Pool;
  private state: StoreState = normalizePartialStoreState(undefined);
  private saving: Promise<void> | null = null;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString, max: 12 });
  }

  async load(): Promise<void> {
    const r = await this.pool.query<{ body: unknown }>(
      `SELECT body FROM gateway_state WHERE id = $1`,
      [DOCUMENT_ID]
    );
    if (r.rows.length === 0) {
      this.state = normalizePartialStoreState(undefined);
      await this.persist();
      return;
    }
    const body = r.rows[0].body;
    const parsed =
      typeof body === "string"
        ? (JSON.parse(body) as Partial<StoreState>)
        : (body as Partial<StoreState>);
    this.state = normalizePartialStoreState(parsed);
    if (migrateLegacyRefreshSessions(this.state)) {
      await this.persist();
    }
  }

  snapshot(): StoreState {
    return this.state;
  }

  mutate<T>(fn: (s: StoreState) => T): T {
    const out = fn(this.state);
    if (!this.saving) {
      this.saving = this.persist().finally(() => {
        this.saving = null;
      });
    }
    return out;
  }

  private async persist(): Promise<void> {
    const json = JSON.stringify(this.state);
    await this.pool.query(
      `INSERT INTO gateway_state (id, body, updated_at)
       VALUES ($1, $2::jsonb, now())
       ON CONFLICT (id) DO UPDATE SET body = EXCLUDED.body, updated_at = now()`,
      [DOCUMENT_ID, json]
    );
  }

  /** Optional DB liveness (health checks). */
  async ping(): Promise<boolean> {
    const r = await this.pool.query(`SELECT 1 as ok`);
    return r.rows.length > 0;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  async insertAnalyticsEvent(row: { userId: string | null; name: string; props: unknown }): Promise<void> {
    await this.pool.query(
      `INSERT INTO analytics_events (user_id, name, props) VALUES ($1, $2, $3::jsonb)`,
      [row.userId, row.name, JSON.stringify(row.props ?? {})]
    );
  }
}
