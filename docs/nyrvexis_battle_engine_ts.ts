/*
  Nyrvexis Battle Engine
  Async Auto-Battler + Collection Meta

  Goal:
  - Deterministic battle simulation
  - TypeScript first
  - WebGL/PixiJS compatible
  - No rendering dependency
  - Easy to test, replay, and balance
*/

// =====================================================
// 1. TYPES
// =====================================================

export type TeamId = "player" | "enemy";

export type UnitRole =
  | "tank"
  | "dps"
  | "assassin"
  | "ranged"
  | "mage"
  | "support"
  | "healer"
  | "control";

export type UnitTrait =
  | "void"
  | "tech"
  | "nature"
  | "inferno"
  | "order"
  | "chaos";

export type BattleEventType =
  | "battle_start"
  | "unit_spawn"
  | "attack"
  | "damage"
  | "heal"
  | "death"
  | "skill_cast"
  | "buff_applied"
  | "battle_end";

export interface Position {
  x: number;
  y: number;
}

export interface UnitDefinition {
  id: string;
  name: string;
  role: UnitRole;
  trait: UnitTrait;
  maxHp: number;
  attack: number;
  defense: number;
  attackSpeed: number; // attacks per second
  range: number;
  moveSpeed: number;
  skillId: string;
}

export interface BattleUnit extends UnitDefinition {
  instanceId: string;
  teamId: TeamId;
  hp: number;
  position: Position;
  targetId: string | null;
  nextAttackAt: number;
  skillCooldownUntil: number;
  alive: boolean;
  modifiers: StatModifiers;
}

export interface StatModifiers {
  damageMultiplier: number;
  defenseMultiplier: number;
  attackSpeedMultiplier: number;
  healingMultiplier: number;
  critChance: number;
  critMultiplier: number;
}

export interface TeamInput {
  teamId: TeamId;
  units: Array<{
    definition: UnitDefinition;
    position: Position;
  }>;
}

export interface BattleInput {
  seed: number;
  maxDurationSeconds: number;
  playerTeam: TeamInput;
  enemyTeam: TeamInput;
}

export interface BattleEvent {
  time: number;
  type: BattleEventType;
  sourceId?: string;
  targetId?: string;
  value?: number;
  message: string;
}

export interface BattleResult {
  winner: TeamId | "draw";
  duration: number;
  events: BattleEvent[];
  finalUnits: BattleUnit[];
}

// =====================================================
// 2. SEEDED RNG
// =====================================================

export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed || 123456789;
  }

  next(): number {
    // Linear congruential generator
    this.state = (1664525 * this.state + 1013904223) % 4294967296;
    return this.state / 4294967296;
  }

  chance(probability: number): boolean {
    return this.next() < probability;
  }

  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
}

// =====================================================
// 3. STARTER UNITS
// =====================================================

export const STARTER_UNITS: UnitDefinition[] = [
  {
    id: "void_reaver",
    name: "Void Reaver",
    role: "dps",
    trait: "void",
    maxHp: 110,
    attack: 24,
    defense: 6,
    attackSpeed: 1.1,
    range: 1.4,
    moveSpeed: 1.8,
    skillId: "shadow_slash",
  },
  {
    id: "void_assassin",
    name: "Void Assassin",
    role: "assassin",
    trait: "void",
    maxHp: 80,
    attack: 32,
    defense: 3,
    attackSpeed: 1.35,
    range: 1.2,
    moveSpeed: 2.4,
    skillId: "backline_crit",
  },
  {
    id: "pulse_sniper",
    name: "Pulse Sniper",
    role: "ranged",
    trait: "tech",
    maxHp: 75,
    attack: 30,
    defense: 2,
    attackSpeed: 1.0,
    range: 5.5,
    moveSpeed: 1.3,
    skillId: "beam_shot",
  },
  {
    id: "mech_guardian",
    name: "Mech Guardian",
    role: "tank",
    trait: "tech",
    maxHp: 170,
    attack: 14,
    defense: 14,
    attackSpeed: 0.75,
    range: 1.2,
    moveSpeed: 1.2,
    skillId: "taunt_shield",
  },
  {
    id: "bloom_healer",
    name: "Bloom Healer",
    role: "healer",
    trait: "nature",
    maxHp: 85,
    attack: 10,
    defense: 4,
    attackSpeed: 0.8,
    range: 4.0,
    moveSpeed: 1.4,
    skillId: "group_heal",
  },
  {
    id: "root_warden",
    name: "Root Warden",
    role: "control",
    trait: "nature",
    maxHp: 120,
    attack: 16,
    defense: 8,
    attackSpeed: 0.85,
    range: 3.2,
    moveSpeed: 1.1,
    skillId: "root_bind",
  },
  {
    id: "flame_berserker",
    name: "Flame Berserker",
    role: "dps",
    trait: "inferno",
    maxHp: 105,
    attack: 28,
    defense: 5,
    attackSpeed: 1.2,
    range: 1.3,
    moveSpeed: 1.9,
    skillId: "burn_aura",
  },
  {
    id: "ember_titan",
    name: "Ember Titan",
    role: "tank",
    trait: "inferno",
    maxHp: 185,
    attack: 18,
    defense: 12,
    attackSpeed: 0.7,
    range: 1.2,
    moveSpeed: 1.0,
    skillId: "ember_explosion",
  },
  {
    id: "light_paladin",
    name: "Light Paladin",
    role: "support",
    trait: "order",
    maxHp: 145,
    attack: 18,
    defense: 10,
    attackSpeed: 0.9,
    range: 1.5,
    moveSpeed: 1.4,
    skillId: "holy_shield",
  },
  {
    id: "chaos_duelist",
    name: "Chaos Duelist",
    role: "assassin",
    trait: "chaos",
    maxHp: 95,
    attack: 27,
    defense: 4,
    attackSpeed: 1.4,
    range: 1.2,
    moveSpeed: 2.1,
    skillId: "chaos_burst",
  },
];

// =====================================================
// 4. SYNERGY SYSTEM
// =====================================================

export function defaultModifiers(): StatModifiers {
  return {
    damageMultiplier: 1,
    defenseMultiplier: 1,
    attackSpeedMultiplier: 1,
    healingMultiplier: 1,
    critChance: 0.05,
    critMultiplier: 1.5,
  };
}

export function applyTeamSynergies(units: BattleUnit[]): void {
  const teams: Record<TeamId, BattleUnit[]> = {
    player: units.filter((u) => u.teamId === "player"),
    enemy: units.filter((u) => u.teamId === "enemy"),
  };

  for (const teamUnits of Object.values(teams)) {
    const traitCounts = countTraits(teamUnits);

    for (const unit of teamUnits) {
      const count = traitCounts[unit.trait] ?? 0;

      if (unit.trait === "void") {
        if (count >= 4) unit.modifiers.damageMultiplier += 0.3;
        else if (count >= 2) unit.modifiers.damageMultiplier += 0.15;
      }

      if (unit.trait === "tech") {
        if (count >= 4) unit.modifiers.attackSpeedMultiplier += 0.25;
        else if (count >= 2) unit.modifiers.attackSpeedMultiplier += 0.12;
      }

      if (unit.trait === "nature") {
        if (count >= 4) unit.modifiers.healingMultiplier += 0.35;
        else if (count >= 2) unit.modifiers.healingMultiplier += 0.18;
      }

      if (unit.trait === "inferno") {
        if (count >= 4) unit.modifiers.damageMultiplier += 0.25;
        else if (count >= 2) unit.modifiers.damageMultiplier += 0.12;
      }

      if (unit.trait === "order") {
        if (count >= 4) unit.modifiers.defenseMultiplier += 0.3;
        else if (count >= 2) unit.modifiers.defenseMultiplier += 0.15;
      }

      if (unit.trait === "chaos") {
        if (count >= 4) unit.modifiers.critChance += 0.25;
        else if (count >= 2) unit.modifiers.critChance += 0.12;
      }
    }
  }
}

function countTraits(units: BattleUnit[]): Partial<Record<UnitTrait, number>> {
  const counts: Partial<Record<UnitTrait, number>> = {};
  for (const unit of units) {
    counts[unit.trait] = (counts[unit.trait] ?? 0) + 1;
  }
  return counts;
}

// =====================================================
// 5. BATTLE ENGINE
// =====================================================

export class BattleEngine {
  private rng: SeededRandom;
  private events: BattleEvent[] = [];
  private units: BattleUnit[] = [];
  private time = 0;
  private readonly tickRate = 0.2; // seconds

  constructor(private readonly input: BattleInput) {
    this.rng = new SeededRandom(input.seed);
  }

  simulate(): BattleResult {
    this.units = this.createBattleUnits();
    applyTeamSynergies(this.units);

    this.emit({
      type: "battle_start",
      message: "Battle started.",
    });

    for (const unit of this.units) {
      this.emit({
        type: "unit_spawn",
        sourceId: unit.instanceId,
        message: `${unit.name} entered the battle.`,
      });
    }

    while (this.time < this.input.maxDurationSeconds) {
      const winner = this.getWinner();
      if (winner) {
        this.emit({
          type: "battle_end",
          message: `${winner} wins.`,
        });

        return this.createResult(winner);
      }

      this.step();
      this.time += this.tickRate;
    }

    this.emit({
      type: "battle_end",
      message: "Battle ended in a draw.",
    });

    return this.createResult("draw");
  }

  private createBattleUnits(): BattleUnit[] {
    const allInputs = [this.input.playerTeam, this.input.enemyTeam];
    const result: BattleUnit[] = [];

    for (const team of allInputs) {
      team.units.forEach((unitInput, index) => {
        result.push({
          ...unitInput.definition,
          instanceId: `${team.teamId}_${unitInput.definition.id}_${index}`,
          teamId: team.teamId,
          hp: unitInput.definition.maxHp,
          position: { ...unitInput.position },
          targetId: null,
          nextAttackAt: this.rng.range(0.2, 0.7),
          skillCooldownUntil: this.rng.range(2.0, 4.0),
          alive: true,
          modifiers: defaultModifiers(),
        });
      });
    }

    return result;
  }

  private step(): void {
    const activeUnits = this.units.filter((u) => u.alive);

    for (const unit of activeUnits) {
      const target = this.findTarget(unit);
      if (!target) continue;

      unit.targetId = target.instanceId;

      const distance = getDistance(unit.position, target.position);

      if (distance > unit.range) {
        this.moveTowards(unit, target);
        continue;
      }

      if (this.time >= unit.nextAttackAt) {
        this.performAttack(unit, target);
        const attackInterval = 1 / (unit.attackSpeed * unit.modifiers.attackSpeedMultiplier);
        unit.nextAttackAt = this.time + attackInterval;
      }

      if (this.time >= unit.skillCooldownUntil) {
        this.castSkill(unit, target);
        unit.skillCooldownUntil = this.time + this.getSkillCooldown(unit.skillId);
      }
    }
  }

  private findTarget(unit: BattleUnit): BattleUnit | null {
    const enemies = this.units.filter((u) => u.alive && u.teamId !== unit.teamId);
    if (enemies.length === 0) return null;

    if (unit.role === "assassin") {
      const backline = enemies
        .slice()
        .sort((a, b) => (unit.teamId === "player" ? b.position.x - a.position.x : a.position.x - b.position.x));
      return backline[0];
    }

    enemies.sort((a, b) => getDistance(unit.position, a.position) - getDistance(unit.position, b.position));
    return enemies[0];
  }

  private moveTowards(unit: BattleUnit, target: BattleUnit): void {
    const dx = target.position.x - unit.position.x;
    const dy = target.position.y - unit.position.y;
    const distance = Math.max(getDistance(unit.position, target.position), 0.001);
    const movement = unit.moveSpeed * this.tickRate;

    unit.position.x += (dx / distance) * movement;
    unit.position.y += (dy / distance) * movement;
  }

  private performAttack(attacker: BattleUnit, target: BattleUnit): void {
    const isCrit = this.rng.chance(attacker.modifiers.critChance);
    const baseDamage = attacker.attack * attacker.modifiers.damageMultiplier;
    const critDamage = isCrit ? baseDamage * attacker.modifiers.critMultiplier : baseDamage;
    const mitigatedDamage = Math.max(
      1,
      Math.round(critDamage - target.defense * target.modifiers.defenseMultiplier * 0.5)
    );

    this.emit({
      type: "attack",
      sourceId: attacker.instanceId,
      targetId: target.instanceId,
      message: `${attacker.name} attacks ${target.name}.`,
    });

    this.applyDamage(attacker, target, mitigatedDamage);
  }

  private applyDamage(source: BattleUnit, target: BattleUnit, amount: number): void {
    if (!target.alive) return;

    target.hp = Math.max(0, target.hp - amount);

    this.emit({
      type: "damage",
      sourceId: source.instanceId,
      targetId: target.instanceId,
      value: amount,
      message: `${target.name} takes ${amount} damage.`,
    });

    if (target.hp <= 0) {
      target.alive = false;
      target.targetId = null;

      this.emit({
        type: "death",
        sourceId: source.instanceId,
        targetId: target.instanceId,
        message: `${target.name} was defeated.`,
      });
    }
  }

  private heal(source: BattleUnit, target: BattleUnit, amount: number): void {
    if (!target.alive) return;

    const finalHeal = Math.round(amount * source.modifiers.healingMultiplier);
    target.hp = Math.min(target.maxHp, target.hp + finalHeal);

    this.emit({
      type: "heal",
      sourceId: source.instanceId,
      targetId: target.instanceId,
      value: finalHeal,
      message: `${source.name} heals ${target.name} for ${finalHeal}.`,
    });
  }

  private castSkill(unit: BattleUnit, target: BattleUnit): void {
    this.emit({
      type: "skill_cast",
      sourceId: unit.instanceId,
      targetId: target.instanceId,
      message: `${unit.name} casts ${unit.skillId}.`,
    });

    switch (unit.skillId) {
      case "shadow_slash": {
        const enemies = this.getAliveEnemies(unit).slice(0, 2);
        for (const enemy of enemies) this.applyDamage(unit, enemy, Math.round(unit.attack * 1.2));
        break;
      }

      case "backline_crit": {
        this.applyDamage(unit, target, Math.round(unit.attack * 1.8));
        break;
      }

      case "beam_shot": {
        this.applyDamage(unit, target, Math.round(unit.attack * 1.6));
        break;
      }

      case "taunt_shield": {
        unit.hp = Math.min(unit.maxHp, unit.hp + 25);
        this.emit({
          type: "buff_applied",
          sourceId: unit.instanceId,
          value: 25,
          message: `${unit.name} gains a shield-like heal.`,
        });
        break;
      }

      case "group_heal": {
        const allies = this.getAliveAllies(unit).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp).slice(0, 3);
        for (const ally of allies) this.heal(unit, ally, 28);
        break;
      }

      case "root_bind": {
        this.applyDamage(unit, target, Math.round(unit.attack * 1.1));
        target.nextAttackAt += 0.8;
        this.emit({
          type: "buff_applied",
          sourceId: unit.instanceId,
          targetId: target.instanceId,
          message: `${target.name} is delayed by roots.`,
        });
        break;
      }

      case "burn_aura": {
        const nearby = this.getAliveEnemies(unit).filter((enemy) => getDistance(unit.position, enemy.position) <= 2.0);
        for (const enemy of nearby) this.applyDamage(unit, enemy, 12);
        break;
      }

      case "ember_explosion": {
        const nearby = this.getAliveEnemies(unit).filter((enemy) => getDistance(unit.position, enemy.position) <= 2.4);
        for (const enemy of nearby) this.applyDamage(unit, enemy, 18);
        break;
      }

      case "holy_shield": {
        const weakestAlly = this.getAliveAllies(unit).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
        if (weakestAlly) this.heal(unit, weakestAlly, 35);
        break;
      }

      case "chaos_burst": {
        const multiplier = this.rng.chance(0.5) ? 2.2 : 1.1;
        this.applyDamage(unit, target, Math.round(unit.attack * multiplier));
        break;
      }

      default: {
        this.applyDamage(unit, target, Math.round(unit.attack * 1.25));
        break;
      }
    }
  }

  private getSkillCooldown(skillId: string): number {
    const cooldowns: Record<string, number> = {
      shadow_slash: 5,
      backline_crit: 6,
      beam_shot: 5.5,
      taunt_shield: 7,
      group_heal: 6.5,
      root_bind: 6,
      burn_aura: 5,
      ember_explosion: 7,
      holy_shield: 6,
      chaos_burst: 5,
    };

    return cooldowns[skillId] ?? 6;
  }

  private getAliveEnemies(unit: BattleUnit): BattleUnit[] {
    return this.units.filter((u) => u.alive && u.teamId !== unit.teamId);
  }

  private getAliveAllies(unit: BattleUnit): BattleUnit[] {
    return this.units.filter((u) => u.alive && u.teamId === unit.teamId);
  }

  private getWinner(): TeamId | null {
    const playerAlive = this.units.some((u) => u.alive && u.teamId === "player");
    const enemyAlive = this.units.some((u) => u.alive && u.teamId === "enemy");

    if (playerAlive && !enemyAlive) return "player";
    if (!playerAlive && enemyAlive) return "enemy";
    return null;
  }

  private emit(event: Omit<BattleEvent, "time">): void {
    this.events.push({
      time: Number(this.time.toFixed(2)),
      ...event,
    });
  }

  private createResult(winner: TeamId | "draw"): BattleResult {
    return {
      winner,
      duration: Number(this.time.toFixed(2)),
      events: this.events,
      finalUnits: this.units.map((u) => ({ ...u, position: { ...u.position } })),
    };
  }
}

// =====================================================
// 6. HELPERS
// =====================================================

export function getDistance(a: Position, b: Position): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function getUnitById(id: string): UnitDefinition {
  const unit = STARTER_UNITS.find((u) => u.id === id);
  if (!unit) throw new Error(`Unknown unit id: ${id}`);
  return unit;
}

// =====================================================
// 7. EXAMPLE USAGE
// =====================================================

export function createDemoBattleInput(): BattleInput {
  return {
    seed: 424242,
    maxDurationSeconds: 120,
    playerTeam: {
      teamId: "player",
      units: [
        { definition: getUnitById("mech_guardian"), position: { x: 1, y: 1 } },
        { definition: getUnitById("void_reaver"), position: { x: 1, y: 2 } },
        { definition: getUnitById("pulse_sniper"), position: { x: 0, y: 2 } },
        { definition: getUnitById("bloom_healer"), position: { x: 0, y: 1 } },
      ],
    },
    enemyTeam: {
      teamId: "enemy",
      units: [
        { definition: getUnitById("ember_titan"), position: { x: 8, y: 1 } },
        { definition: getUnitById("flame_berserker"), position: { x: 8, y: 2 } },
        { definition: getUnitById("chaos_duelist"), position: { x: 9, y: 1 } },
        { definition: getUnitById("root_warden"), position: { x: 9, y: 2 } },
      ],
    },
  };
}

export function runDemoBattle(): BattleResult {
  const engine = new BattleEngine(createDemoBattleInput());
  return engine.simulate();
}
