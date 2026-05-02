/* =============================================================================
 * Lightweight i18n for Nyrvexis companion-web.
 *
 * - 4 launch locales: en, tr, es, de
 * - Auto-detect from browser, persist override in localStorage
 * - `t("a.b.c", { name: "Ada" })` → string with {{name}} interpolation
 * - Missing keys fall back to English; missing in English returns the key
 * - No external deps; bundle cost ~2 KB gzipped including all 4 locales
 * ============================================================================= */

import { useSyncExternalStore } from "react";
import { en, type Translations } from "./en";
import { tr } from "./tr";
import { es } from "./es";
import { de } from "./de";

export const SUPPORTED_LOCALES = ["en", "tr", "es", "de"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

const TABLES: Record<Locale, Translations> = { en, tr, es, de };
const STORAGE_KEY = "kr.locale";

// ---------------------------------------------------------------------------
// Locale detection + persistence
// ---------------------------------------------------------------------------

function detectFromBrowser(): Locale {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  const candidates = [navigator.language, ...(navigator.languages ?? [])];
  for (const raw of candidates) {
    if (!raw) continue;
    const base = raw.toLowerCase().split("-")[0];
    if ((SUPPORTED_LOCALES as readonly string[]).includes(base)) return base as Locale;
  }
  return DEFAULT_LOCALE;
}

function readStoredLocale(): Locale | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && (SUPPORTED_LOCALES as readonly string[]).includes(raw)) return raw as Locale;
  } catch {
    /* localStorage may be blocked (private mode, SSR) — ignore. */
  }
  return null;
}

function writeStoredLocale(locale: Locale): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// Reactive store (subscribe / snapshot pattern for useSyncExternalStore)
// ---------------------------------------------------------------------------

let currentLocale: Locale = readStoredLocale() ?? detectFromBrowser();
const listeners = new Set<() => void>();

function emit(): void {
  for (const fn of listeners) fn();
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getLocale(): Locale {
  return currentLocale;
}

export function setLocale(locale: Locale): void {
  if (!(SUPPORTED_LOCALES as readonly string[]).includes(locale)) return;
  if (locale === currentLocale) return;
  currentLocale = locale;
  writeStoredLocale(locale);
  if (typeof document !== "undefined") document.documentElement.lang = locale;
  emit();
}

// Sync the <html lang> attr on first load too.
if (typeof document !== "undefined") {
  document.documentElement.lang = currentLocale;
}

// ---------------------------------------------------------------------------
// translate()
// ---------------------------------------------------------------------------

function lookup(table: Record<string, unknown>, key: string): string | undefined {
  const parts = key.split(".");
  let cur: unknown = table;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return typeof cur === "string" ? cur : undefined;
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, name: string) => {
    const v = vars[name];
    return v === undefined || v === null ? `{{${name}}}` : String(v);
  });
}

/**
 * Translate a key for the given (or current) locale.
 * Falls back to English, then to the key itself.
 */
export function translate(
  key: string,
  vars?: Record<string, string | number>,
  locale: Locale = currentLocale
): string {
  const primary = lookup(TABLES[locale], key);
  if (primary !== undefined) return interpolate(primary, vars);
  const fallback = lookup(TABLES[DEFAULT_LOCALE], key);
  if (fallback !== undefined) return interpolate(fallback, vars);
  return key;
}

// ---------------------------------------------------------------------------
// React hook
// ---------------------------------------------------------------------------

export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, getLocale, getLocale);
}

export function useTranslation(): {
  t: (key: string, vars?: Record<string, string | number>) => string;
  locale: Locale;
  setLocale: (l: Locale) => void;
} {
  const locale = useLocale();
  return {
    t: (key, vars) => translate(key, vars, locale),
    locale,
    setLocale
  };
}

// ---------------------------------------------------------------------------
// Test-only — reset internal state between tests.
// Not exported from package surface; consumers shouldn't call this.
// ---------------------------------------------------------------------------

export function __resetLocaleForTests(locale: Locale = DEFAULT_LOCALE): void {
  currentLocale = locale;
  listeners.clear();
}
