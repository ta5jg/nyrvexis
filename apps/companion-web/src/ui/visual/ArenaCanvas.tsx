/* =============================================================================
 * File:           apps/companion-web/src/ui/visual/ArenaCanvas.tsx
 * Author:         USDTG GROUP TECHNOLOGY LLC
 * Developer:      Irfan Gedik
 * Created Date:   2026-04-30
 * Last Update:    2026-05-01
 * Version:        0.5.0
 *
 * Description:
 *   Canvas-based arena renderer driven by replay frames (pure UI).
 *
 * License:
 *   Proprietary. All rights reserved. See LICENSE in the repository root.
 * ============================================================================= */

import React, { useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { KrBattleSimRequest, KrUnitArchetypeDef, KrUnitRole } from "@kindrail/protocol";
import type { ReplayFrame, ReplayUiEvent } from "../replay";
import { idleFrameUrlsForUnit } from "./spriteAssets";
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
      out.push({ ...e, src: e.src, dst: e.dst });
    } else if (e.kind === "ability" && e.src && e.dst) {
      out.push({ ...e, src: e.src, dst: e.dst });
    }
  }
  return out;
}

type Pt = { x: number; y: number };
type DmgFloat = { id: string; x: number; y: number; dmg: number; crit?: boolean; t0: number };

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

export function ArenaCanvas(props: {
  req: KrBattleSimRequest;
  frame: ReplayFrame | null;
  defsById: Map<string, KrUnitArchetypeDef>;
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
    }> = [];

    for (const u of props.req.a.units) {
      const d = props.defsById.get(u.archetype);
      out.push({
        id: u.id,
        side: "a",
        slot: u.slot ?? 0,
        archetypeId: u.archetype,
        name: d?.name ?? u.archetype,
        role: d?.role ?? "dps",
        iconId: (d as any)?.iconId,
        fxProfileId: (d as any)?.fxProfileId,
        hp0: u.hp | 0
      });
    }
    for (const u of props.req.b.units) {
      const d = props.defsById.get(u.archetype);
      out.push({
        id: u.id,
        side: "b",
        slot: u.slot ?? 0,
        archetypeId: u.archetype,
        name: d?.name ?? u.archetype,
        role: d?.role ?? "dps",
        iconId: (d as any)?.iconId,
        fxProfileId: (d as any)?.fxProfileId,
        hp0: u.hp | 0
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
          resolveUnitVisualConfig({ archetypeId: u.archetypeId, role: u.role as KrUnitRole })
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
      for (const url of idleFrameUrlsForUnit(u.iconId)) urls.add(url);
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
      // deaths: alive true -> false
      if (prev) {
        for (const [id, aliveNow] of Object.entries(cur.alive)) {
          const alivePrev = prev.alive[id];
          if (alivePrev !== false && aliveNow === false) {
            deathAtRef.current[id] = now;
          }
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
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      drawArenaBackdropComposite(ctx, w, h, arenaResolved, imgCacheRef.current);

      // Attack lines from events (only first few)
      if (frame?.uiEvents?.length) {
        const drawn = collectStrikeEvents(frame.uiEvents, vfx.strikeLinesMax);
        for (const e of drawn) {
          const src = byId.get(e.src);
          const dst = byId.get(e.dst);
          if (!src || !dst) continue;
          const p1 = slotToPos.get(`${src.side}:${src.slot}` as any);
          const p2 = slotToPos.get(`${dst.side}:${dst.slot}` as any);
          if (!p1 || !p2) continue;

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
          }
        }
      }

      // Units (back rank first so front rank paints on top)
      for (const u of unitsSorted) {
        const p0 = slotToPos.get(`${u.side}:${u.slot}`);
        if (!p0) continue;

        const alive = frame ? frame.alive[u.id] !== false : true;
        const curHp = frame?.hp?.[u.id] ?? u.hp0;
        const maxHp = frame?.maxHp?.[u.id] ?? u.hp0;
        const hpPct = maxHp > 0 ? clamp(curHp / maxHp, 0, 1) : 0;

        const tgt = frame?.tgtIds?.includes(u.id) ?? false;
        const atk = frame?.atkIds?.includes(u.id) ?? false;

        const prof = spriteProfile({ fxProfileId: u.fxProfileId ?? null, iconId: u.iconId ?? null });

        // Idle bob (seeded-ish by id hash via simple char sum)
        let idSum = 0;
        for (let i = 0; i < u.id.length; i++) idSum = (idSum + u.id.charCodeAt(i)) | 0;
        const phase = (idSum % 1000) / 1000;
        const bob = Math.sin(t / 520 + phase * Math.PI * 2) * prof.bob * vfx.bobMultiplier;

        // Death fade-out (linger ~700ms)
        const deathAt = deathAtRef.current[u.id];
        const deadAge = typeof deathAt === "number" ? t - deathAt : 9999;
        const fade = alive ? 1 : clamp(1 - easeOutCubic(deadAge / 700), 0, 1);
        if (fade < 0.02) continue;

        // Crit burst (attacker pulse)
        const critAt = critAtRef.current[u.id];
        const critAge = typeof critAt === "number" ? t - critAt : 9999;
        const critPulse = clamp(1 - easeOutCubic(critAge / 260), 0, 1);

        // Hit flash (target pulse)
        const hitAt = hitAtRef.current[u.id];
        const hitAge = typeof hitAt === "number" ? t - hitAt : 9999;
        const hitPulse = clamp(1 - easeOutCubic(hitAge / 220), 0, 1);

        // Attack lunge (attacker pulse)
        const atkAt = atkAtRef.current[u.id];
        const atkAge = typeof atkAt === "number" ? t - atkAt : 9999;
        const atkPulse = clamp(1 - easeOutCubic(atkAge / 180), 0, 1);

        const p = { x: p0.x, y: p0.y + bob };
        // lunge direction towards center
        const dir = u.side === "a" ? 1 : -1;
        p.x += dir * (atkPulse * 7);
        const r = 20 + critPulse * 3;

        // Shadow
        ctx.save();
        ctx.globalAlpha = 0.28 * fade * prof.shadow;
        ctx.fillStyle = "rgba(0,0,0,0.9)";
        ctx.beginPath();
        ctx.ellipse(p0.x + dir * (atkPulse * 4), p0.y + 18, 20 + critPulse * 2, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Outer ring
        ctx.lineWidth = 3 + hitPulse * 2 + critPulse * 1.5;
        const ringA = (0.16 + 0.22 * hitPulse + 0.30 * critPulse) * fade;
        ctx.strokeStyle = critPulse > 0.01
          ? `rgba(255,215,64,${ringA})`
          : tgt
            ? `rgba(255,92,124,${(0.18 + 0.30 * hitPulse) * fade})`
            : atk
              ? `rgba(53,208,127,${(0.16 + 0.18 * critPulse) * fade})`
              : `rgba(255,255,255,${ringA})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r + 2, 0, Math.PI * 2);
        ctx.stroke();

        // Crit burst halo
        if (critPulse > 0.01 && vfx.critExpansionRing) {
          ctx.strokeStyle = `rgba(255,215,64,${(0.12 + 0.22 * critPulse) * fade})`;
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
            ctx.drawImage(sheet, sx, sy, sw, sh, p.x - dw / 2, p.y - dh / 2, dw, dh);
            ctx.restore();
            drewBody = true;
          }
        }

        if (!drewBody) {
          const idleUrls = idleFrameUrlsForUnit(u.iconId);
          const frameIdx = Math.floor(t / 200 + phase * idleUrls.length) % idleUrls.length;
          const frameUrl = idleUrls[frameIdx]!;
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
            const sq = drawR * 2;
            ctx.drawImage(frameImg, p.x - sq / 2, p.y - sq / 2, sq, sq);
            ctx.restore();
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

        // HP bar
        const barW = 46;
        const barH = 6;
        const bx = p.x - barW / 2;
        const by = p.y - r - 14;
        ctx.globalAlpha = 1 * fade;
        ctx.fillStyle = "rgba(255,255,255,0.10)";
        ctx.fillRect(bx, by, barW, barH);
        ctx.fillStyle = `rgba(53,208,127,${0.65 + 0.20 * hitPulse})`;
        ctx.fillRect(bx, by, Math.max(0, Math.floor(barW * hpPct)), barH);
        ctx.globalAlpha = 1;

        // Label
        ctx.fillStyle = `rgba(255,255,255,${0.82 * fade})`;
        ctx.font = "12px ui-sans-serif, system-ui, -apple-system";
        ctx.textAlign = "center";
        ctx.fillText(u.name, p.x, p.y + r + 18);
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
          const p = slotToPos.get(`${dst.side}:${dst.slot}` as any);
          if (!p) continue;
          const id = `${frame.t}|${e.dst}|${dmg}|${e.crit ? 1 : 0}`;
          if (floatsRef.current.some((x) => x.id === id)) continue;
          floatsRef.current.push({ id, x: p.x, y: p.y - 20, dmg, crit: Boolean(e.crit), t0: t });
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
          ctx.font = f.crit ? "bold 18px ui-sans-serif, system-ui, -apple-system" : "bold 16px ui-sans-serif, system-ui, -apple-system";
          ctx.textAlign = "center";
          ctx.fillStyle = f.crit ? "rgba(255,215,64,0.95)" : "rgba(255,92,124,0.92)";
          ctx.strokeStyle = "rgba(0,0,0,0.55)";
          ctx.lineWidth = 4;
          const text = `-${f.dmg}${f.crit ? "!" : ""}`;
          ctx.strokeText(text, f.x, y);
          ctx.fillText(text, f.x, y);
          ctx.restore();
        }
        floatsRef.current = keep;
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
  }, [props.frame, units, unitsSorted, slotToPos, w, h, dpr, arenaResolved, visualByArchetype, decodeGen, vfx]);

  return (
    <div ref={hostRef} className="arenaCanvasHost">
      <canvas ref={canvasRef} className="arenaCanvas" style={{ width: w, height: h }} />
    </div>
  );
}

