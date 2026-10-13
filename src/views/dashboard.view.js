// ==========================================================================
// DASHBOARD VIEW - IBO PLAYER & IPTV SMARTERS PRO INSPIRED TILES
// ==========================================================================

import { storage } from '../services/storage.service.js';

export class DashboardView {
  constructor(options = {}) {
    this.onNavigate = options.onNavigate || (() => {});
    this.onOpenAccountDetails = options.onOpenAccountDetails || (() => {});
    this.onSync = options.onSync || (() => {});
    this.container = null;
    this.counts = { live: 0, movies: 0, series: 0 };
  }

  render(parentElement) {
    this.container = document.createElement('div');
    this.container.className = 'tv-view active';
    this.container.id = 'view-dashboard';

    this.container.innerHTML = `
      <div class="tv-dashboard-hero">
        <div class="tv-hero-greeting">
          <h1 id="dash-greeting-title">Painel Principal</h1>
          <p id="dash-greeting-sub">Selecione uma categoria para começar a assistir</p>
        </div>
      </div>

      <!-- Main Feature Grid (IBO Player Style) -->
      <div class="tv-dashboard-grid">
        <!-- Live TV Card -->
        <div class="tv-dash-card card-live featured tv-focusable" tabindex="0" id="dash-card-live" role="button">
          <div class="tv-dash-card-icon">
            <svg viewBox="0 0 24 24"><path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/></svg>
          </div>
          <div class="tv-dash-card-content">
            <div class="tv-dash-card-title">TV AO VIVO</div>
            <div class="tv-dash-card-subtitle">
              <span>Canais transmitidos em tempo real</span>
              <span class="tv-badge-count" id="dash-count-live">0 canais</span>
            </div>
          </div>
        </div>

        <!-- Movies / VOD Card -->
        <div class="tv-dash-card card-movies featured tv-focusable" tabindex="0" id="dash-card-movies" role="button">
          <div class="tv-dash-card-icon">
            <svg viewBox="0 0 24 24"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>
          </div>
          <div class="tv-dash-card-content">
            <div class="tv-dash-card-title">FILMES (VOD)</div>
            <div class="tv-dash-card-subtitle">
              <span>Catálogo completo sob demanda</span>
              <span class="tv-badge-count" id="dash-count-movies">0 filmes</span>
            </div>
          </div>
        </div>

        <!-- Series Card -->
        <div class="tv-dash-card card-series featured tv-focusable" tabindex="0" id="dash-card-series" role="button">
          <div class="tv-dash-card-icon">
            <svg viewBox="0 0 24 24"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z"/></svg>
          </div>
          <div class="tv-dash-card-content">
            <div class="tv-dash-card-title">SÉRIES</div>
            <div class="tv-dash-card-subtitle">
              <span>Temporadas e episódios organizados</span>
              <span class="tv-badge-count" id="dash-count-series">0 séries</span>
            </div>
          </div>
        </div>

        <!-- Favorites Card -->
        <div class="tv-dash-card card-favs tv-focusable" tabindex="0" id="dash-card-favs" role="button">
          <div class="tv-dash-card-icon">
            <svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
          </div>
          <div class="tv-dash-card-content">
            <div class="tv-dash-card-title">FAVORITOS</div>
            <div class="tv-dash-card-subtitle">Conteúdos marcados</div>
          </div>
        </div>

        <!-- History Card -->
        <div class="tv-dash-card card-history tv-focusable" tabindex="0" id="dash-card-history" role="button">
          <div class="tv-dash-card-icon">
            <svg viewBox="0 0 24 24"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>
          </div>
          <div class="tv-dash-card-content">
            <div class="tv-dash-card-title">HISTÓRICO</div>
            <div class="tv-dash-card-subtitle">Assistidos recentemente</div>
          </div>
        </div>

        <!-- Search Card -->
        <div class="tv-dash-card tv-focusable" tabindex="0" id="dash-card-search" role="button" style="--card-glow:rgba(0,210,255,0.3);">
          <div class="tv-dash-card-icon" style="background:linear-gradient(135deg, #00d2ff, #0088ff);">
            <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          </div>
          <div class="tv-dash-card-content">
            <div class="tv-dash-card-title">PESQUISA</div>
            <div class="tv-dash-card-subtitle">Buscar canais e filmes</div>
          </div>
        </div>

        <!-- Settings Card -->
        <div class="tv-dash-card tv-focusable" tabindex="0" id="dash-card-settings" role="button" style="--card-glow:rgba(150,150,150,0.3);">
          <div class="tv-dash-card-icon" style="background:rgba(255,255,255,0.1);">
            <svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
          </div>
          <div class="tv-dash-card-content">
            <div class="tv-dash-card-title">AJUSTES</div>
            <div class="tv-dash-card-subtitle">Configurações do Player</div>
          </div>
        </div>
      </div>

      <!-- Account Summary Banner -->
      <div class="tv-dashboard-account-banner">
        <div class="tv-banner-left">
          <div class="tv-banner-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
          </div>
          <div class="tv-banner-details">
            <h4 id="dash-banner-name">Conta Ativa: Carregando...</h4>
            <p id="dash-banner-sub">Verificando status de validade e servidor</p>
          </div>
        </div>

        <div style="display:flex; align-items:center; gap:12px;">
          <button class="tv-btn tv-btn-sm tv-focusable" id="dash-btn-refresh">
            ↻ Atualizar Listas
          </button>
          <button class="tv-btn tv-btn-primary tv-btn-sm tv-focusable" id="dash-btn-my-acc">
            Minha Conta
          </button>
        </div>
      </div>
    `;

    parentElement.appendChild(this.container);
    this.bindEvents();
    this.updateData();
  }

  bindEvents() {
    this.container.querySelector('#dash-card-live').addEventListener('click', () => this.onNavigate('live'));
    this.container.querySelector('#dash-card-movies').addEventListener('click', () => this.onNavigate('movies'));
    this.container.querySelector('#dash-card-series').addEventListener('click', () => this.onNavigate('series'));
    this.container.querySelector('#dash-card-favs').addEventListener('click', () => this.onNavigate('favorites'));
    this.container.querySelector('#dash-card-history').addEventListener('click', () => this.onNavigate('history'));
    this.container.querySelector('#dash-card-search').addEventListener('click', () => this.onNavigate('search'));
    this.container.querySelector('#dash-card-settings').addEventListener('click', () => this.onNavigate('settings'));

    this.container.querySelector('#dash-btn-refresh').addEventListener('click', () => this.onSync());
    this.container.querySelector('#dash-btn-my-acc').addEventListener('click', () => this.onOpenAccountDetails());
  }

  setCounts(counts) {
    this.counts = counts;
    const liveEl = this.container?.querySelector('#dash-count-live');
    const movEl = this.container?.querySelector('#dash-count-movies');
    const serEl = this.container?.querySelector('#dash-count-series');

    if (liveEl) liveEl.textContent = `${counts.live || 0} canais`;
    if (movEl) movEl.textContent = `${counts.movies || 0} filmes`;
    if (serEl) serEl.textContent = `${counts.series || 0} séries`;
  }

  updateData() {
    const acc = storage.getActiveAccount();
    const nameEl = this.container?.querySelector('#dash-banner-name');
    const subEl = this.container?.querySelector('#dash-banner-sub');

    if (!acc) {
      if (nameEl) nameEl.textContent = 'Nenhuma conta configurada';
      if (subEl) subEl.textContent = 'Adicione uma conta Xtream Codes ou Lista M3U para carregar os canais.';
      return;
    }

    if (nameEl) nameEl.textContent = `Conta Ativa: ${acc.name} (${acc.type?.toUpperCase()})`;

    let expiryMsg = 'Validade não informada pelo provedor';
    if (acc.expiryDate) {
      expiryMsg = `Vencimento em ${acc.expiryDate} (${acc.expiryDays !== null ? `${acc.expiryDays} dias restantes` : 'Ativo'})`;
    }
    if (subEl) subEl.textContent = `${expiryMsg} • Status: Conectado`;
  }
}
