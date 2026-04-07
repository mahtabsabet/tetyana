// main.js — entry point
// Boots Phaser, creates the Store, registers all scenes.
//
// ─── Adding a new level ────────────────────────────────────────────────────
// 1. Copy src/levels/_template/ → src/levels/levelXX-yourtheme/
// 2. Edit index.js and LevelScene.js in your new folder (see TODO comments)
// 3. Import your level below and add it to the LEVELS array — that's it!

import Phaser from 'phaser';
import { Store }    from './state/store.js';
import { registry } from './gameRegistry.js';

// Core scenes
import { BootScene }     from './core/scenes/BootScene.js';
import { IntroScene }    from './core/scenes/IntroScene.js';
import { WorldMapScene } from './core/scenes/WorldMapScene.js';
import { ShopScene }     from './core/scenes/ShopScene.js';
import { HUDScene }      from './core/scenes/HUDScene.js';

// ─── Level imports ──────────────────────────────────────────────────────────
// Add one import per level here. The order doesn't matter.

// import templateLevel from './levels/_template/index.js';

import level01 from './levels/level01-foret/index.js';
import level02 from './levels/level02-ocean/index.js';
import level03 from './levels/level03-espace/index.js';
import level04 from './levels/level04-chateau/index.js';
import level05 from './levels/level05-volcan/index.js';
import level06 from './levels/level06-arctique/index.js';

// ─── Level registry ─────────────────────────────────────────────────────────
// List levels in world map display order.
const LEVELS = [
  level01,
  level02,
  level03,
  level04,
  level05,
  level06,
];

// ─── Bootstrap ──────────────────────────────────────────────────────────────

// Write to shared registry — scenes import this module to access store + levels
registry.store  = new Store();
registry.levels = LEVELS;

// Collect Phaser Scene classes from all level modules
const levelSceneClasses = LEVELS.map(lvl => {
  // createScene requires a context; we pass a placeholder here just to get the class.
  // The real context is set by WorldMapScene when launching a level.
  return lvl.createScene({
    store: registry.store,
    onComplete: () => {},
    playSharedSound: () => {},
  });
});

// ─── Phaser config ──────────────────────────────────────────────────────────

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 960,
  height: 540,
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 }, // Each level body sets its own gravity
      debug: false,       // Set to true during development to see hitboxes
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [
    BootScene,
    IntroScene,
    WorldMapScene,
    ShopScene,
    HUDScene,
    ...levelSceneClasses,
  ],
};

new Phaser.Game(config);
