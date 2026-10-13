// ==========================================================================
// GLOBAL SEARCH VIEW - UNIFIED SEARCH ACROSS CHANNELS, MOVIES & SERIES
// ==========================================================================

export class SearchView {
  constructor(options = {}) {
    this.onPlayContent = options.onPlayContent || (() => {});
    this.container = null;
    this.channels = [];
    this.movies = [];
    this.series = [];
    this.activeTab = 'all';
  }

  render(parentElement) {
    this.container = document.createElement('div');
    this.container.className = 'tv-view';
    this.container.id = 'view-search';

    this.container.innerHTML = `
      <div style="max-width: 1200px; margin: 0 auto; width: 100%;">
        <div style="margin-top: 10px; margin-bottom: 24px; display:flex; align-items:center; gap: 20px;">
          <div style="flex:1; position:relative;">
            <input class="tv-input tv-focusable" style="padding:18px 24px; font-size:18px;" id="global-search-input" type="text" placeholder="Digite o nome do canal, filme ou série..." autofocus>
          </div>
          <button class="tv-btn tv-btn-primary tv-focusable" id="global-search-clear">Limpar</button>
        </div>

        <!-- Filter Tabs -->
        <div style="display:flex; gap:12px; margin-bottom:24px;">
          <button class="tv-btn tv-btn-sm tv-btn-primary tv-focusable search-tab-btn" data-tab="all">Todos os Resultados</button>
          <button class="tv-btn tv-btn-sm tv-focusable search-tab-btn" data-tab="live">Canais de TV</button>
          <button class="tv-btn tv-btn-sm tv-focusable search-tab-btn" data-tab="movies">Filmes</button>
          <button class="tv-btn tv-btn-sm tv-focusable search-tab-btn" data-tab="series">Séries</button>
        </div>

        <!-- Results Container -->
        <div id="search-results-container" style="display:flex; flex-direction:column; gap:24px; max-height:calc(100vh - 240px); overflow-y:auto; padding-bottom:40px;">
          <div style="padding:40px; text-align:center; color:var(--text-muted); font-size:16px;">
            Digite um termo na caixa de busca acima para pesquisar.
          </div>
        </div>
      </div>
    `;

    parentElement.appendChild(this.container);
    this.bindEvents();
  }

  setData(channels, movies, series) {
    this.channels = channels;
    this.movies = movies;
    this.series = series;
  }

  bindEvents() {
    const input = this.container.querySelector('#global-search-input');
    const clearBtn = this.container.querySelector('#global-search-clear');

    input.addEventListener('input', () => this.executeSearch());
    clearBtn.addEventListener('click', () => {
      input.value = '';
      this.executeSearch();
      input.focus();
    });

    this.container.querySelectorAll('.search-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.container.querySelectorAll('.search-tab-btn').forEach(b => b.classList.remove('tv-btn-primary'));
        e.currentTarget.classList.add('tv-btn-primary');
        this.activeTab = e.currentTarget.dataset.tab;
        this.executeSearch();
      });
    });
  }

  executeSearch() {
    const query = this.container.querySelector('#global-search-input').value.toLowerCase().trim();
    const container = this.container.querySelector('#search-results-container');

    if (!query) {
      container.innerHTML = `<div style="padding:40px; text-align:center; color:var(--text-muted); font-size:16px;">Digite um termo na caixa de busca acima para pesquisar.</div>`;
      return;
    }

    const matchedChannels = (this.activeTab === 'all' || this.activeTab === 'live')
      ? this.channels.filter(c => c.name.toLowerCase().includes(query))
      : [];

    const matchedMovies = (this.activeTab === 'all' || this.activeTab === 'movies')
      ? this.movies.filter(m => m.title.toLowerCase().includes(query))
      : [];

    const matchedSeries = (this.activeTab === 'all' || this.activeTab === 'series')
      ? this.series.filter(s => s.title.toLowerCase().includes(query))
      : [];

    const total = matchedChannels.length + matchedMovies.length + matchedSeries.length;

    if (total === 0) {
      container.innerHTML = `<div style="padding:40px; text-align:center; color:var(--text-muted); font-size:16px;">Nenhum resultado encontrado para "<strong>${query}</strong>".</div>`;
      return;
    }

    let html = '';

    // Channels
    if (matchedChannels.length > 0) {
      html += `
        <div>
          <h3 style="font-size:18px; font-weight:800; color:#fff; margin-bottom:12px;">Canais de TV (${matchedChannels.length})</h3>
          <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:12px;">
            ${matchedChannels.slice(0, 12).map(ch => `
              <div class="tv-focusable search-play-item" data-type="live" data-id="${ch.id}" style="display:flex; align-items:center; gap:12px; padding:12px 16px; background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:var(--radius-md); cursor:pointer;">
                <div class="tv-channel-logo-wrap" style="width:36px; height:36px;">
                  ${ch.logo ? `<img class="tv-channel-logo" src="${ch.logo}" alt="">` : '<span style="font-size:10px; color:#fff;">TV</span>'}
                </div>
                <div style="flex:1;" class="truncate">
                  <div style="font-size:14px; font-weight:700; color:#fff;" class="truncate">${ch.name}</div>
                  <div style="font-size:11px; color:var(--text-secondary);">${ch.category || 'Geral'}</div>
                </div>
                <span style="font-size:12px; color:var(--primary);">▶ Assistir</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Movies
    if (matchedMovies.length > 0) {
      html += `
        <div>
          <h3 style="font-size:18px; font-weight:800; color:#fff; margin-bottom:12px;">Filmes (${matchedMovies.length})</h3>
          <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap:16px;">
            ${matchedMovies.slice(0, 10).map(m => `
              <div class="tv-poster-card tv-focusable search-play-item" data-type="movie" data-id="${m.id}" style="aspect-ratio:2/3;">
                <img class="tv-poster-img" src="${m.poster}" alt="${m.title}">
                <div class="tv-poster-overlay">
                  <div class="tv-poster-title line-clamp-2">${m.title}</div>
                  <div class="tv-poster-meta">
                    <span>${m.year || '2024'}</span>
                    <span class="tv-rating-badge">★ ${m.rating || '8.5'}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Series
    if (matchedSeries.length > 0) {
      html += `
        <div>
          <h3 style="font-size:18px; font-weight:800; color:#fff; margin-bottom:12px;">Séries (${matchedSeries.length})</h3>
          <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap:16px;">
            ${matchedSeries.slice(0, 10).map(s => `
              <div class="tv-poster-card tv-focusable search-play-item" data-type="series" data-id="${s.id}" style="aspect-ratio:2/3;">
                <img class="tv-poster-img" src="${s.poster}" alt="${s.title}">
                <div class="tv-poster-overlay">
                  <div class="tv-poster-title line-clamp-2">${s.title}</div>
                  <div class="tv-poster-meta">
                    <span>${s.year || '2024'}</span>
                    <span class="tv-rating-badge">★ ${s.rating || '9.0'}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    container.innerHTML = html;

    container.querySelectorAll('.search-play-item').forEach(el => {
      el.addEventListener('click', (e) => {
        const type = e.currentTarget.dataset.type;
        const id = e.currentTarget.dataset.id;
        if (type === 'live') {
          const ch = this.channels.find(c => c.id === id);
          if (ch) this.onPlayContent(ch, this.channels);
        } else if (type === 'movie') {
          const m = this.movies.find(item => item.id === id);
          if (m) this.onPlayContent(m);
        } else if (type === 'series') {
          const s = this.series.find(item => item.id === id);
          if (s && s.seasons?.[0]?.episodes?.[0]) {
            const ep = s.seasons[0].episodes[0];
            this.onPlayContent({
              id: ep.id,
              title: `${s.title} - ${ep.title}`,
              streamUrl: ep.streamUrl,
              type: 'vod'
            });
          }
        }
      });
    });
  }
}
