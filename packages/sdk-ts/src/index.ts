import {
  HealthResponse,
  KrAuthGuestRequest,
  KrAuthGuestResponse,
  KrAuthRefreshRequest,
  KrAuthRefreshResponse,
  KrAuthLogoutRequest,
  KrAuthLogoutResponse,
  KrAuthRegisterEmailRequest,
  KrAuthRegisterEmailResponse,
  KrAuthLoginEmailRequest,
  KrAuthLoginEmailResponse,
  KrAuthLinkEmailRequest,
  KrAuthLinkEmailResponse,
  KrAuthGoogleRequest,
  KrAuthGoogleResponse,
  KrAuthLinkGoogleRequest,
  KrAuthLinkGoogleResponse,
  KrAuthSessionIssued,
  KrBattleSimRequest,
  KrBattleSimResult,
  KrCatalogResponse,
  KrDailyClaimResponse,
  KrDailySeedResponse,
  KrDailyShopResponse,
  KrInventoryResponse,
  KrMeResponse,
  KrOwnedUnitsResponse,
  KrShopBuyRequest,
  KrShopBuyResponse,
  KrUpgradeUnitRequest,
  KrUpgradeUnitResponse,
  KrLeaderboardMeResponse,
  KrLeaderboardSubmitRequest,
  KrLeaderboardSubmitResponse,
  KrLeaderboardTopResponse,
  KrReferralAcceptRequest,
  KrReferralAcceptResponse,
  KrReferralStatusResponse,
  KrShareRedeemRequest,
  KrShareRedeemResponse,
  KrShareTicketCreateResponse,
  KrCheckoutCreateRequest,
  KrCheckoutCreateResponse,
  KrOffersResponse,
  KrPurchaseStatusResponse,
  KrBattlePassIapVerifyRequest,
  KrBattlePassIapVerifyResponseOk,
  KrPushWebSubscribeRequest,
  KrPushWebSubscribeResponse,
  KrPushWebUnsubscribeRequest,
  KrPushWebUnsubscribeResponse,
  KrPushWebVapidResponse,
  KrInternalPushDailyRequest,
  KrInternalPushDailyResponse,
  KrMetaProgressResponse,
  KrMetaQuestClaimRequest,
  KrMetaQuestClaimResponse,
  KrMetaBattlePassClaimRequest,
  KrMetaBattlePassClaimResponse,
  KrSeasonViewResponse,
  KrCosmeticsCatalogResponse,
  KrCosmeticsMeResponse,
  KrCosmeticsEquipRequest,
  KrCosmeticsEquipResponse,
  KrLegalPublicResponse,
  KrAnalyticsEventRequest,
  KrAnalyticsEventResponse
} from "@kindrail/protocol";

export type KindrailSdkOptions = {
  baseUrl: string;
  fetchImpl?: typeof fetch;
};

export type KindrailInternalCronOptions = {
  /** Same value as gateway env KR_INTERNAL_CRON_SECRET */
  cronSecret: string;
};

/**
 * Safari/WebKit throws if `fetch` is detached from Window (`fetch(...)` after assigning `const f = fetch`).
 */
function defaultFetch(input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]): Promise<Response> {
  return globalThis.fetch.call(globalThis, input, init);
}

function errorFromGateway(json: unknown, fallback: string): string {
  if (json && typeof json === "object" && "error" in json) {
    const e = (json as { error?: unknown }).error;
    if (typeof e === "string" && e.length > 0) return e;
  }
  return fallback;
}

export class KindrailSdk {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private token: string | null = null;
  private refreshToken: string | null = null;

  constructor(opts: KindrailSdkOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/, "");
    this.fetchImpl = opts.fetchImpl ?? defaultFetch;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  setRefreshToken(token: string | null) {
    this.refreshToken = token;
  }

  private applyIssuedSession(out: KrAuthSessionIssued) {
    this.setToken(out.token);
    this.setRefreshToken(out.refreshToken);
  }

  private authHeaders(): Record<string, string> {
    return this.token ? { authorization: `Bearer ${this.token}` } : {};
  }

  async health(): Promise<HealthResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/health`, {
      method: "GET",
      headers: { accept: "application/json" }
    });
    if (!res.ok) throw new Error(`health failed: ${res.status}`);
    const json = await res.json();
    return HealthResponse.parse(json);
  }

  async legalPublic(): Promise<KrLegalPublicResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/legal/public`, {
      method: "GET",
      headers: { accept: "application/json" }
    });
    if (!res.ok) throw new Error(`legalPublic failed: ${res.status}`);
    const json = await res.json();
    return KrLegalPublicResponse.parse(json);
  }

  async analyticsEvent(req: KrAnalyticsEventRequest): Promise<KrAnalyticsEventResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/analytics/event`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        ...this.authHeaders()
      },
      body: JSON.stringify(req)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(errorFromGateway(json, `analyticsEvent failed: ${res.status}`));
    return KrAnalyticsEventResponse.parse(json);
  }

  async battleSim(req: KrBattleSimRequest): Promise<KrBattleSimResult> {
    const res = await this.fetchImpl(`${this.baseUrl}/sim/battle`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json"
      },
      body: JSON.stringify(req)
    });
    if (!res.ok) throw new Error(`battleSim failed: ${res.status}`);
    const json = await res.json();
    return KrBattleSimResult.parse(json);
  }

  async dailySeed(): Promise<KrDailySeedResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/daily-seed`, {
      method: "GET",
      headers: { accept: "application/json" }
    });
    if (!res.ok) throw new Error(`dailySeed failed: ${res.status}`);
    const json = await res.json();
    return KrDailySeedResponse.parse(json);
  }

  async authGuest(req: KrAuthGuestRequest): Promise<KrAuthGuestResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/auth/guest`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json"
      },
      body: JSON.stringify(req)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(errorFromGateway(json, `authGuest failed: ${res.status}`));
    const out = KrAuthGuestResponse.parse(json);
    this.applyIssuedSession(out);
    return out;
  }

  async authRefresh(req: KrAuthRefreshRequest): Promise<KrAuthRefreshResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/auth/refresh`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json"
      },
      body: JSON.stringify(req)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(errorFromGateway(json, `authRefresh failed: ${res.status}`));
    const out = KrAuthRefreshResponse.parse(json);
    this.setToken(out.token);
    this.setRefreshToken(out.refreshToken);
    return out;
  }

  async authLogout(): Promise<KrAuthLogoutResponse> {
    const body: KrAuthLogoutRequest = this.refreshToken
      ? { v: 1, refreshToken: this.refreshToken }
      : { v: 1 };
    const res = await this.fetchImpl(`${this.baseUrl}/auth/logout`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        ...this.authHeaders()
      },
      body: JSON.stringify(body)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(errorFromGateway(json, `authLogout failed: ${res.status}`));
    return KrAuthLogoutResponse.parse(json);
  }

  async authRegisterEmail(req: KrAuthRegisterEmailRequest): Promise<KrAuthRegisterEmailResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/auth/register-email`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json"
      },
      body: JSON.stringify(req)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(errorFromGateway(json, `authRegisterEmail failed: ${res.status}`));
    const out = KrAuthRegisterEmailResponse.parse(json);
    this.applyIssuedSession(out);
    return out;
  }

  async authLoginEmail(req: KrAuthLoginEmailRequest): Promise<KrAuthLoginEmailResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/auth/login-email`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json"
      },
      body: JSON.stringify(req)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(errorFromGateway(json, `authLoginEmail failed: ${res.status}`));
    const out = KrAuthLoginEmailResponse.parse(json);
    this.applyIssuedSession(out);
    return out;
  }

  async authLinkEmail(req: KrAuthLinkEmailRequest): Promise<KrAuthLinkEmailResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/auth/link-email`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        ...this.authHeaders()
      },
      body: JSON.stringify(req)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(errorFromGateway(json, `authLinkEmail failed: ${res.status}`));
    const out = KrAuthLinkEmailResponse.parse(json);
    this.applyIssuedSession(out);
    return out;
  }

  async authGoogle(req: KrAuthGoogleRequest): Promise<KrAuthGoogleResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/auth/oauth/google`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json"
      },
      body: JSON.stringify(req)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(errorFromGateway(json, `authGoogle failed: ${res.status}`));
    const out = KrAuthGoogleResponse.parse(json);
    this.applyIssuedSession(out);
    return out;
  }

  async authLinkGoogle(req: KrAuthLinkGoogleRequest): Promise<KrAuthLinkGoogleResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/auth/link-google`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        ...this.authHeaders()
      },
      body: JSON.stringify(req)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(errorFromGateway(json, `authLinkGoogle failed: ${res.status}`));
    const out = KrAuthLinkGoogleResponse.parse(json);
    this.applyIssuedSession(out);
    return out;
  }

  async me(): Promise<KrMeResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/me`, {
      method: "GET",
      headers: { accept: "application/json", ...this.authHeaders() }
    });
    if (!res.ok) throw new Error(`me failed: ${res.status}`);
    const json = await res.json();
    return KrMeResponse.parse(json);
  }

  async inventory(): Promise<KrInventoryResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/inventory`, {
      method: "GET",
      headers: { accept: "application/json", ...this.authHeaders() }
    });
    if (!res.ok) throw new Error(`inventory failed: ${res.status}`);
    const json = await res.json();
    return KrInventoryResponse.parse(json);
  }

  async dailyClaim(): Promise<KrDailyClaimResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/daily/claim`, {
      method: "POST",
      headers: { accept: "application/json", ...this.authHeaders() }
    });
    if (!res.ok) throw new Error(`dailyClaim failed: ${res.status}`);
    const json = await res.json();
    return KrDailyClaimResponse.parse(json);
  }

  async catalogUnits(): Promise<KrCatalogResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/catalog/units`, {
      method: "GET",
      headers: { accept: "application/json" }
    });
    if (!res.ok) throw new Error(`catalogUnits failed: ${res.status}`);
    const json = await res.json();
    return KrCatalogResponse.parse(json);
  }

  async shopDaily(): Promise<KrDailyShopResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/shop/daily`, {
      method: "GET",
      headers: { accept: "application/json", ...this.authHeaders() }
    });
    if (!res.ok) throw new Error(`shopDaily failed: ${res.status}`);
    const json = await res.json();
    return KrDailyShopResponse.parse(json);
  }

  async shopBuy(req: KrShopBuyRequest): Promise<KrShopBuyResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/shop/buy`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        ...this.authHeaders()
      },
      body: JSON.stringify(req)
    });
    if (!res.ok) throw new Error(`shopBuy failed: ${res.status}`);
    const json = await res.json();
    return KrShopBuyResponse.parse(json);
  }

  async ownedUnits(): Promise<KrOwnedUnitsResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/units/owned`, {
      method: "GET",
      headers: { accept: "application/json", ...this.authHeaders() }
    });
    if (!res.ok) throw new Error(`ownedUnits failed: ${res.status}`);
    const json = await res.json();
    return KrOwnedUnitsResponse.parse(json);
  }

  async unitUpgrade(req: KrUpgradeUnitRequest): Promise<KrUpgradeUnitResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/units/upgrade`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        ...this.authHeaders()
      },
      body: JSON.stringify(req)
    });
    if (!res.ok) throw new Error(`unitUpgrade failed: ${res.status}`);
    const json = await res.json();
    return KrUpgradeUnitResponse.parse(json);
  }

  async leaderboardSubmit(req: KrLeaderboardSubmitRequest): Promise<KrLeaderboardSubmitResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/leaderboard/submit`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        ...this.authHeaders()
      },
      body: JSON.stringify(req)
    });
    if (!res.ok) throw new Error(`leaderboardSubmit failed: ${res.status}`);
    const json = await res.json();
    return KrLeaderboardSubmitResponse.parse(json);
  }

  async leaderboardDaily(dateUtc?: string, limit = 50): Promise<KrLeaderboardTopResponse> {
    const url = new URL(`${this.baseUrl}/leaderboard/daily`);
    if (dateUtc) url.searchParams.set("date", dateUtc);
    url.searchParams.set("limit", String(limit));
    const res = await this.fetchImpl(url.toString(), {
      method: "GET",
      headers: { accept: "application/json" }
    });
    if (!res.ok) throw new Error(`leaderboardDaily failed: ${res.status}`);
    const json = await res.json();
    return KrLeaderboardTopResponse.parse(json);
  }

  async leaderboardMe(dateUtc?: string): Promise<KrLeaderboardMeResponse> {
    const url = new URL(`${this.baseUrl}/leaderboard/me`);
    if (dateUtc) url.searchParams.set("date", dateUtc);
    const res = await this.fetchImpl(url.toString(), {
      method: "GET",
      headers: { accept: "application/json", ...this.authHeaders() }
    });
    if (!res.ok) throw new Error(`leaderboardMe failed: ${res.status}`);
    const json = await res.json();
    return KrLeaderboardMeResponse.parse(json);
  }

  async referralAccept(req: KrReferralAcceptRequest): Promise<KrReferralAcceptResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/referral/accept`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        ...this.authHeaders()
      },
      body: JSON.stringify(req)
    });
    if (!res.ok) throw new Error(`referralAccept failed: ${res.status}`);
    const json = await res.json();
    return KrReferralAcceptResponse.parse(json);
  }

  async referralStatus(): Promise<KrReferralStatusResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/referral/status`, {
      method: "GET",
      headers: { accept: "application/json", ...this.authHeaders() }
    });
    if (!res.ok) throw new Error(`referralStatus failed: ${res.status}`);
    const json = await res.json();
    return KrReferralStatusResponse.parse(json);
  }

  async shareTicket(): Promise<KrShareTicketCreateResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/share/ticket`, {
      method: "POST",
      headers: { accept: "application/json", ...this.authHeaders() }
    });
    if (!res.ok) throw new Error(`shareTicket failed: ${res.status}`);
    const json = await res.json();
    return KrShareTicketCreateResponse.parse(json);
  }

  async shareRedeem(req: KrShareRedeemRequest): Promise<KrShareRedeemResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/share/redeem`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        ...this.authHeaders()
      },
      body: JSON.stringify(req)
    });
    if (!res.ok) throw new Error(`shareRedeem failed: ${res.status}`);
    const json = await res.json();
    return KrShareRedeemResponse.parse(json);
  }

  async offers(): Promise<KrOffersResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/offers`, {
      method: "GET",
      headers: { accept: "application/json" }
    });
    if (!res.ok) throw new Error(`offers failed: ${res.status}`);
    const json = await res.json();
    return KrOffersResponse.parse(json);
  }

  async checkoutCreate(req: KrCheckoutCreateRequest): Promise<KrCheckoutCreateResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/checkout/create`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        ...this.authHeaders()
      },
      body: JSON.stringify(req)
    });
    if (!res.ok) {
      let suffix = String(res.status);
      try {
        const body = (await res.json()) as { error?: unknown };
        if (typeof body?.error === "string" && body.error.length > 0) suffix = `${res.status}: ${body.error}`;
      } catch {
        /* ignore */
      }
      throw new Error(`checkoutCreate failed: ${suffix}`);
    }
    const json = await res.json();
    return KrCheckoutCreateResponse.parse(json);
  }

  async purchaseStatus(): Promise<KrPurchaseStatusResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/purchase/status`, {
      method: "GET",
      headers: { accept: "application/json", ...this.authHeaders() }
    });
    if (!res.ok) throw new Error(`purchaseStatus failed: ${res.status}`);
    const json = await res.json();
    return KrPurchaseStatusResponse.parse(json);
  }

  async seasonView(): Promise<KrSeasonViewResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/season/view`, {
      method: "GET",
      headers: { accept: "application/json" }
    });
    if (!res.ok) throw new Error(`seasonView failed: ${res.status}`);
    const json = await res.json();
    return KrSeasonViewResponse.parse(json);
  }

  async metaProgress(): Promise<KrMetaProgressResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/meta/progress`, {
      method: "GET",
      headers: { accept: "application/json", ...this.authHeaders() }
    });
    if (!res.ok) throw new Error(`metaProgress failed: ${res.status}`);
    const json = await res.json();
    return KrMetaProgressResponse.parse(json);
  }

  async metaQuestClaim(req: KrMetaQuestClaimRequest): Promise<KrMetaQuestClaimResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/meta/quest/claim`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        ...this.authHeaders()
      },
      body: JSON.stringify(req)
    });
    if (!res.ok) throw new Error(`metaQuestClaim failed: ${res.status}`);
    const json = await res.json();
    return KrMetaQuestClaimResponse.parse(json);
  }

  async metaBattlePassClaim(req: KrMetaBattlePassClaimRequest): Promise<KrMetaBattlePassClaimResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/meta/battle-pass/claim`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        ...this.authHeaders()
      },
      body: JSON.stringify(req)
    });
    if (!res.ok) throw new Error(`metaBattlePassClaim failed: ${res.status}`);
    const json = await res.json();
    return KrMetaBattlePassClaimResponse.parse(json);
  }

  async cosmeticsCatalog(): Promise<KrCosmeticsCatalogResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/cosmetics/catalog`, {
      method: "GET",
      headers: { accept: "application/json" }
    });
    if (!res.ok) throw new Error(`cosmeticsCatalog failed: ${res.status}`);
    const json = await res.json();
    return KrCosmeticsCatalogResponse.parse(json);
  }

  async cosmeticsMe(): Promise<KrCosmeticsMeResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/cosmetics/me`, {
      method: "GET",
      headers: { accept: "application/json", ...this.authHeaders() }
    });
    if (!res.ok) throw new Error(`cosmeticsMe failed: ${res.status}`);
    const json = await res.json();
    return KrCosmeticsMeResponse.parse(json);
  }

  async cosmeticsEquip(req: KrCosmeticsEquipRequest): Promise<KrCosmeticsEquipResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/cosmetics/equip`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        ...this.authHeaders()
      },
      body: JSON.stringify(req)
    });
    if (!res.ok) throw new Error(`cosmeticsEquip failed: ${res.status}`);
    const json = await res.json();
    return KrCosmeticsEquipResponse.parse(json);
  }

  /** R7 — Premium Battle Pass (Apple verifyReceipt veya Play ürün token). */
  async iapBattlePassVerify(req: KrBattlePassIapVerifyRequest): Promise<KrBattlePassIapVerifyResponseOk> {
    const res = await this.fetchImpl(`${this.baseUrl}/iap/battle-pass/verify`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        ...this.authHeaders()
      },
      body: JSON.stringify(req)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(errorFromGateway(json, `iapBattlePassVerify failed: ${res.status}`));
    return KrBattlePassIapVerifyResponseOk.parse(json);
  }

  async pushWebVapidPublic(): Promise<KrPushWebVapidResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/push/web/vapid-public`, {
      method: "GET",
      headers: { accept: "application/json" }
    });
    if (!res.ok) throw new Error(`pushWebVapidPublic failed: ${res.status}`);
    const json = await res.json();
    return KrPushWebVapidResponse.parse(json);
  }

  async pushWebSubscribe(req: KrPushWebSubscribeRequest): Promise<KrPushWebSubscribeResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/push/web/subscribe`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        ...this.authHeaders()
      },
      body: JSON.stringify(req)
    });
    if (!res.ok) throw new Error(`pushWebSubscribe failed: ${res.status}`);
    const json = await res.json();
    return KrPushWebSubscribeResponse.parse(json);
  }

  async pushWebUnsubscribe(req: KrPushWebUnsubscribeRequest): Promise<KrPushWebUnsubscribeResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/push/web/unsubscribe`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        ...this.authHeaders()
      },
      body: JSON.stringify(req)
    });
    if (!res.ok) throw new Error(`pushWebUnsubscribe failed: ${res.status}`);
    const json = await res.json();
    return KrPushWebUnsubscribeResponse.parse(json);
  }

  /** Operator/cron: requires gateway `KR_INTERNAL_CRON_SECRET` (not the user JWT). */
  async internalPushDaily(
    req: KrInternalPushDailyRequest,
    cron: KindrailInternalCronOptions
  ): Promise<KrInternalPushDailyResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/internal/push/daily`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "x-kr-internal-cron-secret": cron.cronSecret
      },
      body: JSON.stringify(req)
    });
    if (!res.ok) throw new Error(`internalPushDaily failed: ${res.status}`);
    const json = await res.json();
    return KrInternalPushDailyResponse.parse(json);
  }
}
