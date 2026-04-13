// level06-arctique/LevelScene.js — La Toundra Arctique

import { Player }              from '../../core/player/Player.js';
import { InputManager }        from '../../core/input/InputManager.js';
import { initVirtualControls,
         hideVirtualControls } from '../../core/input/VirtualControls.js';
import { showQuiz }            from '../../core/scenes/QuizOverlay.js';

// ── Questions vocabulaire ────────────────────────────────────────────────────
const QUIZ_QUESTIONS = [
  {
    imageEmoji: '🐾',
    question:   'Quel animal vit dans la toundra arctique ?',
    correct:    "L'ours polaire",
    wrong:      ['Le requin', 'Le lion', 'Le perroquet'],
  },
  {
    imageEmoji: '🦌',
    question:   'Quel animal vit dans la toundra arctique ?',
    correct:    'Le caribou',
    wrong:      ['Le requin', 'Le dauphin', 'Le singe'],
  },
];

const BG_COLOR         = 0x071525;   // deep arctic night sky
const GROUND_COLOR     = 0x5a8eaa;   // icy blue ground
const PLATFORM_COLOR   = 0x4a7a94;   // slightly darker ice platform
const SNOW_COLOR       = 0xddeeff;   // snow cap
const NUM_COLLECTIBLES = 10;
const POINTS_PER_COIN  = 5;
const TIME_LIMIT       = 90;

export class ArctiqueScene extends Phaser.Scene {
  static _context = null;

  constructor() {
    super({ key: 'level06-arctique' });
  }

  init(data) {
    this._ctx            = ArctiqueScene._context || data?.context;
    this._store          = this._ctx?.store;
    this._score          = 0;
    this._timeLeft       = TIME_LIMIT;
    this._done           = false;
    this._damageCooldown = false;
  }

  preload() {}

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // ── Sky ───────────────────────────────────────────────────────────────
    this.add.rectangle(W, H / 2, W * 2, H, BG_COLOR).setDepth(-10);

    // ── Stars ─────────────────────────────────────────────────────────────
    const starGfx = this.add.graphics().setDepth(-9);
    for (let i = 0; i < 90; i++) {
      const sx    = Phaser.Math.Between(0, W * 2);
      const sy    = Phaser.Math.Between(0, H * 0.72);
      const sr    = Phaser.Math.FloatBetween(0.6, 2.2);
      const alpha = Phaser.Math.FloatBetween(0.35, 1.0);
      starGfx.fillStyle(0xffffff, alpha);
      starGfx.fillCircle(sx, sy, sr);
    }

    // ── Crescent moon ─────────────────────────────────────────────────────
    const moonX = W * 0.6;
    const moonY = 58;
    this.add.circle(moonX, moonY, 36, 0xe8f4ff).setDepth(-8);
    // Offset circle in BG colour to carve out the crescent
    this.add.circle(moonX + 16, moonY - 8, 30, BG_COLOR).setDepth(-7);

    // ── Aurora borealis ───────────────────────────────────────────────────
    // Layered semi-transparent bands across the upper sky
    [
      { y: 38,  h: 65, color: 0x22dd88, alpha: 0.10 },
      { y: 88,  h: 45, color: 0x44aaff, alpha: 0.08 },
      { y: 122, h: 30, color: 0xaa44ee, alpha: 0.07 },
      { y: 58,  h: 25, color: 0x22dd88, alpha: 0.05 },
    ].forEach(({ y, h, color, alpha }) => {
      this.add.rectangle(W, y + h / 2, W * 2, h, color)
        .setAlpha(alpha)
        .setDepth(-8);
    });

    // ── Background mountains ───────────────────────────────────────────────
    const mtGfx = this.add.graphics().setDepth(-6);
    [
      { x: 160,  w: 230, mh: 175 },
      { x: 430,  w: 190, mh: 140 },
      { x: 680,  w: 260, mh: 205 },
      { x: 940,  w: 210, mh: 162 },
      { x: 1190, w: 250, mh: 188 },
      { x: 1440, w: 195, mh: 148 },
      { x: 1680, w: 230, mh: 172 },
      { x: 1910, w: 175, mh: 128 },
    ].forEach(({ x, w, mh }) => {
      // Mountain body — deep blue-grey
      mtGfx.fillStyle(0x1a3a55, 1);
      mtGfx.fillTriangle(x - w / 2, H - 40, x + w / 2, H - 40, x, H - 40 - mh);
      // Snow cap — pale blue-white
      const capW = w * 0.36;
      const capH = mh * 0.32;
      mtGfx.fillStyle(0xcce8ff, 1);
      mtGfx.fillTriangle(
        x - capW / 2, H - 40 - mh + capH,
        x + capW / 2, H - 40 - mh + capH,
        x, H - 40 - mh,
      );
    });

    // ── Foreground snow drifts along the ground ───────────────────────────
    const driftGfx = this.add.graphics().setDepth(-5);
    driftGfx.fillStyle(0xc8e2f5, 1);
    [
      [110,  H - 42, 130, 24],
      [470,  H - 42, 105, 20],
      [810,  H - 42, 140, 22],
      [1140, H - 42, 115, 18],
      [1490, H - 42, 145, 26],
      [1790, H - 42,  95, 18],
    ].forEach(([dx, dy, dw, dh]) => driftGfx.fillEllipse(dx, dy, dw, dh));

    // ── Physics world ─────────────────────────────────────────────────────
    this.physics.world.setBounds(0, 0, W * 2, H);
    this.cameras.main.setBounds(0, 0, W * 2, H);

    // Ground
    const platforms = this.physics.add.staticGroup();
    const sol = this.add.rectangle(W, H - 20, W * 2, 40, GROUND_COLOR);
    this.physics.add.existing(sol, true);
    platforms.add(sol);
    // Snow cap on ground
    this.add.rectangle(W, H - 38, W * 2, 8, SNOW_COLOR).setDepth(1);

    // Platforms
    this._plateforme(platforms, 280,  H - 130, 160);
    this._plateforme(platforms, 540,  H - 210, 140);
    this._plateforme(platforms, 800,  H - 150, 180);
    this._plateforme(platforms, 1060, H - 240, 140);
    this._plateforme(platforms, 1320, H - 160, 180);
    this._plateforme(platforms, 1580, H - 130, 200);

    // ── Collectibles — ❄️ snowflakes ──────────────────────────────────────
    this._coins = this.physics.add.staticGroup();
    [
      [150, H - 80],   [290, H - 170], [550, H - 250], [650, H - 250],
      [810, H - 190],  [870, H - 190], [1070, H - 280], [1150, H - 110],
      [1340, H - 200], [1590, H - 170],
    ].slice(0, NUM_COLLECTIBLES).forEach(([cx, cy]) => {
      const flake = this.add.text(cx, cy, '❄️', { fontSize: '22px' }).setOrigin(0.5);
      this.physics.add.existing(flake, true);
      this._coins.add(flake);
    });

    // ── Goal ──────────────────────────────────────────────────────────────
    this._goal = this.add.text(1820, H - 90, '🗝️', { fontSize: '56px' }).setOrigin(0.5);
    this.physics.add.existing(this._goal, true);
    this.tweens.add({ targets: this._goal, y: H - 110, duration: 900, yoyo: true, repeat: -1 });

    // ── Player ────────────────────────────────────────────────────────────
    this._input  = new InputManager(this);
    initVirtualControls(this._input);
    this._player = new Player(this, 80, H - 80, this._store, this._input);
    this.physics.add.collider(this._player.sprite, platforms);
    this.cameras.main.startFollow(this._player.sprite, true, 0.1, 0.1);

    // ── Obstacles: polar bears & arctic foxes ─────────────────────────────
    this._obstacles = this.physics.add.staticGroup();
    this._animalObstacle(this._obstacles, 420,  H - 60, '🐻‍❄️', 50);
    this._animalObstacle(this._obstacles, 950,  H - 60, '🦊',   40);
    this._animalObstacle(this._obstacles, 1250, H - 60, '🐻‍❄️', 55);
    this._animalObstacle(this._obstacles, 1600, H - 60, '🦊',   45);

    // ── Boss: troll hidden behind ice boulders ────────────────────────────
    const trollX = 1730;
    const trollY = H - 68;
    this.add.text(trollX - 52, H - 76, '🪨', { fontSize: '72px' }).setOrigin(0.5).setDepth(6);
    this.add.text(trollX + 52, H - 76, '🪨', { fontSize: '72px' }).setOrigin(0.5).setDepth(6);
    this._trollObstacle(this._obstacles, trollX, trollY, 48);

    // ── Falling snow ──────────────────────────────────────────────────────
    this._addFallingSnow(W, H);

    // ── Overlaps ──────────────────────────────────────────────────────────
    this.physics.add.overlap(this._player.sprite, this._coins, (_, c) => this._ramasserCoin(c));
    this.physics.add.overlap(this._player.sprite, this._goal,  () => { if (!this._done) this._gagner(); });
    this.physics.add.overlap(this._player.sprite, this._obstacles, () => {
      if (this._done || this._damageCooldown) return;
      this._damageCooldown = true;
      this.time.delayedCall(1000, () => { this._damageCooldown = false; });
      if (this._player.takeDamage()) { this._done = true; this.time.delayedCall(500, () => this._perdre()); }
    });

    // ── HUD ───────────────────────────────────────────────────────────────
    this._scoreText = this.add.text(16, 16, '⭐ 0', {
      fontFamily: 'Arial', fontSize: '22px', fontStyle: 'bold',
      color: '#ffdd44', stroke: '#000', strokeThickness: 4,
    }).setScrollFactor(0).setDepth(20);
    this._viesText = this.add.text(16, 50, '❤️ ❤️ ❤️', { fontSize: '20px' })
      .setScrollFactor(0).setDepth(20);

    this.add.text(W - 16, 16, '↩ Carte', {
      fontFamily: 'Arial', fontSize: '15px', color: '#cccccc', stroke: '#000', strokeThickness: 3,
    }).setScrollFactor(0).setOrigin(1, 0).setDepth(20)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._quitter());

    this.cameras.main.fadeIn(400);
  }

  update() {
    if (this._done) return;
    this._input.update();
    const mort = !this._player.update();
    if (mort) { this._done = true; this.time.delayedCall(800, () => this._perdre()); return; }
    if (this._player.y > this.physics.world.bounds.height + 100) {
      if (this._player.takeDamage()) {
        this._done = true;
        this.time.delayedCall(500, () => this._perdre());
      } else {
        this._player.sprite.setPosition(80, this.scale.height - 80);
        this._player.sprite.setVelocity(0, 0);
      }
    }
    this._scoreText.setText(`⭐ ${this._score}`);
    this._viesText.setText(
      '❤️'.repeat(this._player.lives) + '🖤'.repeat(Math.max(0, 3 - this._player.lives))
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  _addFallingSnow(W, H) {
    for (let i = 0; i < 65; i++) {
      const x     = Phaser.Math.Between(0, W * 2);
      const y     = Phaser.Math.Between(-H, H);
      const r     = Phaser.Math.FloatBetween(1.5, 4.0);
      const alpha = Phaser.Math.FloatBetween(0.45, 0.90);
      const dot   = this.add.circle(x, y, r, 0xffffff, alpha).setDepth(8);
      const dur   = Phaser.Math.Between(4500, 10000);
      this.tweens.add({
        targets:  dot,
        y:        H + 20,
        duration: dur,
        delay:    Phaser.Math.Between(0, 7000),
        repeat:   -1,
        onRepeat: () => dot.setPosition(Phaser.Math.Between(0, W * 2), -10),
      });
    }
  }

  _plateforme(group, x, y, width) {
    // Icy platform body
    const rect = this.add.rectangle(x, y, width, 24, PLATFORM_COLOR);
    this.physics.add.existing(rect, true);
    group.add(rect);
    // Snow cap on top of platform
    this.add.rectangle(x, y - 10, width, 6, SNOW_COLOR).setDepth(1);
    return rect;
  }

  _trollObstacle(group, x, y, range) {
    const rect  = this.add.rectangle(x, y, 48, 52, 0xff2200).setAlpha(0.01).setDepth(2);
    this.physics.add.existing(rect, true);
    group.add(rect);
    const label = this.add.text(x, y, '🧌', { fontSize: '48px' }).setOrigin(0.5).setDepth(2);
    this.tweens.add({
      targets:  [rect, label],
      x:        { from: x - range, to: x + range },
      duration: 2200,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      onUpdate: () => rect.body.reset(rect.x, rect.y),
    });
  }

  _animalObstacle(group, x, y, emoji, range) {
    const rect  = this.add.rectangle(x, y, 40, 40, 0xff2200).setAlpha(0.01);
    this.physics.add.existing(rect, true);
    group.add(rect);
    const label = this.add.text(x, y, emoji, { fontSize: '32px' }).setOrigin(0.5);
    this.tweens.add({
      targets:  [rect, label],
      x:        { from: x - range, to: x + range },
      duration: 1600 + Math.floor(range * 18),
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      onUpdate: () => rect.body.reset(rect.x, rect.y),
    });
  }

  _ramasserCoin(c) {
    if (!c.active) return;
    c.setActive(false).setVisible(false);
    if (c.body) c.body.enable = false;
    this._score += POINTS_PER_COIN;
  }

  _gagner() {
    this._done = true; hideVirtualControls();
    const W = this.scale.width; const H = this.scale.height;
    this.add.text(W / 2, H / 2 - 60, '🎉 Bravo !', {
      fontFamily: 'Arial', fontSize: '48px', fontStyle: 'bold',
      color: '#ffdd44', stroke: '#000', strokeThickness: 6,
    }).setScrollFactor(0).setOrigin(0.5).setDepth(20);
    this.add.text(W / 2, H / 2, '⭐⭐⭐', { fontSize: '40px' })
      .setScrollFactor(0).setOrigin(0.5).setDepth(20);
    this.time.delayedCall(1500, () => {
      showQuiz(this, QUIZ_QUESTIONS, (bonus) => {
        this._score += bonus;
        this._ctx?.onComplete({
          levelId: 'level06-arctique', completed: true,
          pointsEarned: this._score, starsEarned: 3, durationSeconds: 0,
        });
        this._terminer();
      });
    });
  }

  _perdre() {
    hideVirtualControls();
    const W = this.scale.width; const H = this.scale.height;
    this.add.text(W / 2, H / 2 - 40, '💔 Essaie encore !', {
      fontFamily: 'Arial', fontSize: '36px', fontStyle: 'bold',
      color: '#ff6666', stroke: '#000', strokeThickness: 6,
    }).setScrollFactor(0).setOrigin(0.5).setDepth(20);
    this.time.delayedCall(2000, () => {
      this._ctx?.onComplete({
        levelId: 'level06-arctique', completed: false,
        pointsEarned: this._score, starsEarned: 0, durationSeconds: 0,
      });
      this._terminer();
    });
  }

  _quitter() {
    hideVirtualControls();
    this._ctx?.onComplete({
      levelId: 'level06-arctique', completed: false,
      pointsEarned: this._score, starsEarned: 0, durationSeconds: 0,
    });
    this._terminer();
  }

  _terminer() {
    this.cameras.main.fadeOut(400, 0, 0, 0, (_cam, p) => { if (p === 1) this.scene.stop(); });
  }
}
