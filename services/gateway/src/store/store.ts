import fs from "node:fs/promises";
import path from "node:path";

export type UserRow = {
  userId: string;
  deviceId: string;
  createdAtMs: number;
};

export type InventoryRow = {
  userId: string;
  gold: number;
  shards: number;
  keys: number;
  updatedAtMs: number;
};

export type DailyClaimRow = {
  userId: string;
  dateUtc: string; // YYYY-MM-DD
  claimedAtMs: number;
};

export type OwnedUnitRow = {
  archetype: string;
  level: number;
};

export type LeaderboardEntryRow = {
  userId: string;
  dateUtc: string;
  score: number;
  ticks: number;
  remainingHp: number;
  updatedAtMs: number;
};

export type ReferralEdgeRow = {
  referrerUserId: string;
  newUserId: string;
  createdAtMs: number;
  rewardedAtMs?: number;
};

export type ShareTicketRow = {
  ticketId: string;
  issuerUserId: string;
  dateUtc: string;
  createdAtMs: number;
  expiresAtMs: number;
  redeemedByUserId?: string;
  redeemedAtMs?: number;
};

export type StoreState = {
  users: Record<string, UserRow>; // userId -> row
  deviceToUser: Record<string, string>; // deviceId -> userId
  inventory: Record<string, InventoryRow>; // userId -> row
  dailyClaims: Record<string, DailyClaimRow>; // key `${userId}:${dateUtc}`
  ownedUnits: Record<string, Record<string, OwnedUnitRow>>; // userId -> archetype -> row
  leaderboard: Record<string, Record<string, LeaderboardEntryRow>>; // dateUtc -> userId -> row
  referrals: Record<string, ReferralEdgeRow>; // newUserId -> edge
  shareTickets: Record<string, ShareTicketRow>; // ticketId -> row
  caps: Record<string, number>; // generic counters, key `${kind}:${userId}:${dateUtc}`
};

const DEFAULT_STATE: StoreState = {
  users: {},
  deviceToUser: {},
  inventory: {},
  dailyClaims: {},
  ownedUnits: {},
  leaderboard: {},
  referrals: {},
  shareTickets: {},
  caps: {}
};

export class FileStore {
  private readonly dir: string;
  private readonly file: string;
  private state: StoreState = DEFAULT_STATE;
  private saving: Promise<void> | null = null;

  constructor(opts: { dir: string; filename?: string }) {
    this.dir = opts.dir;
    this.file = path.join(this.dir, opts.filename ?? "store.json");
  }

  async load(): Promise<void> {
    await fs.mkdir(this.dir, { recursive: true });
    try {
      const raw = await fs.readFile(this.file, "utf8");
      const parsed = JSON.parse(raw) as Partial<StoreState>;
      this.state = {
        ...DEFAULT_STATE,
        ...parsed,
        ownedUnits: parsed.ownedUnits ?? {},
        leaderboard: parsed.leaderboard ?? {},
        referrals: parsed.referrals ?? {},
        shareTickets: parsed.shareTickets ?? {},
        caps: parsed.caps ?? {}
      } as StoreState;
    } catch {
      this.state = { ...DEFAULT_STATE };
      await this.save();
    }
  }

  snapshot(): StoreState {
    return this.state;
  }

  mutate<T>(fn: (s: StoreState) => T): T {
    const out = fn(this.state);
    // Fire-and-forget save with simple coalescing
    if (!this.saving) {
      this.saving = this.save().finally(() => {
        this.saving = null;
      });
    }
    return out;
  }

  private async save(): Promise<void> {
    const tmp = `${this.file}.tmp`;
    const data = JSON.stringify(this.state, null, 2) + "\n";
    await fs.writeFile(tmp, data, "utf8");
    await fs.rename(tmp, this.file);
  }
}

