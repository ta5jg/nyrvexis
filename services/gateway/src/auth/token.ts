import crypto from "node:crypto";

export type KrTokenTyp = "access" | "refresh";

export type TokenPayload = {
  v: 1;
  /** Missing on legacy tokens; treated as access in middleware. */
  typ?: KrTokenTyp;
  userId: string;
  iatMs: number;
  expMs: number;
  /** Rotation id for refresh tokens (must exist in gateway `refreshSessions`). */
  jti?: string;
};

function b64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function b64urlJson(obj: unknown): string {
  return b64url(Buffer.from(JSON.stringify(obj), "utf8"));
}

function unb64url(s: string): Buffer {
  const pad = "===".slice((s.length + 3) % 4);
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(b64, "base64");
}

export function signToken(payload: TokenPayload, secret: string): string {
  const header = { alg: "HS256", typ: "KR" as const };
  const h = b64urlJson(header);
  const p = b64urlJson(payload);
  const msg = `${h}.${p}`;
  const sig = crypto.createHmac("sha256", secret).update(msg).digest();
  return `${msg}.${b64url(sig)}`;
}

export function verifyToken(token: string, secret: string): TokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [h, p, s] = parts;
  const msg = `${h}.${p}`;
  const expected = crypto.createHmac("sha256", secret).update(msg).digest();
  const got = unb64url(s);
  if (got.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(got, expected)) return null;

  try {
    const payload = JSON.parse(unb64url(p).toString("utf8")) as TokenPayload;
    if (payload.v !== 1) return null;
    if (typeof payload.userId !== "string" || payload.userId.length < 1) return null;
    if (typeof payload.iatMs !== "number" || typeof payload.expMs !== "number") return null;
    if (Date.now() > payload.expMs) return null;
    return payload;
  } catch {
    return null;
  }
}

export function issueAccessToken(input: { userId: string; ttlMs: number; secret: string }): string {
  const now = Date.now();
  return signToken(
    {
      v: 1,
      typ: "access",
      userId: input.userId,
      iatMs: now,
      expMs: now + input.ttlMs
    },
    input.secret
  );
}

export function issueRefreshToken(input: {
  userId: string;
  ttlMs: number;
  secret: string;
  jti: string;
}): string {
  const now = Date.now();
  return signToken(
    {
      v: 1,
      typ: "refresh",
      userId: input.userId,
      iatMs: now,
      expMs: now + input.ttlMs,
      jti: input.jti
    },
    input.secret
  );
}
