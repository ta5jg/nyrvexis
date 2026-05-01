/* =============================================================================
 * File:           services/gateway/scripts/validate-content.ts
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
 * Validates that content catalogs parse under current protocol schemas.
 * Usage: pnpm --filter @kindrail/gateway content:validate
 */
import { loadContent } from "../src/content/loader.js";
import { loadMetaContent } from "../src/content/metaLoader.js";
import { loadSeasonDef } from "../src/content/seasonLoader.js";
import { loadEventDef } from "../src/content/eventLoader.js";

async function main() {
  const contentVersion = process.env.KR_CONTENT_VERSION ?? "v0.2.0";
  const metaVersion = process.env.KR_META_VERSION ?? "v0.1.0";
  await loadContent(contentVersion);
  const meta = await loadMetaContent(metaVersion);
  const season = await loadSeasonDef(metaVersion);
  const event = await loadEventDef(metaVersion);
  if (season.seasonId !== meta.seasonId) {
    throw new Error(`seasonId mismatch: meta=${meta.seasonId} season=${season.seasonId}`);
  }
  const s = Date.parse(event.startsAtUtc);
  const e = Date.parse(event.endsAtUtc);
  if (!Number.isFinite(s) || !Number.isFinite(e) || e <= s) {
    throw new Error(`invalid event window: ${event.startsAtUtc} -> ${event.endsAtUtc}`);
  }
  console.log("content ok", { contentVersion, metaVersion, seasonId: meta.seasonId });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

