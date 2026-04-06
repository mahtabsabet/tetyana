// ShopScene.js — points-based shop overlay
// Tabbed layout: Cosmétiques | Améliorations | Décorations
// Each item card has a 60×60 coloured placeholder thumbnail (swap for real art later).

import { SHOP_ITEMS } from '../../shop/shopData.js';
import { registry } from '../../gameRegistry.js';

const TABS = [
  { key: 'cosmetic',   label: '🎨 Cosmétiques' },
  { key: 'upgrade',    label: '⚡ Améliorations' },
  { key: 'decoration', label: '🗺️ Décorations' },
];

// Placeholder background colors per item id
// When real art is added, load an image with key `shop_img_${item.id}` in BootScene.
// _drawCard will use add.image() if the key exists, otherwise falls back to a colored rectangle.
const PLACEHOLDER_COLORS = {
  hat_explorateur:   0x8b6914,
  hat_sorciere:      0x6a0dad,
  hat_astronaute:    0x1a5276,
  hat_couronne:      0x922b21,
  outfit_superheros: 0x1a5276,
  outfit_spatiale:   0x0e6655,
  companion_singe:   0x784212,
  companion_dragon:  0x6e2f1a,
  double_jump:       0x1e8449,
  shield:            0x1a5276,
  extra_life:        0x922b21,
  magnet:            0x616a6b,
  map_flowers:       0x76448a,
  map_rainbow:       0x2471a3,
  map_animals:       0x1e8449,
};

const PANEL_W = 680;
const PANEL_H = 420;
const THUMB_SIZE = 58;
const CARD_H = 72;
const CARD_GAP = 8;
const COL_W = (PANEL_W - 48) / 2;

export class ShopScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ShopScene' });
  }

  init(data) {
    this._store    = registry.store;
    this._tabIndex = data?.tabIndex ?? 0;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // ── Dark backdrop ──────────────────────────────────────────────────────
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.72);

    // ── Panel ──────────────────────────────────────────────────────────────
    const panelX = W / 2;
    const panelY = H / 2;
    this.add.rectangle(panelX, panelY, PANEL_W, PANEL_H, 0x16213e)
      .setStrokeStyle(3, 0xffdd44);

    const top  = panelY - PANEL_H / 2;
    const left = panelX - PANEL_W / 2;

    // ── Header ─────────────────────────────────────────────────────────────
    this.add.text(panelX, top + 20, '🛍️ La Boutique', {
      fontFamily: 'Arial', fontSize: '24px', fontStyle: 'bold',
      color: '#ffdd44', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5, 0);

    const state = this._store.getState();
    this._balanceText = this.add.text(panelX, top + 50, `⭐ ${state.spendablePoints} points`, {
      fontFamily: 'Arial', fontSize: '16px', color: '#ffffff',
    }).setOrigin(0.5, 0);

    // Close button
    this.add.text(left + PANEL_W - 10, top + 10, '✕', {
      fontFamily: 'Arial', fontSize: '22px', fontStyle: 'bold', color: '#ff6666',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._close());
    this.input.keyboard.once('keydown-ESC', () => this._close());

    // ── Tabs ───────────────────────────────────────────────────────────────
    const tabY   = top + 82;
    const tabW   = PANEL_W / TABS.length;
    this._tabBtns = TABS.map((tab, i) => {
      const tx = left + tabW * i + tabW / 2;
      const bg = this.add.rectangle(tx, tabY + 14, tabW - 4, 28,
        i === this._tabIndex ? 0x2c3e7a : 0x0d1117)
        .setStrokeStyle(1, i === this._tabIndex ? 0xffdd44 : 0x444466);

      const label = this.add.text(tx, tabY + 14, tab.label, {
        fontFamily: 'Arial', fontSize: '13px', fontStyle: 'bold',
        color: i === this._tabIndex ? '#ffdd44' : '#888888',
      }).setOrigin(0.5);

      bg.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        this.scene.restart({ tabIndex: i });
      });

      return { bg, label };
    });

    // Divider below tabs
    this.add.rectangle(panelX, tabY + 28, PANEL_W - 4, 2, 0x444466);

    // ── Item grid ──────────────────────────────────────────────────────────
    const category = TABS[this._tabIndex].key;
    const items = SHOP_ITEMS.filter(item => item.category === category);

    const gridTop  = tabY + 38;
    const gridLeft = left + 20;

    items.forEach((item, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cx  = gridLeft + col * (COL_W + 8);
      const cy  = gridTop + row * (CARD_H + CARD_GAP);

      this._drawCard(item, cx, cy);
    });

    this.cameras.main.fadeIn(150);
  }

  _drawCard(item, x, y) {
    const store    = this._store;
    const owned    = store.hasItem(item.id);
    const canAfford = store.getState().spendablePoints >= item.cost;

    // Card background — always readable regardless of afford state
    const bgColor  = owned ? 0x1a3a1a : 0x1e2240;
    const border   = owned ? 0x44cc44 : canAfford ? 0x5577ff : 0x445566;
    const card = this.add.rectangle(x + COL_W / 2, y + CARD_H / 2, COL_W, CARD_H, bgColor)
      .setStrokeStyle(2, border)
      .setOrigin(0.5);

    // ── Thumbnail ─────────────────────────────────────────────────────────
    // Use real art if available (key: `shop_img_${item.id}`), otherwise a coloured rectangle.
    const thumbKey = `shop_img_${item.id}`;
    const thumbX   = x + 6 + THUMB_SIZE / 2;
    const thumbY   = y + CARD_H / 2;
    const thumbAlpha = (!owned && !canAfford) ? 0.45 : 1;

    if (this.textures.exists(thumbKey)) {
      this.add.image(thumbX, thumbY, thumbKey)
        .setDisplaySize(THUMB_SIZE, THUMB_SIZE).setOrigin(0.5).setAlpha(thumbAlpha);
    } else {
      const thumbColor = PLACEHOLDER_COLORS[item.id] ?? 0x333355;
      const thumbGfx = this.add.graphics();
      thumbGfx.fillStyle(thumbColor, thumbAlpha);
      thumbGfx.fillRoundedRect(x + 6, y + (CARD_H - THUMB_SIZE) / 2, THUMB_SIZE, THUMB_SIZE, 6);
      thumbGfx.fillStyle(0xffffff, 0.08 * thumbAlpha);
      thumbGfx.fillRoundedRect(x + 12, y + (CARD_H - THUMB_SIZE) / 2 + 6, THUMB_SIZE - 12, THUMB_SIZE - 12, 3);
    }

    // Emoji overlay on thumbnail
    this.add.text(x + 6 + THUMB_SIZE / 2, y + CARD_H / 2, item.icon, {
      fontSize: '26px',
    }).setOrigin(0.5);

    // ── Name ─────────────────────────────────────────────────────────────
    const nameColor = owned ? '#88ee88' : canAfford ? '#ffffff' : '#99aabb';
    this.add.text(x + THUMB_SIZE + 14, y + 10, item.nameFR, {
      fontFamily: 'Arial', fontSize: '13px', fontStyle: 'bold',
      color: nameColor,
      wordWrap: { width: COL_W - THUMB_SIZE - 22 },
    });

    // ── Description ───────────────────────────────────────────────────────
    this.add.text(x + THUMB_SIZE + 14, y + 30, item.descFR, {
      fontFamily: 'Arial', fontSize: '10px',
      color: owned ? '#66aa66' : '#778899',
      wordWrap: { width: COL_W - THUMB_SIZE - 22 },
    });

    // ── Cost / status ─────────────────────────────────────────────────────
    const costText  = owned ? '✓ Acheté !' : `⭐ ${item.cost}`;
    const costColor = owned ? '#44ee44' : canAfford ? '#ffdd44' : '#ff7777';
    this.add.text(x + COL_W - 6, y + CARD_H - 12, costText, {
      fontFamily: 'Arial', fontSize: '12px', fontStyle: 'bold',
      color: costColor,
    }).setOrigin(1, 1);

    // ── Buy interaction ───────────────────────────────────────────────────
    if (!owned && canAfford) {
      card.setInteractive({ useHandCursor: true });
      card.on('pointerover', () => {
        card.setFillStyle(0x2d3a6a);
        card.setStrokeStyle(2, 0x88aaff);
      });
      card.on('pointerout', () => {
        card.setFillStyle(bgColor);
        card.setStrokeStyle(2, border);
      });
      card.on('pointerdown', () => this._purchase(item));
    }
  }

  _purchase(item) {
    const success = this._store.purchaseItem(item.id, item.cost);
    if (!success) return;

    const W = this.scale.width;
    const H = this.scale.height;
    const flash = this.add.text(W / 2, H / 2, `${item.icon} Acheté !`, {
      fontFamily: 'Arial', fontSize: '36px', fontStyle: 'bold',
      color: '#ffdd44', stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(20);

    this.tweens.add({
      targets: flash,
      y: H / 2 - 80,
      alpha: 0,
      duration: 900,
      onComplete: () => {
        flash.destroy();
        this.scene.restart({ tabIndex: this._tabIndex });
      },
    });
  }

  _close() {
    this.cameras.main.fadeOut(180, 0, 0, 0, (_cam, progress) => {
      if (progress === 1) {
        this.scene.stop();
        this.scene.resume('WorldMapScene');
      }
    });
  }
}
