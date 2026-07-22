import Phaser from 'phaser';
import { hashSeed } from '../../core/rng';
import {
  resolveActorPropDepth,
  scenePropDisplayDepth,
  validateScenePropLayout,
  type ScenePropLayout,
  type ScenePropPlacement,
  type ActorPropDepth,
} from '../../core/scenes/scene-props';
import type { NormalizedPoint } from '../../core/scenes/scene-map';
import type { SceneMapSystem } from './SceneMapSystem';

interface RenderedProp {
  readonly placement: ScenePropPlacement;
  readonly sprite: Phaser.GameObjects.Sprite;
  readonly displayDepth: number;
  readonly baseRotation: number;
  readonly windPhase: number;
}

export class ScenePropSystem {
  private readonly rendered: RenderedProp[];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly sceneMap: SceneMapSystem,
    readonly layout: ScenePropLayout,
  ) {
    const validations = validateScenePropLayout(layout, sceneMap.map);
    const errors = validations.filter(({ valid }) => !valid);
    this.rendered = layout.placements.map((placement) => {
      const displayDepth = scenePropDisplayDepth(placement);
      return {
        placement,
        displayDepth,
        baseRotation: placement.rotation ?? 0,
        windPhase: (hashSeed(placement.id) / 0xffff_ffff) * Math.PI * 2,
        sprite: scene.add.sprite(0, 0, `habitat-${placement.atlas}`, placement.frame)
          .setOrigin(...placement.origin)
          .setFlipX(Boolean(placement.flip))
          .setDepth(displayDepth),
      };
    });
    this.sceneMap.setPropDebug(layout.placements, validations);
    if (errors.length) throw new Error(`Invalid ${layout.locationId} prop layout: ${errors.map(({ placementId, errors: messages }) => `${placementId}: ${messages.join(', ')}`).join('; ')}`);
    this.resize();
    this.scene.events.emit('scene-props-ready', { locationId: layout.locationId, count: layout.placements.length, invalidCount: errors.length });
  }

  resize() {
    for (const rendered of this.rendered) {
      const world = this.sceneMap.toWorld(rendered.placement.anchor);
      const scale = this.sceneMap.worldObjectScale(rendered.placement.baseScale);
      rendered.sprite
        .setPosition(world.x, world.y)
        .setScale(scale, scale * (rendered.placement.aspectScaleY ?? 1));
    }
    const visible = this.sceneMap.visibleBounds();
    const telemetryProp = this.rendered.find(({ placement }) => placement.anchor.x >= visible.minX && placement.anchor.x <= visible.maxX && placement.anchor.y >= visible.minY && placement.anchor.y <= visible.maxY);
    if (telemetryProp) {
      const world = this.sceneMap.toWorld(telemetryProp.placement.anchor);
      this.scene.events.emit('scene-prop-position', { id: telemetryProp.placement.id, worldX: world.x, worldY: world.y, depth: telemetryProp.displayDepth });
    }
    this.sceneMap.refreshDebug();
  }

  update(nowMs: number) {
    for (const rendered of this.rendered) {
      const amplitude = windAmplitude(rendered.placement.wind);
      const speed = windSpeed(rendered.placement.wind);
      rendered.sprite.setAngle(rendered.baseRotation + Math.sin(nowMs * speed + rendered.windPhase) * amplitude);
    }
  }

  resolveActor(point: NormalizedPoint, baseDepth: number, actor: 'bird' | 'dog'): ActorPropDepth {
    const result = resolveActorPropDepth(this.layout.placements, point, baseDepth, actor);
    this.sceneMap.setActorDepthDebug(actor, result.depth, result.propId, result.relation);
    return result;
  }

  get placements() {
    return this.layout.placements;
  }
}

function windAmplitude(profile: ScenePropPlacement['wind']) {
  if (profile === 'light') return .6;
  if (profile === 'moderate') return 1.2;
  if (profile === 'strong') return 2;
  return 0;
}

function windSpeed(profile: ScenePropPlacement['wind']) {
  if (profile === 'light') return .0007;
  if (profile === 'moderate') return .0011;
  if (profile === 'strong') return .0016;
  return 0;
}
