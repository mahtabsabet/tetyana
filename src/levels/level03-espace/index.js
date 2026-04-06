// level03-espace/index.js — L'Aventure dans l'Espace
import { EspaceScene } from './LevelScene.js';

export default {
  meta: {
    id: 'level03-espace',
    titleFR: 'L'Aventure dans l'Espace',
    descriptionFR: 'Explore les étoiles avec Madame Tetyana !',
    thumbnailKey: 'espace_thumb',
    order: 3,
    unlockAfterLevel: null,
  },
  createScene(context) {
    EspaceScene._context = context;
    return EspaceScene;
  },
  shopItemKeys: ['double_jump', 'shield', 'extra_life', 'magnet'],
};
