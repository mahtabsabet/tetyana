// level04-chateau/LevelScene.js — La Maison Hantée

import { Player }              from '../../core/player/Player.js';
import { InputManager }        from '../../core/input/InputManager.js';
import { initVirtualControls,
         hideVirtualControls } from '../../core/input/VirtualControls.js';
import { showQuiz }            from '../../core/scenes/QuizOverlay.js';

// ── Questions vocabulaire ────────────────────────────────────────────────────
const QUIZ_QUESTIONS = [
  {
    imageEmoji: '👻',
    question:   "Qu'est-ce que c'est ?",
    correct:    'Un fantôme',
    wrong:      ['Un squelette', 'Une araignée', 'Un vampire'],
  },
  {
    imageEmoji: '🕷️',
    question:   'Les araignées, est-ce que ça existe vraiment ?',
    correct:    'Oui !',
    wrong:      ['Non', 'Peut-être', 'Seulement dans les films'],
  },
];

const BG_COLOR       = 0x0d0a1a;
const GROUND_COLOR   = 0x2a1a3a;
const PLATFORM_COLOR = 0x3a2050;
const NUM_COLLECTIBLES = 10;
const POINTS_PER_COIN  = 5;
const TIME_LIMIT       = 90;

export class ChateauScene extends Phaser.Scene {
  static _context = null;

  constructor() {
    super({ key: 'level04-chateau' });
  }

  init(data) {
    this._ctx            = ChateauScene._context || data?.context;
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

    // Spooky dark-purple night sky
    this.add.rectangle(W, H / 2, W * 2, H, BG_COLOR);

    // Moon
    this.add.circle(1750, 80, 45, 0xfff8d0).setAlpha(0.9);
    this.add.circle(1750, 80, 42, 0xfffbe8);

    // Stars
    [
      [80,40],[200,70],[350,30],[500,60],[650,25],[820,50],[1000,35],
      [1150,65],[1300,40],[1450,55],[1600,30],[1800,70],[1900,45],
      [120,100],[440,90],[760,80],[1080,95],[1400,85],[1720,100],
    ].forEach(([sx, sy]) => {
      this.add.circle(sx, sy, 2, 0xffffff).setAlpha(0.5 + Math.random() * 0.5);
    });

    this.physics.world.setBounds(0, 0, W * 2, H);
    this.cameras.main.setBounds(0, 0, W * 2, H);

    // Ground
    const platforms = this.physics.add.staticGroup();
    const sol = this.add.rectangle(W, H - 20, W * 2, 40, GROUND_COLOR);
    this.physics.add.existing(sol, true);
    platforms.add(sol);

    // Platforms
    this._plateforme(platforms, 250,  H - 140, 160);
    this._plateforme(platforms, 520,  H - 220, 140);
    this._plateforme(platforms, 780,  H - 160, 160);
    this._plateforme(platforms, 1040, H - 250, 140);
    this._plateforme(platforms, 1300, H - 170, 180);
    this._plateforme(platforms, 1570, H - 140, 200);

    // Collectibles — crowns 👑
    this._coins = this.physics.add.staticGroup();
    [
      [130, H - 80],  [260, H - 180], [530, H - 260], [620, H - 260],
      [790, H - 200], [860, H - 200], [1050, H - 290], [1130, H - 110],
      [1320, H - 210],[1580, H - 180],
    ].slice(0, NUM_COLLECTIBLES).forEach(([cx, cy]) => {
      const crown = this.add.text(cx, cy, '👑', { fontSize: '22px' }).setOrigin(0.5);
      this.physics.add.existing(crown, true);
      crown.body.setSize(28, 24);
      this._coins.add(crown);
    });

    // Goal key
    this._goal = this.add.text(1860, H - 90, '🗝️', { fontSize: '56px' }).setOrigin(0.5);
    this.physics.add.existing(this._goal, true);
    this.tweens.add({ targets: this._goal, y: H - 110, duration: 900, yoyo: true, repeat: -1 });

    // Input + player
    this._input  = new InputManager(this);
    initVirtualControls(this._input);
    this._player = new Player(this, 80, H - 80, this._store, this._input);
    this.physics.add.collider(this._player.sprite, platforms);
    this.cameras.main.startFollow(this._player.sprite, true, 0.1, 0.1);

    // ── Obstacles ────────────────────────────────────────────────────────────
    this._obstacles = this.physics.add.staticGroup();

    // Skeletons — walk back and forth on the ground
    this._walkingObstacle(this._obstacles, 350,  H - 60, '💀', 60);
    this._walkingObstacle(this._obstacles, 900,  H - 60, '💀', 55);
    this._walkingObstacle(this._obstacles, 1450, H - 60, '💀', 65);

    // Spiders — walk back and forth
    this._walkingObstacle(this._obstacles, 620,  H - 55, '🕷️', 40);
    this._walkingObstacle(this._obstacles, 1150, H - 55, '🕷️', 35);
    this._walkingObstacle(this._obstacles, 1700, H - 55, '🕷️', 45);

    // Ghosts — float up and down in the air
    this._floatingObstacle(this._obstacles, 470,  H - 200, '👻', 45);
    this._floatingObstacle(this._obstacles, 1000, H - 180, '👻', 50);
    this._floatingObstacle(this._obstacles, 1350, H - 220, '👻', 40);

    this.physics.add.overlap(this._player.sprite, this._coins, (_, c) => this._ramasserCoin(c));
    this.physics.add.overlap(this._player.sprite, this._goal,  () => { if (!this._done) this._gagner(); });
    this.physics.add.overlap(this._player.sprite, this._obstacles, () => {
      if (this._done || this._damageCooldown) return;
      this._damageCooldown = true;
      this.time.delayedCall(1000, () => { this._damageCooldown = false; });
      if (this._player.takeDamage()) { this._done = true; this.time.delayedCall(500, () => this._perdre()); }
    });

    this._scoreText = this.add.text(16, 16, '👑 0', {
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
    this._scoreText.setText(`👑 ${this._score}`);
    this._viesText.setText('❤️'.repeat(this._player.lives) + '🖤'.repeat(Math.max(0, 3 - this._player.lives)));
  }

  // Skeleton / spider: walks back and forth horizontally
  _walkingObstacle(group, x, y, emoji, range) {
    const rect = this.add.rectangle(x, y, 38, 44, 0xff2200).setAlpha(0.01);
    this.physics.add.existing(rect, true);
    group.add(rect);
    const label = this.add.text(x, y, emoji, { fontSize: '32px' }).setOrigin(0.5);
    this.tweens.add({
      targets: [rect, label],
      x: { from: x - range, to: x + range },
      duration: 1500 + Math.floor(range * 20),
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      onUpdate: () => rect.body.reset(rect.x, rect.y),
    });
  }

  // Ghost: floats up and down
  _floatingObstacle(group, x, y, emoji, range) {
    const rect = this.add.rectangle(x, y, 38, 44, 0xff2200).setAlpha(0.01);
    this.physics.add.existing(rect, true);
    group.add(rect);
    const label = this.add.text(x, y, emoji, { fontSize: '36px' }).setOrigin(0.5).setAlpha(0.85);
    this.tweens.add({
      targets: [rect, label],
      y: { from: y - range, to: y + range },
      duration: 2000 + Math.floor(range * 15),
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      onUpdate: () => rect.body.reset(rect.x, rect.y),
    });
  }

  _plateforme(group, x, y, width) {
    const rect = this.add.rectangle(x, y, width, 24, PLATFORM_COLOR)
      .setStrokeStyle(1, 0x6633aa);
    this.physics.add.existing(rect, true);
    group.add(rect);
    return rect;
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
    this.add.text(W/2, H/2-60, '🎉 Bravo !', {
      fontFamily: 'Arial', fontSize: '48px', fontStyle: 'bold',
      color: '#ffdd44', stroke: '#000', strokeThickness: 6,
    }).setScrollFactor(0).setOrigin(0.5).setDepth(20);
    this.add.text(W/2, H/2, '⭐⭐⭐', { fontSize: '40px' }).setScrollFactor(0).setOrigin(0.5).setDepth(20);
    this.time.delayedCall(1500, () => {
      showQuiz(this, QUIZ_QUESTIONS, (bonus) => {
        this._score += bonus;
        this._ctx?.onComplete({ levelId: 'level04-chateau', completed: true, pointsEarned: this._score, starsEarned: 3, durationSeconds: 0 });
        this._terminer();
      });
    });
  }

  _perdre() {
    hideVirtualControls();
    const W = this.scale.width; const H = this.scale.height;
    this.add.text(W/2, H/2-40, '💔 Essaie encore !', {
      fontFamily: 'Arial', fontSize: '36px', fontStyle: 'bold',
      color: '#ff6666', stroke: '#000', strokeThickness: 6,
    }).setScrollFactor(0).setOrigin(0.5).setDepth(20);
    this.time.delayedCall(2000, () => {
      this._ctx?.onComplete({ levelId: 'level04-chateau', completed: false, pointsEarned: this._score, starsEarned: 0, durationSeconds: 0 });
      this._terminer();
    });
  }

  _quitter() {
    hideVirtualControls();
    this._ctx?.onComplete({ levelId: 'level04-chateau', completed: false, pointsEarned: this._score, starsEarned: 0, durationSeconds: 0 });
    this._terminer();
  }

  _terminer() {
    this.cameras.main.fadeOut(400, 0, 0, 0, (_cam, p) => { if (p === 1) this.scene.stop(); });
  }
}
