// level05-volcan/LevelScene.js — La Montagne avec le Volcan du Dragon

import { Player }              from '../../core/player/Player.js';
import { InputManager }        from '../../core/input/InputManager.js';
import { initVirtualControls,
         hideVirtualControls } from '../../core/input/VirtualControls.js';
import { showQuiz }            from '../../core/scenes/QuizOverlay.js';

// ── Questions vocabulaire ────────────────────────────────────────────────────
const QUIZ_QUESTIONS = [
  {
    imageEmoji: '🌋',
    correct: 'Le volcan',
    wrong:   ['La montagne', 'Le feu', 'La fumée'],
  },
  {
    imageEmoji: '🔥',
    correct: 'Le feu',
    wrong:   ["L'eau", 'La glace', 'La fumée'],
  },
];

const BG_COLOR           = 0x1a0500;
const GROUND_COLOR       = 0x4a2800;
const POINTS_PER_COIN    = 5;
const POINTS_PER_DIAMOND = 15;
const TIME_LIMIT         = 90;

export class VolcanScene extends Phaser.Scene {
  static _context = null;

  constructor() {
    super({ key: 'level05-volcan' });
  }

  init(data) {
    this._ctx            = VolcanScene._context || data?.context;
    this._store          = this._ctx?.store;
    this._score          = 0;
    this._timeLeft       = TIME_LIMIT;
    this._done           = false;
    this._damageCooldown = false;
  }

  preload() {}

  create() {
    const W = this.scale.width;   // 960
    const H = this.scale.height;  // 540

    // ── Background ─────────────────────────────────────────────────────────
    this.add.rectangle(W, H / 2, W * 2, H, BG_COLOR);

    // Volcano silhouette (decorative, in the distance)
    const gfx = this.add.graphics();
    gfx.fillStyle(0x3a1200, 0.85);
    gfx.fillTriangle(W - 240, H - 40, W + 240, H - 40, W, H - 380);
    // Lava glow at crater
    gfx.fillStyle(0xff6600, 0.5);
    gfx.fillTriangle(W - 36, H - 370, W + 36, H - 370, W, H - 410);
    // Lava glow along ground
    this.add.rectangle(W, H - 10, W * 2, 70, 0xff4400).setAlpha(0.18);

    this.physics.world.setBounds(0, 0, W * 2, H);
    this.cameras.main.setBounds(0, 0, W * 2, H);

    // ── Ground ─────────────────────────────────────────────────────────────
    const platforms = this.physics.add.staticGroup();
    const sol = this.add.rectangle(W, H - 20, W * 2, 40, GROUND_COLOR);
    this.physics.add.existing(sol, true);
    platforms.add(sol);

    // ── Platforms — volcanic mountain terrain ───────────────────────────────
    this._plateforme(platforms,  300, H - 130, 180);
    this._plateforme(platforms,  560, H - 200, 160);
    this._plateforme(platforms,  820, H - 300, 140);
    this._plateforme(platforms, 1070, H - 200, 160);
    this._plateforme(platforms, 1310, H - 140, 180);
    this._plateforme(platforms, 1560, H - 190, 200);

    // ── Collectibles — gold coins (🪙) and diamonds (💎) ───────────────────
    this._coins = this.physics.add.staticGroup();
    [
      [130,  H - 80,  '🪙', POINTS_PER_COIN],
      [300,  H - 175, '🪙', POINTS_PER_COIN],
      [420,  H - 80,  '💎', POINTS_PER_DIAMOND],
      [560,  H - 248, '🪙', POINTS_PER_COIN],
      [700,  H - 80,  '🪙', POINTS_PER_COIN],
      [820,  H - 348, '💎', POINTS_PER_DIAMOND],
      [900,  H - 80,  '🪙', POINTS_PER_COIN],
      [1070, H - 248, '💎', POINTS_PER_DIAMOND],
      [1200, H - 80,  '🪙', POINTS_PER_COIN],
      [1310, H - 188, '🪙', POINTS_PER_COIN],
    ].forEach(([cx, cy, emoji, pts]) => this._collectible(cx, cy, emoji, pts));

    // ── Goal key — placed just past the dragon ──────────────────────────────
    this._goal = this.add.text(1880, H - 90, '🗝️', { fontSize: '56px' }).setOrigin(0.5);
    this.physics.add.existing(this._goal, true);
    this.tweens.add({ targets: this._goal, y: H - 110, duration: 900, yoyo: true, repeat: -1 });

    // ── Player ─────────────────────────────────────────────────────────────
    this._input  = new InputManager(this);
    initVirtualControls(this._input);
    this._player = new Player(this, 80, H - 80, this._store, this._input);
    this.physics.add.collider(this._player.sprite, platforms);
    this.cameras.main.startFollow(this._player.sprite, true, 0.1, 0.1);

    // ── Fire obstacles ──────────────────────────────────────────────────────
    this._obstacles = this.physics.add.staticGroup();
    this._fireObstacle(450,  H - 60);
    this._fireObstacle(660,  H - 60);
    this._fireObstacle(760,  H - 338);  // fire on high platform
    this._fireObstacle(940,  H - 60);
    this._fireObstacle(1155, H - 60);
    this._fireObstacle(1430, H - 60);

    // ── Dragon boss — big dragon that walks back and forth at the end ───────
    this._dragonBoss(1700, H - 80, 110);

    // ── Overlaps ────────────────────────────────────────────────────────────
    this.physics.add.overlap(this._player.sprite, this._coins, (_, c) => this._ramasserCoin(c));
    this.physics.add.overlap(this._player.sprite, this._goal,  () => { if (!this._done) this._gagner(); });
    this.physics.add.overlap(this._player.sprite, this._obstacles, () => {
      if (this._done || this._damageCooldown) return;
      this._damageCooldown = true;
      this.time.delayedCall(1000, () => { this._damageCooldown = false; });
      if (this._player.takeDamage()) { this._done = true; this.time.delayedCall(500, () => this._perdre()); }
    });

    // ── HUD ────────────────────────────────────────────────────────────────
    this._scoreText = this.add.text(16, 16, '⭐ 0', {
      fontFamily: 'Arial', fontSize: '22px', fontStyle: 'bold',
      color: '#ffdd44', stroke: '#000', strokeThickness: 4,
    }).setScrollFactor(0);
    this._viesText = this.add.text(16, 50, '❤️ ❤️ ❤️', { fontSize: '20px' }).setScrollFactor(0);

    this.add.text(W - 16, 16, '↩ Carte', {
      fontFamily: 'Arial', fontSize: '15px', color: '#cccccc', stroke: '#000', strokeThickness: 3,
    }).setScrollFactor(0).setOrigin(1, 0).setDepth(10).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._quitter());

    this.cameras.main.fadeIn(400);
  }

  update() {
    if (this._done) return;
    this._input.update();
    const mort = !this._player.update();
    if (mort) { this._done = true; this.time.delayedCall(800, () => this._perdre()); return; }
    if (this._player.y > this.physics.world.bounds.height + 100) {
      if (this._player.takeDamage()) { this._done = true; this.time.delayedCall(500, () => this._perdre()); }
      else { this._player.sprite.setPosition(80, this.scale.height - 80); this._player.sprite.setVelocity(0, 0); }
    }
    this._scoreText.setText(`⭐ ${this._score}`);
    this._viesText.setText('❤️'.repeat(this._player.lives) + '🖤'.repeat(Math.max(0, 3 - this._player.lives)));
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  _plateforme(group, x, y, width) {
    const rect = this.add.rectangle(x, y, width, 24, GROUND_COLOR);
    this.physics.add.existing(rect, true);
    group.add(rect);
    return rect;
  }

  _collectible(x, y, emoji, points) {
    const rect = this.add.rectangle(x, y, 28, 28, 0xffee00).setAlpha(0.01);
    this.physics.add.existing(rect, true);
    rect.setData('points', points);
    this._coins.add(rect);
    const label = this.add.text(x, y, emoji, { fontSize: '26px' }).setOrigin(0.5);
    rect.setData('label', label);
    this.tweens.add({
      targets: label,
      y: y - 8,
      duration: 700 + Math.random() * 400,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    return rect;
  }

  _fireObstacle(x, y) {
    const rect = this.add.rectangle(x, y, 36, 42, 0xff2200).setAlpha(0.01);
    this.physics.add.existing(rect, true);
    this._obstacles.add(rect);
    const label = this.add.text(x, y + 4, '🔥', { fontSize: '32px' }).setOrigin(0.5);
    this.tweens.add({
      targets: label,
      scaleX: 1.15, scaleY: 0.88,
      duration: 280 + Math.random() * 180,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    return rect;
  }

  // Big dragon that paces back and forth — guards the goal
  _dragonBoss(x, y, range) {
    const rect = this.add.rectangle(x, y, 90, 80, 0xff0000).setAlpha(0.01);
    this.physics.add.existing(rect, true);
    this._obstacles.add(rect);
    const label = this.add.text(x, y + 8, '🐉', { fontSize: '80px' }).setOrigin(0.5);
    this.tweens.add({
      targets: [rect, label],
      x: { from: x - range, to: x + range },
      duration: 2800,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      onUpdate: () => rect.body.reset(rect.x, rect.y),
    });
  }

  _ramasserCoin(c) {
    if (!c.active) return;
    c.setActive(false).setVisible(false);
    if (c.body) c.body.enable = false;
    const label = c.getData('label');
    if (label) label.setVisible(false);
    this._score += c.getData('points') ?? POINTS_PER_COIN;
  }

  _gagner() {
    this._done = true; hideVirtualControls();
    const W = this.scale.width; const H = this.scale.height;
    this.add.text(W/2, H/2-60, '🎉 Bravo !', { fontFamily:'Arial', fontSize:'48px', fontStyle:'bold', color:'#ffdd44', stroke:'#000', strokeThickness:6 }).setScrollFactor(0).setOrigin(0.5).setDepth(20);
    this.add.text(W/2, H/2, '⭐⭐⭐', { fontSize:'40px' }).setScrollFactor(0).setOrigin(0.5).setDepth(20);
    this.time.delayedCall(1500, () => {
      showQuiz(this, QUIZ_QUESTIONS, (bonus) => {
        this._score += bonus;
        this._ctx?.onComplete({ levelId:'level05-volcan', completed:true, pointsEarned:this._score, starsEarned:3, durationSeconds:0 });
        this._terminer();
      });
    });
  }

  _perdre() {
    hideVirtualControls();
    const W = this.scale.width; const H = this.scale.height;
    this.add.text(W/2, H/2-40, '💔 Essaie encore !', { fontFamily:'Arial', fontSize:'36px', fontStyle:'bold', color:'#ff6666', stroke:'#000', strokeThickness:6 }).setScrollFactor(0).setOrigin(0.5).setDepth(20);
    this.time.delayedCall(2000, () => {
      this._ctx?.onComplete({ levelId:'level05-volcan', completed:false, pointsEarned:this._score, starsEarned:0, durationSeconds:0 });
      this._terminer();
    });
  }

  _quitter() {
    hideVirtualControls();
    this._ctx?.onComplete({ levelId:'level05-volcan', completed:false, pointsEarned:this._score, starsEarned:0, durationSeconds:0 });
    this._terminer();
  }

  _terminer() {
    this.cameras.main.fadeOut(400, 0, 0, 0, (_cam, p) => { if (p === 1) this.scene.stop(); });
  }
}
