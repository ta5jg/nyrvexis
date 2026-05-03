import type { NvBattleSimRequest, NvTeam } from "@nyrvexis/protocol";

function unit(
  id: string,
  archetype: string,
  hp: number,
  atk: number,
  def: number,
  spd: number,
  slot: number,
  critPct = 0,
  critMulPct = 150
) {
  return { id, archetype, hp, atk, def, spd, slot, critPct, critMulPct };
}

export function makeDemoTeams(): { a: NvTeam; b: NvTeam } {
  return {
    a: {
      name: "RAIL",
      units: [
        unit("a1", "soldier", 30, 8, 2, 10, 0, 10, 150),
        unit("a2", "knight", 36, 8, 4, 9, 1, 0, 150),
        unit("a3", "archer", 18, 10, 1, 12, 6, 5, 175),
        unit("a4", "mage", 16, 11, 0, 11, 7, 0, 150)
      ]
    },
    b: {
      name: "RIFT",
      units: [
        unit("b1", "brute", 42, 7, 3, 8, 0, 0, 150),
        unit("b2", "gladiator", 33, 9, 2, 11, 1, 5, 160),
        unit("b3", "rogue", 20, 9, 1, 14, 6, 15, 160),
        unit("b4", "stormseer", 18, 9, 1, 12, 7, 0, 150)
      ]
    }
  };
}

export function makeRequest(seed: string, maxTicks = 12000): NvBattleSimRequest {
  const { a, b } = makeDemoTeams();
  return {
    v: 1,
    seed: { seed },
    a,
    b,
    maxTicks
  };
}

