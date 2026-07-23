import type Phaser from 'phaser';
import { createFlockPlans, type BirdSurface } from '../../core/birds/bird-plan';
import { assertBirdPlacement } from '../../core/birds/bird-placement';
import type { BirdState } from '../../core/birds/bird-state';
import type { SeededRandom } from '../../core/rng';
import { birdBehaviors, type BirdBehaviorProfile } from '../../data/bird-behaviors';
import { profilesForLocation } from '../../data/bird-habitats';
import { birdSpriteBySpecies } from '../../data/bird-sprites';
import { BirdEntity, type BirdScenePlacement } from '../entities/BirdEntity';
import type { SceneMapSystem, WorldScenePoint } from './SceneMapSystem';
import type { ScenePropSystem } from './ScenePropSystem';

export interface BirdSpawnOptions {
  readonly cap: number;
  readonly cadenceMs: number;
  readonly speedMultiplier: number;
  readonly species: readonly {
    readonly speciesId: string;
    readonly weight: number;
  }[];
  readonly escalating: boolean;
}

export class BirdSpawnSystem {
  readonly birds: BirdEntity[] = [];
  private profiles: BirdBehaviorProfile[];
  private lastSpawn = -10_000;
  private nextCallAt = 4_800;
  private readonly callRng: SeededRandom;
  private spawnCount = 0;
  constructor(
    private scene: Phaser.Scene,
    private rng: SeededRandom,
    locationId: string,
    private sceneMap: SceneMapSystem,
    private sceneProps: ScenePropSystem,
    private options: BirdSpawnOptions,
  ) {
    const allowed = new Set(options.species.map(({ speciesId }) => speciesId));
    if (import.meta.env.DEV) {
      const debugSpecies = new URLSearchParams(globalThis.location?.search ?? '').get(
        'debugBirdSpecies',
      );
      if (debugSpecies) allowed.add(debugSpecies);
    }
    this.profiles = profilesForLocation(locationId, birdBehaviors)
      .filter(({ speciesId }) => allowed.has(speciesId))
      .map((profile) => ({
        ...profile,
        speed: [
          profile.speed[0] * options.speedMultiplier,
          profile.speed[1] * options.speedMultiplier,
        ] as const,
      }));
    this.callRng = rng.fork(`audio-calls-${locationId}`);
    if (import.meta.env.DEV) this.applyDebugSpawnOverride();
  }

  seedInitialFlocks() {
    this.spawnFlock();
    this.spawnFlock();
  }

  update(nowMs: number, deltaMs: number) {
    const escalation = this.options.escalating ? Math.min(1.9, 1 + nowMs / 150_000) : 1;
    if (
      nowMs - this.lastSpawn > this.options.cadenceMs / escalation &&
      this.birds.filter((bird) => bird.active).length < this.options.cap
    )
      this.spawnFlock(escalation);
    for (const bird of this.birds) {
      bird.updateBehavior(nowMs, deltaMs, this.scene.scale.width, this.scene.scale.height);
      if (bird.needsLandingAnchor) {
        const current = this.sceneMap.fromWorld({ x: bird.x, y: bird.y });
        const query = { speciesId: bird.plan.speciesId, birdFamily: bird.definition.family };
        const landing =
          this.sceneMap.projectNear(bird.plan.surface, current, query, Number.POSITIVE_INFINITY) ??
          this.sceneMap.sample(bird.plan.surface, this.rng, query);
        if (landing) bird.setLandingTarget(this.toBirdPlacement(landing));
        else if (import.meta.env.DEV)
          throw new Error(
            `${bird.plan.speciesId} could not resolve a mapped ${bird.plan.surface} landing anchor.`,
          );
      }
      if (bird.isSurfaceBound) {
        const normalized = this.sceneMap.fromWorld({ x: bird.x, y: bird.y });
        const projected = this.sceneMap.project(normalized, bird.sceneRegionId);
        if (projected) {
          const world = this.sceneMap.toWorld(projected);
          bird.reanchor(world.x, world.y, projected.x, projected.y);
        }
        const cover = this.sceneProps.resolveActor(
          bird.normalizedAnchor,
          bird.mappedDisplayDepth,
          'bird',
        );
        bird.applyEnvironmentalCover(cover.occlusion, cover.depth);
        if (import.meta.env.DEV) bird.assertContactAt(bird.x, bird.y);
        const contact = bird.renderedContactPoint();
        this.scene.events.emit('bird-surface-contact', {
          speciesId: bird.plan.speciesId,
          state: bird.state,
          surface: bird.plan.surface,
          contactType: bird.contactType,
          sceneRegionId: bird.sceneRegionId,
          sceneDepth: bird.sceneDepth,
          worldX: bird.x,
          worldY: bird.y,
          renderedContactX: contact?.x,
          renderedContactY: contact?.y,
          contactError: contact ? Math.hypot(contact.x - bird.x, contact.y - bird.y) : undefined,
        });
        this.scene.events.emit('bird-prop-depth', {
          speciesId: bird.plan.speciesId,
          propId: cover.propId,
          depth: cover.depth,
          occlusion: cover.occlusion,
          relation: cover.relation,
        });
      } else {
        bird.applyEnvironmentalCover(0);
      }
    }
    for (let index = this.birds.length - 1; index >= 0; index -= 1)
      if (!this.birds[index]!.active) this.birds.splice(index, 1);
    if (nowMs >= this.nextCallAt) {
      const candidates = this.birds.filter(
        (bird) => bird.active && !['hit', 'falling', 'escaped'].includes(bird.state),
      );
      const bird = candidates.length ? this.callRng.pick(candidates) : undefined;
      if (bird) {
        this.scene.events.emit('bird-call', {
          speciesId: bird.plan.speciesId,
          family: bird.definition.family,
          worldX: bird.x,
          mapDepth: bird.sceneDepth,
          occlusion: bird.isSurfaceBound ? 0.12 : 0,
          rear: false,
        });
      }
      this.nextCallAt = nowMs + this.callRng.int(6_500, 13_500);
    }
    if (import.meta.env.DEV) {
      this.scene.events.emit(
        'bird-individual-plans',
        this.birds.map(({ plan }) => ({
          speciesId: plan.speciesId,
          biologicalVariant: plan.biologicalVariant,
          individualVisualSeed: plan.individualVisualSeed,
          individualVisualVariant: plan.individualVisualVariant,
          scaleMultiplier: plan.scaleMultiplier,
          animationPhase: plan.animationPhase,
          animationRateMultiplier: plan.animationRateMultiplier,
          idleDelay: plan.idleDelay,
          preferredIdleAnimation: plan.preferredIdleAnimation,
          posePreference: plan.posePreference,
          speedOffset: plan.speedOffset,
          reactionOffsetMs: plan.reactionOffsetMs,
          formationOffsetX: plan.formationOffsetX,
          formationOffsetY: plan.formationOffsetY,
        })),
      );
      this.scene.events.emit(
        'bird-animation-telemetry',
        this.birds.map((bird) => bird.animationTelemetry),
      );
    }
    const target = this.birds.find((bird) => bird.active && bird.targetable);
    if (target)
      this.scene.events.emit('bird-target', {
        speciesId: target.plan.speciesId,
        state: target.state,
        ...target.hitCenter,
        protected: target.protectedBird,
      });
  }

  hitAt(x: number, y: number, assistRadius = 0): BirdEntity | undefined {
    return [...this.birds]
      .sort((a, b) => b.depth - a.depth)
      .find((bird) => {
        if (!bird.active || !bird.targetable) return false;
        if (bird.containsHitPoint(x, y)) return true;
        if (assistRadius <= 0) return false;
        const center = bird.hitCenter;
        return Math.hypot(center.x - x, center.y - y) <= assistRadius;
      });
  }

  private spawnFlock(escalation = 1) {
    if (!this.profiles.length) return;
    const baseProfile = this.rng.weighted(
      this.profiles.map((profile) => ({
        value: profile,
        weight:
          this.options.species.find(({ speciesId }) => speciesId === profile.speciesId)?.weight ??
          1,
      })),
    );
    const profile =
      escalation === 1
        ? baseProfile
        : {
            ...baseProfile,
            speed: [baseProfile.speed[0] * escalation, baseProfile.speed[1] * escalation] as const,
          };
    const definition = birdSpriteBySpecies.get(profile.speciesId);
    if (!definition) throw new Error(`No bird atlas manifest entry for ${profile.speciesId}.`);
    const remaining = this.options.cap - this.birds.length;
    const plans = createFlockPlans(profile, this.rng, Math.max(1, remaining));
    const leaderPlan = plans[0];
    if (!leaderPlan) return;
    const query = { speciesId: leaderPlan.speciesId, birdFamily: definition.family };
    const placements = this.resolveFlockPlacements(plans, query);
    if (!placements[0]) {
      if (import.meta.env.DEV)
        throw new Error(
          `${leaderPlan.speciesId}/${leaderPlan.initialState} has no visible mapped ${leaderPlan.surface} region.`,
        );
      return;
    }
    for (const [index, plan] of plans.entries()) {
      const placement = placements[index];
      if (!placement) continue;
      const compatibility = assertBirdPlacement(
        plan.speciesId,
        definition.family,
        plan.initialState,
        plan.surface,
        plan.surface === 'lowBranch' ? placement.regionId : undefined,
      );
      const bird = new BirdEntity(
        this.scene,
        plan,
        definition,
        placement.worldX,
        placement.worldY,
        profile.speciesId === 'spectacled',
        {
          regionId: placement.regionId,
          normalizedX: placement.point.x,
          normalizedY: placement.point.y,
          scale: placement.worldScale,
          authoredScale: placement.scale,
          displayDepth: placement.displayDepth,
          depth: placement.depth,
          occluded: placement.occluded,
        },
      );
      const cover = this.sceneProps.resolveActor(placement.point, placement.displayDepth, 'bird');
      bird.applyEnvironmentalCover(cover.occlusion, cover.depth);
      if (import.meta.env.DEV) bird.assertContactAt(placement.worldX, placement.worldY);
      this.birds.push(bird);
      this.scene.events.emit('bird-spawned', {
        speciesId: plan.speciesId,
        illustrated: true,
        lane: 'habitat',
        initialState: plan.initialState,
        surface: plan.surface,
        contactType: compatibility.contact,
        spawnZone: placement.regionId,
        sceneRegionId: placement.regionId,
        sceneDepth: placement.depth,
        worldX: placement.worldX,
        worldY: placement.worldY,
        biologicalVariant: plan.biologicalVariant,
        individualVisualSeed: plan.individualVisualSeed,
        individualVisualVariant: plan.individualVisualVariant,
        scaleMultiplier: plan.scaleMultiplier,
        animationPhase: plan.animationPhase,
        animationRateMultiplier: plan.animationRateMultiplier,
        posePreference: plan.posePreference,
        speedOffset: plan.speedOffset,
        reactionOffsetMs: plan.reactionOffsetMs,
        formationOffsetX: plan.formationOffsetX,
        formationOffsetY: plan.formationOffsetY,
        occluded: placement.occluded,
        fallback: false,
      });
    }
    this.lastSpawn = this.scene.time.now;
    this.spawnCount += 1;
    this.scene.events.emit('spawn-pressure', {
      wave: this.spawnCount,
      speedMultiplier: this.options.speedMultiplier * escalation,
      cadenceMs: this.options.cadenceMs / escalation,
    });
  }

  resize() {
    for (const bird of this.birds) {
      const pendingLanding = bird.pendingLandingAnchor;
      if (pendingLanding) {
        const landingWorld = this.sceneMap.toWorld(pendingLanding);
        bird.relayoutLandingTarget(
          landingWorld.x,
          landingWorld.y,
          this.sceneMap.worldObjectScale(pendingLanding.authoredScale),
        );
      }
      if (!bird.isSurfaceBound) continue;
      const world = this.sceneMap.toWorld(bird.normalizedAnchor);
      bird.reanchor(
        world.x,
        world.y,
        bird.normalizedAnchor.x,
        bird.normalizedAnchor.y,
        this.sceneMap.worldObjectScale(bird.authoredSceneScale),
      );
      const cover = this.sceneProps.resolveActor(
        bird.normalizedAnchor,
        bird.mappedDisplayDepth,
        'bird',
      );
      bird.applyEnvironmentalCover(cover.occlusion, cover.depth);
      if (import.meta.env.DEV) bird.assertContactAt(world.x, world.y);
      this.scene.events.emit('scene-map-selected', {
        sceneRegionId: bird.sceneRegionId,
        surface: bird.plan.surface,
        sceneDepth: bird.sceneDepth,
        worldX: world.x,
        worldY: world.y,
      });
    }
  }

  private toBirdPlacement(
    placement: WorldScenePoint,
  ): BirdScenePlacement & { readonly worldX: number; readonly worldY: number } {
    return {
      regionId: placement.regionId,
      normalizedX: placement.point.x,
      normalizedY: placement.point.y,
      scale: placement.worldScale,
      authoredScale: placement.scale,
      displayDepth: placement.displayDepth,
      depth: placement.depth,
      occluded: placement.occluded,
      worldX: placement.worldX,
      worldY: placement.worldY,
    };
  }

  private resolveFlockPlacement(
    plan: ReturnType<typeof createFlockPlans>[number],
    leader: WorldScenePoint,
    query: { speciesId: string; birdFamily: BirdBehaviorProfile['family'] },
  ) {
    for (const compression of [1, 0.72, 0.48, 0.3]) {
      const target = {
        x: leader.point.x + plan.formationOffsetX * compression,
        y: leader.point.y + plan.formationOffsetY * compression,
      };
      const placement = this.sceneMap.projectNear(plan.surface, target, query, 0.16);
      if (placement) return placement;
    }
    return undefined;
  }

  private resolveFlockPlacements(
    plans: ReturnType<typeof createFlockPlans>,
    query: { speciesId: string; birdFamily: BirdBehaviorProfile['family'] },
  ): Array<WorldScenePoint | undefined> {
    const leaderPlan = plans[0];
    if (!leaderPlan) return [];
    let best: Array<WorldScenePoint | undefined> = [];
    const desiredVisibleMembers = Math.min(plans.length, 4);
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const leader = this.sceneMap.sample(leaderPlan.surface, this.rng, query);
      if (!leader) break;
      const placements = plans.map((plan, index) =>
        index === 0 ? leader : this.resolveFlockPlacement(plan, leader, query),
      );
      if (placements.filter(Boolean).length > best.filter(Boolean).length) best = placements;
      if (best.filter(Boolean).length >= desiredVisibleMembers) break;
    }
    return best;
  }

  private applyDebugSpawnOverride() {
    const params = new URLSearchParams(globalThis.location?.search ?? '');
    const speciesId = params.get('debugBirdSpecies');
    const surface = params.get('debugBirdSurface') as BirdSurface | null;
    const state = params.get('debugBirdState') as BirdState | null;
    const requestedFlockSize = Number(params.get('debugFlockSize') ?? 1);
    const debugFlockSize = Math.max(
      1,
      Math.min(8, Number.isFinite(requestedFlockSize) ? Math.round(requestedFlockSize) : 1),
    );
    if (!speciesId && !surface && !state && !params.has('debugFlockSize')) return;
    this.profiles = this.profiles
      .filter((profile) => !speciesId || profile.speciesId === speciesId)
      .map((profile) => ({
        ...profile,
        surfaces: surface ? [surface] : profile.surfaces,
        initialStates: state ? [state] : profile.initialStates,
        flockSize: [debugFlockSize, debugFlockSize] as const,
      }))
      .filter((profile) =>
        profile.surfaces.some((candidateSurface) =>
          profile.initialStates.some((candidateState) =>
            assertCompatible(profile, candidateState, candidateSurface),
          ),
        ),
      );
  }
}

function assertCompatible(profile: BirdBehaviorProfile, state: BirdState, surface: BirdSurface) {
  try {
    assertBirdPlacement(
      profile.speciesId,
      profile.family,
      state,
      surface,
      surface === 'lowBranch' ? 'debug-perch' : undefined,
    );
    return true;
  } catch {
    return false;
  }
}
