// VirtualControls.js — wires the HTML touch buttons to the InputManager

/**
 * Shows virtual controls on touch devices and hooks them to the InputManager.
 * Buttons are in index.html as fixed HTML elements (not Phaser objects) so
 * they don't need coordinate transforms when the canvas scales.
 *
 * @param {import('./InputManager').InputManager} inputManager
 */
export function initVirtualControls(inputManager) {
  // Only show on touch-capable devices
  if (!navigator.maxTouchPoints || navigator.maxTouchPoints === 0) return;

  const container = document.getElementById('virtual-controls');
  if (!container) return;
  container.classList.add('active');

  const buttons = {
    'vctrl-left':   'left',
    'vctrl-right':  'right',
    'vctrl-jump':   'jump',
    'vctrl-action': 'action',
  };

  Object.entries(buttons).forEach(([elId, name]) => {
    const el = document.getElementById(elId);
    if (!el) return;

    el.addEventListener('touchstart', (e) => {
      e.preventDefault();
      inputManager.setVirtual(name, true);
    }, { passive: false });

    el.addEventListener('touchend', (e) => {
      e.preventDefault();
      inputManager.setVirtual(name, false);
    }, { passive: false });

    el.addEventListener('touchcancel', () => {
      inputManager.setVirtual(name, false);
    });
  });
}

/** Hide virtual controls (call when leaving a level scene) */
export function hideVirtualControls() {
  const container = document.getElementById('virtual-controls');
  if (container) container.classList.remove('active');
}

/** Show virtual controls (call when entering a level scene on touch device) */
export function showVirtualControls() {
  if (!navigator.maxTouchPoints || navigator.maxTouchPoints === 0) return;
  const container = document.getElementById('virtual-controls');
  if (container) container.classList.add('active');
}
