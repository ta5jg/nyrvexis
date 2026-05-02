import { describe, expect, it } from "vitest";
import {
  clamp01,
  easeInOutCubic,
  easeOutBack,
  easeOutQuad,
  lerp,
  lerpColor,
  springReturn
} from "./NyrvexisAnimationSystem";

describe("clamp01", () => {
  it("clamps below 0 and above 1", () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(0)).toBe(0);
    expect(clamp01(0.5)).toBe(0.5);
    expect(clamp01(1)).toBe(1);
    expect(clamp01(2)).toBe(1);
  });
});

describe("lerp", () => {
  it("hits endpoints exactly", () => {
    expect(lerp(10, 20, 0)).toBe(10);
    expect(lerp(10, 20, 1)).toBe(20);
    expect(lerp(10, 20, 0.5)).toBe(15);
  });
});

describe("easing curves are monotone on [0,1]", () => {
  const fns = { easeInOutCubic, easeOutQuad };
  for (const [name, fn] of Object.entries(fns)) {
    it(`${name} is non-decreasing`, () => {
      let prev = -Infinity;
      for (let i = 0; i <= 100; i++) {
        const v = fn(i / 100);
        expect(v).toBeGreaterThanOrEqual(prev);
        prev = v;
      }
    });
    it(`${name}(0) ≈ 0 and ${name}(1) ≈ 1`, () => {
      expect(fn(0)).toBeCloseTo(0, 6);
      expect(fn(1)).toBeCloseTo(1, 6);
    });
  }
});

describe("easeOutBack overshoots above 1 mid-curve and lands at 1", () => {
  it("peaks above 1 between 0.5 and 1", () => {
    let max = 0;
    for (let i = 0; i <= 100; i++) max = Math.max(max, easeOutBack(i / 100));
    expect(max).toBeGreaterThan(1);
  });

  it("ends at exactly 1", () => {
    expect(easeOutBack(1)).toBeCloseTo(1, 6);
  });
});

describe("springReturn settles toward 1", () => {
  it("starts at 0 and approaches 1", () => {
    expect(springReturn(0, 0.6)).toBeCloseTo(0, 6);
    expect(springReturn(1, 0.6)).toBeGreaterThan(0.95);
  });

  it("snappier profile reaches threshold sooner", () => {
    // Higher snap should be ahead at any non-trivial t.
    expect(springReturn(0.3, 0.9)).toBeGreaterThan(springReturn(0.3, 0.3));
  });

  it("is monotone non-decreasing on [0,1]", () => {
    let prev = -Infinity;
    for (let i = 0; i <= 100; i++) {
      const v = springReturn(i / 100, 0.6);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });
});

describe("lerpColor blends RGB channels", () => {
  it("returns endpoints unchanged", () => {
    expect(lerpColor(0xff0000, 0x00ff00, 0)).toBe(0xff0000);
    expect(lerpColor(0xff0000, 0x00ff00, 1)).toBe(0x00ff00);
  });

  it("midpoint is the channel-wise average", () => {
    // 0xff/2 = 127.5 → rounded to 128 (0x80) on each channel; here r/g cross.
    const mid = lerpColor(0xff0000, 0x00ff00, 0.5);
    const r = (mid >> 16) & 0xff;
    const g = (mid >> 8) & 0xff;
    const b = mid & 0xff;
    expect(r).toBe(128);
    expect(g).toBe(128);
    expect(b).toBe(0);
  });

  it("never produces channels outside [0,255]", () => {
    for (let i = 0; i <= 100; i++) {
      const c = lerpColor(0x000000, 0xffffff, i / 100);
      const r = (c >> 16) & 0xff;
      const g = (c >> 8) & 0xff;
      const b = c & 0xff;
      for (const ch of [r, g, b]) {
        expect(ch).toBeGreaterThanOrEqual(0);
        expect(ch).toBeLessThanOrEqual(255);
      }
    }
  });
});
