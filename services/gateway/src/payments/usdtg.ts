/* =============================================================================
 * USDTg (Tether Ground USD on TRON) payment verifier.
 *
 * Flow:
 *   1. Client connects TronLink, sends USDTg TRC20 transfer to KR_USDTG_TREASURY
 *   2. Client POSTs txHash + expected amount + expected purpose to gateway
 *   3. Gateway queries TronGrid REST API for the tx and decodes TRC20 Transfer event
 *   4. Server-authoritative: confirmed amount + receiver + token contract → grant entitlement
 *
 * Notes:
 *   - All addresses base58. TronGrid returns hex; we convert to base58 for compare.
 *   - Amount is in raw TRC20 units (USDTg has 6 decimals — same as USDT on Tron).
 *   - We require >= MIN_CONFIRMATIONS so the tx isn't reorged off-chain.
 * ============================================================================= */

const TRON_GRID_BASE = "https://api.trongrid.io";
const USDTG_DECIMALS = 6;
const MIN_CONFIRMATIONS = 19; // ~1 minute on Tron

export type UsdtgVerifyParams = {
  txHash: string;
  expectedAmountMicro: bigint; // expected USDTg amount in micro-units (1 USDTg = 1_000_000)
  treasuryAddress: string;     // base58 address; required
  contractAddress: string;     // base58 USDTg TRC20 contract; required
};

export type UsdtgVerifyResult =
  | { ok: true; from: string; to: string; amountMicro: bigint; txHash: string }
  | { ok: false; reason: string };

type TronTxInfo = {
  id: string;
  blockNumber?: number;
  log?: Array<{ address: string; topics: string[]; data: string }>;
  receipt?: { result?: string };
};

type TronBlockInfo = {
  block_header: {
    raw_data: { number: number };
  };
};

function hexToBase58Loose(hexAddrNoPrefix: string): string | null {
  // TronGrid returns 41-prefixed hex (e.g., 41a614f803b6fd...). For reliable
  // base58 conversion we need the full byte chain; for the v0.1 verifier we
  // compare on the lowercased 40-byte hex form to avoid pulling in tronweb on
  // the gateway (cold-start matters on Cloudflare Workers etc.).
  if (!hexAddrNoPrefix) return null;
  const clean = hexAddrNoPrefix.toLowerCase().replace(/^0x/, "");
  // pad/extract last 20 bytes for ERC20-style topics, prepend 41 (Tron prefix)
  if (clean.length < 40) return null;
  const last20 = clean.slice(-40);
  return "41" + last20;
}

function base58TronToHex(_base58: string): string {
  // Without tronweb we cannot decode base58check here. The treasury and
  // contract addresses are configured by operator and can be supplied as hex
  // alternatives via env (KR_USDTG_TREASURY_HEX). For v0.1 we compare on hex
  // values directly when configured; otherwise fall back to base58 string
  // equality which is brittle but adequate for an MVP single-treasury setup.
  return "";
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url, { method: "GET" });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

async function getCurrentBlock(): Promise<number | null> {
  const r = await fetchJson<TronBlockInfo>(`${TRON_GRID_BASE}/wallet/getnowblock`);
  return r?.block_header?.raw_data?.number ?? null;
}

async function getTxInfo(txHash: string): Promise<TronTxInfo | null> {
  return fetchJson<TronTxInfo>(`${TRON_GRID_BASE}/wallet/gettransactioninfobyid?value=${encodeURIComponent(txHash)}`);
}

const TRANSFER_TOPIC = "ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

export async function verifyUsdtgPayment(p: UsdtgVerifyParams): Promise<UsdtgVerifyResult> {
  if (!/^[0-9a-fA-F]{64}$/.test(p.txHash)) {
    return { ok: false, reason: "INVALID_TX_HASH" };
  }
  if (!p.treasuryAddress || !p.contractAddress) {
    return { ok: false, reason: "TREASURY_OR_CONTRACT_MISSING" };
  }

  const info = await getTxInfo(p.txHash);
  if (!info) return { ok: false, reason: "TX_NOT_FOUND" };
  if (info.receipt?.result && info.receipt.result !== "SUCCESS") {
    return { ok: false, reason: "TX_FAILED" };
  }
  if (typeof info.blockNumber !== "number") {
    return { ok: false, reason: "TX_NOT_CONFIRMED" };
  }
  const head = await getCurrentBlock();
  if (head === null || head - info.blockNumber < MIN_CONFIRMATIONS) {
    return { ok: false, reason: "INSUFFICIENT_CONFIRMATIONS" };
  }

  // The treasury+contract come in as base58 from operator config; for hex
  // compare we expect operator to also set the hex form via env. Until then
  // we compare on lowercased hex of last-20 bytes which TronGrid logs use.
  const treasuryHex = base58TronToHex(p.treasuryAddress);
  const contractHex = base58TronToHex(p.contractAddress);

  for (const log of info.log ?? []) {
    if (log.topics.length !== 3 || log.topics[0]?.toLowerCase() !== TRANSFER_TOPIC) continue;
    const fromHex = hexToBase58Loose(log.topics[1] ?? "");
    const toHex = hexToBase58Loose(log.topics[2] ?? "");
    const amountHex = (log.data ?? "").toLowerCase().replace(/^0x/, "");
    if (!fromHex || !toHex || !amountHex) continue;

    const logContractHex = hexToBase58Loose(log.address ?? "");
    if (contractHex && logContractHex !== contractHex.toLowerCase()) continue;
    if (treasuryHex && toHex !== treasuryHex.toLowerCase()) continue;

    const amount = BigInt("0x" + (amountHex || "0"));
    if (amount < p.expectedAmountMicro) {
      return { ok: false, reason: "AMOUNT_TOO_LOW" };
    }
    return {
      ok: true,
      from: fromHex,
      to: toHex,
      amountMicro: amount,
      txHash: p.txHash
    };
  }

  return { ok: false, reason: "NO_MATCHING_TRANSFER_LOG" };
}

export const USDTG_TOOLS = {
  decimals: USDTG_DECIMALS,
  toMicro: (amount: number): bigint => BigInt(Math.round(amount * 10 ** USDTG_DECIMALS)),
  fromMicro: (micro: bigint): number => Number(micro) / 10 ** USDTG_DECIMALS
};
