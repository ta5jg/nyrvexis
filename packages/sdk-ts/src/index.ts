import {
  HealthResponse,
  KrAuthGuestRequest,
  KrAuthGuestResponse,
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
  KrPushWebSubscribeRequest,
  KrPushWebSubscribeResponse,
  KrPushWebUnsubscribeRequest,
  KrPushWebUnsubscribeResponse,
  KrPushWebVapidResponse,
  KrInternalPushDailyRequest,
  KrInternalPushDailyResponse
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

export class KindrailSdk {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private token: string | null = null;

  constructor(opts: KindrailSdkOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/, "");
    this.fetchImpl = opts.fetchImpl ?? defaultFetch;
  }

  setToken(token: string | null) {
    this.token = token;
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
    if (!res.ok) throw new Error(`authGuest failed: ${res.status}`);
    const json = await res.json();
    const out = KrAuthGuestResponse.parse(json);
    this.setToken(out.token);
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
    if (!res.ok) throw new Error(`checkoutCreate failed: ${res.status}`);
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

