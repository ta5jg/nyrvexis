import {
  HealthResponse,
  NvAuthGuestRequest,
  NvAuthGuestResponse,
  NvAuthRefreshRequest,
  NvAuthRefreshResponse,
  NvAuthLogoutRequest,
  NvAuthLogoutResponse,
  NvAuthRegisterEmailRequest,
  NvAuthRegisterEmailResponse,
  NvAuthLoginEmailRequest,
  NvAuthLoginEmailResponse,
  NvAuthLinkEmailRequest,
  NvAuthLinkEmailResponse,
  NvAuthGoogleRequest,
  NvAuthGoogleResponse,
  NvAuthLinkGoogleRequest,
  NvAuthLinkGoogleResponse,
  NvAuthSessionIssued,
  NvBattleSimRequest,
  NvBattleSimResult,
  NvCatalogResponse,
  NvDailyClaimResponse,
  NvDailySeedResponse,
  NvDailyShopResponse,
  NvInventoryResponse,
  NvMeResponse,
  NvOwnedUnitsResponse,
  NvShopBuyRequest,
  NvShopBuyResponse,
  NvUpgradeUnitRequest,
  NvUpgradeUnitResponse,
  NvLeaderboardMeResponse,
  NvLeaderboardSubmitRequest,
  NvLeaderboardSubmitResponse,
  NvLeaderboardTopResponse,
  NvReferralAcceptRequest,
  NvReferralAcceptResponse,
  NvReferralStatusResponse,
  NvShareRedeemRequest,
  NvShareRedeemResponse,
  NvShareTicketCreateResponse,
  NvCheckoutCreateRequest,
  NvCheckoutCreateResponse,
  NvOffersResponse,
  NvPurchaseStatusResponse,
  NvBattlePassIapVerifyRequest,
  NvBattlePassIapVerifyResponseOk,
  NvPushWebSubscribeRequest,
  NvPushWebSubscribeResponse,
  NvPushWebUnsubscribeRequest,
  NvPushWebUnsubscribeResponse,
  NvPushWebVapidResponse,
  NvInternalPushDailyRequest,
  NvInternalPushDailyResponse,
  NvMetaProgressResponse,
  NvMetaQuestClaimRequest,
  NvMetaQuestClaimResponse,
  NvMetaBattlePassClaimRequest,
  NvMetaBattlePassClaimResponse,
  NvSeasonViewResponse,
  NvCosmeticsCatalogResponse,
  NvCosmeticsMeResponse,
  NvCosmeticsEquipRequest,
  NvCosmeticsEquipResponse,
  NvHubLayoutPutRequest,
  NvHubLayoutResponse,
  NvHubShareCreateRequest,
  NvHubShareCreateResponse,
  NvHubSharePublicResponse,
  NvLegalPublicResponse,
  NvAnalyticsEventRequest,
  NvAnalyticsEventResponse
} from "@nyrvexis/protocol";

export type NyrvexisSdkOptions = {
  baseUrl: string;
  fetchImpl?: typeof fetch;
};

export type NyrvexisInternalCronOptions = {
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

export class NyrvexisSdk {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private token: string | null = null;
  private refreshToken: string | null = null;

  constructor(opts: NyrvexisSdkOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/, "");
    this.fetchImpl = opts.fetchImpl ?? defaultFetch;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  setRefreshToken(token: string | null) {
    this.refreshToken = token;
  }

  private applyIssuedSession(out: NvAuthSessionIssued) {
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

  async legalPublic(): Promise<NvLegalPublicResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/legal/public`, {
      method: "GET",
      headers: { accept: "application/json" }
    });
    if (!res.ok) throw new Error(`legalPublic failed: ${res.status}`);
    const json = await res.json();
    return NvLegalPublicResponse.parse(json);
  }

  async analyticsEvent(req: NvAnalyticsEventRequest): Promise<NvAnalyticsEventResponse> {
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
    return NvAnalyticsEventResponse.parse(json);
  }

  async battleSim(req: NvBattleSimRequest): Promise<NvBattleSimResult> {
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
    return NvBattleSimResult.parse(json);
  }

  async dailySeed(): Promise<NvDailySeedResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/daily-seed`, {
      method: "GET",
      headers: { accept: "application/json" }
    });
    if (!res.ok) throw new Error(`dailySeed failed: ${res.status}`);
    const json = await res.json();
    return NvDailySeedResponse.parse(json);
  }

  async authGuest(req: NvAuthGuestRequest): Promise<NvAuthGuestResponse> {
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
    const out = NvAuthGuestResponse.parse(json);
    this.applyIssuedSession(out);
    return out;
  }

  async authRefresh(req: NvAuthRefreshRequest): Promise<NvAuthRefreshResponse> {
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
    const out = NvAuthRefreshResponse.parse(json);
    this.setToken(out.token);
    this.setRefreshToken(out.refreshToken);
    return out;
  }

  async authLogout(): Promise<NvAuthLogoutResponse> {
    const body: NvAuthLogoutRequest = this.refreshToken
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
    return NvAuthLogoutResponse.parse(json);
  }

  async authRegisterEmail(req: NvAuthRegisterEmailRequest): Promise<NvAuthRegisterEmailResponse> {
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
    const out = NvAuthRegisterEmailResponse.parse(json);
    this.applyIssuedSession(out);
    return out;
  }

  async authLoginEmail(req: NvAuthLoginEmailRequest): Promise<NvAuthLoginEmailResponse> {
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
    const out = NvAuthLoginEmailResponse.parse(json);
    this.applyIssuedSession(out);
    return out;
  }

  async authLinkEmail(req: NvAuthLinkEmailRequest): Promise<NvAuthLinkEmailResponse> {
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
    const out = NvAuthLinkEmailResponse.parse(json);
    this.applyIssuedSession(out);
    return out;
  }

  async authGoogle(req: NvAuthGoogleRequest): Promise<NvAuthGoogleResponse> {
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
    const out = NvAuthGoogleResponse.parse(json);
    this.applyIssuedSession(out);
    return out;
  }

  async authLinkGoogle(req: NvAuthLinkGoogleRequest): Promise<NvAuthLinkGoogleResponse> {
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
    const out = NvAuthLinkGoogleResponse.parse(json);
    this.applyIssuedSession(out);
    return out;
  }

  async me(): Promise<NvMeResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/me`, {
      method: "GET",
      headers: { accept: "application/json", ...this.authHeaders() }
    });
    if (!res.ok) throw new Error(`me failed: ${res.status}`);
    const json = await res.json();
    return NvMeResponse.parse(json);
  }

  async inventory(): Promise<NvInventoryResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/inventory`, {
      method: "GET",
      headers: { accept: "application/json", ...this.authHeaders() }
    });
    if (!res.ok) throw new Error(`inventory failed: ${res.status}`);
    const json = await res.json();
    return NvInventoryResponse.parse(json);
  }

  async dailyClaim(): Promise<NvDailyClaimResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/daily/claim`, {
      method: "POST",
      headers: { accept: "application/json", ...this.authHeaders() }
    });
    if (!res.ok) throw new Error(`dailyClaim failed: ${res.status}`);
    const json = await res.json();
    return NvDailyClaimResponse.parse(json);
  }

  async catalogUnits(): Promise<NvCatalogResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/catalog/units`, {
      method: "GET",
      headers: { accept: "application/json" }
    });
    if (!res.ok) throw new Error(`catalogUnits failed: ${res.status}`);
    const json = await res.json();
    return NvCatalogResponse.parse(json);
  }

  async shopDaily(): Promise<NvDailyShopResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/shop/daily`, {
      method: "GET",
      headers: { accept: "application/json", ...this.authHeaders() }
    });
    if (!res.ok) throw new Error(`shopDaily failed: ${res.status}`);
    const json = await res.json();
    return NvDailyShopResponse.parse(json);
  }

  async shopBuy(req: NvShopBuyRequest): Promise<NvShopBuyResponse> {
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
    return NvShopBuyResponse.parse(json);
  }

  async ownedUnits(): Promise<NvOwnedUnitsResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/units/owned`, {
      method: "GET",
      headers: { accept: "application/json", ...this.authHeaders() }
    });
    if (!res.ok) throw new Error(`ownedUnits failed: ${res.status}`);
    const json = await res.json();
    return NvOwnedUnitsResponse.parse(json);
  }

  async unitUpgrade(req: NvUpgradeUnitRequest): Promise<NvUpgradeUnitResponse> {
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
    return NvUpgradeUnitResponse.parse(json);
  }

  async leaderboardSubmit(req: NvLeaderboardSubmitRequest): Promise<NvLeaderboardSubmitResponse> {
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
    return NvLeaderboardSubmitResponse.parse(json);
  }

  async leaderboardDaily(dateUtc?: string, limit = 50): Promise<NvLeaderboardTopResponse> {
    const url = new URL(`${this.baseUrl}/leaderboard/daily`);
    if (dateUtc) url.searchParams.set("date", dateUtc);
    url.searchParams.set("limit", String(limit));
    const res = await this.fetchImpl(url.toString(), {
      method: "GET",
      headers: { accept: "application/json" }
    });
    if (!res.ok) throw new Error(`leaderboardDaily failed: ${res.status}`);
    const json = await res.json();
    return NvLeaderboardTopResponse.parse(json);
  }

  async leaderboardMe(dateUtc?: string): Promise<NvLeaderboardMeResponse> {
    const url = new URL(`${this.baseUrl}/leaderboard/me`);
    if (dateUtc) url.searchParams.set("date", dateUtc);
    const res = await this.fetchImpl(url.toString(), {
      method: "GET",
      headers: { accept: "application/json", ...this.authHeaders() }
    });
    if (!res.ok) throw new Error(`leaderboardMe failed: ${res.status}`);
    const json = await res.json();
    return NvLeaderboardMeResponse.parse(json);
  }

  async referralAccept(req: NvReferralAcceptRequest): Promise<NvReferralAcceptResponse> {
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
    return NvReferralAcceptResponse.parse(json);
  }

  async referralStatus(): Promise<NvReferralStatusResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/referral/status`, {
      method: "GET",
      headers: { accept: "application/json", ...this.authHeaders() }
    });
    if (!res.ok) throw new Error(`referralStatus failed: ${res.status}`);
    const json = await res.json();
    return NvReferralStatusResponse.parse(json);
  }

  async shareTicket(): Promise<NvShareTicketCreateResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/share/ticket`, {
      method: "POST",
      headers: { accept: "application/json", ...this.authHeaders() }
    });
    if (!res.ok) throw new Error(`shareTicket failed: ${res.status}`);
    const json = await res.json();
    return NvShareTicketCreateResponse.parse(json);
  }

  async shareRedeem(req: NvShareRedeemRequest): Promise<NvShareRedeemResponse> {
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
    return NvShareRedeemResponse.parse(json);
  }

  async offers(): Promise<NvOffersResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/offers`, {
      method: "GET",
      headers: { accept: "application/json" }
    });
    if (!res.ok) throw new Error(`offers failed: ${res.status}`);
    const json = await res.json();
    return NvOffersResponse.parse(json);
  }

  async checkoutCreate(req: NvCheckoutCreateRequest): Promise<NvCheckoutCreateResponse> {
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
    return NvCheckoutCreateResponse.parse(json);
  }

  async purchaseStatus(): Promise<NvPurchaseStatusResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/purchase/status`, {
      method: "GET",
      headers: { accept: "application/json", ...this.authHeaders() }
    });
    if (!res.ok) throw new Error(`purchaseStatus failed: ${res.status}`);
    const json = await res.json();
    return NvPurchaseStatusResponse.parse(json);
  }

  async seasonView(): Promise<NvSeasonViewResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/season/view`, {
      method: "GET",
      headers: { accept: "application/json" }
    });
    if (!res.ok) throw new Error(`seasonView failed: ${res.status}`);
    const json = await res.json();
    return NvSeasonViewResponse.parse(json);
  }

  async metaProgress(): Promise<NvMetaProgressResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/meta/progress`, {
      method: "GET",
      headers: { accept: "application/json", ...this.authHeaders() }
    });
    if (!res.ok) throw new Error(`metaProgress failed: ${res.status}`);
    const json = await res.json();
    return NvMetaProgressResponse.parse(json);
  }

  async metaQuestClaim(req: NvMetaQuestClaimRequest): Promise<NvMetaQuestClaimResponse> {
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
    return NvMetaQuestClaimResponse.parse(json);
  }

  async metaBattlePassClaim(req: NvMetaBattlePassClaimRequest): Promise<NvMetaBattlePassClaimResponse> {
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
    return NvMetaBattlePassClaimResponse.parse(json);
  }

  async cosmeticsCatalog(): Promise<NvCosmeticsCatalogResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/cosmetics/catalog`, {
      method: "GET",
      headers: { accept: "application/json" }
    });
    if (!res.ok) throw new Error(`cosmeticsCatalog failed: ${res.status}`);
    const json = await res.json();
    return NvCosmeticsCatalogResponse.parse(json);
  }

  async cosmeticsMe(): Promise<NvCosmeticsMeResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/cosmetics/me`, {
      method: "GET",
      headers: { accept: "application/json", ...this.authHeaders() }
    });
    if (!res.ok) throw new Error(`cosmeticsMe failed: ${res.status}`);
    const json = await res.json();
    return NvCosmeticsMeResponse.parse(json);
  }

  async cosmeticsEquip(req: NvCosmeticsEquipRequest): Promise<NvCosmeticsEquipResponse> {
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
    return NvCosmeticsEquipResponse.parse(json);
  }

  async hubLayout(): Promise<NvHubLayoutResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/hub/layout`, {
      method: "GET",
      headers: { accept: "application/json", ...this.authHeaders() }
    });
    if (!res.ok) throw new Error(`hubLayout failed: ${res.status}`);
    const json = await res.json();
    return NvHubLayoutResponse.parse(json);
  }

  async hubLayoutPut(req: NvHubLayoutPutRequest): Promise<NvHubLayoutResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/hub/layout`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        ...this.authHeaders()
      },
      body: JSON.stringify(req)
    });
    if (!res.ok) throw new Error(`hubLayoutPut failed: ${res.status}`);
    const json = await res.json();
    return NvHubLayoutResponse.parse(json);
  }

  async hubShareCreate(req: NvHubShareCreateRequest): Promise<NvHubShareCreateResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/hub/share`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        ...this.authHeaders()
      },
      body: JSON.stringify(req)
    });
    if (!res.ok) throw new Error(`hubShareCreate failed: ${res.status}`);
    const json = await res.json();
    return NvHubShareCreateResponse.parse(json);
  }

  /** Public snapshot (no auth). */
  async hubSharePublic(ticketId: string): Promise<NvHubSharePublicResponse> {
    const enc = encodeURIComponent(ticketId);
    const res = await this.fetchImpl(`${this.baseUrl}/hub/share/${enc}`, {
      method: "GET",
      headers: { accept: "application/json" }
    });
    if (!res.ok) throw new Error(`hubSharePublic failed: ${res.status}`);
    const json = await res.json();
    return NvHubSharePublicResponse.parse(json);
  }

  /** R7 — Premium Battle Pass (Apple verifyReceipt veya Play ürün token). */
  async iapBattlePassVerify(req: NvBattlePassIapVerifyRequest): Promise<NvBattlePassIapVerifyResponseOk> {
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
    return NvBattlePassIapVerifyResponseOk.parse(json);
  }

  async pushWebVapidPublic(): Promise<NvPushWebVapidResponse> {
    const res = await this.fetchImpl(`${this.baseUrl}/push/web/vapid-public`, {
      method: "GET",
      headers: { accept: "application/json" }
    });
    if (!res.ok) throw new Error(`pushWebVapidPublic failed: ${res.status}`);
    const json = await res.json();
    return NvPushWebVapidResponse.parse(json);
  }

  async pushWebSubscribe(req: NvPushWebSubscribeRequest): Promise<NvPushWebSubscribeResponse> {
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
    return NvPushWebSubscribeResponse.parse(json);
  }

  async pushWebUnsubscribe(req: NvPushWebUnsubscribeRequest): Promise<NvPushWebUnsubscribeResponse> {
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
    return NvPushWebUnsubscribeResponse.parse(json);
  }

  /** Operator/cron: requires gateway `KR_INTERNAL_CRON_SECRET` (not the user JWT). */
  async internalPushDaily(
    req: NvInternalPushDailyRequest,
    cron: NyrvexisInternalCronOptions
  ): Promise<NvInternalPushDailyResponse> {
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
    return NvInternalPushDailyResponse.parse(json);
  }
}
