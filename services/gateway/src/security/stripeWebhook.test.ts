import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyStripeWebhookEvent } from "./stripeWebhook.js";

const SECRET = "whsec_test_secret_value_for_unit_tests";

function sign(body: string, secret: string, t: number): string {
  // Mirror gateway's signingKeyMaterial: base64-decode after `whsec_`.
  const key = secret.startsWith("whsec_")
    ? Buffer.from(secret.slice("whsec_".length), "base64")
    : secret;
  const v1 = createHmac("sha256", key).update(`${t}.${body}`, "utf8").digest("hex");
  return `t=${t},v1=${v1}`;
}

describe("verifyStripeWebhookEvent", () => {
  it("accepts a valid signature within tolerance and returns parsed JSON", () => {
    const payload = JSON.stringify({ id: "evt_1", type: "checkout.session.completed" });
    const t = Math.floor(Date.now() / 1000);
    const header = sign(payload, SECRET, t);
    const result = verifyStripeWebhookEvent(Buffer.from(payload), header, SECRET);
    expect(result).toEqual({ id: "evt_1", type: "checkout.session.completed" });
  });

  it("throws MISSING_SIGNATURE when header is absent", () => {
    expect(() =>
      verifyStripeWebhookEvent(Buffer.from("{}"), undefined, SECRET)
    ).toThrow("MISSING_SIGNATURE");
  });

  it("throws MALFORMED_SIGNATURE_HEADER when header lacks t/v1", () => {
    expect(() =>
      verifyStripeWebhookEvent(Buffer.from("{}"), "garbage", SECRET)
    ).toThrow("MALFORMED_SIGNATURE_HEADER");
  });

  it("throws TIMESTAMP_TOLERANCE when t is far in the past", () => {
    const payload = "{}";
    const oldT = Math.floor(Date.now() / 1000) - 3600;
    const header = sign(payload, SECRET, oldT);
    expect(() =>
      verifyStripeWebhookEvent(Buffer.from(payload), header, SECRET, 60)
    ).toThrow("TIMESTAMP_TOLERANCE");
  });

  it("throws SIGNATURE_MISMATCH on a wrong v1", () => {
    const payload = JSON.stringify({ id: "evt_2" });
    const t = Math.floor(Date.now() / 1000);
    const tampered = `t=${t},v1=${"0".repeat(64)}`;
    expect(() =>
      verifyStripeWebhookEvent(Buffer.from(payload), tampered, SECRET)
    ).toThrow("SIGNATURE_MISMATCH");
  });

  it("rejects signature computed against a different body (tamper detection)", () => {
    const original = JSON.stringify({ amount: 100 });
    const t = Math.floor(Date.now() / 1000);
    const header = sign(original, SECRET, t);
    const tampered = JSON.stringify({ amount: 999 });
    expect(() =>
      verifyStripeWebhookEvent(Buffer.from(tampered), header, SECRET)
    ).toThrow("SIGNATURE_MISMATCH");
  });

  it("accepts plain (non-whsec_) secrets when both sides agree", () => {
    const plainSecret = "plain_secret_value";
    const payload = JSON.stringify({ id: "evt_3" });
    const t = Math.floor(Date.now() / 1000);
    const header = sign(payload, plainSecret, t);
    const result = verifyStripeWebhookEvent(
      Buffer.from(payload),
      header,
      plainSecret
    );
    expect(result).toEqual({ id: "evt_3" });
  });
});
