// level06-arctique/LevelScene.js — La Toundra Arctique
//
// GROUPE 6 — votre niveau commence ici !
// Lisez GUIDE_NIVEAU.md pour les instructions.
// Copiez le code de level01-foret/LevelScene.js et adaptez-le !
//
// Thème : La Toundra Arctique
// Collectibles : ❄️

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

const BG_COLOR         = 0x0a1a2a;
const GROUND_COLOR     = 0x555555;
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

  preload() {
    // TODO: Chargez vos images ici.
    // this.load.image('arctique_bg',   new URL('./assets/backgrounds/bg.png',   import.meta.url).href);
    // this.load.image('arctique_coin', new URL('./assets/sprites/collectible.png', import.meta.url).href);
    // this.load.image('arctique_goal', new URL('./assets/sprites/goal.png',     import.meta.url).href);
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.add.rectangle(W, H / 2, W * 2, H, BG_COLOR);

    this.physics.world.setBounds(0, 0, W * 2, H);
    this.cameras.main.setBounds(0, 0, W * 2, H);

    const platforms = this.physics.add.staticGroup();
    const sol = this.add.rectangle(W, H - 20, W * 2, 40, GROUND_COLOR);
    this.physics.add.existing(sol, true);
    platforms.add(sol);

    this._plateforme(platforms, 280,  H - 130, 160);
    this._plateforme(platforms, 540,  H - 210, 140);
    this._plateforme(platforms, 800,  H - 150, 180);
    this._plateforme(platforms, 1060, H - 240, 140);
    this._plateforme(platforms, 1320, H - 160, 180);
    this._plateforme(platforms, 1580, H - 130, 200);

    // Collectibles — placeholder squares
    this._coins = this.physics.add.staticGroup();
    [
      [150, H - 80],  [290, H - 170], [550, H - 250], [650, H - 250],
      [810, H - 190], [870, H - 190], [1070, H - 280], [1150, H - 110],
      [1340, H - 200],[1590, H - 170],
    ].slice(0, NUM_COLLECTIBLES).forEach(([cx, cy]) => {
      const sq = this.add.rectangle(cx, cy, 18, 18, 0xaaddff).setStrokeStyle(2, 0xffffff);
      this.physics.add.existing(sq, true);
      this._coins.add(sq);
    });

    this._goal = this.add.text(1820, H - 90, '🗝️', { fontSize: '56px' }).setOrigin(0.5);
    this.physics.add.existing(this._goal, true);
    this.tweens.add({ targets: this._goal, y: H - 110, duration: 900, yoyo: true, repeat: -1 });

    this._input  = new InputManager(this);
    initVirtualControls(this._input);
    this._player = new Player(this, 80, H - 80, this._store, this._input);
    this.physics.add.collider(this._player.sprite, platforms);
    this.cameras.main.startFollow(this._player.sprite, true, 0.1, 0.1);

    // ── Obstacles : ours polaires et renards arctiques qui patrouillent ──────
    this._obstacles = this.physics.add.staticGroup();
    this._animalObstacle(this._obstacles, 420,  H - 60, '🐻‍❄️', 50);
    this._animalObstacle(this._obstacles, 950,  H - 60, '🦊',   40);
    this._animalObstacle(this._obstacles, 1250, H - 60, '🐻‍❄️', 55);
    this._animalObstacle(this._obstacles, 1600, H - 60, '🦊',   45);

    // ── Boss de fin : troll caché derrière des arbres ────────────────────────
    // Trees in foreground (depth 6) — troll lurks behind them (depth 2)
    const trollX = 1730;
    const trollY = H - 68;
    this.add.text(trollX - 52, H - 72, '🌲', { fontSize: '72px' }).setOrigin(0.5).setDepth(6);
    this.add.text(trollX + 52, H - 72, '🌲', { fontSize: '72px' }).setOrigin(0.5).setDepth(6);
    this._trollObstacle(this._obstacles, trollX, trollY, 48);

    this.physics.add.overlap(this._player.sprite, this._coins, (_, c) => this._ramasserCoin(c));
    this.physics.add.overlap(this._player.sprite, this._goal,  () => { if (!this._done) this._gagner(); });
    this.physics.add.overlap(this._player.sprite, this._obstacles, () => {
      if (this._done || this._damageCooldown) return;
      this._damageCooldown = true;
      this.time.delayedCall(1000, () => { this._damageCooldown = false; });
      if (this._player.takeDamage()) { this._done = true; this.time.delayedCall(500, () => this._perdre()); }
    });

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

  // Boss troll — paces behind the trees at depth 2
  _trollObstacle(group, x, y, range) {
    const rect = this.add.rectangle(x, y, 48, 52, 0xff2200).setAlpha(0.01).setDepth(2);
    this.physics.add.existing(rect, true);
    group.add(rect);
    const label = this.add.text(x, y, '🧌', { fontSize: '48px' }).setOrigin(0.5).setDepth(2);
    this.tweens.add({
      targets: [rect, label],
      x: { from: x - range, to: x + range },
      duration: 2200,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      onUpdate: () => rect.body.reset(rect.x, rect.y),
    });
  }

  // Animal obstacle that paces back and forth
  _animalObstacle(group, x, y, emoji, range) {
    const rect = this.add.rectangle(x, y, 40, 40, 0xff2200).setAlpha(0.01);
    this.physics.add.existing(rect, true);
    group.add(rect);
    const label = this.add.text(x, y, emoji, { fontSize: '32px' }).setOrigin(0.5);
    this.tweens.add({
      targets: [rect, label],
      x: { from: x - range, to: x + range },
      duration: 1600 + Math.floor(range * 18),
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      onUpdate: () => rect.body.reset(rect.x, rect.y),
    });
  }

  _plateforme(group, x, y, width) {
    const rect = this.add.rectangle(x, y, width, 24, GROUND_COLOR);
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
    this.add.text(W/2, H/2-60, '🎉 Bravo !', { fontFamily:'Arial', fontSize:'48px', fontStyle:'bold', color:'#ffdd44', stroke:'#000', strokeThickness:6 }).setScrollFactor(0).setOrigin(0.5).setDepth(20);
    this.add.text(W/2, H/2, '⭐⭐⭐', { fontSize:'40px' }).setScrollFactor(0).setOrigin(0.5).setDepth(20);
    // Show vocabulary quiz before completing the level
    this.time.delayedCall(1500, () => {
      showQuiz(this, QUIZ_QUESTIONS, (bonus) => {
        this._score += bonus;
        this._ctx?.onComplete({ levelId:'level06-arctique', completed:true, pointsEarned:this._score, starsEarned:3, durationSeconds:0 });
        this._terminer();
      });
    });
  }

  _perdre() {
    hideVirtualControls();
    const W = this.scale.width; const H = this.scale.height;
    this.add.text(W/2, H/2-40, '💔 Essaie encore !', { fontFamily:'Arial', fontSize:'36px', fontStyle:'bold', color:'#ff6666', stroke:'#000', strokeThickness:6 }).setScrollFactor(0).setOrigin(0.5).setDepth(20);
    this.time.delayedCall(2000, () => {
      this._ctx?.onComplete({ levelId:'level06-arctique', completed:false, pointsEarned:this._score, starsEarned:0, durationSeconds:0 });
      this._terminer();
    });
  }

  _quitter() {
    hideVirtualControls();
    this._ctx?.onComplete({ levelId:'level06-arctique', completed:false, pointsEarned:this._score, starsEarned:0, durationSeconds:0 });
    this._terminer();
  }

  _terminer() {
    this.cameras.main.fadeOut(400, 0, 0, 0, (_cam, p) => { if (p === 1) this.scene.stop(); });
  }
}
