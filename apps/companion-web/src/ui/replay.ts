import { scaledMatchHp, type NvBattleSimRequest, type NvBattleSimResult } from "@nyrvexis/protocol";

/** Derived UI feed for canvas/Pixi layers (optional on frames). */
export type ReplayUiEvent =
  | { kind: "hit"; src?: string; dst: string; text: string; crit?: boolean }
  | { kind: "ability"; src?: string; dst?: string; text: string }
  | { kind: "end"; text: string };

export type ReplayFrame = {
  t: number;
  hp: Record<string, number>;
  maxHp: Record<string, number>;
  alive: Record<string, boolean>;
  log: string[];
  /** Unit ids that took damage or died this tick (UI flash). */
  flashIds: string[];
  critIds?: string[];
  atkIds?: string[];
  tgtIds?: string[];
  uiEvents?: ReplayUiEvent[];
};

/**
 * Deterministic forward replay from events + initial request stats.
 * Events must be stable-sorted by (tick, original index).
 */
export function buildReplayFrames(req: NvBattleSimRequest, result: NvBattleSimResult): ReplayFrame[] {
  const hp: Record<string, number> = {};
  const maxHp: Record<string, number> = {};
  const alive: Record<string, boolean> = {};

  for (const u of req.a.units) {
    const sh = scaledMatchHp(u);
    hp[u.id] = sh;
    maxHp[u.id] = sh;
    alive[u.id] = true;
  }
  for (const u of req.b.units) {
    const sh = scaledMatchHp(u);
    hp[u.id] = sh;
    maxHp[u.id] = sh;
    alive[u.id] = true;
  }

  const evSorted = result.events
    .map((e, i) => ({ e, i }))
    .sort((a, b) => a.e.t - b.e.t || a.i - b.i)
    .map((x) => x.e);

  const frames: ReplayFrame[] = [];
  const ticks = Math.max(0, result.ticks);
  let evi = 0;

  for (let t = 0; t <= ticks; t++) {
    const log: string[] = [];
    const flashIds: string[] = [];
    const critIds: string[] = [];
    const atkIds: string[] = [];
    const tgtIds: string[] = [];
    const uiEvents: ReplayUiEvent[] = [];

    while (evi < evSorted.length && evSorted[evi].t === t) {
      const e = evSorted[evi++];
      if (e.kind === "hit" && e.dst && typeof e.dmg === "number") {
        const dmgRaw = e.dmg | 0;
        if (dmgRaw <= 0) {
          const line = `${e.src ?? "?"} → ${e.dst}  MISS`;
          log.push(line);
          uiEvents.push({ kind: "hit", src: e.src, dst: e.dst, text: line, crit: Boolean(e.crit) });
          if (e.src) atkIds.push(e.src);
          continue;
        }
        const cur = hp[e.dst] ?? 0;
        const next = Math.max(0, (cur - dmgRaw) | 0);
        hp[e.dst] = next;
        if (next <= 0) alive[e.dst] = false;
        flashIds.push(e.dst);
        const line = `${e.src ?? "?"} → ${e.dst}  dmg=${e.dmg}${e.crit ? " CRIT" : ""}`;
        log.push(line);
        uiEvents.push({ kind: "hit", src: e.src, dst: e.dst, text: line, crit: Boolean(e.crit) });
        if (e.src) atkIds.push(e.src);
        tgtIds.push(e.dst);
        if (e.crit && e.src) critIds.push(e.src);
      } else if (e.kind === "death" && e.dst) {
        hp[e.dst] = 0;
        alive[e.dst] = false;
        flashIds.push(e.dst);
        log.push(`${e.dst} died`);
      } else if (e.kind === "status_apply") {
        log.push(`${e.src} applied ${e.status?.kind}(${e.status?.mag ?? 0}) to ${e.dst} for ${e.status?.dur}t`);
      } else if (e.kind === "status_tick") {
        log.push(`${e.status?.kind} tick on ${e.dst}: ${e.status?.mag ?? 0}`);
      } else if (e.kind === "ability") {
        const line = `${e.src} ability ${e.abilityId}${e.dst ? ` → ${e.dst}` : ""}`;
        log.push(line);
        uiEvents.push({ kind: "ability", src: e.src, dst: e.dst, text: line });
      } else if (e.kind === "end") {
        log.push("END");
        uiEvents.push({ kind: "end", text: "END" });
      }
    }

    frames.push({
      t,
      hp: { ...hp },
      maxHp: { ...maxHp },
      alive: { ...alive },
      log,
      flashIds,
      critIds: critIds.length ? critIds : undefined,
      atkIds: atkIds.length ? atkIds : undefined,
      tgtIds: tgtIds.length ? tgtIds : undefined,
      uiEvents: uiEvents.length ? uiEvents : undefined
    });
  }

  return frames;
}
