import React, { useState } from "react";
import { useTranslation } from "../../i18n";
import type { NyrvexisSdk } from "@nyrvexis/sdk-ts";

const TREASURY_ADDRESS = "TDhqMjTnDAUxYraTVLLie9Qd8NDGY91idq";
const PRODUCT_ID = "nyrvexis_bp_premium_s0_web" as const;
const PRICE_USDTG = 5; // 5 USDTg for premium battle pass
const PRICE_MICRO = (PRICE_USDTG * 1_000_000).toString();

export function UsdtgPayModal(props: {
  sdk: NyrvexisSdk;
  onClose: () => void;
  onPremiumGranted: () => void;
}) {
  const { t } = useTranslation();
  const [step, setStep] = useState<"send" | "verify">("send");
  const [txHash, setTxHash] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(TREASURY_ADDRESS);
    } catch {
      /* noop */
    }
  }

  async function submitVerify() {
    setBusy(true);
    setErr("");
    try {
      const cleaned = txHash.trim().replace(/^0x/, "");
      if (!/^[0-9a-fA-F]{64}$/.test(cleaned)) {
        throw new Error(t("wallet.invalidTxHash"));
      }
      const result = await props.sdk.paymentsUsdtgVerify({
        v: 1,
        txHash: cleaned,
        productId: PRODUCT_ID,
        amountMicro: PRICE_MICRO
      });
      if (result.premiumGranted) {
        props.onPremiumGranted();
        props.onClose();
      } else {
        setErr(t("wallet.txFailed"));
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("wallet.txFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(7,10,18,0.85)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16
      }}
      onClick={props.onClose}
    >
      <div
        className="card"
        style={{ maxWidth: 480, width: "100%", padding: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0 }}>{t("wallet.payWithUsdtg")} — Battle Pass Premium</h3>
        <div className="sub" style={{ marginBottom: 14 }}>
          {PRICE_USDTG} USDTg → {t("wallet.premiumOnVerify")}
        </div>

        {step === "send" ? (
          <>
            <ol style={{ paddingLeft: 18, fontSize: 14, lineHeight: 1.6 }}>
              <li>{t("wallet.step1OpenWallet")}</li>
              <li>
                {t("wallet.step2SendTo")}
                <div
                  className="mono"
                  style={{
                    marginTop: 6,
                    padding: "8px 10px",
                    background: "rgba(255,255,255,0.06)",
                    borderRadius: 6,
                    fontSize: 12,
                    wordBreak: "break-all"
                  }}
                >
                  {TREASURY_ADDRESS}
                </div>
                <button
                  type="button"
                  className="btn"
                  style={{ marginTop: 8, fontSize: 12 }}
                  onClick={copyAddress}
                >
                  {t("wallet.copyAddress")}
                </button>
              </li>
              <li>
                <strong>{t("wallet.step3Amount")}: {PRICE_USDTG} USDTg</strong>
              </li>
              <li>{t("wallet.step4PasteTxHash")}</li>
            </ol>
            <div className="btnbar" style={{ marginTop: 16 }}>
              <button type="button" className="btn primary" onClick={() => setStep("verify")}>
                {t("wallet.iSentIt")}
              </button>
              <button type="button" className="btn" onClick={props.onClose}>
                {t("ui.dismiss")}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="field" style={{ marginBottom: 12 }}>
              <label htmlFor="usdtg-tx">{t("wallet.txHashLabel")}</label>
              <input
                id="usdtg-tx"
                type="text"
                placeholder="abc123…"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                style={{ fontFamily: "ui-monospace, monospace" }}
              />
              <div className="sub" style={{ fontSize: 11, marginTop: 4, opacity: 0.7 }}>
                {t("wallet.txHashHint")}
              </div>
            </div>
            {err ? (
              <div className="log bad" style={{ marginBottom: 12 }}>
                {err}
              </div>
            ) : null}
            <div className="btnbar">
              <button
                type="button"
                className="btn primary"
                disabled={busy || !txHash.trim()}
                onClick={() => void submitVerify()}
              >
                {busy ? t("wallet.verifyingTx") : t("wallet.verify")}
              </button>
              <button
                type="button"
                className="btn"
                disabled={busy}
                onClick={() => setStep("send")}
              >
                {t("wallet.back")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
