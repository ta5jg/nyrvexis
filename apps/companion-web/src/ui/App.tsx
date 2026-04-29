import React, { useEffect, useMemo, useState } from "react";
import { KindrailSdk } from "@kindrail/sdk-ts";
import type { KrBattleSimRequest, KrBattleSimResult } from "@kindrail/protocol";
import { decodeJsonFromUrlParam, encodeJsonToUrlParam, copyToClipboard } from "./share";
import { makeRequest } from "./demoBattle";
import { exportElementToPng } from "./exportPng";

type LoadState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; result: KrBattleSimResult }
  | { kind: "err"; message: string };

function nowSeed(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `web-${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}-${pad(
    d.getUTCHours()
  )}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;
}

function summarize(result: KrBattleSimResult): string {
  const a = result.remaining.a;
  const b = result.remaining.b;
  const aAlive = Object.values(a).filter((hp): hp is number => typeof hp === "number" && hp > 0).length;
  const bAlive = Object.values(b).filter((hp): hp is number => typeof hp === "number" && hp > 0).length;
  return `Outcome: ${result.outcome.toUpperCase()} | ticks=${result.ticks} | alive: A=${aAlive} B=${bAlive}`;
}

export function App() {
  const sdk = useMemo(() => new KindrailSdk({ baseUrl: "http://localhost:8787" }), []);

  const [gatewayOk, setGatewayOk] = useState<boolean | null>(null);
  const [gatewayInfo, setGatewayInfo] = useState<string>("");

  const [seed, setSeed] = useState<string>(() => {
    const url = new URL(window.location.href);
    const s = url.searchParams.get("seed");
    return s && s.length > 0 ? s : nowSeed();
  });

  const [maxTicks, setMaxTicks] = useState<number>(() => {
    const url = new URL(window.location.href);
    const mt = Number(url.searchParams.get("maxTicks") ?? "200");
    return Number.isFinite(mt) ? Math.max(1, Math.min(2000, Math.floor(mt))) : 200;
  });

  const [requestText, setRequestText] = useState<string>(() => {
    const url = new URL(window.location.href);
    const q = url.searchParams.get("q");
    if (q) {
      try {
        const req = decodeJsonFromUrlParam<KrBattleSimRequest>(q);
        return JSON.stringify(req, null, 2);
      } catch {
        // fallthrough
      }
    }
    return JSON.stringify(makeRequest(seed, maxTicks), null, 2);
  });

  const [state, setState] = useState<LoadState>({ kind: "idle" });

  useEffect(() => {
    sdk
      .health()
      .then((h) => {
        setGatewayOk(true);
        setGatewayInfo(`${h.service} v${h.version}`);
      })
      .catch(() => {
        setGatewayOk(false);
        setGatewayInfo("gateway offline");
      });
  }, [sdk]);

  function syncUrlFromReq(req: KrBattleSimRequest) {
    const url = new URL(window.location.href);
    url.searchParams.set("q", encodeJsonToUrlParam(req));
    url.searchParams.set("seed", req.seed.seed);
    url.searchParams.set("maxTicks", String(req.maxTicks));
    window.history.replaceState({}, "", url.toString());
  }

  async function runSim() {
    setState({ kind: "loading" });
    try {
      const req = JSON.parse(requestText) as KrBattleSimRequest;
      syncUrlFromReq(req);
      const res = await sdk.battleSim(req);
      setState({ kind: "ok", result: res });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown error";
      setState({ kind: "err", message: msg });
    }
  }

  async function copyShareLink() {
    await copyToClipboard(window.location.href);
  }

  async function copySocialText() {
    if (state.kind !== "ok") return;
    const text = `KINDRAIL battle\n${summarize(state.result)}\n${window.location.href}`;
    await copyToClipboard(text);
  }

  function xShareUrl(): string {
    if (state.kind !== "ok") return "https://x.com/intent/tweet";
    const text = `KINDRAIL battle — ${summarize(state.result)}`;
    const url = window.location.href;
    const intent = new URL("https://x.com/intent/tweet");
    intent.searchParams.set("text", text);
    intent.searchParams.set("url", url);
    return intent.toString();
  }

  async function exportPng() {
    if (state.kind !== "ok") return;
    const el = document.getElementById("kr-share-card");
    if (!el) return;
    await exportElementToPng(el, `kindrail-battle-${seed}.png`);
  }

  async function useDailySeed() {
    try {
      const d = await sdk.dailySeed();
      setSeed(d.seed);
      const req = makeRequest(d.seed, maxTicks);
      setRequestText(JSON.stringify(req, null, 2));
      // Run immediately for 1-click share
      setState({ kind: "loading" });
      syncUrlFromReq(req);
      const res = await sdk.battleSim(req);
      setState({ kind: "ok", result: res });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown error";
      setState({ kind: "err", message: msg });
    }
  }

  return (
    <div className="wrap">
      <div className="top">
        <div className="brand">
          <h1>KINDRAIL</h1>
          <div className="sub">
            Web-first companion client • deterministic battle sim • shareable replay links
          </div>
        </div>
        <div className="pill">
          <strong className={gatewayOk ? "ok" : gatewayOk === false ? "bad" : ""}>
            {gatewayOk === null ? "…" : gatewayOk ? "OK" : "DOWN"}
          </strong>
          <span>{gatewayInfo}</span>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <h2>Battle request (SSOT JSON)</h2>

          <div className="row">
            <div className="field">
              <label>seed</label>
              <input
                value={seed}
                onChange={(e) => {
                  const s = e.target.value;
                  setSeed(s);
                  try {
                    const req = JSON.parse(requestText) as KrBattleSimRequest;
                    const next: KrBattleSimRequest = { ...req, seed: { seed: s } };
                    setRequestText(JSON.stringify(next, null, 2));
                  } catch {
                    // ignore
                  }
                }}
              />
            </div>
            <div className="field">
              <label>maxTicks</label>
              <input
                value={String(maxTicks)}
                onChange={(e) => {
                  const n = Math.max(1, Math.min(2000, Math.floor(Number(e.target.value) || 200)));
                  setMaxTicks(n);
                  try {
                    const req = JSON.parse(requestText) as KrBattleSimRequest;
                    const next: KrBattleSimRequest = { ...req, maxTicks: n };
                    setRequestText(JSON.stringify(next, null, 2));
                  } catch {
                    // ignore
                  }
                }}
              />
            </div>
          </div>

          <div className="field" style={{ marginTop: 10 }}>
            <label>request JSON</label>
            <textarea value={requestText} onChange={(e) => setRequestText(e.target.value)} />
          </div>

          <div className="btnbar">
            <button className="btn primary" onClick={runSim} disabled={state.kind === "loading"}>
              {state.kind === "loading" ? "Running…" : "Run battle"}
            </button>
            <button className="btn" onClick={useDailySeed} disabled={state.kind === "loading"}>
              Daily battle
            </button>
            <button
              className="btn"
              onClick={() => setRequestText(JSON.stringify(makeRequest(nowSeed(), maxTicks), null, 2))}
            >
              New demo
            </button>
            <button className="btn" onClick={copyShareLink}>
              Copy share link
            </button>
            <button className="btn" onClick={copySocialText} disabled={state.kind !== "ok"}>
              Copy social text
            </button>
            <button className="btn" onClick={exportPng} disabled={state.kind !== "ok"}>
              Export PNG
            </button>
            <a className="btn" href={xShareUrl()} target="_blank" rel="noreferrer">
              Share to X
            </a>
          </div>
        </div>

        <div className="card">
          <h2>Result</h2>

          {state.kind === "idle" && <div className="log">Run a battle to see output.</div>}
          {state.kind === "loading" && <div className="log">Simulating…</div>}
          {state.kind === "err" && <div className="log bad">{state.message}</div>}
          {state.kind === "ok" && (
            <>
              <div className="pill" style={{ marginBottom: 10 }}>
                <strong className={state.result.outcome === "a" ? "ok" : state.result.outcome === "b" ? "bad" : ""}>
                  {state.result.outcome.toUpperCase()}
                </strong>
                <span className="mono">ticks={state.result.ticks}</span>
              </div>
              <div id="kr-share-card" className="shareCard">
                <div className="shareCardTitle">
                  <div className="k">KINDRAIL</div>
                  <div className="meta mono">{seed}</div>
                </div>
                <div className="log">{summarize(state.result)}</div>
                <div className="log" style={{ marginTop: 8, color: "rgba(255,255,255,0.72)" }}>
                  {window.location.href}
                </div>
              </div>
              <div className="log" style={{ marginTop: 10 }}>
                {state.result.events.slice(0, 80).map((e: KrBattleSimResult["events"][number], i: number) => {
                  if (e.kind === "hit")
                    return `${String(i + 1).padStart(3, "0")}  t=${e.t}  ${e.src} → ${e.dst}  dmg=${
                      e.dmg ?? 0
                    }${e.crit ? " CRIT" : ""}`;
                  if (e.kind === "death")
                    return `${String(i + 1).padStart(3, "0")}  t=${e.t}  ${e.dst} died`;
                  return `${String(i + 1).padStart(3, "0")}  t=${e.t}  END`;
                }).join("\n")}
                {state.result.events.length > 80 ? `\n… (${state.result.events.length - 80} more events)` : ""}
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ marginTop: 14 }} className="pill">
        <span className="mono">
          Tip: this page URL encodes the request. Share it and anyone can replay the same deterministic battle.
        </span>
      </div>
    </div>
  );
}

