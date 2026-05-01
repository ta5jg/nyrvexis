/* =============================================================================
 * File:           apps/companion-web/src/ui/visual/atlasManifest.ts
 * Author:         USDTG GROUP TECHNOLOGY LLC
 * Developer:      Irfan Gedik
 * Created Date:   2026-04-30
 * Last Update:    2026-04-30
 * Version:        0.3.0
 *
 * Description:
 *   Optional spritesheet/atlas manifest. If you place a packed atlas at
 *   `src/assets/sprites/atlas/atlas.json` (+ corresponding image),
 *   the loader will prefer it. Otherwise we fall back to frame URLs.
 *
 * License:
 *   Proprietary. All rights reserved. See LICENSE in the repository root.
 * ============================================================================= */

import atlasJsonUrl from "../../assets/sprites/atlas/atlas.json?url";

/**
 * The bundled `atlas.svg` is a **layout/debug** sheet (frame cells contain text like "soldier idle2").
 * It must not be the default render path — real unit art lives in `spriteAssets.ts` (imported SVGs).
 * Set `VITE_USE_SPRITE_ATLAS=1` when testing the atlas pipeline with a real packed image.
 */
export const ATLAS_JSON_URL: string | null =
  import.meta.env.VITE_USE_SPRITE_ATLAS === "1" ? atlasJsonUrl : null;

