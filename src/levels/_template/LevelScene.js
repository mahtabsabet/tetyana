// _template/LevelScene.js — Proof-of-concept level scene
// Copy this file and customise the TODO sections for your level.
// The core platform/collect/complete loop is already wired up.

import { Player } from '../../core/player/Player.js';
import { InputManager } from '../../core/input/InputManager.js';
import { initVirtualControls, hideVirtualControls } from '../../core/input/VirtualControls.js';

// ── Constants you can change freely ─────────────────────────────────────────

// TODO: Set the background colour for your level (used if no background image)
const BG_COLOR = 0x87ceeb;          // sky blue

// TODO: Set the ground colour (used if no tileset)
const GROUND_COLOR = 0x5c4033;      // brown earth

// TODO: How many collectibles (coins / bananas / stars / etc.) are in the level?
const NUM_COLLECTIBLES = 10;

// Points awarded per collectible
const POINTS_PER_COIN = 5;

// How many seconds the player has to complete the level
// Set to 0 for no time limit
const TIME_LIMIT = 90;

// ────────────────────────────────────────────────────────────────────────────

export class TemplateScene extends Phaser.Scene {
  // context is set by index.js before the scene is started
  static _context = null;

  constructor() {
    // TODO: Change the scene key to match your level id (e.g. 'level01-foret')
    super({ key: '_template' });
  }

  init(data) {
    // Accept context either from the static property or from scene data
    this._ctx = TemplateScene._context || data?.context;
    this._store = this._ctx?.store;
    this._score = 0;
    this._timeLeft = TIME_LIMIT;
    this._levelComplete = false;
  }

  preload() {
    // TODO: Load your level's art assets here.
    // Use relative paths from this file, like:
    //   this.load.image('foret_bg', new URL('./assets/backgrounds/bg.png', import.meta.url).href);
    //   this.load.image('foret_coin', new URL('./assets/sprites/banane.png', import.meta.url).href);
    //   this.load.spritesheet('player', new URL('./assets/sprites/madame_tetyana.png', import.meta.url).href, { frameWidth: 48, frameHeight: 64 });
    //
    // Prefix all your texture keys with your level id to avoid conflicts.
    // Example: 'foret_bg', 'foret_enemy', 'foret_coin'
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // ── Background ───────────────────────────────────────────────────────────
    // TODO: Replace the rectangle with your background image:
    //   this.add.image(W / 2, H / 2, 'foret_bg').setDisplaySize(W, H);
    this.add.rectangle(W / 2, H / 2, W, H, BG_COLOR);

    // ── Physics world bounds ──────────────────────────────────────────────────
    this.physics.world.setBounds(0, 0, W * 2, H);  // Twice wide for scrolling
    this.cameras.main.setBounds(0, 0, W * 2, H);

    // ── Ground platform ───────────────────────────────────────────────────────
    const platforms = this.physics.add.staticGroup();

    // Main ground (full width)
    const ground = this.add.rectangle(W, H - 20, W * 2, 40, GROUND_COLOR);
    this.physics.add.existing(ground, true);
    platforms.add(ground);

    // TODO: Add more platforms for your level.
    // Example floating platform:
    //   this._makePlatform(platforms, 400, H - 140, 200);
    //   this._makePlatform(platforms, 700, H - 240, 160);

    // A few starter platforms so the template is immediately playable:
    this._makePlatform(platforms, 350, H - 140, 180);
    this._makePlatform(platforms, 600, H - 230, 160);
    this._makePlatform(platforms, 850, H - 160, 200);
    this._makePlatform(platforms, 1100, H - 260, 140);
    this._makePlatform(platforms, 1350, H - 180, 180);
    this._makePlatform(platforms, 1600, H - 140, 200);

    // ── Collectibles ─────────────────────────────────────────────────────────
    this._coins = this.physics.add.staticGroup();
    const coinPositions = [
      [200, H - 80], [400, H - 180], [600, H - 270], [700, H - 270],
      [850, H - 200], [900, H - 200], [1100, H - 300], [1200, H - 120],
      [1400, H - 220], [1600, H - 180],
    ];
    coinPositions.slice(0, NUM_COLLECTIBLES).forEach(([cx, cy]) => {
      // TODO: Replace emoji text with your collectible sprite:
      //   const coin = this._coins.create(cx, cy, 'foret_coin');
      const coin = this.add.text(cx, cy, '🌟', { fontSize: '28px' }).setOrigin(0.5);
      this.physics.add.existing(coin, true);
      this._coins.add(coin);
    });

    // ── Goal object ───────────────────────────────────────────────────────────
    // TODO: Replace the trophy emoji with your level's goal art
    this._goal = this.add.text(1700, H - 100, '🏆', {
      fontSize: '48px',
    }).setOrigin(0.5);
    this.physics.add.existing(this._goal, true);

    // Bouncing animation on goal
    this.tweens.add({
      targets: this._goal,
      y: H - 120,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // ── Player ────────────────────────────────────────────────────────────────
    this._inputManager = new InputManager(this);
    initVirtualControls(this._inputManager);

    this._player = new Player(this, 80, H - 80, this._store, this._inputManager);

    // Collide player with platforms
    this.physics.add.collider(this._player.sprite, platforms);

    // ── Camera ────────────────────────────────────────────────────────────────
    this.cameras.main.startFollow(this._player.sprite, true, 0.1, 0.1);

    // ── Overlap detection ─────────────────────────────────────────────────────
    // Collect coins
    this.physics.add.overlap(this._player.sprite, this._coins, (playerSprite, coin) => {
      this._collectCoin(coin);
    });

    // Touch goal
    this.physics.add.overlap(this._player.sprite, this._goal, () => {
      if (!this._levelComplete) this._winLevel();
    });

    // ── HUD ───────────────────────────────────────────────────────────────────
    this._scoreText = this.add.text(16, 16, '⭐ 0', {
      fontFamily: 'Arial',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#ffdd44',
      stroke: '#000000',
      strokeThickness: 4,
    }).setScrollFactor(0);  // Fixed to camera

    this._livesText = this.add.text(16, 50, '❤️ ❤️ ❤️', {
      fontSize: '20px',
    }).setScrollFactor(0);

    // Timer (only shown if TIME_LIMIT > 0)
    if (TIME_LIMIT > 0) {
      this._timerText = this.add.text(this.scale.width / 2, 16, `⏱ ${TIME_LIMIT}`, {
        fontFamily: 'Arial',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
      }).setScrollFactor(0).setOrigin(0.5, 0);

      this.time.addEvent({
        delay: 1000,
        repeat: TIME_LIMIT - 1,
        callback: this._tickTimer,
        callbackScope: this,
      });
    }

    // ── Title card ────────────────────────────────────────────────────────────
    const titleCard = this.add.text(this.scale.width / 2, this.scale.height / 2 - 40, 'Niveau Modèle', {
      fontFamily: 'Arial',
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6,
    }).setScrollFactor(0).setOrigin(0.5).setDepth(10);

    this.tweens.add({
      targets: titleCard,
      alpha: 0,
      delay: 1800,
      duration: 600,
      onComplete: () => titleCard.destroy(),
    });

    // ── Back to map shortcut ──────────────────────────────────────────────────
    const backBtn = this.add.text(this.scale.width - 16, 16, '↩ Carte', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#cccccc',
      stroke: '#000000',
      strokeThickness: 3,
    }).setScrollFactor(0).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setDepth(10);

    backBtn.on('pointerdown', () => this._quitLevel());

    this.cameras.main.fadeIn(400);
  }

  update() {
    if (this._levelComplete) return;

    this._inputManager.update();

    const died = !this._player.update();
    if (died) {
      this.time.delayedCall(800, () => this._loseLevel());
      this._levelComplete = true;
      return;
    }

    // Magnet: pull nearby coins
    if (this._player.hasMagnet) {
      this._coins.getChildren().forEach(coin => {
        const dist = Phaser.Math.Distance.Between(
          this._player.x, this._player.y, coin.x, coin.y
        );
        if (dist < this._player.MAGNET_RADIUS) {
          this._collectCoin(coin);
        }
      });
    }

    // Fell off the world?
    if (this._player.y > this.physics.world.bounds.height + 100) {
      const died = this._player.takeDamage();
      if (died) {
        this.time.delayedCall(500, () => this._loseLevel());
        this._levelComplete = true;
      } else {
        // Respawn at start
        this._player.sprite.setPosition(80, this.scale.height - 80);
        this._player.sprite.setVelocity(0, 0);
      }
    }

    this._updateHUD();
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  _makePlatform(group, x, y, width) {
    // TODO: Replace with your platform sprite:
    //   return group.create(x, y, 'foret_platform');
    const rect = this.add.rectangle(x, y, width, 24, GROUND_COLOR - 0x111111);
    this.physics.add.existing(rect, true);
    group.add(rect);
    return rect;
  }

  _collectCoin(coin) {
    if (!coin.active) return;
    coin.setActive(false).setVisible(false);
    if (coin.body) coin.body.enable = false;

    this._score += POINTS_PER_COIN;
    this._updateHUD();

    // Sound effect
    if (this.cache.audio.exists('snd_coin')) {
      this.sound.play('snd_coin', { volume: 0.7 });
    }
  }

  _tickTimer() {
    this._timeLeft--;
    if (this._timerText) {
      this._timerText.setText(`⏱ ${this._timeLeft}`);
      if (this._timeLeft <= 10) this._timerText.setColor('#ff4444');
    }
    if (this._timeLeft <= 0 && !this._levelComplete) {
      this._loseLevel();
    }
  }

  _updateHUD() {
    this._scoreText.setText(`⭐ ${this._score}`);
    const hearts = '❤️'.repeat(this._player.lives) + '🖤'.repeat(Math.max(0, 3 - this._player.lives));
    this._livesText.setText(hearts);
  }

  _calcStars() {
    // 3 stars: collected all coins + time remaining > 30s
    // 2 stars: collected > half coins OR time remaining > 15s
    // 1 star:  completed at all
    const totalCoins = NUM_COLLECTIBLES;
    const collected  = totalCoins - this._coins.getChildren().filter(c => c.active).length;
    const ratio      = collected / totalCoins;

    if (ratio >= 1 && this._timeLeft > 30) return 3;
    if (ratio >= 0.5 || this._timeLeft > 15) return 2;
    return 1;
  }

  _winLevel() {
    this._levelComplete = true;
    hideVirtualControls();

    const W = this.scale.width;
    const H = this.scale.height;
    const stars = this._calcStars();

    // Win splash
    this.add.text(W / 2, H / 2 - 60, '🎉 Bravo !', {
      fontFamily: 'Arial',
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#ffdd44',
      stroke: '#000000',
      strokeThickness: 6,
    }).setScrollFactor(0).setOrigin(0.5).setDepth(20);

    this.add.text(W / 2, H / 2, '⭐'.repeat(stars) + '☆'.repeat(3 - stars), {
      fontSize: '40px',
    }).setScrollFactor(0).setOrigin(0.5).setDepth(20);

    if (this.cache.audio.exists('snd_success')) {
      this.sound.play('snd_success');
    }

    this.time.delayedCall(2500, () => {
      this._ctx?.onComplete({
        levelId: '_template',  // TODO: change to your level id
        completed: true,
        pointsEarned: this._score,
        starsEarned: stars,
        durationSeconds: TIME_LIMIT - this._timeLeft,
      });
      this._endScene();
    });
  }

  _loseLevel() {
    this._levelComplete = true;
    hideVirtualControls();

    const W = this.scale.width;
    const H = this.scale.height;

    this.add.text(W / 2, H / 2 - 40, '💔 Essaie encore !', {
      fontFamily: 'Arial',
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#ff6666',
      stroke: '#000000',
      strokeThickness: 6,
    }).setScrollFactor(0).setOrigin(0.5).setDepth(20);

    if (this.cache.audio.exists('snd_fail')) {
      this.sound.play('snd_fail');
    }

    this.time.delayedCall(2000, () => {
      this._ctx?.onComplete({
        levelId: '_template',
        completed: false,
        pointsEarned: this._score,
        starsEarned: 0,
        durationSeconds: TIME_LIMIT - this._timeLeft,
      });
      this._endScene();
    });
  }

  _quitLevel() {
    hideVirtualControls();
    this._ctx?.onComplete({
      levelId: '_template',
      completed: false,
      pointsEarned: this._score,
      starsEarned: 0,
      durationSeconds: TIME_LIMIT - this._timeLeft,
    });
    this._endScene();
  }

  _endScene() {
    this.cameras.main.fadeOut(400, 0, 0, 0, (_cam, progress) => {
      if (progress === 1) this.scene.stop();
    });
  }
}
