// Player.js — Madame Tetyana's shared physics character
// Used by every level scene. Handles movement, jumping, animation states,
// and cosmetic overlays from the shop.

import { InputManager } from '../input/InputManager.js';

// Physics constants — tweak here to affect all levels at once
const SPEED       = 220;   // px/s horizontal
const JUMP_VEL    = -520;  // px/s (negative = up in Phaser)
const GRAVITY     = 800;   // set in level scene's physics config

export class Player {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x  - Starting X position
   * @param {number} y  - Starting Y position
   * @param {import('../../state/store').Store} store
   * @param {InputManager} inputManager
   */
  constructor(scene, x, y, store, inputManager) {
    this._scene = scene;
    this._store = store;
    this._input = inputManager;

    // Create the sprite. Levels must preload 'player' spritesheet.
    // Fallback to a colored rectangle if the spritesheet isn't loaded yet.
    if (scene.textures.exists('player')) {
      this.sprite = scene.physics.add.sprite(x, y, 'player');
    } else {
      // Placeholder: magenta rectangle
      const gfx = scene.add.graphics();
      gfx.fillStyle(0xff44cc, 1);
      gfx.fillRect(0, 0, 48, 64);
      gfx.generateTexture('player_placeholder', 48, 64);
      gfx.destroy();
      this.sprite = scene.physics.add.sprite(x, y, 'player_placeholder');
    }

    this.sprite.setCollideWorldBounds(true);
    this.sprite.body.setGravityY(GRAVITY);

    // State
    this._lives       = this._calcStartingLives();
    this._shieldUsed  = false;
    this._canDoubleJump = store.hasItem('double_jump');
    this._hasJumpedOnce = false;
    this._dead        = false;

    // For magnet: collect nearby coins automatically
    this._hasMagnet = store.hasItem('magnet');
    this.MAGNET_RADIUS = 120; // px

    this._setupAnimations(scene);
    this._applyCosmetics(store);
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  get lives() { return this._lives; }
  get isDead() { return this._dead; }
  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }
  get hasMagnet() { return this._hasMagnet; }

  /**
   * Call every frame from the level scene's update().
   * Returns true if the player is alive this frame.
   */
  update() {
    if (this._dead) return false;

    const onGround = this.sprite.body.blocked.down;
    if (onGround) this._hasJumpedOnce = false;

    // Horizontal movement
    if (this._input.isLeftHeld()) {
      this.sprite.setVelocityX(-SPEED);
      this.sprite.setFlipX(true);
      this._playAnim(onGround ? 'run' : 'jump');
    } else if (this._input.isRightHeld()) {
      this.sprite.setVelocityX(SPEED);
      this.sprite.setFlipX(false);
      this._playAnim(onGround ? 'run' : 'jump');
    } else {
      this.sprite.setVelocityX(0);
      this._playAnim(onGround ? 'idle' : 'jump');
    }

    // Jump
    if (this._input.isJumpPressed()) {
      if (onGround) {
        this.sprite.setVelocityY(JUMP_VEL);
        this._hasJumpedOnce = true;
        this._playSound('snd_jump', 0.6);
      } else if (this._canDoubleJump && this._hasJumpedOnce) {
        this.sprite.setVelocityY(JUMP_VEL * 0.85);
        this._hasJumpedOnce = false;
        this._playSound('snd_jump', 0.5);
      }
    }

    return true;
  }

  /**
   * Called when the player touches an enemy or hazard.
   * Returns true if the player died (no lives left).
   */
  takeDamage() {
    if (this._dead) return false;

    // Shield absorbs one hit
    if (this._store.hasItem('shield') && !this._shieldUsed) {
      this._shieldUsed = true;
      this._flashSprite(0x00aaff);
      this._playSound('snd_hurt', 0.4);
      return false;
    }

    this._lives--;
    this._flashSprite(0xff0000);
    this._playSound('snd_hurt', 0.7);

    if (this._lives <= 0) {
      this._dead = true;
      this._playAnim('idle'); // or a death anim if provided
      this.sprite.setVelocityX(0);
      this.sprite.setVelocityY(-200);
      this.sprite.setTint(0xff0000);
      return true;
    }
    return false;
  }

  destroy() {
    this.sprite.destroy();
  }

  // ─── Private ─────────────────────────────────────────────────────────────

  _calcStartingLives() {
    return this._store.hasItem('extra_life') ? 4 : 3;
  }

  _setupAnimations(scene) {
    // Animations are only created if the 'player' spritesheet was loaded.
    // Each level that uses the shared spritesheet gets these for free.
    // If a level provides its own player texture, it can add its own anims.
    if (!scene.textures.exists('player')) return;

    const exists = key => scene.anims.exists(key);

    if (!exists('player_idle')) {
      scene.anims.create({
        key: 'player_idle',
        frames: scene.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
        frameRate: 6,
        repeat: -1,
      });
    }
    if (!exists('player_run')) {
      scene.anims.create({
        key: 'player_run',
        frames: scene.anims.generateFrameNumbers('player', { start: 4, end: 11 }),
        frameRate: 12,
        repeat: -1,
      });
    }
    if (!exists('player_jump')) {
      scene.anims.create({
        key: 'player_jump',
        frames: scene.anims.generateFrameNumbers('player', { start: 12, end: 14 }),
        frameRate: 8,
        repeat: 0,
      });
    }
  }

  _playAnim(state) {
    const key = `player_${state}`;
    if (this._scene.anims.exists(key) && this.sprite.anims.currentAnim?.key !== key) {
      this.sprite.play(key);
    }
  }

  _applyCosmetics(store) {
    // Cosmetic overlays are optional — add logic here as assets become available.
    // For now this is a hook for future implementation.
    const state = store.getState();
    if (state.equippedHat) {
      // TODO: add hat sprite overlay when hat assets exist
    }
    if (state.equippedCompanion) {
      // TODO: add companion sprite when assets exist
    }
  }

  /** Safe sound play — silently skips if the audio key isn't loaded yet */
  _playSound(key, volume) {
    if (this._scene.cache.audio.exists(key)) {
      this._scene.sound.play(key, { volume });
    }
  }

  _flashSprite(color) {
    this.sprite.setTint(color);
    this._scene.time.delayedCall(300, () => {
      if (this.sprite?.active) this.sprite.clearTint();
    });
  }
}
