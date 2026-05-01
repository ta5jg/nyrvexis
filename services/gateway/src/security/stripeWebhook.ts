/* =============================================================================
 * File:           services/gateway/src/security/stripeWebhook.ts
 * Author:         USDTG GROUP TECHNOLOGY LLC
 * Developer:      Irfan Gedik
 * Created Date:   2026-04-30
 * Last Update:    2026-04-30
 * Version:        0.3.0
 *
 * Description:
 *   
 *
 * License:
 *   Proprietary. All rights reserved. See LICENSE in the repository root.
 * ============================================================================= */

import { createHmac, timingSafeEqual } from "node:crypto";

function signingKeyMaterial(secret: string): string | Buffer {
  if (secret.startsWith("whsec_")) {
    return Buffer.from(secret.slice("whsec_".length), "base64");
  }
  return secret;
}

/**
 * Stripe webhook signature (v1) per https://stripe.com/docs/webhooks/signatures
 * @param rawBody — exact request bytes (must match what Stripe signed)
 */
export function verifyStripeWebhookEvent(
  rawBody: Buffer,
  stripeSignatureHeader: string | undefined,
  webhookSecret: string,
  toleranceSec = 300
): Record<string, unknown> {
  if (!stripeSignatureHeader) throw new Error("MISSING_SIGNATURE");
  const items = stripeSignatureHeader.split(",").map((s) => s.trim());
  let t = 0;
  const v1s: string[] = [];
  for (const item of items) {
    const eq = item.indexOf("=");
    if (eq < 0) continue;
    const k = item.slice(0, eq);
    const v = item.slice(eq + 1);
    if (k === "t") t = parseInt(v, 10) || 0;
    if (k === "v1") v1s.push(v);
  }
  if (!t || v1s.length === 0) throw new Error("MALFORMED_SIGNATURE_HEADER");
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - t) > toleranceSec) throw new Error("TIMESTAMP_TOLERANCE");

  const utf8 = rawBody.toString("utf8");
  const signed = `${t}.${utf8}`;
  const key = signingKeyMaterial(webhookSecret);
  const expectedHex = createHmac("sha256", key).update(signed, "utf8").digest("hex");
  const expBuf = Buffer.from(expectedHex, "hex");

  let ok = false;
  for (const sig of v1s) {
    try {
      const sigBuf = Buffer.from(sig, "hex");
      if (sigBuf.length === expBuf.length && timingSafeEqual(sigBuf, expBuf)) ok = true;
    } catch {
      // ignore malformed hex
    }
  }
  if (!ok) throw new Error("SIGNATURE_MISMATCH");

  return JSON.parse(utf8) as Record<string, unknown>;
}
