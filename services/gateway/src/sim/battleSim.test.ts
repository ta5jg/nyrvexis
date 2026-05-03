import { describe, expect, it } from "vitest";
import type {
  NvBattleSimRequest,
  NvSynergyRule,
  NvUnit,
  NvUnitArchetypeDef
} from "@nyrvexis/protocol";
import { runBattleSim } from "./battleSim.js";

function unit(overrides: Partial<NvUnit> & { id: string }): NvUnit {
  return {
    id: overrides.id,
    archetype: overrides.archetype ?? "soldier",
    hp: overrides.hp ?? 30,
    atk: overrides.atk ?? 10,
    def: overrides.def ?? 0,
    spd: overrides.spd ?? 50,
    critPct: overrides.critPct ?? 0,
    critMulPct: overrides.critMulPct ?? 150,
    slot: overrides.slot ?? 0
  };
}

function req(seed: string, a: NvUnit[], b: NvUnit[]): NvBattleSimRequest {
  return {
    v: 1,
    seed: { seed },
    a: { name: "A", units: a },
    b: { name: "B", units: b },
    maxTicks: 8000
  };
}

describe("runBattleSim", () => {
  it("is deterministic for the same seed and teams", () => {
    const r = req("repeat-1", [unit({ id: "a1" })], [unit({ id: "b1" })]);
    const r1 = runBattleSim(r);
    const r2 = runBattleSim(r);
    expect(r1.outcome).toBe(r2.outcome);
    expect(r1.ticks).toBe(r2.ticks);
    expect(r1.events).toEqual(r2.events);
    expect(r1.remaining).toEqual(r2.remaining);
  });

  it("produces an outcome of a, b, or draw", () => {
    const result = runBattleSim(
      req("outcome", [unit({ id: "a1" })], [unit({ id: "b1" })])
    );
    expect(["a", "b", "draw"]).toContain(result.outcome);
  });

  it("ends with a single 'end' event", () => {
    const result = runBattleSim(
      req("end-event", [unit({ id: "a1" })], [unit({ id: "b1" })])
    );
    expect(result.events.at(-1)?.kind).toBe("end");
    const endCount = result.events.filter((e) => e.kind === "end").length;
    expect(endCount).toBe(1);
  });

  it("an overwhelmingly stronger team A wins", () => {
    const strong = unit({ id: "a1", hp: 999, atk: 200, def: 50 });
    const weak = unit({ id: "b1", hp: 1, atk: 1, def: 0 });
    const result = runBattleSim(req("dominate-a", [strong], [weak]));
    expect(result.outcome).toBe("a");
    expect(result.remaining.b.b1).toBe(0);
  });

  it("an overwhelmingly stronger team B wins", () => {
    const weak = unit({ id: "a1", hp: 1, atk: 1, def: 0 });
    const strong = unit({ id: "b1", hp: 999, atk: 200, def: 50 });
    const result = runBattleSim(req("dominate-b", [weak], [strong]));
    expect(result.outcome).toBe("b");
    expect(result.remaining.a.a1).toBe(0);
  });

  it("emits death events when a unit's HP reaches 0", () => {
    const killer = unit({ id: "a1", atk: 9999, hp: 999 });
    const victim = unit({ id: "b1", hp: 1, atk: 1, def: 0 });
    const result = runBattleSim(req("death-event", [killer], [victim]));
    const death = result.events.find((e) => e.kind === "death" && e.dst === "b1");
    expect(death).toBeDefined();
  });

  it("respects maxTicks (terminates before exceeding cap)", () => {
    const tank = unit({ id: "a1", hp: 99999, atk: 0, def: 99 });
    const tank2 = unit({ id: "b1", hp: 99999, atk: 0, def: 99 });
    const r = req("ticks-cap", [tank], [tank2]);
    r.maxTicks = 50;
    const result = runBattleSim(r);
    expect(result.ticks).toBeLessThanOrEqual(50);
  });

  it("reflects each unit in the remaining HP map", () => {
    const a = [unit({ id: "a1" }), unit({ id: "a2", slot: 1 })];
    const b = [unit({ id: "b1" }), unit({ id: "b2", slot: 1 })];
    const result = runBattleSim(req("remaining-keys", a, b));
    expect(Object.keys(result.remaining.a).sort()).toEqual(["a1", "a2"]);
    expect(Object.keys(result.remaining.b).sort()).toEqual(["b1", "b2"]);
  });

  it("rejects malformed input via Zod", () => {
    expect(() => runBattleSim({})).toThrow();
    expect(() => runBattleSim({ v: 1, seed: { seed: "" } })).toThrow();
  });

  it("brute archetype self-applies taunt at start of action", () => {
    const brute = unit({ id: "a1", archetype: "brute", spd: 220, atk: 1 });
    const target = unit({ id: "b1", hp: 999, atk: 1, def: 0 });
    const result = runBattleSim(req("taunt", [brute], [target]));
    const taunt = result.events.find(
      (e) => e.kind === "status_apply" && e.status?.kind === "taunt"
    );
    expect(taunt).toBeDefined();
  });

  it("rogue archetype applies bleed on a successful hit", () => {
    const rogue = unit({ id: "a1", archetype: "rogue", atk: 50, spd: 220 });
    const target = unit({ id: "b1", hp: 999, def: 0 });
    const result = runBattleSim(req("bleed", [rogue], [target]));
    const bleed = result.events.find(
      (e) => e.kind === "status_apply" && e.status?.kind === "bleed"
    );
    expect(bleed).toBeDefined();
  });

  it("soldier archetype shields itself", () => {
    const soldier = unit({ id: "a1", archetype: "soldier", spd: 220 });
    const target = unit({ id: "b1", hp: 999, def: 0 });
    const result = runBattleSim(req("shield", [soldier], [target]));
    const shield = result.events.find(
      (e) => e.kind === "status_apply" && e.status?.kind === "shield"
    );
    expect(shield).toBeDefined();
  });

  it("applies role + faction synergies when a catalog is provided", () => {
    const archetypeById = new Map<string, NvUnitArchetypeDef>([
      ["soldier", { id: "soldier", name: "Soldier", role: "tank", faction: "vanguard", base: { hp: 30, atk: 8, def: 2, spd: 10 } }],
      ["knight", { id: "knight", name: "Knight", role: "tank", faction: "vanguard", base: { hp: 36, atk: 8, def: 4, spd: 9 } }],
      ["paladin", { id: "paladin", name: "Paladin", role: "tank", faction: "vanguard", base: { hp: 34, atk: 8, def: 3, spd: 10 } }]
    ]);
    const synergies: NvSynergyRule[] = [
      { id: "frontline_3", name: "Frontline (3)", requireRole: "tank", minCount: 3, bonus: { defFlat: 2, hpFlat: 5 } },
      { id: "vanguard_3", name: "Vanguard (3)", requireFaction: "vanguard", minCount: 3, bonus: { defFlat: 1, hpFlat: 3 } }
    ];
    const aTeam = [
      unit({ id: "a1", archetype: "soldier" }),
      unit({ id: "a2", archetype: "knight" }),
      unit({ id: "a3", archetype: "paladin" })
    ];
    const bTeam = [unit({ id: "b1", archetype: "soldier" })];
    const result = runBattleSim(req("synergy", aTeam, bTeam), {
      synergyCatalog: { archetypeById, synergies }
    });
    expect(result.activeSynergies?.a.map((s) => s.id).sort()).toEqual(["frontline_3", "vanguard_3"]);
    expect(result.activeSynergies?.b ?? []).toEqual([]);
  });

  it("synergy application is deterministic across runs", () => {
    const archetypeById = new Map<string, NvUnitArchetypeDef>([
      ["soldier", { id: "soldier", name: "Soldier", role: "tank", faction: "vanguard", base: { hp: 30, atk: 8, def: 2, spd: 10 } }]
    ]);
    const synergies: NvSynergyRule[] = [
      { id: "frontline_2", name: "Frontline (2)", requireRole: "tank", minCount: 2, bonus: { hpFlat: 3 } }
    ];
    const r = req(
      "syn-det",
      [unit({ id: "a1", archetype: "soldier" }), unit({ id: "a2", archetype: "soldier" })],
      [unit({ id: "b1", archetype: "soldier" })]
    );
    const opts = { synergyCatalog: { archetypeById, synergies } };
    const r1 = runBattleSim(r, opts);
    const r2 = runBattleSim(r, opts);
    expect(r1.outcome).toBe(r2.outcome);
    expect(r1.ticks).toBe(r2.ticks);
    expect(r1.events).toEqual(r2.events);
    expect(r1.activeSynergies).toEqual(r2.activeSynergies);
  });
});
