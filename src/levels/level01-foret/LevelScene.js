// level01-foret/LevelScene.js — La Forêt Enchantée
//
// GROUPE 1 — votre niveau commence ici !
// Lisez GUIDE_NIVEAU.md pour les instructions.
//
// Thème : La forêt avec des animaux
// Vocabulaire français : le singe, le perroquet, la grenouille, la banane
// Collectibles : des bananes 🍌
// Ennemis : des grenouilles sauteuses 🐸
// But : trouver le trésor caché dans le temple 🏛️

import { Player }              from '../../core/player/Player.js';
import { InputManager }        from '../../core/input/InputManager.js';
import { initVirtualControls,
         hideVirtualControls } from '../../core/input/VirtualControls.js';
import { showQuiz }            from '../../core/scenes/QuizOverlay.js';

// ── Questions vocabulaire (2 par niveau) ─────────────────────────────────────
// TODO: Remplacez imageEmoji par imageKey quand les vraies images sont prêtes.
//   Chargez-les dans preload() : this.load.image('foret_quiz_recyclage', ...)
const QUIZ_QUESTIONS = [
  {
    imageEmoji: '♻️',
    // imageKey: 'foret_quiz_recyclage',
    correct: 'Le recyclage',
    wrong:   ['La pollution', 'La forêt', 'Le soleil'],
  },
  {
    imageEmoji: '🏭',
    // imageKey: 'foret_quiz_usine',
    correct: 'La pollution',
    wrong:   ['Le recyclage', 'La neige', 'La pluie'],
  },
];

// ── TODO: Personnalisez ces valeurs pour votre niveau ────────────────────────

const BG_COLOR         = 0x228b22;   // Vert forêt
const GROUND_COLOR     = 0x5c4033;   // Brun terre
const NUM_COLLECTIBLES = 10;
const POINTS_PER_COIN  = 5;
const TIME_LIMIT       = 90;         // secondes (0 = pas de limite)

// ─────────────────────────────────────────────────────────────────────────────

export class ForetScene extends Phaser.Scene {
  static _context = null;

  constructor() {
    super({ key: 'level01-foret' });
  }

  init(data) {
    this._ctx            = ForetScene._context || data?.context;
    this._store          = this._ctx?.store;
    this._score          = 0;
    this._timeLeft       = TIME_LIMIT;
    this._done           = false;
    this._damageCooldown = false;
  }

  preload() {
    // TODO: Chargez vos images ici. Exemples :
    // this.load.image('foret_bg',    new URL('./assets/backgrounds/foret_bg.png', import.meta.url).href);
    // this.load.image('foret_coin',  new URL('./assets/sprites/banane.png', import.meta.url).href);
    // this.load.image('foret_enemy', new URL('./assets/sprites/grenouille.png', import.meta.url).href);
    // this.load.image('foret_goal',  new URL('./assets/sprites/temple.png', import.meta.url).href);
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // ── Arrière-plan ─────────────────────────────────────────────────────────
    // TODO: Remplacez par votre image : this.add.image(W/2, H/2, 'foret_bg').setDisplaySize(W*2, H);
    this.add.rectangle(W, H / 2, W * 2, H, BG_COLOR);

    // Arbres décoratifs (à remplacer par vos dessins)
    ['🌳', '🌲', '🌴', '🌳', '🌲', '🌳', '🌲'].forEach((tree, i) => {
      this.add.text(100 + i * 280, H - 90, tree, { fontSize: '70px' }).setOrigin(0.5, 1);
    });

    // ── Physique ─────────────────────────────────────────────────────────────
    this.physics.world.setBounds(0, 0, W * 2, H);
    this.cameras.main.setBounds(0, 0, W * 2, H);

    const platforms = this.physics.add.staticGroup();

    // Sol principal
    const sol = this.add.rectangle(W, H - 20, W * 2, 40, GROUND_COLOR);
    this.physics.add.existing(sol, true);
    platforms.add(sol);

    // TODO: Ajoutez vos plateformes ici !
    // Exemple : this._plateforme(platforms, 400, H - 140, 200);
    this._plateforme(platforms, 300,  H - 130, 160);
    this._plateforme(platforms, 550,  H - 220, 140);
    this._plateforme(platforms, 800,  H - 150, 180);
    this._plateforme(platforms, 1050, H - 250, 140);
    this._plateforme(platforms, 1300, H - 160, 180);
    this._plateforme(platforms, 1550, H - 130, 200);

    // ── Collectibles (bananes) ────────────────────────────────────────────────
    this._coins = this.physics.add.staticGroup();
    [
      [180, H - 80], [310, H - 170], [560, H - 260], [660, H - 260],
      [810, H - 190], [870, H - 190], [1060, H - 290], [1150, H - 120],
      [1320, H - 200], [1570, H - 170],
    ].slice(0, NUM_COLLECTIBLES).forEach(([cx, cy]) => {
      // TODO: Remplacez l'emoji par votre sprite : this._coins.create(cx, cy, 'foret_coin');
      const coin = this.add.text(cx, cy, '🍌', { fontSize: '26px' }).setOrigin(0.5);
      this.physics.add.existing(coin, true);
      this._coins.add(coin);
    });

    // ── But (temple) ──────────────────────────────────────────────────────────
    // TODO: Remplacez l'emoji par votre sprite : this.add.image(1750, H - 90, 'foret_goal')
    this._goal = this.add.text(1820, H - 90, '🗝️', { fontSize: '56px' }).setOrigin(0.5);
    this.physics.add.existing(this._goal, true);
    this.tweens.add({ targets: this._goal, y: H - 110, duration: 900, yoyo: true, repeat: -1 });

    // ── Joueur ────────────────────────────────────────────────────────────────
    this._input  = new InputManager(this);
    initVirtualControls(this._input);
    this._player = new Player(this, 80, H - 80, this._store, this._input);
    this.physics.add.collider(this._player.sprite, platforms);
    this.cameras.main.startFollow(this._player.sprite, true, 0.1, 0.1);

    // ── Obstacles (réduisent les points de vie au contact) ────────────────────
    // TODO: Remplacez les emplacements et l'emoji par ceux de votre niveau
    this._obstacles = this.physics.add.staticGroup();
    this._obstacle(this._obstacles, 430,  H - 60, '🌵');
    this._obstacle(this._obstacles, 720,  H - 60, '🌵');
    this._obstacle(this._obstacles, 1200, H - 60, '🌵');

    // ── Collisions ────────────────────────────────────────────────────────────
    this.physics.add.overlap(this._player.sprite, this._coins, (_, coin) => this._ramasserCoin(coin));
    this.physics.add.overlap(this._player.sprite, this._goal,  () => { if (!this._done) this._gagner(); });
    this.physics.add.overlap(this._player.sprite, this._obstacles, () => {
      if (this._done || this._damageCooldown) return;
      this._damageCooldown = true;
      this.time.delayedCall(1000, () => { this._damageCooldown = false; });
      if (this._player.takeDamage()) { this._done = true; this.time.delayedCall(500, () => this._perdre()); }
    });

    // ── HUD ───────────────────────────────────────────────────────────────────
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

      this.time.addEvent({ delay: 1000, repeat: TIME_LIMIT - 1, callback: this._tickerMinute, callbackScope: this });
    }

    // Titre du niveau
    const titre = this.add.text(W / 2, H / 2 - 40, 'La Forêt Enchantée', {
      fontFamily: 'Arial', fontSize: '34px', fontStyle: 'bold',
      color: '#ffffff', stroke: '#000', strokeThickness: 6,
    }).setScrollFactor(0).setOrigin(0.5).setDepth(10);
    this.tweens.add({ targets: titre, alpha: 0, delay: 2000, duration: 600, onComplete: () => titre.destroy() });

    // Bouton retour
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

    // Magnétisme
    if (this._player.hasMagnet) {
      this._coins.getChildren().forEach(c => {
        if (Phaser.Math.Distance.Between(this._player.x, this._player.y, c.x, c.y) < this._player.MAGNET_RADIUS)
          this._ramasserCoin(c);
      });
    }

    // Tombé hors du monde
    if (this._player.y > this.physics.world.bounds.height + 100) {
      if (this._player.takeDamage()) { this._done = true; this.time.delayedCall(500, () => this._perdre()); }
      else { this._player.sprite.setPosition(80, this.scale.height - 80); this._player.sprite.setVelocity(0, 0); }
    }

    this._mettreAJourHUD();
  }

  // ── Méthodes privées ───────────────────────────────────────────────────────

  _obstacle(group, x, y, emoji) {
    const rect = this.add.rectangle(x, y, 32, 36, 0xff2200);
    this.physics.add.existing(rect, true);
    group.add(rect);
    this.add.text(x, y + 2, emoji, { fontSize: '26px' }).setOrigin(0.5);
    return rect;
  }

  _plateforme(group, x, y, width) {
    // TODO: Utilisez votre sprite : group.create(x, y, 'foret_plateforme');
    const rect = this.add.rectangle(x, y, width, 24, 0x4a7c3f);
    this.physics.add.existing(rect, true);
    group.add(rect);
    return rect;
  }

  _ramasserCoin(coin) {
    if (!coin.active) return;
    coin.setActive(false).setVisible(false);
    if (coin.body) coin.body.enable = false;
    this._score += POINTS_PER_COIN;
    if (this.cache.audio.exists('snd_coin')) this.sound.play('snd_coin', { volume: 0.7 });
  }

  _tickerMinute() {
    this._timeLeft--;
    if (this._timerText) {
      this._timerText.setText(`⏱ ${this._timeLeft}`);
      if (this._timeLeft <= 10) this._timerText.setColor('#ff4444');
    }
    if (this._timeLeft <= 0 && !this._done) { this._done = true; this._perdre(); }
  }

  _mettreAJourHUD() {
    this._scoreText.setText(`⭐ ${this._score}`);
    const vies = '❤️'.repeat(this._player.lives) + '🖤'.repeat(Math.max(0, 3 - this._player.lives));
    this._viesText.setText(vies);
  }

  _calcEtoiles() {
    const total    = NUM_COLLECTIBLES;
    const restants = this._coins.getChildren().filter(c => c.active).length;
    const ratio    = (total - restants) / total;
    if (ratio >= 1 && this._timeLeft > 30) return 3;
    if (ratio >= 0.5 || this._timeLeft > 15) return 2;
    return 1;
  }

  _gagner() {
    this._done = true;
    hideVirtualControls();
    const W = this.scale.width;
    const H = this.scale.height;
    const etoiles = this._calcEtoiles();

    this.add.text(W / 2, H / 2 - 60, '🎉 Bravo !', {
      fontFamily: 'Arial', fontSize: '48px', fontStyle: 'bold',
      color: '#ffdd44', stroke: '#000', strokeThickness: 6,
    }).setScrollFactor(0).setOrigin(0.5).setDepth(20);

    this.add.text(W / 2, H / 2, '⭐'.repeat(etoiles) + '☆'.repeat(3 - etoiles), {
      fontSize: '40px',
    }).setScrollFactor(0).setOrigin(0.5).setDepth(20);

    if (this.cache.audio.exists('snd_success')) this.sound.play('snd_success');

    // Show vocabulary quiz before completing the level
    this.time.delayedCall(1500, () => {
      showQuiz(this, QUIZ_QUESTIONS, (bonus) => {
        this._score += bonus;
        this._ctx?.onComplete({ levelId: 'level01-foret', completed: true, pointsEarned: this._score, starsEarned: etoiles, durationSeconds: TIME_LIMIT - this._timeLeft });
        this._terminer();
      });
    });
  }

  _perdre() {
    hideVirtualControls();
    const W = this.scale.width;
    const H = this.scale.height;
    this.add.text(W / 2, H / 2 - 40, '💔 Essaie encore !', {
      fontFamily: 'Arial', fontSize: '36px', fontStyle: 'bold',
      color: '#ff6666', stroke: '#000', strokeThickness: 6,
    }).setScrollFactor(0).setOrigin(0.5).setDepth(20);
    if (this.cache.audio.exists('snd_fail')) this.sound.play('snd_fail');
    this.time.delayedCall(2000, () => {
      this._ctx?.onComplete({ levelId: 'level01-foret', completed: false, pointsEarned: this._score, starsEarned: 0, durationSeconds: TIME_LIMIT - this._timeLeft });
      this._terminer();
    });
  }

  _quitter() {
    hideVirtualControls();
    this._ctx?.onComplete({ levelId: 'level01-foret', completed: false, pointsEarned: this._score, starsEarned: 0, durationSeconds: 0 });
    this._terminer();
  }

  _terminer() {
    this.cameras.main.fadeOut(400, 0, 0, 0, (_cam, p) => { if (p === 1) this.scene.stop(); });
  }
}
