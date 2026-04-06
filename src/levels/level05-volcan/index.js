// level05-volcan/index.js — Le Volcan du Dragon
import { VolcanScene } from './LevelScene.js';

export default {
  meta: {
    id: 'level05-volcan',
    titleFR: 'Le Volcan du Dragon',
    descriptionFR: 'Grimpe le volcan et trouve le dragon !',
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
