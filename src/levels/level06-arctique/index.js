// level06-arctique/index.js — La Toundra Arctique
import { ArctiqueScene } from './LevelScene.js';

export default {
  meta: {
    id: 'level06-arctique',
    titleFR: 'Lieu 6',
    descriptionFR: 'Continue l\'aventure !',
    thumbnailKey: 'arctique_thumb',
    order: 6,
    unlockAfterLevel: null,
  },
  createScene(context) {
    ArctiqueScene._context = context;
    return ArctiqueScene;
  },
  shopItemKeys: ['double_jump', 'shield', 'extra_life', 'magnet'],
};
