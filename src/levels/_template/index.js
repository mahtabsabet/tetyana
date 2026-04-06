// _template/index.js — Level contract export
// COPY this entire folder and rename it for your level.
// Only edit things marked with TODO.

import { TemplateScene } from './LevelScene.js';

/** @type {import('../../types/levelContract').LevelModule} */
export default {
  meta: {
    // TODO: Change this to your level's unique id (e.g. 'level01-foret')
    id: '_template',

    // TODO: French title of your level
    titleFR: 'Niveau Modèle',

    // TODO: One-sentence French description (simple words for 7-year-olds)
    descriptionFR: 'Un niveau pour apprendre comment faire un niveau !',

    // TODO: Change to your level's thumbnail key (loaded in LevelScene.preload)
    thumbnailKey: 'template_thumb',

    // TODO: Set the display order on the world map (1–6)
    order: 0,

    // TODO: Set to null if always unlocked, or to another level's id
    // e.g. unlockAfterLevel: 'level01-foret'
    unlockAfterLevel: null,
  },

  createScene(context) {
    // Store context on the class so LevelScene.init() can access it
    TemplateScene._context = context;
    return TemplateScene;
  },

  // TODO: List any shop upgrade keys your level responds to
  shopItemKeys: ['double_jump', 'shield', 'extra_life', 'magnet'],
};
