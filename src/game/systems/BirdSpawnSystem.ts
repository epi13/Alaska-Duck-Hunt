import type Phaser from 'phaser';
import { createFlockPlans } from '../../core/birds/bird-plan';
import type { SeededRandom } from '../../core/rng';
import { birdBehaviors, type BirdBehaviorProfile } from '../../data/bird-behaviors';
import { profilesForLocation } from '../../data/bird-habitats';
import { birdSpriteBySpecies } from '../../data/bird-sprites';
import { BirdEntity } from '../entities/BirdEntity';
import type { SceneMapSystem } from './SceneMapSystem';

export class BirdSpawnSystem {
  readonly birds: BirdEntity[] = [];
  private profiles: BirdBehaviorProfile[];
  private lastSpawn = -10_000;
  constructor(private scene: Phaser.Scene, private rng: SeededRandom, locationId: string, private sceneMap: SceneMapSystem, private cap = 14) {
    this.profiles = profilesForLocation(locationId, birdBehaviors);
  }

  seedInitialFlocks() {
    this.spawnFlock();
    this.spawnFlock();
  }

  update(nowMs: number, deltaMs: number) {
    if (nowMs - this.lastSpawn > 4_600 && this.birds.filter((bird) => bird.active).length < this.cap) this.spawnFlock();
    for (const bird of this.birds) {
      bird.updateBehavior(nowMs, deltaMs, this.scene.scale.width, this.scene.scale.height);
      if (bird.isSurfaceBound) {
        const normalized = this.sceneMap.fromWorld({ x: bird.x, y: bird.y });
        const projected = this.sceneMap.project(normalized, bird.sceneRegionId);
        if (projected) {
          const world = this.sceneMap.toWorld(projected);
          bird.reanchor(world.x, world.y, projected.x, projected.y);
        }
      }
    }
    for (let index = this.birds.length - 1; index >= 0; index -= 1) if (!this.birds[index]!.active) this.birds.splice(index, 1);
    const target = this.birds.find((bird) => bird.active && bird.targetable);
    if (target) this.scene.events.emit('bird-target', { speciesId: target.plan.speciesId, state: target.state, x: target.x, y: target.y, protected: target.protectedBird });
  }

  hitAt(x: number, y: number): BirdEntity | undefined {
    return [...this.birds].sort((a, b) => b.depth - a.depth).find((bird) => {
      if (!bird.active || !bird.targetable) return false;
      const [width, height] = bird.hitbox;
      const dx = (x - bird.x) / (width * bird.scaleX * 0.5);
      const dy = (y - bird.y) / (height * bird.scaleY * 0.5);
      return dx * dx + dy * dy <= 1;
    });
  }

  private spawnFlock() {
    if (!this.profiles.length) return;
    const profile = this.rng.pick(this.profiles);
    const definition = birdSpriteBySpecies.get(profile.speciesId);
    if (!definition) throw new Error(`No bird atlas manifest entry for ${profile.speciesId}.`);
    const remaining = this.cap - this.birds.length;
    for (const plan of createFlockPlans(profile, this.rng, Math.max(1, remaining))) {
      const placement = this.sceneMap.sample(plan.surface, this.rng, { speciesId: plan.speciesId, birdFamily: definition.family });
      if (!placement) continue;
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
      this.birds.push(bird);
      this.scene.events.emit('bird-spawned', { speciesId: plan.speciesId, illustrated: true, lane: 'habitat', initialState: plan.initialState, surface: plan.surface, spawnZone: placement.regionId, sceneRegionId: placement.regionId, sceneDepth: placement.depth, worldX: placement.worldX, worldY: placement.worldY, occluded: placement.occluded, fallback: false });
    }
    this.lastSpawn = this.scene.time.now;
  }

  resize() {
    for (const bird of this.birds) {
      if (!bird.isSurfaceBound) continue;
      const world = this.sceneMap.toWorld(bird.normalizedAnchor);
      bird.reanchor(world.x, world.y, bird.normalizedAnchor.x, bird.normalizedAnchor.y, this.sceneMap.worldObjectScale(bird.authoredSceneScale));
      this.scene.events.emit('scene-map-selected', { sceneRegionId: bird.sceneRegionId, surface: bird.plan.surface, sceneDepth: bird.sceneDepth, worldX: world.x, worldY: world.y });
    }
  }
}
