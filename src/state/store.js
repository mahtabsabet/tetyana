// store.js — single source of truth for all game state
// Persists to localStorage on every write. No framework needed.

const SAVE_KEY = 'tetyana_save';
const CURRENT_VERSION = 1;

function defaultState() {
  return {
    version: CURRENT_VERSION,
    introSeen: false,

    // Level progress: { 'level01-foret': { starsEarned, pointsEarned, completed, durationSeconds } }
    levelsCompleted: {},

    // Economy
    totalPoints: 0,       // All-time earned (never decreases)
    spendablePoints: 0,   // Current balance (decreases on purchase)

    // Shop
    unlockedItems: [],    // Array of item id strings

    // Equipped cosmetics
    equippedHat: null,
    equippedOutfit: null,
    equippedCompanion: null,

    // Settings
    sfxVolume: 0.8,
    musicVolume: 0.5,
  };
}

function migrate(raw) {
  // Future schema migrations go here.
  // For now, if version doesn't match just reset.
  if (!raw || raw.version !== CURRENT_VERSION) {
    console.warn('[Store] Save data version mismatch — resetting.');
    return defaultState();
  }
  return raw;
}

export class Store {
  constructor() {
    const saved = localStorage.getItem(SAVE_KEY);
    this._state = saved ? migrate(JSON.parse(saved)) : defaultState();
    this._listeners = {}; // { eventName: [callback, ...] }
  }

  // ─── Read ────────────────────────────────────────────────────────────────

  getState() {
    // Return a shallow copy so callers can't mutate state directly
    return Object.freeze({ ...this._state });
  }

  hasItem(id) {
    return this._state.unlockedItems.includes(id);
  }

  isLevelUnlocked(levelId, allLevelMeta) {
    const meta = allLevelMeta.find(m => m.id === levelId);
    if (!meta) return false;
    if (!meta.unlockAfterLevel) return true;
    return !!this._state.levelsCompleted[meta.unlockAfterLevel]?.completed;
  }

  // ─── Write ───────────────────────────────────────────────────────────────

  addPoints(amount) {
    this._state.totalPoints += amount;
    this._state.spendablePoints += amount;
    this._save();
    this._emit('points_changed', { spendable: this._state.spendablePoints, total: this._state.totalPoints });
  }

  /** Returns false if the player can't afford it. */
  spendPoints(amount) {
    if (this._state.spendablePoints < amount) return false;
    this._state.spendablePoints -= amount;
    this._save();
    this._emit('points_changed', { spendable: this._state.spendablePoints, total: this._state.totalPoints });
    return true;
  }

  /** Returns false if already owned or can't afford. */
  purchaseItem(itemId, cost) {
    if (this.hasItem(itemId)) return false;
    if (!this.spendPoints(cost)) return false;
    this._state.unlockedItems.push(itemId);
    this._save();
    this._emit('item_purchased', { itemId });
    return true;
  }

  /** slot: 'hat' | 'outfit' | 'companion' */
  equipItem(slot, itemId) {
    const key = `equipped${slot.charAt(0).toUpperCase() + slot.slice(1)}`;
    if (!(key in this._state)) return;
    this._state[key] = itemId;
    this._save();
    this._emit('item_equipped', { slot, itemId });
  }

  /**
   * result: { levelId, completed, pointsEarned, starsEarned, durationSeconds }
   * Awards points and records progress. If replaying, only updates if improving stars.
   */
  completeLevel(result) {
    const prev = this._state.levelsCompleted[result.levelId];
    const isFirst = !prev || !prev.completed;
    const isImprovement = prev && result.starsEarned > (prev.starsEarned || 0);

    // Award base points
    let awarded = result.pointsEarned;

    // First-completion bonus
    if (isFirst && result.completed) awarded += 100;

    // Star bonuses
    if (result.starsEarned >= 2) awarded += 25;
    if (result.starsEarned >= 3) awarded += 50;

    this.addPoints(awarded);

    // Record best stars
    if (isFirst || isImprovement || !prev.completed) {
      this._state.levelsCompleted[result.levelId] = {
        ...result,
        bestStars: Math.max(result.starsEarned, prev?.bestStars || 0),
      };
    }

    this._save();
    this._emit('level_completed', { result, pointsAwarded: awarded });
  }

  markIntroSeen() {
    this._state.introSeen = true;
    this._save();
  }

  setSfxVolume(v) {
    this._state.sfxVolume = Math.max(0, Math.min(1, v));
    this._save();
  }

  setMusicVolume(v) {
    this._state.musicVolume = Math.max(0, Math.min(1, v));
    this._save();
  }

  resetProgress() {
    this._state = defaultState();
    this._save();
    this._emit('reset', {});
  }

  // ─── Events ──────────────────────────────────────────────────────────────

  on(event, cb) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(cb);
  }

  off(event, cb) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(fn => fn !== cb);
  }

  // ─── Private ─────────────────────────────────────────────────────────────

  _save() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(this._state));
  }

  _emit(event, data) {
    (this._listeners[event] || []).forEach(fn => fn(data));
  }
}
