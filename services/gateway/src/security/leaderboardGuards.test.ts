import { describe, expect, it } from "vitest";
import type { NvBattleSimRequest } from "@nyrvexis/protocol";
import {
  assertOfficialDailySeed,
  expectedDailyLeaderboardSeed
} from "./leaderboardGuards.js";

function makeReq(seed: string): NvBattleSimRequest {
  return {
    v: 1,
    seed: { seed },
    a: { name: "A", units: [{ id: "a1", archetype: "soldier", hp: 10, atk: 1, def: 0, spd: 50, critPct: 0, critMulPct: 150, slot: 0 }] },
    b: { name: "B", units: [{ id: "b1", archetype: "soldier", hp: 10, atk: 1, def: 0, spd: 50, critPct: 0, critMulPct: 150, slot: 0 }] },
    maxTicks: 8000
  };
}

describe("expectedDailyLeaderboardSeed", () => {
  it("produces the documented daily:<dateUtc> shape", () => {
    expect(expectedDailyLeaderboardSeed("2026-05-02")).toBe("daily:2026-05-02");
  });
});

describe("assertOfficialDailySeed", () => {
  it("accepts the matching seed without throwing", () => {
    const req = makeReq("daily:2026-05-02");
    expect(() => assertOfficialDailySeed(req, "2026-05-02")).not.toThrow();
  });

  it("rejects a mismatched seed with LEADERBOARD_SEED_MISMATCH", () => {
    const req = makeReq("custom-seed");
    expect(() => assertOfficialDailySeed(req, "2026-05-02")).toThrow(
      "LEADERBOARD_SEED_MISMATCH"
    );
  });

  it("rejects yesterday's seed today", () => {
    const req = makeReq("daily:2026-05-01");
    expect(() => assertOfficialDailySeed(req, "2026-05-02")).toThrow(
      "LEADERBOARD_SEED_MISMATCH"
    );
  });
});
