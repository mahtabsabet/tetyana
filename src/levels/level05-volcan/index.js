// level05-volcan/index.js — Le Volcan du Dragon
import { VolcanScene } from './LevelScene.js';

export default {
  meta: {
    id: 'level05-volcan',
    titleFR: 'Lieu 5',
    descriptionFR: 'Continue l\'aventure !',
    thumbnailKey: 'volcan_thumb',
    order: 5,
    unlockAfterLevel: null,
  },
  createScene(context) {
    VolcanScene._context = context;
    return VolcanScene;
  },
  shopItemKeys: ['double_jump', 'shield', 'extra_life', 'magnet'],
};
