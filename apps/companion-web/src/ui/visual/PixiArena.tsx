/* =============================================================================
 * File:           apps/companion-web/src/ui/visual/PixiArena.tsx
 * Author:         USDTG GROUP TECHNOLOGY LLC
 * Developer:      Irfan Gedik
 * Created Date:   2026-04-30
 * Last Update:    2026-05-01
 * Version:        0.5.0
 *
 * Description:
 *   WebGL arena: tactical board + unit cards driven by NyrvexisAnimationSystem
 *   (BattleAnimationDirector + UnitVisual) and replay frames.
 *
 * License:
 *   Proprietary. All rights reserved. See LICENSE in the repository root.
 * ============================================================================= */

import React, { useEffect, useMemo, useRef } from "react";
import { scaledMatchHp, type NvBattleSimRequest, type NvUnitArchetypeDef, type NvUnitRole } from "@nyrvexis/protocol";
import { Application, Container, Graphics, Text } from "pixi.js";
import type { ReplayFrame } from "../replay";
import { BattleAnimationDirector, UnitVisual } from "../../game/animation/NyrvexisAnimationSystem";
import { applyReplayTickToDirector } from "../../game/animation/replayAnimationBridge";
import { createArenaBoardFrame, createArenaSceneBackdrop } from "./pixiSceneBackdrop";
import { createUnitCardView } from "./pixiUnitCard";
import { loadUnitVisualTextures } from "./visualAssetPipeline";
import { resolveRarityVisual, resolveUnitVisualConfig } from "./visualConfigs";

type Pt = { x: number; y: number };

function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n));
}

function easeOutCubic(x: number): number {
  const t = clamp(x, 0, 1);
  return 1 - Math.pow(1 - t, 3);
}

const CARD_W = 54;
const CARD_H = 76;

const texPromiseCache = new Map<string, ReturnType<typeof loadUnitVisualTextures>>();

function texturesFor(archetypeId: string, role: NvUnitRole) {
  const key = `${archetypeId}:${role}`;
  let p = texPromiseCache.get(key);
  if (!p) {
    const cfg = resolveUnitVisualConfig({ archetypeId, role });
    p = loadUnitVisualTextures(cfg);
    texPromiseCache.set(key, p);
  }
  return p;
}

type UnitVm = {
  id: string;
  side: "a" | "b";
  slot: number;
  archetypeId: string;
  name: string;
  role: NvUnitRole;
  hp0: number;
};

function syncUnitsHard(fr: ReplayFrame, visuals: Map<string, { uv: UnitVisual; highlight: Graphics }>, slotToPos: Map<string, Pt>, units: UnitVm[]): void {
  for (const u of units) {
    const entry = visuals.get(u.id);
    if (!entry) continue;
    const hp = fr.hp[u.id] ?? 0;
    const maxH = fr.maxHp[u.id] ?? 1;
    const live = fr.alive[u.id] !== false && hp > 0;
    const p0 = slotToPos.get(`${u.side}:${u.slot}`);
    entry.uv.alive = live;
    entry.uv.setHp(hp, maxH);
    if (p0) entry.uv.syncSlotPosition(p0.x, p0.y);
    if (!live) {
      entry.uv.container.visible = false;
      entry.uv.body.alpha = 0;
      continue;
    }
    entry.uv.container.visible = true;
    entry.uv.body.alpha = 1;
    entry.uv.body.rotation = 0;
    entry.uv.resetToIdle();
  }
}

export function PixiArena(props: {
  req: NvBattleSimRequest;
  frame: ReplayFrame | null;
  /** Previous replay tick (must be `frames[tick-1]` when playback is sequential). Otherwise null → hard sync. */
  prevFrame: ReplayFrame | null;
  defsById: Map<string, NvUnitArchetypeDef>;
  outcome?: "a" | "b" | "draw";
  width?: number;
  height?: number;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);

  const frameRef = useRef<ReplayFrame | null>(props.frame);
  const prevFrameRef = useRef<ReplayFrame | null>(props.prevFrame);
  const outcomeRef = useRef(props.outcome);

  const directorRef = useRef<BattleAnimationDirector | null>(null);
  const lastAppliedTickRef = useRef<number | null>(null);

  const deathAtRef = useRef<Record<string, number>>({});
  const critAtRef = useRef<Record<string, number>>({});
  const hitAtRef = useRef<Record<string, number>>({});
  const abilityAtRef = useRef<Record<string, number>>({});
  const atkAtRef = useRef<Record<string, number>>({});

  const floatsRef = useRef<Array<{ id: string; text: Text; t0: number }>>([]);

  useEffect(() => {
    frameRef.current = props.frame;
  }, [props.frame]);

  useEffect(() => {
    prevFrameRef.current = props.prevFrame;
  }, [props.prevFrame]);

  useEffect(() => {
    outcomeRef.current = props.outcome;
  }, [props.outcome]);

  useEffect(() => {
    const now = performance.now();
    const cur = props.frame;
    const prev = prevFrameRef.current;
    if (cur) {
      if (prev && prev.t === cur.t - 1) {
        const ids = new Set([...Object.keys(cur.hp), ...Object.keys(prev.hp), ...Object.keys(cur.alive), ...Object.keys(prev.alive)]);
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
      for (const id of cur.critIds ?? []) critAtRef.current[id] = now;
      for (const id of cur.flashIds ?? []) hitAtRef.current[id] = now;
      for (const id of cur.atkIds ?? []) atkAtRef.current[id] = now;
      for (const e of cur.uiEvents ?? []) {
        if (e.kind === "ability" && e.src && e.dst) {
          abilityAtRef.current[`${e.src}|${e.dst}`] = now;
        }
      }
    }
  }, [props.frame?.t]);

  const w = props.width ?? 560;
  const h = props.height ?? 260;

  const slotToPos = useMemo(() => {
    const leftX = w * 0.28;
    const rightX = w * 0.72;
    const yFront = h * 0.38;
    const yBack = h * 0.68;
    const dx = w * 0.11;
    const map = new Map<string, Pt>();
    map.set("a:0", { x: leftX - dx, y: yFront });
    map.set("a:1", { x: leftX + dx, y: yFront });
    map.set("a:6", { x: leftX - dx, y: yBack });
    map.set("a:7", { x: leftX + dx, y: yBack });
    map.set("b:0", { x: rightX + dx, y: yFront });
    map.set("b:1", { x: rightX - dx, y: yFront });
    map.set("b:6", { x: rightX + dx, y: yBack });
    map.set("b:7", { x: rightX - dx, y: yBack });
    return map;
  }, [w, h]);

  const units = useMemo((): UnitVm[] => {
    const out: UnitVm[] = [];
    const roleOf = (r: string): NvUnitRole => {
      if (r === "tank" || r === "dps" || r === "support" || r === "control") return r;
      return "dps";
    };
    for (const u of props.req.a.units) {
      const d = props.defsById.get(u.archetype);
      out.push({
        id: u.id,
        side: "a",
        slot: u.slot ?? 0,
        archetypeId: u.archetype,
        name: d?.name ?? u.archetype,
        role: roleOf(d?.role ?? "dps"),
        hp0: scaledMatchHp(u)
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
        role: roleOf(d?.role ?? "dps"),
        hp0: scaledMatchHp(u)
      });
    }
    return out;
  }, [props.req, props.defsById]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    const app = new Application();

    const linesG = new Graphics();
    const unitsLayer = new Container();
    const floatsLayer = new Container();
    const vignetteG = new Graphics();
    const endBadge = new Text({
      text: "",
      style: {
        fontFamily: "system-ui, -apple-system, ui-sans-serif",
        fontSize: 14,
        fill: 0xffffff,
        fontWeight: "600",
        align: "center"
      }
    });
    endBadge.anchor.set(0.5, 0.5);
    endBadge.position.set(w / 2, 28);
    endBadge.visible = false;

    const unitVisualById = new Map<string, { uv: UnitVisual; highlight: Graphics }>();

    const director = new BattleAnimationDirector();
    directorRef.current = director;
    lastAppliedTickRef.current = null;

    (async () => {
      await app.init({
        width: w,
        height: h,
        backgroundAlpha: 0,
        antialias: true,
        resolution: typeof window !== "undefined" ? Math.min(2, window.devicePixelRatio || 1) : 1,
        autoDensity: true,
        preference: "webgl"
      });

      if (cancelled) {
        app.destroy(true);
        return;
      }

      host.appendChild(app.canvas as HTMLCanvasElement);
      appRef.current = app;

      const byId = new Map(units.map((u) => [u.id, u]));

      const slotPt = (unitId: string): Pt | null => {
        const u = byId.get(unitId);
        if (!u) return null;
        return slotToPos.get(`${u.side}:${u.slot}`) ?? null;
      };

      const stage = app.stage;
      stage.addChild(createArenaSceneBackdrop(w, h));
      stage.addChild(linesG);
      stage.addChild(unitsLayer);
      stage.addChild(floatsLayer);
      stage.addChild(vignetteG);
      stage.addChild(createArenaBoardFrame(w, h));
      stage.addChild(endBadge);

      for (const u of units) {
        const cfg = resolveUnitVisualConfig({ archetypeId: u.archetypeId, role: u.role });
        const rarity = resolveRarityVisual(cfg.rarity);
        const textures = await texturesFor(u.archetypeId, u.role);
        const resolvedTex = await textures;
        const card = createUnitCardView({
          cfg,
          rarity,
          textures: resolvedTex,
          width: CARD_W,
          height: CARD_H
        });

        const highlight = new Graphics();
        const p0 = slotToPos.get(`${u.side}:${u.slot}`) ?? { x: w / 2, y: h / 2 };

        const uv = new UnitVisual({
          id: u.id,
          name: u.name,
          team: u.side === "a" ? "A" : "B",
          x: p0.x,
          y: p0.y,
          body: card.root,
          bodyScale: 1
        });

        uv.container.addChildAt(highlight, 0);
        uv.setHp(u.hp0, u.hp0);

        unitVisualById.set(u.id, { uv, highlight });
        director.register(uv);
        unitsLayer.addChild(uv.container);
      }

      if (cancelled) {
        app.destroy(true);
        appRef.current = null;
        directorRef.current = null;
        return;
      }

      const tick = () => {
        const now = performance.now();
        const dt = Math.min(0.05, app.ticker.deltaMS / 1000);
        director.update(dt);

        const frame = frameRef.current;
        const prevFrameSnap = prevFrameRef.current;

        if (frame && directorRef.current) {
          const lt = lastAppliedTickRef.current;
          if (lt !== frame.t) {
            const pf = prevFrameSnap;
            const steppedOneForward = lt !== null && frame.t === lt + 1;
            const stepSequential =
              steppedOneForward && pf !== null && pf.t === lt;
            if (stepSequential) {
              applyReplayTickToDirector(pf, frame, directorRef.current);
            } else {
              syncUnitsHard(frame, unitVisualById, slotToPos, units);
            }
            lastAppliedTickRef.current = frame.t;
          }
        }

        const bySlot = byId;

        linesG.clear();

        if (frame?.uiEvents?.length) {
          const evs = frame.uiEvents.filter((e): e is Extract<(typeof frame.uiEvents)[number], { kind: "hit" | "ability" }> => {
            return (e.kind === "hit" || e.kind === "ability") && Boolean(e.src) && Boolean((e as { dst?: string }).dst);
          }).slice(0, 6);
          for (const e of evs) {
            const src = bySlot.get(e.src!);
            const dst = bySlot.get(e.dst!);
            if (!src || !dst) continue;
            const p1 = slotToPos.get(`${src.side}:${src.slot}`);
            let p2 = slotToPos.get(`${dst.side}:${dst.slot}`);
            if (!p1 || !p2) continue;

            if (e.kind === "ability" && typeof e.text === "string" && e.text.includes("maneuver_")) {
              const toward = src.side === "a" ? 1 : -1;
              const lateral = src.slot % 2 === 0 ? 1 : -1;
              let p2x = p2.x;
              let p2y = p2.y;
              if (e.text.includes("maneuver_take_cover")) {
                p2x = p1.x - toward * 36;
                p2y = p1.y + 12;
              } else if (e.text.includes("maneuver_probe")) {
                p2x = p1.x + toward * 44;
                p2y = p1.y - 10;
              } else {
                p2x = p1.x + lateral * 32;
                p2y = p1.y - 8;
              }
              p2 = { x: p2x, y: p2y };
            }

            const isAbility = e.kind === "ability";
            const isCrit = e.kind === "hit" && Boolean(e.crit);
            const pulse0 = isAbility ? 320 : isCrit ? 260 : 220;
            const pulseAt = isAbility
              ? abilityAtRef.current[`${src.id}|${dst.id}`]
              : isCrit
                ? critAtRef.current[src.id]
                : hitAtRef.current[dst.id];
            const age = typeof pulseAt === "number" ? now - pulseAt : 9999;
            const k = 1 - easeOutCubic(age / pulse0);
            const a = clamp(k, 0, 1);

            if (isAbility) {
              const mx = (p1.x + p2.x) / 2;
              const my = (p1.y + p2.y) / 2 - 26;
              linesG.moveTo(p1.x, p1.y);
              linesG.quadraticCurveTo(mx, my, p2.x, p2.y);
              linesG.stroke({
                width: 2 + 3 * a,
                color: 0x7c5cff,
                alpha: 0.08 + 0.22 * a
              });
            } else {
              linesG.moveTo(p1.x, p1.y);
              linesG.lineTo(p2.x, p2.y);
              linesG.stroke({
                width: isCrit ? 2 + 3 * a : 2 + 2 * a,
                color: isCrit ? 0xffd740 : 0xff5c7c,
                alpha: isCrit ? 0.22 + 0.45 * a : 0.12 + 0.28 * a
              });
            }
          }
        }

        for (const u of units) {
          const entry = unitVisualById.get(u.id);
          const p0 = slotToPos.get(`${u.side}:${u.slot}`);
          if (!entry || !p0) continue;

          entry.uv.syncSlotPosition(p0.x, p0.y);

          const fr = frame;
          const aliveRec = fr ? fr.alive[u.id] !== false && (fr.hp[u.id] ?? 0) > 0 : true;
          if (!aliveRec && !entry.uv.container.visible) continue;

          const tgt = fr?.tgtIds?.includes(u.id) ?? false;
          const atk = fr?.atkIds?.includes(u.id) ?? false;

          const deathAt = deathAtRef.current[u.id];
          const deadAge = typeof deathAt === "number" ? now - deathAt : 9999;
          const fade = aliveRec ? 1 : clamp(1 - easeOutCubic(deadAge / 700), 0, 1);

          const critAt = critAtRef.current[u.id];
          const critAge = typeof critAt === "number" ? now - critAt : 9999;
          const critPulse = clamp(1 - easeOutCubic(critAge / 260), 0, 1);

          const hitAt = hitAtRef.current[u.id];
          const hitAge = typeof hitAt === "number" ? now - hitAt : 9999;
          const hitPulse = clamp(1 - easeOutCubic(hitAge / 220), 0, 1);

          const atkPulse = clamp(
            1 - easeOutCubic((typeof atkAtRef.current[u.id] === "number" ? now - atkAtRef.current[u.id]! : 9999) / 180),
            0,
            1
          );

          entry.uv.container.alpha = fade;

          entry.highlight.clear();
          const ringR = 22 + critPulse * 3;
          entry.highlight.circle(0, 0, ringR + 2);
          const ringA = 0.16 + 0.22 * hitPulse + 0.3 * critPulse;
          let ringColor = 0xffffff;
          if (critPulse > 0.01) ringColor = 0xffd740;
          else if (tgt) ringColor = 0xff5c7c;
          else if (atk) ringColor = 0x35d07f;
          entry.highlight.stroke({ color: ringColor, alpha: ringA, width: 3 + hitPulse * 2 + critPulse * 1.5 });
        }

        if (frame?.uiEvents?.length) {
          for (const e of frame.uiEvents) {
            if (e.kind !== "hit" || !e.dst) continue;
            const m = /dmg=(\d+)/.exec(e.text);
            const dmg = m ? Number(m[1]) : 0;
            if (!Number.isFinite(dmg) || dmg <= 0) continue;
            const dst = byId.get(e.dst);
            if (!dst) continue;
            const p = slotToPos.get(`${dst.side}:${dst.slot}`);
            if (!p) continue;
            const fid = `${frame.t}|${e.dst}|${dmg}|${e.crit ? 1 : 0}`;
            if (floatsRef.current.some((x) => x.id === fid)) continue;
            const t = new Text({
              text: `-${dmg}${e.crit ? "!" : ""}`,
              style: {
                fontFamily: "system-ui, -apple-system, ui-sans-serif",
                fontSize: e.crit ? 18 : 16,
                fill: e.crit ? 0xffd740 : 0xff5c7c,
                fontWeight: "700",
                stroke: { color: 0x000000, width: 4 }
              }
            });
            t.anchor.set(0.5, 0.5);
            t.position.set(p.x, p.y - 20);
            floatsLayer.addChild(t);
            floatsRef.current.push({ id: fid, text: t, t0: now });
          }
        }

        if (floatsRef.current.length) {
          const keep: typeof floatsRef.current = [];
          for (const f of floatsRef.current) {
            const age = now - f.t0;
            if (age > 820) {
              floatsLayer.removeChild(f.text);
              f.text.destroy();
              continue;
            }
            keep.push(f);
            const dstId = f.id.split("|")[1];
            const pt = dstId ? slotPt(dstId) : null;
            const baseX = pt?.x ?? f.text.position.x;
            const baseY = (pt?.y ?? f.text.position.y + 20) - 20;
            const k = 1 - easeOutCubic(age / 820);
            const a = clamp(k, 0, 1);
            f.text.alpha = 0.15 + 0.85 * a;
            f.text.position.set(baseX, baseY - (1 - a) * 22);
          }
          floatsRef.current = keep;
        }

        vignetteG.clear();
        endBadge.visible = false;
        if (frame?.uiEvents?.some((e) => e.kind === "end")) {
          const winner = outcomeRef.current ?? "draw";
          const vg = vignetteG;
          vg.rect(0, 0, w, h);
          vg.fill({ color: 0x000000, alpha: 0.28 });

          const washA = winner === "a" ? 0x35d07f : winner === "draw" ? 0xffffff : 0xff5c7c;
          const washB = winner === "b" ? 0x35d07f : winner === "draw" ? 0xffffff : 0xff5c7c;
          const aA = winner === "a" ? 0.1 : winner === "draw" ? 0.06 : 0.08;
          const aB = winner === "b" ? 0.1 : winner === "draw" ? 0.06 : 0.08;
          vg.rect(0, 0, w / 2, h);
          vg.fill({ color: washA, alpha: aA });
          vg.rect(w / 2, 0, w / 2, h);
          vg.fill({ color: washB, alpha: aB });

          endBadge.text = winner === "draw" ? "DRAW" : winner === "a" ? "A WINS" : "B WINS";
          endBadge.visible = true;
        }
      };

      app.ticker.add(tick);
    })();

    return () => {
      cancelled = true;
      floatsRef.current.forEach((f) => {
        try {
          f.text.destroy();
        } catch {
          /* noop */
        }
      });
      floatsRef.current = [];
      directorRef.current = null;
      lastAppliedTickRef.current = null;
      const a = appRef.current;
      if (a) {
        try {
          a.destroy(true);
        } catch {
          /* noop */
        }
        appRef.current = null;
      }
    };
  }, [w, h, units, slotToPos]);

  return <div ref={hostRef} className="arenaPixiHost" style={{ lineHeight: 0 }} />;
}
