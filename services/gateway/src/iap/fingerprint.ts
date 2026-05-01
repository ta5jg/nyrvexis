import { createHash } from "node:crypto";

/** Tekilleştirme: aynı makbuz iki hesaba bağlanamaz. */
export function iapReceiptFingerprint(platform: string, productId: string, receipt: string): string {
  return createHash("sha256").update(`${platform}\n${productId}\n${receipt}`, "utf8").digest("hex");
}
