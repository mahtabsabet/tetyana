// level03-espace/LevelScene.js — L'Aventure dans l'Espace
//
// Collectibles : des étoiles ⭐
// Obstacles   : des comètes ☄️ qui patrouillent
// Boss final  : un monstre spatial 👾 qui fait des allers-retours — mort instantanée

import { Player }              from '../../core/player/Player.js';
import { InputManager }        from '../../core/input/InputManager.js';
import { initVirtualControls,
         hideVirtualControls } from '../../core/input/VirtualControls.js';
import { showQuiz }            from '../../core/scenes/QuizOverlay.js';

const QUIZ_QUESTIONS = [
  {
    imageEmoji: '🪐',
    question:  'Combien de planètes est dans le système solaire ?',
    correct:   '8',
    wrong:     ['7', '9', '10'],
  },
  {
    imageEmoji: '🌋',
    question:  'Quel planète a le plus grand volcan dans le système solaire ?',
    correct:   'Mars',
    wrong:     ['Jupiter', 'Vénus', 'Saturne'],
  },
];

const BG_COLOR         = 0x0d0d2a;
const PLATFORM_COLOR   = 0x3a3a6a;
const NUM_COLLECTIBLES = 10;
const POINTS_PER_COIN  = 5;
const TIME_LIMIT       = 90;

export class EspaceScene extends Phaser.Scene {
  static _context = null;

  constructor() {
    super({ key: 'level03-espace' });
  }

  init(data) {
    this._ctx            = EspaceScene._context || data?.context;
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

    // ── Arrière-plan spatial ───────────────────────────────────────────────────
    this.add.rectangle(W, H / 2, W * 2, H, BG_COLOR);

    // Étoiles décotratives en arrière-plan
    const starPositions = [
      [60,30],[200,80],[420,20],[600,55],[780,35],[1000,70],[1200,25],[1400,60],
      [1600,40],[1750,80],[1850,20],[150,120],[350,100],[550,140],[900,110],
      [1100,130],[1300,90],[1500,125],[1700,105],[1900,70],[80,160],[300,180],
      [500,155],[700,175],[850,160],[1050,185],[1250,165],[1450,175],[1650,158],
    ];
    starPositions.forEach(([sx, sy]) => {
      const size = Phaser.Math.Between(2, 5);
      const alpha = Phaser.Math.FloatBetween(0.4, 1.0);
      this.add.circle(sx, sy, size, 0xffffff).setAlpha(alpha);
    });

    // Planètes décoratives
    this.add.text(1700, H / 2 - 40, '🪐', { fontSize: '80px' }).setAlpha(0.25);
    this.add.text(300,  H / 2 - 60, '🌙', { fontSize: '60px' }).setAlpha(0.20);

    this.physics.world.setBounds(0, 0, W * 2, H);
    this.cameras.main.setBounds(0, 0, W * 2, H);

    // ── Sol ────────────────────────────────────────────────────────────────────
    const platforms = this.physics.add.staticGroup();
    const sol = this.add.rectangle(W, H - 20, W * 2, 40, 0x222244);
    this.physics.add.existing(sol, true);
    platforms.add(sol);

    // ── Plateformes (astéroïdes) ───────────────────────────────────────────────
    this._plateforme(platforms,  280, H - 120, 140);
    this._plateforme(platforms,  530, H - 200, 160);
    this._plateforme(platforms,  740, H - 140, 120);
    this._plateforme(platforms,  970, H - 230, 150);
    this._plateforme(platforms, 1180, H - 155, 140);
    this._plateforme(platforms, 1400, H - 250, 160);
    this._plateforme(platforms, 1620, H - 165, 130);

    // ── Collectibles : petites étoiles ─────────────────────────────────────────
    this._coins = this.physics.add.staticGroup();
    [
      [150,  H - 60],
      [280,  H - 155],
      [390,  H - 60],
      [530,  H - 235],
      [600,  H - 235],
      [740,  H - 175],
      [970,  H - 265],
      [1080, H - 60],
      [1400, H - 285],
      [1620, H - 200],
    ].forEach(([cx, cy]) => {
      const c = this.add.text(cx, cy, '⭐', { fontSize: '22px' }).setOrigin(0.5);
      this.physics.add.existing(c, true);
      this._coins.add(c);
    });

    // ── But : clé ──────────────────────────────────────────────────────────────
    this._goal = this.add.text(1830, H - 90, '🗝️', { fontSize: '56px' }).setOrigin(0.5);
    this.physics.add.existing(this._goal, true);
    this.tweens.add({ targets: this._goal, y: H - 110, duration: 900, yoyo: true, repeat: -1 });

    // ── Joueur ─────────────────────────────────────────────────────────────────
    this._input  = new InputManager(this);
    initVirtualControls(this._input);
    this._player = new Player(this, 80, H - 80, this._store, this._input);
    this.physics.add.collider(this._player.sprite, platforms);
    this.cameras.main.startFollow(this._player.sprite, true, 0.1, 0.1);

    // ── Obstacles : comètes qui patrouillent (réduisent les PV) ───────────────
    this._obstacles = this.physics.add.staticGroup();
    this._cometObstacle(this._obstacles,  450, H - 60,  55);
    this._cometObstacle(this._obstacles,  860, H - 60,  45);
    this._cometObstacle(this._obstacles, 1130, H - 195, 38);
    this._cometObstacle(this._obstacles, 1270, H - 60,  50);
    this._cometObstacle(this._obstacles, 1550, H - 60,  40);

    // ── Boss final : monstre spatial — mort instantanée ────────────────────────
    this._bossGroup = this.physics.add.staticGroup();
    this._bossObstacle(this._bossGroup, 1790, H - 60, 55);

    // ── Overlaps ───────────────────────────────────────────────────────────────
    this.physics.add.overlap(this._player.sprite, this._coins,
      (_, c) => this._ramasserCoin(c));

    this.physics.add.overlap(this._player.sprite, this._goal,
      () => { if (!this._done) this._gagner(); });

    this.physics.add.overlap(this._player.sprite, this._obstacles, () => {
      if (this._done || this._damageCooldown) return;
      this._damageCooldown = true;
      this.time.delayedCall(1000, () => { this._damageCooldown = false; });
      if (this._player.takeDamage()) {
        this._done = true;
        this.time.delayedCall(500, () => this._perdre());
      }
    });

    this.physics.add.overlap(this._player.sprite, this._bossGroup, () => {
      if (this._done) return;
      this._done = true;
      this.time.delayedCall(300, () => this._perdre());
    });

    // ── HUD ────────────────────────────────────────────────────────────────────
    this._scoreText = this.add.text(16, 16, '⭐ 0', {
      fontFamily: 'Arial', fontSize: '22px', fontStyle: 'bold',
      color: '#ffdd44', stroke: '#000', strokeThickness: 4,
    }).setScrollFactor(0);
    this._viesText = this.add.text(16, 50, '❤️❤️❤️', { fontSize: '20px' }).setScrollFactor(0);

    this._timerText = this.add.text(W / 2, 16, `⏱ ${TIME_LIMIT}`, {
      fontFamily: 'Arial', fontSize: '20px', fontStyle: 'bold',
      color: '#ffffff', stroke: '#000', strokeThickness: 4,
    }).setScrollFactor(0).setOrigin(0.5, 0);
    this.time.addEvent({ delay: 1000, repeat: TIME_LIMIT - 1, callback: this._tick, callbackScope: this });

    const titre = this.add.text(W / 2, H / 2 - 40, "L'Aventure dans l'Espace", {
      fontFamily: 'Arial', fontSize: '30px', fontStyle: 'bold',
      color: '#ffffff', stroke: '#000', strokeThickness: 6,
    }).setScrollFactor(0).setOrigin(0.5).setDepth(10);
    this.tweens.add({ targets: titre, alpha: 0, delay: 2000, duration: 600, onComplete: () => titre.destroy() });

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

    if (this._player.hasMagnet) {
      this._coins.getChildren().forEach(c => {
        if (Phaser.Math.Distance.Between(this._player.x, this._player.y, c.x, c.y) < this._player.MAGNET_RADIUS)
          this._ramasserCoin(c);
      });
    }

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
    this._viesText.setText('❤️'.repeat(this._player.lives) + '🖤'.repeat(Math.max(0, 3 - this._player.lives)));
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  _plateforme(group, x, y, width) {
    const rect = this.add.rectangle(x, y, width, 24, PLATFORM_COLOR);
    this.physics.add.existing(rect, true);
    group.add(rect);
    // Petits cratères décoratifs
    for (let i = 0; i < Math.floor(width / 35); i++) {
      this.add.circle(x - width / 2 + 18 + i * 35, y, 4, 0x222244).setAlpha(0.6);
    }
    return rect;
  }

  // Comète qui patrouille de ±range pixels horizontalement
  _cometObstacle(group, x, y, range) {
    const rect  = this.add.rectangle(x, y, 38, 28, 0xff4400).setAlpha(0.01);
    this.physics.add.existing(rect, true);
    group.add(rect);
    const emoji = this.add.text(x, y, '☄️', { fontSize: '28px' }).setOrigin(0.5);
    this.tweens.add({
      targets: [rect, emoji],
      x: { from: x - range, to: x + range },
      duration: 1600 + Math.floor(range * 18),
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      onUpdate: () => rect.body.reset(rect.x, rect.y),
    });
  }

  // Monstre spatial — mort instantanée, se déplace de ±range pixels
  _bossObstacle(group, x, y, range) {
    const rect  = this.add.rectangle(x, y, 80, 72, 0x880000).setAlpha(0.01);
    this.physics.add.existing(rect, true);
    group.add(rect);
    const emoji = this.add.text(x, y, '👾', { fontSize: '72px' }).setOrigin(0.5);
    // Pulsation pour signaler le danger
    this.tweens.add({
      targets: emoji,
      scaleX: 1.15, scaleY: 1.15,
      duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    // Déplacement aller-retour
    this.tweens.add({
      targets: [rect, emoji],
      x: { from: x - range, to: x + range },
      duration: 2200,
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

  _tick() {
    this._timeLeft--;
    this._timerText.setText(`⏱ ${this._timeLeft}`);
    if (this._timeLeft <= 10) this._timerText.setColor('#ff4444');
    if (this._timeLeft <= 0 && !this._done) { this._done = true; this._perdre(); }
  }

  _calcEtoiles() {
    const restants = this._coins.getChildren().filter(c => c.active).length;
    const ratio = (NUM_COLLECTIBLES - restants) / NUM_COLLECTIBLES;
    if (ratio >= 1 && this._timeLeft > 30) return 3;
    if (ratio >= 0.5 || this._timeLeft > 15) return 2;
    return 1;
  }

  _gagner() {
    this._done = true; hideVirtualControls();
    const e = this._calcEtoiles();
    const W = this.scale.width; const H = this.scale.height;
    this.add.text(W/2, H/2-60, '🎉 Bravo !', {
      fontFamily:'Arial', fontSize:'48px', fontStyle:'bold',
      color:'#ffdd44', stroke:'#000', strokeThickness:6,
    }).setScrollFactor(0).setOrigin(0.5).setDepth(20);
    this.add.text(W/2, H/2, '⭐'.repeat(e) + '☆'.repeat(3 - e), {
      fontSize:'40px',
    }).setScrollFactor(0).setOrigin(0.5).setDepth(20);
    this.time.delayedCall(1500, () => {
      showQuiz(this, QUIZ_QUESTIONS, (bonus) => {
        this._score += bonus;
        this._ctx?.onComplete({
          levelId: 'level03-espace',
          completed: true,
          pointsEarned: this._score,
          starsEarned: e,
          durationSeconds: TIME_LIMIT - this._timeLeft,
        });
        this._terminer();
      });
    });
  }

  _perdre() {
    hideVirtualControls();
    const W = this.scale.width; const H = this.scale.height;
    this.add.text(W/2, H/2-40, '💔 Essaie encore !', {
      fontFamily:'Arial', fontSize:'36px', fontStyle:'bold',
      color:'#ff6666', stroke:'#000', strokeThickness:6,
    }).setScrollFactor(0).setOrigin(0.5).setDepth(20);
    this.time.delayedCall(2000, () => {
      this._ctx?.onComplete({
        levelId: 'level03-espace',
        completed: false,
        pointsEarned: this._score,
        starsEarned: 0,
        durationSeconds: TIME_LIMIT - this._timeLeft,
      });
      this._terminer();
    });
  }

  _quitter() {
    hideVirtualControls();
    this._ctx?.onComplete({ levelId:'level03-espace', completed:false, pointsEarned:this._score, starsEarned:0, durationSeconds:0 });
    this._terminer();
  }

  _terminer() {
    this.cameras.main.fadeOut(400, 0, 0, 0, (_cam, p) => { if (p === 1) this.scene.stop(); });
  }
}
