import {
  NvBattleOutcome,
  NvBattleSimRequest,
  NvBattleSimResult,
  MATCH_PACING,
  scaleUnitForMatchPacing,
  type NvActiveSynergy,
  type NvBattleEvent,
  type NvBattleEventPresentation,
  type NvStatusKind,
  type NvUnit
} from "@nyrvexis/protocol";
import { seedToU32, XorShift32 } from "./rng.js";
import { applyBonusToUnit, evaluateTeamSynergies, type SynergyCatalogView } from "./synergy.js";

export type RunBattleSimOptions = {
  /** Optional catalog view; when supplied, synergies fire and stat bonuses
   * are applied before combat (deterministic, computed once per team). */
  synergyCatalog?: SynergyCatalogView;
};

type StatusState = {
  kind: NvStatusKind;
  dur: number;
  mag: number;
  srcId?: string;
};

type LiveUnit = {
  team: "a" | "b";
  base: NvUnit;
  hp: number;
  cd: number; // cooldown accumulator (ticks)
  alive: boolean;
  shield: number;
  statuses: StatusState[];
};

function aliveUnits(units: LiveUnit[], team: "a" | "b"): LiveUnit[] {
  return units.filter((u) => u.team === team && u.alive);
}

function hasStatus(u: LiveUnit, kind: NvStatusKind): boolean {
  return u.statuses.some((s) => s.kind === kind && s.dur > 0);
}

function applyStatus(
  events: NvBattleEvent[],
  t: number,
  src: LiveUnit,
  dst: LiveUnit,
  kind: NvStatusKind,
  dur: number,
  mag: number
) {
  // replace existing same-kind status (simplest v1 rule)
  dst.statuses = dst.statuses.filter((s) => s.kind !== kind);
  dst.statuses.push({ kind, dur, mag, srcId: src.base.id });
  if (kind === "shield") dst.shield = Math.max(0, (dst.shield + mag) | 0);

  const selfApply = src.base.id === dst.base.id;
  events.push({
    t,
    kind: "status_apply",
    src: src.base.id,
    dst: dst.base.id,
    status: { kind, dur, mag },
    presentation: selfApply ? { srcIntent: "advance" } : { dstIntent: "hit" }
  });
}

function frontBackScore(u: LiveUnit): number {
  // slots 0..5 = front row, 6..11 = back row
  const slot = (u.base.slot ?? 0) | 0;
  return slot <= 5 ? 0 : 1;
}

function pickTarget(rng: XorShift32, units: LiveUnit[], enemyTeam: "a" | "b"): LiveUnit | null {
  const enemies = aliveUnits(units, enemyTeam);
  if (enemies.length === 0) return null;

  // v1 targeting:
  // 1) if any enemy has taunt => must target taunt units
  const taunters = enemies.filter((e) => hasStatus(e, "taunt"));
  const pool = taunters.length > 0 ? taunters : enemies;

  // 2) prefer front row if any alive in pool
  const front = pool.filter((e) => frontBackScore(e) === 0);
  const finalPool = front.length > 0 ? front : pool;

  return finalPool[rng.nextInt(0, finalPool.length - 1)] ?? null;
}

function damageRoll(rng: XorShift32, src: LiveUnit, dst: LiveUnit): { dmg: number; crit: boolean } {
  const atk = src.base.atk | 0;
  const def = dst.base.def | 0;
  let dmg = Math.max(1, atk - def);

  const critPct = src.base.critPct | 0;
  const critMulPct = src.base.critMulPct | 0;
  const crit = critPct > 0 ? rng.nextInt(1, 100) <= critPct : false;
  if (crit) dmg = Math.max(1, Math.floor((dmg * critMulPct) / 100));

  return { dmg, crit };
}

function dealDamage(
  events: NvBattleEvent[],
  t: number,
  srcId: string,
  dst: LiveUnit,
  rawDmg: number,
  crit: boolean,
  presentation?: NvBattleEventPresentation
) {
  let dmg = rawDmg | 0;

  if (dst.shield > 0) {
    const absorbed = Math.min(dst.shield, dmg) | 0;
    dst.shield = (dst.shield - absorbed) | 0;
    dmg = (dmg - absorbed) | 0;
  }

  if (dmg > 0) {
    dst.hp = Math.max(0, (dst.hp - dmg) | 0);
  }

  const pres: NvBattleEventPresentation | undefined =
    presentation ??
    (srcId === "bleed"
      ? { dstIntent: "hit" }
      : { srcIntent: "attack", dstIntent: "hit" });

  events.push({
    t,
    kind: "hit",
    src: srcId,
    dst: dst.base.id,
    dmg: Math.max(0, dmg),
    crit,
    presentation: pres
  });

  if (dst.hp === 0 && dst.alive) {
    dst.alive = false;
    events.push({
      t,
      kind: "death",
      src: srcId,
      dst: dst.base.id,
      presentation: { dstIntent: "death" }
    });
  }
}

function unitAbilityId(u: LiveUnit): string | null {
  // v1 mapping from archetype to ability
  // - soldier: shield self
  // - brute: taunt self
  // - rogue: bleed on hit
  // - archer: stun on hit (small chance)
  const a = u.base.archetype;
  if (a === "soldier") return "shield_self";
  if (a === "brute") return "taunt_self";
  if (a === "rogue") return "bleed_on_hit";
  if (a === "archer") return "stun_on_hit";
  return null;
}

function applyStartOfTurnAbility(events: NvBattleEvent[], t: number, rng: XorShift32, u: LiveUnit) {
  if (!u.alive) return;
  if (hasStatus(u, "stun")) return;

  const ability = unitAbilityId(u);
  if (!ability) return;

  if (ability === "shield_self") {
    // once every act: add small shield
    events.push({
      t,
      kind: "ability",
      src: u.base.id,
      abilityId: ability,
      presentation: { srcIntent: "advance" }
    });
    // 35% of max hp as shield (int)
    const mag = Math.max(1, Math.floor(((u.base.hp | 0) * 35) / 100));
    applyStatus(events, t, u, u, "shield", 999, mag);
  } else if (ability === "taunt_self") {
    events.push({
      t,
      kind: "ability",
      src: u.base.id,
      abilityId: ability,
      presentation: { srcIntent: "advance" }
    });
    applyStatus(events, t, u, u, "taunt", 6, 1);
  } else if (ability === "stun_on_hit") {
    // handled in on-hit
    void rng;
  } else if (ability === "bleed_on_hit") {
    // handled in on-hit
    void rng;
  }
}

function applyOnHitAbility(
  events: NvBattleEvent[],
  t: number,
  rng: XorShift32,
  src: LiveUnit,
  dst: LiveUnit
) {
  const ability = unitAbilityId(src);
  if (!ability) return;

  if (ability === "bleed_on_hit") {
    events.push({
      t,
      kind: "ability",
      src: src.base.id,
      dst: dst.base.id,
      abilityId: ability,
      presentation: { srcIntent: "attack" }
    });
    applyStatus(events, t, src, dst, "bleed", 5, 2); // 2 dmg per tick
  } else if (ability === "stun_on_hit") {
    const roll = rng.nextInt(1, 100);
    if (roll <= 15) {
      events.push({
        t,
        kind: "ability",
        src: src.base.id,
        dst: dst.base.id,
        abilityId: ability,
        presentation: { srcIntent: "attack" }
      });
      applyStatus(events, t, src, dst, "stun", 2, 1);
    }
  }
}

function tickStatuses(events: NvBattleEvent[], t: number, units: LiveUnit[]) {
  for (const u of units) {
    if (!u.alive) continue;

    let bleedDmg = 0;
    for (const s of u.statuses) {
      if (s.dur <= 0) continue;
      if (s.kind === "bleed") bleedDmg += s.mag | 0;
    }

    if (bleedDmg > 0) {
      dealDamage(events, t, "bleed", u, bleedDmg, false);
      events.push({ t, kind: "status_tick", dst: u.base.id, status: { kind: "bleed", dur: 0, mag: bleedDmg } });
    }

    // decrement durations (except shield, which is capacity-like)
    u.statuses = u.statuses
      .map((s) => ({
        ...s,
        dur: s.kind === "shield" ? s.dur : Math.max(0, (s.dur - 1) | 0)
      }))
      .filter((s) => s.dur > 0 || s.kind === "shield");
  }
}

export function runBattleSim(
  input: unknown,
  options: RunBattleSimOptions = {}
): NvBattleSimResult {
  const req = NvBattleSimRequest.parse(input);
  const rng = new XorShift32(seedToU32(req.seed.seed));

  // Compute synergies (if catalog supplied) and apply flat stat bonuses to
  // each team's units before pacing scaling — deterministic, no RNG.
  let activeA: NvActiveSynergy[] = [];
  let activeB: NvActiveSynergy[] = [];
  let aUnits: NvUnit[] = req.a.units;
  let bUnits: NvUnit[] = req.b.units;
  if (options.synergyCatalog) {
    const evalA = evaluateTeamSynergies(req.a.units, options.synergyCatalog);
    const evalB = evaluateTeamSynergies(req.b.units, options.synergyCatalog);
    activeA = evalA.active;
    activeB = evalB.active;
    aUnits = req.a.units.map((u) => applyBonusToUnit(u, evalA.teamBonus));
    bUnits = req.b.units.map((u) => applyBonusToUnit(u, evalB.teamBonus));
  }

  const units: LiveUnit[] = [
    ...aUnits.map((u) => {
      const base = scaleUnitForMatchPacing(u);
      return {
        team: "a" as const,
        base,
        hp: base.hp | 0,
        cd: 0,
        alive: true,
        shield: 0,
        statuses: []
      };
    }),
    ...bUnits.map((u) => {
      const base = scaleUnitForMatchPacing(u);
      return {
        team: "b" as const,
        base,
        hp: base.hp | 0,
        cd: 0,
        alive: true,
        shield: 0,
        statuses: []
      };
    })
  ];

  const events: NvBattleEvent[] = [];

  // v0 tick model:
  // - every tick, units accumulate cd += spd
  // - when cd >= actThreshold, unit acts once and cd -= actThreshold
  const ACT_THRESHOLD = MATCH_PACING.actThreshold;
  const MAX_EVENTS = 40_000;

  let t = 0;
  for (; t < req.maxTicks; t++) {
    tickStatuses(events, t, units);

    const aAlive = aliveUnits(units, "a");
    const bAlive = aliveUnits(units, "b");
    if (aAlive.length === 0 || bAlive.length === 0) break;

    for (const u of units) {
      if (!u.alive) continue;
      if (hasStatus(u, "stun")) continue;
      u.cd = (u.cd + (u.base.spd | 0)) | 0;
      if (u.cd < ACT_THRESHOLD) continue;

      u.cd -= ACT_THRESHOLD;

      applyStartOfTurnAbility(events, t, rng, u);

      const enemyTeam = u.team === "a" ? "b" : "a";
      const dst = pickTarget(rng, units, enemyTeam);
      if (!dst) continue;

      if (rng.nextInt(1, 100) > MATCH_PACING.baseHitPct) {
        events.push({
          t,
          kind: "hit",
          src: u.base.id,
          dst: dst.base.id,
          dmg: 0,
          crit: false,
          presentation: { srcIntent: "attack", dstIntent: "hit" }
        });
        continue;
      }

      const { dmg, crit } = damageRoll(rng, u, dst);
      dealDamage(events, t, u.base.id, dst, dmg, crit);
      applyOnHitAbility(events, t, rng, u, dst);
      if (events.length >= MAX_EVENTS) break;
    }

    // Periodic posture moves without requiring contact (cover / probe / bound).
    const MANEUVER_PERIOD = 26;
    if (t > 0 && t % MANEUVER_PERIOD === 0 && events.length < MAX_EVENTS) {
      for (const team of ["a", "b"] as const) {
        const pool = aliveUnits(units, team);
        if (pool.length === 0) continue;
        const u = pool[rng.nextInt(0, pool.length - 1)];
        if (!u.alive || hasStatus(u, "stun")) continue;
        const kinds = ["maneuver_take_cover", "maneuver_probe", "maneuver_bound"] as const;
        const k = kinds[rng.nextInt(0, kinds.length - 1)];
        events.push({
          t,
          kind: "ability",
          src: u.base.id,
          dst: u.base.id,
          abilityId: k,
          presentation: { srcIntent: "advance" }
        });
        if (k === "maneuver_take_cover") {
          const mag = Math.max(1, Math.floor(((u.base.hp | 0) * 3) / 100));
          const cap = Math.max(mag, Math.floor(((u.base.hp | 0) * 45) / 100));
          u.shield = Math.min((u.shield + mag) | 0, cap);
        } else if (k === "maneuver_probe") {
          u.cd = Math.min(u.cd + Math.floor((ACT_THRESHOLD * 16) / 100), ACT_THRESHOLD - 1);
        } else {
          u.cd = Math.min(u.cd + Math.floor((ACT_THRESHOLD * 10) / 100), ACT_THRESHOLD - 1);
        }
        if (events.length >= MAX_EVENTS) break;
      }
    }

    if (events.length >= MAX_EVENTS) break;
  }

  const aAliveEnd = aliveUnits(units, "a").length;
  const bAliveEnd = aliveUnits(units, "b").length;
  let outcome: NvBattleOutcome;
  if (aAliveEnd > 0 && bAliveEnd === 0) outcome = "a";
  else if (bAliveEnd > 0 && aAliveEnd === 0) outcome = "b";
  else if (aAliveEnd === 0 && bAliveEnd === 0) outcome = "draw";
  else {
    const sumHp = (team: "a" | "b") =>
      aliveUnits(units, team).reduce((s, u) => s + (u.hp | 0), 0);
    const hpA = sumHp("a");
    const hpB = sumHp("b");
    if (hpA > hpB) outcome = "a";
    else if (hpB > hpA) outcome = "b";
    else if (aAliveEnd !== bAliveEnd) outcome = aAliveEnd > bAliveEnd ? "a" : "b";
    else outcome = rng.nextInt(0, 1) === 0 ? "a" : "b";
  }

  events.push({ t, kind: "end" });

  const remainingA: Record<string, number> = {};
  const remainingB: Record<string, number> = {};
  for (const u of units) {
    if (u.team === "a") remainingA[u.base.id] = u.hp | 0;
    else remainingB[u.base.id] = u.hp | 0;
  }

  return NvBattleSimResult.parse({
    v: 1,
    seed: req.seed,
    outcome,
    ticks: t,
    remaining: { a: remainingA, b: remainingB },
    activeSynergies:
      options.synergyCatalog && (activeA.length > 0 || activeB.length > 0)
        ? { a: activeA, b: activeB }
        : undefined,
    events
  });
}

