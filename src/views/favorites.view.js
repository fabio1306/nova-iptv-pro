// ==========================================================================
// FAVORITES VIEW - MANAGEMENT OF FAVORITE CHANNELS, MOVIES & SERIES
// ==========================================================================

import { storage } from '../services/storage.service.js';
import { toast } from '../components/toast.js';

export class FavoritesView {
  constructor(options = {}) {
    this.onPlay = options.onPlay || (() => {});
    this.container = null;
    this.activeTab = 'live'; // 'live' | 'movies' | 'series'
  }

  render(parentElement) {
    this.container = document.createElement('div');
    this.container.className = 'tv-view';
    this.container.id = 'view-favorites';

    this.container.innerHTML = `
      <div style="max-width: 1200px; margin: 0 auto; width: 100%;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px; margin-bottom:24px;">
          <div>
            <h1 style="font-size:28px; font-weight:800; color:#fff;">⭐ Meus Favoritos</h1>
            <p style="font-size:14px; color:var(--text-secondary); margin-top:4px;">Acesso rápido aos seus canais, filmes e séries prediletos</p>
          </div>

          <div style="display:flex; gap:12px;">
            <button class="tv-btn tv-btn-sm tv-btn-primary tv-focusable fav-tab-btn" data-tab="live">Canais de TV</button>
            <button class="tv-btn tv-btn-sm tv-focusable fav-tab-btn" data-tab="movies">Filmes</button>
            <button class="tv-btn tv-btn-sm tv-focusable fav-tab-btn" data-tab="series">Séries</button>
          </div>
        </div>

        <div id="favs-grid-container" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap:16px;"></div>
      </div>
    `;

    parentElement.appendChild(this.container);
    this.bindEvents();
    this.updateData();
  }

  bindEvents() {
    this.container.querySelectorAll('.fav-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.container.querySelectorAll('.fav-tab-btn').forEach(b => b.classList.remove('tv-btn-primary'));
        e.currentTarget.classList.add('tv-btn-primary');
        this.activeTab = e.currentTarget.dataset.tab;
        this.updateData();
      });
    });
  }

  updateData() {
    const list = storage.getFavorites(this.activeTab);
    const container = this.container.querySelector('#favs-grid-container');
    container.innerHTML = '';

    if (list.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 60px 20px; text-align:center;">
          <div style="font-size:48px; margin-bottom:12px;">⭐</div>
          <h3 style="font-size:18px; font-weight:700; color:#fff;">Nenhum favorito adicionado</h3>
          <p style="font-size:14px; color:var(--text-secondary); margin-top:6px;">
            Você pode adicionar canais, filmes e séries aos favoritos clicando no ícone de estrela.
          </p>
        </div>
      `;
      return;
    }

    list.forEach(item => {
      const card = document.createElement('div');
      card.className = 'tv-focusable';
      card.tabIndex = 0;
      card.style.cssText = 'display:flex; align-items:center; justify-content:space-between; padding:16px 20px; background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:var(--radius-lg); cursor:pointer;';

      card.innerHTML = `
        <div style="display:flex; align-items:center; gap:14px; flex:1;" class="truncate">
          ${item.logo || item.poster ? `
            <div class="tv-channel-logo-wrap" style="width:40px; height:40px;">
              <img class="tv-channel-logo" src="${item.logo || item.poster}" alt="">
            </div>
          ` : ''}
          <div class="truncate">
            <div style="font-size:15px; font-weight:700; color:#fff;" class="truncate">${item.name || item.title}</div>
            <div style="font-size:12px; color:var(--text-secondary);">${item.category || item.genre || 'Favorito'}</div>
          </div>
        </div>

        <div style="display:flex; align-items:center; gap:8px;">
          <button class="tv-btn tv-btn-sm tv-btn-primary tv-focusable fav-play-btn">▶ Reproduzir</button>
          <button class="tv-btn tv-btn-sm tv-btn-danger tv-focusable fav-remove-btn" title="Remover">✕</button>
        </div>
      `;

      card.querySelector('.fav-play-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.onPlay(item);
      });

      card.querySelector('.fav-remove-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        storage.toggleFavorite(this.activeTab, item);
        toast.info('Removido', `${item.name || item.title} foi removido dos favoritos.`);
        this.updateData();
      });

      card.addEventListener('click', () => {
        this.onPlay(item);
      });

      container.appendChild(card);
    });
  }
}
