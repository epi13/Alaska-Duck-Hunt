import Phaser from 'phaser';
import { locations, species } from '../data/content';
import { SeededRandom } from '../core/rng';

interface Bird extends Phaser.GameObjects.Container {
  vx: number;
  vy: number;
  birdId: string;
  valid: boolean;
  born: number;
}
export class HuntScene extends Phaser.Scene {
  private reticle!: Phaser.GameObjects.Container;
  private birds: Bird[] = [];
  private score = 0;
  private ammo = 5;
  private hits = 0;
  private shots = 0;
  private combo = 0;
  private timeLeft = 60;
  private lastSpawn = 0;
  private ended = false;
  private paused = false;
  private rng = new SeededRandom('default');
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private moveKeys?: Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key>;
  constructor() {
    super('hunt');
  }
  create(data: { seed?: string; location?: number } = {}) {
    this.rng = new SeededRandom(
      data.seed ??
        new URLSearchParams(location.search).get('seed') ??
        new Date().toISOString().slice(0, 10),
    );
    const loc = locations[data.location ?? 2] ?? locations[2]!;
    this.cameras.main.setBackgroundColor(loc.palette[3]);
    this.drawHabitat(loc.palette);
    this.createReticle();
    this.input.setDefaultCursor('none');
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.reticle.setPosition(p.x, p.y));
    this.input.keyboard?.on('keydown-SPACE', () => this.fire(this.reticle.x, this.reticle.y));
    this.input.keyboard?.on('keydown-R', () => this.reload());
    this.input.keyboard?.on('keydown-F', () => void this.scale.toggleFullscreen());
    this.cursors = this.input.keyboard?.createCursorKeys();
    if (this.input.keyboard)
      this.moveKeys = {
        up: this.input.keyboard.addKey('W'),
        down: this.input.keyboard.addKey('S'),
        left: this.input.keyboard.addKey('A'),
        right: this.input.keyboard.addKey('D'),
      };
    this.events.emit('hud', {
      score: 0,
      ammo: this.ammo,
      hits: 0,
      shots: 0,
      combo: 0,
      time: this.timeLeft,
      location: loc.name,
    });
  }
  private drawHabitat(p: [string, string, string, string]) {
    const g = this.add.graphics();
    const w = this.scale.width,
      h = this.scale.height;
    g.fillGradientStyle(
      Phaser.Display.Color.HexStringToColor(p[0]).color,
      Phaser.Display.Color.HexStringToColor(p[0]).color,
      Phaser.Display.Color.HexStringToColor(p[1]).color,
      Phaser.Display.Color.HexStringToColor(p[1]).color,
    ).fillRect(0, 0, w, h);
    g.fillStyle(0xdde8ec, 0.8);
    for (let x = -80; x < w + 160; x += 160) {
      const peak = h * 0.47 + Math.sin(x) * 20;
      g.fillTriangle(x, peak + 160, x + 100, peak, x + 220, peak + 160);
    }
    g.fillStyle(Phaser.Display.Color.HexStringToColor(p[2]).color).fillRect(
      0,
      h * 0.66,
      w,
      h * 0.34,
    );
    g.fillStyle(0x416b78, 0.8).fillRect(0, h * 0.7, w, h * 0.16);
    for (let i = 0; i < 90; i++) {
      const x = (i * 83) % w,
        y = h - ((i * 47) % Math.floor(h * 0.26));
      g.lineStyle(2, i % 3 ? 0x9a793f : 0x41583b, 0.9).lineBetween(x, h, x + Math.sin(i) * 20, y);
    }
  }
  private createReticle() {
    const g = this.add.graphics().lineStyle(3, 0xf4e8cf, 1);
    g.strokeCircle(0, 0, 18)
      .lineBetween(-30, 0, -10, 0)
      .lineBetween(10, 0, 30, 0)
      .lineBetween(0, -30, 0, -10)
      .lineBetween(0, 10, 0, 30);
    this.reticle = this.add
      .container(this.scale.width / 2, this.scale.height / 2, [g])
      .setDepth(100);
  }
  private spawnBird() {
    const valid = this.rng.next() > 0.18;
    const targets = species.filter((s) => s.target);
    const entry = valid
      ? targets[this.rng.int(0, targets.length - 1)]
      : species.find((s) => !s.target);
    if (!entry) return;
    const fromLeft = this.rng.next() > 0.5;
    const body = this.add
      .ellipse(0, 0, 45, 22, valid ? 0xc9b17a : 0x6fa4a5)
      .setStrokeStyle(3, 0x0c1d25);
    const wing = this.add
      .triangle(-2, -2, -18, 0, 0, -30, 15, 0, valid ? 0x665c49 : 0xe8e2d3)
      .setStrokeStyle(2, 0x0c1d25);
    const head = this.add
      .circle(22, -3, 8, entry.id === 'spectacled' ? 0xe8e2d3 : 0x293b35)
      .setStrokeStyle(2, 0x0c1d25);
    const bird = this.add.container(
      fromLeft ? -50 : this.scale.width + 50,
      110 + this.rng.next() * this.scale.height * 0.45,
      [wing, body, head],
    ) as Bird;
    bird.setSize(60, 48);
    bird.vx = (fromLeft ? 1 : -1) * (120 + this.rng.next() * 150);
    bird.vy = -25 + this.rng.next() * 50;
    bird.birdId = entry.id;
    bird.valid = valid;
    bird.born = this.time.now;
    this.tweens.add({
      targets: wing,
      scaleY: 0.35,
      yoyo: true,
      repeat: -1,
      duration: 120 + this.rng.next() * 90,
    });
    this.birds.push(bird);
  }
  fire(x: number, y: number) {
    if (this.paused || this.ended) return;
    if (this.ammo <= 0) {
      this.events.emit('notice', 'EMPTY — PRESS R');
      return;
    }
    this.ammo--;
    this.shots++;
    this.cameras.main.shake(45, 0.002);
    let hit: Bird | undefined;
    for (let i = this.birds.length - 1; i >= 0; i--) {
      const b = this.birds[i]!;
      if (Phaser.Math.Distance.Between(x, y, b.x, b.y) < 35) {
        hit = b;
        break;
      }
    }
    if (hit) {
      if (hit.valid) {
        this.combo++;
        this.hits++;
        const gain = Math.round(
          100 * (1 + this.combo * 0.2) * (1 + Math.max(0, hit.y) / this.scale.height),
        );
        this.score += gain;
        this.events.emit('notice', `CLEAN HIT +${gain}`);
        this.feathers(hit.x, hit.y, 0xf3d49a);
      } else {
        this.combo = 0;
        this.score = Math.max(0, this.score - 750);
        this.events.emit('notice', 'PROTECTED BIRD — PENALTY');
        this.feathers(hit.x, hit.y, 0xe86c5b);
      }
      hit.destroy();
      this.birds = this.birds.filter((b) => b !== hit);
    } else {
      this.combo = 0;
      this.events.emit('notice', 'MISS');
    }
    this.emitHud();
  }
  aim(x: number, y: number) {
    this.reticle.setPosition(x, y);
  }
  resumeHunt() {
    this.paused = false;
    this.physics.world.isPaused = false;
    this.events.emit('pause', false);
  }
  pauseHunt() {
    this.paused = true;
    this.physics.world.isPaused = true;
    this.events.emit('pause', true);
  }
  private feathers(x: number, y: number, color: number) {
    for (let i = 0; i < 9; i++) {
      const f = this.add.rectangle(x, y, 4, 8, color).setDepth(90);
      this.tweens.add({
        targets: f,
        x: x + Phaser.Math.Between(-55, 55),
        y: y + Phaser.Math.Between(-20, 80),
        angle: Phaser.Math.Between(-120, 120),
        alpha: 0,
        duration: 650,
        onComplete: () => f.destroy(),
      });
    }
  }
  private reload() {
    if (this.paused || this.ended) return;
    this.ammo = 5;
    this.events.emit('notice', 'RELOADED');
    this.emitHud();
  }
  private emitHud() {
    this.events.emit('hud', {
      score: this.score,
      ammo: this.ammo,
      hits: this.hits,
      shots: this.shots,
      combo: this.combo,
      time: Math.ceil(this.timeLeft),
      location: '',
    });
  }
  update(_t: number, delta: number) {
    if (this.paused || this.ended) return;
    const dt = delta / 1000;
    const speed = 360 * dt;
    if (this.cursors?.left.isDown || this.moveKeys?.left.isDown) this.reticle.x -= speed;
    if (this.cursors?.right.isDown || this.moveKeys?.right.isDown) this.reticle.x += speed;
    if (this.cursors?.up.isDown || this.moveKeys?.up.isDown) this.reticle.y -= speed;
    if (this.cursors?.down.isDown || this.moveKeys?.down.isDown) this.reticle.y += speed;
    this.reticle.x = Phaser.Math.Clamp(this.reticle.x, 30, this.scale.width - 30);
    this.reticle.y = Phaser.Math.Clamp(this.reticle.y, 30, this.scale.height - 30);
    this.timeLeft -= dt;
    if (this.time.now - this.lastSpawn > 620) {
      this.spawnBird();
      this.lastSpawn = this.time.now;
    }
    for (const b of this.birds) {
      b.x += b.vx * dt;
      b.y += b.vy * dt + Math.sin((this.time.now - b.born) / 250) * 0.8;
      b.rotation = Math.sin((this.time.now - b.born) / 400) * 0.08;
    }
    this.birds
      .filter((b) => b.x < -100 || b.x > this.scale.width + 100)
      .forEach((b) => b.destroy());
    this.birds = this.birds.filter((b) => b.active);
    if (this.timeLeft <= 0) {
      this.ended = true;
      this.events.emit('complete', {
        score: this.score,
        hits: this.hits,
        shots: this.shots,
        accuracy: this.shots ? Math.round((this.hits / this.shots) * 100) : 0,
      });
    }
    this.emitHud();
  }
}
