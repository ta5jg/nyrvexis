import { Capacitor } from "@capacitor/core";

const LS_TOKEN = "kr.token";
const LS_REFRESH = "kr.refreshToken";
const LS_DEVICE = "kr.deviceId";

function randomId(len: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function isNativeSecure(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/** Native-only mirrors of secrets after {@link initDeviceStorage}; unset until hydrate completes. */
let nativeCacheToken: string | null = null;
let nativeCacheRefresh: string | null = null;
let nativeCacheDeviceId: string | null = null;

/** Stable fallback if anything reads device id before init finishes on native (unlikely). */
let nativePreInitDeviceId: string | null = null;

/**
 * Must complete before React mounts on Capacitor (see `main.tsx`).
 * Loads migrates legacy web localStorage keys into Keychain/Keystore once.
 */
export async function initDeviceStorage(): Promise<void> {
  if (!isNativeSecure()) return;

  const secure = await import("capacitor-secure-storage");

  async function migrateKey(key: string): Promise<void> {
    const existing = await secure.getItemFromSecureStorage(key);
    if (existing !== null && existing !== "") return;
    try {
      const ls = localStorage.getItem(key);
      if (!ls) return;
      await secure.setItemInSecureStorage(key, ls);
      localStorage.removeItem(key);
    } catch {
      /* no localStorage */
    }
  }

  await migrateKey(LS_TOKEN);
  await migrateKey(LS_REFRESH);
  await migrateKey(LS_DEVICE);

  let tok = await secure.getItemFromSecureStorage(LS_TOKEN);
  let ref = await secure.getItemFromSecureStorage(LS_REFRESH);
  let dev = await secure.getItemFromSecureStorage(LS_DEVICE);

  if (!dev || dev.length < 8) {
    dev = nativePreInitDeviceId ?? `dev_${randomId(24)}`;
    await secure.setItemInSecureStorage(LS_DEVICE, dev);
  }

  nativeCacheToken = tok ?? null;
  nativeCacheRefresh = ref ?? null;
  nativeCacheDeviceId = dev;
  nativePreInitDeviceId = null;
}

export function getOrCreateDeviceId(): string {
  if (isNativeSecure()) {
    if (nativeCacheDeviceId && nativeCacheDeviceId.length >= 8) return nativeCacheDeviceId;
    if (!nativePreInitDeviceId) nativePreInitDeviceId = `dev_${randomId(24)}`;
    return nativePreInitDeviceId;
  }

  const existing = localStorage.getItem(LS_DEVICE);
  if (existing && existing.length >= 8) return existing;
  const id = `dev_${randomId(24)}`;
  localStorage.setItem(LS_DEVICE, id);
  return id;
}

export function getToken(): string | null {
  if (isNativeSecure()) return nativeCacheToken;
  return localStorage.getItem(LS_TOKEN);
}

export function setToken(token: string | null): void {
  if (isNativeSecure()) {
    nativeCacheToken = token;
    void (async () => {
      const sec = await import("capacitor-secure-storage");
      if (!token) await sec.removeItemFromSecureStorage(LS_TOKEN);
      else await sec.setItemInSecureStorage(LS_TOKEN, token);
    })();
    try {
      localStorage.removeItem(LS_TOKEN);
    } catch {
      /* private mode */
    }
    return;
  }

  if (!token) localStorage.removeItem(LS_TOKEN);
  else localStorage.setItem(LS_TOKEN, token);
}

export function getRefreshToken(): string | null {
  if (isNativeSecure()) return nativeCacheRefresh;
  return localStorage.getItem(LS_REFRESH);
}

export function setRefreshToken(token: string | null): void {
  if (isNativeSecure()) {
    nativeCacheRefresh = token;
    void (async () => {
      const sec = await import("capacitor-secure-storage");
      if (!token) await sec.removeItemFromSecureStorage(LS_REFRESH);
      else await sec.setItemInSecureStorage(LS_REFRESH, token);
    })();
    try {
      localStorage.removeItem(LS_REFRESH);
    } catch {
      /* private mode */
    }
    return;
  }

  if (!token) localStorage.removeItem(LS_REFRESH);
  else localStorage.setItem(LS_REFRESH, token);
}
