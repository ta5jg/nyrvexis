import type { NvBattleSimRequest, NvTeam, NvUnit, NvUnitArchetypeDef } from "@nyrvexis/protocol";

export type EnemyPreset = "demo" | "mirror";

export type SlotPick = { slot: number; archetypeId: string | null };

function defaultCrit(archetypeId: string): { critPct: number; critMulPct: number } {
  if (archetypeId === "archer") return { critPct: 5, critMulPct: 175 };
  if (archetypeId === "rogue") return { critPct: 15, critMulPct: 160 };
  return { critPct: 0, critMulPct: 150 };
}

// Tiny deterministic RNG so the random demo team is reproducible from the
// battle seed (FNV-1a hash + mulberry32). Same seed → same demo team.
function hashSeed(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function buildRandomEnemyTeam(
  seed: string,
  count: number,
  defs: NvUnitArchetypeDef[]
): NvTeam {
  const slots = [0, 1, 6, 7] as const;
  const rng = mulberry32(hashSeed(seed + ":demo-enemy"));
  const units: NvUnit[] = [];
  for (let i = 0; i < count && i < slots.length; i++) {
    const idx = Math.floor(rng() * defs.length);
    const d = defs[idx];
    if (!d) continue;
    const c = defaultCrit(d.id);
    units.push({
      id: `b${i + 1}`,
      archetype: d.id,
      hp: d.base.hp,
      atk: d.base.atk,
      def: d.base.def,
      spd: d.base.spd,
      slot: slots[i],
      critPct: c.critPct,
      critMulPct: c.critMulPct
    });
  }
  return { name: "RIFT", units };
}

export function picksToTeam(name: string, picks: SlotPick[], defs: Map<string, NvUnitArchetypeDef>): NvTeam {
  const units: NvUnit[] = [];
  let n = 0;
  for (const p of picks) {
    if (!p.archetypeId) continue;
    const d = defs.get(p.archetypeId);
    if (!d) continue;
    n += 1;
    const id = `${name[0].toLowerCase()}${n}`;
    const c = defaultCrit(d.id);
    units.push({
      id,
      archetype: d.id,
      hp: d.base.hp,
      atk: d.base.atk,
      def: d.base.def,
      spd: d.base.spd,
      slot: p.slot,
      critPct: c.critPct,
      critMulPct: c.critMulPct
    });
  }
  if (units.length === 0) {
    const d = defs.get("soldier");
    if (!d) return { name, units: [] };
    const c = defaultCrit("soldier");
    return {
      name,
      units: [
        {
          id: `${name[0].toLowerCase()}1`,
          archetype: "soldier",
          hp: d.base.hp,
          atk: d.base.atk,
          def: d.base.def,
          spd: d.base.spd,
          slot: 0,
          critPct: c.critPct,
          critMulPct: c.critMulPct
        }
      ]
    };
  }
  return { name, units };
}

/** Four squad slots mapped to formation slots 0,1,6,7 (2 front / 2 back). */
export function buildBattleRequest(opts: {
  seed: string;
  maxTicks: number;
  catalogDefs: NvUnitArchetypeDef[];
  playerSlots: Array<string | null>;
  enemyPreset: EnemyPreset;
}): NvBattleSimRequest {
  const map = new Map(opts.catalogDefs.map((u) => [u.id, u]));
  const slots = [0, 1, 6, 7] as const;
  const picks: SlotPick[] = slots.map((slot, i) => ({ slot, archetypeId: opts.playerSlots[i] ?? null }));
  const a = picksToTeam("RAIL", picks, map);

  let b: NvTeam;
  if (opts.enemyPreset === "demo") {
    const aCount = Math.max(1, a.units.length);
    b = buildRandomEnemyTeam(opts.seed, aCount, opts.catalogDefs);
  } else {
    const bpicks: SlotPick[] = slots.map((slot, i) => ({ slot, archetypeId: opts.playerSlots[i] ?? null }));
    b = picksToTeam("RIFT", bpicks, map);
  }

  return {
    v: 1,
    seed: { seed: opts.seed },
    a,
    b,
    maxTicks: opts.maxTicks
  };
}
