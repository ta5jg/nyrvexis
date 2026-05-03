/*
  Nyrvexis PixiJS Animation System (v8) — natural-motion build

  Goals:
  - Apply animation principles (anticipation, follow-through, squash & stretch,
    arc, ease, secondary motion) on top of card-style unit bodies.
  - Per-archetype "weight" so brutes feel heavy and rogues feel snappy without
    needing per-frame artwork.
  - Deterministic-from-events: a given replay tick always produces the same
    motion shape (no randomness in steady state).
*/

import { Container, Graphics, Text } from "pixi.js";

export type AnimationState = "idle" | "move" | "attack" | "skill" | "hit" | "die";

export type ArchetypeId = "soldier" | "brute" | "rogue" | "archer" | "mage" | "support" | string;

export interface Vec2 {
  x: number;
  y: number;
}

export interface UnitVisualOptions {
  id: string;
  name: string;
  body: Container;
  team: "A" | "B";
  x: number;
  y: number;
  bodyScale?: number;
  archetype?: ArchetypeId;
}

export interface UnitAnimationCommand {
  state: AnimationState;
  target?: Vec2;
  duration?: number;
  onComplete?: () => void;
}

// =============================================================================
// Per-archetype motion profile — controls "feel" without changing artwork.
// =============================================================================

interface MotionProfile {
  /** Multiplies command durations (>1 = heavier/slower). */
  durationMul: number;
  /** Lunge distance multiplier on attack. */
  lungeMul: number;
  /** Anticipation pull-back amount in px. */
  anticipationPx: number;
  /** Idle breathing amplitude (vertical scale delta, e.g. 0.015 = ±1.5%). */
  breathAmp: number;
  /** Idle breathing period in seconds. */
  breathPeriod: number;
  /** Spring stiffness for recovery (0..1, higher = snappier). */
  recoverySnap: number;
  /** Tilt magnitude on hit (radians). */
  hitTilt: number;
}

const MOTION_DEFAULT: MotionProfile = {
  durationMul: 1,
  lungeMul: 1,
  anticipationPx: 6,
  breathAmp: 0.014,
  breathPeriod: 2.4,
  recoverySnap: 0.6,
  hitTilt: 0.18
};

const MOTION_BY_ARCHETYPE: Record<string, Partial<MotionProfile>> = {
  brute:   { durationMul: 1.25, lungeMul: 1.25, anticipationPx: 9, breathAmp: 0.018, breathPeriod: 3.0, recoverySnap: 0.45, hitTilt: 0.12 },
  rogue:   { durationMul: 0.78, lungeMul: 0.85, anticipationPx: 4, breathAmp: 0.011, breathPeriod: 1.8, recoverySnap: 0.78, hitTilt: 0.24 },
  archer:  { durationMul: 0.95, lungeMul: 0.55, anticipationPx: 7, breathAmp: 0.012, breathPeriod: 2.2, recoverySnap: 0.62, hitTilt: 0.20 },
  soldier: { durationMul: 1.05, lungeMul: 1.00, anticipationPx: 6, breathAmp: 0.013, breathPeriod: 2.4, recoverySnap: 0.58, hitTilt: 0.18 },
  mage:    { durationMul: 1.10, lungeMul: 0.60, anticipationPx: 5, breathAmp: 0.016, breathPeriod: 2.6, recoverySnap: 0.55, hitTilt: 0.22 },
  support: { durationMul: 1.00, lungeMul: 0.70, anticipationPx: 5, breathAmp: 0.014, breathPeriod: 2.3, recoverySnap: 0.6,  hitTilt: 0.20 }
};

function profileFor(archetype: ArchetypeId | undefined): MotionProfile {
  if (!archetype) return MOTION_DEFAULT;
  const override = MOTION_BY_ARCHETYPE[archetype];
  return override ? { ...MOTION_DEFAULT, ...override } : MOTION_DEFAULT;
}

// =============================================================================
// UnitVisual — owns the body Container and its motion state.
// =============================================================================

export class UnitVisual {
  public readonly container: Container;
  public readonly body: Container;
  public readonly nameText: Text;
  public readonly hpBarBg: Graphics;
  public readonly hpBarFill: Graphics;

  public id: string;
  public state: AnimationState = "idle";
  public alive = true;

  private team: "A" | "B";
  private baseX: number;
  private baseY: number;
  private idleClock = 0;
  private commandTime = 0;
  private commandDuration = 0;
  private commandTarget: Vec2 | null = null;
  private commandStart: Vec2 | null = null;
  private onComplete?: () => void;
  private maxHp = 100;
  private hp = 100;
  private bodyBaseScaleX: number;
  private bodyBaseScaleY: number;
  private profile: MotionProfile;
  /** Persistent micro-tilt that decays toward 0 — used so hits leave a residue. */
  private tiltResidue = 0;
  /** When the next idle micro-glance should fire (idleClock seconds). */
  private nextGlanceAt: number;
  private glanceUntil = 0;
  private glanceDir = 1;

  constructor(options: UnitVisualOptions) {
    this.id = options.id;
    this.baseX = options.x;
    this.baseY = options.y;
    this.profile = profileFor(options.archetype);
    this.nextGlanceAt = 3 + (hashStr(options.id) % 1000) / 500; // 3.0–5.0s, deterministic per-id

    this.container = new Container();
    this.container.x = options.x;
    this.container.y = options.y;

    this.team = options.team;
    this.body = options.body;
    const bs = options.bodyScale ?? 1;
    this.body.scale.set(bs);
    // Body root stays unflipped — animations use this.facingDir for direction
    // and PixiArena flips only the inner art so frames/icons stay correct.
    this.bodyBaseScaleX = this.body.scale.x;
    this.bodyBaseScaleY = this.body.scale.y;

    this.nameText = new Text({
      text: options.name,
      style: {
        fontFamily: "system-ui, -apple-system, ui-sans-serif",
        fontSize: 13,
        fill: 0xffffff,
        fontWeight: "600",
        stroke: { color: 0x000000, width: 4 },
        align: "center"
      }
    });
    this.nameText.anchor.set(0.5);
    this.nameText.y = 44;

    this.hpBarBg = new Graphics();
    this.hpBarFill = new Graphics();

    this.container.addChild(this.body);
    this.container.addChild(this.hpBarBg);
    this.container.addChild(this.hpBarFill);
    this.container.addChild(this.nameText);

    this.drawHpBar();
  }

  public syncSlotPosition(x: number, y: number): void {
    if (this.state === "move") return;
    this.baseX = x;
    this.baseY = y;
    this.container.x = x;
    this.container.y = y;
  }

  public setHp(current: number, max: number): void {
    this.hp = Math.max(0, current);
    this.maxHp = Math.max(1, max);
    this.drawHpBar();
  }

  public play(command: UnitAnimationCommand): void {
    if (!this.alive && command.state !== "die") return;

    this.state = command.state;
    this.commandTime = 0;
    this.commandDuration =
      (command.duration ?? this.getDefaultDuration(command.state)) * this.profile.durationMul;
    this.commandTarget = command.target ?? null;
    this.commandStart = { x: this.container.x, y: this.container.y };
    this.onComplete = command.onComplete;

    if (command.state === "die") this.alive = false;
  }

  public update(deltaSeconds: number): void {
    // Always advance idle clock so breathing & residue keep ticking.
    this.idleClock += deltaSeconds;
    // Tilt residue decays toward 0 with critical-damped feel.
    this.tiltResidue *= Math.exp(-deltaSeconds * 6);

    switch (this.state) {
      case "idle":
        this.updateIdle(deltaSeconds);
        break;
      case "move":
        this.updateMove(deltaSeconds);
        break;
      case "attack":
        this.updateAttack(deltaSeconds);
        break;
      case "skill":
        this.updateSkill(deltaSeconds);
        break;
      case "hit":
        this.updateHit(deltaSeconds);
        break;
      case "die":
        this.updateDie(deltaSeconds);
        break;
    }
  }

  public resetToIdle(): void {
    if (!this.alive) return;
    this.state = "idle";
    this.body.tint = 0xffffff;
    this.body.alpha = 1;
    this.body.x = 0;
    // Rotation is owned by idle/hit residue from here on.
    this.body.scale.x = this.bodyBaseScaleX;
    this.body.scale.y = this.bodyBaseScaleY;
    this.container.y = this.baseY;
  }

  // ---------------------------------------------------------------------------
  // States
  // ---------------------------------------------------------------------------

  private updateIdle(_dt: number): void {
    // Breathing: scale.y oscillates by breathAmp; scale.x compensates (squash).
    const phase = (this.idleClock / this.profile.breathPeriod) * Math.PI * 2;
    const breath = Math.sin(phase) * this.profile.breathAmp;
    this.body.scale.x = this.bodyBaseScaleX * (1 - breath * 0.5);
    this.body.scale.y = this.bodyBaseScaleY * (1 + breath);

    // Subtle vertical bob (≤1px) so it doesn't read as a static card.
    this.container.y = this.baseY + Math.sin(phase) * 0.6;

    // Micro-glance: every nextGlanceAt seconds, brief tilt then back.
    if (this.idleClock >= this.nextGlanceAt && this.glanceUntil === 0) {
      this.glanceUntil = this.idleClock + 0.45;
      this.glanceDir = ((hashStr(this.id) + Math.floor(this.idleClock)) & 1) ? 1 : -1;
    }
    if (this.idleClock < this.glanceUntil) {
      const g = 1 - (this.glanceUntil - this.idleClock) / 0.45;
      const lobe = Math.sin(g * Math.PI); // 0 → 1 → 0 across the glance
      this.body.rotation = this.tiltResidue + lobe * 0.05 * this.glanceDir;
    } else {
      if (this.glanceUntil !== 0) {
        // Schedule next glance 3–5s later (deterministic from clock + id).
        this.nextGlanceAt = this.idleClock + 3 + ((hashStr(this.id + ":" + Math.floor(this.idleClock)) % 200) / 100);
        this.glanceUntil = 0;
      }
      this.body.rotation = this.tiltResidue;
    }
  }

  private updateMove(dt: number): void {
    this.commandTime += dt;
    const t = clamp01(this.commandTime / this.commandDuration);

    if (this.commandStart && this.commandTarget) {
      // Arc: lift body slightly so it reads as a bound, not a slide.
      const linX = lerp(this.commandStart.x, this.commandTarget.x, easeInOutCubic(t));
      const linY = lerp(this.commandStart.y, this.commandTarget.y, easeInOutCubic(t));
      const arc = -Math.sin(t * Math.PI) * 8; // up to 8px lift mid-flight
      this.container.x = linX;
      this.container.y = linY + arc;

      // Lean into direction: rotate body toward travel.
      const dx = this.commandTarget.x - this.commandStart.x;
      const lean = dx > 0 ? 0.06 : -0.06;
      this.body.rotation = lean * Math.sin(t * Math.PI);
    }

    // Landing squash on the last 18% of the move.
    if (t > 0.82) {
      const land = (t - 0.82) / 0.18;
      const squash = 1 - land * 0.08;
      this.body.scale.y = this.bodyBaseScaleY * squash;
      this.body.scale.x = this.bodyBaseScaleX * (1 + (1 - squash) * 0.6);
    }

    if (t >= 1) this.completeAndIdle();
  }

  private get facingDir(): number {
    return this.team === "B" ? -1 : 1;
  }

  private updateAttack(dt: number): void {
    this.commandTime += dt;
    const t = clamp01(this.commandTime / this.commandDuration);
    const dir = this.facingDir;
    const lungeMax = 22 * this.profile.lungeMul;

    // Three phases: anticipation (0..0.25), strike (0.25..0.55), recovery (0.55..1)
    if (t < 0.25) {
      // Pull back against attack direction (anticipation).
      const a = t / 0.25;
      const pull = -this.profile.anticipationPx * dir * easeOutQuad(a);
      this.body.x = pull;
      // Compress vertically a bit ("loading the spring").
      const sq = 1 - 0.04 * easeOutQuad(a);
      this.body.scale.y = this.bodyBaseScaleY * sq;
      this.body.scale.x = this.bodyBaseScaleX * (1 + (1 - sq) * 0.5);
      this.body.rotation = this.tiltResidue + (-dir) * 0.04 * easeOutQuad(a);
    } else if (t < 0.55) {
      // Strike: snap forward with overshoot (easeOutBack).
      const a = (t - 0.25) / 0.30;
      this.body.x = lerp(-this.profile.anticipationPx * dir, lungeMax * dir, easeOutBack(a, 1.6));
      // Stretch on the strike.
      const stretch = 1 + 0.06 * Math.sin(a * Math.PI);
      this.body.scale.y = this.bodyBaseScaleY * (1 - 0.04);
      this.body.scale.x = this.bodyBaseScaleX * stretch;
      this.body.rotation = this.tiltResidue + dir * 0.05 * Math.sin(a * Math.PI);
    } else {
      // Recovery: damped spring back to neutral.
      const a = (t - 0.55) / 0.45;
      const damp = springReturn(a, this.profile.recoverySnap);
      this.body.x = lungeMax * dir * (1 - damp);
      const k = 1 - damp * 0.5;
      this.body.scale.y = this.bodyBaseScaleY * (k + (1 - k) * 1.0);
      this.body.scale.x = this.bodyBaseScaleX * (k + (1 - k) * 1.0);
      this.body.rotation = this.tiltResidue + dir * 0.05 * (1 - damp);
    }

    if (t >= 1) {
      this.body.x = 0;
      this.body.scale.x = this.bodyBaseScaleX;
      this.body.scale.y = this.bodyBaseScaleY;
      this.completeAndIdle();
    }
  }

  private updateSkill(dt: number): void {
    this.commandTime += dt;
    const t = clamp01(this.commandTime / this.commandDuration);

    // Charge → release → settle.
    if (t < 0.45) {
      // Charge: scale down slightly + tint warm.
      const a = t / 0.45;
      const k = 1 - 0.06 * easeInOutCubic(a);
      this.body.scale.x = this.bodyBaseScaleX * k;
      this.body.scale.y = this.bodyBaseScaleY * k;
      this.body.tint = lerpColor(0xffffff, 0x99ccff, easeInOutCubic(a));
    } else if (t < 0.62) {
      // Release: pop out past 1.0.
      const a = (t - 0.45) / 0.17;
      const k = 0.94 + 0.16 * easeOutBack(a, 2.0);
      this.body.scale.x = this.bodyBaseScaleX * k;
      this.body.scale.y = this.bodyBaseScaleY * k;
      this.body.tint = 0xc8e3ff;
    } else {
      // Settle: spring back.
      const a = (t - 0.62) / 0.38;
      const damp = springReturn(a, 0.7);
      const k = 1.10 - 0.10 * damp;
      this.body.scale.x = this.bodyBaseScaleX * k;
      this.body.scale.y = this.bodyBaseScaleY * k;
      this.body.tint = lerpColor(0xc8e3ff, 0xffffff, damp);
    }

    if (t >= 1) {
      this.body.tint = 0xffffff;
      this.body.scale.x = this.bodyBaseScaleX;
      this.body.scale.y = this.bodyBaseScaleY;
      this.completeAndIdle();
    }
  }

  private updateHit(dt: number): void {
    this.commandTime += dt;
    const t = clamp01(this.commandTime / this.commandDuration);
    const dir = this.facingDir;

    // Three phases: impulse (0..0.18), recoil (0.18..0.5), recover (0.5..1).
    if (t < 0.18) {
      const a = t / 0.18;
      this.body.x = -dir * 8 * easeOutQuad(a);
      this.body.tint = 0xff5555;
      this.body.rotation = this.tiltResidue + (-dir) * this.profile.hitTilt * easeOutQuad(a);
    } else if (t < 0.5) {
      const a = (t - 0.18) / 0.32;
      this.body.x = -dir * 8 * (1 - easeOutQuad(a) * 0.6);
      this.body.tint = lerpColor(0xff5555, 0xffaaaa, a);
      this.body.rotation =
        this.tiltResidue + (-dir) * this.profile.hitTilt * (1 - easeOutQuad(a) * 0.5);
    } else {
      const a = (t - 0.5) / 0.5;
      const damp = springReturn(a, this.profile.recoverySnap);
      this.body.x = -dir * 8 * 0.4 * (1 - damp);
      this.body.tint = lerpColor(0xffaaaa, 0xffffff, damp);
      this.body.rotation =
        this.tiltResidue + (-dir) * this.profile.hitTilt * 0.5 * (1 - damp);
    }

    if (t >= 1) {
      // Leave a small tilt residue so successive hits compound briefly.
      this.tiltResidue += (-dir) * this.profile.hitTilt * 0.15;
      this.body.x = 0;
      this.body.tint = 0xffffff;
      this.completeAndIdle();
    }
  }

  private updateDie(dt: number): void {
    this.commandTime += dt;
    const t = clamp01(this.commandTime / this.commandDuration);
    const dir = this.bodyBaseScaleX < 0 ? -1 : 1;

    // Three phases: stagger (0..0.25), buckle (0.25..0.55), topple (0.55..1).
    if (t < 0.25) {
      const a = t / 0.25;
      // Small jittered tilt — deterministic, two micro-shakes.
      const jitter = Math.sin(a * Math.PI * 4) * 0.04;
      this.body.rotation = this.tiltResidue + jitter * dir;
      this.body.alpha = 1;
    } else if (t < 0.55) {
      const a = (t - 0.25) / 0.30;
      // Buckle: knees go, body sinks.
      this.body.scale.y = this.bodyBaseScaleY * (1 - 0.18 * easeInOutCubic(a));
      this.container.y = this.baseY + 6 * easeInOutCubic(a);
      this.body.alpha = 1 - 0.15 * a;
      this.body.rotation = this.tiltResidue + dir * 0.10 * easeInOutCubic(a);
    } else {
      const a = (t - 0.55) / 0.45;
      // Topple: rotate + drop + fade.
      this.body.alpha = 0.85 * (1 - a);
      this.body.rotation = this.tiltResidue + dir * lerp(0.10, 1.25, easeInOutCubic(a));
      this.container.y = this.baseY + lerp(6, 28, easeInOutCubic(a));
    }

    if (t >= 1) {
      this.body.alpha = 0;
      this.container.visible = false;
      if (this.onComplete) this.onComplete();
      this.onComplete = undefined;
    }
  }

  private completeAndIdle(): void {
    if (this.onComplete) this.onComplete();
    this.onComplete = undefined;
    this.resetToIdle();
  }

  private getDefaultDuration(state: AnimationState): number {
    switch (state) {
      case "idle":
        return 999;
      case "move":
        return 0.5;
      case "attack":
        return 0.55;
      case "skill":
        return 0.85;
      case "hit":
        return 0.42;
      case "die":
        return 1.0;
    }
  }

  private drawHpBar(): void {
    const width = 54;
    const height = 6;
    const y = -52;
    const ratio = clamp01(this.hp / this.maxHp);

    this.hpBarBg.clear();
    this.hpBarBg.roundRect(-width / 2, y, width, height, 3);
    this.hpBarBg.fill({ color: 0x111827, alpha: 0.9 });

    this.hpBarFill.clear();
    this.hpBarFill.roundRect(-width / 2, y, width * ratio, height, 3);
    this.hpBarFill.fill({ color: ratio > 0.4 ? 0x35f2a0 : ratio > 0.2 ? 0xffb454 : 0xff5c7c, alpha: 1 });
  }
}

// =============================================================================
// BattleAnimationDirector — feeds replay events into UnitVisuals.
// =============================================================================

export interface BattleVisualEvent {
  type: "move" | "attack" | "skill" | "hit" | "damage" | "heal" | "death";
  sourceId?: string;
  targetId?: string;
  targetPosition?: Vec2;
  hp?: number;
  maxHp?: number;
  duration?: number;
}

export class BattleAnimationDirector {
  private units = new Map<string, UnitVisual>();

  public register(unit: UnitVisual): void {
    this.units.set(unit.id, unit);
  }

  public unregister(unitId: string): void {
    this.units.delete(unitId);
  }

  public playEvent(event: BattleVisualEvent): void {
    const source = event.sourceId ? this.units.get(event.sourceId) : undefined;
    const target = event.targetId ? this.units.get(event.targetId) : undefined;

    switch (event.type) {
      case "move":
        if (source && event.targetPosition) {
          source.play({ state: "move", target: event.targetPosition, duration: event.duration });
        }
        break;
      case "attack":
        source?.play({ state: "attack", duration: event.duration });
        break;
      case "skill":
        source?.play({ state: "skill", duration: event.duration });
        break;
      case "hit":
      case "damage":
        if (target) {
          if (typeof event.hp === "number" && typeof event.maxHp === "number") {
            target.setHp(event.hp, event.maxHp);
          }
          target.play({ state: "hit", duration: event.duration });
        }
        break;
      case "heal":
        if (target) {
          if (typeof event.hp === "number" && typeof event.maxHp === "number") {
            target.setHp(event.hp, event.maxHp);
          }
          target.play({ state: "skill", duration: event.duration ?? 0.55 });
        }
        break;
      case "death":
        target?.play({ state: "die", duration: event.duration });
        break;
    }
  }

  public update(deltaSeconds: number): void {
    for (const unit of this.units.values()) {
      unit.update(deltaSeconds);
    }
  }
}

// =============================================================================
// Math helpers — exported for unit tests.
// =============================================================================

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

/** Overshoot-on-arrival; `s` controls the kick (1.7 ≈ classic). */
export function easeOutBack(t: number, s = 1.70158): number {
  const u = t - 1;
  return 1 + (s + 1) * u * u * u + s * u * u;
}

/**
 * Critically-damped spring decay normalized to [0,1].
 * Returns 0 at t=0 and asymptotically 1 as t→1.
 * `snap` ∈ (0,1] controls how quickly it settles (higher = snappier).
 */
export function springReturn(t: number, snap: number): number {
  const k = clamp01(snap) * 8 + 2; // 2..10
  return 1 - Math.exp(-k * clamp01(t));
}

export function lerpColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff;
  const ag = (a >> 8) & 0xff;
  const ab = a & 0xff;
  const br = (b >> 16) & 0xff;
  const bg = (b >> 8) & 0xff;
  const bb = b & 0xff;
  const r = Math.round(lerp(ar, br, t));
  const g = Math.round(lerp(ag, bg, t));
  const bl = Math.round(lerp(ab, bb, t));
  return (r << 16) | (g << 8) | bl;
}

/** Tiny FNV-1a hash → unsigned int. Used so per-id timings are stable. */
function hashStr(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i) & 0xff;
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
