// shopData.js — all shop items
// Levels read functional upgrades via store.hasItem(id)

/**
 * @typedef {Object} ShopItem
 * @property {string} id          - Unique key, used in store.hasItem()
 * @property {string} nameFR      - French display name
 * @property {string} descFR      - French description (2nd-grade level)
 * @property {number} cost        - Points required
 * @property {'cosmetic'|'upgrade'|'decoration'} category
 * @property {string} [slot]      - For cosmetics: 'hat' | 'outfit' | 'companion'
 * @property {string} icon        - Emoji shown in shop
 */

/** @type {ShopItem[]} */
export const SHOP_ITEMS = [
  // ── Chapeaux (Hats) ────────────────────────────────────────────────────
  {
    id: 'hat_explorateur',
    nameFR: "Le chapeau d'explorateur",
    descFR: 'Un beau chapeau pour une grande exploratrice !',
    cost: 100,
    category: 'cosmetic',
    slot: 'hat',
    icon: '🪖',
  },
  {
    id: 'hat_sorciere',
    nameFR: 'Le chapeau de sorcière',
    descFR: 'Un chapeau magique avec des étoiles !',
    cost: 150,
    category: 'cosmetic',
    slot: 'hat',
    icon: '🧙',
  },
  {
    id: 'hat_astronaute',
    nameFR: "Le casque d'astronaute",
    descFR: 'Pour explorer les étoiles !',
    cost: 200,
    category: 'cosmetic',
    slot: 'hat',
    icon: '👩‍🚀',
  },
  {
    id: 'hat_couronne',
    nameFR: 'La couronne de princesse',
    descFR: 'Madame Tetyana est une reine !',
    cost: 200,
    category: 'cosmetic',
    slot: 'hat',
    icon: '👑',
  },

  // ── Tenues (Outfits) ───────────────────────────────────────────────────
  {
    id: 'outfit_superheros',
    nameFR: 'La cape de superhéros',
    descFR: 'Vole comme un superhéros !',
    cost: 200,
    category: 'cosmetic',
    slot: 'outfit',
    icon: '🦸',
  },
  {
    id: 'outfit_spatiale',
    nameFR: 'La combinaison spatiale',
    descFR: 'Parfaite pour voyager dans l\'espace !',
    cost: 250,
    category: 'cosmetic',
    slot: 'outfit',
    icon: '🚀',
  },

  // ── Compagnons (Companions) ────────────────────────────────────────────
  {
    id: 'companion_singe',
    nameFR: 'Le singe ami',
    descFR: 'Un petit singe qui te suit partout !',
    cost: 200,
    category: 'cosmetic',
    slot: 'companion',
    icon: '🐒',
  },
  {
    id: 'companion_dragon',
    nameFR: 'Le petit dragon',
    descFR: 'Le dragon du volcan est maintenant ton ami !',
    cost: 350,
    category: 'cosmetic',
    slot: 'companion',
    icon: '🐉',
  },

  // ── Améliorations (Functional Upgrades) ───────────────────────────────
  {
    id: 'double_jump',
    nameFR: 'Le bond magique',
    descFR: 'Saute deux fois dans les airs !',
    cost: 250,
    category: 'upgrade',
    icon: '✨',
  },
  {
    id: 'shield',
    nameFR: 'Le bouclier',
    descFR: 'Protège Madame Tetyana une fois par niveau !',
    cost: 300,
    category: 'upgrade',
    icon: '🛡️',
  },
  {
    id: 'extra_life',
    nameFR: 'La vie supplémentaire',
    descFR: 'Commence chaque niveau avec une vie en plus !',
    cost: 200,
    category: 'upgrade',
    icon: '❤️',
  },
  {
    id: 'magnet',
    nameFR: "L'aimant à points",
    descFR: 'Les pièces viennent vers toi toutes seules !',
    cost: 350,
    category: 'upgrade',
    icon: '🧲',
  },

  // ── Décorations de la carte (Map Decorations) ─────────────────────────
  {
    id: 'map_flowers',
    nameFR: 'Les fleurs magiques',
    descFR: 'Des fleurs poussent sur ta carte !',
    cost: 75,
    category: 'decoration',
    icon: '🌸',
  },
  {
    id: 'map_rainbow',
    nameFR: "L'arc-en-ciel",
    descFR: 'Un arc-en-ciel entre tes niveaux !',
    cost: 100,
    category: 'decoration',
    icon: '🌈',
  },
  {
    id: 'map_animals',
    nameFR: 'Les animaux de la carte',
    descFR: 'Des petits animaux se promènent sur ta carte !',
    cost: 150,
    category: 'decoration',
    icon: '🦋',
  },
];

/** Returns item by id */
export function getItem(id) {
  return SHOP_ITEMS.find(item => item.id === id) || null;
}

/** Groups items by category */
export function getItemsByCategory() {
  const groups = { cosmetic: [], upgrade: [], decoration: [] };
  SHOP_ITEMS.forEach(item => groups[item.category].push(item));
  return groups;
}
