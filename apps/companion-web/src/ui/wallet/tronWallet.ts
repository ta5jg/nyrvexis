/* =============================================================================
 * TronLink (and Trust Wallet on mobile) integration. The browser extension
 * injects a `window.tronWeb` object with `defaultAddress` and `trx.sign`.
 *
 * v0.1 surface:
 *  - detect()       : true if injected provider exists
 *  - connect()      : returns base58 address, throws if locked / not installed
 *  - signMessage()  : deterministic challenge → signature for backend login
 *  - currentAddress : reactive snapshot stored in localStorage
 * ============================================================================= */

const STORAGE_KEY = "nv.wallet.address";

type TronProvider = {
  defaultAddress?: { base58?: string };
  ready?: boolean;
  trx?: {
    sign: (message: string) => Promise<string>;
  };
  request?: (args: { method: string }) => Promise<unknown>;
};

declare global {
  interface Window {
    tronWeb?: TronProvider;
    tronLink?: { request: (args: { method: string }) => Promise<unknown> };
  }
}

export function detect(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.tronWeb || window.tronLink);
}

export function readStoredAddress(): string | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v && v.length > 0 ? v : null;
  } catch {
    return null;
  }
}

function writeStoredAddress(addr: string | null): void {
  if (typeof localStorage === "undefined") return;
  try {
    if (addr) localStorage.setItem(STORAGE_KEY, addr);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export async function connect(): Promise<string> {
  if (typeof window === "undefined") throw new Error("Browser-only API");
  if (window.tronLink?.request) {
    try {
      await window.tronLink.request({ method: "tron_requestAccounts" });
    } catch {
      // continue — some flows still expose tronWeb after rejection
    }
  }
  // Wait briefly for tronWeb to populate after unlock.
  for (let i = 0; i < 30; i++) {
    const tw = window.tronWeb;
    if (tw?.ready && tw.defaultAddress?.base58) {
      const addr = tw.defaultAddress.base58;
      writeStoredAddress(addr);
      return addr;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("TronLink kilitli ya da yüklü değil. Tarayıcı eklentisini kur, cüzdanını aç ve tekrar dene.");
}

export function disconnect(): void {
  writeStoredAddress(null);
}

export async function signMessage(message: string): Promise<string> {
  const tw = window.tronWeb;
  if (!tw?.trx?.sign) throw new Error("Cüzdan sağlayıcısı bulunamadı.");
  return tw.trx.sign(message);
}
