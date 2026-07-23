import Phaser from 'phaser';
import { disturbanceDelay, flightVector, isTargetableState } from '../../core/birds/bird-behavior';
import { shouldFlipSprite, type FacingDirection } from '../../core/birds/bird-facing';
import type { BirdPlan } from '../../core/birds/bird-plan';
import { assertBirdPlacement, type SpriteContactType } from '../../core/birds/bird-placement';
import { transitionBirdState, type BirdEvent, type BirdState } from '../../core/birds/bird-state';
import { contactAnchorFor, frameFor, type BirdSpriteDefinition } from '../../data/bird-sprites';
import { birdAnimationKey } from '../systems/BirdAnimationSystem';

export interface BirdScenePlacement {
  readonly regionId: string;
  readonly normalizedX: number;
  readonly normalizedY: number;
  readonly scale: number;
  readonly authoredScale: number;
  readonly displayDepth: number;
  readonly depth: number;
  readonly occluded: boolean;
}

export class BirdEntity extends Phaser.GameObjects.Sprite {
  readonly plan: BirdPlan;
  readonly definition: BirdSpriteDefinition;
  readonly protectedBird: boolean;
  state: BirdState;
  stateSince: number;
  flightSince = 0;
  private pendingDisturbance?: number;
  private resolvedBiologicalVariant: string;
  private hasReturned = false;
  private readonly returnPlan: BirdPlan;
  private placement: BirdScenePlacement;
  private landingTarget?: BirdScenePlacement & { readonly worldX: number; readonly worldY: number };
  private environmentalOcclusion = 0;
  private environmentalDepth?: number;

  constructor(scene: Phaser.Scene, plan: BirdPlan, definition: BirdSpriteDefinition, x: number, y: number, protectedBird: boolean, placement: BirdScenePlacement) {
    const variantIndex = Math.max(0, definition.biologicalVariants.findIndex((variant) => plan.biologicalVariant === variant));
    const biologicalVariant = definition.biologicalVariants[variantIndex] ?? definition.biologicalVariants[0];
    super(scene, x, y, definition.textureKey, frameFor(definition, biologicalVariant, plan.individualVisualVariant, poseForState(plan.initialState)));
    this.plan = plan;
    this.returnPlan = { ...plan, flightProfile: 'circlingReturn', direction: plan.direction === 1 ? -1 : 1 };
    this.definition = definition;
    this.protectedBird = protectedBird;
    this.placement = placement;
    this.resolvedBiologicalVariant = biologicalVariant;
    this.state = plan.initialState;
    this.stateSince = scene.time.now;
    scene.add.existing(this);
    this.applyStateVisual();
    this.applyFacing();
    this.playState(this.state);
    scene.events.emit('bird-state', { speciesId: plan.speciesId, from: null, to: this.state, surface: plan.surface });
  }

  get targetable() {
    const visual = this.definition.visuals[this.state];
    return this.definition.targetableStates.includes(this.state) && isTargetableState(this.state, Math.max(visual?.occlusion ?? 0, this.environmentalOcclusion));
  }

  get hitbox() {
    return this.definition.visuals[this.state]?.hitbox ?? ([60, 45] as const);
  }

  get sceneRegionId() { return this.placement.regionId; }
  get sceneDepth() { return this.placement.depth; }
  get normalizedAnchor() { return { x: this.placement.normalizedX, y: this.placement.normalizedY }; }
  get authoredSceneScale() { return this.placement.authoredScale; }
  get mappedDisplayDepth() { return this.placement.displayDepth; }
  get isSurfaceBound() { return !['takeoff', 'flying', 'distant', 'banking', 'climbing', 'descending', 'landing', 'returning', 'hit', 'falling', 'escaped'].includes(this.state); }
  get needsLandingAnchor() { return this.state === 'descending' && !this.landingTarget; }
  get pendingLandingAnchor() {
    return this.landingTarget
      ? { x: this.landingTarget.normalizedX, y: this.landingTarget.normalizedY, authoredScale: this.landingTarget.authoredScale }
      : undefined;
  }
  get contactType(): SpriteContactType | undefined {
    if (!this.isSurfaceBound && !(this.state === 'landing' && this.landingTarget)) return undefined;
    const contactState = this.state === 'landing' ? 'settled' : this.state;
    return assertBirdPlacement(this.plan.speciesId, this.definition.family, contactState, this.plan.surface, this.perchId).contact;
  }
  private get perchId() { return this.plan.surface === 'lowBranch' ? this.placement.regionId : undefined; }

  reanchor(x: number, y: number, normalizedX: number, normalizedY: number, scale = this.placement.scale) {
    if (!this.isSurfaceBound) return;
    this.setPosition(x, y);
    this.placement = { ...this.placement, normalizedX, normalizedY, scale };
    this.applyStateVisual();
  }

  setLandingTarget(placement: BirdScenePlacement & { readonly worldX: number; readonly worldY: number }) {
    if (this.state !== 'descending') throw new Error(`Cannot assign a landing anchor while bird is ${this.state}.`);
    const compatibility = assertBirdPlacement(
      this.plan.speciesId,
      this.definition.family,
      'settled',
      this.plan.surface,
      this.plan.surface === 'lowBranch' ? placement.regionId : undefined,
    );
    contactAnchorFor(this.definition, 'settled', compatibility.contact);
    this.landingTarget = placement;
  }

  relayoutLandingTarget(worldX: number, worldY: number, scale: number) {
    if (!this.landingTarget) return;
    this.landingTarget = { ...this.landingTarget, worldX, worldY, scale };
    if (this.state === 'landing') this.setPosition(worldX, worldY);
  }

  renderedContactPoint() {
    const type = this.contactType;
    if (!type) return undefined;
    const anchor = contactAnchorFor(this.definition, this.state, type);
    const renderedX = this.flipX ? 1 - anchor.x : anchor.x;
    return {
      x: this.x + (renderedX - this.originX) * this.displayWidth,
      y: this.y + (anchor.y - this.originY) * this.displayHeight,
    };
  }

  assertContactAt(expectedX: number, expectedY: number, tolerance = 2) {
    const rendered = this.renderedContactPoint();
    if (!rendered) return;
    const error = Math.hypot(rendered.x - expectedX, rendered.y - expectedY);
    if (error > tolerance) throw new Error(`${this.plan.speciesId}/${this.state} contact is ${error.toFixed(2)}px from its scene-map anchor.`);
  }

  containsHitPoint(x: number, y: number) {
    const [width, height] = this.hitbox;
    const { x: centerX, y: centerY } = this.hitCenter;
    const radiusX = width * Math.abs(this.scaleX) * .5;
    const radiusY = height * Math.abs(this.scaleY) * .5;
    const dx = (x - centerX) / radiusX;
    const dy = (y - centerY) / radiusY;
    return dx * dx + dy * dy <= 1;
  }

  get hitCenter() {
    return {
      x: this.x + (.5 - this.originX) * this.displayWidth,
      y: this.y + (.5 - this.originY) * this.displayHeight,
    };
  }

  applyEnvironmentalCover(occlusion: number, depth?: number) {
    this.environmentalOcclusion = this.isSurfaceBound ? occlusion : 0;
    this.environmentalDepth = this.isSurfaceBound ? depth : undefined;
    if (this.environmentalDepth !== undefined) this.setDepth(this.environmentalDepth);
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
    if (this.state === 'descending' && this.landingTarget) {
      const distance = Phaser.Math.Distance.Between(this.x, this.y, this.landingTarget.worldX, this.landingTarget.worldY);
      const step = Math.min(distance, Math.max(90, this.plan.speed * .7) * dt);
      const angle = Phaser.Math.Angle.Between(this.x, this.y, this.landingTarget.worldX, this.landingTarget.worldY);
      this.x += Math.cos(angle) * step;
      this.y += Math.sin(angle) * step;
      this.rotation = Phaser.Math.Angle.RotateTo(this.rotation, angle, 2.2 * dt);
      if (distance <= 4 || step >= distance) {
        const target = this.landingTarget;
        this.placement = target;
        this.setPosition(target.worldX, target.worldY).setRotation(0);
        this.advance('land');
      }
    } else if (['flying', 'banking', 'climbing', 'descending', 'returning'].includes(this.state)) {
      const flightElapsed = nowMs - this.flightSince;
      const vector = flightVector(this.state === 'returning' ? this.returnPlan : this.plan, flightElapsed);
      this.x += vector.x * dt;
      this.y += vector.y * dt;
      this.rotation = vector.rotation;
      const landingAfter = this.plan.willLand
        ? Math.min(this.plan.flightDurationMs, Math.max(650, width * .65 / Math.max(1, this.plan.speed) * 1_000))
        : this.plan.flightDurationMs;
      if (flightElapsed > landingAfter) {
        if (this.plan.willLand && this.state !== 'descending') this.advance('descend');
        else if (this.state === 'descending' && !this.plan.willLand) this.advance('escape');
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
      this.x += this.plan.idleDirection * 7 * dt;
      this.y += Math.sin(nowMs / 520 + this.plan.movementPhase) * 0.08;
    }

    const outsideFlightBounds = this.x < -180 || this.x > width + 180 || this.y < -180;
    if (this.state === 'escaped' || (outsideFlightBounds && !this.plan.willLand)) this.destroy();
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
    this.applyFacing();
    this.playState(next);
    this.scene.events.emit('bird-state', { speciesId: this.plan.speciesId, from: previous, to: next, surface: this.plan.surface });
  }

  private applyStateVisual() {
    const visual = this.definition.visuals[this.state] ?? this.definition.visuals.flying!;
    const surfaceBound = this.isSurfaceBound;
    const anchoredLanding = this.state === 'landing' && this.landingTarget !== undefined;
    const anchored = surfaceBound || anchoredLanding;
    const origin = anchored
      ? (() => {
          const contactState = anchoredLanding ? 'settled' : this.state;
          const compatibility = assertBirdPlacement(this.plan.speciesId, this.definition.family, contactState, this.plan.surface, this.perchId);
          const contact = contactAnchorFor(this.definition, this.state, compatibility.contact);
          return [contact.x, contact.y] as const;
        })()
      : visual.origin;
    this.setScale(visual.scale * this.plan.scaleMultiplier * (anchored ? this.placement.scale : 1))
      .setOrigin(...origin)
      .setDepth(anchored ? (this.environmentalDepth ?? this.placement.displayDepth) : visual.depth)
      .setSize(...visual.hitbox);
  }

  private applyFacing() {
    let direction: FacingDirection = this.plan.idleDirection;
    if (['preTakeoff', 'takeoff', 'flying', 'distant', 'banking', 'climbing', 'descending', 'landing'].includes(this.state)) {
      direction = this.plan.direction;
    } else if (this.state === 'returning') {
      direction = this.returnPlan.direction;
    }
    this.setFlipX(shouldFlipSprite(this.definition.authoredFacing, direction));
  }

  private playState(state: BirdState) {
    const key = birdAnimationKey(this.definition, this.resolvedBiologicalVariant, this.plan.individualVisualVariant, state);
    const animation = this.definition.animations[state];
    if (this.scene.anims.exists(key)) {
      this.play(key, true);
      this.anims.timeScale = this.plan.animationRateMultiplier;
      if (animation?.repeat === -1 && animation.frames.length > 1) {
        const poseOffset = this.plan.posePreference === 'alternate' ? 1 / animation.frames.length : 0;
        this.anims.setProgress((this.plan.animationPhase + poseOffset) % 1);
      }
    } else {
      const fallbackPose = this.plan.posePreference === 'alternate' && animation?.frames[1]
        ? animation.frames[1]
        : poseForState(state);
      this.setFrame(frameFor(this.definition, this.resolvedBiologicalVariant, this.plan.individualVisualVariant, fallbackPose));
    }
  }
}

function poseForState(state: BirdState): string {
  const aliases: Partial<Record<BirdState, string>> = { perched: 'resting', settled: 'resting', returning: 'banking', distant: 'flying', revealing: 'revealing', standingBonus: 'standingBonus' };
  return aliases[state] ?? state;
}
