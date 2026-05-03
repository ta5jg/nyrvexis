/* =============================================================================
 * File:           apps/companion-web/src/ui/HomeGate.tsx
 * Author:         USDTG GROUP TECHNOLOGY LLC
 * Developer:      Irfan Gedik
 * Created Date:   2026-04-30
 * Last Update:    2026-05-01
 * Version:        0.2.0
 *
 * Description:
 *   Release roadmap R1.1 — landing gate before the companion dashboard.
 *
 * License:
 *   Proprietary. All rights reserved. See LICENSE in the repository root.
 * ============================================================================= */

import React from "react";
import { useTranslation } from "../i18n";
import { LanguageSwitcher } from "../i18n/LanguageSwitcher";
import { WalletConnect } from "./wallet/WalletConnect";

export function HomeGate(props: {
  gatewayOk: boolean | null;
  gatewayInfo: string;
  runtimeEnvLabel?: string;
  onEnterBattle: () => void;
}) {
  const { t } = useTranslation();
  const status =
    props.gatewayOk === null
      ? t("home.statusChecking")
      : props.gatewayOk
        ? t("home.statusConnected")
        : t("home.statusUnavailable");
  const statusClass =
    props.gatewayOk === null ? "" : props.gatewayOk ? "gameGateStatusOk" : "gameGateStatusBad";

  return (
    <main className="gameGate" aria-label={t("app.brand")}>
      <div className="gameGateCard">
        <div className="gameGateBrand">{t("app.brand")}</div>
        <p className="gameGateTagline">{t("app.tagline")}</p>
        <button type="button" className="gameGateCta" onClick={props.onEnterBattle}>
          {t("home.enterBattle")}
        </button>
        <p className={`gameGateStatus ${statusClass}`}>
          {t("home.gatewayLabel")} <strong>{status}</strong>
          {props.gatewayInfo ? <span className="gameGateStatusMeta"> · {props.gatewayInfo}</span> : null}
        </p>
        <p className="gameGateHint">{t("home.panelsHint")}</p>
        <div className="gameGateWeb3" style={{ marginTop: 12, padding: "10px 12px", borderRadius: 10, background: "rgba(120,140,255,0.08)", border: "1px solid rgba(160,180,255,0.18)" }}>
          <div style={{ fontSize: 12, opacity: 0.92 }}>
            <strong>{t("web3.poweredBy")}</strong>
          </div>
          <div style={{ fontSize: 11, opacity: 0.78, marginTop: 4 }}>
            {t("web3.earnUsdtg")}
          </div>
          <div style={{ marginTop: 8 }}>
            <WalletConnect />
          </div>
        </div>
        <p className="gameGateMeta">
          {props.runtimeEnvLabel ? `${props.runtimeEnvLabel} · ` : null}
          {t("app.sameClientNote")}
        </p>
        <div className="gameGateLangRow">
          <LanguageSwitcher />
        </div>
      </div>
    </main>
  );
}
