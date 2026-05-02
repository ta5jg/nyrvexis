import React from "react";
import type { NvLegalPublicResponse } from "@nyrvexis/protocol";
import { useTranslation } from "../i18n";

export function LegalFooter(props: { legal: NvLegalPublicResponse | null }) {
  const { t } = useTranslation();
  const l = props.legal;
  if (!l?.ok) return null;

  return (
    <footer className="legalFoot" aria-label={t("legal.sectionLabel")}>
      <div className="legalFootInner">
        {l.privacyPolicyUrl ? (
          <a className="legalFootLink" href={l.privacyPolicyUrl} target="_blank" rel="noreferrer noopener">
            {t("legal.privacy")}
          </a>
        ) : null}
        {l.termsOfServiceUrl ? (
          <a className="legalFootLink" href={l.termsOfServiceUrl} target="_blank" rel="noreferrer noopener">
            {t("legal.terms")}
          </a>
        ) : null}
        {l.supportEmail ? (
          <a className="legalFootLink" href={`mailto:${encodeURIComponent(l.supportEmail)}`}>
            {t("legal.support")}
          </a>
        ) : null}
        {l.accountDeletionUrl ? (
          <a className="legalFootLink" href={l.accountDeletionUrl} target="_blank" rel="noreferrer noopener">
            {t("legal.accountAndData")}
          </a>
        ) : null}
      </div>
      {l.contentDescriptorsHint ? (
        <details className="legalFootDetails">
          <summary className="legalFootSummary">{t("legal.storeDisclosure")}</summary>
          <p className="legalFootHint">{l.contentDescriptorsHint}</p>
        </details>
      ) : null}
    </footer>
  );
}
