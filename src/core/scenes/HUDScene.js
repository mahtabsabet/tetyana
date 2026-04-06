// HUDScene.js — persistent HUD overlay shown during gameplay
// Launched alongside a level scene, not instead of it.

export class HUDScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HUDScene' });
  }

  init(data) {
    this._store    = data.store;
    this._lives    = data.lives    ?? 3;
    this._maxLives = data.maxLives ?? 3;
    this._levelTitle = data.levelTitleFR ?? '';
  }

  create() {
    const W = this.scale.width;

    // ── Points counter ─────────────────────────────────────────────────────
    this._pointsText = this.add.text(W - 16, 14, '⭐ 0', {
      fontFamily: 'Arial',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ffdd44',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(1, 0);

    // ── Lives ──────────────────────────────────────────────────────────────
    this._livesGroup = this.add.group();
    this._drawLives();

    // ── Level title ────────────────────────────────────────────────────────
    this.add.text(W / 2, 14, this._levelTitle, {
      fontFamily: 'Arial',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5, 0);

    // ── Pause button ───────────────────────────────────────────────────────
    const pauseBtn = this.add.text(16, 14, '⏸', {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#ffffff',
    }).setInteractive({ useHandCursor: true });

    pauseBtn.on('pointerdown', () => {
      this.events.emit('pause_requested');
    });
  }

  // Called by the level scene each frame
  updatePoints(points) {
    if (this._pointsText) this._pointsText.setText(`⭐ ${points}`);
  }

  updateLives(lives) {
    this._lives = lives;
    this._drawLives();
  }

  _drawLives() {
    this._livesGroup.clear(true, true);
    for (let i = 0; i < this._maxLives; i++) {
      const icon = i < this._lives ? '❤️' : '🖤';
      this._livesGroup.add(
        this.add.text(16 + i * 34, 50, icon, { fontSize: '22px' })
      );
    }
  }

  /** Show a big floating "+N pts" pop-up */
  showPointsPopup(amount, x, y) {
    // Convert world coordinates to screen if needed (approximate)
    const W = this.scale.width;
    const H = this.scale.height;
    const sx = Math.max(40, Math.min(W - 40, x));
    const sy = Math.max(40, Math.min(H - 40, y));

    const txt = this.add.text(sx, sy, `+${amount}`, {
      fontFamily: 'Arial',
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#ffdd44',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: txt,
      y: sy - 60,
      alpha: 0,
      duration: 900,
      onComplete: () => txt.destroy(),
    });
  }
}
