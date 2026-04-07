// level05-volcan/LevelScene.js — Le Volcan du Dragon
//
// GROUPE 5 — votre niveau commence ici !
// Lisez GUIDE_NIVEAU.md pour les instructions.
// Copiez le code de level01-foret/LevelScene.js et adaptez-le !
//
// Thème : Le Volcan du Dragon
// Collectibles : 🌋

import { Player }              from '../../core/player/Player.js';
import { InputManager }        from '../../core/input/InputManager.js';
import { initVirtualControls,
         hideVirtualControls } from '../../core/input/VirtualControls.js';

const BG_COLOR         = 0x2a0a00;
const GROUND_COLOR     = 0x555555;
const NUM_COLLECTIBLES = 10;
const POINTS_PER_COIN  = 5;
const TIME_LIMIT       = 90;

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

  preload() {
    // TODO: Chargez vos images ici.
    // this.load.image('volcan_bg',   new URL('./assets/backgrounds/bg.png',   import.meta.url).href);
    // this.load.image('volcan_coin', new URL('./assets/sprites/collectible.png', import.meta.url).href);
    // this.load.image('volcan_goal', new URL('./assets/sprites/goal.png',     import.meta.url).href);
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // TODO: Remplacez par votre arrière-plan
    this.add.rectangle(W, H / 2, W * 2, H, BG_COLOR);
    this.add.text(W / 2, H / 2, '🌋', { fontSize: '200px' }).setOrigin(0.5).setAlpha(0.15);
    this.add.text(W / 2, H / 2 + 100, 'À construire par le groupe 5 !', {
      fontFamily: 'Arial', fontSize: '28px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);

    this.physics.world.setBounds(0, 0, W * 2, H);
    this.cameras.main.setBounds(0, 0, W * 2, H);

    const platforms = this.physics.add.staticGroup();
    const sol = this.add.rectangle(W, H - 20, W * 2, 40, GROUND_COLOR);
    this.physics.add.existing(sol, true);
    platforms.add(sol);

    // TODO: Ajoutez vos plateformes ici !

    this._coins = this.physics.add.staticGroup();
    // TODO: Ajoutez vos collectibles ici !

    this._goal = this.add.text(1820, H - 90, '🏆', { fontSize: '56px' }).setOrigin(0.5);
    this.physics.add.existing(this._goal, true);
    this.tweens.add({ targets: this._goal, y: H - 110, duration: 900, yoyo: true, repeat: -1 });

    this._input  = new InputManager(this);
    initVirtualControls(this._input);
    this._player = new Player(this, 80, H - 80, this._store, this._input);
    this.physics.add.collider(this._player.sprite, platforms);
    this.cameras.main.startFollow(this._player.sprite, true, 0.1, 0.1);

    // ── Obstacles (lave — réduit les points de vie au contact) ────────────────
    // TODO: Remplacez les emplacements et l'emoji par ceux de votre niveau
    this._obstacles = this.physics.add.staticGroup();
    this._obstacle(this._obstacles, 400,  H - 60, '🔥');
    this._obstacle(this._obstacles, 900,  H - 60, '🔥');
    this._obstacle(this._obstacles, 1400, H - 60, '🔥');

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
    this._scoreText.setText();
    this._viesText.setText('❤️'.repeat(this._player.lives) + '🖤'.repeat(Math.max(0, 3 - this._player.lives)));
  }

  _obstacle(group, x, y, emoji) {
    const rect = this.add.rectangle(x, y, 32, 36, 0xff2200);
    this.physics.add.existing(rect, true);
    group.add(rect);
    this.add.text(x, y + 2, emoji, { fontSize: '26px' }).setOrigin(0.5);
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
    this.time.delayedCall(2500, () => {
      this._ctx?.onComplete({ levelId:'level05-volcan', completed:true, pointsEarned:this._score, starsEarned:3, durationSeconds:0 });
      this._terminer();
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
