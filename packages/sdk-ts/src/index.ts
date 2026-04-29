import {
  HealthResponse,
  KrBattleSimRequest,
  KrBattleSimResult,
  KrDailySeedResponse
} from "@kindrail/protocol";

export type KindrailSdkOptions = {
  baseUrl: string;
  fetchImpl?: typeof fetch;
};

export class KindrailSdk {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: KindrailSdkOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/, "");
    this.fetchImpl = opts.fetchImpl ?? fetch;
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
}

