// ShopScene.js — points-based shop overlay
// Launched on top of WorldMapScene. Closes and resumes the map.

import { SHOP_ITEMS } from '../../shop/shopData.js';
import { registry } from '../../gameRegistry.js';

const CATEGORY_LABELS = {
  cosmetic:   '🎨 Cosmétiques',
  upgrade:    '⚡ Améliorations',
  decoration: '🗺️ Décorations',
};

export class ShopScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ShopScene' });
  }

  init(_data) {
    this._store = registry.store;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const store = this._store;

    // ── Dark overlay backdrop ──────────────────────────────────────────────
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75);

    // ── Shop panel ─────────────────────────────────────────────────────────
    const panelW = Math.min(W - 60, 700);
    const panelH = H - 80;
    const panelX = W / 2;
    const panelY = H / 2;

    this.add.rectangle(panelX, panelY, panelW, panelH, 0x1a1a3e).setStrokeStyle(3, 0xffdd44);

    // ── Title ──────────────────────────────────────────────────────────────
    this.add.text(panelX, panelY - panelH / 2 + 24, '🛍️ La Boutique', {
      fontFamily: 'Arial',
      fontSize: '26px',
      fontStyle: 'bold',
      color: '#ffdd44',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5, 0);

    // ── Points display ─────────────────────────────────────────────────────
    const state = store.getState();
    this._balanceText = this.add.text(panelX, panelY - panelH / 2 + 58, `⭐ ${state.spendablePoints} points`, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff',
    }).setOrigin(0.5, 0);

    // ── Close button ───────────────────────────────────────────────────────
    const closeBtn = this.add.text(panelX + panelW / 2 - 12, panelY - panelH / 2 + 12, '✕', {
      fontFamily: 'Arial',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#ff6666',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => this._close());
    this.input.keyboard.once('keydown-ESC', () => this._close());

    // ── Item grid ──────────────────────────────────────────────────────────
    const startY = panelY - panelH / 2 + 100;
    const startX = panelX - panelW / 2 + 20;
    const colW   = (panelW - 40) / 2;
    let row = 0;
    let col = 0;
    let lastCategory = null;

    SHOP_ITEMS.forEach((item) => {
      const state = store.getState();
      const owned = store.hasItem(item.id);
      const canAfford = state.spendablePoints >= item.cost;

      // Category header
      if (item.category !== lastCategory) {
        lastCategory = item.category;
        if (col === 1) { row++; col = 0; } // bump to next row
        const headerY = startY + row * 80;
        this.add.text(startX, headerY, CATEGORY_LABELS[item.category], {
          fontFamily: 'Arial',
          fontSize: '14px',
          fontStyle: 'bold',
          color: '#aaaaff',
        });
        row++;
        col = 0;
      }

      const ix = startX + col * colW;
      const iy = startY + row * 80;

      // Item card
      const cardColor = owned ? 0x225522 : canAfford ? 0x222244 : 0x222222;
      const card = this.add.rectangle(ix + colW / 2 - 10, iy + 28, colW - 20, 60, cardColor)
        .setStrokeStyle(2, owned ? 0x44ff44 : canAfford ? 0x4466ff : 0x444444)
        .setOrigin(0.5);

      // Icon + name
      this.add.text(ix + 10, iy + 10, `${item.icon} ${item.nameFR}`, {
        fontFamily: 'Arial',
        fontSize: '14px',
        fontStyle: 'bold',
        color: owned ? '#88ff88' : canAfford ? '#ffffff' : '#666666',
        wordWrap: { width: colW - 70 },
      });

      // Cost or "Acheté"
      const costLabel = owned
        ? '✓ Acheté !'
        : `⭐ ${item.cost}`;
      const costColor = owned ? '#44ff44' : canAfford ? '#ffdd44' : '#cc4444';
      this.add.text(ix + colW - 30, iy + 28, costLabel, {
        fontFamily: 'Arial',
        fontSize: '13px',
        color: costColor,
      }).setOrigin(1, 0.5);

      // Make purchasable if not owned and can afford
      if (!owned && canAfford) {
        card.setInteractive({ useHandCursor: true });
        card.on('pointerover', () => card.setFillStyle(0x333366));
        card.on('pointerout',  () => card.setFillStyle(cardColor));
        card.on('pointerdown', () => this._purchase(item));
      }

      col++;
      if (col >= 2) { col = 0; row++; }
    });

    this.cameras.main.fadeIn(200);
  }

  _purchase(item) {
    const success = this._store.purchaseItem(item.id, item.cost);
    if (!success) return;

    // Flash feedback
    const W = this.scale.width;
    const H = this.scale.height;
    const flash = this.add.text(W / 2, H / 2, `${item.icon} Acheté !`, {
      fontFamily: 'Arial',
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#ffdd44',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(10);

    this.tweens.add({
      targets: flash,
      y: H / 2 - 80,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        flash.destroy();
        // Refresh shop to reflect purchase
        this.scene.restart({ store: this._store });
      },
    });
  }

  _close() {
    this.cameras.main.fadeOut(200, 0, 0, 0, (_cam, progress) => {
      if (progress === 1) {
        this.scene.stop();
        this.scene.resume('WorldMapScene');
        // Restart map to refresh points display
        // (WorldMapScene listens to 'resume' event)
      }
    });
  }
}
