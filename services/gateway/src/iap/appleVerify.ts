/**
 * Apple legacy Verify Receipt (auto-renewable ve içinde ürünler için geniş kullanım).
 * Üretimde ek olarak App Store Server API / StoreKit 2 JWS doğrulaması önerilir.
 */

type AppleVerifyReceiptJson = {
  status: number;
  receipt?: {
    in_app?: Array<{ product_id?: string }>;
  };
  latest_receipt_info?: Array<{ product_id?: string }>;
};

function collectAppleProductIds(body: AppleVerifyReceiptJson): Set<string> {
  const ids = new Set<string>();
  for (const row of body.receipt?.in_app ?? []) {
    if (typeof row.product_id === "string" && row.product_id.length > 0) ids.add(row.product_id);
  }
  for (const row of body.latest_receipt_info ?? []) {
    if (typeof row.product_id === "string" && row.product_id.length > 0) ids.add(row.product_id);
  }
  return ids;
}

async function postVerifyReceipt(url: string, receiptBase64: string, sharedSecret: string): Promise<AppleVerifyReceiptJson> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      "receipt-data": receiptBase64,
      password: sharedSecret,
      "exclude-old-transactions": false
    })
  });
  return (await res.json()) as AppleVerifyReceiptJson;
}

export async function verifyAppleBattlePassProduct(input: {
  receiptBase64: string;
  sharedSecret: string;
  expectedProductId: string;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const production = "https://buy.itunes.apple.com/verifyReceipt";
  const sandbox = "https://sandbox.itunes.apple.com/verifyReceipt";

  let json = await postVerifyReceipt(production, input.receiptBase64, input.sharedSecret);
  if (json.status === 21007) {
    json = await postVerifyReceipt(sandbox, input.receiptBase64, input.sharedSecret);
  }

  if (json.status !== 0) {
    return { ok: false, reason: `APPLE_STATUS_${json.status}` };
  }

  const ids = collectAppleProductIds(json);
  if (!ids.has(input.expectedProductId)) {
    return { ok: false, reason: "PRODUCT_NOT_IN_RECEIPT" };
  }

  return { ok: true };
}
