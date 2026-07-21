import Phaser from 'phaser';
import { SeededRandom } from '../core/rng';
import { locations } from '../data/content';
import { birdScoringBySpecies, scoreBird } from '../data/bird-scoring';
import { birdSprites } from '../data/bird-sprites';
import { habitatAtlasPaths, retrieverSheet, sceneArt, sceneArtByLocation, type HabitatProp, type SceneArt } from '../data/scene-art';
import { BirdSpawnSystem } from './systems/BirdSpawnSystem';
import { DogFlushSystem } from './systems/DogFlushSystem';
import { registerBirdAnimations } from './systems/BirdAnimationSystem';

export class HuntScene extends Phaser.Scene {
  private reticle!: Phaser.GameObjects.Container;
  private score = 0;
  private ammo = 5;
  private hits = 0;
  private shots = 0;
  private combo = 0;
  private timeLeft = 60;
  private ended = false;
  private paused = false;
  private rng = new SeededRandom('default');
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private moveKeys?: Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key>;
  private background?: Phaser.GameObjects.Image;
  private habitatProps: { sprite: Phaser.GameObjects.Sprite; spec: HabitatProp }[] = [];
  private activeSceneArt?: SceneArt;
  private locationName = '';
  private readonly requestedLocation: number;
  private spawnSystem?: BirdSpawnSystem;
  private dogSystem?: DogFlushSystem;
  private featherPool: Phaser.GameObjects.Rectangle[] = [];

  constructor(location = 2) { super('hunt'); this.requestedLocation = location; }

  preload() {
    for (const sprite of birdSprites) this.load.atlas(sprite.textureKey, sprite.imagePath, sprite.atlasPath);
    const requestedId = locations[this.requestedLocation]?.id ?? locations[2]!.id;
    const requestedArt = sceneArtByLocation.get(requestedId) ?? sceneArt[2];
    if (requestedArt) this.load.image(`scene-${requestedArt.locationId}`, requestedArt.background);
    for (const [key, path] of Object.entries(habitatAtlasPaths)) this.load.spritesheet(`habitat-${key}`, path, { frameWidth: 256, frameHeight: 256 });
    this.load.spritesheet(retrieverSheet.key, retrieverSheet.path, { frameWidth: retrieverSheet.frameWidth, frameHeight: retrieverSheet.frameHeight });
  }

  create(data: { seed?: string; location?: number } = {}) {
    this.rng = new SeededRandom(data.seed ?? new URLSearchParams(location.search).get('seed') ?? new Date().toISOString().slice(0, 10));
    const loc = locations[data.location ?? this.requestedLocation] ?? locations[2]!;
    this.locationName = loc.name;
    this.cameras.main.setBackgroundColor(loc.palette[3]);
    this.createHabitat(loc.id);
    registerBirdAnimations(this);
    this.createFeatherPool();
    this.dogSystem = new DogFlushSystem(this);
    this.spawnSystem = new BirdSpawnSystem(this, this.rng, loc.id);
    this.spawnSystem.seedInitialFlocks();
    this.createReticle();
    this.input.setDefaultCursor('none');
    this.cursors = this.input.keyboard?.createCursorKeys();
    if (this.input.keyboard) this.moveKeys = { up: this.input.keyboard.addKey('W'), down: this.input.keyboard.addKey('S'), left: this.input.keyboard.addKey('A'), right: this.input.keyboard.addKey('D') };
    this.emitHud();
    this.events.emit('scene-art-ready', { locationId: loc.id, background: this.activeSceneArt?.background, layers: 3 });
    const resize = () => this.layoutHabitat();
    this.scale.on(Phaser.Scale.Events.RESIZE, resize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off(Phaser.Scale.Events.RESIZE, resize));
    this.events.emit('ready');
  }

  private createHabitat(locationId: string) {
    this.activeSceneArt = sceneArtByLocation.get(locationId) ?? sceneArt[2];
    if (!this.activeSceneArt) return;
    this.background = this.add.image(0, 0, `scene-${this.activeSceneArt.locationId}`).setDepth(0);
    const texture = `habitat-${this.activeSceneArt.habitatAtlas}`;
    for (const spec of [...this.activeSceneArt.midground, ...this.activeSceneArt.foreground]) {
      const depth = this.activeSceneArt.midground.includes(spec) ? 35 : 70;
      this.habitatProps.push({ sprite: this.add.sprite(0, 0, texture, spec.frame).setOrigin(0.5, 1).setDepth(depth), spec });
    }
    this.layoutHabitat();
  }

  private layoutHabitat() {
    const { width, height } = this.scale;
    if (this.background) this.background.setPosition(width / 2, height / 2).setScale(Math.max(width / 1280, height / 720));
    const responsiveScale = Phaser.Math.Clamp(height / 720, 0.65, 1.4);
    for (const { sprite, spec } of this.habitatProps) sprite.setPosition(spec.x * width, spec.y * height).setScale(spec.scale * responsiveScale).setFlipX(Boolean(spec.flip));
    if (this.dogSystem) this.dogSystem.sprite.y = height * 0.94;
  }

  private createReticle() {
    const graphics = this.add.graphics().lineStyle(3, 0xf4e8cf, 1);
    graphics.strokeCircle(0, 0, 18).lineBetween(-30, 0, -10, 0).lineBetween(10, 0, 30, 0).lineBetween(0, -30, 0, -10).lineBetween(0, 10, 0, 30);
    this.reticle = this.add.container(this.scale.width / 2, this.scale.height / 2, [graphics]).setDepth(100);
  }

  fire(x: number, y: number) {
    if (this.paused || this.ended) return;
    if (this.ammo <= 0) { this.events.emit('notice', 'EMPTY — PRESS R'); return; }
    this.ammo -= 1;
    this.shots += 1;
    this.cameras.main.shake(45, 0.002);
    const bird = this.spawnSystem?.hitAt(x, y);
    const scoredState = bird?.state;
    if (!bird || !scoredState || !bird.strike()) {
      this.combo = 0;
      this.events.emit('notice', 'MISS');
      this.emitHud();
      return;
    }
    const scoring = birdScoringBySpecies.get(bird.plan.speciesId);
    const result = scoreBird({ speciesId: bird.plan.speciesId, state: scoredState, distance: Math.max(0, Math.min(1, 1 - bird.scale / 1.2)), speedRatio: bird.plan.speed / 220, combo: this.combo });
    if (scoring?.role === 'protected') {
      this.combo = 0;
      this.score = Math.max(0, this.score - result.protectedPenalty);
      this.events.emit('notice', `PROTECTED SPECTACLED EIDER — −${result.protectedPenalty}`);
      this.feathers(bird.x, bird.y, 0xe86c5b);
    } else {
      this.combo += 1;
      this.hits += 1;
      this.score += result.points;
      this.events.emit('notice', `${result.label ?? 'CLEAN HIT'} +${result.points}`);
      this.feathers(bird.x, bird.y, 0xf3d49a);
    }
    this.events.emit('bird-scored', { speciesId: bird.plan.speciesId, state: scoredState, ...result });
    this.emitHud();
  }

  fireAtAim() { this.fire(this.reticle.x, this.reticle.y); }
  aim(x: number, y: number) { this.reticle.setPosition(x, y); this.events.emit('aim', { x, y }); }
  reloadHunt() { this.reload(); }
  resumeHunt() { this.paused = false; if (this.physics?.world) this.physics.world.isPaused = false; this.events.emit('pause', false); }
  pauseHunt() { this.paused = true; if (this.physics?.world) this.physics.world.isPaused = true; this.events.emit('pause', true); }

  private feathers(x: number, y: number, color: number) {
    for (let index = 0; index < 9; index += 1) {
      const feather = this.featherPool.find((entry) => !entry.active);
      if (!feather) break;
      feather.setActive(true).setVisible(true).setPosition(x, y).setFillStyle(color).setAlpha(1).setAngle(0);
      this.tweens.add({ targets: feather, x: x + this.rng.int(-55, 55), y: y + this.rng.int(-20, 80), angle: this.rng.int(-120, 120), alpha: 0, duration: 650, onComplete: () => feather.setActive(false).setVisible(false) });
    }
  }

  private createFeatherPool() {
    this.featherPool = Array.from({ length: 24 }, () => this.add.rectangle(0, 0, 4, 8, 0xf3d49a).setDepth(90).setActive(false).setVisible(false));
  }

  private reload() { if (this.paused || this.ended) return; this.ammo = 5; this.events.emit('notice', 'RELOADED'); this.emitHud(); }
  private emitHud() { this.events.emit('hud', { score: this.score, ammo: this.ammo, hits: this.hits, shots: this.shots, combo: this.combo, time: Math.ceil(this.timeLeft), location: this.locationName }); }

  update(_time: number, delta: number) {
    if (this.paused || this.ended) return;
    const speed = 360 * (delta / 1_000);
    if (this.cursors?.left.isDown || this.moveKeys?.left.isDown) this.reticle.x -= speed;
    if (this.cursors?.right.isDown || this.moveKeys?.right.isDown) this.reticle.x += speed;
    if (this.cursors?.up.isDown || this.moveKeys?.up.isDown) this.reticle.y -= speed;
    if (this.cursors?.down.isDown || this.moveKeys?.down.isDown) this.reticle.y += speed;
    this.reticle.x = Phaser.Math.Clamp(this.reticle.x, 30, this.scale.width - 30);
    this.reticle.y = Phaser.Math.Clamp(this.reticle.y, 30, this.scale.height - 30);
    this.spawnSystem?.update(this.time.now, delta);
    this.dogSystem?.update(this.time.now, delta, this.spawnSystem?.birds ?? []);
    this.timeLeft -= delta / 1_000;
    if (this.timeLeft <= 0) {
      this.ended = true;
      this.events.emit('complete', { score: this.score, hits: this.hits, shots: this.shots, accuracy: this.shots ? Math.round((this.hits / this.shots) * 100) : 0 });
    }
    this.emitHud();
  }
}
