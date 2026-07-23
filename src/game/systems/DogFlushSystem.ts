import Phaser from 'phaser';
import type { BirdEntity } from '../entities/BirdEntity';
import { huskySprite, type HuskyAnimationState } from '../../data/husky-sprites';
import { huskyBoundLift, huskyFlushMotion, huskyPatrolMotion } from '../../core/dog/husky-motion';
import { samplePathAt, type DogPatrolPath } from '../../core/scenes/scene-map';
import type { SeededRandom } from '../../core/rng';
import type { SceneMapSystem } from './SceneMapSystem';
import type { ScenePropSystem } from './ScenePropSystem';

export class DogFlushSystem {
  readonly sprite: Phaser.GameObjects.Sprite;
  private direction: 1 | -1 = 1;
  private flushStartedAt = Number.NEGATIVE_INFINITY;
  private turnUntil = 0;
  private progress = 0;
  private progressRange: readonly [number, number] = [0, 1];
  private readonly path: DogPatrolPath;
  private readonly phaseOffsetMs: number;
  private readonly animationPhase: number;
  private readonly animationRateMultiplier: number;
  private readonly reducedMotion: boolean;
  private currentState: HuskyAnimationState = 'idle';
  constructor(private scene: Phaser.Scene, private sceneMap: SceneMapSystem, private sceneProps: ScenePropSystem, rng: SeededRandom) {
    this.path = rng.pick(sceneMap.dogPatrolPaths());
    this.phaseOffsetMs = rng.int(0, 9_799);
    this.animationPhase = this.phaseOffsetMs / 9_800;
    this.animationRateMultiplier = .96 + ((this.phaseOffsetMs * 2_654_435_761) >>> 0) / 0xffff_ffff * .08;
    this.reducedMotion = document.querySelector('#app')?.classList.contains('reduce-motion') === true
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    for (const animation of huskySprite.animations) {
      const animationKey = `husky-${animation.key}`;
      if (!scene.anims.exists(animationKey)) {
        scene.anims.create({
          key: animationKey,
          frames: animation.frames.map((frame) => ({ key: huskySprite.textureKey, frame })),
          frameRate: this.reducedMotion ? 1 : animation.frameRate,
          repeat: this.reducedMotion ? 0 : animation.repeat,
        });
      }
    }
    this.sprite = scene.add.sprite(0, 0, huskySprite.textureKey, 'idle/0')
      .setOrigin(huskySprite.contactAnchor.x, huskySprite.contactAnchor.y)
      .setDepth(this.path.displayDepth);
    this.playState('idle');
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.sprite.destroy());
    this.resize();
  }

  update(nowMs: number, deltaMs: number, birds: readonly BirdEntity[]) {
    const flushElapsed = nowMs - this.flushStartedAt;
    const flushMotion = huskyFlushMotion(flushElapsed);
    const patrolMotion = huskyPatrolMotion(nowMs, this.phaseOffsetMs);
    const motion = flushMotion ?? patrolMotion;
    const dt = deltaMs / 1_000;
    this.progress += this.direction * .12 * motion.speedFactor * dt;
    if ((this.direction > 0 && this.progress >= this.progressRange[1]) || (this.direction < 0 && this.progress <= this.progressRange[0])) {
      this.progress = Math.min(this.progressRange[1], Math.max(this.progressRange[0], this.progress));
      this.direction = this.direction === 1 ? -1 : 1;
      this.turnUntil = nowMs + (this.reducedMotion ? 100 : 280);
      this.sprite.setFlipX(this.direction < 0);
    }
    const state = flushMotion?.state ?? (nowMs < this.turnUntil ? 'turnTransition' : patrolMotion.state);
    this.playState(state);
    this.positionOnPath(flushElapsed);
    for (const bird of birds) {
      if (bird.disturb(this.sprite.x, this.sprite.y, nowMs)) {
        this.flushStartedAt = nowMs;
        this.playState('boundCover');
        this.scene.events.emit('dog-flush', { speciesId: bird.plan.speciesId, surface: bird.plan.surface, initialState: bird.state });
      }
    }
  }

  celebrate() {
    this.playState('celebrate');
  }

  resize() {
    const visible = this.sceneMap.visibleBounds();
    const spriteMargin = 62 * this.sceneMap.worldObjectScale(this.path.objectScale[1]);
    const visibleSamples = Array.from({ length: 101 }, (_, index) => index / 100).filter((progress) => {
      const point = samplePathAt(this.path.points, progress);
      const world = this.sceneMap.toWorld(point);
      return point.x >= visible.minX && point.x <= visible.maxX && point.y >= visible.minY && point.y <= visible.maxY
        && world.x >= spriteMargin && world.x <= this.scene.scale.width - spriteMargin;
    });
    this.progressRange = visibleSamples.length ? [visibleSamples[0]!, visibleSamples[visibleSamples.length - 1]!] : [0, 1];
    this.progress = Math.min(this.progressRange[1], Math.max(this.progressRange[0], this.progress || this.progressRange[0]));
    this.positionOnPath(this.scene.time.now - this.flushStartedAt);
  }

  private playState(state: HuskyAnimationState) {
    if (this.currentState === state && (this.reducedMotion || this.sprite.anims.currentAnim)) return;
    this.currentState = state;
    const definition = huskySprite.animations.find(({ key }) => key === state);
    if (!definition) throw new Error(`Missing Alaskan Husky animation: ${state}`);
    if (this.reducedMotion) {
      this.sprite.anims.stop();
      this.sprite.setFrame(definition.frames[0]!);
    } else {
      const looping = definition.repeat === -1 && !['boundCover', 'flushReaction'].includes(state);
      this.sprite.play(`husky-${state}`, true);
      this.sprite.anims.timeScale = looping ? this.animationRateMultiplier : 1;
      if (looping && definition.frames.length > 1) this.sprite.anims.setProgress(this.animationPhase);
    }
  }

  private positionOnPath(flushElapsed: number) {
    const normalized = samplePathAt(this.path.points, this.progress);
    const world = this.sceneMap.toWorld(normalized);
    const scale = this.path.objectScale[0] + (this.path.objectScale[1] - this.path.objectScale[0]) * normalized.y;
    const worldScale = this.sceneMap.worldObjectScale(scale);
    const lift = this.currentState === 'boundCover' ? huskyBoundLift(flushElapsed, this.reducedMotion) * worldScale : 0;
    this.sprite.setPosition(world.x, world.y - lift).setScale(worldScale);
    const propDepth = this.sceneProps.resolveActor(normalized, this.path.displayDepth, 'dog');
    this.sprite.setDepth(propDepth.depth);
    this.scene.events.emit('dog-map-position', {
      characterId: huskySprite.characterId,
      animationState: this.currentState,
      frame: this.sprite.frame.name,
      facing: this.direction > 0 ? 'right' : 'left',
      flipX: this.sprite.flipX,
      reducedMotion: this.reducedMotion,
      animationPhase: this.animationPhase,
      animationRateMultiplier: this.sprite.anims.timeScale,
      pathId: this.path.id,
      worldX: world.x,
      worldY: world.y,
      renderedContactY: this.sprite.y,
      contactError: Math.abs(this.sprite.y - world.y),
      progress: this.progress,
      scale: worldScale,
      depth: propDepth.depth,
      propId: propDepth.propId,
      relation: propDepth.relation,
    });
  }
}
