import { describe, expect, it } from "vitest";
import { XorShift32, seedToU32 } from "./rng.js";

describe("XorShift32", () => {
  it("produces an identical stream for the same seed", () => {
    const a = new XorShift32(123456789);
    const b = new XorShift32(123456789);
    const seqA = Array.from({ length: 64 }, () => a.nextU32());
    const seqB = Array.from({ length: 64 }, () => b.nextU32());
    expect(seqA).toEqual(seqB);
  });

  it("produces different streams for different seeds", () => {
    const a = new XorShift32(1);
    const b = new XorShift32(2);
    const seqA = Array.from({ length: 32 }, () => a.nextU32());
    const seqB = Array.from({ length: 32 }, () => b.nextU32());
    expect(seqA).not.toEqual(seqB);
  });

  it("avoids zero-lock when seeded with 0", () => {
    const r = new XorShift32(0);
    expect(r.nextU32()).not.toBe(0);
  });

  it("nextInt stays within [min, max] inclusive", () => {
    const r = new XorShift32(seedToU32("range-test"));
    for (let i = 0; i < 1000; i++) {
      const v = r.nextInt(3, 7);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(7);
    }
  });

  it("next01 is in [0, 1)", () => {
    const r = new XorShift32(seedToU32("01"));
    for (let i = 0; i < 1000; i++) {
      const v = r.next01();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("nextInt throws when max < min", () => {
    const r = new XorShift32(1);
    expect(() => r.nextInt(5, 4)).toThrow();
  });
});

describe("seedToU32", () => {
  it("is deterministic for the same input", () => {
    expect(seedToU32("daily:2026-05-02")).toBe(seedToU32("daily:2026-05-02"));
  });

  it("differs across distinct inputs", () => {
    expect(seedToU32("seed-a")).not.toBe(seedToU32("seed-b"));
  });

  it("returns an unsigned 32-bit integer", () => {
    const v = seedToU32("anything");
    expect(Number.isInteger(v)).toBe(true);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(0xffff_ffff);
  });
});
