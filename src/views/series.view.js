// ==========================================================================
// SERIES VIEW - ON-DEMAND CATEGORY LOADING, SEASONS & EPISODES
// ==========================================================================

import { storage } from '../services/storage.service.js';
import { xtreamService } from '../services/xtream.service.js';
import { toast } from '../components/toast.js';
import { tvNav } from '../services/tv-navigation.service.js';

export class SeriesView {
  constructor(options = {}) {
    this.onPlay = options.onPlay || (() => {});
    this.container = null;
    this.account = null;
    this.categories = [];
    this.seriesList = [];
    this.selectedCategory = null;
    this.categorySeriesCache = new Map();
  }

  render(parentElement) {
    this.container = document.createElement('div');
    this.container.className = 'tv-view';
    this.container.id = 'view-series';

    this.container.innerHTML = `
      <div class="tv-catalog-layout">
        <!-- Categories Sidebar -->
        <div class="tv-panel">
          <div class="tv-panel-header">
            <div class="tv-panel-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--primary)"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z"/></svg>
              Gêneros de Séries
            </div>
          </div>
          <div class="tv-panel-list" id="series-categories-list"></div>
        </div>

        <!-- Series Grid -->
        <div style="flex:1; display:flex; flex-direction:column; overflow:hidden;">
          <div class="tv-catalog-header">
            <div class="tv-catalog-title">
              <span>Catálogo de Séries</span>
              <span style="font-size:14px; color:var(--text-secondary); margin-left:10px;" id="series-count-badge">(0 séries)</span>
            </div>
            <div class="tv-catalog-search-wrap">
              <input class="tv-input tv-focusable" id="series-search-input" type="text" placeholder="Pesquisar série...">
            </div>
          </div>

          <div class="tv-posters-grid" id="series-grid"></div>
        </div>
      </div>
    `;

    parentElement.appendChild(this.container);
    this.bindEvents();
  }

  setAccountContext(account, categories, defaultSeries = []) {
    this.account = account;
    this.categories = categories || [];
    this.categorySeriesCache.clear();

    if (defaultSeries && defaultSeries.length > 0) {
      this.seriesList = defaultSeries;
      this.categorySeriesCache.set('all', defaultSeries);
    } else {
      this.seriesList = [];
    }

    this.renderCategories();

    if (this.categories.length > 0) {
      this.selectCategory(this.categories[0].id);
    }
  }

  setData(categories, seriesList) {
    this.setAccountContext(storage.getActiveAccount(), categories, seriesList);
  }

  renderCategories() {
    const listEl = this.container.querySelector('#series-categories-list');
    listEl.innerHTML = '';

    // Favoritos
    const favSeries = storage.getFavorites().filter(f => f.type === 'series');
    const favItem = document.createElement('div');
    favItem.className = `tv-category-item tv-focusable ${this.selectedCategory === 'favorites' ? 'active' : ''}`;
    favItem.tabIndex = 0;
    favItem.innerHTML = `<span>⭐ Favoritos</span><span class="tv-badge-count">${favSeries.length}</span>`;
    favItem.addEventListener('click', () => {
      this.selectCategory('favorites');
    });
    listEl.appendChild(favItem);

    this.categories.forEach(cat => {
      const item = document.createElement('div');
      item.className = `tv-category-item tv-focusable ${this.selectedCategory === String(cat.id) ? 'active' : ''}`;
      item.tabIndex = 0;
      item.dataset.id = cat.id;
      item.innerHTML = `<span class="truncate">${cat.name}</span>`;
      item.addEventListener('click', () => {
        this.selectCategory(String(cat.id));
      });
      listEl.appendChild(item);
    });
  }

  async selectCategory(categoryId) {
    this.selectedCategory = categoryId;

    this.container.querySelectorAll('#series-categories-list .tv-category-item').forEach(el => {
      if (categoryId === 'favorites') {
        el.classList.toggle('active', el.textContent.includes('Favoritos'));
      } else {
        el.classList.toggle('active', el.dataset.id === String(categoryId));
      }
    });

    if (categoryId === 'favorites') {
      const favs = storage.getFavorites().filter(f => f.type === 'series').map(f => f.data);
      this.renderSeries(favs);
      return;
    }

    if (this.categorySeriesCache.has(categoryId)) {
      this.renderSeries(this.categorySeriesCache.get(categoryId));
      return;
    }

    if (this.account && this.account.type === 'xtream') {
      const gridEl = this.container.querySelector('#series-grid');
      const badgeEl = this.container.querySelector('#series-count-badge');
      badgeEl.textContent = '...';
      gridEl.innerHTML = `
        <div style="grid-column: 1 / -1; display:flex; flex-direction:column; align-items:center; justify-content:center; height:300px; gap:14px; color:var(--text-secondary);">
          <div class="tv-spinner"></div>
          <span>Carregando séries da categoria...</span>
        </div>
      `;

      try {
        const list = await xtreamService.getSeries(
          this.account.serverUrl,
          this.account.username,
          this.account.password,
          categoryId
        );

        const formatted = list.map(s => ({
          id: String(s.series_id),
          title: s.name,
          category: categoryId,
          poster: s.cover,
          rating: s.rating || '8.5',
          seasons: []
        }));

        this.categorySeriesCache.set(categoryId, formatted);

        if (this.selectedCategory === categoryId) {
          this.renderSeries(formatted);
        }
      } catch (err) {
        console.error('[SeriesView] Series fetch error:', err);
        gridEl.innerHTML = `<div style="grid-column: 1 / -1; padding:40px; text-align:center; color:var(--status-danger);">Falha ao carregar séries.</div>`;
      }
      return;
    }

    const filtered = this.seriesList.filter(s => String(s.category) === String(categoryId));
    this.renderSeries(filtered);
  }

  filterSeries() {
    const search = this.container.querySelector('#series-search-input').value.toLowerCase().trim();
    let currentList = [];

    if (this.selectedCategory === 'favorites') {
      currentList = storage.getFavorites().filter(f => f.type === 'series').map(f => f.data);
    } else if (this.categorySeriesCache.has(this.selectedCategory)) {
      currentList = this.categorySeriesCache.get(this.selectedCategory);
    } else {
      currentList = this.seriesList;
    }

    if (search) {
      currentList = currentList.filter(s => s.title.toLowerCase().includes(search));
    }

    this.renderSeries(currentList);
  }

  renderSeries(series) {
    const gridEl = this.container.querySelector('#series-grid');
    const badgeEl = this.container.querySelector('#series-count-badge');
    badgeEl.textContent = `(${series.length} séries)`;
    gridEl.innerHTML = '';

    if (series.length === 0) {
      gridEl.innerHTML = `<div style="grid-column: 1 / -1; padding:40px; text-align:center; color:var(--text-muted); font-size:16px;">Nenhuma série disponível nesta categoria.</div>`;
      return;
    }

    series.forEach(item => {
      const card = document.createElement('div');
      card.className = 'tv-poster-card tv-focusable';
      card.tabIndex = 0;

      card.innerHTML = `
        <img class="tv-poster-img" src="${item.poster || ''}" alt="${item.title}" onerror="this.src='https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=400'">
        <div class="tv-poster-overlay">
          <div class="tv-poster-title line-clamp-2">${item.title}</div>
          <div class="tv-poster-meta">
            <span>Série</span>
            <span class="tv-rating-badge">★ ${item.rating || '8.8'}</span>
          </div>
        </div>
      `;

      card.addEventListener('click', () => {
        this.openSeriesDetail(item);
      });

      gridEl.appendChild(card);
    });
  }

  async openSeriesDetail(item) {
    const isFav = storage.isFavorite('series', item.id);

    const backdropModal = document.createElement('div');
    backdropModal.className = 'tv-modal-backdrop';
    backdropModal.innerHTML = `
      <div class="tv-detail-modal" style="max-height: 85vh;">
        <div class="tv-detail-backdrop" style="background-image: url('${item.poster}');"></div>
        <div class="tv-detail-content">
          <div class="tv-detail-poster-wrap">
            <img class="tv-detail-poster-img" src="${item.poster}" alt="${item.title}">
          </div>

          <div class="tv-detail-info" style="flex:1; overflow-y:auto;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <h2 class="tv-detail-title">${item.title}</h2>
              <button class="tv-icon-btn tv-focusable" id="series-close-btn">✕</button>
            </div>

            <div class="tv-detail-badges">
              <span class="tv-badge-pill" style="color:var(--accent-gold);">★ ${item.rating || '8.8'}</span>
              <span class="tv-badge-pill" style="color:var(--primary);">SÉRIE COMPLETA</span>
            </div>

            <div style="margin: 16px 0;" id="series-episodes-container">
              <div style="display:flex; align-items:center; gap:8px; color:var(--text-secondary); font-size:13px;">
                <div class="tv-spinner" style="width:20px; height:20px;"></div>
                <span>Carregando episódios e temporadas...</span>
              </div>
            </div>

            <div class="tv-detail-actions">
              <button class="tv-btn tv-focusable" id="series-fav-btn">
                ${isFav ? '★ Favorito' : '☆ Adicionar aos Favoritos'}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(backdropModal);
    tvNav.pushBackHandler(() => { backdropModal.remove(); return true; });
    tvNav.focusFirstVisible(backdropModal);

    backdropModal.querySelector('#series-close-btn').addEventListener('click', () => backdropModal.remove());

    backdropModal.querySelector('#series-fav-btn').addEventListener('click', (e) => {
      const added = storage.toggleFavorite('series', item);
      e.currentTarget.textContent = added ? '★ Favorito' : '☆ Adicionar aos Favoritos';
      toast.info(added ? 'Favoritado' : 'Removido', `${item.title} ${added ? 'adicionado aos favoritos' : 'removido dos favoritos'}`);
    });

    // Fetch episodes if Xtream
    if (this.account && this.account.type === 'xtream') {
      try {
        const info = await xtreamService.getSeriesInfo(this.account.serverUrl, this.account.username, this.account.password, item.id);
        const epContainer = backdropModal.querySelector('#series-episodes-container');
        
        if (info && info.episodes) {
          const seasonKeys = Object.keys(info.episodes);
          epContainer.innerHTML = `
            <div style="font-weight:700; color:#fff; margin-bottom:8px; font-size:14px;">Temporadas disponíveis: (${seasonKeys.length})</div>
            <div style="display:flex; flex-direction:column; gap:8px; max-height:240px; overflow-y:auto; padding-right:4px;">
              ${seasonKeys.map(sNum => {
                const eps = info.episodes[sNum] || [];
                return eps.map(ep => `
                  <div class="tv-focusable episode-play-item" style="padding:10px 14px; background:rgba(255,255,255,0.05); border-radius:var(--radius-sm); display:flex; justify-content:space-between; align-items:center; cursor:pointer;" data-ep-id="${ep.id}" data-ext="${ep.container_extension || 'mp4'}">
                    <span style="font-size:13px; font-weight:600; color:#fff;">T${sNum} E${ep.episode_num}: ${ep.title}</span>
                    <button class="tv-btn tv-btn-sm tv-btn-primary" style="padding:4px 10px; font-size:11px;">▶ Assistir</button>
                  </div>
                `).join('');
              }).join('')}
            </div>
          `;

          epContainer.querySelectorAll('.episode-play-item').forEach(el => {
            el.addEventListener('click', () => {
              const epId = el.dataset.epId;
              const ext = el.dataset.ext;
              const streamUrl = xtreamService.getSeriesStreamUrl(this.account.serverUrl, this.account.username, this.account.password, epId, ext);
              backdropModal.remove();
              this.onPlay({
                id: `series_${item.id}_${epId}`,
                title: `${item.title} - ${el.querySelector('span').textContent}`,
                streamUrl,
                type: 'vod'
              });
            });
          });
        } else {
          backdropModal.querySelector('#series-episodes-container').innerHTML = '<div style="color:var(--text-muted); font-size:13px;">Nenhum episódio retornado pelo servidor.</div>';
        }
      } catch (err) {
        console.error('[SeriesView] Episodes fetch error:', err);
        backdropModal.querySelector('#series-episodes-container').innerHTML = '<div style="color:var(--status-danger); font-size:13px;">Erro ao obter lista de episódios.</div>';
      }
    }
  }

  bindEvents() {
    this.container.querySelector('#series-search-input').addEventListener('input', () => {
      this.filterSeries();
    });
  }
}
