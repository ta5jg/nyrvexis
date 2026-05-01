/* =============================================================================
 * File:           apps/companion-web/src/ui/visual/pixiSceneBackdrop.ts
 * Author:         USDTG GROUP TECHNOLOGY LLC
 * Developer:      Irfan Gedik
 * Created Date:   2026-04-30
 * Last Update:    2026-04-30
 * Version:        0.2.0
 *
 * Description:
 *   Minimal tactical “board” backdrop for the Pixi arena: neutral field,
 *   light grid, zone wash, drafting-style frame. Presentation-only.
 *
 * License:
 *   Proprietary. All rights reserved. See LICENSE in the repository root.
 * ============================================================================= */

import { Container, Graphics } from "pixi.js";

const GRID_STEP = 28;
const GRID_ALPHA = 0.055;
const ZONE_ALPHA = 0.045;

/** Dark neutral field + grid + optional A/B zone tint (readable, low-noise). */
export function createArenaSceneBackdrop(width: number, height: number): Container {
  const root = new Container();

  const base = new Graphics();
  base.rect(0, 0, width, height);
  base.fill({ color: 0x0c0f14, alpha: 1 });
  root.addChild(base);

  const upper = new Graphics();
  upper.rect(0, 0, width, height * 0.42);
  upper.fill({ color: 0x10151d, alpha: 0.65 });
  root.addChild(upper);

  const zones = new Graphics();
  zones.rect(0, 0, width * 0.49, height);
  zones.fill({ color: 0x7c5cff, alpha: ZONE_ALPHA });
  zones.rect(width * 0.51, 0, width * 0.49, height);
  zones.fill({ color: 0x35d07f, alpha: ZONE_ALPHA * 0.85 });
  root.addChild(zones);

  const horizon = new Graphics();
  const hy = height * 0.5;
  horizon.moveTo(0, hy);
  horizon.lineTo(width, hy);
  horizon.stroke({ color: 0xffffff, alpha: 0.06, width: 1 });
  root.addChild(horizon);

  const grid = new Graphics();
  grid.stroke({ color: 0xffffff, alpha: GRID_ALPHA, width: 1 });
  for (let x = 0; x <= width; x += GRID_STEP) {
    grid.moveTo(x + 0.5, 0);
    grid.lineTo(x + 0.5, height);
  }
  for (let y = 0; y <= height; y += GRID_STEP) {
    grid.moveTo(0, y + 0.5);
    grid.lineTo(width, y + 0.5);
  }
  root.addChild(grid);

  const mid = new Graphics();
  const dash = 7;
  const gap = 5;
  let y = height * 0.12;
  const x0 = width / 2;
  while (y < height * 0.88) {
    mid.moveTo(x0, y);
    mid.lineTo(x0, Math.min(y + dash, height * 0.88));
    y += dash + gap;
  }
  mid.stroke({ color: 0xffffff, alpha: 0.09, width: 1 });
  root.addChild(mid);

  return root;
}

/** Thin technical frame + corner brackets (drafting / wargame board). */
export function createArenaBoardFrame(width: number, height: number): Graphics {
  const g = new Graphics();
  const margin = 2;
  g.rect(margin, margin, width - margin * 2, height - margin * 2);
  g.stroke({ color: 0x4a5568, alpha: 0.85, width: 1 });

  const L = 12;
  const inset = 4;
  const t = 1.25;
  const stroke = { color: 0x8b95a8, alpha: 0.55, width: t };

  const corner = (cx: number, cy: number, dx: 1 | -1, dy: 1 | -1) => {
    g.moveTo(cx, cy + dy * L);
    g.lineTo(cx, cy);
    g.lineTo(cx + dx * L, cy);
    g.stroke(stroke);
  };

  corner(inset, inset, 1, 1);
  corner(width - inset, inset, -1, 1);
  corner(inset, height - inset, 1, -1);
  corner(width - inset, height - inset, -1, -1);

  return g;
}

/** @deprecated Use createArenaBoardFrame — kept for accidental imports during refactors. */
export const createArenaWoodFrame = createArenaBoardFrame;
