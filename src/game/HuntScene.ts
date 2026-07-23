import Phaser from 'phaser';
import { evaluateRound, type RoundConfig, type RoundResultStats } from '../core/modes/round-config';
import { SeededRandom } from '../core/rng';
import { locations } from '../data/content';
import { birdScoringBySpecies, scoreBird } from '../data/bird-scoring';
import { birdSprites } from '../data/bird-sprites';
import { habitatAtlasPaths, sceneArt, sceneArtByLocation, type SceneArt } from '../data/scene-art';
import { huskySprite } from '../data/husky-sprites';
import { sceneMapByLocation } from '../data/scene-maps';
import { scenePropLayoutByLocation } from '../data/scene-props';
import { BirdSpawnSystem } from './systems/BirdSpawnSystem';
import { DogFlushSystem } from './systems/DogFlushSystem';
import { registerBirdAnimations } from './systems/BirdAnimationSystem';
import { SceneMapSystem } from './systems/SceneMapSystem';
import { ScenePropSystem } from './systems/ScenePropSystem';

export class HuntScene extends Phaser.Scene {
  private reticle!: Phaser.GameObjects.Container;
  private score = 0;
  private ammo: number;
  private reloadsRemaining: number | 'unlimited';
  private hits = 0;
  private shots = 0;
  private misses = 0;
  private nonTargetHits = 0;
  private protectedHits = 0;
  private combo = 0;
  private timeLeft: number;
  private elapsedSeconds = 0;
  private ended = false;
  private paused = false;
  private rng = new SeededRandom('default');
  private audioRng = new SeededRandom('default-audio');
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private moveKeys?: Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key>;
  private background?: Phaser.GameObjects.Image;
  private activeSceneArt?: SceneArt;
  private locationName = '';
  private spawnSystem?: BirdSpawnSystem;
  private dogSystem?: DogFlushSystem;
  private sceneMapSystem?: SceneMapSystem;
  private scenePropSystem?: ScenePropSystem;
  private featherPool: Phaser.GameObjects.Rectangle[] = [];
  private finalSecondsAnnounced = false;
  private nextEnvironmentSoundAt = 8_000;
  private environmentSound: 'rain' | 'water' | 'vegetation' = 'vegetation';

  constructor(private readonly config: RoundConfig) {
    super('hunt');
    this.ammo = config.ammunition.magazineSize;
    this.reloadsRemaining = config.ammunition.reloads;
    this.timeLeft = config.durationSeconds ?? 0;
  }

  preload() {
    for (const sprite of birdSprites)
      this.load.atlas(sprite.textureKey, sprite.imagePath, sprite.atlasPath);
    const requestedArt = sceneArtByLocation.get(this.config.locationId) ?? sceneArt[2];
    if (requestedArt) this.load.image(`scene-${requestedArt.locationId}`, requestedArt.background);
    for (const [key, path] of Object.entries(habitatAtlasPaths))
      this.load.spritesheet(`habitat-${key}`, path, { frameWidth: 256, frameHeight: 256 });
    this.load.atlas(huskySprite.textureKey, huskySprite.imagePath, huskySprite.atlasPath);
  }

  create(data: { seed?: string } = {}) {
    this.rng = new SeededRandom(
      data.seed ?? new URLSearchParams(location.search).get('seed') ?? this.config.seed,
    );
    this.audioRng = this.rng.fork('environment-audio');
    const loc = locations.find(({ id }) => id === this.config.locationId) ?? locations[2]!;
    this.environmentSound = ['aleutian', 'southeast'].includes(loc.id)
      ? 'rain'
      : ['cook', 'copper', 'river', 'matsu'].includes(loc.id)
        ? 'water'
        : 'vegetation';
    this.locationName = loc.name;
    this.cameras.main.setBackgroundColor(loc.palette[3]);
    this.createBackground(loc.id);
    const sceneMap = sceneMapByLocation.get(loc.id);
    if (!sceneMap) throw new Error(`No authored scene map for ${loc.id}.`);
    this.sceneMapSystem = new SceneMapSystem(
      this,
      sceneMap,
      new URLSearchParams(location.search).get('debugSceneMap') === '1',
    );
    const propLayout = scenePropLayoutByLocation.get(loc.id);
    if (!propLayout) throw new Error(`No authored prop layout for ${loc.id}.`);
    this.scenePropSystem = new ScenePropSystem(this, this.sceneMapSystem, propLayout);
    registerBirdAnimations(this);
    this.createFeatherPool();
    this.dogSystem = new DogFlushSystem(
      this,
      this.sceneMapSystem,
      this.scenePropSystem,
      this.rng.fork('dog'),
    );
    this.spawnSystem = new BirdSpawnSystem(
      this,
      this.rng,
      loc.id,
      this.sceneMapSystem,
      this.scenePropSystem,
      {
        cap: this.config.flockCap,
        cadenceMs: this.config.spawnCadenceMs,
        speedMultiplier: this.config.speedMultiplier,
        species: this.config.spawnSpecies,
        escalating: this.config.endless,
      },
    );
    this.spawnSystem.seedInitialFlocks();
    this.createVisibilityOverlay();
    this.createReticle();
    this.input.setDefaultCursor('none');
    this.cursors = this.input.keyboard?.createCursorKeys();
    if (this.input.keyboard)
      this.moveKeys = {
        up: this.input.keyboard.addKey('W'),
        down: this.input.keyboard.addKey('S'),
        left: this.input.keyboard.addKey('A'),
        right: this.input.keyboard.addKey('D'),
      };
    this.emitHud();
    this.events.emit('scene-art-ready', {
      locationId: loc.id,
      background: this.activeSceneArt?.background,
      layers: 4,
    });
    this.events.emit('scene-map-ready', {
      locationId: loc.id,
      regionCount: sceneMap.regions.length,
      dogPathIds: sceneMap.dogPatrolPaths.map(({ id }) => id),
    });
    this.events.emit('hunt-phase', { phase: 'active', locationId: loc.id });
    this.events.emit('round-config', this.config);
    const resize = () => this.layoutHabitat();
    this.scale.on(Phaser.Scale.Events.RESIZE, resize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      this.scale.off(Phaser.Scale.Events.RESIZE, resize),
    );
    this.events.emit('ready');
  }

  private createVisibilityOverlay() {
    const alpha = Math.max(0, 1 - this.config.visibility) * 0.48;
    if (alpha <= 0) return;
    const color =
      this.config.weather === 'snow'
        ? 0xdce9ec
        : this.config.weather === 'fog'
          ? 0xa9bdc8
          : 0x203541;
    const overlay = this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, color, alpha)
      .setOrigin(0)
      .setDepth(80)
      .setScrollFactor(0);
    const resize = ({ width, height }: Phaser.Structs.Size) => overlay.setSize(width, height);
    this.scale.on(Phaser.Scale.Events.RESIZE, resize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      this.scale.off(Phaser.Scale.Events.RESIZE, resize),
    );
  }

  private createBackground(locationId: string) {
    this.activeSceneArt = sceneArtByLocation.get(locationId) ?? sceneArt[2];
    if (!this.activeSceneArt) return;
    this.background = this.add.image(0, 0, `scene-${this.activeSceneArt.locationId}`).setDepth(0);
    this.layoutHabitat();
  }

  private layoutHabitat() {
    const { width, height } = this.scale;
    if (this.background)
      this.background
        .setPosition(width / 2, height / 2)
        .setScale(Math.max(width / 1280, height / 720));
    this.sceneMapSystem?.resize(width, height);
    this.scenePropSystem?.resize();
    this.spawnSystem?.resize();
    this.dogSystem?.resize();
  }

  private createReticle() {
    const graphics = this.add.graphics().lineStyle(3, 0xf4e8cf, 1);
    graphics
      .strokeCircle(0, 0, 18)
      .lineBetween(-30, 0, -10, 0)
      .lineBetween(10, 0, 30, 0)
      .lineBetween(0, -30, 0, -10)
      .lineBetween(0, 10, 0, 30);
    if (this.config.assists.trajectoryGuide)
      graphics.lineStyle(1, 0xf2a51f, 0.65).lineBetween(-72, 0, -38, 0).lineBetween(38, 0, 72, 0);
    this.reticle = this.add
      .container(this.scale.width / 2, this.scale.height / 2, [graphics])
      .setDepth(100);
  }

  fire(x: number, y: number) {
    if (this.paused || this.ended) return;
    if (this.ammo <= 0) {
      this.events.emit('weapon-empty');
      this.events.emit(
        'notice',
        this.config.ammunition.reloadAllowed && this.reloadsRemaining !== 0
          ? 'EMPTY — PRESS R'
          : 'AMMUNITION EXHAUSTED',
      );
      if (!this.config.ammunition.reloadAllowed || this.reloadsRemaining === 0)
        this.finishRound('ammunition');
      return;
    }
    this.ammo -= 1;
    this.shots += 1;
    this.events.emit('weapon-fired');
    this.cameras.main.shake(45, 0.002);
    const bird = this.spawnSystem?.hitAt(x, y, this.config.assists.aimAssist ? 30 : 0);
    const scoredState = bird?.state;
    if (!bird || !scoredState || !bird.strike()) {
      this.combo = 0;
      this.misses += 1;
      this.score = Math.max(0, this.score - this.config.scoring.missPenalty);
      this.events.emit('score-result', { result: 'miss', x, y, depth: 1, occlusion: 0 });
      this.events.emit('notice', `MISS −${this.config.scoring.missPenalty}`);
      this.emitHud();
      this.checkEndlessFailure();
      return;
    }
    const scoring = birdScoringBySpecies.get(bird.plan.speciesId);
    const result = scoreBird({
      speciesId: bird.plan.speciesId,
      state: scoredState,
      distance: Math.max(0, Math.min(1, 1 - bird.scale / 1.2)),
      speedRatio: bird.plan.speed / 220,
      combo: this.combo,
    });
    const role = this.config.spawnSpecies.find(
      ({ speciesId }) => speciesId === bird.plan.speciesId,
    )?.role;
    if (scoring?.role === 'protected' || role === 'protected') {
      this.combo = 0;
      this.protectedHits += 1;
      this.score = Math.max(0, this.score - this.config.scoring.protectedPenalty);
      this.events.emit('score-result', {
        result: 'protected',
        x: bird.x,
        y: bird.y,
        depth: bird.sceneDepth,
        occlusion: 0,
      });
      this.events.emit(
        'notice',
        `PROTECTED ${bird.plan.speciesId.toUpperCase()} — −${this.config.scoring.protectedPenalty}`,
      );
      this.feathers(bird.x, bird.y, 0xe86c5b);
    } else if (!this.config.targetSpeciesIds.includes(bird.plan.speciesId)) {
      this.combo = 0;
      this.nonTargetHits += 1;
      this.score = Math.max(0, this.score - this.config.scoring.nonTargetPenalty);
      this.events.emit('score-result', {
        result: 'protected',
        x: bird.x,
        y: bird.y,
        depth: bird.sceneDepth,
        occlusion: 0,
      });
      this.events.emit(
        'notice',
        `NON-TARGET ${bird.plan.speciesId.toUpperCase()} — −${this.config.scoring.nonTargetPenalty}`,
      );
      this.feathers(bird.x, bird.y, 0xd6b46a);
    } else {
      this.combo += 1;
      this.hits += 1;
      const points = Math.round(result.points * this.config.scoring.targetMultiplier);
      this.score += points;
      this.events.emit('score-result', {
        result: 'hit',
        x: bird.x,
        y: bird.y,
        depth: bird.sceneDepth,
        occlusion: 0,
      });
      this.events.emit('notice', `${result.label ?? 'CLEAN HIT'} +${points}`);
      this.feathers(bird.x, bird.y, 0xf3d49a);
    }
    this.events.emit('bird-scored', {
      speciesId: bird.plan.speciesId,
      state: scoredState,
      role,
      ...result,
    });
    this.emitHud();
    if (
      this.config.objective.kind === 'hits' &&
      this.config.mode === 'classic' &&
      this.hits >= this.config.objective.target
    )
      this.finishRound('objective');
    this.checkEndlessFailure();
  }

  fireAtAim() {
    this.fire(this.reticle.x, this.reticle.y);
  }
  aim(x: number, y: number) {
    this.reticle.setPosition(x, y);
    this.events.emit('aim', { x, y });
  }
  reloadHunt() {
    this.reload();
  }
  resumeHunt() {
    this.paused = false;
    if (this.physics?.world) this.physics.world.isPaused = false;
    this.events.emit('pause', false);
  }
  pauseHunt() {
    this.paused = true;
    if (this.physics?.world) this.physics.world.isPaused = true;
    this.events.emit('pause', true);
  }

  private feathers(x: number, y: number, color: number) {
    for (let index = 0; index < 9; index += 1) {
      const feather = this.featherPool.find((entry) => !entry.active);
      if (!feather) break;
      feather
        .setActive(true)
        .setVisible(true)
        .setPosition(x, y)
        .setFillStyle(color)
        .setAlpha(1)
        .setAngle(0);
      this.tweens.add({
        targets: feather,
        x: x + this.rng.int(-55, 55),
        y: y + this.rng.int(-20, 80),
        angle: this.rng.int(-120, 120),
        alpha: 0,
        duration: 650,
        onComplete: () => feather.setActive(false).setVisible(false),
      });
    }
  }

  private createFeatherPool() {
    this.featherPool = Array.from({ length: 24 }, () =>
      this.add.rectangle(0, 0, 4, 8, 0xf3d49a).setDepth(90).setActive(false).setVisible(false),
    );
  }

  private reload() {
    if (this.paused || this.ended) return;
    if (!this.config.ammunition.reloadAllowed || this.reloadsRemaining === 0) {
      this.events.emit('weapon-empty');
      this.events.emit('notice', 'NO RELOADS REMAINING');
      return;
    }
    if (this.reloadsRemaining !== 'unlimited') this.reloadsRemaining -= 1;
    this.ammo = this.config.ammunition.magazineSize;
    this.events.emit('weapon-reloaded');
    this.events.emit('notice', 'RELOADED');
    this.emitHud();
  }
  private emitHud() {
    this.events.emit('hud', {
      score: this.score,
      ammo: this.ammo,
      magazineSize: this.config.ammunition.magazineSize,
      reloads: this.reloadsRemaining,
      hits: this.hits,
      shots: this.shots,
      combo: this.combo,
      time: this.config.endless ? null : Math.ceil(this.timeLeft),
      elapsed: Math.floor(this.elapsedSeconds),
      mistakes: this.misses + this.nonTargetHits + this.protectedHits,
      location: this.locationName,
    });
  }

  private checkEndlessFailure() {
    if (
      this.config.endless &&
      this.config.passRequirements.maxMistakes !== undefined &&
      this.misses + this.nonTargetHits + this.protectedHits >=
        this.config.passRequirements.maxMistakes
    )
      this.finishRound('mistakes');
  }

  private finishRound(endReason: 'time' | 'objective' | 'mistakes' | 'ammunition') {
    if (this.ended) return;
    this.ended = true;
    const accuracy = this.shots ? Math.round((this.hits / this.shots) * 100) : 0;
    const identified = this.hits + this.nonTargetHits + this.protectedHits;
    const identificationAccuracy = identified ? Math.round((this.hits / identified) * 100) : 0;
    if (endReason === 'objective' && this.config.scoring.timeBonusPerSecond > 0)
      this.score += Math.round(Math.max(0, this.timeLeft) * this.config.scoring.timeBonusPerSecond);
    if (accuracy >= this.config.passRequirements.minAccuracy)
      this.score += this.config.scoring.accuracyBonus;
    const stats: RoundResultStats = {
      score: this.score,
      hits: this.hits,
      shots: this.shots,
      accuracy,
      identificationAccuracy,
      protectedHits: this.protectedHits,
      nonTargetHits: this.nonTargetHits,
      misses: this.misses,
      elapsedSeconds: Math.round(this.elapsedSeconds),
    };
    const evaluation = evaluateRound(this.config, stats);
    this.dogSystem?.celebrate();
    this.time.delayedCall(650, () =>
      this.events.emit('complete', {
        ...stats,
        passed: evaluation.passed,
        failures: evaluation.failures,
        endReason,
        config: this.config,
      }),
    );
  }

  update(time: number, delta: number) {
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
    this.scenePropSystem?.update(this.time.now);
    if (time >= this.nextEnvironmentSoundAt) {
      this.events.emit('environment-one-shot', {
        sound: this.environmentSound,
        worldX: this.audioRng.int(0, Math.max(1, Math.round(this.scale.width))),
        mapDepth: 0.25 + this.audioRng.next() * 0.7,
        occlusion: this.audioRng.next() * 0.24,
      });
      this.nextEnvironmentSoundAt = time + this.audioRng.int(9_000, 17_000);
    }
    this.elapsedSeconds += delta / 1_000;
    if (!this.config.endless) this.timeLeft -= delta / 1_000;
    if (!this.config.endless && !this.finalSecondsAnnounced && this.timeLeft <= 10) {
      this.finalSecondsAnnounced = true;
      this.events.emit('hunt-phase', { phase: 'final' });
    }
    if (!this.config.endless && this.timeLeft <= 0) this.finishRound('time');
    this.emitHud();
  }
}
