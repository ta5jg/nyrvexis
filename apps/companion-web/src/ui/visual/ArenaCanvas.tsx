/* =============================================================================
 * File:           apps/companion-web/src/ui/visual/ArenaCanvas.tsx
 * Author:         USDTG GROUP TECHNOLOGY LLC
 * Developer:      Irfan Gedik
 * Created Date:   2026-04-30
 * Last Update:    2026-05-02
 * Version:        0.11.0
 *
 * Description:
 *   Canvas arena renderer: replay-driven combat + event-driven locomotion / juice —
 *   simulation stays slot-based.
 *
 * License:
 *   Proprietary. All rights reserved. See LICENSE in the repository root.
 * ============================================================================= */

import React, { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { scaledMatchHp, type NvBattleSimRequest, type NvUnitArchetypeDef, type NvUnitRole } from "@nyrvexis/protocol";
import type { ReplayFrame, ReplayUiEvent } from "../replay";
import { allSpriteUrlsForUnit, idleFrameUrlsForUnit, attackFrameUrlsForUnit, deathFrameUrlsForUnit } from "./spriteAssets";
import { iconUrl } from "./iconRegistry";
import { spriteProfile } from "./spriteProfiles";
import { resolveArenaVisual, resolveUnitVisualConfig } from "./visualConfigs";
import { roleStroke } from "./artDirection";
import { arenaVfxTuning } from "./vfxPresets";

type ReplayStrikeEvent = Extract<ReplayUiEvent, { kind: "hit" } | { kind: "ability" }> & {
  src: string;
  dst: string;
};

function collectStrikeEvents(events: ReplayUiEvent[], max: number): ReplayStrikeEvent[] {
  const out: ReplayStrikeEvent[] = [];
  for (const e of events) {
    if (out.length >= max) break;
    if (e.kind === "hit" && e.src) {
      if (/\bMISS\b/i.test(e.text)) continue;
      out.push({ ...e, src: e.src, dst: e.dst });
    } else if (e.kind === "ability" && e.src && e.dst) {
      out.push({ ...e, src: e.src, dst: e.dst });
    }
  }
  return out;
}

function collectMissStrikeEvents(events: ReplayUiEvent[], max: number): ReplayStrikeEvent[] {
  const out: ReplayStrikeEvent[] = [];
  for (const e of events) {
    if (out.length >= max) break;
    if (e.kind === "hit" && e.src && /\bMISS\b/i.test(e.text)) {
      out.push({ ...e, src: e.src, dst: e.dst });
    }
  }
  return out;
}

type Pt = { x: number; y: number };
type DmgFloat = { id: string; x: number; y: number; dmg: number; crit?: boolean; t0: number };
type MissFloat = { id: string; x: number; y: number; t0: number };

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

/** Shrink source rect slightly so scaled sprites don't sample neighboring cells on sheets. */
function insetCrop(
  crop: { x: number; y: number; width: number; height: number },
  sheetW: number,
  sheetH: number,
  insetPx: number
): { sx: number; sy: number; sw: number; sh: number } {
  const inset = Math.max(0, insetPx);
  let sx = crop.x + inset;
  let sy = crop.y + inset;
  let sw = Math.max(1, crop.width - inset * 2);
  let sh = Math.max(1, crop.height - inset * 2);
  sx = clamp(sx, 0, Math.max(0, sheetW - 1));
  sy = clamp(sy, 0, Math.max(0, sheetH - 1));
  sw = clamp(sw, 1, sheetW - sx);
  sh = clamp(sh, 1, sheetH - sy);
  return { sx, sy, sw, sh };
}

function easeOutCubic(x: number) {
  const t = clamp(x, 0, 1);
  return 1 - Math.pow(1 - t, 3);
}

/** Overshoot ease — readable cartoon settle */
function easeOutBack(x: number): number {
  const t = clamp(x, 0, 1);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

/** Thick ink + highlight ring (cel outline). */
function drawCartoonInkOutlineCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  fade: number
): void {
  if (fade < 0.04) return;
  ctx.save();
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(x, y, radius + 2.4, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(12,9,16,${0.94 * fade})`;
  ctx.lineWidth = 4.5;
  ctx.stroke();
  ctx.strokeStyle = `rgba(255,248,232,${0.42 * fade})`;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

function drawCartoonInkOutlineEllipse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  fade: number
): void {
  if (fade < 0.04) return;
  ctx.save();
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.ellipse(x, y, rx + 2.6, ry + 2.6, 0, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(12,9,16,${0.94 * fade})`;
  ctx.lineWidth = 4.5;
  ctx.stroke();
  ctx.strokeStyle = `rgba(255,248,232,${0.38 * fade})`;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

/** Comic POW radial strokes */
function drawCartoonPowBurst(ctx: CanvasRenderingContext2D, cx: number, cy: number, intensity: number, spinSeed: number): void {
  if (intensity < 0.05) return;
  const rays = 10;
  ctx.save();
  ctx.lineCap = "round";
  ctx.translate(cx, cy);
  ctx.rotate((spinSeed % 997) * 0.0063 + (1 - intensity) * 0.5);
  const inner = 8 + 8 * intensity;
  const outer = inner + 38 + 58 * intensity;
  for (let i = 0; i < rays; i++) {
    const ang = (i / rays) * Math.PI * 2;
    const wobble = Math.sin(i * 1.7 + intensity * 8) * 4 * intensity;
    ctx.beginPath();
    ctx.moveTo(Math.cos(ang) * inner, Math.sin(ang) * inner + wobble);
    ctx.lineTo(Math.cos(ang) * outer, Math.sin(ang) * outer + wobble * 0.45);
    ctx.strokeStyle = `rgba(28,18,12,${0.62 * intensity})`;
    ctx.lineWidth = 4.5 * intensity + 1.2;
    ctx.stroke();
    ctx.strokeStyle = `rgba(255,236,168,${0.62 * intensity})`;
    ctx.lineWidth = 1.8 * intensity + 0.6;
    ctx.stroke();
  }
  ctx.restore();
}

/** Starburst for critical hits */
function drawCartoonCritBurst(ctx: CanvasRenderingContext2D, cx: number, cy: number, intensity: number, seed: number): void {
  if (intensity < 0.07) return;
  const spikes = 12;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(((seed >>> 3) % 628) * 0.01 + intensity * 0.65);
  const r1 = 26 + 18 * intensity;
  const r2 = 11 + 7 * intensity;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const ang = (i / (spikes * 2)) * Math.PI * 2;
    const rad = i % 2 === 0 ? r1 : r2;
    const x = Math.cos(ang) * rad;
    const y = Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = `rgba(255,214,72,${0.42 * intensity})`;
  ctx.fill();
  ctx.lineWidth = 2.25;
  ctx.strokeStyle = `rgba(255,252,235,${0.72 * intensity})`;
  ctx.stroke();
  ctx.restore();
}

/** Same shape in simulation ticks (scrub-safe; works when `frame.t` is paused on last tick). */
function maneuverEnvelopeTicks(dtTicks: number, durTicks: number): number {
  if (dtTicks < 0 || dtTicks >= durTicks) return 0;
  const u = dtTicks / durTicks;
  if (u < 0.38) return easeOutCubic(u / 0.38);
  return 1 - easeOutCubic((u - 0.38) / 0.62);
}

/** Cosmetic camera shake from crit / damage pulses (disabled with reduced motion). */
function computeScreenShakeMag(
  now: number,
  frame: ReplayFrame | null,
  critAt: Record<string, number>,
  hitAt: Record<string, number>,
  reduceMotion: boolean
): number {
  if (reduceMotion || !frame) return 0;
  let mag = 0;
  for (const id of frame.critIds ?? []) {
    const at = critAt[id];
    if (typeof at !== "number") continue;
    const ag = now - at;
    if (ag < 260) mag = Math.max(mag, 9 * (1 - easeOutCubic(ag / 260)));
  }
  for (const id of frame.flashIds ?? []) {
    const at = hitAt[id];
    if (typeof at !== "number") continue;
    const ag = now - at;
    if (ag < 200) mag = Math.max(mag, 5 * (1 - easeOutCubic(ag / 200)));
  }
  return mag;
}

function hash32(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** Deterministic spread so units are not parade-ground aligned (cosmetic only). */
function tacticalSpreadPx(seed: string, side: "a" | "b", unitId: string): { sx: number; sy: number } {
  const h = hash32(`${seed}|${side}|${unitId}`);
  const hx = (h & 0xffff) / 65535;
  const hy = ((h >>> 16) & 0xffff) / 65535;
  return {
    sx: (hx - 0.5) * 24,
    sy: (hy - 0.5) * 16
  };
}

/** Grid + mid-line overlay on top of procedural fills or arena photography. */
function drawTacticalGridOverlay(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const step = 28;

  const hy = h * 0.5;
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, hy);
  ctx.lineTo(w, hy);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.055)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= w; x += step) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(w, y + 0.5);
    ctx.stroke();
  }

  const x0 = w / 2;
  ctx.strokeStyle = "rgba(255,255,255,0.09)";
  const dash = 7;
  const gap = 5;
  let y = h * 0.12;
  while (y < h * 0.88) {
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x0, Math.min(y + dash, h * 0.88));
    ctx.stroke();
    y += dash + gap;
  }
}

/** Minimal tactical board when arena PNG is missing or still loading. */
function drawCanvasBoardBackdrop(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const zoneA = "rgba(124, 92, 255, 0.045)";
  const zoneB = "rgba(53, 208, 127, 0.038)";

  ctx.fillStyle = "rgb(12, 15, 20)";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "rgba(16, 21, 29, 0.65)";
  ctx.fillRect(0, 0, w, h * 0.42);

  ctx.fillStyle = zoneA;
  ctx.fillRect(0, 0, w * 0.49, h);
  ctx.fillStyle = zoneB;
  ctx.fillRect(w * 0.51, 0, w * 0.49, h);

  drawTacticalGridOverlay(ctx, w, h);
}

function drawArenaBackdropComposite(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  resolved: ReturnType<typeof resolveArenaVisual>,
  cache: Map<string, HTMLImageElement>
): void {
  const url = resolved.config.image;
  const img = cache.get(url);
  if (img?.complete && img.naturalWidth > 0) {
    ctx.fillStyle = "rgb(12, 15, 20)";
    ctx.fillRect(0, 0, w, h);
    const crop = resolved.variant.crop;
    const sx = crop?.x ?? 0;
    const sy = crop?.y ?? 0;
    const sw = crop?.width ?? img.naturalWidth;
    const sh = crop?.height ?? img.naturalHeight;
    const scale = Math.max(w / sw, h / sh);
    const dw = sw * scale;
    const dh = sh * scale;
    const dx = (w - dw) / 2;
    const dy = (h - dh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
    ctx.fillStyle = "rgba(9, 11, 16, 0.42)";
    ctx.fillRect(0, 0, w, h);
    drawTacticalGridOverlay(ctx, w, h);
  } else {
    drawCanvasBoardBackdrop(ctx, w, h);
  }
}

function drawCanvasBoardFrame(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const inset = 2;
  ctx.strokeStyle = "rgba(74, 85, 104, 0.85)";
  ctx.lineWidth = 1;
  ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);

  const L = 12;
  const pad = 4;
  ctx.strokeStyle = "rgba(139, 149, 168, 0.55)";
  ctx.lineWidth = 1.25;

  const Lcorner = (cx: number, cy: number, dx: number, dy: number) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy + dy * L);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + dx * L, cy);
    ctx.stroke();
  };

  Lcorner(pad, pad, 1, 1);
  Lcorner(w - pad, pad, -1, 1);
  Lcorner(pad, h - pad, 1, -1);
  Lcorner(w - pad, h - pad, -1, -1);
}

/**
 * Slot positions use these ratios; PNG scale clamp below MUST use the same `yFrontRatio`/`yBackRatio`
 * so portrait height never exceeds row spacing (otherwise front/back stacks overlap).
 */
const ARENA_FORMATION = {
  leftXRatio: 0.245,
  rightXRatio: 0.755,
  yFrontRatio: 0.275,
  yBackRatio: 0.82,
  dxRatio: 0.14,
  /** Nudge front rank toward midline, back rank slightly away (readable depth). */
  frontMidBiasRatio: 0.032,
  backMidBiasRatio: 0.018
} as const;

type PostureSnap = {
  lastManeuver: Record<string, { atTick: number; kind: "cover" | "probe" | "bound" }>;
  lastMissDodge: Record<string, number>;
};

type UnitDrawRow = {
  id: string;
  side: "a" | "b";
  slot: number;
  spreadX: number;
  spreadY: number;
  hp0: number;
  fxProfileId?: string;
  iconId?: string;
};

/**
 * Cosmetic locomotion only — no idle “fanus patrol”.
 * Offset + lean come from finite cues: attack wind/charge, targeted brace, hit stumble (sim stays slot-based).
 */
function arenaLocomotionOffsetPx(
  seed: string,
  unitId: string,
  _side: "a" | "b",
  _slot: number,
  _wallMs: number,
  bobMul: number,
  reduced: boolean,
  arenaW: number,
  arenaH: number,
  tgt: boolean,
  unitAlive: boolean,
  atkAge: number,
  hitPulse: number,
  hitAge: number,
  dir: number,
  phase: number
): { mx: number; my: number; strideLean: number } {
  if (reduced) return { mx: 0, my: 0, strideLean: 0 };
  const hLoc = hash32(`${seed}|arena_loco|${unitId}`);
  const ph = hLoc / 4294967295;
  const pace = bobMul * (0.88 + ph * 0.22);

  let mx = 0;
  let my = 0;
  let strideLean = 0;

  // Three-phase attack: anticipation (pull back) → strike (overshoot) → recovery.
  // The longer anticipation window (was 11%, now 22%) makes the wind-up readable;
  // strike uses easeOutBack so the lunge feels snappy and the recovery returns
  // through a damped quintic so the foot doesn't snap back instantly.
  if (unitAlive && atkAge < 620) {
    const lu = clamp(atkAge / 580, 0, 1);
    const ANTIC_END = 0.22;
    const STRIKE_END = 0.55;
    let wind = 0;
    let charge = 0;
    let lift = 0;
    if (lu < ANTIC_END) {
      const a = lu / ANTIC_END;
      // pull back against the strike direction
      wind = -easeOutCubic(a) * arenaW * 0.045;
    } else if (lu < STRIKE_END) {
      const a = (lu - ANTIC_END) / (STRIKE_END - ANTIC_END);
      // strike with mild overshoot (easeOutBack-ish)
      const back = 1 - Math.pow(1 - a, 3) + 0.18 * Math.sin(a * Math.PI);
      charge = back * arenaW * 0.105 * pace;
      lift = Math.sin(a * Math.PI) * arenaH * 0.052 * pace;
    } else {
      const a = (lu - STRIKE_END) / (1 - STRIKE_END);
      // damped recovery — tail of quintic so it settles, not snaps
      const k = 1 - Math.pow(1 - a, 2);
      charge = (1 - k) * arenaW * 0.105 * pace;
      lift = (1 - k) * arenaH * 0.022 * pace;
    }
    mx += dir * (wind + charge);
    my -= lift;
    const leanEase = lu * lu * (3 - 2 * lu);
    strideLean += dir * leanEase * 0.095 * pace;
  }

  if (tgt && unitAlive) {
    mx *= 0.72;
    mx -= dir * arenaW * 0.026;
    my += arenaH * 0.03;
    strideLean -= dir * 0.06 * pace;
  }

  // Hit knockback decays over a longer window (was 220ms, now 360ms) so the
  // tilt residue stays readable; the stumble itself is unchanged in magnitude.
  if (hitPulse > 0.04 && unitAlive) {
    const stumble = hitPulse * pace;
    const hHit = hash32(`${unitId}|stumble`);
    const lateralSign = (hHit & 1) === 0 ? 1 : -1;
    const knock = easeOutCubic(clamp(hitAge / 360, 0, 1));
    mx -= dir * stumble * 13 * knock * lateralSign * 0.85;
    my -= stumble * 15 * knock;
    strideLean += dir * stumble * 0.12 * knock * lateralSign;
  }

  return { mx, my, strideLean };
}

export type UnitMotionBundle = {
  x: number;
  y: number;
  leanTotal: number;
  dir: number;
  bob: number;
  phase: number;
  curHp: number;
  maxHp: number;
  hpPct: number;
  unitAlive: boolean;
  tgt: boolean;
  atk: boolean;
  fade: number;
  critPulse: number;
  hitPulse: number;
  atkPulse: number;
  atkAge: number;
  hitAge: number;
  deadAge: number;
};

function computeUnitFeetMotion(
  u: UnitDrawRow,
  p0: Pt,
  frame: ReplayFrame | null,
  now: number,
  battleSeed: string,
  reduceMotion: boolean,
  vfxBobMul: number,
  postureByTick: PostureSnap,
  curTick: number,
  arenaW: number,
  arenaH: number,
  deathAt: Record<string, number>,
  critAt: Record<string, number>,
  hitAt: Record<string, number>,
  atkAt: Record<string, number>
): UnitMotionBundle | null {
  const anchorX = p0.x + u.spreadX * vfxBobMul;
  const anchorY = p0.y + u.spreadY * vfxBobMul;

  const curHp = frame?.hp?.[u.id] ?? u.hp0;
  const maxHp = frame?.maxHp?.[u.id] ?? u.hp0;
  const unitAlive = frame == null ? true : curHp > 0 && frame.alive[u.id] !== false;
  const hpPct = maxHp > 0 ? clamp(curHp / maxHp, 0, 1) : 0;

  const tgt = frame?.tgtIds?.includes(u.id) ?? false;
  const atk = frame?.atkIds?.includes(u.id) ?? false;

  let idSum = 0;
  for (let i = 0; i < u.id.length; i++) idSum = (idSum + u.id.charCodeAt(i)) | 0;
  const phase = (idSum % 1000) / 1000;

  // Idle motion — vertical bob + small lateral sway so standing units read as
  // alive rather than static portraits. Per-id phase keeps the squad from
  // bobbing in unison; reduceMotion skips it for users with the OS preference set.
  const idleClock = now * 0.0026 + phase * Math.PI * 2;
  const swayClock = now * 0.0017 + phase * 1.7;
  const bob = unitAlive && !reduceMotion ? Math.sin(idleClock) * 2.4 : 0;
  const idleSway = unitAlive && !reduceMotion ? Math.sin(swayClock) * 1.1 : 0;

  const deathA = deathAt[u.id];
  const deadAge = typeof deathA === "number" ? now - deathA : 9999;
  // Body stays opaque through stagger + buckle; visible fade only kicks in once
  // the topple phase begins (~500ms after death).
  const fade = unitAlive
    ? 1
    : deadAge < 500
      ? 1
      : clamp(1 - easeOutCubic((deadAge - 500) / 460), 0, 1);
  if (fade < 0.02) return null;

  const critA = critAt[u.id];
  const critAge = typeof critA === "number" ? now - critA : 9999;
  const critPulse = clamp(1 - easeOutCubic(critAge / 320), 0, 1);

  // Hit pulse decays over 520ms (was 290) so the recoil + tilt is perceivable
  // before the next event lands.
  const hitA = hitAt[u.id];
  const hitAge = typeof hitA === "number" ? now - hitA : 9999;
  const hitPulse = clamp(1 - easeOutCubic(hitAge / 520), 0, 1);

  const atkA = atkAt[u.id];
  const atkAge = typeof atkA === "number" ? now - atkA : 9999;
  const atkPulse = clamp(1 - easeOutCubic(atkAge / 195), 0, 1);

  const dir = u.side === "a" ? 1 : -1;
  let p = { x: anchorX + idleSway, y: anchorY + bob };

  const loco = arenaLocomotionOffsetPx(
    battleSeed,
    u.id,
    u.side,
    u.slot,
    now,
    vfxBobMul,
    reduceMotion,
    arenaW,
    arenaH,
    tgt,
    unitAlive,
    atkAge,
    hitPulse,
    hitAge,
    dir,
    phase
  );
  p.x += loco.mx;
  p.y += loco.my;

  let leanTotal = loco.strideLean;

  if (unitAlive && hitPulse > 0.02) {
    const hb = easeOutBack(hitPulse);
    p.x -= dir * hb * 20;
    p.y -= hb * 11;
    if (tgt) {
      p.y += hb * 16;
      leanTotal += dir * 0.16 * hb;
    }
  }

  if (unitAlive && !reduceMotion) {
    const missTick = postureByTick.lastMissDodge[u.id];
    if (typeof missTick === "number") {
      const dodgeEnv = maneuverEnvelopeTicks(curTick - missTick, 16);
      if (dodgeEnv > 0.01) {
        const back = u.side === "a" ? -1 : 1;
        p.x += back * dodgeEnv * 22;
        p.y -= dodgeEnv * 9;
        leanTotal += back * 0.15 * dodgeEnv;
      }
    }
    const mm = postureByTick.lastManeuver[u.id];
    if (mm) {
      const toward = u.side === "a" ? 1 : -1;
      const lateral = u.slot % 2 === 0 ? 1 : -1;
      if (mm.kind === "cover") {
        const env = maneuverEnvelopeTicks(curTick - mm.atTick, 44);
        if (env > 0.01) {
          p.x -= toward * 38 * env;
          p.y += 18 * env;
          leanTotal -= toward * 0.15 * env;
        }
      } else if (mm.kind === "probe") {
        const env = maneuverEnvelopeTicks(curTick - mm.atTick, 36);
        if (env > 0.01) {
          p.x += toward * 40 * env;
          p.y -= 13 * env;
          leanTotal += toward * 0.13 * env;
        }
      } else {
        const dur = 42;
        const dt = curTick - mm.atTick;
        const env = maneuverEnvelopeTicks(dt, dur);
        if (env > 0.01) {
          const zig = Math.sin((dt / dur) * Math.PI) * env;
          p.x += lateral * 34 * zig;
          p.y -= env * 12;
          leanTotal += lateral * 0.16 * zig;
        }
      }
    }
  }

  leanTotal = clamp(leanTotal, -0.45, 0.45);

  return {
    x: p.x,
    y: p.y,
    leanTotal,
    dir,
    bob,
    phase,
    curHp,
    maxHp,
    hpPct,
    unitAlive,
    tgt,
    atk,
    fade,
    critPulse,
    hitPulse,
    atkPulse,
    atkAge,
    hitAge,
    deadAge
  };
}

export function ArenaCanvas(props: {
  req: NvBattleSimRequest;
  frame: ReplayFrame | null;
  /** Indices align with `frame`; pass so maneuvers before the current tick are visible (esp. last replay frame). */
  replayFrames?: ReplayFrame[] | null;
  replayTickIndex?: number;
  defsById: Map<string, NvUnitArchetypeDef>;
  outcome?: "a" | "b" | "draw";
  /** Maximum logical width (px); height is always half for 2:1 arena. */
  width?: number;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const imgCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const rafRef = useRef<number | null>(null);

  const prevFrameRef = useRef<ReplayFrame | null>(null);
  const deathAtRef = useRef<Record<string, number>>({});
  const critAtRef = useRef<Record<string, number>>({});
  const hitAtRef = useRef<Record<string, number>>({});
  const abilityAtRef = useRef<Record<string, number>>({});
  const atkAtRef = useRef<Record<string, number>>({});
  const floatsRef = useRef<DmgFloat[]>([]);
  const missFloatsRef = useRef<MissFloat[]>([]);

  const maxW = props.width ?? 680;
  const fallbackH = props.height ?? Math.round(maxW / 2);
  const [layout, setLayout] = useState<{ w: number; h: number; dpr: number }>(() => ({
    w: maxW,
    h: fallbackH,
    dpr: typeof window !== "undefined" ? Math.min(2, window.devicePixelRatio || 1) : 1
  }));

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const apply = () => {
      const cw = el.clientWidth;
      const w = Math.max(260, Math.floor(cw > 0 ? Math.min(maxW, cw) : maxW));
      const h = Math.round(w / 2);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      setLayout((prev) => (prev.w === w && prev.h === h && prev.dpr === dpr ? prev : { w, h, dpr }));
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [maxW]);

  const w = layout.w;
  const h = layout.h;
  const dpr = layout.dpr;

  const slotToPos = useMemo(() => {
    const {
      leftXRatio,
      rightXRatio,
      yFrontRatio,
      yBackRatio,
      dxRatio,
      frontMidBiasRatio,
      backMidBiasRatio
    } = ARENA_FORMATION;
    const leftX = w * leftXRatio;
    const rightX = w * rightXRatio;
    const yFront = h * yFrontRatio;
    const yBack = h * yBackRatio;
    const dx = w * dxRatio;
    const af = w * frontMidBiasRatio;
    const ab = w * backMidBiasRatio;
    const map = new Map<string, Pt>();
    map.set("a:0", { x: leftX - dx + af, y: yFront });
    map.set("a:1", { x: leftX + dx + af, y: yFront });
    map.set("a:6", { x: leftX - dx - ab, y: yBack });
    map.set("a:7", { x: leftX + dx - ab, y: yBack });
    map.set("b:0", { x: rightX + dx - af, y: yFront });
    map.set("b:1", { x: rightX - dx - af, y: yFront });
    map.set("b:6", { x: rightX + dx + ab, y: yBack });
    map.set("b:7", { x: rightX - dx + ab, y: yBack });
    return map;
  }, [w, h]);

  const units = useMemo(() => {
    const out: Array<{
      id: string;
      side: "a" | "b";
      slot: number;
      archetypeId: string;
      name: string;
      role: string;
      iconId?: string;
      fxProfileId?: string;
      hp0: number;
      spreadX: number;
      spreadY: number;
    }> = [];

    const battleSeed = props.req.seed?.seed ?? "";

    for (const u of props.req.a.units) {
      const d = props.defsById.get(u.archetype);
      const sp = tacticalSpreadPx(battleSeed, "a", u.id);
      out.push({
        id: u.id,
        side: "a",
        slot: u.slot ?? 0,
        archetypeId: u.archetype,
        name: d?.name ?? u.archetype,
        role: d?.role ?? "dps",
        iconId: (d as any)?.iconId,
        fxProfileId: (d as any)?.fxProfileId,
        hp0: scaledMatchHp(u),
        spreadX: sp.sx,
        spreadY: sp.sy
      });
    }
    for (const u of props.req.b.units) {
      const d = props.defsById.get(u.archetype);
      const sp = tacticalSpreadPx(battleSeed, "b", u.id);
      out.push({
        id: u.id,
        side: "b",
        slot: u.slot ?? 0,
        archetypeId: u.archetype,
        name: d?.name ?? u.archetype,
        role: d?.role ?? "dps",
        iconId: (d as any)?.iconId,
        fxProfileId: (d as any)?.fxProfileId,
        hp0: scaledMatchHp(u),
        spreadX: sp.sx,
        spreadY: sp.sy
      });
    }
    return out;
  }, [props.req, props.defsById]);

  /** Paint back row (slots ≥6) before front so nearer ranks layer correctly. */
  const unitsSorted = useMemo(() => {
    const tier = (slot: number) => (slot >= 6 ? 0 : 1);
    return [...units].sort(
      (a, b) =>
        tier(a.slot) - tier(b.slot) ||
        (a.side === "a" ? 0 : 1) - (b.side === "a" ? 0 : 1) ||
        a.id.localeCompare(b.id)
    );
  }, [units]);

  const arenaResolved = useMemo(
    () => resolveArenaVisual(props.req.seed?.seed ?? ""),
    [props.req.seed?.seed]
  );

  const visualByArchetype = useMemo(() => {
    const m = new Map<string, ReturnType<typeof resolveUnitVisualConfig>>();
    for (const u of units) {
      if (!m.has(u.archetypeId)) {
        m.set(
          u.archetypeId,
          resolveUnitVisualConfig({ archetypeId: u.archetypeId, role: u.role as NvUnitRole })
        );
      }
    }
    return m;
  }, [units]);

  const battleKey = useMemo(() => {
    const a = props.req.a.units.map((u) => `A:${u.id}:${u.slot}:${u.archetype}`).join(",");
    const b = props.req.b.units.map((u) => `B:${u.id}:${u.slot}:${u.archetype}`).join(",");
    return `${props.req.seed?.seed ?? ""}|${a}|${b}`;
  }, [props.req]);

  useEffect(() => {
    deathAtRef.current = {};
    critAtRef.current = {};
    hitAtRef.current = {};
    abilityAtRef.current = {};
    atkAtRef.current = {};
    floatsRef.current = [];
    missFloatsRef.current = [];
    prevFrameRef.current = null;
  }, [battleKey]);

  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const vfx = useMemo(() => arenaVfxTuning(reduceMotion), [reduceMotion]);

  /** Last maneuver / MISS dodge at or before scrub tick (Canvas only sees one frame's uiEvents otherwise). */
  const postureByTick = useMemo(() => {
    const lastManeuver: Record<string, { atTick: number; kind: "cover" | "probe" | "bound" }> = {};
    const lastMissDodge: Record<string, number> = {};
    const frs = props.replayFrames;
    if (!frs?.length) return { lastManeuver, lastMissDodge };
    const idx = clamp(props.replayTickIndex ?? 0, 0, frs.length - 1);
    for (let i = 0; i <= idx; i++) {
      const fr = frs[i]!;
      for (const e of fr.uiEvents ?? []) {
        if (e.kind === "hit" && e.dst && /\bMISS\b/i.test(e.text)) {
          lastMissDodge[e.dst] = fr.t;
        }
        if (e.kind === "ability" && e.src && typeof e.text === "string" && e.text.includes("maneuver_")) {
          let kind: "cover" | "probe" | "bound" | null = null;
          if (e.text.includes("maneuver_take_cover")) kind = "cover";
          else if (e.text.includes("maneuver_probe")) kind = "probe";
          else if (e.text.includes("maneuver_bound")) kind = "bound";
          if (kind) lastManeuver[e.src] = { atTick: fr.t, kind };
        }
      }
    }
    return { lastManeuver, lastMissDodge };
  }, [props.replayFrames, props.replayTickIndex, battleKey]);

  const [decodeGen, bumpDecode] = useReducer((n: number) => n + 1, 0);

  // Preload arena PNG, concept-sheet crops, and SVG idle loops so drawImage is sharp quickly.
  useEffect(() => {
    const urls = new Set<string>();
    urls.add(arenaResolved.config.image);
    for (const u of units) {
      const viz = visualByArchetype.get(u.archetypeId);
      if (viz?.battlefieldSprite) urls.add(viz.battlefieldSprite);
      const roster = iconUrl(u.iconId);
      if (roster) urls.add(roster);
      for (const url of allSpriteUrlsForUnit(u.iconId)) urls.add(url);
    }
    for (const url of urls) {
      if (imgCacheRef.current.has(url)) continue;
      const img = new Image();
      img.decoding = "async";
      img.onload = () => bumpDecode();
      img.onerror = () => bumpDecode();
      img.src = url;
      imgCacheRef.current.set(url, img);
    }
  }, [units, arenaResolved.config.image, visualByArchetype]);

  // Capture event timestamps for cosmetic animation pulses.
  useEffect(() => {
    const now = performance.now();
    const cur = props.frame;
    const prev = prevFrameRef.current;

    if (cur) {
      // deaths: alive flag flip or HP hitting 0 (replay marks dead on lethal hit same tick)
      if (prev) {
        const ids = new Set<string>([
          ...Object.keys(cur.hp),
          ...Object.keys(prev.hp),
          ...Object.keys(cur.alive),
          ...Object.keys(prev.alive)
        ]);
        for (const id of ids) {
          const hpPrev = prev.hp[id] ?? 0;
          const hpCur = cur.hp[id] ?? 0;
          const alivePrev = prev.alive[id];
          const aliveCur = cur.alive[id];
          const wasAlive = alivePrev !== false && hpPrev > 0;
          const isDead = aliveCur === false || hpCur <= 0;
          if (wasAlive && isDead) deathAtRef.current[id] = now;
        }
      }
      // crit/hit pulses this frame
      for (const id of cur.critIds ?? []) critAtRef.current[id] = now;
      for (const id of cur.flashIds ?? []) hitAtRef.current[id] = now;
      for (const id of cur.atkIds ?? []) atkAtRef.current[id] = now;
      for (const e of cur.uiEvents ?? []) {
        if (e.kind === "ability" && e.src && e.dst) {
          abilityAtRef.current[`${e.src}|${e.dst}`] = now;
        }
      }
    }

    prevFrameRef.current = cur;
  }, [props.frame?.t]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    const bw = Math.max(1, Math.round(w * dpr));
    const bh = Math.max(1, Math.round(h * dpr));
    if (c.width !== bw || c.height !== bh) {
      c.width = bw;
      c.height = bh;
    }

    const byId = new Map(units.map((u) => [u.id, u]));

    const draw = (now: number) => {
      const t = now;
      const frame = props.frame;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, c.width, c.height);

      const shakeMag = computeScreenShakeMag(t, frame, critAtRef.current, hitAtRef.current, reduceMotion);
      const sx = shakeMag * Math.sin(t * 0.084);
      const sy = shakeMag * Math.cos(t * 0.071);
      ctx.setTransform(dpr, 0, 0, dpr, sx * dpr, sy * dpr);

      drawArenaBackdropComposite(ctx, w, h, arenaResolved, imgCacheRef.current);

      const ringStr = clamp(arenaResolved.presentation.portraitRingStrength, 0, 1);
      /** Crit inner halo stays partly visible even when portrait ring is off (gameplay read). */
      const ringStrCrit = Math.max(ringStr, 0.38);

      const battleSeedDraw = props.req.seed?.seed ?? "";
      const curTickDraw = frame?.t ?? 0;
      const motionById = new Map<string, UnitMotionBundle>();
      for (const u of unitsSorted) {
        const p0m = slotToPos.get(`${u.side}:${u.slot}`);
        if (!p0m) continue;
        const row: UnitDrawRow = {
          id: u.id,
          side: u.side,
          slot: u.slot,
          spreadX: u.spreadX,
          spreadY: u.spreadY,
          hp0: u.hp0,
          fxProfileId: u.fxProfileId,
          iconId: u.iconId
        };
        const mb = computeUnitFeetMotion(
          row,
          p0m,
          frame,
          t,
          battleSeedDraw,
          reduceMotion,
          vfx.bobMultiplier,
          postureByTick,
          curTickDraw,
          w,
          h,
          deathAtRef.current,
          critAtRef.current,
          hitAtRef.current,
          atkAtRef.current
        );
        if (mb) motionById.set(u.id, mb);
      }

      // Attack lines from events (only first few)
      if (frame?.uiEvents?.length) {
        const drawn = collectStrikeEvents(frame.uiEvents, vfx.strikeLinesMax);
        for (const e of drawn) {
          const src = byId.get(e.src);
          const dst = byId.get(e.dst);
          if (!src || !dst) continue;
          const p1b = slotToPos.get(`${src.side}:${src.slot}` as any);
          const p2b = slotToPos.get(`${dst.side}:${dst.slot}` as any);
          if (!p1b || !p2b) continue;
          const m1 = motionById.get(src.id);
          const m2 = motionById.get(dst.id);
          const p1 = m1 ? { x: m1.x, y: m1.y } : { x: p1b.x + src.spreadX, y: p1b.y + src.spreadY };
          let p2 = m2 ? { x: m2.x, y: m2.y } : { x: p2b.x + dst.spreadX, y: p2b.y + dst.spreadY };
          if (e.kind === "ability" && typeof e.text === "string" && e.text.includes("maneuver_")) {
            const toward = src.side === "a" ? 1 : -1;
            const lateral = src.slot % 2 === 0 ? 1 : -1;
            if (e.text.includes("maneuver_take_cover")) {
              p2 = { x: p1.x - toward * 36, y: p1.y + 12 };
            } else if (e.text.includes("maneuver_probe")) {
              p2 = { x: p1.x + toward * 44, y: p1.y - 10 };
            } else {
              p2 = { x: p1.x + lateral * 32, y: p1.y - 8 };
            }
          }

          // quick pulse that decays
          const isAbility = e.kind === "ability";
          const isCrit = e.kind === "hit" && Boolean(e.crit);
          const pulse0 = isAbility ? 320 : isCrit ? 260 : 220;
          const pulseAt = isAbility
            ? abilityAtRef.current[`${src.id}|${dst.id}`]
            : isCrit
              ? critAtRef.current[src.id]
              : hitAtRef.current[dst.id];
          const age = typeof pulseAt === "number" ? t - pulseAt : 9999;
          const k = 1 - easeOutCubic(age / pulse0);
          const a = clamp(k, 0, 1);

          if (isAbility) {
            // Bezier energy trail + particles
            const mx = (p1.x + p2.x) / 2;
            const my = (p1.y + p2.y) / 2 - 26;
            const g = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
            g.addColorStop(0, `rgba(124,92,255,${0.08 + 0.22 * a})`);
            g.addColorStop(1, `rgba(86,194,255,${0.08 + 0.22 * a})`);
            ctx.strokeStyle = g;
            ctx.lineWidth = 2 + 3 * a;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.quadraticCurveTo(mx, my, p2.x, p2.y);
            ctx.stroke();

            // Particles along the curve
            ctx.fillStyle = `rgba(255,255,255,${0.08 + 0.22 * a})`;
            for (let i = 0; i < 8; i++) {
              const s = (i / 7) * 0.9 + (1 - a) * 0.08;
              const x = (1 - s) * (1 - s) * p1.x + 2 * (1 - s) * s * mx + s * s * p2.x;
              const y = (1 - s) * (1 - s) * p1.y + 2 * (1 - s) * s * my + s * s * p2.y;
              const pr = 1.2 + 2.2 * a * (1 - i / 8);
              ctx.beginPath();
              ctx.arc(x, y, pr, 0, Math.PI * 2);
              ctx.fill();
            }
          } else {
            ctx.strokeStyle = isCrit ? `rgba(255,215,64,${0.22 + 0.45 * a})` : `rgba(255,92,124,${0.12 + 0.28 * a})`;
            ctx.lineWidth = isCrit ? 2 + 3 * a : 2 + 2 * a;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();

            const travel = 1 - easeOutCubic(clamp(age / pulse0, 0, 1));
            const px = p1.x + (p2.x - p1.x) * travel;
            const py = p1.y + (p2.y - p1.y) * travel;
            ctx.beginPath();
            ctx.arc(px, py, isCrit ? 5 : 4, 0, Math.PI * 2);
            ctx.fillStyle = isCrit ? `rgba(255,230,120,${0.35 + 0.45 * a})` : `rgba(255,140,170,${0.28 + 0.38 * a})`;
            ctx.fill();
          }
        }
      }

      // Missed attacks — dashed line overshoots defender; timing tied to attacker pulse.
      if (frame?.uiEvents?.length) {
        const missCap = Math.min(4, vfx.strikeLinesMax);
        const drawnMiss = collectMissStrikeEvents(frame.uiEvents, missCap);
        for (const e of drawnMiss) {
          const src = byId.get(e.src);
          const dst = byId.get(e.dst);
          if (!src || !dst) continue;
          const p1b = slotToPos.get(`${src.side}:${src.slot}` as any);
          const p2b = slotToPos.get(`${dst.side}:${dst.slot}` as any);
          if (!p1b || !p2b) continue;
          const m1 = motionById.get(src.id);
          const m2 = motionById.get(dst.id);
          const p1 = m1 ? { x: m1.x, y: m1.y } : { x: p1b.x + src.spreadX, y: p1b.y + src.spreadY };
          const p2 = m2 ? { x: m2.x, y: m2.y } : { x: p2b.x + dst.spreadX, y: p2b.y + dst.spreadY };
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const len = Math.hypot(dx, dy) || 1;
          const ux = dx / len;
          const uy = dy / len;
          const px = -uy;
          const py = ux;
          const hmiss = hash32(`${battleSeedDraw}|miss_vec|${e.src}|${e.dst}|${frame?.t ?? 0}`);
          const side = (hmiss & 1) === 0 ? 1 : -1;
          const overshoot = 32 + ((hmiss >>> 2) % 36);
          const lateral = side * (10 + ((hmiss >>> 10) % 20));
          const pMiss = {
            x: p2.x + ux * overshoot + px * lateral,
            y: p2.y + uy * overshoot + py * lateral
          };

          const pulse0 = 260;
          const pulseAt = atkAtRef.current[src.id];
          const age = typeof pulseAt === "number" ? t - pulseAt : 9999;
          const k = 1 - easeOutCubic(age / pulse0);
          const a = clamp(k, 0, 1);

          ctx.save();
          ctx.setLineDash([5, 10]);
          ctx.strokeStyle = `rgba(140,200,255,${0.14 + 0.28 * a})`;
          ctx.lineWidth = 1.5 + 1.5 * a;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(pMiss.x, pMiss.y);
          ctx.stroke();
          ctx.setLineDash([]);

          const travel = 1 - easeOutCubic(clamp(age / pulse0, 0, 1));
          const mx = p1.x + (pMiss.x - p1.x) * travel;
          const my = p1.y + (pMiss.y - p1.y) * travel;
          ctx.beginPath();
          ctx.arc(mx, my, 3.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(170,210,255,${0.22 + 0.38 * a})`;
          ctx.fill();
          ctx.restore();
        }
      }

      // Units (back rank first so front rank paints on top)
      for (const u of unitsSorted) {
        const m = motionById.get(u.id);
        if (!m) continue;

        const prof = spriteProfile({ fxProfileId: u.fxProfileId ?? null, iconId: u.iconId ?? null });
        const p = { x: m.x, y: m.y };
        const dir = m.dir;
        const leanTotal = m.leanTotal;
        const phase = m.phase;
        const unitAlive = m.unitAlive;
        const tgt = m.tgt;
        const atk = m.atk;
        const hpPct = m.hpPct;
        const fade = m.fade;
        const critPulse = m.critPulse;
        const hitPulse = m.hitPulse;
        const atkPulse = m.atkPulse;
        const atkAge = m.atkAge;
        const hitAge = m.hitAge;
        const deadAge = m.deadAge;

        if (m.tgt && m.unitAlive && !reduceMotion) {
          p.y += 13 + m.hitPulse * 7;
        }

        const r = 20 + critPulse * 3;

        /** Squash & stretch — idle = 1:1; only hit / atk / death (no idle sine). */
        let cartoonSx = 1;
        let cartoonSy = 1;
        let cartoonWobble = 0;
        if (unitAlive && hitPulse > 0.03) {
          const h = hitPulse;
          cartoonSx += 0.26 * h;
          cartoonSy -= 0.21 * h;
          const tilt = easeOutCubic(clamp(hitAge / 140, 0, 1));
          cartoonWobble += tilt * 0.11 * h * (phase < 0.5 ? 1 : -1);
        }
        if (unitAlive && atkPulse > 0.03) {
          const uAtk = clamp(atkAge / 252, 0, 1);
          const atkArc = uAtk * uAtk * (3 - 2 * uAtk);
          cartoonSx += 0.16 * atkArc;
          cartoonSy -= 0.11 * atkArc;
        }
        if (unitAlive && tgt && !reduceMotion) {
          cartoonSy *= 0.86;
        }
        if (!unitAlive && deadAge < 960) {
          // Three-phase death: stagger (jitter) → buckle (knees go) → topple (rotate + fade).
          // The user reads each phase as a beat instead of a single fade.
          const sideSign = u.side === "a" ? 1 : -1;
          if (deadAge < 200) {
            // Stagger: small alt-sign rotation jitter, body still standing.
            const a = deadAge / 200;
            const jitter = Math.sin(a * Math.PI * 4) * 0.06 * (1 - a * 0.4);
            cartoonWobble += jitter * sideSign;
            cartoonSy *= 1 - 0.04 * a;
          } else if (deadAge < 500) {
            // Buckle: scale.y compresses, body sinks; small tilt builds toward topple.
            const a = (deadAge - 200) / 300;
            const ease = easeOutCubic(a);
            cartoonSy *= 1 - 0.22 * ease;
            cartoonSx *= 1 + 0.10 * ease;
            cartoonWobble += 0.14 * ease * sideSign;
          } else {
            // Topple: rotation accelerates outward, body stretches as it falls.
            const a = (deadAge - 500) / 460;
            const ease = easeOutCubic(a);
            cartoonSy += 0.30 * ease;
            cartoonSx *= 1 - ease * 0.22;
            cartoonWobble += (0.14 + 0.42 * ease) * sideSign;
          }
        }
        cartoonSx = clamp(cartoonSx, 0.64, 1.48);
        cartoonSy = clamp(cartoonSy, 0.56, 1.55);

        // Brief weapon bearing cone while firing (enemy-ward).
        if (atk && unitAlive && atkPulse > 0.05 && !reduceMotion) {
          const coneLen = 58 + atkPulse * 24;
          const spread = 0.13;
          const bx = p.x + dir * 8;
          const by = p.y - 5;
          ctx.fillStyle = `rgba(130,255,210,${0.05 + 0.11 * atkPulse})`;
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(bx + dir * coneLen * Math.cos(-spread), by + coneLen * Math.sin(-spread));
          ctx.lineTo(bx + dir * coneLen * Math.cos(spread), by + coneLen * Math.sin(spread));
          ctx.closePath();
          ctx.fill();
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(leanTotal + cartoonWobble);
        ctx.scale(cartoonSx, cartoonSy);
        ctx.translate(-p.x, -p.y);

        // Shadow — squash-aware oval
        ctx.save();
        ctx.globalAlpha = 0.34 * fade * prof.shadow;
        ctx.fillStyle = "rgba(0,0,0,0.92)";
        ctx.beginPath();
        ctx.ellipse(
          p.x + dir * (atkPulse * 4),
          p.y + 20,
          (22 + critPulse * 2) / Math.max(0.85, cartoonSx),
          (8 + critPulse * 1.2) / Math.max(0.85, cartoonSy),
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.restore();

        // Outer ring — thicker ink read (scales with arena presentation.portraitRingStrength)
        if (ringStr > 0.008) {
          ctx.lineWidth = (4 + hitPulse * 2.5 + critPulse * 2) * ringStr;
          const ringA = (0.16 + 0.22 * hitPulse + 0.30 * critPulse) * fade * ringStr;
          ctx.strokeStyle = critPulse > 0.01
            ? `rgba(255,215,64,${ringA})`
            : tgt
              ? `rgba(255,92,124,${(0.18 + 0.30 * hitPulse) * fade * ringStr})`
              : atk
                ? `rgba(53,208,127,${(0.16 + 0.18 * critPulse) * fade * ringStr})`
                : `rgba(255,255,255,${ringA})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r + 2, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Crit burst halo
        if (critPulse > 0.01 && vfx.critExpansionRing) {
          ctx.strokeStyle = `rgba(255,215,64,${(0.12 + 0.22 * critPulse) * fade * ringStrCrit})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r + 10 + 16 * (1 - critPulse), 0, Math.PI * 2);
          ctx.stroke();
        }

        const vizCfg = visualByArchetype.get(u.archetypeId);
        const sheetUrl = vizCfg?.battlefieldSprite ?? null;
        const crop = vizCfg?.battlefieldCrop;
        let drewBody = false;

        const spritePx = (prof.size / 32) * 88 + critPulse * 8;

        if (sheetUrl && crop) {
          const sheet = imgCacheRef.current.get(sheetUrl);
          if (sheet?.complete && sheet.naturalWidth > 0) {
            const asp = crop.height / crop.width;
            const rowSep = h * (ARENA_FORMATION.yBackRatio - ARENA_FORMATION.yFrontRatio);
            const maxDh = rowSep * 0.54;
            const maxDw = Math.min(w * 0.19, ARENA_FORMATION.dxRatio * w * 1.55);
            let dw = spritePx * 0.78;
            let dh = dw * asp;
            dh = Math.min(dh, maxDh);
            dw = dh / asp;
            if (dw > maxDw) {
              dw = maxDw;
              dh = dw * asp;
              if (dh > maxDh) {
                dh = maxDh;
                dw = dh / asp;
              }
            }
            const { sx, sy, sw, sh } = insetCrop(crop, sheet.naturalWidth, sheet.naturalHeight, 2);
            ctx.save();
            ctx.globalAlpha = fade * 0.98;
            ctx.beginPath();
            ctx.ellipse(p.x, p.y + dh * 0.035, dw * 0.46, dh * 0.44, 0, 0, Math.PI * 2);
            ctx.clip();
            ctx.shadowColor = "rgba(0,0,0,0.35)";
            ctx.shadowBlur = critPulse > 0.01 || hitPulse > 0.01 ? 8 : 5;
            ctx.shadowOffsetY = 2;
            const sheetParts: string[] = [];
            if (hitPulse > 0.02) sheetParts.push(`brightness(${1 + 0.52 * hitPulse})`);
            else if (critPulse > 0.02) sheetParts.push(`brightness(${1 + 0.36 * critPulse})`);
            else if (atkPulse > 0.04) sheetParts.push("brightness(1.08)");
            if (!reduceMotion) {
              sheetParts.push("saturate(1.16)");
              sheetParts.push("contrast(1.06)");
            }
            ctx.filter = sheetParts.length ? sheetParts.join(" ") : "none";
            // Mirror sprite around its own X for team B so the character faces
            // the enemy. Frame/icon overlays drawn outside this save/restore
            // stay in their natural orientation.
            if (u.side === "b") {
              ctx.translate(p.x, 0);
              ctx.scale(-1, 1);
              ctx.translate(-p.x, 0);
            }
            ctx.drawImage(sheet, sx, sy, sw, sh, p.x - dw / 2, p.y - dh / 2, dw, dh);
            ctx.filter = "none";
            ctx.restore();
            if (!reduceMotion && ringStr > 0.008) {
              drawCartoonInkOutlineEllipse(ctx, p.x, p.y + dh * 0.035, dw * 0.47 + 2.5, dh * 0.45 + 2.5, fade * ringStr);
            }
            drewBody = true;
          }
        }

        if (!drewBody) {
          const idleUrls = idleFrameUrlsForUnit(u.iconId);
          const attackUrls = attackFrameUrlsForUnit(u.iconId);
          const deathUrls = deathFrameUrlsForUnit(u.iconId);

          const attacking = unitAlive && atkPulse > 0.04;
          const takingHit = unitAlive && hitPulse > 0.05;
          /** Snap to death pose while corpse fades (prefer last death frame). */
          const deathPose =
            !unitAlive && deadAge < 720 && deathUrls.length > 0 ? deathUrls[Math.min(deathUrls.length - 1, 1)]! : null;

          let frameUrl: string;
          if (deathPose) {
            frameUrl = deathPose;
          } else if (attacking) {
            const atkMs = reduceMotion ? 52 : 34;
            frameUrl =
              attackUrls[Math.floor(t / atkMs + phase * attackUrls.length) % attackUrls.length] ?? attackUrls[0]!;
          } else if (takingHit) {
            /** Brief hit-recoil read: advance idle slightly faster + bias toward “impact” pose. */
            const hitMs = 110;
            frameUrl = idleUrls[Math.floor(t / hitMs + phase * idleUrls.length + hitPulse * 2) % idleUrls.length]!;
          } else {
            const idleMs = reduceMotion ? 340 : 168;
            frameUrl = idleUrls[Math.floor(t / idleMs + phase * idleUrls.length) % idleUrls.length]!;
          }

          let frameImg = imgCacheRef.current.get(frameUrl);
          if (!frameImg) {
            frameImg = new Image();
            frameImg.decoding = "async";
            frameImg.src = frameUrl;
            imgCacheRef.current.set(frameUrl, frameImg);
          }

          if (frameImg.complete && frameImg.naturalWidth > 0) {
            const rowSep = h * (ARENA_FORMATION.yBackRatio - ARENA_FORMATION.yFrontRatio);
            const maxR = Math.min(rowSep * 0.22, ARENA_FORMATION.dxRatio * w * 0.72, spritePx * 0.42);
            const drawR = Math.min(spritePx * 0.44, maxR);
            ctx.save();
            ctx.globalAlpha = fade * 0.98;
            ctx.beginPath();
            ctx.arc(p.x, p.y, drawR, 0, Math.PI * 2);
            ctx.clip();
            ctx.shadowColor = "rgba(0,0,0,0.32)";
            ctx.shadowBlur = critPulse > 0.01 || hitPulse > 0.01 ? 6 : 4;
            ctx.shadowOffsetY = 2;
            const svgParts: string[] = [];
            if (hitPulse > 0.02) svgParts.push(`brightness(${1 + 0.58 * hitPulse})`);
            else if (critPulse > 0.02) svgParts.push(`brightness(${1 + 0.4 * critPulse})`);
            else if (attacking) svgParts.push("brightness(1.09)");
            if (!reduceMotion) {
              svgParts.push("saturate(1.16)");
              svgParts.push("contrast(1.06)");
            }
            ctx.filter = svgParts.length ? svgParts.join(" ") : "none";
            const sq = drawR * 2;
            if (u.side === "b") {
              ctx.translate(p.x, 0);
              ctx.scale(-1, 1);
              ctx.translate(-p.x, 0);
            }
            ctx.drawImage(frameImg, p.x - sq / 2, p.y - sq / 2, sq, sq);
            ctx.filter = "none";
            ctx.restore();
            if (!reduceMotion && ringStr > 0.008) {
              drawCartoonInkOutlineCircle(ctx, p.x, p.y, drawR + 1.4, fade * 0.98 * ringStr);
            }
          } else {
            // Decode fallback: roster icon or role dot until frames load
            ctx.fillStyle = `rgba(0,0,0,${0.34 * fade})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.fill();
            const url = iconUrl(u.iconId);
            if (url) {
              let img = imgCacheRef.current.get(url);
              if (!img) {
                img = new Image();
                img.src = url;
                imgCacheRef.current.set(url, img);
              }
              if (img.complete && img.naturalWidth > 0) {
                ctx.save();
                ctx.translate(p.x, p.y);
                if (u.side === "b") ctx.scale(-1, 1);
                ctx.globalAlpha = 0.95 * fade;
                const s = prof.size + critPulse * 6;
                ctx.drawImage(img, -s / 2, -s / 2, s, s);
                ctx.restore();
              }
            } else {
              ctx.fillStyle = roleStroke(u.role);
              ctx.globalAlpha = 0.88 * fade;
              ctx.beginPath();
              ctx.arc(p.x, p.y, 6 + critPulse * 1.5, 0, Math.PI * 2);
              ctx.fill();
              ctx.globalAlpha = 1;
            }
          }
        }

        if (!reduceMotion && critPulse > 0.08 && vfx.critExpansionRing) {
          drawCartoonCritBurst(ctx, p.x, p.y - 14, critPulse, hash32(u.id));
        }

        // HP bar
        const barW = 46;
        const barH = 6;
        const bx = p.x - barW / 2;
        const by = p.y - r - 14 - hitPulse * 9;
        ctx.globalAlpha = 1 * fade;
        ctx.fillStyle = "rgba(255,255,255,0.10)";
        ctx.fillRect(bx, by, barW, barH);
        ctx.fillStyle = `rgba(53,208,127,${0.65 + 0.20 * hitPulse})`;
        ctx.fillRect(bx, by, Math.max(0, Math.floor(barW * hpPct)), barH);
        ctx.globalAlpha = 1;

        // Label — rounded bold type reads more “toon UI”
        ctx.fillStyle = `rgba(255,255,255,${0.88 * fade})`;
        ctx.font =
          '700 13px ui-rounded, "Segoe UI", ui-sans-serif, system-ui, -apple-system, sans-serif';
        ctx.textAlign = "center";
        ctx.strokeStyle = `rgba(6,4,10,${0.55 * fade})`;
        ctx.lineWidth = 3;
        ctx.strokeText(u.name, p.x, p.y + r + 18);
        ctx.fillText(u.name, p.x, p.y + r + 18);

        ctx.restore();
      }

      // Impact shockwaves on units damaged this tick (cosmetic; paired with hit flash timing).
      if (frame?.flashIds?.length) {
        for (const id of frame.flashIds) {
          const victim = byId.get(id);
          if (!victim) continue;
          const base = slotToPos.get(`${victim.side}:${victim.slot}`);
          if (!base) continue;
          const mv = motionById.get(id);
          const cx = mv ? mv.x : base.x + victim.spreadX;
          const cy = mv ? mv.y : base.y + victim.spreadY;
          const hitAt = hitAtRef.current[id];
          const hitAge = typeof hitAt === "number" ? t - hitAt : 9999;
          const wv = clamp(1 - easeOutCubic(hitAge / 420), 0, 1);
          if (wv < 0.03) continue;
          ctx.save();
          ctx.strokeStyle = `rgba(255,200,120,${0.18 + 0.40 * wv})`;
          ctx.lineWidth = 2 + 5 * wv;
          ctx.beginPath();
          ctx.arc(cx, cy, 18 + 52 * (1 - wv), 0, Math.PI * 2);
          ctx.stroke();
          ctx.strokeStyle = `rgba(255,92,124,${0.10 + 0.26 * wv})`;
          ctx.lineWidth = 1 + 3 * wv;
          ctx.beginPath();
          ctx.arc(cx, cy, 12 + 36 * (1 - wv), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          if (!reduceMotion && wv > 0.08) {
            drawCartoonPowBurst(ctx, cx, cy, wv, hash32(`${id}|pow`));
          }
        }
      }

      // Spawn floating damage numbers from "hit" uiEvents
      if (frame?.uiEvents?.length) {
        for (const e of frame.uiEvents) {
          if (e.kind !== "hit" || !e.dst) continue;
          const m = /dmg=(\d+)/.exec(e.text);
          const dmg = m ? Number(m[1]) : 0;
          if (!Number.isFinite(dmg) || dmg <= 0) continue;
          const dst = byId.get(e.dst);
          if (!dst) continue;
          const pb = slotToPos.get(`${dst.side}:${dst.slot}` as any);
          if (!pb) continue;
          const md = motionById.get(e.dst);
          const fx = md ? md.x : pb.x + dst.spreadX;
          const fy = (md ? md.y : pb.y + dst.spreadY) - 20;
          const id = `${frame.t}|${e.dst}|${dmg}|${e.crit ? 1 : 0}`;
          if (floatsRef.current.some((x) => x.id === id)) continue;
          floatsRef.current.push({ id, x: fx, y: fy, dmg, crit: Boolean(e.crit), t0: t });
        }
        for (const e of frame.uiEvents) {
          if (e.kind !== "hit" || !e.dst || !/\bMISS\b/i.test(e.text)) continue;
          const dst = byId.get(e.dst);
          if (!dst) continue;
          const pb = slotToPos.get(`${dst.side}:${dst.slot}` as any);
          if (!pb) continue;
          const md = motionById.get(e.dst);
          const hid = hash32(`${frame.t}|misslbl|${e.src ?? "?"}|${e.dst}`);
          const fx =
            (md ? md.x : pb.x + dst.spreadX) + (((hid & 15) - 7) * 1.1);
          const fy = (md ? md.y : pb.y + dst.spreadY) - 22 + (((hid >> 4) & 11) - 3);
          const id = `${frame.t}|miss|${e.src ?? "?"}|${e.dst}`;
          if (missFloatsRef.current.some((x) => x.id === id)) continue;
          missFloatsRef.current.push({ id, x: fx, y: fy, t0: t });
        }
      }

      // Draw floating numbers
      if (floatsRef.current.length) {
        const keep: DmgFloat[] = [];
        for (const f of floatsRef.current) {
          const age = t - f.t0;
          if (age > 820) continue;
          keep.push(f);
          const k = 1 - easeOutCubic(age / 820);
          const a = clamp(k, 0, 1);
          const y = f.y - (1 - a) * 22;
          ctx.save();
          ctx.globalAlpha = 0.15 + 0.85 * a;
          const pop = easeOutBack(Math.min(age / 155, 1));
          const scl = clamp((f.crit ? 1.12 : 1) * (0.84 + 0.22 * pop), 0.72, 1.42);
          ctx.translate(f.x, y);
          ctx.rotate(Math.sin(age * 0.092) * 0.17 * Math.min(1, age / 380));
          ctx.scale(scl, scl);
          ctx.font = f.crit
            ? '900 24px ui-rounded, "Segoe UI", ui-sans-serif, system-ui, -apple-system, sans-serif'
            : '900 20px ui-rounded, "Segoe UI", ui-sans-serif, system-ui, -apple-system, sans-serif';
          ctx.textAlign = "center";
          ctx.fillStyle = f.crit ? "rgba(255,215,64,0.98)" : "rgba(255,92,124,0.96)";
          ctx.strokeStyle = "rgba(8,6,14,0.78)";
          ctx.lineWidth = f.crit ? 8 : 6;
          const text = `-${f.dmg}${f.crit ? "!" : ""}`;
          ctx.strokeText(text, 0, 0);
          ctx.fillText(text, 0, 0);
          ctx.restore();
        }
        floatsRef.current = keep;
      }

      if (missFloatsRef.current.length) {
        const keepM: MissFloat[] = [];
        for (const f of missFloatsRef.current) {
          const age = t - f.t0;
          if (age > 760) continue;
          keepM.push(f);
          const k = 1 - easeOutCubic(age / 760);
          const a = clamp(k, 0, 1);
          const y = f.y - (1 - a) * 18;
          ctx.save();
          ctx.globalAlpha = 0.2 + 0.8 * a;
          const pop = easeOutBack(Math.min(age / 140, 1));
          const scl = clamp(0.82 + 0.18 * pop, 0.74, 1.22);
          ctx.translate(f.x, y);
          const tilt = (((hash32(f.id) % 21) - 10) / 240) * Math.min(1, age / 200);
          ctx.rotate(tilt);
          ctx.scale(scl, scl);
          ctx.font =
            '800 17px ui-rounded, "Segoe UI", ui-sans-serif, system-ui, -apple-system, sans-serif';
          ctx.textAlign = "center";
          ctx.fillStyle = "rgba(160,220,255,0.96)";
          ctx.strokeStyle = "rgba(8,10,18,0.72)";
          ctx.lineWidth = 5;
          ctx.strokeText("MISS", 0, 0);
          ctx.fillText("MISS", 0, 0);
          ctx.restore();
        }
        missFloatsRef.current = keepM;
      }

      // End-of-battle vignette + winner flash (cosmetic)
      if (frame?.uiEvents?.some((e) => e.kind === "end")) {
        const winner = props.outcome ?? "draw";
        const aWin = winner === "a";
        const bWin = winner === "b";
        const draw = winner === "draw";

        // Vignette
        const ea = vfx.endWashAlpha;
        const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.15, w / 2, h / 2, Math.max(w, h) * 0.65);
        vg.addColorStop(0, "rgba(0,0,0,0.00)");
        vg.addColorStop(1, `rgba(0,0,0,${0.28 * ea})`);
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, w, h);

        // Winner side wash
        const washA = aWin
          ? `rgba(53,208,127,${0.10 * ea})`
          : draw
            ? `rgba(255,255,255,${0.06 * ea})`
            : `rgba(255,92,124,${0.08 * ea})`;
        const washB = bWin
          ? `rgba(53,208,127,${0.10 * ea})`
          : draw
            ? `rgba(255,255,255,${0.06 * ea})`
            : `rgba(255,92,124,${0.08 * ea})`;
        ctx.fillStyle = washA;
        ctx.fillRect(0, 0, w / 2, h);
        ctx.fillStyle = washB;
        ctx.fillRect(w / 2, 0, w / 2, h);

        // Text badge
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fillRect(w / 2 - 62, 16, 124, 26);
        ctx.fillStyle = "rgba(255,255,255,0.90)";
        ctx.font = "14px ui-sans-serif, system-ui, -apple-system";
        ctx.textAlign = "center";
        ctx.fillText(draw ? "DRAW" : aWin ? "A WINS" : "B WINS", w / 2, 35);
      }

      drawCanvasBoardFrame(ctx, w, h);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [props.frame, postureByTick, units, unitsSorted, slotToPos, w, h, dpr, arenaResolved, visualByArchetype, decodeGen, vfx, props.outcome]);

  return (
    <div ref={hostRef} className="arenaCanvasHost">
      <canvas ref={canvasRef} className="arenaCanvas" style={{ width: w, height: h }} />
    </div>
  );
}

