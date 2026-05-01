/* =============================================================================
 * File:           apps/companion-web/src/ui/visual/visualAssetPipeline.ts
 * Author:         USDTG GROUP TECHNOLOGY LLC
 * Developer:      Irfan Gedik
 * Created Date:   2026-04-30
 * Last Update:    2026-04-30
 * Version:        1.0.0
 *
 * Description:
 *   Visual-only asset loading helpers. Keeps battle logic independent from rendering.
 *
 * License:
 *   Proprietary. All rights reserved. See LICENSE in the repository root.
 * ============================================================================= */

import { Assets, Rectangle, Texture } from "pixi.js";
import type { ArenaVisualConfig, ArenaVisualVariant, UnitVisualConfig, VisualCropRect } from "./visualModels";

const TEX_CACHE = new Map<string, Texture | null>();

function cacheKey(url: string, crop?: VisualCropRect): string {
  if (!crop) return url;
  return `${url}::${crop.x},${crop.y},${crop.width},${crop.height}`;
}

function createCroppedTexture(base: Texture, crop: VisualCropRect): Texture {
  const maxW = Math.max(1, Math.floor(base.width));
  const maxH = Math.max(1, Math.floor(base.height));
  const x = Math.max(0, Math.min(maxW - 1, Math.floor(crop.x)));
  const y = Math.max(0, Math.min(maxH - 1, Math.floor(crop.y)));
  const width = Math.max(1, Math.min(maxW - x, Math.floor(crop.width)));
  const height = Math.max(1, Math.min(maxH - y, Math.floor(crop.height)));
  return new Texture({
    source: base.source,
    frame: new Rectangle(x, y, width, height)
  });
}

export async function loadTextureSafe(url: string | null | undefined, crop?: VisualCropRect): Promise<Texture | null> {
  if (!url) return null;
  const key = cacheKey(url, crop);
  if (TEX_CACHE.has(key)) return TEX_CACHE.get(key) ?? null;
  try {
    const base = (await Assets.load(url)) as Texture;
    const tex = crop ? createCroppedTexture(base, crop) : base;
    TEX_CACHE.set(key, tex);
    return tex;
  } catch {
    TEX_CACHE.set(key, null);
    return null;
  }
}

export async function loadUnitVisualTextures(cfg: UnitVisualConfig): Promise<{
  portrait: Texture | null;
  battlefield: Texture | null;
  roleIcon: Texture | null;
  rarityFrame: Texture | null;
}> {
  const [portrait, battlefield, roleIcon, rarityFrame] = await Promise.all([
    loadTextureSafe(cfg.portraitImage, cfg.portraitCrop),
    loadTextureSafe(cfg.battlefieldSprite, cfg.battlefieldCrop),
    loadTextureSafe(cfg.roleIcon),
    loadTextureSafe(cfg.rarityFrame)
  ]);
  return { portrait, battlefield, roleIcon, rarityFrame };
}

export async function loadArenaTexture(cfg: ArenaVisualConfig, variant: ArenaVisualVariant): Promise<Texture | null> {
  return loadTextureSafe(cfg.image, variant.crop);
}
