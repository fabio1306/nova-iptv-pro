// ==========================================================================
// STORAGE SERVICE - LOCAL PERSISTENCE FOR ACCOUNTS, FAVORITES & SETTINGS
// ==========================================================================

const STORAGE_KEYS = {
  ACCOUNTS: 'nova_iptv_accounts',
  ACTIVE_ACCOUNT_ID: 'nova_iptv_active_acc_id',
  FAVORITES: 'nova_iptv_favorites',
  WATCH_HISTORY: 'nova_iptv_history',
  SETTINGS: 'nova_iptv_settings',
  PLAYBACK_POSITIONS: 'nova_iptv_playback_pos'
};

const DEFAULT_SETTINGS = {
  theme: 'sapphire', // sapphire | emerald | crimson | purple | amoled
  uiScale: '1',
  clockFormat: '24h',
  streamFormat: 'auto', // auto | hls | ts
  bufferLevel: 'medium', // low | medium | high
  autoResume: true,
  aspectRatio: 'contain', // contain | cover | fill
  language: 'pt-BR',
  corsProxy: 'direct', // direct | corsproxy | allorigins
  customCorsProxyUrl: '',
  showVirtualRemote: false // false on Smart TV, can be enabled on PC
};

class StorageService {
  constructor() {
    this.memoryCache = new Map();
  }

  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (err) {
      console.warn(`[StorageService] Failed to read ${key}:`, err);
      return defaultValue;
    }
  }

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error(`[StorageService] Failed to save ${key}:`, err);
      return false;
    }
  }

  // --- ACCOUNTS MANAGEMENT ---
  getAccounts() {
    return this.get(STORAGE_KEYS.ACCOUNTS, []);
  }

  saveAccount(account) {
    const accounts = this.getAccounts();
    const index = accounts.findIndex(a => a.id === account.id);
    if (index >= 0) {
      accounts[index] = { ...accounts[index], ...account, updatedAt: Date.now() };
    } else {
      accounts.push({
        ...account,
        id: account.id || 'acc_' + Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }
    this.set(STORAGE_KEYS.ACCOUNTS, accounts);
    return account;
  }

  deleteAccount(accountId) {
    let accounts = this.getAccounts();
    accounts = accounts.filter(a => a.id !== accountId);
    this.set(STORAGE_KEYS.ACCOUNTS, accounts);

    if (this.getActiveAccountId() === accountId) {
      const nextAcc = accounts.length > 0 ? accounts[0].id : null;
      this.setActiveAccountId(nextAcc);
    }
    return true;
  }

  getActiveAccountId() {
    return this.get(STORAGE_KEYS.ACTIVE_ACCOUNT_ID, null);
  }

  setActiveAccountId(id) {
    return this.set(STORAGE_KEYS.ACTIVE_ACCOUNT_ID, id);
  }

  getActiveAccount() {
    const id = this.getActiveAccountId();
    if (!id) return null;
    const accounts = this.getAccounts();
    return accounts.find(a => a.id === id) || null;
  }

  // --- FAVORITES ---
  getFavorites(type = 'live') {
    const all = this.get(STORAGE_KEYS.FAVORITES, { live: [], movies: [], series: [] });
    return all[type] || [];
  }

  isFavorite(type, id) {
    const list = this.getFavorites(type);
    return list.some(item => (typeof item === 'object' ? item.id === id : item === id));
  }

  toggleFavorite(type, item) {
    const all = this.get(STORAGE_KEYS.FAVORITES, { live: [], movies: [], series: [] });
    if (!all[type]) all[type] = [];

    const itemId = typeof item === 'object' ? item.id : item;
    const index = all[type].findIndex(it => (typeof it === 'object' ? it.id === itemId : it === itemId));

    let isAdded = false;
    if (index >= 0) {
      all[type].splice(index, 1);
    } else {
      all[type].push(item);
      isAdded = true;
    }

    this.set(STORAGE_KEYS.FAVORITES, all);
    return isAdded;
  }

  // --- WATCH HISTORY ---
  getHistory() {
    return this.get(STORAGE_KEYS.WATCH_HISTORY, []);
  }

  addToHistory(item) {
    const history = this.getHistory();
    // Remove if already exists to bump to front
    const filtered = history.filter(h => h.id !== item.id);
    filtered.unshift({
      ...item,
      watchedAt: Date.now()
    });
    // Keep max 50 items
    const limited = filtered.slice(0, 50);
    this.set(STORAGE_KEYS.WATCH_HISTORY, limited);
  }

  clearHistory() {
    return this.set(STORAGE_KEYS.WATCH_HISTORY, []);
  }

  // --- PLAYBACK POSITIONS (RESUME) ---
  savePlaybackPosition(contentId, seconds) {
    const positions = this.get(STORAGE_KEYS.PLAYBACK_POSITIONS, {});
    positions[contentId] = {
      seconds,
      timestamp: Date.now()
    };
    this.set(STORAGE_KEYS.PLAYBACK_POSITIONS, positions);
  }

  getPlaybackPosition(contentId) {
    const positions = this.get(STORAGE_KEYS.PLAYBACK_POSITIONS, {});
    return positions[contentId]?.seconds || 0;
  }

  // --- SETTINGS ---
  getSettings() {
    const userSettings = this.get(STORAGE_KEYS.SETTINGS, {});
    return { ...DEFAULT_SETTINGS, ...userSettings };
  }

  saveSettings(newSettings) {
    const current = this.getSettings();
    const updated = { ...current, ...newSettings };
    this.set(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  }

  clearAllData() {
    localStorage.clear();
  }
}

export const storage = new StorageService();
