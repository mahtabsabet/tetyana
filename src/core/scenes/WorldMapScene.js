// WorldMapScene.js — level select / overworld
// Reads store and levels from the shared registry.

import { registry } from '../../gameRegistry.js';

const LEVEL_POSITIONS = [
  { x: 0.18, y: 0.55 },  // level01
  { x: 0.35, y: 0.72 },  // level02
  { x: 0.55, y: 0.30 },  // level03
  { x: 0.70, y: 0.60 },  // level04
  { x: 0.82, y: 0.40 },  // level05
  { x: 0.48, y: 0.55 },  // level06
];

// Fallback colors when no thumbnail image is available
const NODE_COLORS = [0x3cb371, 0x1e90ff, 0x9370db, 0x708090, 0xff4500, 0x87ceeb];
const LEVEL_ICONS = ['🌳', '🌊', '🚀', '🏰', '🌋', '❄️'];

export class WorldMapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WorldMapScene' });
  }

  create() {
    const store  = registry.store;
    const levels = registry.levels;
    const state  = store.getState();
    const allMeta = levels.map(l => l.meta);

    const W = this.scale.width;
    const H = this.scale.height;

    // ── Background ─────────────────────────────────────────────────────────
    if (this.textures.exists('map_bg')) {
      this.add.image(W / 2, H / 2, 'map_bg').setDisplaySize(W, H);
    } else {
      // Colourful placeholder
      this.add.rectangle(W / 2, H / 2, W, H, 0x2a7f4e);
      this.add.text(W / 2, H / 2, '🗺️', { fontSize: '220px' }).setOrigin(0.5).setAlpha(0.08);
    }

    // ── Shop decoration overlays ───────────────────────────────────────────
    if (state.unlockedItems.includes('map_flowers')) {
      ['🌸', '🌺', '🌼', '🌻', '🌸'].forEach((e, i) => {
        this.add.text(60 + i * 180, H - 50, e, { fontSize: '30px' }).setOrigin(0.5);
      });
    }
    if (state.unlockedItems.includes('map_rainbow')) {
      this.add.text(W / 2, 60, '🌈', { fontSize: '50px' }).setOrigin(0.5);
    }
    if (state.unlockedItems.includes('map_animals')) {
      ['🦋', '🐇', '🐿️'].forEach((e, i) => {
        this.add.text(100 + i * 380, H / 2 + 40, e, { fontSize: '28px' }).setOrigin(0.5);
      });
    }

    // ── Title ──────────────────────────────────────────────────────────────
    this.add.text(W / 2, 22, 'Les Aventures de Madame Tetyana', {
      fontFamily: 'Arial',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#fff8e1',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5, 0);

    // ── Points & shop button ───────────────────────────────────────────────
    this._pointsText = this.add.text(W - 16, 16, `⭐ ${state.spendablePoints}`, {
      fontFamily: 'Arial',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ffdd44',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(1, 0);

    const keyCount = Object.keys(state.levelsCompleted).length;
    this._keysText = this.add.text(W - 16, 42, `🗝️ ${keyCount} / 6`, {
      fontFamily: 'Arial',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(1, 0);

    this.add.text(W - 16, 64, '🛍️ Boutique', {
      fontFamily: 'Arial',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      backgroundColor: '#22224488',
      padding: { x: 8, y: 4 },
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.scene.launch('ShopScene');
        this.scene.pause('WorldMapScene');
      });

    // ── Reset button ───────────────────────────────────────────────────────
    this.add.text(16, H - 16, '🔄 Recommencer', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#aaaaaa',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0, 1).setInteractive({ useHandCursor: true })
      .on('pointerover', function() { this.setColor('#ffffff'); })
      .on('pointerout',  function() { this.setColor('#aaaaaa'); })
      .on('pointerdown', () => this._confirmReset());

    // Resume after shop closes
    this.events.on('resume', () => {
      this._pointsText.setText(`⭐ ${registry.store.getState().spendablePoints}`);
    });

    // ── Level nodes ────────────────────────────────────────────────────────
    levels.forEach((lvlModule, i) => {
      const meta      = lvlModule.meta;
      const pos       = LEVEL_POSITIONS[i] || { x: 0.5, y: 0.5 };
      const nx        = W * pos.x;
      const ny        = H * pos.y;
      const unlocked  = store.isLevelUnlocked(meta.id, allMeta);
      const completed = state.levelsCompleted[meta.id];
      const color     = NODE_COLORS[i % NODE_COLORS.length];

      // Outer glow for unlocked levels
      if (unlocked && !completed) {
        const glow = this.add.circle(nx, ny, 42, color, 0.3);
        this.tweens.add({ targets: glow, scaleX: 1.15, scaleY: 1.15, alpha: 0, duration: 1200, yoyo: true, repeat: -1 });
      }

      // Node circle
      const circle = this.add.circle(nx, ny, 36, unlocked ? color : 0x444444);
      circle.setStrokeStyle(3, unlocked ? 0xffffff : 0x666666);

      // Level icon / lock
      if (!unlocked) {
        this.add.text(nx, ny, '🔒', { fontSize: '22px' }).setOrigin(0.5);
      } else if (this.textures.exists(meta.thumbnailKey)) {
        this.add.image(nx, ny, meta.thumbnailKey).setDisplaySize(52, 52);
      } else {
        this.add.text(nx, ny, LEVEL_ICONS[i] || '⭐', { fontSize: '26px' }).setOrigin(0.5);
      }

      // Level name
      this.add.text(nx, ny + 46, meta.titleFR, {
        fontFamily: 'Arial',
        fontSize: '12px',
        fontStyle: 'bold',
        color: unlocked ? '#ffffff' : '#777777',
        stroke: '#000000',
        strokeThickness: 3,
        align: 'center',
        wordWrap: { width: 110 },
      }).setOrigin(0.5, 0);

      // Best-star rating badge
      if (completed?.bestStars) {
        this.add.text(nx, ny - 52, '⭐'.repeat(completed.bestStars), {
          fontSize: '14px',
        }).setOrigin(0.5);
      }

      // Interactivity
      if (unlocked) {
        circle.setInteractive({ useHandCursor: true });
        circle.on('pointerover', () => {
          circle.setScale(1.12);
          this._showTooltip(nx, ny - 56, meta.descriptionFR);
        });
        circle.on('pointerout', () => {
          circle.setScale(1);
          this._hideTooltip();
        });
        circle.on('pointerdown', () => {
          this._hideTooltip();
          this._launchLevel(lvlModule);
        });
      }
    });

    // ── Treasure chest (unlocked when all 6 keys collected) ────────────────
    if (keyCount >= 6) {
      this._drawTreasureChest(W, H);
    }

    this._tooltip = null;

    store.on('points_changed', ({ spendable }) => {
      if (this._pointsText?.active) this._pointsText.setText(`⭐ ${spendable}`);
    });

    this.cameras.main.fadeIn(400);
  }

  _drawTreasureChest(W, H) {
    const cx = W * 0.5;
    const cy = H * 0.18;

    // Glowing backdrop
    const glow = this.add.circle(cx, cy, 52, 0xffd700, 0.25);
    this.tweens.add({ targets: glow, scaleX: 1.2, scaleY: 1.2, alpha: 0, duration: 1000, yoyo: true, repeat: -1 });

    const chest = this.add.text(cx, cy, '📦', { fontSize: '52px' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.tweens.add({ targets: chest, y: cy - 8, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.add.text(cx, cy + 46, '✨ Coffre au trésor !', {
      fontFamily: 'Arial',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
    }).setOrigin(0.5, 0);

    chest.on('pointerdown', () => this._openTreasureChest(W, H));
  }

  _openTreasureChest(W, H) {
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75).setDepth(60);
    const box     = this.add.rectangle(W / 2, H / 2, 420, 260, 0x1a1a3e).setDepth(61).setStrokeStyle(4, 0xffd700);

    this.add.text(W / 2, H / 2 - 90, '🎉 Tu as toutes les clés !', {
      fontFamily: 'Arial', fontSize: '20px', fontStyle: 'bold',
      color: '#ffd700', stroke: '#000000', strokeThickness: 4, align: 'center',
    }).setOrigin(0.5).setDepth(62);

    this.add.text(W / 2, H / 2 - 46, '📚 📖 📚 📖 📚', {
      fontSize: '38px',
    }).setOrigin(0.5).setDepth(62);

    this.add.text(W / 2, H / 2 + 8, 'Ta récompense : des livres !', {
      fontFamily: 'Arial', fontSize: '16px',
      color: '#ffffff', stroke: '#000000', strokeThickness: 3, align: 'center',
    }).setOrigin(0.5).setDepth(62);

    const closeBtn = this.add.text(W / 2, H / 2 + 70, '✓ Super !', {
      fontFamily: 'Arial', fontSize: '18px', fontStyle: 'bold',
      color: '#ffffff', backgroundColor: '#22224488', padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setDepth(62).setInteractive({ useHandCursor: true });

    const all = [overlay, box, closeBtn];
    const close = () => all.forEach(o => o.destroy());
    closeBtn.on('pointerdown', close);
    this.input.keyboard.once('keydown-ESC', close);
  }

  _launchLevel(lvlModule) {
    const store = registry.store;

    const context = {
      store,
      onComplete: (result) => this._onLevelComplete(result),
      playSharedSound: (key) => {
        const sndKey = `snd_${key}`;
        if (this.cache.audio.exists(sndKey)) this.sound.play(sndKey, { volume: 0.8 });
      },
    };

    // Inject the real context into the level module (sets the static _context on the scene class)
    lvlModule.createScene(context);

    // Start by meta.id — this matches the key set in each scene's constructor
    this.cameras.main.fadeOut(300, 0, 0, 0, (_cam, progress) => {
      if (progress === 1) {
        this.scene.start(lvlModule.meta.id, { context });
      }
    });
  }

  _onLevelComplete(result) {
    if (result.completed) {
      registry.store.completeLevel(result);
    }
    // Restart the map scene to refresh star badges
    this.scene.start('WorldMapScene');
  }

  _showTooltip(x, y, text) {
    this._hideTooltip();
    this._tooltip = this.add.text(x, y, text, {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      backgroundColor: '#00000099',
      padding: { x: 8, y: 5 },
      wordWrap: { width: 180 },
      align: 'center',
    }).setOrigin(0.5, 1);
  }

  _hideTooltip() {
    if (this._tooltip) { this._tooltip.destroy(); this._tooltip = null; }
  }

  _confirmReset() {
    const W = this.scale.width;
    const H = this.scale.height;

    // Dim overlay
    const overlay  = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setDepth(50);
    const box      = this.add.rectangle(W / 2, H / 2, 420, 180, 0x1a1a3e).setDepth(51).setStrokeStyle(3, 0xff4444);
    const label1   = this.add.text(W / 2, H / 2 - 50, 'Recommencer depuis le début ?', {
      fontFamily: 'Arial', fontSize: '18px', fontStyle: 'bold',
      color: '#ffffff', align: 'center', wordWrap: { width: 380 },
    }).setOrigin(0.5).setDepth(52);
    const label2   = this.add.text(W / 2, H / 2 - 14, 'Tous les points et progrès seront effacés.', {
      fontFamily: 'Arial', fontSize: '14px', color: '#aaaaaa',
    }).setOrigin(0.5).setDepth(52);

    const all = [overlay, box, label1, label2];

    const confirmBtn = this.add.text(W / 2 - 70, H / 2 + 40, '✓ Oui', {
      fontFamily: 'Arial', fontSize: '18px', fontStyle: 'bold',
      color: '#ff4444', backgroundColor: '#330000', padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setDepth(52).setInteractive({ useHandCursor: true });

    const cancelBtn = this.add.text(W / 2 + 70, H / 2 + 40, '✕ Non', {
      fontFamily: 'Arial', fontSize: '18px', fontStyle: 'bold',
      color: '#ffffff', backgroundColor: '#222244', padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setDepth(52).setInteractive({ useHandCursor: true });

    all.push(confirmBtn, cancelBtn);

    const close = () => all.forEach(o => o.destroy());

    confirmBtn.on('pointerdown', () => {
      close();
      registry.store.resetProgress();
      this.scene.start('IntroScene');
    });

    cancelBtn.on('pointerdown', close);

    this.input.keyboard.once('keydown-ESC', close);
  }
}
