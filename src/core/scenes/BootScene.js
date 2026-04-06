// BootScene.js — loads all shared assets before any other scene runs

import { registry } from '../../gameRegistry.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    const W = this.scale.width;
    const H = this.scale.height;

    // ── Loading bar ────────────────────────────────────────────────────────
    this.add.rectangle(W / 2, H / 2, W, H, 0x1a1a2e);

    this.add.text(W / 2, H / 2 - 20, 'Les Aventures de Madame Tetyana', {
      fontFamily: 'Arial',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#ffdd44',
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 + 20, 'Chargement...', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    const barBg = this.add.rectangle(W / 2, H / 2 + 60, 400, 16, 0x333355);
    const bar   = this.add.rectangle(W / 2 - 200, H / 2 + 60, 4, 16, 0xffdd44).setOrigin(0, 0.5);

    this.load.on('progress', (value) => {
      bar.width = Math.max(4, 400 * value);
    });

    // ── Shared audio ───────────────────────────────────────────────────────
    // Drop audio files into public/assets/shared/audio/
    // Uncomment each line once the file exists:
    //
    // this.load.audio('snd_jump',    'assets/shared/audio/jump.ogg');
    // this.load.audio('snd_coin',    'assets/shared/audio/coin.ogg');
    // this.load.audio('snd_hurt',    'assets/shared/audio/hurt.ogg');
    // this.load.audio('snd_success', 'assets/shared/audio/success.ogg');
    // this.load.audio('snd_fail',    'assets/shared/audio/fail.ogg');
    // this.load.audio('music_map',   'assets/shared/audio/map_theme.ogg');

    // ── Shared player spritesheet ──────────────────────────────────────────
    // Drop the spritesheet into public/assets/shared/sprites/
    // then uncomment:
    //
    // this.load.spritesheet('player', 'assets/shared/sprites/madame_tetyana.png', {
    //   frameWidth: 48,
    //   frameHeight: 64,
    // });

    // ── Intro comic panels ─────────────────────────────────────────────────
    // Drop PNG files into public/assets/shared/panels/ then uncomment:
    //
    // for (let i = 1; i <= 5; i++) {
    //   this.load.image(`panel_${i}`, `assets/shared/panels/panel${i}.png`);
    // }

    // ── World map background ───────────────────────────────────────────────
    // this.load.image('map_bg', 'assets/shared/ui/world_map.png');
  }

  create() {
    this.scene.start('IntroScene');
  }
}
