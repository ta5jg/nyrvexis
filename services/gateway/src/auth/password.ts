import crypto from "node:crypto";

const SALT_LEN = 16;
const KEY_LEN = 64;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function hashPassword(password: string): { saltB64: string; hashB64: string } {
  const salt = crypto.randomBytes(SALT_LEN);
  const hash = crypto.scryptSync(password.normalize("NFKC"), salt, KEY_LEN);
  return { saltB64: salt.toString("base64url"), hashB64: Buffer.from(hash).toString("base64url") };
}

export function verifyPassword(password: string, saltB64: string, hashB64: string): boolean {
  try {
    const salt = Buffer.from(saltB64, "base64url");
    const expected = Buffer.from(hashB64, "base64url");
    const hash = crypto.scryptSync(password.normalize("NFKC"), salt, KEY_LEN);
    return hash.length === expected.length && crypto.timingSafeEqual(hash, expected);
  } catch {
    return false;
  }
}
