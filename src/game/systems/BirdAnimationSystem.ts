import type Phaser from 'phaser';
import type { BirdState } from '../../core/birds/bird-state';
import { birdSprites, frameFor, type BirdAnimationDefinition, type BirdSpriteDefinition } from '../../data/bird-sprites';

export function birdAnimationKey(definition: BirdSpriteDefinition, variant: string, state: BirdState) {
  return `${definition.textureKey}-${variant}-${state}`;
}

export function registerBirdAnimations(scene: Phaser.Scene) {
  for (const definition of birdSprites) {
    const texture = scene.textures.get(definition.textureKey);
    for (const variant of definition.variants) {
      for (const [state, animation] of Object.entries(definition.animations) as [BirdState, BirdAnimationDefinition][]) {
        const key = birdAnimationKey(definition, variant, state);
        if (scene.anims.exists(key)) continue;
        const frames = animation.frames
          .map((pose) => frameFor(definition, variant, pose))
          .filter((name) => texture.has(name));
        if (!frames.length) continue;
        scene.anims.create({ key, frames: frames.map((frame) => ({ key: definition.textureKey, frame })), frameRate: animation.frameRate, repeat: animation.repeat });
      }
    }
  }
}
