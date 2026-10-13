// ==========================================================================
// MOVIES (VOD) VIEW - POSTER GRID & RICH CONTENT DETAILS MODAL
// ==========================================================================

import { storage } from '../services/storage.service.js';
import { toast } from '../components/toast.js';
import { tvNav } from '../services/tv-navigation.service.js';

export class MoviesView {
  constructor(options = {}) {
    this.onPlay = options.onPlay || (() => {});
    this.container = null;
    this.categories = [];
    this.movies = [];
    this.selectedCategory = 'all';
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
        <div>
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

  setData(categories, movies) {
    this.categories = categories;
    this.movies = movies;
    this.renderCategories();
    this.filterMovies();
  }

  renderCategories() {
    const listEl = this.container.querySelector('#movies-categories-list');
    listEl.innerHTML = '';

    // "Todos"
    const allItem = document.createElement('div');
    allItem.className = `tv-category-item tv-focusable ${this.selectedCategory === 'all' ? 'active' : ''}`;
    allItem.tabIndex = 0;
    allItem.innerHTML = `<span>Todos os Filmes</span><span class="tv-badge-count">${this.movies.length}</span>`;
    allItem.addEventListener('click', () => {
      this.selectedCategory = 'all';
      this.renderCategories();
      this.filterMovies();
    });
    listEl.appendChild(allItem);

    // "Favoritos"
    const favMovies = this.movies.filter(m => storage.isFavorite('movies', m.id));
    const favItem = document.createElement('div');
    favItem.className = `tv-category-item tv-focusable ${this.selectedCategory === 'favorites' ? 'active' : ''}`;
    favItem.tabIndex = 0;
    favItem.innerHTML = `<span>⭐ Favoritos</span><span class="tv-badge-count">${favMovies.length}</span>`;
    favItem.addEventListener('click', () => {
      this.selectedCategory = 'favorites';
      this.renderCategories();
      this.filterMovies();
    });
    listEl.appendChild(favItem);

    this.categories.forEach(cat => {
      const count = this.movies.filter(m => m.category === cat.id || m.category === cat.name).length;
      const item = document.createElement('div');
      item.className = `tv-category-item tv-focusable ${this.selectedCategory === cat.id ? 'active' : ''}`;
      item.tabIndex = 0;
      item.innerHTML = `<span class="truncate">${cat.name}</span><span class="tv-badge-count">${count}</span>`;
      item.addEventListener('click', () => {
        this.selectedCategory = cat.id;
        this.renderCategories();
        this.filterMovies();
      });
      listEl.appendChild(item);
    });
  }

  filterMovies() {
    const search = this.container.querySelector('#movies-search-input').value.toLowerCase().trim();
    let filtered = this.movies;

    if (this.selectedCategory === 'favorites') {
      filtered = filtered.filter(m => storage.isFavorite('movies', m.id));
    } else if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(m => m.category === this.selectedCategory || m.category === this.getCatName(this.selectedCategory));
    }

    if (search) {
      filtered = filtered.filter(m => m.title.toLowerCase().includes(search));
    }

    this.renderMovies(filtered);
  }

  getCatName(id) {
    const c = this.categories.find(it => it.id === id);
    return c ? c.name : id;
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
        <img class="tv-poster-img" src="${movie.poster}" alt="${movie.title}" onerror="this.src='https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400'">
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
    const savedPos = storage.getPlaybackPosition(movie.id);
    const hasResume = savedPos > 30;
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
              <span class="tv-badge-pill">${movie.duration || '1h 35m'}</span>
              <span class="tv-badge-pill">${movie.genre || 'Filme'}</span>
              <span class="tv-badge-pill" style="color:var(--primary);">4K ULTRA HD</span>
            </div>

            <p class="tv-detail-desc">${movie.overview || 'Sinopse não disponível.'}</p>

            <div class="tv-detail-actions">
              <button class="tv-btn tv-btn-primary tv-btn-lg tv-focusable" id="detail-play-btn">
                ▶ Assistir Agora
              </button>

              ${hasResume ? `
                <button class="tv-btn tv-focusable" id="detail-resume-btn">
                  ↻ Continuar (${Math.floor(savedPos / 60)}m)
                </button>
              ` : ''}

              <button class="tv-btn tv-focusable" id="detail-fav-btn">
                ${isFav ? '★ Favorito' : '☆ Favoritar'}
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

    if (hasResume) {
      backdropModal.querySelector('#detail-resume-btn').addEventListener('click', () => {
        backdropModal.remove();
        this.onPlay(movie);
      });
    }

    const favBtn = backdropModal.querySelector('#detail-fav-btn');
    favBtn.addEventListener('click', () => {
      const added = storage.toggleFavorite('movies', movie);
      favBtn.textContent = added ? '★ Favorito' : '☆ Favoritar';
      toast.info(added ? 'Favoritado' : 'Removido', `${movie.title} ${added ? 'adicionado aos favoritos' : 'removido'}`);
      this.renderCategories();
    });
  }

  bindEvents() {
    this.container.querySelector('#movies-search-input').addEventListener('input', () => {
      this.filterMovies();
    });
  }
}
