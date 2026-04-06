// InputManager.js — unified keyboard + touch input
// Levels call semantic methods (isJumpPressed, isLeftHeld, etc.)
// and never touch Phaser.Input directly.

export class InputManager {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this._scene = scene;
    this._keys = scene.input.keyboard.addKeys({
      left:   Phaser.Input.Keyboard.KeyCodes.LEFT,
      right:  Phaser.Input.Keyboard.KeyCodes.RIGHT,
      up:     Phaser.Input.Keyboard.KeyCodes.UP,
      space:  Phaser.Input.Keyboard.KeyCodes.SPACE,
      a:      Phaser.Input.Keyboard.KeyCodes.A,
      d:      Phaser.Input.Keyboard.KeyCodes.D,
      w:      Phaser.Input.Keyboard.KeyCodes.W,
      e:      Phaser.Input.Keyboard.KeyCodes.E,
      enter:  Phaser.Input.Keyboard.KeyCodes.ENTER,
    });

    // Virtual button state (set by VirtualControls)
    this._virtual = {
      left:   false,
      right:  false,
      jump:   false,
      action: false,
    };

    // Track virtual jump edge (touch button)
    this._prevVirtualJump = false;
  }

  /** Called every frame from the scene's update() */
  update() {
    // nothing needed — JustDown is managed by Phaser per-frame
  }

  // ─── Semantic queries ────────────────────────────────────────────────────

  isLeftHeld() {
    return this._keys.left.isDown || this._keys.a.isDown || this._virtual.left;
  }

  isRightHeld() {
    return this._keys.right.isDown || this._keys.d.isDown || this._virtual.right;
  }

  /**
   * True only on the single frame the jump button is first pressed.
   * Uses Phaser.Input.Keyboard.JustDown which is reset each frame by Phaser.
   */
  isJumpPressed() {
    const keyJump = (
      Phaser.Input.Keyboard.JustDown(this._keys.space) ||
      Phaser.Input.Keyboard.JustDown(this._keys.up) ||
      Phaser.Input.Keyboard.JustDown(this._keys.w)
    );
    const virtualJump = this._virtual.jump && !this._prevVirtualJump;
    this._prevVirtualJump = this._virtual.jump;
    return keyJump || virtualJump;
  }

  isActionPressed() {
    return (
      Phaser.Input.Keyboard.JustDown(this._keys.e) ||
      Phaser.Input.Keyboard.JustDown(this._keys.enter) ||
      this._virtual.action
    );
  }

  // ─── Virtual button setters (called by VirtualControls) ─────────────────

  setVirtual(button, isDown) {
    if (button in this._virtual) {
      this._virtual[button] = isDown;
    }
  }

  // ─── Private ─────────────────────────────────────────────────────────────

  _isJumpRaw() {
    return (
      this._keys.space.isDown ||
      this._keys.up.isDown ||
      this._keys.w.isDown ||
      this._virtual.jump
    );
  }

  destroy() {
    // Keys are automatically cleaned up with the scene
  }
}
