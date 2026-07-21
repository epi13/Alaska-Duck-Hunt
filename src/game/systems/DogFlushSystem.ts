import Phaser from 'phaser';
import type { BirdEntity } from '../entities/BirdEntity';
import { retrieverSheet } from '../../data/scene-art';

export class DogFlushSystem {
  readonly sprite: Phaser.GameObjects.Sprite;
  private direction: 1 | -1 = 1;
  private boundUntil = 0;
  constructor(private scene: Phaser.Scene) {
    for (const [key, start, end, frameRate] of [['search', 4, 7, 7], ['bound', 8, 11, 9], ['run', 0, 3, 10]] as const) {
      const animationKey = `retriever-${key}`;
      if (!scene.anims.exists(animationKey)) scene.anims.create({ key: animationKey, frames: scene.anims.generateFrameNumbers(retrieverSheet.key, { start, end }), frameRate, repeat: -1 });
    }
    this.sprite = scene.add.sprite(-60, scene.scale.height * 0.94, retrieverSheet.key, 4).setOrigin(0.5, 1).setDepth(58).play('retriever-search');
  }

  update(nowMs: number, deltaMs: number, birds: readonly BirdEntity[]) {
    const dt = deltaMs / 1_000;
    this.sprite.x += this.direction * 110 * dt;
    const edge = this.direction > 0 ? this.scene.scale.width + 60 : -60;
    if ((this.direction > 0 && this.sprite.x >= edge) || (this.direction < 0 && this.sprite.x <= edge)) {
      this.direction = this.direction === 1 ? -1 : 1;
      this.sprite.setFlipX(this.direction < 0);
    }
    this.sprite.y = this.scene.scale.height * 0.94 - (nowMs < this.boundUntil ? Math.sin((this.boundUntil - nowMs) / 190) * 24 : 0);
    if (nowMs >= this.boundUntil) this.sprite.setDepth(58).play('retriever-search', true);
    for (const bird of birds) {
      if (bird.disturb(this.sprite.x, this.sprite.y, nowMs)) {
        this.boundUntil = nowMs + 520;
        this.sprite.setDepth(76).play('retriever-bound', true);
        this.scene.events.emit('dog-flush', { speciesId: bird.plan.speciesId, surface: bird.plan.surface, initialState: bird.state });
      }
    }
  }
}
