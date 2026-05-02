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
        unit("a2", "archer", 18, 10, 1, 12, 6, 5, 175)
      ]
    },
    b: {
      name: "RIFT",
      units: [
        unit("b1", "brute", 40, 7, 3, 8, 0, 0, 150),
        unit("b2", "rogue", 20, 9, 1, 14, 6, 15, 160)
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

