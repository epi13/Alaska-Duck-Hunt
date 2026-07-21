import type Phaser from 'phaser';
import { createFlockPlans } from '../../core/birds/bird-plan';
import type { SeededRandom } from '../../core/rng';
import { birdBehaviors, type BirdBehaviorProfile } from '../../data/bird-behaviors';
import { profilesForLocation } from '../../data/bird-habitats';
import { birdSpriteBySpecies } from '../../data/bird-sprites';
import { BirdEntity } from '../entities/BirdEntity';

export class BirdSpawnSystem {
  readonly birds: BirdEntity[] = [];
  private profiles: BirdBehaviorProfile[];
  private lastSpawn = -10_000;
  constructor(private scene: Phaser.Scene, private rng: SeededRandom, locationId: string, private cap = 14) {
    this.profiles = profilesForLocation(locationId, birdBehaviors);
  }

  seedInitialFlocks() {
    this.spawnFlock();
    this.spawnFlock();
  }

  update(nowMs: number, deltaMs: number) {
    if (nowMs - this.lastSpawn > 4_600 && this.birds.filter((bird) => bird.active).length < this.cap) this.spawnFlock();
    for (const bird of this.birds) bird.updateBehavior(nowMs, deltaMs, this.scene.scale.width, this.scene.scale.height);
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
      const [x, y] = groundPosition(plan.spawnX, plan.surface, this.scene.scale.width, this.scene.scale.height);
      const bird = new BirdEntity(this.scene, plan, definition, x, y, profile.speciesId === 'spectacled');
      bird.y += plan.formationOffsetY * this.scene.scale.height;
      this.birds.push(bird);
      this.scene.events.emit('bird-spawned', { speciesId: plan.speciesId, illustrated: true, lane: 'ground', initialState: plan.initialState, surface: plan.surface, fallback: false });
    }
    this.lastSpawn = this.scene.time.now;
  }
}

function groundPosition(fractionX: number, surface: string, width: number, height: number): [number, number] {
  const water = ['openWater', 'shallowWater', 'riverEdge'].includes(surface);
  const perch = surface === 'lowBranch';
  return [fractionX * width, (perch ? 0.56 : water ? 0.72 : surface === 'tallGrass' ? 0.81 : 0.86) * height];
}
