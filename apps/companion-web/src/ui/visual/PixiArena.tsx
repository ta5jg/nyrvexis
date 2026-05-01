/* =============================================================================
 * File:           apps/companion-web/src/ui/visual/PixiArena.tsx
 * Author:         USDTG GROUP TECHNOLOGY LLC
 * Developer:      Irfan Gedik
 * Created Date:   2026-04-30
 * Last Update:    2026-05-01
 * Version:        0.4.0
 *
 * Description:
 *   WebGL arena renderer: minimal tactical board + asset-driven unit cards.
 *
 * License:
 *   Proprietary. All rights reserved. See LICENSE in the repository root.
 * ============================================================================= */

import React, { useEffect, useMemo, useRef } from "react";
import type { KrBattleSimRequest, KrUnitArchetypeDef, KrUnitRole } from "@kindrail/protocol";
import { Application, Container, Graphics, Text } from "pixi.js";
import type { ReplayFrame } from "../replay";
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

function texturesFor(archetypeId: string, role: KrUnitRole) {
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
  role: KrUnitRole;
  hp0: number;
};

export function PixiArena(props: {
  req: KrBattleSimRequest;
  frame: ReplayFrame | null;
  defsById: Map<string, KrUnitArchetypeDef>;
  outcome?: "a" | "b" | "draw";
  width?: number;
  height?: number;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);

  const frameRef = useRef<ReplayFrame | null>(props.frame);
  const outcomeRef = useRef(props.outcome);
  const prevFrameRef = useRef<ReplayFrame | null>(null);

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
    outcomeRef.current = props.outcome;
  }, [props.outcome]);

  useEffect(() => {
    const now = performance.now();
    const cur = props.frame;
    const prev = prevFrameRef.current;
    if (cur) {
      if (prev) {
        for (const [id, aliveNow] of Object.entries(cur.alive)) {
          const alivePrev = prev.alive[id];
          if (alivePrev !== false && aliveNow === false) {
            deathAtRef.current[id] = now;
          }
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
    prevFrameRef.current = cur;
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
    const roleOf = (r: string): KrUnitRole => {
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
        role: roleOf(d?.role ?? "dps"),
        hp0: u.hp | 0
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

    const unitWrapById = new Map<
      string,
      {
        wrap: Container;
        highlight: Graphics;
        hpFill: Graphics;
        cardRoot: Container;
      }
    >();

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

        const wrap = new Container();
        const highlight = new Graphics();
        wrap.addChild(highlight);
        wrap.addChild(card.root);

        const barY = -CARD_H / 2 - 12;
        const hpBg = new Graphics();
        hpBg.roundRect(-23, barY, 46, 6, 2);
        hpBg.fill({ color: 0xffffff, alpha: 0.12 });
        wrap.addChild(hpBg);

        const hpFill = new Graphics();
        wrap.addChild(hpFill);

        const nameLabel = new Text({
          text: u.name,
          style: {
            fontFamily: "system-ui, -apple-system, ui-sans-serif",
            fontSize: 11,
            fill: 0xd9e4f5,
            fontWeight: "600",
            align: "center",
            stroke: { color: 0x000000, width: 3 },
            letterSpacing: 0
          }
        });
        nameLabel.anchor.set(0.5, 0);
        nameLabel.position.set(0, CARD_H / 2 + 3);
        wrap.addChild(nameLabel);

        unitWrapById.set(u.id, { wrap, highlight, hpFill, cardRoot: card.root });
        unitsLayer.addChild(wrap);
      }

      if (cancelled) {
        app.destroy(true);
        appRef.current = null;
        return;
      }

      const tick = () => {
        const now = performance.now();
        const frame = frameRef.current;
        const bySlot = byId;

        linesG.clear();

        if (frame?.uiEvents?.length) {
          const evs = frame.uiEvents.filter((e) => (e.kind === "hit" || e.kind === "ability") && e.src && e.dst).slice(0, 6);
          for (const e of evs) {
            const src = bySlot.get(e.src!);
            const dst = bySlot.get(e.dst!);
            if (!src || !dst) continue;
            const p1 = slotToPos.get(`${src.side}:${src.slot}`);
            const p2 = slotToPos.get(`${dst.side}:${dst.slot}`);
            if (!p1 || !p2) continue;

            const isAbility = e.kind === "ability";
            const pulse0 = isAbility ? 320 : e.crit ? 260 : 220;
            const pulseAt = isAbility
              ? abilityAtRef.current[`${src.id}|${dst.id}`]
              : e.crit
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
                width: e.crit ? 2 + 3 * a : 2 + 2 * a,
                color: e.crit ? 0xffd740 : 0xff5c7c,
                alpha: e.crit ? 0.22 + 0.45 * a : 0.12 + 0.28 * a
              });
            }
          }
        }

        for (const u of units) {
          const entry = unitWrapById.get(u.id);
          const p0 = slotToPos.get(`${u.side}:${u.slot}`);
          if (!entry || !p0) continue;

          const alive = frame ? frame.alive[u.id] !== false : true;
          const curHp = frame?.hp?.[u.id] ?? u.hp0;
          const maxHp = frame?.maxHp?.[u.id] ?? u.hp0;
          const hpPct = maxHp > 0 ? clamp(curHp / maxHp, 0, 1) : 0;

          const tgt = frame?.tgtIds?.includes(u.id) ?? false;
          const atk = frame?.atkIds?.includes(u.id) ?? false;

          let idSum = 0;
          for (let i = 0; i < u.id.length; i++) idSum = (idSum + u.id.charCodeAt(i)) | 0;
          const phase = (idSum % 1000) / 1000;

          const cfg = resolveUnitVisualConfig({ archetypeId: u.archetypeId, role: u.role });
          let bob = 0;
          let pulseScale = 1;
          if (cfg.idleAnimationPlaceholder.kind === "bob") {
            bob = Math.sin(now / 520 + phase * Math.PI * 2) * cfg.idleAnimationPlaceholder.amplitudePx;
          } else {
            const sp = cfg.idleAnimationPlaceholder.speed;
            pulseScale = 1 + Math.sin(now / (440 / sp) + phase * Math.PI * 2) * cfg.idleAnimationPlaceholder.scaleAmplitude;
          }

          const deathAt = deathAtRef.current[u.id];
          const deadAge = typeof deathAt === "number" ? now - deathAt : 9999;
          const fade = alive ? 1 : clamp(1 - easeOutCubic(deadAge / 700), 0, 1);

          const critAt = critAtRef.current[u.id];
          const critAge = typeof critAt === "number" ? now - critAt : 9999;
          const critPulse = clamp(1 - easeOutCubic(critAge / 260), 0, 1);

          const hitAt = hitAtRef.current[u.id];
          const hitAge = typeof hitAt === "number" ? now - hitAt : 9999;
          const hitPulse = clamp(1 - easeOutCubic(hitAge / 220), 0, 1);

          const atkPulse = clamp(1 - easeOutCubic((typeof atkAtRef.current[u.id] === "number" ? now - atkAtRef.current[u.id]! : 9999) / 180), 0, 1);

          const dir = u.side === "a" ? 1 : -1;
          const baseX = p0.x + dir * (atkPulse * 7);
          const baseY = p0.y + bob;

          entry.wrap.position.set(baseX, baseY);
          entry.wrap.alpha = fade;
          entry.wrap.scale.set(pulseScale, pulseScale);

          entry.highlight.clear();
          const ringR = 22 + critPulse * 3;
          entry.highlight.circle(0, 0, ringR + 2);
          const ringA = 0.16 + 0.22 * hitPulse + 0.3 * critPulse;
          let ringColor = 0xffffff;
          if (critPulse > 0.01) ringColor = 0xffd740;
          else if (tgt) ringColor = 0xff5c7c;
          else if (atk) ringColor = 0x35d07f;
          entry.highlight.stroke({ color: ringColor, alpha: ringA, width: 3 + hitPulse * 2 + critPulse * 1.5 });

          const barY = -CARD_H / 2 - 12;
          entry.hpFill.clear();
          entry.hpFill.roundRect(-23, barY, Math.max(0, 46 * hpPct), 6, 2);
          entry.hpFill.fill({ color: 0x35d07f, alpha: 0.65 + 0.2 * hitPulse });

          entry.cardRoot.tint =
            critPulse > 0.01 ? 0xfff4cc : hitPulse > 0.08 ? 0xe8ddff : 0xffffff;
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

          const washA =
            winner === "a" ? 0x35d07f : winner === "draw" ? 0xffffff : 0xff5c7c;
          const washB =
            winner === "b" ? 0x35d07f : winner === "draw" ? 0xffffff : 0xff5c7c;
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
