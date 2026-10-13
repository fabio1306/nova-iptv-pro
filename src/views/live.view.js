// ==========================================================================
// LIVE TV VIEW - 3-COLUMN SMART TV CHANNELS, EPG & PREVIEW PLAYER
// ==========================================================================

import Hls from 'hls.js';
import { storage } from '../services/storage.service.js';
import { toast } from '../components/toast.js';
import { tvNav } from '../services/tv-navigation.service.js';

export class LiveView {
  constructor(options = {}) {
    this.onPlayFullscreen = options.onPlayFullscreen || (() => {});
    this.container = null;
    this.categories = [];
    this.channels = [];
    this.selectedCategory = 'all';
    this.selectedChannel = null;
    this.previewHls = null;
  }

  render(parentElement) {
    this.container = document.createElement('div');
    this.container.className = 'tv-view';
    this.container.id = 'view-live';

    this.container.innerHTML = `
      <div class="tv-live-container">
        <!-- 1. Categories Column -->
        <div class="tv-panel">
          <div class="tv-panel-header">
            <div class="tv-panel-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--primary)"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z"/></svg>
              Categorias
            </div>
          </div>
          <div class="tv-panel-list" id="live-categories-list"></div>
        </div>

        <!-- 2. Channels Column -->
        <div class="tv-panel">
          <div class="tv-panel-header">
            <div class="tv-panel-title">
              <span>Canais</span>
              <span style="font-size:12px; color:var(--text-muted); font-weight:normal;" id="live-channel-count-badge">(0)</span>
            </div>
            <div style="width:160px;">
              <input class="tv-input tv-focusable" style="padding:6px 10px; font-size:12px;" id="live-filter-input" type="text" placeholder="Filtrar canal...">
            </div>
          </div>
          <div class="tv-panel-list" id="live-channels-list"></div>
        </div>

        <!-- 3. Preview Player & EPG Program Column -->
        <div class="tv-preview-panel">
          <div class="tv-preview-video-container">
            <video class="tv-preview-video" id="live-preview-video" muted playsinline></video>
            <button class="tv-preview-fullscreen-btn tv-focusable" id="live-fullscreen-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
              Assistir em Tela Cheia
            </button>
          </div>

          <div class="tv-preview-epg-details">
            <div class="tv-preview-title" id="preview-ch-name">Selecione um canal</div>
            <div class="tv-preview-prog-title" id="preview-prog-title">Carregando guia...</div>

            <div class="tv-epg-time-bar">
              <div class="tv-epg-progress-track">
                <div class="tv-epg-progress-fill" id="preview-prog-progress" style="width: 50%;"></div>
              </div>
              <div class="tv-epg-time-labels">
                <span id="preview-time-start">--:--</span>
                <span id="preview-time-end">--:--</span>
              </div>
            </div>

            <div class="tv-preview-prog-desc" id="preview-prog-desc">
              Selecione qualquer canal da lista para visualizar a transmissão ao vivo e a programação correspondente.
            </div>

            <div style="margin-top:auto; padding-top:14px; border-top:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:12px; color:var(--text-secondary);" id="preview-next-label">Próximo programa: --</span>
              <button class="tv-btn tv-btn-sm tv-focusable" id="preview-fav-toggle-btn">
                ⭐ Favoritar Canal
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    parentElement.appendChild(this.container);
    this.bindEvents();
  }

  setData(categories, channels) {
    this.categories = categories;
    this.channels = channels;
    this.renderCategories();
    this.filterChannels();
  }

  renderCategories() {
    const listEl = this.container.querySelector('#live-categories-list');
    listEl.innerHTML = '';

    // "Todos" Category
    const allItem = document.createElement('div');
    allItem.className = `tv-category-item tv-focusable ${this.selectedCategory === 'all' ? 'active' : ''}`;
    allItem.tabIndex = 0;
    allItem.innerHTML = `<span>Todos os Canais</span><span class="tv-badge-count">${this.channels.length}</span>`;
    allItem.addEventListener('click', () => {
      this.selectedCategory = 'all';
      this.renderCategories();
      this.filterChannels();
    });
    listEl.appendChild(allItem);

    // "Favoritos" Category
    const favChannels = this.channels.filter(ch => storage.isFavorite('live', ch.id));
    const favItem = document.createElement('div');
    favItem.className = `tv-category-item tv-focusable ${this.selectedCategory === 'favorites' ? 'active' : ''}`;
    favItem.tabIndex = 0;
    favItem.innerHTML = `<span>⭐ Favoritos</span><span class="tv-badge-count">${favChannels.length}</span>`;
    favItem.addEventListener('click', () => {
      this.selectedCategory = 'favorites';
      this.renderCategories();
      this.filterChannels();
    });
    listEl.appendChild(favItem);

    // Dynamic Categories
    this.categories.forEach(cat => {
      const count = this.channels.filter(ch => ch.category === cat.id || ch.category === cat.name).length;
      const item = document.createElement('div');
      item.className = `tv-category-item tv-focusable ${this.selectedCategory === cat.id ? 'active' : ''}`;
      item.tabIndex = 0;
      item.innerHTML = `<span class="truncate">${cat.name}</span><span class="tv-badge-count">${count}</span>`;
      item.addEventListener('click', () => {
        this.selectedCategory = cat.id;
        this.renderCategories();
        this.filterChannels();
      });
      listEl.appendChild(item);
    });
  }

  filterChannels() {
    const filterText = this.container.querySelector('#live-filter-input').value.toLowerCase().trim();
    let filtered = this.channels;

    if (this.selectedCategory === 'favorites') {
      filtered = filtered.filter(ch => storage.isFavorite('live', ch.id));
    } else if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(ch => ch.category === this.selectedCategory || ch.category === this.getCatName(this.selectedCategory));
    }

    if (filterText) {
      filtered = filtered.filter(ch => ch.name.toLowerCase().includes(filterText));
    }

    this.renderChannels(filtered);
  }

  getCatName(id) {
    const c = this.categories.find(it => it.id === id);
    return c ? c.name : id;
  }

  renderChannels(channels) {
    const listEl = this.container.querySelector('#live-channels-list');
    const badgeEl = this.container.querySelector('#live-channel-count-badge');
    badgeEl.textContent = `(${channels.length})`;
    listEl.innerHTML = '';

    if (channels.length === 0) {
      listEl.innerHTML = `<div style="padding:30px; text-align:center; color:var(--text-muted); font-size:14px;">Nenhum canal encontrado nesta categoria.</div>`;
      return;
    }

    channels.forEach((ch, idx) => {
      const isSelected = this.selectedChannel?.id === ch.id;
      const isFav = storage.isFavorite('live', ch.id);

      const item = document.createElement('div');
      item.className = `tv-channel-item tv-focusable ${isSelected ? 'active' : ''}`;
      item.tabIndex = 0;
      item.dataset.id = ch.id;

      item.innerHTML = `
        <span class="tv-channel-num">${ch.num || idx + 1}</span>
        <div class="tv-channel-logo-wrap">
          ${ch.logo ? `<img class="tv-channel-logo" src="${ch.logo}" alt="" onerror="this.style.display='none'">` : '<span style="font-size:10px; color:#fff;">TV</span>'}
        </div>
        <div class="tv-channel-meta">
          <div class="tv-channel-name truncate">${ch.name}</div>
          <div class="tv-channel-epg-now truncate">${ch.epg?.current?.title || 'Transmissão ao vivo'}</div>
        </div>
        <div class="tv-channel-fav-btn ${isFav ? 'active' : ''}" data-fav-id="${ch.id}">
          ${isFav ? '★' : '☆'}
        </div>
      `;

      item.addEventListener('click', (e) => {
        if (e.target.closest('.tv-channel-fav-btn')) {
          const added = storage.toggleFavorite('live', ch);
          toast.info(added ? 'Favoritado' : 'Removido', `${ch.name} ${added ? 'adicionado aos favoritos' : 'removido dos favoritos'}`);
          this.renderCategories();
          this.filterChannels();
          return;
        }

        this.selectChannel(ch, channels);
      });

      listEl.appendChild(item);
    });

    // Auto-select first channel if none selected
    if (!this.selectedChannel && channels.length > 0) {
      this.selectChannel(channels[0], channels, false);
    }
  }

  selectChannel(channel, channelList = this.channels, autoplay = true) {
    this.selectedChannel = channel;

    // Highlight item
    this.container.querySelectorAll('.tv-channel-item').forEach(el => {
      el.classList.toggle('active', el.dataset.id === channel.id);
    });

    // Update EPG Details
    this.container.querySelector('#preview-ch-name').textContent = `${channel.num ? `${channel.num}. ` : ''}${channel.name}`;
    const epg = channel.epg || {};

    if (epg.current) {
      this.container.querySelector('#preview-prog-title').textContent = epg.current.title;
      this.container.querySelector('#preview-time-start').textContent = epg.current.start || '11:00';
      this.container.querySelector('#preview-time-end').textContent = epg.current.end || '13:00';
      this.container.querySelector('#preview-prog-desc').textContent = epg.current.desc || 'Acompanhe a programação com a melhor qualidade de imagem e estabilidade.';
    } else {
      this.container.querySelector('#preview-prog-title').textContent = 'Programação ao vivo';
      this.container.querySelector('#preview-time-start').textContent = 'Agora';
      this.container.querySelector('#preview-time-end').textContent = 'Ao Vivo';
      this.container.querySelector('#preview-prog-desc').textContent = 'Guia de programação não disponível no momento para este canal.';
    }

    if (epg.next) {
      this.container.querySelector('#preview-next-label').textContent = `Próximo: ${epg.next.title} (${epg.next.start})`;
    } else {
      this.container.querySelector('#preview-next-label').textContent = 'Próximo programa não informado';
    }

    // Favorite Button update
    const favBtn = this.container.querySelector('#preview-fav-toggle-btn');
    const isFav = storage.isFavorite('live', channel.id);
    favBtn.textContent = isFav ? '★ Remover dos Favoritos' : '☆ Adicionar aos Favoritos';

    // Start Preview Video
    if (autoplay) {
      this.startPreview(channel.streamUrl);
    }
  }

  startPreview(url) {
    const video = this.container.querySelector('#live-preview-video');
    if (this.previewHls) {
      this.previewHls.destroy();
      this.previewHls = null;
    }

    const isHls = url.includes('.m3u8');
    if (isHls && Hls.isSupported()) {
      this.previewHls = new Hls({ enableWorker: true });
      this.previewHls.loadSource(url);
      this.previewHls.attachMedia(video);
      this.previewHls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
    } else {
      video.src = url;
      video.play().catch(() => {});
    }
  }

  stopPreview() {
    if (this.previewHls) {
      this.previewHls.destroy();
      this.previewHls = null;
    }
    const video = this.container?.querySelector('#live-preview-video');
    if (video) {
      video.pause();
      video.removeAttribute('src');
    }
  }

  bindEvents() {
    this.container.querySelector('#live-filter-input').addEventListener('input', () => {
      this.filterChannels();
    });

    this.container.querySelector('#live-fullscreen-btn').addEventListener('click', () => {
      if (this.selectedChannel) {
        this.stopPreview();
        this.onPlayFullscreen(this.selectedChannel, this.channels);
      }
    });

    this.container.querySelector('#preview-fav-toggle-btn').addEventListener('click', () => {
      if (!this.selectedChannel) return;
      const added = storage.toggleFavorite('live', this.selectedChannel);
      toast.info(added ? 'Favoritado' : 'Removido', `${this.selectedChannel.name} ${added ? 'adicionado aos favoritos' : 'removido dos favoritos'}`);
      this.renderCategories();
      this.filterChannels();
      this.selectChannel(this.selectedChannel, this.channels, false);
    });
  }
}
