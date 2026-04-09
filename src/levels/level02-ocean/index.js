// level02-ocean/index.js — L'Océan Mystérieux
import { OceanScene } from './LevelScene.js';

export default {
  meta: {
    id: 'level02-ocean',
    titleFR: 'Lieu 2',
    descriptionFR: 'Continue l\'aventure !',
    thumbnailKey: 'ocean_thumb',
    order: 2,
    unlockAfterLevel: null,
  },
  createScene(context) {
    OceanScene._context = context;
    return OceanScene;
  },
  shopItemKeys: ['double_jump', 'shield', 'extra_life', 'magnet'],
};
