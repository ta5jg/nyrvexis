import type { ReplayFrame } from "../../ui/replay";
import type { BattleAnimationDirector } from "./NyrvexisAnimationSystem";

function parseHitDmg(text: string): number {
  const m = /dmg=(\d+)/.exec(text);
  if (!m) return 0;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Feed one replay tick into `BattleAnimationDirector` (cosmetic; deterministic order).
 */
export function applyReplayTickToDirector(
  prev: ReplayFrame | null,
  cur: ReplayFrame,
  director: BattleAnimationDirector
): void {
  for (const e of cur.uiEvents ?? []) {
    if (e.kind === "ability" && e.src && e.dst) {
      director.playEvent({ type: "skill", sourceId: e.src });
    }
    if (e.kind === "hit" && e.src && e.dst) {
      const dmg = parseHitDmg(e.text);
      director.playEvent({ type: "attack", sourceId: e.src });
      if (dmg > 0) {
        const hp = cur.hp[e.dst];
        const maxHp = cur.maxHp[e.dst];
        if (typeof hp === "number" && typeof maxHp === "number") {
          director.playEvent({
            type: "damage",
            targetId: e.dst,
            hp,
            maxHp
          });
        }
      } else if (/\bMISS\b/i.test(e.text)) {
        director.playEvent({ type: "hit", targetId: e.dst });
      }
    }
  }

  if (prev) {
    const ids = new Set([...Object.keys(cur.alive), ...Object.keys(prev.alive)]);
    for (const id of ids) {
      const wasAlive = prev.alive[id] !== false && (prev.hp[id] ?? 0) > 0;
      const isDead = cur.alive[id] === false || (cur.hp[id] ?? 0) <= 0;
      if (wasAlive && isDead) {
        director.playEvent({ type: "death", targetId: id });
      }
    }
  }
}
