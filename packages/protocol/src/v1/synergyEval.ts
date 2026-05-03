import type { NvActiveSynergy, NvUnit } from "./battle.js";
import type {
  NvStatBonus,
  NvSynergyRule,
  NvUnitArchetypeDef,
  NvUnitFaction,
  NvUnitRole
} from "./content.js";

export type SynergyCatalogView = {
  archetypeById: Map<string, NvUnitArchetypeDef>;
  synergies: NvSynergyRule[];
};

function compareSynergy(a: NvActiveSynergy, b: NvActiveSynergy): number {
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
}

function addBonus(into: NvStatBonus, add: NvStatBonus): void {
  if (add.hpFlat) into.hpFlat = (into.hpFlat ?? 0) + add.hpFlat;
  if (add.atkFlat) into.atkFlat = (into.atkFlat ?? 0) + add.atkFlat;
  if (add.defFlat) into.defFlat = (into.defFlat ?? 0) + add.defFlat;
  if (add.spdFlat) into.spdFlat = (into.spdFlat ?? 0) + add.spdFlat;
}

/**
 * Evaluate which synergies fire for a team.
 * - Counts each squad slot once (duplicate archetypes still count separately)
 * - Among same group (role/faction) only the highest minCount tier fires
 * - Result is sorted by id for deterministic wire format
 */
export function evaluateTeamSynergies(
  units: NvUnit[],
  catalog: SynergyCatalogView
): { active: NvActiveSynergy[]; teamBonus: NvStatBonus } {
  const roleCount = new Map<NvUnitRole, number>();
  const factionCount = new Map<NvUnitFaction, number>();

  for (const u of units) {
    const def = catalog.archetypeById.get(u.archetype);
    if (!def) continue;
    roleCount.set(def.role, (roleCount.get(def.role) ?? 0) + 1);
    if (def.faction) {
      factionCount.set(def.faction, (factionCount.get(def.faction) ?? 0) + 1);
    }
  }

  const teamBonus: NvStatBonus = {};
  const tieredByGroup = new Map<string, NvSynergyRule>();

  for (const rule of catalog.synergies) {
    const group = rule.requireRole ?? rule.requireFaction;
    if (!group) continue;
    const have = rule.requireRole
      ? roleCount.get(rule.requireRole) ?? 0
      : factionCount.get(rule.requireFaction!) ?? 0;
    if (have < rule.minCount) continue;
    const existing = tieredByGroup.get(group);
    if (!existing || rule.minCount > existing.minCount) {
      tieredByGroup.set(group, rule);
    }
  }

  const active: NvActiveSynergy[] = [];
  for (const rule of tieredByGroup.values()) {
    const count = rule.requireRole
      ? roleCount.get(rule.requireRole) ?? 0
      : factionCount.get(rule.requireFaction!) ?? 0;
    active.push({ id: rule.id, name: rule.name, count });
    addBonus(teamBonus, rule.bonus);
  }

  active.sort(compareSynergy);
  return { active, teamBonus };
}

export function applyBonusToUnit(u: NvUnit, bonus: NvStatBonus): NvUnit {
  return {
    ...u,
    hp: Math.max(1, (u.hp | 0) + (bonus.hpFlat ?? 0)),
    atk: Math.max(0, (u.atk | 0) + (bonus.atkFlat ?? 0)),
    def: Math.max(0, (u.def | 0) + (bonus.defFlat ?? 0)),
    spd: Math.max(1, (u.spd | 0) + (bonus.spdFlat ?? 0))
  };
}
