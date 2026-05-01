/* =============================================================================
 * File:           services/gateway/src/content/seasonLoader.ts
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

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { KrSeasonDef } from "@kindrail/protocol";

export async function loadSeasonDef(version = "v0.1.0"): Promise<KrSeasonDef> {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const p = path.join(__dirname, "catalogs", `season.${version}.json`);
  const raw = await fs.readFile(p, "utf8");
  return KrSeasonDef.parse(JSON.parse(raw));
}

