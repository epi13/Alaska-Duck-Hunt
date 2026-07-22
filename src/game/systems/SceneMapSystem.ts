import Phaser from 'phaser';
import type { BirdSurface } from '../../core/birds/bird-plan';
import type { SeededRandom } from '../../core/rng';
import {
  createCoverTransform,
  normalizedToWorld,
  projectOntoGeometry,
  regionsForSurface,
  sampleScenePoint,
  worldToNormalized,
  type DogPatrolPath,
  type NormalizedPoint,
  type SampledScenePoint,
  type SceneMap,
  type SceneMapQuery,
} from '../../core/scenes/scene-map';

export interface WorldScenePoint extends SampledScenePoint {
  readonly worldX: number;
  readonly worldY: number;
  readonly worldScale: number;
  readonly occluded: boolean;
}

export class SceneMapSystem {
  private width: number;
  private height: number;
  private debugGraphics?: Phaser.GameObjects.Graphics;
  private debugLabels: Phaser.GameObjects.Text[] = [];
  private selected?: WorldScenePoint;
  private readonly samples: WorldScenePoint[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    readonly map: SceneMap,
    private readonly debugEnabled = false,
  ) {
    this.width = scene.scale.width;
    this.height = scene.scale.height;
    if (debugEnabled) this.createDebugOverlay();
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.redrawDebugOverlay();
  }

  regions(surface: BirdSurface, query: SceneMapQuery = {}) {
    return regionsForSurface(this.map, surface, { ...query, visibleBounds: this.visibleBounds() });
  }

  sample(surface: BirdSurface, rng: SeededRandom, query: SceneMapQuery = {}): WorldScenePoint | undefined {
    const sampled = sampleScenePoint(this.map, surface, rng, { ...query, visibleBounds: this.visibleBounds() });
    if (!sampled) return undefined;
    const world = this.toWorld(sampled.point);
    const result: WorldScenePoint = {
      ...sampled,
      worldX: world.x,
      worldY: world.y,
      worldScale: sampled.scale * this.coverTransform().scale,
      occluded: sampled.occlusionAreaIds.length > 0,
    };
    this.selected = result;
    this.samples.push(result);
    if (this.samples.length > 24) this.samples.shift();
    this.redrawDebugOverlay();
    return result;
  }

  project(point: NormalizedPoint, regionId: string): NormalizedPoint | undefined {
    const region = this.map.regions.find(({ id }) => id === regionId);
    return region ? projectOntoGeometry(point, region.geometry) : undefined;
  }

  dogPatrolPaths(): readonly DogPatrolPath[] {
    return this.map.dogPatrolPaths;
  }

  toWorld(point: NormalizedPoint): NormalizedPoint {
    return normalizedToWorld(point, this.coverTransform());
  }

  fromWorld(point: NormalizedPoint): NormalizedPoint {
    return worldToNormalized(point, this.coverTransform());
  }

  worldObjectScale(authoredScale: number) {
    return authoredScale * this.coverTransform().scale;
  }

  visibleBounds() {
    const topLeft = this.fromWorld({ x: 0, y: 0 });
    const bottomRight = this.fromWorld({ x: this.width, y: this.height });
    return {
      minX: Math.max(0, topLeft.x),
      maxX: Math.min(1, bottomRight.x),
      minY: Math.max(0, topLeft.y),
      maxY: Math.min(1, bottomRight.y),
    };
  }

  private coverTransform() {
    return createCoverTransform(this.map.sourceSize, [this.width, this.height]);
  }

  private createDebugOverlay() {
    this.debugGraphics = this.scene.add.graphics().setDepth(96).setScrollFactor(0);
    this.redrawDebugOverlay();
  }

  private redrawDebugOverlay() {
    if (!this.debugEnabled || !this.debugGraphics) return;
    this.debugGraphics.clear();
    for (const label of this.debugLabels) label.destroy();
    this.debugLabels = [];
    for (const region of this.map.regions) {
      const color = surfaceColor(region.surface);
      const worldPoints = region.geometry.points.map((point) => this.toWorld(point));
      this.debugGraphics.lineStyle(2, color, .9).fillStyle(color, region.geometry.kind === 'polygon' ? .14 : .04);
      if (region.geometry.kind === 'polygon') this.debugGraphics.fillPoints(worldPoints, true).strokePoints(worldPoints, true);
      else this.debugGraphics.strokePoints(worldPoints, false);
      const labelPoint = worldPoints[Math.floor(worldPoints.length / 2)];
      if (labelPoint && labelPoint.x >= 0 && labelPoint.x <= this.width && labelPoint.y >= 0 && labelPoint.y <= this.height) {
        this.debugLabels.push(this.scene.add.text(labelPoint.x, labelPoint.y, `${region.id}\nd=${region.depth[0].toFixed(2)}–${region.depth[1].toFixed(2)}`, {
          fontFamily: 'monospace', fontSize: '10px', color: '#ffffff', backgroundColor: '#071521cc', padding: { x: 2, y: 1 },
        }).setDepth(97).setScrollFactor(0));
      }
    }
    for (const path of this.map.dogPatrolPaths) {
      this.debugGraphics.lineStyle(3, 0xffd166, .95).strokePoints(path.points.map((point) => this.toWorld(point)), false);
    }
    for (const area of this.map.noSpawnAreas) {
      const worldPoints = area.polygon.map((point) => this.toWorld(point));
      this.debugGraphics.lineStyle(2, 0xff4d6d, .9).fillStyle(0xff4d6d, .08).fillPoints(worldPoints, true).strokePoints(worldPoints, true);
    }
    for (const area of this.map.foregroundOcclusionAreas) {
      const worldPoints = area.polygon.map((point) => this.toWorld(point));
      this.debugGraphics.lineStyle(1, 0xc77dff, .8).fillStyle(0xc77dff, .08).fillPoints(worldPoints, true).strokePoints(worldPoints, true);
    }
    this.debugGraphics.fillStyle(0xffffff, .85);
    for (const sample of this.samples) {
      const world = this.toWorld(sample.point);
      this.debugGraphics.fillCircle(world.x, world.y, 3);
    }
    if (this.selected) {
      const world = this.toWorld(this.selected.point);
      this.debugGraphics.lineStyle(3, 0x00ff88, 1).strokeCircle(world.x, world.y, 9);
      this.debugLabels.push(this.scene.add.text(8, 8, `SCENE MAP: ${this.map.locationId}\n${this.selected.regionId} • ${this.selected.surface}\ndepth ${this.selected.depth.toFixed(3)} • (${world.x.toFixed(1)}, ${world.y.toFixed(1)})`, {
        fontFamily: 'monospace', fontSize: '13px', color: '#00ff88', backgroundColor: '#071521e6', padding: { x: 6, y: 5 },
      }).setDepth(99).setScrollFactor(0));
    }
  }
}

function surfaceColor(surface: BirdSurface): number {
  if (surface === 'openWater') return 0x2ec4ff;
  if (surface === 'shallowWater') return 0x4cc9f0;
  if (['shoreline', 'riverEdge'].includes(surface)) return 0xffd166;
  if (surface === 'mudflat') return 0xb08968;
  if (['marshGrass', 'tallGrass'].includes(surface)) return 0x70e000;
  if (surface === 'snowGround') return 0xf8f9fa;
  if (surface === 'lowBranch') return 0xfb8500;
  if (surface === 'rockyCoast') return 0xadb5bd;
  return 0x80ed99;
}
