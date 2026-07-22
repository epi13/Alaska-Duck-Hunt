import Phaser from 'phaser';
import type { BirdEntity } from '../entities/BirdEntity';
import { retrieverSheet } from '../../data/scene-art';
import { samplePathAt, type DogPatrolPath } from '../../core/scenes/scene-map';
import type { SeededRandom } from '../../core/rng';
import type { SceneMapSystem } from './SceneMapSystem';

export class DogFlushSystem {
  readonly sprite: Phaser.GameObjects.Sprite;
  private direction: 1 | -1 = 1;
  private boundUntil = 0;
  private progress = 0;
  private progressRange: readonly [number, number] = [0, 1];
  private readonly path: DogPatrolPath;
  constructor(private scene: Phaser.Scene, private sceneMap: SceneMapSystem, rng: SeededRandom) {
    this.path = rng.pick(sceneMap.dogPatrolPaths());
    for (const [key, start, end, frameRate] of [['search', 4, 7, 7], ['bound', 8, 11, 9], ['run', 0, 3, 10]] as const) {
      const animationKey = `retriever-${key}`;
      if (!scene.anims.exists(animationKey)) scene.anims.create({ key: animationKey, frames: scene.anims.generateFrameNumbers(retrieverSheet.key, { start, end }), frameRate, repeat: -1 });
    }
    this.sprite = scene.add.sprite(0, 0, retrieverSheet.key, 4).setOrigin(0.5, 1).setDepth(this.path.displayDepth).play('retriever-search');
    this.resize();
  }

  update(nowMs: number, deltaMs: number, birds: readonly BirdEntity[]) {
    const dt = deltaMs / 1_000;
    this.progress += this.direction * .085 * dt;
    if ((this.direction > 0 && this.progress >= this.progressRange[1]) || (this.direction < 0 && this.progress <= this.progressRange[0])) {
      this.progress = Math.min(this.progressRange[1], Math.max(this.progressRange[0], this.progress));
      this.direction = this.direction === 1 ? -1 : 1;
      this.sprite.setFlipX(this.direction < 0);
    }
    this.positionOnPath(nowMs);
    if (nowMs >= this.boundUntil) this.sprite.setDepth(this.path.displayDepth).play('retriever-search', true);
    for (const bird of birds) {
      if (bird.disturb(this.sprite.x, this.sprite.y, nowMs)) {
        this.boundUntil = nowMs + 520;
        this.sprite.setDepth(76).play('retriever-bound', true);
        this.scene.events.emit('dog-flush', { speciesId: bird.plan.speciesId, surface: bird.plan.surface, initialState: bird.state });
      }
    }
  }

  resize() {
    const visible = this.sceneMap.visibleBounds();
    const visibleSamples = Array.from({ length: 101 }, (_, index) => index / 100).filter((progress) => {
      const point = samplePathAt(this.path.points, progress);
      return point.x >= visible.minX && point.x <= visible.maxX && point.y >= visible.minY && point.y <= visible.maxY;
    });
    this.progressRange = visibleSamples.length ? [visibleSamples[0]!, visibleSamples[visibleSamples.length - 1]!] : [0, 1];
    this.progress = Math.min(this.progressRange[1], Math.max(this.progressRange[0], this.progress || this.progressRange[0]));
    this.positionOnPath(this.scene.time.now);
  }

  private positionOnPath(nowMs: number) {
    const normalized = samplePathAt(this.path.points, this.progress);
    const world = this.sceneMap.toWorld(normalized);
    const scale = this.path.objectScale[0] + (this.path.objectScale[1] - this.path.objectScale[0]) * normalized.y;
    this.sprite.setPosition(world.x, world.y - (nowMs < this.boundUntil ? Math.sin((this.boundUntil - nowMs) / 190) * 24 : 0));
    this.sprite.setScale(this.sceneMap.worldObjectScale(scale));
    this.scene.events.emit('dog-map-position', { pathId: this.path.id, worldX: world.x, worldY: world.y, progress: this.progress });
  }
}
