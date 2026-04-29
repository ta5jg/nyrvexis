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
  KrUpgradeUnitResponse
} from "@kindrail/protocol";

export type KindrailSdkOptions = {
  baseUrl: string;
  fetchImpl?: typeof fetch;
};

export class KindrailSdk {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private token: string | null = null;

  constructor(opts: KindrailSdkOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/, "");
    this.fetchImpl = opts.fetchImpl ?? fetch;
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
}

