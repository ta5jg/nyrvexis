import React, { useEffect, useState } from "react";
import { useTranslation } from "../../i18n";
import { connect, detect, disconnect, readStoredAddress } from "./tronWallet";

function shortAddr(a: string): string {
  if (a.length <= 12) return a;
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export function WalletConnect() {
  const { t } = useTranslation();
  const [addr, setAddr] = useState<string | null>(() => readStoredAddress());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>("");
  const [hasProvider, setHasProvider] = useState<boolean>(false);

  useEffect(() => {
    setHasProvider(detect());
    const id = window.setInterval(() => setHasProvider(detect()), 1500);
    return () => window.clearInterval(id);
  }, []);

  async function onConnect() {
    setBusy(true);
    setErr("");
    try {
      const a = await connect();
      setAddr(a);
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("wallet.connectFailed"));
    } finally {
      setBusy(false);
    }
  }

  function onDisconnect() {
    disconnect();
    setAddr(null);
  }

  return (
    <div className="walletConnect" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      {addr ? (
        <>
          <span className="pill" style={{ padding: "4px 10px" }}>
            <strong>{t("wallet.connected")}</strong>
            <span className="mono" style={{ marginLeft: 6 }}>{shortAddr(addr)}</span>
          </span>
          <button type="button" className="btn" onClick={onDisconnect}>
            {t("wallet.disconnect")}
          </button>
        </>
      ) : hasProvider ? (
        <button type="button" className="btn primary" disabled={busy} onClick={onConnect}>
          {busy ? t("wallet.connecting") : t("wallet.connectTronLink")}
        </button>
      ) : (
        <a
          className="btn"
          href="https://www.tronlink.org/"
          target="_blank"
          rel="noreferrer noopener"
        >
          {t("wallet.installTronLink")}
        </a>
      )}
      {err ? <span className="sub bad" style={{ fontSize: 12 }}>{err}</span> : null}
    </div>
  );
}
