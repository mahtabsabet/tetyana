// level04-chateau/index.js — Le Château Hanté
import { ChateauScene } from './LevelScene.js';

export default {
  meta: {
    id: 'level04-chateau',
    titleFR: 'Lieu 4',
    descriptionFR: 'Continue l\'aventure !',
    thumbnailKey: 'chateau_thumb',
    order: 4,
    unlockAfterLevel: null,
  },
  createScene(context) {
    ChateauScene._context = context;
    return ChateauScene;
  },
  shopItemKeys: ['double_jump', 'shield', 'extra_life', 'magnet'],
};
