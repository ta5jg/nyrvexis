/* =============================================================================
 * File:           apps/companion-web/src/ui/visual/pixiUnitCard.ts
 * Author:         USDTG GROUP TECHNOLOGY LLC
 * Developer:      Irfan Gedik
 * Created Date:   2026-04-30
 * Last Update:    2026-04-30
 * Version:        1.0.0
 *
 * Description:
 *   Collectible-card style unit visuals for the Pixi arena renderer.
 *
 * License:
 *   Proprietary. All rights reserved. See LICENSE in the repository root.
 * ============================================================================= */

import { Container, Graphics, Sprite, Text, Texture } from "pixi.js";
import type { RarityVisualConfig, UnitVisualConfig } from "./visualModels";

export type UnitCardView = {
  root: Container;
  art: Container;
  frame: Graphics;
  frameGlow: Graphics;
};

function roleColor(roleIconPath: string): number {
  if (roleIconPath.includes("tank")) return 0x35d07f;
  if (roleIconPath.includes("dps")) return 0xff5c7c;
  if (roleIconPath.includes("support")) return 0x7c5cff;
  return 0x56c2ff;
}

function buildFallbackArt(w: number, h: number, cfg: UnitVisualConfig): Container {
  const c = new Container();
  const g = new Graphics();
  const base = roleColor(cfg.roleIcon);
  g.roundRect(-w / 2, -h / 2, w, h, 10);
  g.fill({ color: 0x0f141e, alpha: 0.96 });
  g.roundRect(-w / 2 + 6, -h / 2 + 6, w - 12, h - 26, 8);
  g.fill({ color: base, alpha: 0.16 });
  g.roundRect(-w / 2 + 9, -h / 2 + 9, w - 18, h - 32, 7);
  g.stroke({ color: base, alpha: 0.24, width: 1.2 });
  c.addChild(g);

  const initials = new Text({
    text: cfg.id.slice(0, 2).toUpperCase(),
    style: {
      fontFamily: "system-ui, -apple-system, ui-sans-serif",
      fontSize: 16,
      fill: 0xe6edf7,
      fontWeight: "700",
      align: "center"
    }
  });
  initials.anchor.set(0.5);
  initials.position.set(0, -8);
  c.addChild(initials);

  const idleHint = new Graphics();
  idleHint.circle(0, h * 0.28, 5);
  idleHint.fill({ color: base, alpha: 0.44 });
  c.addChild(idleHint);
  return c;
}

function fitSpriteCover(sprite: Sprite, targetW: number, targetH: number) {
  const sw = Math.max(1, sprite.texture.width);
  const sh = Math.max(1, sprite.texture.height);
  const scale = Math.max(targetW / sw, targetH / sh);
  sprite.scale.set(scale);
  sprite.anchor.set(0.5);
}

export function createUnitCardView(params: {
  cfg: UnitVisualConfig;
  rarity: RarityVisualConfig;
  textures: {
    portrait: Texture | null;
    battlefield: Texture | null;
    roleIcon: Texture | null;
    rarityFrame: Texture | null;
  };
  width: number;
  height: number;
}): UnitCardView {
  const { cfg, rarity, textures, width: w, height: h } = params;
  const root = new Container();

  const shadow = new Graphics();
  shadow.roundRect(-w / 2 + 4, -h / 2 + 7, w, h, 10);
  shadow.fill({ color: 0x000000, alpha: 0.45 });
  shadow.scale.set(0.98);
  shadow.position.set(0, 5);
  root.addChild(shadow);

  const base = new Graphics();
  base.roundRect(-w / 2, -h / 2, w, h, 10);
  base.fill({ color: 0x0e131b, alpha: 0.98 });
  root.addChild(base);

  const art = new Container();
  const artMask = new Graphics();
  const artH = h - 24;
  artMask.roundRect(-w / 2 + 5, -h / 2 + 5, w - 10, artH - 8, 8);
  artMask.fill({ color: 0xffffff, alpha: 1 });
  art.mask = artMask;
  root.addChild(art);
  root.addChild(artMask);

  const tex = textures.battlefield ?? textures.portrait;
  if (tex) {
    const sprite = new Sprite(tex);
    fitSpriteCover(sprite, w - 10, artH);
    sprite.position.set(0, -6);
    art.addChild(sprite);
  } else {
    art.addChild(buildFallbackArt(w - 10, artH, cfg));
  }

  const bottom = new Graphics();
  bottom.roundRect(-w / 2 + 4, h / 2 - 22, w - 8, 18, 6);
  bottom.fill({ color: 0x0b1018, alpha: 0.96 });
  root.addChild(bottom);

  const frame = new Graphics();
  frame.roundRect(-w / 2, -h / 2, w, h, 10);
  frame.stroke({ color: 0xb0becf, alpha: 0.45, width: 1.2 });
  root.addChild(frame);

  const frameGlow = new Graphics();
  frameGlow.roundRect(-w / 2 - 1, -h / 2 - 1, w + 2, h + 2, 11);
  frameGlow.stroke({ color: rarity.glowColor, alpha: 0.15, width: 2.4 });
  root.addChild(frameGlow);

  if (textures.rarityFrame) {
    const rarityFrame = new Sprite(textures.rarityFrame);
    rarityFrame.anchor.set(0.5);
    rarityFrame.width = w + 4;
    rarityFrame.height = h + 4;
    rarityFrame.alpha = 0.92;
    root.addChild(rarityFrame);
  }

  if (textures.roleIcon) {
    const roleIcon = new Sprite(textures.roleIcon);
    roleIcon.anchor.set(0.5);
    roleIcon.width = 14;
    roleIcon.height = 14;
    roleIcon.position.set(w / 2 - 12, h / 2 - 14);
    roleIcon.alpha = 0.95;
    root.addChild(roleIcon);
  }

  return { root, art, frame, frameGlow };
}
