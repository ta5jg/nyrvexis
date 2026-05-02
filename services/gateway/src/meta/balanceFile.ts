/* =============================================================================
 * File:           services/gateway/src/meta/balanceFile.ts
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
import { NvEconomyTuning } from "@nyrvexis/protocol";

const NAME = "balance.json";

export async function loadBalanceOverride(storeDir: string): Promise<Partial<NvEconomyTuning>> {
  const p = path.join(storeDir, NAME);
  try {
    const raw = await fs.readFile(p, "utf8");
    return NvEconomyTuning.partial().parse(JSON.parse(raw));
  } catch {
    return {};
  }
}

export async function saveBalanceOverride(storeDir: string, patch: Partial<NvEconomyTuning>): Promise<void> {
  await fs.mkdir(storeDir, { recursive: true });
  const p = path.join(storeDir, NAME);
  const tmp = `${p}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(patch, null, 2) + "\n", "utf8");
  await fs.rename(tmp, p);
}
