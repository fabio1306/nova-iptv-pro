// ==========================================================================
// MOVIES (VOD) VIEW - POSTER GRID & ON-DEMAND CATEGORY LOADING
// ==========================================================================

import { storage } from '../services/storage.service.js';
import { xtreamService } from '../services/xtream.service.js';
import { toast } from '../components/toast.js';
import { tvNav } from '../services/tv-navigation.service.js';

export class MoviesView {
  constructor(options = {}) {
    this.onPlay = options.onPlay || (() => {});
    this.container = null;
    this.account = null;
    this.categories = [];
    this.movies = [];
    this.selectedCategory = null;
    this.categoryMoviesCache = new Map();
  }

  render(parentElement) {
    this.container = document.createElement('div');
    this.container.className = 'tv-view';
    this.container.id = 'view-movies';

    this.container.innerHTML = `
      <div class="tv-catalog-layout">
        <!-- Categories Sidebar -->
        <div class="tv-panel">
          <div class="tv-panel-header">
            <div class="tv-panel-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--primary)"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>
              Gêneros de Filmes
            </div>
          </div>
          <div class="tv-panel-list" id="movies-categories-list"></div>
        </div>

        <!-- Movies Poster Grid -->
        <div style="flex:1; display:flex; flex-direction:column; overflow:hidden;">
          <div class="tv-catalog-header">
            <div class="tv-catalog-title">
              <span>Catálogo de Filmes</span>
              <span style="font-size:14px; color:var(--text-secondary); margin-left:10px;" id="movies-count-badge">(0 filmes)</span>
            </div>
            <div class="tv-catalog-search-wrap">
              <input class="tv-input tv-focusable" id="movies-search-input" type="text" placeholder="Pesquisar filme...">
            </div>
          </div>

          <div class="tv-posters-grid" id="movies-grid"></div>
        </div>
      </div>
    `;

    parentElement.appendChild(this.container);
    this.bindEvents();
  }

  setAccountContext(account, categories, defaultMovies = []) {
    this.account = account;
    this.categories = categories || [];
    this.categoryMoviesCache.clear();

    if (defaultMovies && defaultMovies.length > 0) {
      this.movies = defaultMovies;
      this.categoryMoviesCache.set('all', defaultMovies);
    } else {
      this.movies = [];
    }

    this.renderCategories();

    if (this.categories.length > 0) {
      this.selectCategory(this.categories[0].id);
    }
  }

  setData(categories, movies) {
    this.setAccountContext(storage.getActiveAccount(), categories, movies);
  }

  renderCategories() {
    const listEl = this.container.querySelector('#movies-categories-list');
    listEl.innerHTML = '';

    // Favoritos
    const favMovies = storage.getFavorites().filter(f => f.type === 'movies');
    const favItem = document.createElement('div');
    favItem.className = `tv-category-item tv-focusable ${this.selectedCategory === 'favorites' ? 'active' : ''}`;
    favItem.tabIndex = 0;
    favItem.innerHTML = `<span>⭐ Favoritos</span><span class="tv-badge-count">${favMovies.length}</span>`;
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

    this.container.querySelectorAll('#movies-categories-list .tv-category-item').forEach(el => {
      if (categoryId === 'favorites') {
        el.classList.toggle('active', el.textContent.includes('Favoritos'));
      } else {
        el.classList.toggle('active', el.dataset.id === String(categoryId));
      }
    });

    if (categoryId === 'favorites') {
      const favs = storage.getFavorites().filter(f => f.type === 'movies').map(f => f.data);
      this.renderMovies(favs);
      return;
    }

    if (this.categoryMoviesCache.has(categoryId)) {
      this.renderMovies(this.categoryMoviesCache.get(categoryId));
      return;
    }

    if (this.account && this.account.type === 'xtream') {
      const gridEl = this.container.querySelector('#movies-grid');
      const badgeEl = this.container.querySelector('#movies-count-badge');
      badgeEl.textContent = '...';
      gridEl.innerHTML = `
        <div style="grid-column: 1 / -1; display:flex; flex-direction:column; align-items:center; justify-content:center; height:300px; gap:14px; color:var(--text-secondary);">
          <div class="tv-spinner"></div>
          <span>Carregando filmes da categoria...</span>
        </div>
      `;

      try {
        const streams = await xtreamService.getVodStreams(
          this.account.serverUrl,
          this.account.username,
          this.account.password,
          categoryId
        );

        const formatted = streams.map(m => ({
          id: String(m.stream_id),
          title: m.name,
          category: categoryId,
          poster: m.stream_icon,
          rating: m.rating || '8.0',
          streamUrl: xtreamService.getVodStreamUrl(this.account.serverUrl, this.account.username, this.account.password, m.stream_id, m.container_extension || 'mp4')
        }));

        this.categoryMoviesCache.set(categoryId, formatted);

        if (this.selectedCategory === categoryId) {
          this.renderMovies(formatted);
        }
      } catch (err) {
        console.error('[MoviesView] Category fetch error:', err);
        gridEl.innerHTML = `<div style="grid-column: 1 / -1; padding:40px; text-align:center; color:var(--status-danger);">Falha ao carregar filmes.</div>`;
      }
      return;
    }

    const filtered = this.movies.filter(m => String(m.category) === String(categoryId));
    this.renderMovies(filtered);
  }

  filterMovies() {
    const search = this.container.querySelector('#movies-search-input').value.toLowerCase().trim();
    let currentList = [];

    if (this.selectedCategory === 'favorites') {
      currentList = storage.getFavorites().filter(f => f.type === 'movies').map(f => f.data);
    } else if (this.categoryMoviesCache.has(this.selectedCategory)) {
      currentList = this.categoryMoviesCache.get(this.selectedCategory);
    } else {
      currentList = this.movies;
    }

    if (search) {
      currentList = currentList.filter(m => m.title.toLowerCase().includes(search));
    }

    this.renderMovies(currentList);
  }

  renderMovies(movies) {
    const gridEl = this.container.querySelector('#movies-grid');
    const badgeEl = this.container.querySelector('#movies-count-badge');
    badgeEl.textContent = `(${movies.length} filmes)`;
    gridEl.innerHTML = '';

    if (movies.length === 0) {
      gridEl.innerHTML = `<div style="grid-column: 1 / -1; padding:40px; text-align:center; color:var(--text-muted); font-size:16px;">Nenhum filme disponível nesta categoria.</div>`;
      return;
    }

    movies.forEach(movie => {
      const card = document.createElement('div');
      card.className = 'tv-poster-card tv-focusable';
      card.tabIndex = 0;

      card.innerHTML = `
        <img class="tv-poster-img" src="${movie.poster || ''}" alt="${movie.title}" onerror="this.src='https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400'">
        <div class="tv-poster-overlay">
          <div class="tv-poster-title line-clamp-2">${movie.title}</div>
          <div class="tv-poster-meta">
            <span>${movie.year || '2024'}</span>
            <span class="tv-rating-badge">★ ${movie.rating || '8.5'}</span>
          </div>
        </div>
      `;

      card.addEventListener('click', () => {
        this.openMovieDetail(movie);
      });

      gridEl.appendChild(card);
    });
  }

  openMovieDetail(movie) {
    const isFav = storage.isFavorite('movies', movie.id);

    const backdropModal = document.createElement('div');
    backdropModal.className = 'tv-modal-backdrop';
    backdropModal.innerHTML = `
      <div class="tv-detail-modal">
        <div class="tv-detail-backdrop" style="background-image: url('${movie.backdrop || movie.poster}');"></div>
        <div class="tv-detail-content">
          <div class="tv-detail-poster-wrap">
            <img class="tv-detail-poster-img" src="${movie.poster}" alt="${movie.title}">
          </div>

          <div class="tv-detail-info">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <h2 class="tv-detail-title">${movie.title}</h2>
              <button class="tv-icon-btn tv-focusable" id="detail-close-btn" style="flex-shrink:0;">✕</button>
            </div>

            <div class="tv-detail-badges">
              <span class="tv-badge-pill" style="color:var(--accent-gold);">★ ${movie.rating || '8.5'} IMDb</span>
              <span class="tv-badge-pill">${movie.year || '2024'}</span>
              <span class="tv-badge-pill" style="color:var(--primary);">4K ULTRA HD</span>
            </div>

            <p class="tv-detail-desc">${movie.overview || 'Reprodução disponível em alta resolução através do servidor.'}</p>

            <div class="tv-detail-actions">
              <button class="tv-btn tv-btn-primary tv-btn-lg tv-focusable" id="detail-play-btn">
                ▶ Assistir Agora
              </button>
              <button class="tv-btn tv-focusable" id="detail-fav-btn">
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

    backdropModal.querySelector('#detail-close-btn').addEventListener('click', () => backdropModal.remove());

    backdropModal.querySelector('#detail-play-btn').addEventListener('click', () => {
      backdropModal.remove();
      this.onPlay(movie);
    });

    backdropModal.querySelector('#detail-fav-btn').addEventListener('click', (e) => {
      const added = storage.toggleFavorite('movies', movie);
      e.currentTarget.textContent = added ? '★ Favorito' : '☆ Adicionar aos Favoritos';
      toast.info(added ? 'Favoritado' : 'Removido', `${movie.title} ${added ? 'adicionado aos favoritos' : 'removido dos favoritos'}`);
    });
  }

  bindEvents() {
    this.container.querySelector('#movies-search-input').addEventListener('input', () => {
      this.filterMovies();
    });
  }
}
