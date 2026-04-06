// gameRegistry.js — shared references accessible by all scenes
// Avoids circular imports and messy scene data passing.
//
// main.js writes to this once at startup.
// Scenes read from it at any time.

export const registry = {
  /** @type {import('./state/store').Store} */
  store: null,

  /** @type {Array} — array of LevelModule objects */
  levels: [],
};
