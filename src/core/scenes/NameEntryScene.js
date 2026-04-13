// NameEntryScene.js — asks the student to type their name before playing
// Uses Phaser keyboard input (no DOM elements needed).
// Shown once at the start; skipped if a name is already saved.

import { registry } from '../../gameRegistry.js';

export class NameEntryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'NameEntryScene' });
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this._name = '';

    // Background
    this.add.rectangle(W / 2, H / 2, W, H, 0x1a1a2e);
    this.add.text(W / 2, H / 2 - 200, '🧑‍🏫', { fontSize: '72px' }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 - 110, 'Quel est ton prénom ?', {
      fontFamily: 'Arial',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#ffdd44',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 - 68, 'Tape ton prénom et appuie sur Entrée', {
      fontFamily: 'Arial',
      fontSize: '15px',
      color: '#aaaacc',
    }).setOrigin(0.5);

    // Input box background
    this.add.rectangle(W / 2, H / 2, 360, 58, 0x0d1b3e)
      .setStrokeStyle(3, 0x3366cc);

    // Name display text (updated as keys are pressed)
    this._nameText = this.add.text(W / 2, H / 2, '', {
      fontFamily: 'Arial',
      fontSize: '26px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Blinking cursor
    this._cursor = this.add.text(W / 2 + 2, H / 2, '|', {
      fontFamily: 'Arial',
      fontSize: '26px',
      color: '#aaaaff',
    }).setOrigin(0, 0.5);
    this.tweens.add({ targets: this._cursor, alpha: 0, duration: 530, yoyo: true, repeat: -1 });

    // "Commencer" button (also activated by Enter)
    const btn = this.add.text(W / 2, H / 2 + 80, '▶ Commencer', {
      fontFamily: 'Arial',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ffffff',
      backgroundColor: '#22224488',
      padding: { x: 24, y: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#3344aa88' }));
    btn.on('pointerout',  () => btn.setStyle({ backgroundColor: '#22224488' }));
    btn.on('pointerdown', () => this._submit());

    // Keyboard input
    this.input.keyboard.on('keydown', (event) => {
      if (event.key === 'Enter') {
        this._submit();
      } else if (event.key === 'Backspace') {
        this._name = this._name.slice(0, -1);
        this._updateDisplay();
      } else if (event.key.length === 1 && this._name.length < 20) {
        this._name += event.key;
        this._updateDisplay();
      }
    });

    this.cameras.main.fadeIn(400);
  }

  _updateDisplay() {
    this._nameText.setText(this._name);
    // Shift cursor to end of text
    const textWidth = this._nameText.width;
    this._cursor.setX(this.scale.width / 2 + textWidth / 2 + 4);
  }

  _submit() {
    const trimmed = this._name.trim();
    if (!trimmed) return; // don't allow empty name

    registry.store.setStudentName(trimmed);

    this.cameras.main.fadeOut(300, 0, 0, 0, (_cam, progress) => {
      if (progress === 1) {
        const nextScene = registry.store.getState().introSeen
          ? 'WorldMapScene'
          : 'IntroScene';
        this.scene.start(nextScene);
      }
    });
  }
}
