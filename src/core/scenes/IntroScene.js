// IntroScene.js — comic panel slideshow intro
// 5 static panels, auto-advances every 3.5s or on tap/click.
// Skipped entirely after the first viewing.

import { registry } from '../../gameRegistry.js';

const PANELS = [
  {
    bgColor: 0x2d5a1b,
    texts: [
      { text: 'Je suis Madame Tetyana,', dy: -50, size: '26px', bold: true },
      { text: 'exploratrice extraordinaire !', dy: -10, size: '22px' },
    ],
    emoji: { icon: '🧑‍🏫', dy: 80, size: '80px' },
  },
  {
    bgColor: 0x1a3a5c,
    texts: [
      { text: 'Un trésor est caché dans', dy: -50, size: '24px' },
      { text: 'six endroits secrets...', dy: -10, size: '24px', bold: true },
    ],
    emoji: { icon: '🗺️', dy: 80, size: '80px' },
  },
  {
    bgColor: 0x4a2c0a,
    texts: [
      { text: 'Un vieux professeur lui donne une clé.', dy: -60, size: '22px' },
      { text: '"Vous devez trouver les six morceaux !"', dy: -15, size: '20px', italic: true },
    ],
    emoji: { icon: '🔑', dy: 80, size: '80px' },
  },
  {
    bgColor: 0x1f1f3a,
    texts: [
      { text: 'Madame Tetyana met son sac à dos.', dy: -60, size: '22px' },
      { text: '"Je pars à l\'aventure ! Allons-y !"', dy: -15, size: '22px', bold: true, color: '#ffdd44' },
    ],
    emoji: { icon: '🎒', dy: 80, size: '80px' },
  },
  {
    bgColor: 0x0d0d1a,
    texts: [
      { text: 'LES AVENTURES DE', dy: -80, size: '28px', bold: true },
      { text: 'MADAME TETYANA', dy: -30, size: '38px', bold: true, color: '#ffdd44' },
      { text: 'Appuie pour commencer !', dy: 50, size: '20px', color: '#aaaaff' },
    ],
    emoji: { icon: '🏆', dy: 120, size: '60px' },
    isLast: true,
  },
];

const AUTO_ADVANCE_MS = 3500;

export class IntroScene extends Phaser.Scene {
  constructor() {
    super({ key: 'IntroScene' });
  }

  create() {
    const store = registry.store;

    // Skip intro on repeat visits
    if (store && store.getState().introSeen) {
      this.scene.start('WorldMapScene');
      return;
    }

    this._currentPanel = 0;
    this._transitioning = false;

    const W = this.scale.width;
    const H = this.scale.height;

    // Full-screen background rectangle (changes color per panel)
    this._bg = this.add.rectangle(W / 2, H / 2, W, H, PANELS[0].bgColor);

    // Optional: panel image (shown if texture is loaded)
    this._panelImg = this.add.image(W / 2, H / 2, '__DEFAULT').setVisible(false);

    // Text + emoji container (recreated per panel)
    this._textGroup = [];

    // Skip button
    this.add.text(W - 16, 16, '[ Passer ]', {
      fontFamily: 'Arial',
      fontSize: '15px',
      color: '#888888',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._goToMap());

    // Tap anywhere to advance
    this.input.on('pointerdown', () => {
      if (!this._transitioning) this._advance();
    });

    this._showPanel(0);
    this.cameras.main.fadeIn(300);
  }

  _showPanel(index) {
    const panel = PANELS[index];
    const W = this.scale.width;
    const H = this.scale.height;

    // Clear previous panel elements
    this._textGroup.forEach(t => t.destroy());
    this._textGroup = [];

    // Background
    this._bg.fillColor = panel.bgColor;

    // Panel image (if available)
    const imgKey = `panel_${index + 1}`;
    if (this.textures.exists(imgKey)) {
      this._panelImg.setTexture(imgKey).setDisplaySize(W, H).setVisible(true);
    } else {
      this._panelImg.setVisible(false);
    }

    // Emoji illustration
    if (panel.emoji) {
      const e = this.add.text(W / 2, H / 2 + panel.emoji.dy, panel.emoji.icon, {
        fontSize: panel.emoji.size || '80px',
      }).setOrigin(0.5);
      this._textGroup.push(e);
    }

    // Text bubbles
    panel.texts.forEach(t => {
      const txt = this.add.text(W / 2, H / 2 + (t.dy || 0), t.text, {
        fontFamily: 'Arial',
        fontSize: t.size || '22px',
        fontStyle: [t.bold ? 'bold' : '', t.italic ? 'italic' : ''].join(' ').trim() || 'normal',
        color: t.color || '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
        align: 'center',
        wordWrap: { width: W - 80 },
      }).setOrigin(0.5);
      this._textGroup.push(txt);
    });

    // Panel counter dots
    PANELS.forEach((_, i) => {
      const dot = this.add.circle(W / 2 - (PANELS.length - 1) * 12 + i * 24, H - 24, 6,
        i === index ? 0xffffff : 0x555555);
      this._textGroup.push(dot);
    });

    // Advance only on user click/tap — no auto-advance
  }

  _advance() {
    if (this._transitioning) return;
    this._transitioning = true;

    this.cameras.main.fadeOut(250, 0, 0, 0, (_cam, progress) => {
      if (progress < 1) return;
      this._transitioning = false;
      const next = this._currentPanel + 1;
      if (next >= PANELS.length) {
        this._goToMap();
      } else {
        this._currentPanel = next;
        this._showPanel(next);
        this.cameras.main.fadeIn(250);
      }
    });
  }

  _goToMap() {
    if (registry.store) registry.store.markIntroSeen();
    this.cameras.main.fadeOut(400, 0, 0, 0, (_cam, progress) => {
      if (progress === 1) this.scene.start('WorldMapScene');
    });
  }
}
