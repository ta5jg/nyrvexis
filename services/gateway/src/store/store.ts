import fs from "node:fs/promises";
import path from "node:path";

export type UserRow = {
  userId: string;
  /** Guest binding; may be empty for purely email-created rows. */
  deviceId: string;
  createdAtMs: number;
  emailNorm?: string;
  passwordSalt?: string;
  passwordHash?: string;
  /** Stable Google `sub` when this Nyrvexis user is linked to Google Sign-In. */
  googleSub?: string;
};

/** Refresh JWT `jti` -> owning Nyrvexis user (multi-device: several jtis per user). */
export type RefreshSessionRow = {
  userId: string;
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

export type PurchaseRow = {
  purchaseId: string; // internal
  userId: string;
  offerId: string;
  provider: "stripe" | "devstub";
  providerSessionId?: string;
  createdAtMs: number;
  fulfilledAtMs?: number;
};

export type PushWebSubRow = {
  subId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAtMs: number;
  updatedAtMs: number;
};

export type MetaQuestRow = {
  progress: number;
  claimedAtMs?: number;
};

export type MetaBpRow = {
  xp: number;
  claimedFree: number[];
  claimedPremium?: number[];
  hasPremium: boolean;
};

export type MetaStreakRow = {
  current: number;
  best: number;
  lastActiveDateUtc: string;
  catchUpTokens: number;
};

export type StoreState = {
  users: Record<string, UserRow>; // userId -> row
  deviceToUser: Record<string, string>; // deviceId -> userId
  emailToUser: Record<string, string>; // normalized email -> userId
  /** e.g. `google:<sub>` -> userId */
  oauthSubjectToUser: Record<string, string>;
  /** Key = refresh JWT `jti`. */
  refreshSessions: Record<string, RefreshSessionRow>;
  inventory: Record<string, InventoryRow>; // userId -> row
  dailyClaims: Record<string, DailyClaimRow>; // key `${userId}:${dateUtc}`
  ownedUnits: Record<string, Record<string, OwnedUnitRow>>; // userId -> archetype -> row
  leaderboard: Record<string, Record<string, LeaderboardEntryRow>>; // dateUtc -> userId -> row
  referrals: Record<string, ReferralEdgeRow>; // newUserId -> edge
  shareTickets: Record<string, ShareTicketRow>; // ticketId -> row
  caps: Record<string, number>; // generic counters, key `${kind}:${userId}:${dateUtc}`
  purchases: Record<string, PurchaseRow>; // purchaseId -> row
  webhookProcessed: Record<string, number>; // providerEventId -> processedAtMs
  pushWebSubs: Record<string, Record<string, PushWebSubRow>>; // userId -> subId -> row
  metaQuests: Record<string, MetaQuestRow>;
  metaBp: Record<string, MetaBpRow>;
  metaStreak: Record<string, MetaStreakRow>;
  metaBpDayXp: Record<string, number>;
  idempotencyKeys: Record<string, number>;
  cosmeticOwned: Record<string, Record<string, true>>;
  cosmeticEquipped: Record<string, Partial<Record<string, string>>>;
  /** Meta hub “planet” grid: userId → cellId → placed hub cosmetic or empty. */
  hubLayout: Record<string, Record<string, string | null>>;
  /** SHA256(platform+product+receipt) → Premium BP doğrulaması (R7). */
  iapGrants: Record<
    string,
    { userId: string; seasonId: string; atMs: number; platform: "ios" | "android" | "stub" | "usdtg"; productId: string }
  >;
  /** Read-only planet previews (`hp_*` tickets). */
  hubShareSnapshots: Record<
    string,
    {
      ticketId: string;
      issuerUserId: string;
      cells: Record<string, string | null>;
      createdAtMs: number;
      expiresAtMs: number;
    }
  >;
};

const DEFAULT_STATE: StoreState = {
  users: {},
  deviceToUser: {},
  emailToUser: {},
  oauthSubjectToUser: {},
  refreshSessions: {},
  inventory: {},
  dailyClaims: {},
  ownedUnits: {},
  leaderboard: {},
  referrals: {},
  shareTickets: {},
  caps: {},
  purchases: {},
  webhookProcessed: {},
  pushWebSubs: {},
  metaQuests: {},
  metaBp: {},
  metaStreak: {},
  metaBpDayXp: {},
  idempotencyKeys: {},
  cosmeticOwned: {},
  cosmeticEquipped: {},
  hubLayout: {},
  iapGrants: {},
  hubShareSnapshots: {}
};

/** Merge persisted JSON into full {@link StoreState} (shared by {@link FileStore} and {@link PgStore}). */
export function normalizePartialStoreState(parsed: Partial<StoreState> | undefined): StoreState {
  if (!parsed) return { ...DEFAULT_STATE };
  return {
    ...DEFAULT_STATE,
    ...parsed,
    users: parsed.users ?? {},
    deviceToUser: parsed.deviceToUser ?? {},
    emailToUser: parsed.emailToUser ?? {},
    oauthSubjectToUser: parsed.oauthSubjectToUser ?? {},
    refreshSessions: parsed.refreshSessions ?? {},
    inventory: parsed.inventory ?? {},
    dailyClaims: parsed.dailyClaims ?? {},
    ownedUnits: parsed.ownedUnits ?? {},
    leaderboard: parsed.leaderboard ?? {},
    referrals: parsed.referrals ?? {},
    shareTickets: parsed.shareTickets ?? {},
    caps: parsed.caps ?? {},
    purchases: parsed.purchases ?? {},
    webhookProcessed: parsed.webhookProcessed ?? {},
    pushWebSubs: parsed.pushWebSubs ?? {},
    metaQuests: parsed.metaQuests ?? {},
    metaBp: parsed.metaBp ?? {},
    metaStreak: parsed.metaStreak ?? {},
    metaBpDayXp: parsed.metaBpDayXp ?? {},
    idempotencyKeys: parsed.idempotencyKeys ?? {},
    cosmeticOwned: parsed.cosmeticOwned ?? {},
    cosmeticEquipped: parsed.cosmeticEquipped ?? {},
    hubLayout: parsed.hubLayout ?? {},
    iapGrants: parsed.iapGrants ?? {},
    hubShareSnapshots: parsed.hubShareSnapshots ?? {}
  } as StoreState;
}

/** Migrates legacy `UserRow.refreshJti` into `refreshSessions`. Returns whether state changed. */
export function migrateLegacyRefreshSessions(state: StoreState): boolean {
  let migratedRefresh = false;
  for (const [uid, row] of Object.entries(state.users)) {
    const legacyJti = (row as { refreshJti?: string }).refreshJti;
    if (legacyJti && legacyJti.length >= 8 && !state.refreshSessions[legacyJti]) {
      state.refreshSessions[legacyJti] = { userId: uid, createdAtMs: row.createdAtMs };
      migratedRefresh = true;
    }
    if ("refreshJti" in row) {
      delete (row as { refreshJti?: string }).refreshJti;
      migratedRefresh = true;
    }
  }
  return migratedRefresh;
}

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
      this.state = normalizePartialStoreState(parsed);

      if (migrateLegacyRefreshSessions(this.state)) await this.save();
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

