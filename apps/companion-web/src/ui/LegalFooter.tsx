import React from "react";
import type { KrLegalPublicResponse } from "@kindrail/protocol";

export function LegalFooter(props: { legal: KrLegalPublicResponse | null }) {
  const l = props.legal;
  if (!l?.ok) return null;

  return (
    <footer className="legalFoot" aria-label="Legal and support">
      <div className="legalFootInner">
        {l.privacyPolicyUrl ? (
          <a className="legalFootLink" href={l.privacyPolicyUrl} target="_blank" rel="noreferrer noopener">
            Privacy
          </a>
        ) : null}
        {l.termsOfServiceUrl ? (
          <a className="legalFootLink" href={l.termsOfServiceUrl} target="_blank" rel="noreferrer noopener">
            Terms
          </a>
        ) : null}
        {l.supportEmail ? (
          <a className="legalFootLink" href={`mailto:${encodeURIComponent(l.supportEmail)}`}>
            Support
          </a>
        ) : null}
        {l.accountDeletionUrl ? (
          <a className="legalFootLink" href={l.accountDeletionUrl} target="_blank" rel="noreferrer noopener">
            Account &amp; data
          </a>
        ) : null}
      </div>
      {l.contentDescriptorsHint ? (
        <details className="legalFootDetails">
          <summary className="legalFootSummary">Store disclosure notes</summary>
          <p className="legalFootHint">{l.contentDescriptorsHint}</p>
        </details>
      ) : null}
    </footer>
  );
}
