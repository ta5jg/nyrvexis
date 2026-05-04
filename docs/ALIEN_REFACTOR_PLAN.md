<!-- =============================================================================
File:           docs/ALIEN_REFACTOR_PLAN.md
Author:         USDTG GROUP TECHNOLOGY LLC
Developer:      Irfan Gedik
Created Date:   2026-05-04
Last Update:    2026-05-04
Version:        0.1.0

Description:
  Audit + refactor plan to bring Nyrvexis in line with the studio rule:
  "combat in any USDTG game is human-versus-alien only — no human-vs-
  human, no Earth-life antagonists, no fear-or-hate-of-Earth-life
  mechanic." This file documents what exists today, what needs to
  change, and a concrete plan for the change. No code is touched until
  this plan is signed off.

License:
  Proprietary. All rights reserved. See LICENSE in the repository root.
============================================================================= -->

# Nyrvexis — Alien Antagonist Refactor Plan

## Studio rule (recap)

Combat is **human-versus-alien only**. No human-vs-human matches, no Earth
animals as enemies, nothing that could create fear or hatred toward Earth
life. Aliens are the sole antagonist class across every USDTG game.

## Current state — what exists

### Battle surface

`packages/protocol/src/v1/battle.ts` defines the wire shape. Battles are
**team-vs-team**, both sides built from the same set of unit archetypes:

```
NvBattleSimRequest {
  v: 1,
  seed: NvBattleSeed,
  a:    NvTeam,
  b:    NvTeam,
  maxTicks: number,
}

NvTeam {
  name: string,
  units: NvUnit[],   // 1..12 units
}

NvUnit {
  archetype: NvUnitArchetypeId,    // string id from a single shared catalog
  hp / atk / def / spd / critPct / critMulPct,
  slot: 0..11,                      // 0..5 front, 6..11 back
}
```

Animation intents (`NvBattleAnimIntent`): `idle`, `advance`, `attack`,
`hit`, `death`. Statuses: `shield`, `bleed`, `taunt`, `stun`. All
verbs / abstractions are combat-coded.

### Where the opponent comes from

`apps/companion-web/src/ui/deckBuilder.ts` constructs the enemy team:

- `buildRandomEnemyTeam(seed, count, defs)` — picks units from
  `NvUnitArchetypeDef[]` (the same catalog the player uses) using a
  seeded RNG. Names the team `"RIFT"`.
- Two enemy presets exist in the UI:
  - `"demo"` — random opponent from the same human archetype catalog.
  - `"mirror"` — opponent team is **literally a copy of your own team**.

Both presets produce a team-vs-team where both sides are humans pulled
from the same catalog. This is the human-vs-human pattern that needs to
change.

### Other surfaces that touch combat

- `services/gateway/src/sim/battleSim.ts` — runs the deterministic sim.
  Doesn't care about "human vs alien"; just operates on stat blocks. **No
  change strictly required at this layer**, but presentation of events
  (status names, animation intents) will likely need vocabulary tweaks.
- `services/gateway/src/sim/synergy.ts` — synergies fire on shared
  archetype tags. Synergies are a player-team-only feature; we keep them
  unchanged (alien teams don't get synergies — they have their own kit).
- `apps/companion-web` — main UI. Touches: enemy preview cards, deck
  builder, mirror toggle, battle replay UI, possibly localized strings.
- `apps/companion-mobile` — likely mirrors the web app. Needs the same
  pass.
- `apps/game-unity` — Unity client. The studio decided earlier to shelve
  Unity work; not in scope of this refactor unless it hits live users.

### Documents that hint at design

- `docs/COMBAT_M1.md` — M1 skirmish notes.
- `docs/nyrvexis_battle_engine_ts.ts` — design reference.
- README + CHANGELOG — public-facing copy may mention rivals/enemies in
  ways that need to stay accurate after the refactor.

---

## Target state

### Wire shape (proposed)

`packages/protocol/src/v1/battle.ts` adds the alien catalog parallel to
the unit one and tags each team:

```
NvAlienArchetypeId    // string id, distinct namespace from NvUnitArchetypeId
NvAlienArchetypeDef   // shape similar to NvUnitArchetypeDef but with
                      // alien-specific fields (e.g. spawn weight,
                      // wave tier, biome affinity)

NvUnit (unchanged for the player side)

NvAlienUnit            // server-resolved alien instance — same combat
                      // primitives (hp/atk/def/spd) so the engine math
                      // doesn't care, but typed separately so UI can
                      // render alien glyphs / portraits.

NvTeam now becomes a discriminated union:
  | { kind: "human";  name: string; units: NvUnit[] }
  | { kind: "alien";  name: string; units: NvAlienUnit[]; threatTier: number }

NvBattleSimRequest:
  a: NvTeam (kind: "human")    // player team — always human
  b: NvTeam (kind: "alien")    // opponent — always alien
```

Engine math is unchanged. Sim still operates on stat blocks. Only the
**identity / visual layer** of team B changes.

### Deck builder (web + mobile)

- `buildRandomEnemyTeam` becomes `buildAlienWaveTeam` and pulls from a
  new alien catalog file (`packages/content/aliens.ts` or similar).
- The `"mirror"` preset is removed. Replacements: `"swarm"` (low-tier
  many-alien wave), `"elite"` (mid-tier, fewer-but-tougher), `"boss"`
  (one Maw-class boss + flanking minions).
- Enemy preview UI gets alien art (12 placeholder SVGs ready in
  `art/PROMPTS-DALLE-ALIENS.md` once generated).

### Vocabulary / copy

- "Opponent" / "rival" → "alien threat" / "alien wave" / "incursion".
- Anim intents stay verb-correct (`attack`, `hit`, `death`) — these
  describe the mechanic, not who is hitting whom. No change required.
- `bleed` status: rename to `corrosion` to avoid "Earth-blood" connotation.
  Server contract change; coordinate version bump.
- Team B name `"RIFT"` is keepable but consider standardising to
  `"Alien Wave"` / `"Hivekin Swarm"` per faction.

### UI changes

- Setup screen: "pick your team" stays. "Choose enemy preset" stays but
  options are now swarm / elite / boss instead of demo / mirror.
- Battle replay: alien sprites use V3 art; player sprites unchanged.
- Result modal: copy reads "Repelled the alien wave" / "Overrun by the
  Hivelord" rather than "Defeated team RIFT".

---

## Concrete refactor steps (proposed order)

### Step 1 — Protocol & engine (~3 hours)

1. Add `NvAlienArchetypeId` + `NvAlienArchetypeDef` + `NvAlienUnit` types
   in `packages/protocol/src/v1/battle.ts`.
2. Convert `NvTeam` to a discriminated union with `kind: "human" | "alien"`.
3. Add `packages/content/src/aliens.ts` — 12 alien archetypes (mirror
   the Nyrduel boss roster: Skitterling/Hivekin/Glyphbeast/Riftborn/
   Voidweaver/Crystallarch + boss tier — adapt stats for team play).
4. Update `services/gateway/src/sim/battleSim.ts` if it pattern-matches
   on team kind (it doesn't currently — should be a no-op).
5. Rename the `bleed` status to `corrosion` in protocol + sim + UI;
   bump the protocol minor / log a migration note.
6. Tests: extend `battleSim.test.ts` with at least one human-vs-alien
   match assertion.

### Step 2 — Companion-web (~3 hours)

1. Replace `buildRandomEnemyTeam` with `buildAlienWaveTeam(seed, tier)`
   in `apps/companion-web/src/ui/deckBuilder.ts`.
2. Remove `"mirror"` preset; add `"swarm"`, `"elite"`, `"boss"`.
3. Update `App.tsx` strings ("opponent" → "alien threat", etc.) and
   localize via existing i18n hook if present.
4. Wire the 12 alien SVG placeholders (copy from `nyrduel/apps/web/
   public/aliens/` initially) into the enemy preview component.

### Step 3 — Companion-mobile (~2 hours)

Mirror the changes from Step 2. Same deckBuilder pattern likely lives
in the mobile app's UI layer; fewer screens to touch.

### Step 4 — Documentation + copy (~30 min)

1. Update README, CHANGELOG, `docs/COMBAT_M1.md` to reference the
   alien antagonist exclusively.
2. Bump version to v0.2.0 (this is a player-facing semantics change).
3. Update `docs/RESPONSIBLE_DESIGN.md` — make the "no human-vs-human
   combat" rule explicit and link it to the studio policy memo.

### Step 5 — Audit + ship (~1 hour)

Read every `*.tsx` / `*.ts` referencing "enemy", "rival", "opponent",
"versus", "fight", "mirror"; confirm nothing in production code still
implies a human antagonist. Build, test, deploy.

**Total estimate:** ~9–10 hours of focused work.

---

## Backwards-compat notes

- Save / replay format: any old replay where team B was a human team
  should still play (battleSim doesn't care). Old replays will render
  with "human" sprites for team B for nostalgia / forensic value but
  no new battles produce them.
- Daily seed: today's seed becomes today's alien wave seed. Existing
  daily-mode users see one transition day where opponent visuals shift
  from human to alien. Communicate via in-game banner ("Alien threat
  arrives today") for one cycle.
- Web3 / USDTg payments: unaffected — the payment flow doesn't touch
  combat identity.

---

## Risks

- **`mirror` preset removal** — some testers / streamers used it for
  team-balance-checks. Replace with `"clone-test"` flag in dev-only
  builds rather than removing entirely.
- **Localized copy** — strings in `locales/*.json` must be updated in
  lockstep; a stale string saying "rakip takım" / "enemy team" with the
  new alien art looks broken. Schedule the string sweep with the code
  refactor.
- **Existing player saves** — none of the saved data references an
  archetype id by name on the opponent side, so saves remain valid.

---

## Sign-off checklist (before I touch code)

- [ ] Approve the wire-shape change (`NvTeam` becomes a discriminated
      union).
- [ ] Approve removing the `mirror` preset.
- [ ] Approve renaming `bleed` → `corrosion`.
- [ ] Approve protocol bump to v0.2.0.
- [ ] Approve estimated ~10 hours of work spread across the planned 5
      steps.
- [ ] Approve targeting Nyrvexis next (after this plan), then Nyrvexa.

When you sign off, I execute the refactor in the order above and ship
each step as its own commit so the diff stays reviewable.
