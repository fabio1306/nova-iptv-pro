// ==========================================================================
// SERIES VIEW - SEASONS, EPISODES & SERIES DETAIL MODAL
// ==========================================================================

import { storage } from '../services/storage.service.js';
import { toast } from '../components/toast.js';
import { tvNav } from '../services/tv-navigation.service.js';

export class SeriesView {
  constructor(options = {}) {
    this.onPlay = options.onPlay || (() => {});
    this.container = null;
    this.categories = [];
    this.seriesList = [];
    this.selectedCategory = 'all';
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
        <div>
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

  setData(categories, seriesList) {
    this.categories = categories;
    this.seriesList = seriesList;
    this.renderCategories();
    this.filterSeries();
  }

  renderCategories() {
    const listEl = this.container.querySelector('#series-categories-list');
    listEl.innerHTML = '';

    // "Todas"
    const allItem = document.createElement('div');
    allItem.className = `tv-category-item tv-focusable ${this.selectedCategory === 'all' ? 'active' : ''}`;
    allItem.tabIndex = 0;
    allItem.innerHTML = `<span>Todas as Séries</span><span class="tv-badge-count">${this.seriesList.length}</span>`;
    allItem.addEventListener('click', () => {
      this.selectedCategory = 'all';
      this.renderCategories();
      this.filterSeries();
    });
    listEl.appendChild(allItem);

    // "Favoritas"
    const favSeries = this.seriesList.filter(s => storage.isFavorite('series', s.id));
    const favItem = document.createElement('div');
    favItem.className = `tv-category-item tv-focusable ${this.selectedCategory === 'favorites' ? 'active' : ''}`;
    favItem.tabIndex = 0;
    favItem.innerHTML = `<span>⭐ Favoritas</span><span class="tv-badge-count">${favSeries.length}</span>`;
    favItem.addEventListener('click', () => {
      this.selectedCategory = 'favorites';
      this.renderCategories();
      this.filterSeries();
    });
    listEl.appendChild(favItem);

    this.categories.forEach(cat => {
      const count = this.seriesList.filter(s => s.category === cat.id || s.category === cat.name).length;
      const item = document.createElement('div');
      item.className = `tv-category-item tv-focusable ${this.selectedCategory === cat.id ? 'active' : ''}`;
      item.tabIndex = 0;
      item.innerHTML = `<span class="truncate">${cat.name}</span><span class="tv-badge-count">${count}</span>`;
      item.addEventListener('click', () => {
        this.selectedCategory = cat.id;
        this.renderCategories();
        this.filterSeries();
      });
      listEl.appendChild(item);
    });
  }

  filterSeries() {
    const search = this.container.querySelector('#series-search-input').value.toLowerCase().trim();
    let filtered = this.seriesList;

    if (this.selectedCategory === 'favorites') {
      filtered = filtered.filter(s => storage.isFavorite('series', s.id));
    } else if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(s => s.category === this.selectedCategory || s.category === this.getCatName(this.selectedCategory));
    }

    if (search) {
      filtered = filtered.filter(s => s.title.toLowerCase().includes(search));
    }

    this.renderSeries(filtered);
  }

  getCatName(id) {
    const c = this.categories.find(it => it.id === id);
    return c ? c.name : id;
  }

  renderSeries(seriesList) {
    const gridEl = this.container.querySelector('#series-grid');
    const badgeEl = this.container.querySelector('#series-count-badge');
    badgeEl.textContent = `(${seriesList.length} séries)`;
    gridEl.innerHTML = '';

    if (seriesList.length === 0) {
      gridEl.innerHTML = `<div style="grid-column: 1 / -1; padding:40px; text-align:center; color:var(--text-muted); font-size:16px;">Nenhuma série disponível nesta categoria.</div>`;
      return;
    }

    seriesList.forEach(series => {
      const card = document.createElement('div');
      card.className = 'tv-poster-card tv-focusable';
      card.tabIndex = 0;

      card.innerHTML = `
        <img class="tv-poster-img" src="${series.poster}" alt="${series.title}" onerror="this.src='https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400'">
        <div class="tv-poster-overlay">
          <div class="tv-poster-title line-clamp-2">${series.title}</div>
          <div class="tv-poster-meta">
            <span>${series.year || '2024'}</span>
            <span class="tv-rating-badge">★ ${series.rating || '9.0'}</span>
          </div>
        </div>
      `;

      card.addEventListener('click', () => {
        this.openSeriesDetail(series);
      });

      gridEl.appendChild(card);
    });
  }

  openSeriesDetail(series) {
    const isFav = storage.isFavorite('series', series.id);
    let selectedSeasonIdx = 0;
    const seasons = series.seasons || [
      {
        seasonNumber: 1,
        seasonName: 'Temporada 1',
        episodes: [
          { id: 'ep_1', number: 1, title: 'Episódio Piloto', duration: '45 min', overview: 'Início da narrativa com introdução aos personagens e trama.', streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' }
        ]
      }
    ];

    const detailModal = document.createElement('div');
    detailModal.className = 'tv-modal-backdrop';
    detailModal.innerHTML = `
      <div class="tv-detail-modal" style="max-height: 85vh;">
        <div class="tv-detail-backdrop" style="background-image: url('${series.backdrop || series.poster}');"></div>
        <div class="tv-detail-content" style="flex-direction:row;">
          <div class="tv-detail-poster-wrap">
            <img class="tv-detail-poster-img" src="${series.poster}" alt="${series.title}">
          </div>

          <div class="tv-detail-info">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <h2 class="tv-detail-title">${series.title}</h2>
              <button class="tv-icon-btn tv-focusable" id="series-detail-close">✕</button>
            </div>

            <div class="tv-detail-badges">
              <span class="tv-badge-pill" style="color:var(--accent-gold);">★ ${series.rating || '9.0'}</span>
              <span class="tv-badge-pill">${series.year || '2024'}</span>
              <span class="tv-badge-pill">${seasons.length} Temporada(s)</span>
              <span class="tv-badge-pill">${series.genre || 'Série'}</span>
            </div>

            <p class="tv-detail-desc">${series.overview || 'Sinopse não informada.'}</p>

            <div style="margin-top:14px; display:flex; gap:12px;">
              <button class="tv-btn tv-btn-sm tv-focusable" id="series-fav-btn">
                ${isFav ? '★ Favorita' : '☆ Favoritar'}
              </button>
            </div>

            <!-- Season Selector Tabs -->
            <div class="tv-series-seasons-bar" id="seasons-bar">
              ${seasons.map((s, idx) => `
                <button class="tv-season-tab tv-focusable ${idx === 0 ? 'active' : ''}" data-idx="${idx}">
                  ${s.seasonName || `Temporada ${s.seasonNumber}`}
                </button>
              `).join('')}
            </div>

            <!-- Episodes List -->
            <div class="tv-episodes-list" id="episodes-container"></div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(detailModal);
    tvNav.pushBackHandler(() => { detailModal.remove(); return true; });
    tvNav.focusFirstVisible(detailModal);

    const renderEpisodes = (seasonIdx) => {
      const epContainer = detailModal.querySelector('#episodes-container');
      const curSeason = seasons[seasonIdx];
      epContainer.innerHTML = '';

      if (!curSeason || !curSeason.episodes || curSeason.episodes.length === 0) {
        epContainer.innerHTML = `<div style="padding:20px; color:var(--text-muted);">Nenhum episódio cadastrado para esta temporada.</div>`;
        return;
      }

      curSeason.episodes.forEach(ep => {
        const item = document.createElement('div');
        item.className = 'tv-episode-item tv-focusable';
        item.tabIndex = 0;
        item.innerHTML = `
          <div style="font-size:16px; font-weight:800; color:var(--primary); width:32px;">${ep.number}</div>
          <div style="flex:1;">
            <div style="font-size:14px; font-weight:700; color:#fff;">${ep.title}</div>
            <div style="font-size:12px; color:var(--text-secondary); margin-top:2px;" class="line-clamp-2">${ep.overview || ''}</div>
          </div>
          <span style="font-size:12px; color:var(--text-muted);">${ep.duration || '40 min'}</span>
          <button class="tv-btn tv-btn-primary tv-btn-sm tv-focusable" style="margin-left:8px;">▶ Assistir</button>
        `;

        item.addEventListener('click', () => {
          detailModal.remove();
          this.onPlay({
            id: ep.id,
            title: `${series.title} - S${curSeason.seasonNumber}E${ep.number}: ${ep.title}`,
            streamUrl: ep.streamUrl,
            duration: ep.duration,
            type: 'vod'
          });
        });

        epContainer.appendChild(item);
      });
    };

    renderEpisodes(0);

    // Season Tab clicks
    detailModal.querySelectorAll('.tv-season-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        detailModal.querySelectorAll('.tv-season-tab').forEach(t => t.classList.remove('active'));
        e.currentTarget.classList.add('active');
        selectedSeasonIdx = Number(e.currentTarget.dataset.idx);
        renderEpisodes(selectedSeasonIdx);
      });
    });

    detailModal.querySelector('#series-detail-close').addEventListener('click', () => detailModal.remove());

    const favBtn = detailModal.querySelector('#series-fav-btn');
    favBtn.addEventListener('click', () => {
      const added = storage.toggleFavorite('series', series);
      favBtn.textContent = added ? '★ Favorita' : '☆ Favoritar';
      toast.info(added ? 'Favoritado' : 'Removido', `${series.title} ${added ? 'adicionado aos favoritos' : 'removido'}`);
      this.renderCategories();
    });
  }

  bindEvents() {
    this.container.querySelector('#series-search-input').addEventListener('input', () => {
      this.filterSeries();
    });
  }
}
