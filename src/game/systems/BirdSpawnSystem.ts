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

export class BirdSpawnSystem {
  readonly birds: BirdEntity[] = [];
  private profiles: BirdBehaviorProfile[];
  private lastSpawn = -10_000;
  constructor(private scene: Phaser.Scene, private rng: SeededRandom, locationId: string, private sceneMap: SceneMapSystem, private sceneProps: ScenePropSystem, private cap = 14) {
    this.profiles = profilesForLocation(locationId, birdBehaviors);
    if (import.meta.env.DEV) this.applyDebugSpawnOverride();
  }

  seedInitialFlocks() {
    this.spawnFlock();
    this.spawnFlock();
  }

  update(nowMs: number, deltaMs: number) {
    if (nowMs - this.lastSpawn > 4_600 && this.birds.filter((bird) => bird.active).length < this.cap) this.spawnFlock();
    for (const bird of this.birds) {
      bird.updateBehavior(nowMs, deltaMs, this.scene.scale.width, this.scene.scale.height);
      if (bird.needsLandingAnchor) {
        const current = this.sceneMap.fromWorld({ x: bird.x, y: bird.y });
        const query = { speciesId: bird.plan.speciesId, birdFamily: bird.definition.family };
        const landing = this.sceneMap.projectNear(bird.plan.surface, current, query, Number.POSITIVE_INFINITY)
          ?? this.sceneMap.sample(bird.plan.surface, this.rng, query);
        if (landing) bird.setLandingTarget(this.toBirdPlacement(landing));
        else if (import.meta.env.DEV) throw new Error(`${bird.plan.speciesId} could not resolve a mapped ${bird.plan.surface} landing anchor.`);
      }
      if (bird.isSurfaceBound) {
        const normalized = this.sceneMap.fromWorld({ x: bird.x, y: bird.y });
        const projected = this.sceneMap.project(normalized, bird.sceneRegionId);
        if (projected) {
          const world = this.sceneMap.toWorld(projected);
          bird.reanchor(world.x, world.y, projected.x, projected.y);
        }
        const cover = this.sceneProps.resolveActor(bird.normalizedAnchor, bird.mappedDisplayDepth, 'bird');
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
        this.scene.events.emit('bird-prop-depth', { speciesId: bird.plan.speciesId, propId: cover.propId, depth: cover.depth, occlusion: cover.occlusion, relation: cover.relation });
      } else {
        bird.applyEnvironmentalCover(0);
      }
    }
    for (let index = this.birds.length - 1; index >= 0; index -= 1) if (!this.birds[index]!.active) this.birds.splice(index, 1);
    const target = this.birds.find((bird) => bird.active && bird.targetable);
    if (target) this.scene.events.emit('bird-target', { speciesId: target.plan.speciesId, state: target.state, ...target.hitCenter, protected: target.protectedBird });
  }

  hitAt(x: number, y: number): BirdEntity | undefined {
    return [...this.birds].sort((a, b) => b.depth - a.depth).find((bird) => {
      if (!bird.active || !bird.targetable) return false;
      return bird.containsHitPoint(x, y);
    });
  }

  private spawnFlock() {
    if (!this.profiles.length) return;
    const profile = this.rng.pick(this.profiles);
    const definition = birdSpriteBySpecies.get(profile.speciesId);
    if (!definition) throw new Error(`No bird atlas manifest entry for ${profile.speciesId}.`);
    const remaining = this.cap - this.birds.length;
    const plans = createFlockPlans(profile, this.rng, Math.max(1, remaining));
    const leaderPlan = plans[0];
    if (!leaderPlan) return;
    const query = { speciesId: leaderPlan.speciesId, birdFamily: definition.family };
    const leader = this.sceneMap.sample(leaderPlan.surface, this.rng, query);
    if (!leader) {
      if (import.meta.env.DEV) throw new Error(`${leaderPlan.speciesId}/${leaderPlan.initialState} has no visible mapped ${leaderPlan.surface} region.`);
      return;
    }
    for (const plan of plans) {
      const target = {
        x: leader.point.x + plan.formationOffsetX,
        y: leader.point.y + plan.formationOffsetY,
      };
      const placement = plan === leaderPlan
        ? leader
        : this.sceneMap.projectNear(plan.surface, target, query, .16);
      if (!placement) continue;
      const compatibility = assertBirdPlacement(
        plan.speciesId,
        definition.family,
        plan.initialState,
        plan.surface,
        plan.surface === 'lowBranch' ? placement.regionId : undefined,
      );
      const bird = new BirdEntity(this.scene, plan, definition, placement.worldX, placement.worldY, profile.speciesId === 'spectacled', {
        regionId: placement.regionId,
        normalizedX: placement.point.x,
        normalizedY: placement.point.y,
        scale: placement.worldScale,
        authoredScale: placement.scale,
        displayDepth: placement.displayDepth,
        depth: placement.depth,
        occluded: placement.occluded,
      });
      const cover = this.sceneProps.resolveActor(placement.point, placement.displayDepth, 'bird');
      bird.applyEnvironmentalCover(cover.occlusion, cover.depth);
      if (import.meta.env.DEV) bird.assertContactAt(placement.worldX, placement.worldY);
      this.birds.push(bird);
      this.scene.events.emit('bird-spawned', { speciesId: plan.speciesId, illustrated: true, lane: 'habitat', initialState: plan.initialState, surface: plan.surface, contactType: compatibility.contact, spawnZone: placement.regionId, sceneRegionId: placement.regionId, sceneDepth: placement.depth, worldX: placement.worldX, worldY: placement.worldY, occluded: placement.occluded, fallback: false });
    }
    this.lastSpawn = this.scene.time.now;
  }

  resize() {
    for (const bird of this.birds) {
      const pendingLanding = bird.pendingLandingAnchor;
      if (pendingLanding) {
        const landingWorld = this.sceneMap.toWorld(pendingLanding);
        bird.relayoutLandingTarget(landingWorld.x, landingWorld.y, this.sceneMap.worldObjectScale(pendingLanding.authoredScale));
      }
      if (!bird.isSurfaceBound) continue;
      const world = this.sceneMap.toWorld(bird.normalizedAnchor);
      bird.reanchor(world.x, world.y, bird.normalizedAnchor.x, bird.normalizedAnchor.y, this.sceneMap.worldObjectScale(bird.authoredSceneScale));
      const cover = this.sceneProps.resolveActor(bird.normalizedAnchor, bird.mappedDisplayDepth, 'bird');
      bird.applyEnvironmentalCover(cover.occlusion, cover.depth);
      if (import.meta.env.DEV) bird.assertContactAt(world.x, world.y);
      this.scene.events.emit('scene-map-selected', { sceneRegionId: bird.sceneRegionId, surface: bird.plan.surface, sceneDepth: bird.sceneDepth, worldX: world.x, worldY: world.y });
    }
  }

  private toBirdPlacement(placement: WorldScenePoint): BirdScenePlacement & { readonly worldX: number; readonly worldY: number } {
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

  private applyDebugSpawnOverride() {
    const params = new URLSearchParams(globalThis.location?.search ?? '');
    const speciesId = params.get('debugBirdSpecies');
    const surface = params.get('debugBirdSurface') as BirdSurface | null;
    const state = params.get('debugBirdState') as BirdState | null;
    if (!speciesId && !surface && !state) return;
    this.profiles = this.profiles
      .filter((profile) => !speciesId || profile.speciesId === speciesId)
      .map((profile) => ({
        ...profile,
        surfaces: surface ? [surface] : profile.surfaces,
        initialStates: state ? [state] : profile.initialStates,
        flockSize: [1, 1] as const,
      }))
      .filter((profile) => profile.surfaces.some((candidateSurface) => profile.initialStates.some((candidateState) =>
        assertCompatible(profile, candidateState, candidateSurface),
      )));
  }
}

function assertCompatible(profile: BirdBehaviorProfile, state: BirdState, surface: BirdSurface) {
  try {
    assertBirdPlacement(profile.speciesId, profile.family, state, surface, surface === 'lowBranch' ? 'debug-perch' : undefined);
    return true;
  } catch {
    return false;
  }
}
