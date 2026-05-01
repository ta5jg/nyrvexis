import { z } from "zod";

/** Store-facing legal/support pointers — populate via gateway env; optional until prod. */
export const KrLegalPublicResponse = z.object({
  v: z.literal(1),
  /** False when no URLs/email configured yet */
  ok: z.boolean(),
  privacyPolicyUrl: z.string().url().optional(),
  termsOfServiceUrl: z.string().url().optional(),
  supportEmail: z.string().email().optional(),
  /** Deep link or hosted doc explaining account deletion / GDPR-style requests */
  accountDeletionUrl: z.string().url().optional(),
  /** Short crib for age gate copy — up to operator legal review */
  contentDescriptorsHint: z.string().max(2000).optional()
});

export type KrLegalPublicResponse = z.infer<typeof KrLegalPublicResponse>;
