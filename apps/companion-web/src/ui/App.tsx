import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { KindrailSdk } from "@kindrail/sdk-ts";
import type {
  KrBattleSimRequest,
  KrBattleSimResult,
  KrCosmeticsMeResponse,
  KrLegalPublicResponse,
  KrMetaProgressResponse,
  KrSeasonViewResponse,
  KrUnitArchetypeDef
} from "@kindrail/protocol";
import { decodeJsonFromUrlParam, encodeJsonToUrlParam, copyToClipboard } from "./share";
import { makeRequest } from "./demoBattle";
import { exportElementToPng } from "./exportPng";
import { buildReplayFrames } from "./replay";
import { getOrCreateDeviceId, getRefreshToken, getToken, setRefreshToken, setToken } from "./device";
import { parseRunFlag, parseView, scrollToSection, stripDeepLinkParams } from "./deepLinks";
import { urlBase64ToUint8Array } from "./push";
import { buildBattleRequest, type EnemyPreset } from "./deckBuilder";
import { readInitialSquadFromUrl } from "./initialSquad";
import { isOnboardingDone, setOnboardingDone } from "./onboarding";
import {
  getSfxMuted,
  primeAudio,
  setSfxMuted,
  sfxAbility,
  sfxCrit,
  sfxDeath,
  sfxHit,
  sfxLoss,
  sfxWin
} from "./audio";
import { HomeGate } from "./HomeGate";
import { LegalFooter } from "./LegalFooter";
import {
  battlePassSkuForNativePlatform,
  fetchBattlePassStoreListing,
  isNativeStorePurchasesAvailable,
  purchaseBattlePassOnDevice,
  type StoreProductSummary
} from "./nativeBattlePassIap";
import { ArenaCanvas } from "./visual/ArenaCanvas";

type LoadState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; result: KrBattleSimResult; request: KrBattleSimRequest }
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

function squadDisplayLine(units: KrBattleSimRequest["a"]["units"], defs: Map<string, KrUnitArchetypeDef>): string {
  if (!units?.length) return "—";
  return units.map((u) => defs.get(u.archetype)?.name ?? u.archetype).join(" · ");
}

/** Target wall-clock (ms) for a full Auto-play at speed 1× (~5–7 min session design target). */
const TARGET_AUTOPLAY_MS = 5.5 * 60 * 1000;

function gatewayBaseUrl(): string {
  const raw = import.meta.env.VITE_GATEWAY_URL?.trim();
  if (raw && raw.length > 0) return raw.replace(/\/+$/, "");
  if (typeof window !== "undefined" && window.location?.hostname) {
    const proto = window.location.protocol === "https:" ? "https:" : "http:";
    const h = window.location.hostname;
    // Avoid localhost → ::1 IPv6 when gateway listens on IPv4-only (common Node bind).
    const host = h === "localhost" || h === "127.0.0.1" ? "127.0.0.1" : h;
    return `${proto}//${host}:8787`;
  }
  return "http://127.0.0.1:8787";
}

const KR_GOOGLE_INTENT_KEY = "kr.googleIntent";

function loadGoogleIdentityScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("google gsi script failed"));
    document.head.appendChild(s);
  });
}

export function App() {
  const gatewayUrl = useMemo(() => gatewayBaseUrl(), []);
  const googleClientId = useMemo(() => (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "").trim(), []);
  const sdk = useMemo(() => new KindrailSdk({ baseUrl: gatewayUrl }), [gatewayUrl]);
  const googleSignInDivRef = useRef<HTMLDivElement | null>(null);

  const [gatewayOk, setGatewayOk] = useState<boolean | null>(null);
  const [gatewayInfo, setGatewayInfo] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authErr, setAuthErr] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [currency, setCurrency] = useState<{ gold: number; shards: number; keys: number } | null>(null);
  const [catalogNameById, setCatalogNameById] = useState<Record<string, string>>({});
  const [catalogDefs, setCatalogDefs] = useState<KrUnitArchetypeDef[]>([]);
  const [playerSlots, setPlayerSlots] = useState<Array<string | null>>(() => readInitialSquadFromUrl());
  const [enemyPreset, setEnemyPreset] = useState<EnemyPreset>("demo");
  const [showAdvancedJson, setShowAdvancedJson] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(() => !isOnboardingDone());
  const [replaySpeed, setReplaySpeed] = useState<1 | 2 | 4>(1);
  const [autoReplay, setAutoReplay] = useState(true);
  const [shopOffers, setShopOffers] = useState<Array<{ offerId: string; archetype: string; priceGold: number }>>([]);
  const [owned, setOwned] = useState<Record<string, number>>({});
  const [leaderboardTop, setLeaderboardTop] = useState<Array<{ userId: string; score: number }>>([]);
  const [leaderboardMe, setLeaderboardMe] = useState<{ rank?: number; total: number; score?: number } | null>(null);
  const [shareLink, setShareLink] = useState<string>("");
  const [pushNote, setPushNote] = useState<string>("");
  const [pushBusy, setPushBusy] = useState(false);
  const [offers, setOffers] = useState<Array<{ offerId: string; name: string; priceCents: number; currency: string }>>(
    []
  );
  const [metaProgress, setMetaProgress] = useState<KrMetaProgressResponse | null>(null);
  const [seasonInfo, setSeasonInfo] = useState<KrSeasonViewResponse | null>(null);
  const [cosmeticsState, setCosmeticsState] = useState<KrCosmeticsMeResponse | null>(null);
  const [cosmeticCatalog, setCosmeticCatalog] = useState<Array<{ id: string; title: string; slot: string }>>([]);
  const [iapPlatform, setIapPlatform] = useState<"ios" | "android">("ios");
  const [iapProductId, setIapProductId] = useState(() => {
    const raw = import.meta.env.VITE_IAP_BP_PRODUCT_IOS as string | undefined;
    return raw?.trim() || "kindrail_bp_premium_s0_ios";
  });
  const [iapReceipt, setIapReceipt] = useState("STUB_PREMIUM");
  const [iapBusy, setIapBusy] = useState(false);
  const autoRunConsumed = useRef(false);
  /** Play win/loss fanfare once when replay reaches the final tick (Run battle starts at tick 0). */
  const outcomeFanfareBattleKeyRef = useRef<string | null>(null);

  const persistShellPhase = useCallback((phase: "gate" | "play") => {
    try {
      if (phase === "play") sessionStorage.setItem("kindrail_shell_phase", "play");
      else sessionStorage.removeItem("kindrail_shell_phase");
    } catch {
      /* private mode / quota */
    }
  }, []);

  /** R1.1 — gate vs dashboard unless URL or saved session requests play. */
  const [gamePhase, setGamePhase] = useState<"gate" | "play">(() => {
    if (typeof window === "undefined") return "gate";
    const url = new URL(window.location.href);
    if (url.searchParams.get("q")) return "play";
    if (parseRunFlag(url)) return "play";
    if (parseView(url)) return "play";
    try {
      if (sessionStorage.getItem("kindrail_shell_phase") === "play") return "play";
    } catch {
      /* ignore */
    }
    return "gate";
  });

  const runtimeEnvLabel = import.meta.env.DEV ? "Development build" : "Production build";

  const [seed, setSeed] = useState<string>(() => {
    const url = new URL(window.location.href);
    const s = url.searchParams.get("seed");
    return s && s.length > 0 ? s : nowSeed();
  });

  const [maxTicks, setMaxTicks] = useState<number>(() => {
    const url = new URL(window.location.href);
    const mt = Number(url.searchParams.get("maxTicks") ?? "12000");
    return Number.isFinite(mt) ? Math.max(1, Math.min(100_000, Math.floor(mt))) : 12000;
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
  const [tick, setTick] = useState<number>(0);
  const [gatewayProbe, setGatewayProbe] = useState(0);
  const [sfxEnabled, setSfxEnabled] = useState(() => !getSfxMuted());
  const [legalPublic, setLegalPublic] = useState<KrLegalPublicResponse | null>(null);
  const [nativeBpProduct, setNativeBpProduct] = useState<StoreProductSummary | null>(null);

  useEffect(() => {
    const token = getToken();
    if (token) sdk.setToken(token);
    sdk.setRefreshToken(getRefreshToken());

    setGatewayOk(null);
    sdk
      .health()
      .then((h) => {
        setGatewayOk(true);
        setGatewayInfo(`${h.service} v${h.version}`);
      })
      .catch(() => {
        setGatewayOk(false);
        setGatewayInfo(
          `offline · ${gatewayUrl} · run pnpm dev (:8787) or pnpm run dev:full — local UI uses 127.0.0.1 for IPv4`
        );
      });
  }, [sdk, gatewayUrl, gatewayProbe]);

  useEffect(() => {
    let cancelled = false;
    sdk
      .legalPublic()
      .then((r) => {
        if (!cancelled) setLegalPublic(r);
      })
      .catch(() => {
        if (!cancelled) setLegalPublic(null);
      });
    return () => {
      cancelled = true;
    };
  }, [sdk]);

  useEffect(() => {
    if (!isNativeStorePurchasesAvailable()) return;
    if (!metaProgress || metaProgress.battlePass.hasPremium || !accountEmail) {
      setNativeBpProduct(null);
      return;
    }
    const sku = battlePassSkuForNativePlatform();
    if (!sku) return;
    let cancelled = false;
    void fetchBattlePassStoreListing(sku).then((p) => {
      if (!cancelled) setNativeBpProduct(p);
    });
    return () => {
      cancelled = true;
    };
  }, [metaProgress, accountEmail]);

  useEffect(() => {
    sdk
      .catalogUnits()
      .then((c) => {
        const map: Record<string, string> = {};
        for (const u of c.catalog.units) map[u.id] = u.name;
        setCatalogNameById(map);
        setCatalogDefs(c.catalog.units);
      })
      .catch(() => {});

    let cancelled = false;

    async function hydrateEconomy() {
      if (!getToken()) return;
      try {
        const [inv, shop, ownedRes] = await Promise.all([sdk.inventory(), sdk.shopDaily(), sdk.ownedUnits()]);
        if (cancelled) return;
        setCurrency(inv.inventory.currency);
        setShopOffers(shop.offers.map((o) => ({ offerId: o.offerId, archetype: o.archetype, priceGold: o.priceGold })));
        const m: Record<string, number> = {};
        for (const u of ownedRes.owned) m[u.archetype] = u.level;
        setOwned(m);
        try {
          setMetaProgress(await sdk.metaProgress());
        } catch {
          setMetaProgress(null);
        }
        try {
          setSeasonInfo(await sdk.seasonView());
        } catch {
          setSeasonInfo(null);
        }
        try {
          setCosmeticsState(await sdk.cosmeticsMe());
        } catch {
          setCosmeticsState(null);
        }
        try {
          setCosmeticCatalog((await sdk.cosmeticsCatalog()).cosmetics);
        } catch {
          setCosmeticCatalog([]);
        }
      } catch {
        /* offline */
      }
    }

    async function bootstrap() {
      const deviceId = getOrCreateDeviceId();
      const tok = getToken();
      const rt = getRefreshToken();
      sdk.setToken(tok);
      sdk.setRefreshToken(rt);

      if (tok) {
        try {
          const me = await sdk.me();
          if (cancelled) return;
          setUserId(me.userId);
          setAccountEmail(me.email ?? null);
          await hydrateEconomy();
          return;
        } catch {
          sdk.setToken(null);
          setToken(null);
        }
      }

      if (rt) {
        try {
          const r = await sdk.authRefresh({ v: 1, refreshToken: rt });
          if (cancelled) return;
          setToken(r.token);
          setRefreshToken(r.refreshToken);
          sdk.setToken(r.token);
          sdk.setRefreshToken(r.refreshToken);
          const me = await sdk.me();
          if (cancelled) return;
          setUserId(me.userId);
          setAccountEmail(me.email ?? null);
          await hydrateEconomy();
          return;
        } catch {
          /* fall through guest */
        }
      }

      try {
        const g = await sdk.authGuest({ v: 1, deviceId });
        if (cancelled) return;
        setToken(g.token);
        setRefreshToken(g.refreshToken);
        sdk.setToken(g.token);
        sdk.setRefreshToken(g.refreshToken);
        setUserId(g.userId);
        setAccountEmail(null);
        await hydrateEconomy();
      } catch {
        /* gateway offline */
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [sdk]);

  useEffect(() => {
    if (!catalogDefs.length) return;
    try {
      const req = buildBattleRequest({ seed, maxTicks, catalogDefs, playerSlots, enemyPreset });
      setRequestText(JSON.stringify(req, null, 2));
    } catch {
      // ignore
    }
  }, [catalogDefs, playerSlots, enemyPreset, seed, maxTicks]);

  useEffect(() => {
    const ios = ((import.meta.env.VITE_IAP_BP_PRODUCT_IOS as string | undefined) ?? "").trim() || "kindrail_bp_premium_s0_ios";
    const and =
      ((import.meta.env.VITE_IAP_BP_PRODUCT_ANDROID as string | undefined) ?? "").trim() || "kindrail_bp_premium_s0_android";
    setIapProductId(iapPlatform === "ios" ? ios : and);
  }, [iapPlatform]);

  useEffect(() => {
    const onUrl = () => {
      const url = new URL(window.location.href);
      const view = parseView(url);
      if (view) {
        requestAnimationFrame(() => scrollToSection(view));
        stripDeepLinkParams(url, ["view"]);
      }
    };
    onUrl();
    window.addEventListener("popstate", onUrl);
    window.addEventListener("kr:urlchanged", onUrl);
    return () => {
      window.removeEventListener("popstate", onUrl);
      window.removeEventListener("kr:urlchanged", onUrl);
    };
  }, []);

  useEffect(() => {
    let sub: { remove: () => Promise<void> } | undefined;
    void (async () => {
      try {
        const { App } = await import("@capacitor/app");
        sub = await App.addListener("appUrlOpen", ({ url }) => {
          try {
            const incoming = new URL(url);
            const cur = new URL(window.location.href);
            if (incoming.origin !== cur.origin) return;
            incoming.searchParams.forEach((v, k) => cur.searchParams.set(k, v));
            window.history.replaceState({}, "", cur.toString());
            window.dispatchEvent(new Event("kr:urlchanged"));
          } catch {
            // ignore
          }
        });
      } catch {
        // web-only dev
      }
    })();
    return () => {
      void sub?.remove();
    };
  }, []);

  useEffect(() => {
    sdk
      .offers()
      .then((o) => {
        setOffers(o.offers.map((x) => ({ offerId: x.offerId, name: x.name, priceCents: x.priceCents, currency: x.currency })));
      })
      .catch(() => {});
  }, [sdk]);

  useEffect(() => {
    // Referral accept via URL: ?ref=<userId>
    const url = new URL(window.location.href);
    const ref = url.searchParams.get("ref");
    if (!ref) return;
    if (!userId) return;
    sdk
      .referralAccept({ v: 1, referrerUserId: ref })
      .then(() => {
        url.searchParams.delete("ref");
        window.history.replaceState({}, "", url.toString());
      })
      .catch(() => {});
  }, [sdk, userId]);

  useEffect(() => {
    // After checkout redirect (devstub/stripe), refresh balances
    const url = new URL(window.location.href);
    const status = url.searchParams.get("status");
    const purchase = url.searchParams.get("purchase");
    if (!status && !purchase) return;
    url.searchParams.delete("status");
    url.searchParams.delete("purchase");
    window.history.replaceState({}, "", url.toString());
    refreshMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  function syncUrlFromReq(req: KrBattleSimRequest) {
    const url = new URL(window.location.href);
    url.searchParams.set("q", encodeJsonToUrlParam(req));
    url.searchParams.set("seed", req.seed.seed);
    url.searchParams.set("maxTicks", String(req.maxTicks));
    window.history.replaceState({}, "", url.toString());
  }

  /** Scroll to Result panel after a fresh simulation (product flow “screen 2”). */
  function focusResultSection() {
    requestAnimationFrame(() => {
      document.getElementById("kr-section-result")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  const runSim = useCallback(async () => {
    primeAudio();
    setState({ kind: "loading" });
    try {
      const req = catalogDefs.length
        ? buildBattleRequest({ seed, maxTicks, catalogDefs, playerSlots, enemyPreset })
        : (JSON.parse(requestText) as KrBattleSimRequest);
      setRequestText(JSON.stringify(req, null, 2));
      syncUrlFromReq(req);
      const res = await sdk.battleSim(req);
      setState({ kind: "ok", result: res, request: req });
      setTick(0);
      focusResultSection();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown error";
      setState({ kind: "err", message: msg });
    }
  }, [sdk, requestText, catalogDefs, playerSlots, enemyPreset, seed, maxTicks]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (!parseRunFlag(url)) return;
    if (autoRunConsumed.current) return;
    autoRunConsumed.current = true;
    stripDeepLinkParams(url, ["run"]);
    void runSim();
  }, [runSim]);

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
    await exportElementToPng(el, `kindrail-battle-${state.kind === "ok" ? state.request.seed.seed : seed}.png`);
  }

  async function useDailySeed() {
    try {
      const d = await sdk.dailySeed();
      setSeed(d.seed);
      const req = catalogDefs.length
        ? buildBattleRequest({ seed: d.seed, maxTicks, catalogDefs, playerSlots, enemyPreset })
        : makeRequest(d.seed, maxTicks);
      setRequestText(JSON.stringify(req, null, 2));
      // Run immediately for 1-click share
      setState({ kind: "loading" });
      syncUrlFromReq(req);
      const res = await sdk.battleSim(req);
      setState({ kind: "ok", result: res, request: req });
      setTick(0);
      focusResultSection();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown error";
      setState({ kind: "err", message: msg });
    }
  }

  async function claimDaily() {
    try {
      const res = await sdk.dailyClaim();
      setCurrency(res.inventory.currency);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown error";
      setState({ kind: "err", message: msg });
    }
  }

  const refreshMeta = useCallback(async () => {
    if (!getToken()) {
      setMetaProgress(null);
      setSeasonInfo(null);
      setCosmeticsState(null);
      setCosmeticCatalog([]);
      return;
    }
    try {
      const [inv, shop, ownedRes] = await Promise.all([sdk.inventory(), sdk.shopDaily(), sdk.ownedUnits()]);
      setCurrency(inv.inventory.currency);
      setShopOffers(shop.offers.map((o) => ({ offerId: o.offerId, archetype: o.archetype, priceGold: o.priceGold })));
      const m: Record<string, number> = {};
      for (const u of ownedRes.owned) m[u.archetype] = u.level;
      setOwned(m);
      try {
        setMetaProgress(await sdk.metaProgress());
      } catch {
        setMetaProgress(null);
      }
      try {
        setSeasonInfo(await sdk.seasonView());
      } catch {
        setSeasonInfo(null);
      }
      try {
        setCosmeticsState(await sdk.cosmeticsMe());
      } catch {
        setCosmeticsState(null);
      }
      try {
        setCosmeticCatalog((await sdk.cosmeticsCatalog()).cosmetics);
      } catch {
        setCosmeticCatalog([]);
      }
    } catch {
      // ignore
    }
  }, [sdk]);

  const applyIssuedSession = useCallback(
    async (issued: { userId: string; token: string; refreshToken: string }) => {
      setToken(issued.token);
      setRefreshToken(issued.refreshToken);
      sdk.setToken(issued.token);
      sdk.setRefreshToken(issued.refreshToken);
      setUserId(issued.userId);
      try {
        const me = await sdk.me();
        setAccountEmail(me.email ?? null);
      } catch {
        setAccountEmail(null);
      }
      await refreshMeta();
    },
    [sdk, refreshMeta]
  );

  async function signOutToGuest() {
    setAuthErr("");
    setAuthBusy(true);
    try {
      if (getToken()) {
        try {
          await sdk.authLogout();
        } catch {
          /* access expired or offline — still clear locally */
        }
      }
      setToken(null);
      setRefreshToken(null);
      sdk.setToken(null);
      sdk.setRefreshToken(null);
      const deviceId = getOrCreateDeviceId();
      const g = await sdk.authGuest({ v: 1, deviceId });
      await applyIssuedSession(g);
      setAuthPassword("");
    } catch (e) {
      setAuthErr(e instanceof Error ? e.message : "Sign-out failed");
    } finally {
      setAuthBusy(false);
    }
  }

  async function submitRegister() {
    setAuthErr("");
    setAuthBusy(true);
    try {
      const deviceId = getOrCreateDeviceId();
      const r = await sdk.authRegisterEmail({
        v: 1,
        email: authEmail.trim(),
        password: authPassword,
        deviceId
      });
      await applyIssuedSession(r);
      setAuthPassword("");
    } catch (e) {
      setAuthErr(e instanceof Error ? e.message : "Register failed");
    } finally {
      setAuthBusy(false);
    }
  }

  async function submitLogin() {
    setAuthErr("");
    setAuthBusy(true);
    try {
      const deviceId = getOrCreateDeviceId();
      const r = await sdk.authLoginEmail({
        v: 1,
        email: authEmail.trim(),
        password: authPassword,
        deviceId
      });
      await applyIssuedSession(r);
      setAuthPassword("");
    } catch (e) {
      setAuthErr(e instanceof Error ? e.message : "Login failed");
    } finally {
      setAuthBusy(false);
    }
  }

  async function submitLinkEmail() {
    setAuthErr("");
    setAuthBusy(true);
    try {
      const r = await sdk.authLinkEmail({
        v: 1,
        email: authEmail.trim(),
        password: authPassword
      });
      await applyIssuedSession(r);
      setAuthPassword("");
    } catch (e) {
      setAuthErr(e instanceof Error ? e.message : "Link failed");
    } finally {
      setAuthBusy(false);
    }
  }

  useEffect(() => {
    if (!googleClientId || gamePhase !== "play") return;
    let cancelled = false;

    void (async () => {
      try {
        await loadGoogleIdentityScript();
        await new Promise<void>((r) => requestAnimationFrame(() => r()));
        await new Promise<void>((r) => requestAnimationFrame(() => r()));
        if (cancelled) return;
        if (!window.google?.accounts?.id) return;
        const mount = googleSignInDivRef.current;
        if (!mount) return;
        mount.innerHTML = "";
        delete mount.dataset.krGsiDone;

        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (res) => {
            if (!res?.credential) return;
            try {
              setAuthBusy(true);
              setAuthErr("");
              const intent = sessionStorage.getItem(KR_GOOGLE_INTENT_KEY);
              sessionStorage.removeItem(KR_GOOGLE_INTENT_KEY);
              if (intent === "link") {
                const out = await sdk.authLinkGoogle({ v: 1, credential: res.credential });
                await applyIssuedSession(out);
              } else {
                const deviceId = getOrCreateDeviceId();
                const out = await sdk.authGoogle({ v: 1, credential: res.credential, deviceId });
                await applyIssuedSession(out);
              }
            } catch (e) {
              setAuthErr(e instanceof Error ? e.message : "Google sign-in failed");
            } finally {
              setAuthBusy(false);
            }
          }
        });

        mount.dataset.krGsiDone = "1";
        window.google.accounts.id.renderButton(mount, {
          theme: "outline",
          size: "large",
          text: "signin_with",
          width: 280
        });
      } catch {
        /* script blocked or offline */
      }
    })();

    return () => {
      cancelled = true;
      const mount = googleSignInDivRef.current;
      if (mount) {
        mount.innerHTML = "";
        delete mount.dataset.krGsiDone;
      }
    };
  }, [sdk, googleClientId, gamePhase, applyIssuedSession]);

  async function buy(offerId: string) {
    try {
      const res = await sdk.shopBuy({ v: 1, offerId });
      setCurrency({ gold: res.gold, shards: res.shards, keys: res.keys });
      setOwned(res.owned);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown error";
      setState({ kind: "err", message: msg });
    }
  }

  async function upgrade(archetype: string) {
    try {
      const res = await sdk.unitUpgrade({ v: 1, archetype });
      setCurrency({ gold: res.gold, shards: res.shards, keys: res.keys });
      setOwned((o) => ({ ...o, [archetype]: res.level }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown error";
      setState({ kind: "err", message: msg });
    }
  }

  async function refreshLeaderboard() {
    try {
      const d = await sdk.dailySeed();
      const [top, me] = await Promise.all([sdk.leaderboardDaily(d.dateUtc, 20), sdk.leaderboardMe(d.dateUtc)]);
      setLeaderboardTop(top.entries.map((e) => ({ userId: e.userId, score: e.score })));
      setLeaderboardMe({ rank: me.rank, total: me.total, score: me.entry?.score });
    } catch {
      // ignore
    }
  }

  async function submitDailyToLeaderboard() {
    try {
      const d = await sdk.dailySeed();
      setSeed(d.seed);
      const req = catalogDefs.length
        ? buildBattleRequest({ seed: d.seed, maxTicks, catalogDefs, playerSlots, enemyPreset })
        : makeRequest(d.seed, maxTicks);
      setRequestText(JSON.stringify(req, null, 2));
      const sim = await sdk.battleSim(req);
      setState({ kind: "ok", result: sim, request: req });
      setTick(0);
      focusResultSection();

      const submit = await sdk.leaderboardSubmit({ v: 1, dateUtc: d.dateUtc, battleRequest: req });
      setLeaderboardMe({ rank: submit.rank, total: submit.total, score: submit.entry.score });
      await refreshLeaderboard();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown error";
      setState({ kind: "err", message: msg });
    }
  }

  async function createShareTicketLink() {
    try {
      const t = await sdk.shareTicket();
      const url = new URL(window.location.href);
      url.searchParams.set("ticket", t.ticketId);
      const link = url.toString();
      setShareLink(link);
      await copyToClipboard(link);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown error";
      setState({ kind: "err", message: msg });
    }
  }

  async function buyOffer(offerId: string) {
    try {
      if (!accountEmail) {
        setState({
          kind: "err",
          message:
            "Link email/Google or register before checkout — real-money purchases must tie to a restorable account (guest IAP blocked)."
        });
        return;
      }
      const res = await sdk.checkoutCreate({ v: 1, offerId });
      window.location.href = res.url;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown error";
      setState({ kind: "err", message: msg });
    }
  }

  async function redeemTicketIfPresent() {
    const url = new URL(window.location.href);
    const ticket = url.searchParams.get("ticket");
    if (!ticket) return;
    if (!userId) return;
    try {
      await sdk.shareRedeem({ v: 1, ticketId: ticket });
      url.searchParams.delete("ticket");
      window.history.replaceState({}, "", url.toString());
      await refreshMeta();
    } catch {
      // ignore
    }
  }

  async function registerWebPush() {
    if (!userId) return;
    setPushBusy(true);
    setPushNote("");
    try {
      const v = await sdk.pushWebVapidPublic();
      if (!v.enabled || !v.publicKey) {
        setPushNote("Push is off until the gateway has KR_VAPID_PUBLIC_KEY + KR_VAPID_PRIVATE_KEY.");
        return;
      }
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setPushNote("Push not supported in this browser.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (existing) await existing.unsubscribe().catch(() => {});
      const key = urlBase64ToUint8Array(v.publicKey);
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key.buffer.slice(key.byteOffset, key.byteOffset + key.byteLength) as ArrayBuffer
      });
      const json = sub.toJSON() as {
        endpoint?: string;
        keys?: { p256dh?: string; auth?: string };
      };
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        setPushNote("Subscription payload incomplete.");
        return;
      }
      await sdk.pushWebSubscribe({
        v: 1,
        subscription: {
          endpoint: json.endpoint,
          keys: { p256dh: json.keys.p256dh, auth: json.keys.auth }
        }
      });
      setPushNote("Subscribed. Server can send daily reminders (admin/cron).");
    } catch (e) {
      setPushNote(e instanceof Error ? e.message : "Push failed.");
    } finally {
      setPushBusy(false);
    }
  }

  useEffect(() => {
    sdk
      .pushWebVapidPublic()
      .then((r) => {
        setPushNote((prev) => prev || (r.enabled ? "" : "Push: optional — configure VAPID keys on gateway to enable."));
      })
      .catch(() => {});
  }, [sdk]);

  useEffect(() => {
    redeemTicketIfPresent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const frames = useMemo(() => {
    if (state.kind !== "ok") return null;
    return buildReplayFrames(state.request, state.result);
  }, [state.kind, state.kind === "ok" ? state.request : null, state.kind === "ok" ? state.result : null]);

  const prevTickRef = useRef<number | null>(null);
  useEffect(() => {
    if (state.kind === "loading") prevTickRef.current = null;
  }, [state.kind]);

  useEffect(() => {
    if (state.kind !== "ok") {
      prevTickRef.current = null;
      return;
    }
    if (prevTickRef.current === tick) return;
    prevTickRef.current = tick;
    const fr = frames?.[tick];
    if (!fr) return;
    const died = fr.log.some((l) => l.includes(" died"));
    if (died) {
      sfxDeath();
      return;
    }
    if (fr.critIds?.length) {
      sfxCrit();
      return;
    }
    if (fr.uiEvents?.some((e) => e.kind === "ability")) {
      sfxAbility();
      return;
    }
    if (fr.flashIds?.length) sfxHit();
  }, [tick, frames, state]);

  useEffect(() => {
    if (state.kind !== "ok" || !autoReplay) return;
    const frameLen = frames?.length ?? 1;
    const span = Math.max(1, frameLen - 1);
    let msPerTick = TARGET_AUTOPLAY_MS / span / replaySpeed;
    msPerTick = Math.max(70, Math.min(780, msPerTick));
    let acc = 0;
    let last = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      acc += now - last;
      last = now;
      if (acc >= msPerTick) {
        const steps = Math.floor(acc / msPerTick);
        acc -= steps * msPerTick;
        setTick((t) => {
          const m = Math.max(0, frameLen - 1);
          return Math.min(m, t + steps);
        });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [state.kind, autoReplay, replaySpeed, frames?.length]);

  useEffect(() => {
    if (state.kind !== "ok") return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target;
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement
      ) {
        return;
      }
      const maxT = Math.max(0, (frames?.length ?? 1) - 1);
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setTick((x) => Math.max(0, x - 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setTick((x) => Math.min(maxT, x + 1));
      } else if (e.key === "Home") {
        e.preventDefault();
        setTick(0);
      } else if (e.key === "End") {
        e.preventDefault();
        setTick(maxT);
      } else if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        primeAudio();
        setAutoReplay((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.kind, frames?.length]);
  const maxTick = frames ? Math.max(0, frames.length - 1) : 0;
  const frame = frames ? frames[Math.max(0, Math.min(maxTick, tick))] : null;

  useEffect(() => {
    if (state.kind !== "ok") {
      outcomeFanfareBattleKeyRef.current = null;
      return;
    }
    const battleKey = `${state.request.seed.seed}:${state.result.ticks}:${state.result.outcome}`;
    if (tick < maxTick) return;
    if (outcomeFanfareBattleKeyRef.current === battleKey) return;
    outcomeFanfareBattleKeyRef.current = battleKey;
    if (state.result.outcome === "a") sfxWin();
    else if (state.result.outcome === "b") sfxLoss();
  }, [
    state.kind,
    tick,
    maxTick,
    state.kind === "ok" ? state.request.seed.seed : "",
    state.kind === "ok" ? state.result.ticks : 0,
    state.kind === "ok" ? state.result.outcome : ""
  ]);

  const defsByMap = useMemo(() => new Map(catalogDefs.map((d) => [d.id, d])), [catalogDefs]);

  const arenaReq = useMemo((): KrBattleSimRequest | null => {
    try {
      const q = JSON.parse(requestText) as KrBattleSimRequest;
      if (!q?.a?.units?.length || !q?.b?.units?.length) return null;
      return q;
    } catch {
      return null;
    }
  }, [requestText]);

  function renderFormation(req: KrBattleSimRequest) {
    const aSlots = Array.from({ length: 12 }, () => null as null | { id: string; archetype: string });
    const bSlots = Array.from({ length: 12 }, () => null as null | { id: string; archetype: string });
    for (const u of req.a.units) aSlots[u.slot ?? 0] = { id: u.id, archetype: u.archetype };
    for (const u of req.b.units) bSlots[u.slot ?? 0] = { id: u.id, archetype: u.archetype };

    const Slot = ({ v }: { v: null | { id: string; archetype: string } }) => (
      <div className="slot">
        {v ? (
          <>
            <div className="id">{v.id}</div>
            <div className="meta">{v.archetype}</div>
          </>
        ) : (
          <div className="meta">—</div>
        )}
      </div>
    );

    return (
      <div className="row" style={{ marginTop: 10 }}>
        <div className="field">
          <label>Formation A (slots 0–5 front, 6–11 back)</label>
          <div className="miniGrid">
            {aSlots.slice(0, 6).map((v, i) => (
              <Slot key={`aF${i}`} v={v} />
            ))}
            {aSlots.slice(6, 12).map((v, i) => (
              <Slot key={`aB${i}`} v={v} />
            ))}
          </div>
        </div>
        <div className="field">
          <label>Formation B</label>
          <div className="miniGrid">
            {bSlots.slice(0, 6).map((v, i) => (
              <Slot key={`bF${i}`} v={v} />
            ))}
            {bSlots.slice(6, 12).map((v, i) => (
              <Slot key={`bB${i}`} v={v} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (gamePhase === "gate") {
    return (
      <div className="wrapGate">
        <div className="wrapGateCenter">
          <HomeGate
            gatewayOk={gatewayOk}
            gatewayInfo={gatewayInfo}
            runtimeEnvLabel={runtimeEnvLabel}
            onEnterBattle={() => {
              persistShellPhase("play");
              setGamePhase("play");
            }}
          />
        </div>
        <LegalFooter legal={legalPublic} />
      </div>
    );
  }

  return (
    <div className="wrap">
      <div className="top">
        <div className="brand">
          <h1>KINDRAIL</h1>
          <div className="sub">
            Phase 11 • legal/links gate • squad • replay • daily loop
          </div>
        </div>
        <div className="row">
          <button
            type="button"
            className="btn btnGhost"
            onClick={() => {
              persistShellPhase("gate");
              setGamePhase("gate");
            }}
          >
            Home
          </button>
          <div className="pill">
            <strong className={gatewayOk ? "ok" : gatewayOk === false ? "bad" : ""}>
              {gatewayOk === null ? "…" : gatewayOk ? "OK" : "DOWN"}
            </strong>
            <span>{gatewayInfo}</span>
          </div>
          <button
            type="button"
            className="btn btnGhost"
            title="Retry gateway health check"
            disabled={gatewayOk === null}
            onClick={() => setGatewayProbe((n) => n + 1)}
          >
            Reconnect
          </button>
          <label className="inlineLab sfxToggleLab">
            <input
              type="checkbox"
              checked={sfxEnabled}
              onChange={(e) => {
                const on = e.target.checked;
                setSfxEnabled(on);
                setSfxMuted(!on);
                if (on) primeAudio();
              }}
            />
            Sound
          </label>
          <div className="pill">
            <strong>USER</strong>
            <span className="mono">{userId ? userId : "—"}</span>
            {accountEmail ? (
              <span className="mono" style={{ opacity: 0.88 }}>
                {" "}
                · {accountEmail}
              </span>
            ) : userId ? (
              <span style={{ opacity: 0.65 }}> · guest</span>
            ) : null}
          </div>
          <div className="pill">
            <strong>G</strong>
            <span className="mono">{currency ? currency.gold : "—"}</span>
            <strong>S</strong>
            <span className="mono">{currency ? currency.shards : "—"}</span>
            <strong>K</strong>
            <span className="mono">{currency ? currency.keys : "—"}</span>
          </div>
          <button className="btn" onClick={claimDaily} disabled={!userId}>
            Claim daily
          </button>
          <button className="btn" onClick={() => void refreshMeta()} disabled={!getToken()}>
            Refresh
          </button>
          <details style={{ alignSelf: "center" }}>
            <summary className="btn btnGhost" style={{ cursor: "pointer", listStyle: "none" }}>
              Account
            </summary>
            <div className="card" style={{ marginTop: 8, padding: 12, minWidth: 280, maxWidth: 360, boxSizing: "border-box" }}>
              <div className="field">
                <label htmlFor="kr-auth-email">Email</label>
                <input
                  id="kr-auth-email"
                  type="email"
                  autoComplete="username"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  disabled={authBusy}
                />
              </div>
              <div className="field">
                <label htmlFor="kr-auth-password">Password</label>
                <input
                  id="kr-auth-password"
                  type="password"
                  autoComplete="current-password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  disabled={authBusy}
                />
              </div>
              {authErr ? (
                <div className="sub" style={{ color: "var(--danger, #c53)", marginBottom: 8 }}>
                  {authErr}
                </div>
              ) : null}
              {googleClientId ? (
                <>
                  <div className="sub" style={{ marginBottom: 8 }}>
                    Sign in with Google (set <span className="mono">KR_GOOGLE_CLIENT_ID</span> on gateway with the same
                    Web Client ID).
                  </div>
                  <div ref={googleSignInDivRef} style={{ minHeight: 42 }} />
                  {accountEmail === null && userId ? (
                    <button
                      type="button"
                      className="btn btnGhost"
                      disabled={authBusy}
                      style={{ marginTop: 8 }}
                      onClick={() => {
                        try {
                          sessionStorage.setItem(KR_GOOGLE_INTENT_KEY, "link");
                          window.google?.accounts.id.prompt();
                        } catch {
                          setAuthErr("Google One Tap unavailable in this browser.");
                        }
                      }}
                    >
                      Link Google to this guest (One Tap)
                    </button>
                  ) : null}
                </>
              ) : (
                <div className="sub" style={{ marginBottom: 8 }}>
                  Optional: add <span className="mono">VITE_GOOGLE_CLIENT_ID</span> for Google Sign-In on web.
                </div>
              )}
              <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
                <button type="button" className="btn primary" disabled={authBusy} onClick={() => void submitLogin()}>
                  Log in
                </button>
                <button type="button" className="btn" disabled={authBusy} onClick={() => void submitRegister()}>
                  New account
                </button>
                {accountEmail === null && userId ? (
                  <button type="button" className="btn" disabled={authBusy} onClick={() => void submitLinkEmail()}>
                    Link guest → email
                  </button>
                ) : null}
                <button type="button" className="btn btnGhost" disabled={authBusy} onClick={() => void signOutToGuest()}>
                  Sign out
                </button>
              </div>
              <div className="sub" style={{ marginTop: 10 }}>
                New account starts a fresh profile. Link keeps this session&apos;s inventory on your email.
              </div>
            </div>
          </details>
        </div>
      </div>

      <div className="battleShell">
        <div className="matchFlowRail" role="navigation" aria-label="Match steps">
          <div className={`matchFlowStep ${state.kind === "idle" || state.kind === "err" ? "active" : ""}`}>
            1 · Prepare
          </div>
          <span className="matchFlowArrow" aria-hidden>
            →
          </span>
          <div className={`matchFlowStep ${state.kind === "loading" ? "active" : ""}`}>2 · Fight</div>
          <span className="matchFlowArrow" aria-hidden>
            →
          </span>
          <div className={`matchFlowStep ${state.kind === "ok" ? "active" : ""}`}>3 · Result</div>
        </div>

        {arenaReq ? (
          <div className="card arenaStage" id="kr-section-arena">
            <h2>Arena</h2>
            <div className="sub arenaStageHint">
              {state.kind === "ok"
                ? "Replay matches the scrubber and HP bars — same tick."
                : "Formation preview — run a battle to animate combat on the arena."}
            </div>
            <div className="arenaCanvasWrap">
              <ArenaCanvas
                req={state.kind === "ok" ? state.request : arenaReq}
                frame={state.kind === "ok" ? frame : null}
                defsById={defsByMap}
                outcome={state.kind === "ok" ? state.result.outcome : undefined}
                width={680}
              />
            </div>
          </div>
        ) : null}

        <div className="grid">
          <div className="card" id="kr-section-battle">
            <h2>Battle</h2>
            <div className="sub" style={{ marginBottom: 10 }}>
              Pick four slots, choose an opponent preset, then <strong>Run battle</strong> or{" "}
              <strong>Daily battle</strong>.
            </div>

            {arenaReq ? (
              <div className="matchPrepBanner">
                <div className="side">
                  <div className="lab">Your squad (A)</div>
                  <div className="line">{squadDisplayLine(arenaReq.a.units, defsByMap)}</div>
                </div>
                <div className="vs">VS</div>
                <div className="side">
                  <div className="lab">{enemyPreset === "mirror" ? "Mirror (B)" : "Opponent (B)"}</div>
                  <div className="line">{squadDisplayLine(arenaReq.b.units, defsByMap)}</div>
                </div>
              </div>
            ) : null}

          <div className="row">
            <div className="field">
              <label>seed</label>
              <input value={seed} onChange={(e) => setSeed(e.target.value)} />
            </div>
            <div className="field">
              <label>maxTicks</label>
              <input
                value={String(maxTicks)}
                onChange={(e) => {
                  const n = Math.max(1, Math.min(100_000, Math.floor(Number(e.target.value) || 12000)));
                  setMaxTicks(n);
                }}
              />
            </div>
          </div>

          <div className="deckPanel">
            <div className="deckTitle">Your squad</div>
            <div className="squadRow">
              {(["Front L", "Front R", "Back L", "Back R"] as const).map((label, i) => (
                <div className="squadSlot" key={label}>
                  <div className="slotLabel">{label}</div>
                  <select
                    className="select"
                    value={playerSlots[i] ?? ""}
                    onChange={(e) => {
                      const v = e.target.value || null;
                      const next = [...playerSlots];
                      next[i] = v;
                      setPlayerSlots(next);
                    }}
                  >
                    <option value="">— empty —</option>
                    {catalogDefs.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <div className="row" style={{ marginTop: 12, alignItems: "center" }}>
              <div className="field" style={{ minWidth: 200 }}>
                <label>Enemy</label>
                <select
                  className="select"
                  value={enemyPreset}
                  onChange={(e) => setEnemyPreset(e.target.value as EnemyPreset)}
                >
                  <option value="demo">Demo team (RIFT)</option>
                  <option value="mirror">Mirror your squad</option>
                </select>
              </div>
              <button type="button" className="btn" onClick={() => setShowAdvancedJson((v) => !v)}>
                {showAdvancedJson ? "Hide" : "Show"} advanced JSON
              </button>
            </div>
          </div>

          {showAdvancedJson ? (
            <div className="field" style={{ marginTop: 10 }}>
              <label>SSOT JSON (power users)</label>
              <textarea value={requestText} onChange={(e) => setRequestText(e.target.value)} />
            </div>
          ) : null}

          {(() => {
            try {
              const req = JSON.parse(requestText) as KrBattleSimRequest;
              return renderFormation(req);
            } catch {
              return null;
            }
          })()}

          <div className="btnbar">
            <button className="btn primary" onClick={runSim} disabled={state.kind === "loading"}>
              {state.kind === "loading" ? "Running…" : "Run battle"}
            </button>
            <button className="btn" onClick={useDailySeed} disabled={state.kind === "loading"}>
              Daily battle
            </button>
            <button
              className="btn"
              onClick={() => {
                const s = nowSeed();
                setSeed(s);
                if (catalogDefs.length) {
                  const req = buildBattleRequest({ seed: s, maxTicks, catalogDefs, playerSlots, enemyPreset });
                  setRequestText(JSON.stringify(req, null, 2));
                } else {
                  setRequestText(JSON.stringify(makeRequest(s, maxTicks), null, 2));
                }
              }}
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

        <div className="card" id="kr-section-result">
          <h2>Result</h2>

          {state.kind === "idle" && <div className="log">Run a battle to see output.</div>}
          {state.kind === "loading" && <div className="log">Simulating…</div>}
          {state.kind === "err" && <div className="log bad">{state.message}</div>}
          {state.kind === "ok" && (
            <>
              <div
                className={`outcomeHero ${
                  state.result.outcome === "a" ? "win" : state.result.outcome === "b" ? "loss" : "draw"
                }`}
              >
                <div className="outcomeHeroTitle">
                  {state.result.outcome === "a"
                    ? "Victory"
                    : state.result.outcome === "b"
                      ? "Defeat"
                      : "Draw"}
                </div>
                <div className="outcomeHeroSub">You play side A · Opponent is side B</div>
              </div>
              <div className="pill" style={{ marginBottom: 10 }}>
                <strong className={state.result.outcome === "a" ? "ok" : state.result.outcome === "b" ? "bad" : ""}>
                  {state.result.outcome.toUpperCase()}
                </strong>
                <span className="mono">ticks={state.result.ticks}</span>
              </div>
              <div id="kr-share-card" className="shareCard">
                <div className="shareCardTitle">
                  <div className="k">KINDRAIL</div>
                  <div className="meta mono">{state.kind === "ok" ? state.request.seed.seed : seed}</div>
                </div>
                <div className="log">{summarize(state.result)}</div>
                <div className="log" style={{ marginTop: 8, color: "rgba(255,255,255,0.72)" }}>
                  {window.location.href}
                </div>
              </div>

              <div className="unitHpGrid">
                {[...state.request.a.units, ...state.request.b.units].map((u) => {
                  const curHp = frame?.hp[u.id] ?? u.hp;
                  const mx = frame?.maxHp[u.id] ?? u.hp;
                  const pct = mx > 0 ? Math.min(100, Math.round((curHp / mx) * 100)) : 0;
                  const dead = frame ? frame.alive[u.id] === false : false;
                  const flash = frame?.flashIds.includes(u.id) ?? false;
                  const critFlash = frame?.critIds?.includes(u.id) ?? false;
                  const side = state.request.a.units.some((x) => x.id === u.id) ? "A" : "B";
                  return (
                    <div
                      key={u.id}
                      className={`unitHp ${dead ? "dead" : ""} ${flash ? "flash" : ""} ${critFlash ? "crit" : ""}`}
                    >
                      <div className="unitHpTitle">
                        <span className="mono">{side}</span> {u.id} · {u.archetype}
                      </div>
                      <div className="hpBar">
                        <div style={{ width: `${pct}%` }} />
                      </div>
                      <div className="mono hpNums">
                        {curHp}/{mx}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="timeline">
                <div className="pill">
                  <strong>Replay</strong>
                  <span className="mono">
                    tick {tick}/{maxTick}
                  </span>
                </div>
                <div className="row" style={{ marginTop: 8, alignItems: "center" }}>
                  <label className="inlineLab">
                    <input
                      type="checkbox"
                      checked={autoReplay}
                      onChange={(e) => {
                        primeAudio();
                        setAutoReplay(e.target.checked);
                      }}
                    />{" "}
                    Auto-play
                  </label>
                  <div className="field" style={{ minWidth: 140, flex: "0 0 auto" }}>
                    <label>Speed</label>
                    <select
                      className="select"
                      value={replaySpeed}
                      onChange={(e) => setReplaySpeed(Number(e.target.value) as 1 | 2 | 4)}
                    >
                      <option value={1}>1×</option>
                      <option value={2}>2×</option>
                      <option value={4}>4×</option>
                    </select>
                  </div>
                </div>
                <div className="sub" style={{ marginTop: 6, opacity: 0.85 }}>
                  Full Auto-play at 1× is paced toward a ~5–7 minute watch — uncheck to scrub manually from tick 0.
                </div>
                <input
                  type="range"
                  min={0}
                  max={maxTick}
                  value={Math.max(0, Math.min(maxTick, tick))}
                  aria-valuetext={`Tick ${Math.max(0, Math.min(maxTick, tick))} of ${maxTick}`}
                  onChange={(e) => {
                    primeAudio();
                    setTick(Math.floor(Number(e.target.value) || 0));
                  }}
                />
                <div className="sub" style={{ marginTop: 8, opacity: 0.78 }}>
                  HP bars follow the scrubber; each run starts at <strong>tick 0</strong>. Scrub right or enable{" "}
                  <strong>Auto-play</strong> to watch the fight — scrub left anytime to re-watch from the start.
                </div>
                <div className="replayHintKbd">
                  Keyboard: <kbd>←</kbd> <kbd>→</kbd> scrub · <kbd>Home</kbd> <kbd>End</kbd> jump · <kbd>Space</kbd>{" "}
                  toggle auto-play
                </div>
                <div className="log">
                  {(frame?.log ?? ["(no events)"]).join("\n")}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      </div>

      <div className="grid" style={{ marginTop: 14 }}>
        <div className="card" id="kr-section-meta">
          <h2>Season & meta (R3)</h2>
          {seasonInfo ? (
            <div className="sub" style={{ marginBottom: 8 }}>
              <strong>{seasonInfo.season.title}</strong> · {seasonInfo.season.seasonId} · ends{" "}
              {seasonInfo.season.endsAtUtc.slice(0, 10)}
            </div>
          ) : (
            <div className="log">Season info unavailable.</div>
          )}
          {metaProgress ? (
            <>
              <div className="sub">
                Streak {metaProgress.streak.current} (best {metaProgress.streak.best}) · BP XP {metaProgress.battlePass.xp}
                {metaProgress.battlePass.hasPremium ? " · Premium unlocked" : ""}
              </div>
              <h3 style={{ marginTop: 10, fontSize: "1rem" }}>Quests</h3>
              <div className="row">
                {metaProgress.quests.map((q) => (
                  <div key={q.id} className="pill">
                    <strong>{q.title}</strong>
                    <span className="mono">
                      {q.progress}/{q.target}
                    </span>
                    <button
                      className="btn"
                      disabled={!userId || !q.complete || q.claimed}
                      onClick={async () => {
                        try {
                          await sdk.metaQuestClaim({ v: 1, questId: q.id });
                          await refreshMeta();
                        } catch (e) {
                          setState({ kind: "err", message: e instanceof Error ? e.message : "quest claim failed" });
                        }
                      }}
                    >
                      {q.claimed ? "Claimed" : q.complete ? "Claim" : "—"}
                    </button>
                  </div>
                ))}
              </div>
              <h3 style={{ marginTop: 10, fontSize: "1rem" }}>Battle Pass tiers</h3>
              <div className="row" style={{ flexWrap: "wrap" }}>
                {metaProgress.battlePass.tiers.map((t) => (
                  <div key={t.tier} className="pill">
                    <strong>T{t.tier}</strong>
                    <span className="mono">{t.xpCumulative} XP</span>
                    <button
                      className="btn"
                      disabled={
                        !userId ||
                        metaProgress.battlePass.xp < t.xpCumulative ||
                        metaProgress.battlePass.claimedFreeTiers.includes(t.tier)
                      }
                      onClick={async () => {
                        try {
                          await sdk.metaBattlePassClaim({ v: 1, tier: t.tier, track: "free" });
                          await refreshMeta();
                        } catch (e) {
                          setState({ kind: "err", message: e instanceof Error ? e.message : "bp claim failed" });
                        }
                      }}
                    >
                      {metaProgress.battlePass.claimedFreeTiers.includes(t.tier) ? "Free ✓" : "Claim free"}
                    </button>
                    {t.premiumReward ? (
                      <button
                        className="btn"
                        disabled={
                          !userId ||
                          !metaProgress.battlePass.hasPremium ||
                          metaProgress.battlePass.xp < t.xpCumulative ||
                          metaProgress.battlePass.claimedPremiumTiers.includes(t.tier)
                        }
                        onClick={async () => {
                          try {
                            await sdk.metaBattlePassClaim({ v: 1, tier: t.tier, track: "premium" });
                            await refreshMeta();
                          } catch (e) {
                            setState({
                              kind: "err",
                              message: e instanceof Error ? e.message : "bp premium claim failed"
                            });
                          }
                        }}
                      >
                        {metaProgress.battlePass.claimedPremiumTiers.includes(t.tier) ? "Prem ✓" : "Claim premium"}
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
              {metaProgress &&
              !metaProgress.battlePass.hasPremium &&
              accountEmail &&
              isNativeStorePurchasesAvailable() ? (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,.12)" }}>
                  <h3 style={{ marginTop: 0, fontSize: "1rem" }}>Premium Battle Pass (App Store / Play)</h3>
                  <div className="sub" style={{ marginBottom: 10 }}>
                    Unlocks the premium reward track for this season. Your purchase is verified on KINDRAIL servers; use an
                    account linked to email or Google (not guest-only).
                  </div>
                  {nativeBpProduct ? (
                    <div className="sub" style={{ marginBottom: 10 }}>
                      <strong>{nativeBpProduct.title}</strong>{" "}
                      <span className="mono" style={{ marginLeft: 8 }}>
                        {nativeBpProduct.priceString}
                      </span>
                    </div>
                  ) : (
                    <div className="sub" style={{ marginBottom: 10, opacity: 0.85 }}>
                      Loading store listing… If this stays empty, confirm the product exists in App Store Connect / Play
                      Console and matches <span className="mono">VITE_IAP_BP_PRODUCT_*</span>.
                    </div>
                  )}
                  <button
                    type="button"
                    className="btn primary"
                    disabled={!userId || iapBusy}
                    onClick={async () => {
                      const sku = battlePassSkuForNativePlatform();
                      if (!sku) return;
                      setIapBusy(true);
                      try {
                        const { receipt, platform } = await purchaseBattlePassOnDevice({
                          productId: sku,
                          userId
                        });
                        await sdk.iapBattlePassVerify({
                          v: 1,
                          platform,
                          productId: sku,
                          receipt
                        });
                        await refreshMeta();
                      } catch (e) {
                        setState({
                          kind: "err",
                          message: e instanceof Error ? e.message : "native IAP verify failed"
                        });
                      } finally {
                        setIapBusy(false);
                      }
                    }}
                  >
                    {iapBusy ? "Working…" : "Purchase on device"}
                  </button>
                </div>
              ) : null}
              {import.meta.env.DEV && metaProgress ? (
                <div
                  className="sub"
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: "1px solid rgba(255,255,255,.1)"
                  }}
                >
                  <strong>IAP → Premium BP (QA)</strong>
                  <div style={{ marginTop: 8 }}>
                    Gateway: set SKUs to match fields below; dev stub uses receipt{" "}
                    <span className="mono">STUB_PREMIUM</span> +{" "}
                    <span className="mono">KR_IAP_ALLOW_STUB=true</span>.
                  </div>
                  <div className="row" style={{ marginTop: 8, alignItems: "flex-end" }}>
                    <div className="field" style={{ minWidth: 120 }}>
                      <label>Platform</label>
                      <select
                        className="select"
                        title="IAP platform"
                        value={iapPlatform}
                        onChange={(e) => setIapPlatform(e.target.value as "ios" | "android")}
                      >
                        <option value="ios">iOS</option>
                        <option value="android">Android</option>
                      </select>
                    </div>
                    <div className="field" style={{ flex: 1, minWidth: 180 }}>
                      <label>Product ID</label>
                      <input
                        title="Store product SKU"
                        value={iapProductId}
                        onChange={(e) => setIapProductId(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="field" style={{ marginTop: 8 }}>
                    <label>Receipt / purchase token</label>
                    <textarea
                      title="Base64 receipt or Play purchase token"
                      rows={3}
                      value={iapReceipt}
                      onChange={(e) => setIapReceipt(e.target.value)}
                      style={{ width: "100%", resize: "vertical" }}
                    />
                  </div>
                  <button
                    className="btn primary"
                    style={{ marginTop: 8 }}
                    disabled={!userId || !accountEmail || iapBusy || !iapProductId.trim()}
                    onClick={async () => {
                      setIapBusy(true);
                      try {
                        await sdk.iapBattlePassVerify({
                          v: 1,
                          platform: iapPlatform,
                          productId: iapProductId.trim(),
                          receipt: iapReceipt.trim()
                        });
                        await refreshMeta();
                      } catch (e) {
                        setState({ kind: "err", message: e instanceof Error ? e.message : "iap verify failed" });
                      } finally {
                        setIapBusy(false);
                      }
                    }}
                  >
                    {iapBusy ? "Verifying…" : "Verify & unlock premium"}
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="log">Meta progress loads after sign-in.</div>
          )}
        </div>

        <div className="card" id="kr-section-cosmetics">
          <h2>Cosmetics</h2>
          {cosmeticsState ? (
            <>
              <div className="sub">
                Owned: {cosmeticsState.owned.length ? cosmeticsState.owned.join(", ") : "none"}
              </div>
              <div className="sub" style={{ marginTop: 6 }}>
                Equipped:{" "}
                {Object.keys(cosmeticsState.equipped).length > 0
                  ? Object.entries(cosmeticsState.equipped)
                      .map(([s, id]) => `${s}=${id}`)
                      .join(", ")
                  : "defaults"}
              </div>
              <div className="row" style={{ marginTop: 10 }}>
                {(["frame", "arena", "title"] as const).map((slot) => (
                  <div key={slot} className="field" style={{ minWidth: 160 }}>
                    <label>{slot}</label>
                    <select
                      className="select"
                      title={`Equipped ${slot}`}
                      value={cosmeticsState.equipped[slot] ?? ""}
                      onChange={async (e) => {
                        const v = e.target.value;
                        if (!v || !userId) return;
                        try {
                          await sdk.cosmeticsEquip({ v: 1, slot, cosmeticId: v });
                          await refreshMeta();
                        } catch (err) {
                          setState({
                            kind: "err",
                            message: err instanceof Error ? err.message : "equip failed"
                          });
                        }
                      }}
                    >
                      <option value="">—</option>
                      {cosmeticCatalog
                        .filter((c) => c.slot === slot && cosmeticsState.owned.includes(c.id))
                        .map((c) => (
                          <option key={`${slot}-${c.id}`} value={c.id}>
                            {c.title}
                          </option>
                        ))}
                    </select>
                  </div>
                ))}
              </div>
              <div className="sub" style={{ marginTop: 8 }}>
                Cosmetics unlock from Battle Pass tiers (server-granted).
              </div>
            </>
          ) : (
            <div className="log">Sign in to load cosmetics.</div>
          )}
        </div>
      </div>

      <div className="grid" style={{ marginTop: 14 }}>
        <div className="card" id="kr-section-shop">
          <h2>Shop (daily)</h2>
          <div className="row">
            {shopOffers.map((o) => (
              <div key={o.offerId} className="pill">
                <strong>{catalogNameById[o.archetype] ?? o.archetype}</strong>
                <span className="mono">{o.priceGold}G</span>
                <button className="btn" onClick={() => buy(o.offerId)} disabled={!userId}>
                  Buy
                </button>
              </div>
            ))}
          </div>
          <div className="sub" style={{ marginTop: 10 }}>
            Buy unlocks a unit at level 1 (v0).
          </div>
        </div>

        <div className="card" id="kr-section-collection">
          <h2>Collection</h2>
          {Object.keys(owned).length === 0 ? (
            <div className="log">No units yet. Buy from shop.</div>
          ) : (
            <div className="row">
              {Object.entries(owned)
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([arch, lvl]) => (
                  <div key={arch} className="pill">
                    <strong>{catalogNameById[arch] ?? arch}</strong>
                    <span className="mono">Lv {lvl}</span>
                    <button className="btn" onClick={() => upgrade(arch)} disabled={!userId}>
                      Upgrade
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid" style={{ marginTop: 14 }}>
        <div className="card" id="kr-section-monetization">
          <h2>Monetization (MVP)</h2>
          {offers.length === 0 ? (
            <div className="log">Loading offers…</div>
          ) : (
            <div className="row">
              {offers.map((o) => (
                <div key={o.offerId} className="pill">
                  <strong>{o.name}</strong>
                  <span className="mono">
                    {(o.priceCents / 100).toFixed(2)} {o.currency}
                  </span>
                  <button
                    className="btn primary"
                    onClick={() => buyOffer(o.offerId)}
                    disabled={!userId || !accountEmail}
                  >
                    Buy
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="sub" style={{ marginTop: 10 }}>
            Checkout requires a linked identity (email or Google). Guests cannot open Stripe/IAP-style flows until they sign
            in — aligns purchase restore across devices. Dev note: without `STRIPE_SECRET_KEY`, purchases are fulfilled
            instantly (devstub).
          </div>
        </div>
        <div className="card">
          <h2>Purchase status</h2>
          <div className="btnbar">
            <button
              className="btn"
              onClick={async () => {
                try {
                  await sdk.purchaseStatus();
                  await refreshMeta();
                } catch {
                  // ignore
                }
              }}
              disabled={!userId}
            >
              Refresh purchase status
            </button>
          </div>
          <div className="log">Balances update immediately on success.</div>
        </div>
      </div>

      <div className="grid" style={{ marginTop: 14 }}>
        <div className="card" id="kr-section-leaderboard">
          <h2>Daily leaderboard</h2>
          <div className="btnbar">
            <button className="btn" onClick={refreshLeaderboard} disabled={!userId}>
              Refresh leaderboard
            </button>
            <button className="btn primary" onClick={submitDailyToLeaderboard} disabled={!userId}>
              Play daily + submit
            </button>
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <div className="pill">
              <strong>ME</strong>
              <span className="mono">
                {leaderboardMe ? `#${leaderboardMe.rank ?? "—"} / ${leaderboardMe.total}` : "—"}
              </span>
              <span className="mono">{leaderboardMe?.score ?? "—"}</span>
            </div>
          </div>
          <div className="log" style={{ marginTop: 10 }}>
            {leaderboardTop.length === 0
              ? "No entries yet."
              : leaderboardTop
                  .map((e, i) => `${String(i + 1).padStart(2, "0")}  ${e.userId}  score=${e.score}`)
                  .join("\n")}
          </div>
        </div>

        <div className="card" id="kr-section-share">
          <h2>Share rewards</h2>
          <div className="btnbar">
            <button className="btn" onClick={createShareTicketLink} disabled={!userId}>
              Create share ticket (copy link)
            </button>
          </div>
          {shareLink ? <div className="log" style={{ marginTop: 10 }}>{shareLink}</div> : <div className="log">—</div>}
          <div className="sub" style={{ marginTop: 10 }}>
            Tip: send the copied link to a friend. When they open it, they get a small reward and you get a small reward.
          </div>
        </div>
      </div>

      <div className="grid" style={{ marginTop: 14 }}>
        <div className="card" id="kr-section-push">
          <h2>Push (daily reminder)</h2>
          <div className="sub" style={{ marginBottom: 10 }}>
            Web Push MVP: subscribe stores an endpoint on the gateway. Operators:{" "}
            <span className="mono">POST /admin/push/test</span> + <span className="mono">x-kr-admin-token</span>, or
            scheduled <span className="mono">POST /internal/push/daily</span> +{" "}
            <span className="mono">x-kr-internal-cron-secret</span> (<span className="mono">KR_INTERNAL_CRON_SECRET</span>
            ).
          </div>
          <div className="btnbar">
            <button className="btn primary" onClick={() => void registerWebPush()} disabled={!userId || pushBusy}>
              {pushBusy ? "Working…" : "Enable push on this device"}
            </button>
          </div>
          {pushNote ? <div className="log" style={{ marginTop: 10 }}>{pushNote}</div> : null}
        </div>
      </div>

      <div style={{ marginTop: 14 }} className="pill">
        <span className="mono">
          Tip: this page URL encodes the request. Share it and anyone can replay the same deterministic battle.
        </span>
      </div>

      <LegalFooter legal={legalPublic} />

      {onboardingOpen ? (
        <div className="onbOverlay" role="dialog" aria-modal="true">
          <div className="onbCard">
            <h2 className="onbH">Welcome to KINDRAIL</h2>
            <ol className="onbList">
              <li>
                <strong>Build</strong> your squad (4 slots).
              </li>
              <li>
                Press <strong>Daily battle</strong> (needs gateway <span className="mono">OK</span>) or{" "}
                <strong>Run battle</strong>.
              </li>
              <li>
                Replay opens at the <strong>first tick</strong> — scrub the timeline or turn on <strong>Auto-play</strong>{" "}
                to watch hits; HP bars follow the scrubber.
              </li>
            </ol>
            <div className="btnbar" style={{ marginTop: 12 }}>
              <button
                type="button"
                className="btn primary"
                onClick={() => {
                  primeAudio();
                  setOnboardingDone();
                  setOnboardingOpen(false);
                }}
              >
                Start
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

