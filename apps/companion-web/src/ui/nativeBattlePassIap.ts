import { Capacitor } from "@capacitor/core";

export type StoreProductSummary = {
  identifier: string;
  title: string;
  description: string;
  priceString: string;
};

function bpPurchaseType(): "inapp" | "subs" {
  const raw = (import.meta.env.VITE_IAP_BP_TYPE as string | undefined)?.trim().toLowerCase();
  return raw === "subs" ? "subs" : "inapp";
}

function androidSubscriptionPlanId(): string | undefined {
  const raw = (import.meta.env.VITE_IAP_BP_ANDROID_PLAN_ID as string | undefined)?.trim();
  return raw && raw.length > 0 ? raw : undefined;
}

export function isNativeStorePurchasesAvailable(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function nativeStorePlatform(): "ios" | "android" | null {
  if (!isNativeStorePurchasesAvailable()) return null;
  const p = Capacitor.getPlatform();
  if (p === "ios") return "ios";
  if (p === "android") return "android";
  return null;
}

/** SKU for the running native shell (must match gateway `KR_IAP_BATTLE_PASS_PRODUCT_ID_*`). */
export function battlePassSkuForNativePlatform(): string | null {
  const plat = nativeStorePlatform();
  if (!plat) return null;
  if (plat === "ios") {
    return (
      ((import.meta.env.VITE_IAP_BP_PRODUCT_IOS as string | undefined) ?? "").trim() || "kindrail_bp_premium_s0_ios"
    );
  }
  return (
    ((import.meta.env.VITE_IAP_BP_PRODUCT_ANDROID as string | undefined) ?? "").trim() || "kindrail_bp_premium_s0_android"
  );
}

/** Deterministic UUID-shaped token for StoreKit 2 (no PII). */
export async function deterministicAppAccountUuid(userId: string): Promise<string> {
  const data = new TextEncoder().encode(`kindrail:iacct:${userId}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(buf).slice(0, 16);
  bytes[6] = (bytes[6]! & 0x0f) | 0x50;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

export async function fetchBattlePassStoreListing(productId: string): Promise<StoreProductSummary | null> {
  if (!isNativeStorePurchasesAvailable()) return null;
  const { NativePurchases, PURCHASE_TYPE } = await import("@capgo/native-purchases");
  const supported = await NativePurchases.isBillingSupported();
  if (!supported.isBillingSupported) return null;
  const pt = bpPurchaseType() === "subs" ? PURCHASE_TYPE.SUBS : PURCHASE_TYPE.INAPP;
  try {
    const { product } = await NativePurchases.getProduct({ productIdentifier: productId, productType: pt });
    return {
      identifier: product.identifier,
      title: product.title,
      description: product.description,
      priceString: product.priceString
    };
  } catch {
    return null;
  }
}

export async function purchaseBattlePassOnDevice(opts: {
  productId: string;
  userId: string;
}): Promise<{ receipt: string; platform: "ios" | "android" }> {
  const platform = nativeStorePlatform();
  if (!platform) throw new Error("Native store unavailable");

  const { NativePurchases, PURCHASE_TYPE } = await import("@capgo/native-purchases");
  const supported = await NativePurchases.isBillingSupported();
  if (!supported.isBillingSupported) throw new Error("Billing not supported on this device");

  const type = bpPurchaseType();
  const pt = type === "subs" ? PURCHASE_TYPE.SUBS : PURCHASE_TYPE.INAPP;
  const plan = platform === "android" && type === "subs" ? androidSubscriptionPlanId() : undefined;
  if (platform === "android" && type === "subs" && (!plan || plan.length === 0)) {
    throw new Error("Configure VITE_IAP_BP_ANDROID_PLAN_ID for subscription SKUs on Android");
  }

  const appAccountToken = await deterministicAppAccountUuid(opts.userId);

  const tx = await NativePurchases.purchaseProduct({
    productIdentifier: opts.productId,
    productType: pt,
    planIdentifier: plan,
    appAccountToken,
    autoAcknowledgePurchases: true
  });

  if (platform === "ios") {
    const receipt = tx.receipt?.trim();
    if (!receipt) throw new Error("Missing App Store receipt — retry after updating the iOS build");
    return { receipt, platform: "ios" };
  }

  const token = tx.purchaseToken?.trim();
  if (!token) throw new Error("Missing Play purchase token");
  if (tx.purchaseState !== undefined && tx.purchaseState !== "1") {
    throw new Error("Purchase not completed yet (pending or invalid)");
  }
  return { receipt: token, platform: "android" };
}
