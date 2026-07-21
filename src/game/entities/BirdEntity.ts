import Phaser from 'phaser';
import { disturbanceDelay, flightVector, isTargetableState } from '../../core/birds/bird-behavior';
import type { BirdPlan } from '../../core/birds/bird-plan';
import { transitionBirdState, type BirdEvent, type BirdState } from '../../core/birds/bird-state';
import { frameFor, type BirdSpriteDefinition } from '../../data/bird-sprites';
import { birdAnimationKey } from '../systems/BirdAnimationSystem';

export class BirdEntity extends Phaser.GameObjects.Sprite {
  readonly plan: BirdPlan;
  readonly definition: BirdSpriteDefinition;
  readonly protectedBird: boolean;
  state: BirdState;
  stateSince: number;
  flightSince = 0;
  private pendingDisturbance?: number;
  private resolvedVariant: string;
  private hasReturned = false;
  private readonly returnPlan: BirdPlan;

  constructor(scene: Phaser.Scene, plan: BirdPlan, definition: BirdSpriteDefinition, x: number, y: number, protectedBird: boolean) {
    const variantIndex = Math.max(0, definition.variants.findIndex((variant) => plan.variant === variant));
    const variant = definition.variants[variantIndex] ?? definition.variants[0];
    super(scene, x, y, definition.textureKey, frameFor(definition, variant, poseForState(plan.initialState)));
    this.plan = plan;
    this.returnPlan = { ...plan, flightProfile: 'circlingReturn', direction: plan.direction === 1 ? -1 : 1 };
    this.definition = definition;
    this.protectedBird = protectedBird;
    this.resolvedVariant = variant;
    this.state = plan.initialState;
    this.stateSince = scene.time.now;
    scene.add.existing(this);
    this.setFlipX(plan.direction < 0);
    this.applyStateVisual();
    this.playState(this.state);
    scene.events.emit('bird-state', { speciesId: plan.speciesId, from: null, to: this.state, surface: plan.surface });
  }

  get targetable() {
    const visual = this.definition.visuals[this.state];
    return this.definition.targetableStates.includes(this.state) && isTargetableState(this.state, visual?.occlusion ?? 0);
  }

  get hitbox() {
    return this.definition.visuals[this.state]?.hitbox ?? ([60, 45] as const);
  }

  disturb(dogX: number, dogY: number, nowMs: number): boolean {
    if (this.pendingDisturbance !== undefined || ['takeoff', 'flying', 'hit', 'falling', 'escaped'].includes(this.state)) return false;
    const delay = disturbanceDelay(this.plan, { dogX, dogY, birdX: this.x, birdY: this.y, nowMs });
    if (delay === undefined) return false;
    this.pendingDisturbance = nowMs + delay;
    return true;
  }

  strike() {
    if (!this.targetable) return false;
    this.advance('hit');
    return true;
  }

  updateBehavior(nowMs: number, deltaMs: number, width: number, height: number) {
    if (!this.active) return;
    if (this.pendingDisturbance !== undefined && nowMs >= this.pendingDisturbance) {
      this.pendingDisturbance = undefined;
      this.advance('disturbed');
    }
    const elapsed = nowMs - this.stateSince;
    if (this.state === 'revealing' && elapsed >= this.plan.revealDurationMs) this.advance('reveal-complete');
    else if (this.state === 'hit' && elapsed >= 180) this.advanceTo('falling');
    else if (this.state === 'standingBonus' && elapsed >= this.plan.alertDurationMs) this.advance('alert-complete');
    else if (this.state === 'alert' && elapsed >= this.plan.alertDurationMs) this.advance('alert-complete');
    else if (this.state === 'preTakeoff' && elapsed >= 420) this.advance('anticipation-complete');
    else if (this.state === 'takeoff' && elapsed >= 520) {
      this.advance('takeoff-complete');
      this.flightSince = nowMs;
    } else if (this.state === 'landing' && elapsed >= 700) this.advance('settle');
    else if (this.state === 'settled' && this.plan.willReturn && !this.hasReturned && elapsed >= 1_600) {
      this.hasReturned = true;
      this.flightSince = nowMs;
      this.advanceTo('returning');
    }

    const dt = deltaMs / 1_000;
    if (['flying', 'banking', 'climbing', 'descending', 'returning'].includes(this.state)) {
      const flightElapsed = nowMs - this.flightSince;
      const vector = flightVector(this.state === 'returning' ? this.returnPlan : this.plan, flightElapsed);
      this.x += vector.x * dt;
      this.y += vector.y * dt;
      this.rotation = vector.rotation;
      if (flightElapsed > this.plan.flightDurationMs) {
        if (this.plan.willLand && this.state !== 'descending') this.advance('descend');
        else if (this.state === 'descending') this.advance('land');
        else this.advance('escape');
      }
    } else if (this.state === 'takeoff') {
      this.x += this.plan.direction * this.plan.speed * 0.25 * dt;
      this.y -= this.plan.climbRate * 0.45 * dt;
    } else if (this.state === 'falling') {
      this.y += 230 * dt;
      this.rotation += this.plan.direction * 2.4 * dt;
      if (this.y > height + 90) this.advance('fall-complete');
    } else if (['walking', 'foraging', 'swimming'].includes(this.state)) {
      this.x += this.plan.direction * 7 * dt;
      this.y += Math.sin(nowMs / 520 + this.plan.phase) * 0.08;
    }

    if (this.state === 'escaped' || this.x < -180 || this.x > width + 180 || this.y < -180) this.destroy();
  }

  private advance(event: BirdEvent) {
    this.advanceTo(transitionBirdState(this.state, event, { revealBeforeFlush: this.plan.revealBeforeFlush }));
  }

  private advanceTo(next: BirdState) {
    if (next === this.state) return;
    const previous = this.state;
    this.state = next;
    this.stateSince = this.scene.time.now;
    this.applyStateVisual();
    this.playState(next);
    this.scene.events.emit('bird-state', { speciesId: this.plan.speciesId, from: previous, to: next, surface: this.plan.surface });
  }

  private applyStateVisual() {
    const visual = this.definition.visuals[this.state] ?? this.definition.visuals.flying!;
    this.setScale(visual.scale).setOrigin(...visual.origin).setDepth(visual.depth).setSize(...visual.hitbox);
  }

  private playState(state: BirdState) {
    const key = birdAnimationKey(this.definition, this.resolvedVariant, state);
    if (this.scene.anims.exists(key)) this.play(key, true);
    else this.setFrame(frameFor(this.definition, this.resolvedVariant, poseForState(state)));
  }
}

function poseForState(state: BirdState): string {
  const aliases: Partial<Record<BirdState, string>> = { perched: 'resting', settled: 'resting', returning: 'banking', distant: 'flying', revealing: 'revealing', standingBonus: 'standingBonus' };
  return aliases[state] ?? state;
}
