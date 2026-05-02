/* =============================================================================
 * File:           apps/companion-web/src/ui/visual/proceduralSprites.ts
 * Author:         USDTG GROUP TECHNOLOGY LLC
 * Developer:      Irfan Gedik
 * Created Date:   2026-04-30
 * Last Update:    2026-04-30
 * Version:        0.3.0
 *
 * Description:
 *   Procedural sprite-sheet generator for Pixi (placeholder art).
 *   This keeps a stable API so we can later swap to real atlases.
 *
 * License:
 *   Proprietary. All rights reserved. See LICENSE in the repository root.
 * ============================================================================= */

import { Application, Assets, Graphics, Texture } from "pixi.js";
import { SPRITE_FRAMES } from "./spriteAssets";
import { ATLAS_JSON_URL } from "./atlasManifest";

export type NvUiRole = "tank" | "dps" | "support" | "control";

export type SpriteSet = {
  idle: Texture[];
  attack: Texture[];
  death: Texture[];
};

const CACHE = new Map<string, SpriteSet>();
let ATLAS_READY: boolean | null = null;
let ATLAS_TEXTURES: Record<string, Texture> | null = null;

let unitFramePreload: Promise<void> | null = null;

function collectBundledFrameUrls(): string[] {
  const seen = new Set<string>();
  const walk = (v: unknown): void => {
    if (typeof v === "string") {
      if (v.length > 0) seen.add(v);
    } else if (Array.isArray(v)) {
      for (const x of v) walk(x);
    } else if (v && typeof v === "object") {
      for (const x of Object.values(v as Record<string, unknown>)) walk(x);
    }
  };
  walk(SPRITE_FRAMES as unknown);
  return [...seen];
}

/**
 * Preload every bundled unit/frame URL so `Texture.from` has decoded sizes (Safari SVG).
 * Idempotent; safe to call before building `AnimatedSprite`s.
 */
export function preloadUnitFrameTextures(): Promise<void> {
  if (!unitFramePreload) {
    unitFramePreload = (async () => {
      const urls = collectBundledFrameUrls();
      await Promise.all(
        urls.map(async (url) => {
          try {
            await Assets.load(url);
          } catch {
            /* one broken URL must not block the rest */
          }
        })
      );
    })();
  }
  return unitFramePreload;
}

/**
 * Optional atlas preload. If `ATLAS_JSON_URL` is set, we try to load it once.
 * Call this once after Pixi `Application` is initialized.
 */
export async function preloadSpriteAtlas(): Promise<boolean> {
  if (ATLAS_READY !== null) return ATLAS_READY;
  if (!ATLAS_JSON_URL) {
    ATLAS_READY = false;
    ATLAS_TEXTURES = null;
    return false;
  }
  try {
    const loaded: any = await Assets.load(ATLAS_JSON_URL);
    const textures = loaded?.textures;
    if (!textures || typeof textures !== "object") {
      ATLAS_TEXTURES = null;
      ATLAS_READY = false;
      return false;
    }
    const framesObj = loaded.data?.frames;
    if (framesObj && typeof framesObj === "object") {
      for (const key of Object.keys(framesObj)) {
        if (!textures[key]) {
          ATLAS_TEXTURES = null;
          ATLAS_READY = false;
          return false;
        }
      }
    }
    ATLAS_TEXTURES = textures as Record<string, Texture>;
    ATLAS_READY = true;
    return true;
  } catch {
    ATLAS_READY = false;
    ATLAS_TEXTURES = null;
    return false;
  }
}

function texFromAtlasOrNull(frameId: string): Texture | null {
  const fromMap = ATLAS_TEXTURES?.[frameId];
  return fromMap ?? null;
}

function roleBase(role: NvUiRole): number {
  if (role === "tank") return 0x35d07f;
  if (role === "dps") return 0xff5c7c;
  if (role === "support") return 0x7c5cff;
  return 0x56c2ff;
}

function fxAccent(fxProfileId?: string | null): number {
  if (!fxProfileId) return 0xffffff;
  if (fxProfileId.includes("magic")) return 0xffd740;
  if (fxProfileId.includes("heal")) return 0x9effff;
  if (fxProfileId.includes("hex")) return 0xd07cff;
  if (fxProfileId.includes("ranged")) return 0xffffff;
  if (fxProfileId.includes("fast")) return 0xb4ff56;
  if (fxProfileId.includes("heavy")) return 0xd0d0d0;
  return 0xffffff;
}

function gen(app: Application, g: Graphics): Texture {
  // generateTexture is the simplest stable path in Pixi v8
  return app.renderer.generateTexture({ target: g, resolution: 2 });
}

function makeFrame(role: NvUiRole, accent: number, frame: number, kind: "idle" | "attack" | "death"): Graphics {
  const base = roleBase(role);
  const g = new Graphics();

  const wob = Math.sin(frame * 1.2) * 0.8;
  const hop = Math.cos(frame * 1.4) * 0.6;
  const s = kind === "attack" ? 1.06 : 1;
  const a = kind === "death" ? 0.55 : 1;

  // Humanoid read: head + torso (avoid empty “grey egg” when SVG pack fails).
  g.circle(16, 11 + hop, 6.2 * s);
  g.fill({ color: base, alpha: 0.95 * a });
  g.roundRect(10, 16 + hop, 12, 13 * s, 4);
  g.fill({ color: base, alpha: 0.95 * a });

  g.roundRect(11.5, 20 + hop, 9, 5, 2);
  g.fill({ color: 0x000000, alpha: 0.2 * a });

  g.roundRect(12.5, 12 + hop, 7, 3.5, 1.5);
  g.fill({ color: 0x000000, alpha: 0.22 * a });

  if (kind === "attack") {
    g.moveTo(18, 6);
    g.lineTo(30, 16 + wob);
    g.stroke({ color: accent, alpha: 0.85 * a, width: 3 });
    g.circle(28, 14 + wob, 2.6);
    g.fill({ color: accent, alpha: 0.95 * a });
  } else if (role === "support") {
    g.circle(26, 10 + wob, 4.2);
    g.fill({ color: accent, alpha: 0.35 * a });
    g.circle(26, 10 + wob, 2.2);
    g.fill({ color: accent, alpha: 0.75 * a });
  } else if (role === "control") {
    g.roundRect(24, 8 + wob, 6, 10, 3);
    g.fill({ color: accent, alpha: 0.50 * a });
  } else if (role === "tank") {
    g.roundRect(4, 10 + wob, 6, 14, 3);
    g.fill({ color: 0x000000, alpha: 0.18 * a });
    g.roundRect(5, 11 + wob, 4, 12, 2);
    g.fill({ color: accent, alpha: 0.24 * a });
  } else {
    g.moveTo(22, 10);
    g.lineTo(30, 16 + wob);
    g.stroke({ color: accent, alpha: 0.70 * a, width: 2 });
  }

  // death cracks
  if (kind === "death") {
    g.moveTo(8, 10);
    g.lineTo(24, 26);
    g.stroke({ color: 0x000000, alpha: 0.25, width: 2 });
    g.moveTo(22, 8);
    g.lineTo(10, 28);
    g.stroke({ color: 0x000000, alpha: 0.22, width: 2 });
  }

  return g;
}

function tryLoadFileSpritePack(params: { iconId?: string | null }): SpriteSet | null {
  try {
    const unit = params.iconId ? (SPRITE_FRAMES as any).units?.[params.iconId] : null;
    const idleSrc: string[] = unit?.idle ?? SPRITE_FRAMES.idle;
    const atkSrc: string[] = unit?.attack ?? SPRITE_FRAMES.attack;
    const deathSrc: string[] = unit?.death ?? SPRITE_FRAMES.death;
    const idle = idleSrc.map((u) => Texture.from(u));
    const attack = atkSrc.map((u) => Texture.from(u));
    const death = deathSrc.map((u) => Texture.from(u));
    if (idle.length === 0 || attack.length === 0 || death.length === 0) return null;
    return { idle, attack, death };
  } catch {
    return null;
  }
}

export function getSpriteSet(app: Application, params: { role: NvUiRole; fxProfileId?: string | null; iconId?: string | null }): SpriteSet {
  const key = `${params.iconId ?? ""}|${params.role}|${params.fxProfileId ?? ""}`;
  const hit = CACHE.get(key);
  if (hit) return hit;

  // Prefer bundled SVG/PNG frame URLs (real silhouettes). Debug `atlas.svg` is opt-in via VITE_USE_SPRITE_ATLAS.
  const fileSet = tryLoadFileSpritePack(params);
  if (fileSet) {
    CACHE.set(key, fileSet);
    return fileSet;
  }

  // Optional packed atlas (convention: `${iconId}/idle/0`, …).
  if (ATLAS_READY === true && params.iconId) {
    const base = params.iconId;
    const idle = [0, 1, 2, 3].map((i) => texFromAtlasOrNull(`${base}/idle/${i}`)).filter(Boolean) as Texture[];
    const attack = [0, 1, 2].map((i) => texFromAtlasOrNull(`${base}/attack/${i}`)).filter(Boolean) as Texture[];
    const death = [0].map((i) => texFromAtlasOrNull(`${base}/death/${i}`)).filter(Boolean) as Texture[];
    if (idle.length === 4 && attack.length === 3 && death.length === 1) {
      const set: SpriteSet = { idle, attack, death };
      CACHE.set(key, set);
      return set;
    }
  }

  const accent = fxAccent(params.fxProfileId);

  const idle = [0, 1, 2, 3].map((i) => gen(app, makeFrame(params.role, accent, i, "idle")));
  const attack = [0, 1, 2].map((i) => gen(app, makeFrame(params.role, accent, i, "attack")));
  const death = [0].map((i) => gen(app, makeFrame(params.role, accent, i, "death")));

  const set: SpriteSet = { idle, attack, death };
  CACHE.set(key, set);
  return set;
}

