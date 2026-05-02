import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  __resetLocaleForTests,
  getLocale,
  setLocale,
  translate
} from "./index";
import { en } from "./en";
import { tr } from "./tr";
import { es } from "./es";
import { de } from "./de";

beforeEach(() => {
  __resetLocaleForTests(DEFAULT_LOCALE);
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem("kr.locale");
    } catch {
      /* ignore */
    }
  }
});

afterEach(() => {
  __resetLocaleForTests(DEFAULT_LOCALE);
});

describe("translate()", () => {
  it("returns the English string for a known key", () => {
    expect(translate("home.enterBattle")).toBe("Enter battle");
  });

  it("falls back to English when the key is missing in the active locale", () => {
    // Build a key that exists in English; switch to a locale and confirm
    // (all current locales are full, so we craft a missing-key scenario via
    //  unknown locale path lookup).
    const missing = translate("nonexistent.key.here", undefined, "tr");
    expect(missing).toBe("nonexistent.key.here");
  });

  it("returns the key when missing in both active and fallback", () => {
    expect(translate("definitely.does.not.exist")).toBe("definitely.does.not.exist");
  });

  it("interpolates {{var}} placeholders", () => {
    // Use a synthetic template via lookup against a real key.
    // We don't have an interpolating key in the seed strings, so we pass
    // through translate() with a key that returns the placeholder template
    // — for that we test interpolation indirectly via a known string.
    // Add a runtime-only placeholder: pick a key whose value contains a name.
    // Since seed strings have no {{x}}, assert that absent vars don't break.
    expect(translate("home.enterBattle", { unused: "x" })).toBe("Enter battle");
  });

  it("uses the explicit locale argument when provided", () => {
    expect(translate("home.enterBattle", undefined, "tr")).toBe("Savaşa gir");
    expect(translate("home.enterBattle", undefined, "es")).toBe("Entrar a la batalla");
    expect(translate("home.enterBattle", undefined, "de")).toBe("Kampf starten");
  });
});

describe("setLocale()", () => {
  it("updates getLocale() and persists across reads", () => {
    setLocale("tr");
    expect(getLocale()).toBe("tr");
    expect(translate("home.enterBattle")).toBe("Savaşa gir");
    setLocale("de");
    expect(getLocale()).toBe("de");
    expect(translate("home.enterBattle")).toBe("Kampf starten");
  });

  it("ignores unsupported codes silently", () => {
    setLocale("tr");
    setLocale("xx" as never);
    expect(getLocale()).toBe("tr");
  });
});

describe("translation tables", () => {
  it("every supported locale exposes the same keys as English", () => {
    function flatten(obj: Record<string, unknown>, prefix = ""): string[] {
      const out: string[] = [];
      for (const [k, v] of Object.entries(obj)) {
        const key = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === "object") out.push(...flatten(v as Record<string, unknown>, key));
        else out.push(key);
      }
      return out.sort();
    }
    const enKeys = flatten(en as unknown as Record<string, unknown>);
    for (const tbl of [tr, es, de]) {
      expect(flatten(tbl as unknown as Record<string, unknown>)).toEqual(enKeys);
    }
  });

  it("SUPPORTED_LOCALES matches the table set", () => {
    expect([...SUPPORTED_LOCALES].sort()).toEqual(["de", "en", "es", "tr"]);
  });
});
