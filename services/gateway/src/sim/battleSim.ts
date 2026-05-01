import {
  KrBattleOutcome,
  KrBattleSimRequest,
  KrBattleSimResult,
  type KrBattleEvent,
  type KrStatusKind,
  type KrUnit
} from "@kindrail/protocol";
import { seedToU32, XorShift32 } from "./rng.js";

/**
 * Match pacing tuned for ~5–7 minute replay sessions at cinematic Auto-play speed (web UX target).
 * Applied inside `runBattleSim` only — catalog JSON stays “readable”; determinism preserved per seed.
 */
const MATCH_PACING = {
  hpMul: 6,
  atkMul: 0.88,
  /** Higher threshold ⇒ fewer actions per wall-clock tick ⇒ longer fights. */
  actThreshold: 340
} as const;

function scaleUnitForMatchPacing(u: KrUnit): KrUnit {
  return {
    ...u,
    hp: Math.max(1, Math.floor((u.hp | 0) * MATCH_PACING.hpMul)),
    atk: Math.max(1, Math.floor((u.atk | 0) * MATCH_PACING.atkMul))
  };
}

type StatusState = {
  kind: KrStatusKind;
  dur: number;
  mag: number;
  srcId?: string;
};

type LiveUnit = {
  team: "a" | "b";
  base: KrUnit;
  hp: number;
  cd: number; // cooldown accumulator (ticks)
  alive: boolean;
  shield: number;
  statuses: StatusState[];
};

function aliveUnits(units: LiveUnit[], team: "a" | "b"): LiveUnit[] {
  return units.filter((u) => u.team === team && u.alive);
}

function hasStatus(u: LiveUnit, kind: KrStatusKind): boolean {
  return u.statuses.some((s) => s.kind === kind && s.dur > 0);
}

function applyStatus(
  events: KrBattleEvent[],
  t: number,
  src: LiveUnit,
  dst: LiveUnit,
  kind: KrStatusKind,
  dur: number,
  mag: number
) {
  // replace existing same-kind status (simplest v1 rule)
  dst.statuses = dst.statuses.filter((s) => s.kind !== kind);
  dst.statuses.push({ kind, dur, mag, srcId: src.base.id });
  if (kind === "shield") dst.shield = Math.max(0, (dst.shield + mag) | 0);

  events.push({
    t,
    kind: "status_apply",
    src: src.base.id,
    dst: dst.base.id,
    status: { kind, dur, mag }
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
  events: KrBattleEvent[],
  t: number,
  srcId: string,
  dst: LiveUnit,
  rawDmg: number,
  crit: boolean
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

  events.push({ t, kind: "hit", src: srcId, dst: dst.base.id, dmg: Math.max(0, dmg), crit });

  if (dst.hp === 0 && dst.alive) {
    dst.alive = false;
    events.push({ t, kind: "death", src: srcId, dst: dst.base.id });
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

function applyStartOfTurnAbility(events: KrBattleEvent[], t: number, rng: XorShift32, u: LiveUnit) {
  if (!u.alive) return;
  if (hasStatus(u, "stun")) return;

  const ability = unitAbilityId(u);
  if (!ability) return;

  if (ability === "shield_self") {
    // once every act: add small shield
    events.push({ t, kind: "ability", src: u.base.id, abilityId: ability });
    // 35% of max hp as shield (int)
    const mag = Math.max(1, Math.floor(((u.base.hp | 0) * 35) / 100));
    applyStatus(events, t, u, u, "shield", 999, mag);
  } else if (ability === "taunt_self") {
    events.push({ t, kind: "ability", src: u.base.id, abilityId: ability });
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
  events: KrBattleEvent[],
  t: number,
  rng: XorShift32,
  src: LiveUnit,
  dst: LiveUnit
) {
  const ability = unitAbilityId(src);
  if (!ability) return;

  if (ability === "bleed_on_hit") {
    events.push({ t, kind: "ability", src: src.base.id, dst: dst.base.id, abilityId: ability });
    applyStatus(events, t, src, dst, "bleed", 5, 2); // 2 dmg per tick
  } else if (ability === "stun_on_hit") {
    const roll = rng.nextInt(1, 100);
    if (roll <= 15) {
      events.push({ t, kind: "ability", src: src.base.id, dst: dst.base.id, abilityId: ability });
      applyStatus(events, t, src, dst, "stun", 2, 1);
    }
  }
}

function tickStatuses(events: KrBattleEvent[], t: number, units: LiveUnit[]) {
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

export function runBattleSim(input: unknown): KrBattleSimResult {
  const req = KrBattleSimRequest.parse(input);
  const rng = new XorShift32(seedToU32(req.seed.seed));

  const units: LiveUnit[] = [
    ...req.a.units.map((u) => {
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
    ...req.b.units.map((u) => {
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

  const events: KrBattleEvent[] = [];

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

      const { dmg, crit } = damageRoll(rng, u, dst);
      dealDamage(events, t, u.base.id, dst, dmg, crit);
      applyOnHitAbility(events, t, rng, u, dst);
      if (events.length >= MAX_EVENTS) break;
    }

    if (events.length >= MAX_EVENTS) break;
  }

  const aAliveEnd = aliveUnits(units, "a").length;
  const bAliveEnd = aliveUnits(units, "b").length;
  const outcome: KrBattleOutcome =
    aAliveEnd > 0 && bAliveEnd === 0 ? "a" : bAliveEnd > 0 && aAliveEnd === 0 ? "b" : "draw";

  events.push({ t, kind: "end" });

  const remainingA: Record<string, number> = {};
  const remainingB: Record<string, number> = {};
  for (const u of units) {
    if (u.team === "a") remainingA[u.base.id] = u.hp | 0;
    else remainingB[u.base.id] = u.hp | 0;
  }

  return KrBattleSimResult.parse({
    v: 1,
    seed: req.seed,
    outcome,
    ticks: t,
    remaining: { a: remainingA, b: remainingB },
    events
  });
}

