import { OAuth2Client } from "google-auth-library";

export type GoogleIdPayload = {
  sub: string;
  email: string;
};

export async function verifyGoogleIdToken(idToken: string, audience: string): Promise<GoogleIdPayload> {
  const client = new OAuth2Client(audience);
  const ticket = await client.verifyIdToken({
    idToken,
    audience
  });
  const payload = ticket.getPayload();
  if (!payload?.sub) throw new Error("INVALID_GOOGLE_TOKEN");
  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  if (!email || !email.includes("@")) throw new Error("GOOGLE_EMAIL_MISSING");
  if (payload.email_verified === false) throw new Error("GOOGLE_EMAIL_NOT_VERIFIED");
  return { sub: payload.sub, email };
}
