// ==========================================================================
// MAIN APPLICATION ENTRY POINT & ROUTER - NOVA IPTV PRO (SMART TV PLAYER)
// ==========================================================================

import { storage } from './services/storage.service.js';
import { tvNav } from './services/tv-navigation.service.js';
import { DEMO_ACCOUNT, LIVE_CATEGORIES, LIVE_CHANNELS, VOD_CATEGORIES, VOD_MOVIES, SERIES_CATEGORIES, SERIES_CATALOG } from './services/mock-data.service.js';
import { xtreamService } from './services/xtream.service.js';
import { m3uService } from './services/m3u.service.js';
import { toast } from './components/toast.js';
import { loadingOverlay } from './components/loading-overlay.js';

import { NavbarComponent } from './components/navbar.js';
import { PlayerComponent } from './components/player.js';
import { AccountModalComponent } from './components/account-modal.js';
import { VirtualRemoteComponent } from './components/virtual-remote.js';

import { DashboardView } from './views/dashboard.view.js';
import { LiveView } from './views/live.view.js';
import { MoviesView } from './views/movies.view.js';
import { SeriesView } from './views/series.view.js';
import { SearchView } from './views/search.view.js';
import { FavoritesView } from './views/favorites.view.js';
import { HistoryView } from './views/history.view.js';
import { SettingsView } from './views/settings.view.js';

class App {
  constructor() {
    this.currentViewId = 'dashboard';
    this.views = {};
    this.navbar = null;
    this.player = null;
    this.accountModal = null;
    this.virtualRemote = null;

    // Loaded Content Catalog
    this.liveCategories = [];
    this.liveChannels = [];
    this.vodCategories = [];
    this.vodMovies = [];
    this.seriesCategories = [];
    this.seriesList = [];
  }

  async init() {
    console.log('[Nova IPTV Pro] Initializing Smart TV Application...');

    // 1. Check existing accounts (starts completely zeroed/clean)
    const accounts = storage.getAccounts();
    const hasAccounts = accounts.length > 0;

    // 2. Apply theme & UI scale from settings
    const settings = storage.getSettings();
    document.body.setAttribute('data-theme', settings.theme || 'sapphire');
    document.documentElement.style.setProperty('--ui-scale', settings.uiScale || '1');

    const appRoot = document.getElementById('app');

    // 3. Render Top Navigation Bar
    this.navbar = new NavbarComponent({
      onNavigate: (viewId) => this.navigateTo(viewId),
      onOpenAccounts: () => this.accountModal.openManager(),
      onOpenAccountDetails: () => this.accountModal.openAccountDetails(),
      onSyncAccount: () => this.syncCurrentAccount()
    });
    this.navbar.render(appRoot);

    // 4. Main Viewport Container
    const mainContainer = document.createElement('main');
    mainContainer.className = 'tv-main-container';
    appRoot.appendChild(mainContainer);

    // 5. Initialize Modals and Components
    this.accountModal = new AccountModalComponent({
      onAccountChanged: () => {
        this.navbar.updateAccountStatus();
        this.loadActiveAccountData();
      }
    });

    this.player = new PlayerComponent({
      onClose: () => {
        tvNav.focusFirstVisible();
      }
    });

    this.virtualRemote = new VirtualRemoteComponent();
    this.virtualRemote.render();

    // 6. Initialize Views
    this.views.dashboard = new DashboardView({
      onNavigate: (viewId) => this.navigateTo(viewId),
      onOpenAccountDetails: () => this.accountModal.openAccountDetails(),
      onSync: () => this.syncCurrentAccount()
    });
    this.views.dashboard.render(mainContainer);

    this.views.live = new LiveView({
      onPlayFullscreen: (channel, list) => {
        this.player.play(channel, list);
      }
    });
    this.views.live.render(mainContainer);

    this.views.movies = new MoviesView({
      onPlay: (movie) => {
        this.player.play({ ...movie, type: 'vod' });
      }
    });
    this.views.movies.render(mainContainer);

    this.views.series = new SeriesView({
      onPlay: (item) => {
        this.player.play(item);
      }
    });
    this.views.series.render(mainContainer);

    this.views.search = new SearchView({
      onPlayContent: (content, list) => {
        this.player.play(content, list);
      }
    });
    this.views.search.render(mainContainer);

    this.views.favorites = new FavoritesView({
      onPlay: (item) => {
        this.player.play(item);
      }
    });
    this.views.favorites.render(mainContainer);

    this.views.history = new HistoryView({
      onPlay: (item) => {
        this.player.play(item);
      }
    });
    this.views.history.render(mainContainer);

    this.views.settings = new SettingsView({
      onSettingsChanged: () => {
        this.navbar.updateAccountStatus();
        this.virtualRemote.updateVisibility();
      },
      onOpenAccounts: () => {
        this.accountModal.openManager();
      }
    });
    this.views.settings.render(mainContainer);

    // 7. Load Active Account Data or prompt for Login on first start
    if (hasAccounts) {
      await this.loadActiveAccountData();
    } else {
      setTimeout(() => {
        this.accountModal.openAddEditModal();
      }, 300);
    }

    // 8. Initialize TV Spatial Navigation
    tvNav.init();

    // Setup Root Back Button Navigation: If on sub-view, go to dashboard
    tvNav.pushBackHandler(() => {
      if (this.currentViewId !== 'dashboard') {
        this.navigateTo('dashboard');
        return true;
      }
      return false;
    });

    console.log('[Nova IPTV Pro] Application Ready.');
  }

  navigateTo(viewId) {
    if (!this.views[viewId]) return;

    // Stop live preview if leaving live view
    if (this.currentViewId === 'live' && viewId !== 'live') {
      this.views.live.stopPreview();
    }

    // Hide all views
    document.querySelectorAll('.tv-view').forEach(v => v.classList.remove('active'));

    // Show target view
    const targetEl = document.getElementById(`view-${viewId}`);
    if (targetEl) {
      targetEl.classList.add('active');
    }

    this.currentViewId = viewId;

    // Refresh view specific data
    if (viewId === 'favorites') this.views.favorites.updateData();
    if (viewId === 'history') this.views.history.updateData();
    if (viewId === 'dashboard') this.views.dashboard.updateData();

    // Auto focus first item on view
    setTimeout(() => {
      tvNav.focusFirstVisible(targetEl);
    }, 150);
  }

  async loadActiveAccountData() {
    const acc = storage.getActiveAccount();
    if (!acc) {
      this.setCatalogData([], [], [], [], [], []);
      return;
    }

    console.log(`[App] Loading data for account: ${acc.name} (${acc.type})`);

    if (acc.type === 'demo') {
      // Load verified public demo catalog
      this.setCatalogData(
        LIVE_CATEGORIES,
        LIVE_CHANNELS,
        VOD_CATEGORIES,
        VOD_MOVIES,
        SERIES_CATEGORIES,
        SERIES_CATALOG
      );
    } else if (acc.type === 'xtream') {
      try {
        loadingOverlay.show('Sincronizando Conteúdo', 'Obtendo categorias do servidor Xtream Codes...', null);

        // Fetch ONLY categories (Ultra-fast, prevents 100MB+ downloads and TV freezing!)
        const [liveCats, vodCats, seriesCats] = await Promise.all([
          xtreamService.getLiveCategories(acc.serverUrl, acc.username, acc.password).catch(() => []),
          xtreamService.getVodCategories(acc.serverUrl, acc.username, acc.password).catch(() => []),
          xtreamService.getSeriesCategories(acc.serverUrl, acc.username, acc.password).catch(() => [])
        ]);

        const formattedLiveCats = liveCats.map(c => ({ id: String(c.category_id), name: c.category_name }));
        const formattedVodCats = vodCats.map(c => ({ id: String(c.category_id), name: c.category_name }));
        const formattedSeriesCats = seriesCats.map(c => ({ id: String(c.category_id), name: c.category_name }));

        this.liveCategories = formattedLiveCats;
        this.vodCategories = formattedVodCats;
        this.seriesCategories = formattedSeriesCats;

        this.views.live.setAccountContext(acc, formattedLiveCats);
        this.views.movies.setAccountContext(acc, formattedVodCats);
        this.views.series.setAccountContext(acc, formattedSeriesCats);

        this.views.dashboard.setCounts({
          live: formattedLiveCats.length,
          movies: formattedVodCats.length,
          series: formattedSeriesCats.length
        });
        this.views.dashboard.updateData();

        loadingOverlay.hide();
        toast.success('Sucesso', `${formattedLiveCats.length} categorias de TV carregadas!`);
      } catch (err) {
        console.error('[App] Xtream load error:', err);
        loadingOverlay.hide();
        toast.error('Erro na conexão', 'Não foi possível carregar as categorias do servidor.');
      }
    } else if (acc.type === 'm3u') {
      try {
        let parsedData = null;
        if (acc.localPlaylistData) {
          parsedData = acc.localPlaylistData;
        } else if (acc.m3uUrl) {
          toast.info('Carregando', 'Baixando e processando lista M3U...');
          parsedData = await m3uService.loadFromUrl(acc.m3uUrl);
        }

        if (parsedData) {
          const liveChs = parsedData.channels.filter(c => c.type === 'live');
          const vodChs = parsedData.channels.filter(c => c.type === 'movie').map(m => ({
            id: m.id,
            title: m.name,
            category: m.category,
            poster: m.logo,
            streamUrl: m.streamUrl
          }));
          const serChs = parsedData.channels.filter(c => c.type === 'series').map(s => ({
            id: s.id,
            title: s.name,
            category: s.category,
            poster: s.logo,
            streamUrl: s.streamUrl
          }));

          this.setCatalogData(
            parsedData.categories,
            liveChs,
            parsedData.categories,
            vodChs,
            parsedData.categories,
            serChs
          );
          toast.success('Lista Carregada', `${liveChs.length} canais prontos.`);
        }
      } catch (err) {
        console.error('[App] M3U load error:', err);
        toast.error('Erro na lista M3U', err.message);
      }
    }
  }

  setCatalogData(liveCats, liveChannels, vodCats, vodMovies, seriesCats, seriesList) {
    this.liveCategories = liveCats;
    this.liveChannels = liveChannels;
    this.vodCategories = vodCats;
    this.vodMovies = vodMovies;
    this.seriesCategories = seriesCats;
    this.seriesList = seriesList;

    // Distribute to views
    this.views.dashboard.setCounts({
      live: liveChannels.length,
      movies: vodMovies.length,
      series: seriesList.length
    });

    this.views.live.setData(liveCats, liveChannels);
    this.views.movies.setData(vodCats, vodMovies);
    this.views.series.setData(seriesCats, seriesList);
    this.views.search.setData(liveChannels, vodMovies, seriesList);
  }

  async syncCurrentAccount() {
    const acc = storage.getActiveAccount();
    if (!acc) throw new Error('Nenhuma conta ativa para atualizar.');

    loadingOverlay.show('Atualizando Conta', 'Sincronizando dados com o servidor...', null);

    try {
      if (acc.type === 'xtream') {
        const auth = await xtreamService.authenticate(acc.serverUrl, acc.username, acc.password);
        acc.expiryDate = auth.userInfo.expiryDate;
        acc.expiryDays = auth.userInfo.expiryDays;
        acc.maxConnections = auth.userInfo.maxConnections;
        acc.activeConnections = auth.userInfo.activeConnections;
        acc.updatedAt = Date.now();
        storage.saveAccount(acc);
      }

      await this.loadActiveAccountData();
      this.navbar.updateAccountStatus();
      this.views.dashboard.updateData();
    } finally {
      loadingOverlay.hide();
    }
  }
}

// Start Application on DOM Ready
window.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
