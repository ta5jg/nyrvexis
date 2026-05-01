import { GoogleAuth } from "google-auth-library";

/**
 * Play Billing — tek seferlik ürün (`productId` + `purchaseToken`).
 * Abonelik SKU’ları için `subscriptionsv2` veya subscription endpoint’i gerekir (sonra).
 */

export async function verifyAndroidProductPurchase(input: {
  packageName: string;
  productId: string;
  purchaseToken: string;
  serviceAccountKeyPath: string;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  try {
    const auth = new GoogleAuth({
      keyFile: input.serviceAccountKeyPath,
      scopes: ["https://www.googleapis.com/auth/androidpublisher"]
    });
    const client = await auth.getClient();
    const url =
      `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(input.packageName)}` +
      `/purchases/products/${encodeURIComponent(input.productId)}/tokens/${encodeURIComponent(input.purchaseToken)}`;

    const res = await client.request<{ purchaseState?: number }>({ url });
    const ps = res.data?.purchaseState;
    // 0 = purchased
    if (ps !== 0) {
      return { ok: false, reason: `PURCHASE_STATE_${ps ?? "UNKNOWN"}` };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: "GOOGLE_VERIFY_FAILED" };
  }
}
