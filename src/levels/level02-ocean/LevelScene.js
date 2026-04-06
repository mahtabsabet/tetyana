// level02-ocean/LevelScene.js — L'Océan Mystérieux
//
// GROUPE 2 — votre niveau commence ici !
// Lisez GUIDE_NIVEAU.md pour les instructions.
//
// Thème : Le fond de l'océan
// Vocabulaire : le requin, la pieuvre, le dauphin, le corail, la perle
// Collectibles : des perles 🫧
// Ennemis : des méduses électriques 🪼
// But : ouvrir le coffre au trésor au fond de l'eau 🪙

import { Player }              from '../../core/player/Player.js';
import { InputManager }        from '../../core/input/InputManager.js';
import { initVirtualControls,
         hideVirtualControls } from '../../core/input/VirtualControls.js';

const BG_COLOR         = 0x0a2a4a;
const GROUND_COLOR     = 0x1a5c3a;
const NUM_COLLECTIBLES = 10;
const POINTS_PER_COIN  = 5;
const TIME_LIMIT       = 90;

export class OceanScene extends Phaser.Scene {
  static _context = null;

  constructor() {
    super({ key: 'level02-ocean' });
  }

  init(data) {
    this._ctx      = OceanScene._context || data?.context;
    this._store    = this._ctx?.store;
    this._score    = 0;
    this._timeLeft = TIME_LIMIT;
    this._done     = false;
  }

  preload() {
    // TODO: Chargez vos images ici.
    // this.load.image('ocean_bg',    new URL('./assets/backgrounds/ocean_bg.png', import.meta.url).href);
    // this.load.image('ocean_coin',  new URL('./assets/sprites/perle.png',        import.meta.url).href);
    // this.load.image('ocean_goal',  new URL('./assets/sprites/coffre.png',       import.meta.url).href);
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // Arrière-plan
    this.add.rectangle(W, H / 2, W * 2, H, BG_COLOR);
    ['🐠', '🐡', '🦈', '🐙', '🐬', '🦑', '🐟'].forEach((f, i) => {
      this.add.text(80 + i * 280, 60 + Math.sin(i) * 40, f, { fontSize: '50px' }).setOrigin(0.5);
    });

    this.physics.world.setBounds(0, 0, W * 2, H);
    this.cameras.main.setBounds(0, 0, W * 2, H);

    const platforms = this.physics.add.staticGroup();
    const sol = this.add.rectangle(W, H - 20, W * 2, 40, GROUND_COLOR);
    this.physics.add.existing(sol, true);
    platforms.add(sol);

    // TODO: Ajoutez vos plateformes (coraux, rochers, épaves)
    this._plateforme(platforms, 300,  H - 130, 160);
    this._plateforme(platforms, 560,  H - 220, 140);
    this._plateforme(platforms, 820,  H - 150, 180);
    this._plateforme(platforms, 1070, H - 250, 140);
    this._plateforme(platforms, 1320, H - 160, 180);
    this._plateforme(platforms, 1560, H - 130, 200);

    // Collectibles
    this._coins = this.physics.add.staticGroup();
    [[180,H-80],[310,H-170],[570,H-260],[670,H-260],[830,H-190],[890,H-190],
     [1080,H-290],[1160,H-120],[1330,H-200],[1580,H-170]]
      .slice(0, NUM_COLLECTIBLES).forEach(([cx, cy]) => {
        const c = this.add.text(cx, cy, '🫧', { fontSize: '26px' }).setOrigin(0.5);
        this.physics.add.existing(c, true);
        this._coins.add(c);
      });

    // But
    this._goal = this.add.text(1820, H - 90, '🪙', { fontSize: '56px' }).setOrigin(0.5);
    this.physics.add.existing(this._goal, true);
    this.tweens.add({ targets: this._goal, y: H - 110, duration: 900, yoyo: true, repeat: -1 });

    // Joueur
    this._input  = new InputManager(this);
    initVirtualControls(this._input);
    this._player = new Player(this, 80, H - 80, this._store, this._input);
    this.physics.add.collider(this._player.sprite, platforms);
    this.cameras.main.startFollow(this._player.sprite, true, 0.1, 0.1);

    this.physics.add.overlap(this._player.sprite, this._coins, (_, c) => this._ramasserCoin(c));
    this.physics.add.overlap(this._player.sprite, this._goal,  () => { if (!this._done) this._gagner(); });

    // HUD
    this._scoreText = this.add.text(16, 16, '⭐ 0', {
      fontFamily: 'Arial', fontSize: '22px', fontStyle: 'bold',
      color: '#ffdd44', stroke: '#000', strokeThickness: 4,
    }).setScrollFactor(0);
    this._viesText = this.add.text(16, 50, '❤️ ❤️ ❤️', { fontSize: '20px' }).setScrollFactor(0);

    if (TIME_LIMIT > 0) {
      this._timerText = this.add.text(W / 2, 16, `⏱ ${TIME_LIMIT}`, {
        fontFamily: 'Arial', fontSize: '20px', fontStyle: 'bold',
        color: '#ffffff', stroke: '#000', strokeThickness: 4,
      }).setScrollFactor(0).setOrigin(0.5, 0);
      this.time.addEvent({ delay: 1000, repeat: TIME_LIMIT - 1, callback: this._tick, callbackScope: this });
    }

    const titre = this.add.text(W / 2, H / 2 - 40, "L'Océan Mystérieux", {
      fontFamily: 'Arial', fontSize: '32px', fontStyle: 'bold',
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
      if (this._player.takeDamage()) { this._done = true; this.time.delayedCall(500, () => this._perdre()); }
      else { this._player.sprite.setPosition(80, this.scale.height - 80); this._player.sprite.setVelocity(0, 0); }
    }
    this._scoreText.setText(`⭐ ${this._score}`);
    const v = '❤️'.repeat(this._player.lives) + '🖤'.repeat(Math.max(0, 3 - this._player.lives));
    this._viesText.setText(v);
  }

  _plateforme(group, x, y, width) {
    const rect = this.add.rectangle(x, y, width, 24, 0x1a6e4a);
    this.physics.add.existing(rect, true);
    group.add(rect);
    return rect;
  }

  _ramasserCoin(c) {
    if (!c.active) return;
    c.setActive(false).setVisible(false);
    if (c.body) c.body.enable = false;
    this._score += POINTS_PER_COIN;
    if (this.cache.audio.exists('snd_coin')) this.sound.play('snd_coin', { volume: 0.7 });
  }

  _tick() {
    this._timeLeft--;
    if (this._timerText) { this._timerText.setText(`⏱ ${this._timeLeft}`); if (this._timeLeft <= 10) this._timerText.setColor('#ff4444'); }
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
    this.add.text(W/2, H/2-60, '🎉 Bravo !', { fontFamily:'Arial', fontSize:'48px', fontStyle:'bold', color:'#ffdd44', stroke:'#000', strokeThickness:6 }).setScrollFactor(0).setOrigin(0.5).setDepth(20);
    this.add.text(W/2, H/2, '⭐'.repeat(e)+'☆'.repeat(3-e), { fontSize:'40px' }).setScrollFactor(0).setOrigin(0.5).setDepth(20);
    if (this.cache.audio.exists('snd_success')) this.sound.play('snd_success');
    this.time.delayedCall(2500, () => {
      this._ctx?.onComplete({ levelId:'level02-ocean', completed:true, pointsEarned:this._score, starsEarned:e, durationSeconds:TIME_LIMIT-this._timeLeft });
      this._terminer();
    });
  }

  _perdre() {
    hideVirtualControls();
    const W = this.scale.width; const H = this.scale.height;
    this.add.text(W/2, H/2-40, '💔 Essaie encore !', { fontFamily:'Arial', fontSize:'36px', fontStyle:'bold', color:'#ff6666', stroke:'#000', strokeThickness:6 }).setScrollFactor(0).setOrigin(0.5).setDepth(20);
    if (this.cache.audio.exists('snd_fail')) this.sound.play('snd_fail');
    this.time.delayedCall(2000, () => {
      this._ctx?.onComplete({ levelId:'level02-ocean', completed:false, pointsEarned:this._score, starsEarned:0, durationSeconds:TIME_LIMIT-this._timeLeft });
      this._terminer();
    });
  }

  _quitter() {
    hideVirtualControls();
    this._ctx?.onComplete({ levelId:'level02-ocean', completed:false, pointsEarned:this._score, starsEarned:0, durationSeconds:0 });
    this._terminer();
  }

  _terminer() {
    this.cameras.main.fadeOut(400, 0, 0, 0, (_cam, p) => { if (p === 1) this.scene.stop(); });
  }
}
