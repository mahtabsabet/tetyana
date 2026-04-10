// level01-foret/index.js — La Forêt Enchantée
// TODO: Replace LevelScene import with your actual scene file

import { ForetScene } from './LevelScene.js';

export default {
  meta: {
    id: 'level01-foret',
    titleFR: 'La Forêt Enchantée',
    descriptionFR: 'Commence l\'aventure !',
    thumbnailKey: 'foret_thumb',
    order: 1,
    unlockAfterLevel: null,
  },
  createScene(context) {
    ForetScene._context = context;
    return ForetScene;
  },
  shopItemKeys: ['double_jump', 'shield', 'extra_life', 'magnet'],
};
