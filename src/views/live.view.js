// ==========================================================================
// LIVE TV VIEW - 3-COLUMN SMART TV CHANNELS, ON-DEMAND LOADING & 2-CLICK FULLSCREEN
// ==========================================================================

import Hls from 'hls.js';
import { storage } from '../services/storage.service.js';
import { xtreamService } from '../services/xtream.service.js';
import { toast } from '../components/toast.js';
import { tvNav } from '../services/tv-navigation.service.js';

export class LiveView {
  constructor(options = {}) {
    this.onPlayFullscreen = options.onPlayFullscreen || (() => {});
    this.container = null;
    this.account = null;
    this.categories = [];
    this.channels = []; // All channels (if preloaded) or current category channels
    this.selectedCategory = null;
    this.selectedChannel = null;
    this.previewHls = null;
    this.categoryChannelsCache = new Map();
    this.isLoadingChannels = false;
  }

  render(parentElement) {
    this.container = document.createElement('div');
    this.container.className = 'tv-view';
    this.container.id = 'view-live';

    this.container.innerHTML = `
      <div class="tv-live-container">
        <!-- 1. Categories Column -->
        <div class="tv-panel tv-panel-categories">
          <div class="tv-panel-header">
            <div class="tv-panel-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--primary)"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z"/></svg>
              Categorias
            </div>
          </div>
          <div class="tv-panel-list" id="live-categories-list"></div>
        </div>

        <!-- 2. Channels Column -->
        <div class="tv-panel tv-panel-channels">
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
          <div class="tv-preview-video-container" id="live-preview-box">
            <video class="tv-preview-video" id="live-preview-video" muted playsinline></video>
            
            <div class="tv-preview-fullscreen-hint" id="live-preview-hint">
              <span>▶ Clique novamente no canal ou aqui para Tela Cheia</span>
            </div>

            <button class="tv-preview-fullscreen-btn tv-focusable" id="live-fullscreen-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
              Assistir em Tela Cheia
            </button>
          </div>

          <div class="tv-preview-epg-details">
            <div style="display:flex; align-items:center; gap:14px;">
              <div class="tv-channel-logo-wrap" style="width:52px; height:52px;" id="preview-logo-box">
                <img class="tv-channel-logo" id="preview-ch-logo" src="" alt="" style="display:none;">
                <span id="preview-ch-fallback-logo" style="font-size:14px; color:#fff; font-weight:700;">TV</span>
              </div>
              <div>
                <div class="tv-preview-title" id="preview-ch-name">Selecione um canal</div>
                <div class="tv-preview-prog-title" id="preview-prog-title">Aguardando seleção...</div>
              </div>
            </div>

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
              1 toque reproduz o canal na prévia ao lado. 2 toques no mesmo canal abre instantaneamente em Tela Cheia.
            </div>

            <div style="margin-top:auto; padding-top:16px; border-top:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:13px; color:var(--text-secondary);" id="preview-next-label">Próximo programa: --</span>
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

  setAccountContext(account, categories, defaultChannels = []) {
    this.account = account;
    this.categories = categories || [];
    this.categoryChannelsCache.clear();
    this.selectedChannel = null;
    this.stopPreview();

    if (defaultChannels && defaultChannels.length > 0) {
      this.channels = defaultChannels;
      // Pre-cache if mock/m3u
      this.categoryChannelsCache.set('all', defaultChannels);
    } else {
      this.channels = [];
    }

    this.renderCategories();

    // Select first category automatically
    if (this.categories.length > 0) {
      this.selectCategory(this.categories[0].id);
    } else if (this.channels.length > 0) {
      this.selectCategory('all');
    }
  }

  // Backward compatibility
  setData(categories, channels) {
    this.setAccountContext(storage.getActiveAccount(), categories, channels);
  }

  renderCategories() {
    const listEl = this.container.querySelector('#live-categories-list');
    listEl.innerHTML = '';

    // Favorites Category
    const favChannels = storage.getFavorites().filter(f => f.type === 'live');
    const favItem = document.createElement('div');
    favItem.className = `tv-category-item tv-focusable ${this.selectedCategory === 'favorites' ? 'active' : ''}`;
    favItem.tabIndex = 0;
    favItem.innerHTML = `<span>⭐ Favoritos</span><span class="tv-badge-count">${favChannels.length}</span>`;
    favItem.addEventListener('click', () => {
      this.selectCategory('favorites');
    });
    listEl.appendChild(favItem);

    // Dynamic Categories
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

    // Update active highlight on category items
    this.container.querySelectorAll('.tv-category-item').forEach(el => {
      if (categoryId === 'favorites') {
        el.classList.toggle('active', el.textContent.includes('Favoritos'));
      } else {
        el.classList.toggle('active', el.dataset.id === String(categoryId));
      }
    });

    // 1. Handle Favorites
    if (categoryId === 'favorites') {
      const favs = storage.getFavorites()
        .filter(f => f.type === 'live')
        .map(f => f.data);
      this.renderChannels(favs);
      return;
    }

    // 2. Check if channels are already cached in memory
    if (this.categoryChannelsCache.has(categoryId)) {
      this.renderChannels(this.categoryChannelsCache.get(categoryId));
      return;
    }

    // 3. Fetch from Xtream on-demand (Lightweight & Instantaneous!)
    if (this.account && this.account.type === 'xtream') {
      this.showChannelLoading('Carregando canais...');
      try {
        const streams = await xtreamService.getLiveStreams(
          this.account.serverUrl,
          this.account.username,
          this.account.password,
          categoryId
        );

        const formatted = streams.map((s, idx) => ({
          id: String(s.stream_id),
          num: s.num || idx + 1,
          name: s.name,
          category: categoryId,
          logo: s.stream_icon,
          streamUrl: xtreamService.getLiveStreamUrl(this.account.serverUrl, this.account.username, this.account.password, s.stream_id),
          epg: {
            current: { title: s.epg_channel_id || 'Transmissão ao vivo', start: 'Ao Vivo', end: '' }
          }
        }));

        this.categoryChannelsCache.set(categoryId, formatted);

        // Render if user is still on this category
        if (this.selectedCategory === categoryId) {
          this.renderChannels(formatted);
        }
      } catch (err) {
        console.error('[LiveView] Failed to fetch channels for category:', err);
        this.showChannelError('Falha ao carregar canais desta categoria.');
      }
      return;
    }

    // 4. Fallback for pre-loaded/mock channels
    const filtered = this.channels.filter(ch => String(ch.category) === String(categoryId));
    this.renderChannels(filtered);
  }

  showChannelLoading(text) {
    const listEl = this.container.querySelector('#live-channels-list');
    const badgeEl = this.container.querySelector('#live-channel-count-badge');
    badgeEl.textContent = '...';
    listEl.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:200px; gap:12px; color:var(--text-secondary);">
        <div class="tv-spinner"></div>
        <span style="font-size:13px; font-weight:600;">${text}</span>
      </div>
    `;
  }

  showChannelError(text) {
    const listEl = this.container.querySelector('#live-channels-list');
    listEl.innerHTML = `
      <div style="padding:40px 20px; text-align:center; color:var(--status-danger); font-size:14px;">
        ${text}
      </div>
    `;
  }

  filterChannels() {
    const filterText = this.container.querySelector('#live-filter-input').value.toLowerCase().trim();
    let currentList = [];

    if (this.selectedCategory === 'favorites') {
      currentList = storage.getFavorites().filter(f => f.type === 'live').map(f => f.data);
    } else if (this.categoryChannelsCache.has(this.selectedCategory)) {
      currentList = this.categoryChannelsCache.get(this.selectedCategory);
    } else {
      currentList = this.channels;
    }

    if (filterText) {
      currentList = currentList.filter(ch => ch.name.toLowerCase().includes(filterText));
    }

    this.renderChannels(currentList, false);
  }

  renderChannels(channels, autoSelectFirst = true) {
    const listEl = this.container.querySelector('#live-channels-list');
    const badgeEl = this.container.querySelector('#live-channel-count-badge');
    badgeEl.textContent = `(${channels.length})`;
    listEl.innerHTML = '';

    if (channels.length === 0) {
      listEl.innerHTML = `<div style="padding:40px 20px; text-align:center; color:var(--text-muted); font-size:14px;">Nenhum canal encontrado nesta categoria.</div>`;
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
          this.renderChannels(channels, false);
          return;
        }

        // ==============================================================
        // 2-CLICK UX:
        // 1st click on channel -> Plays Preview
        // 2nd click on currently selected channel -> ENTERS FULLSCREEN!
        // ==============================================================
        if (this.selectedChannel && this.selectedChannel.id === ch.id) {
          this.stopPreview();
          this.onPlayFullscreen(ch, channels);
          return;
        }

        // 1st Click: Select channel and start preview
        this.selectChannel(ch, channels, true);
      });

      listEl.appendChild(item);
    });

    // Auto-select first channel in list if none selected
    if (autoSelectFirst && channels.length > 0) {
      this.selectChannel(channels[0], channels, true);
    }
  }

  selectChannel(channel, channelList = [], autoplay = true) {
    this.selectedChannel = channel;

    // Highlight item
    this.container.querySelectorAll('.tv-channel-item').forEach(el => {
      el.classList.toggle('active', el.dataset.id === channel.id);
    });

    // Update EPG Details
    this.container.querySelector('#preview-ch-name').textContent = `${channel.num ? `${channel.num}. ` : ''}${channel.name}`;
    
    // Logo
    const logoImg = this.container.querySelector('#preview-ch-logo');
    const logoFallback = this.container.querySelector('#preview-ch-fallback-logo');
    if (channel.logo) {
      logoImg.src = channel.logo;
      logoImg.style.display = 'block';
      logoFallback.style.display = 'none';
    } else {
      logoImg.style.display = 'none';
      logoFallback.style.display = 'block';
    }

    const epg = channel.epg || {};
    if (epg.current) {
      this.container.querySelector('#preview-prog-title').textContent = epg.current.title;
      this.container.querySelector('#preview-time-start').textContent = epg.current.start || 'Agora';
      this.container.querySelector('#preview-time-end').textContent = epg.current.end || 'Ao Vivo';
      this.container.querySelector('#preview-prog-desc').textContent = epg.current.desc || 'Acompanhe a programação com alta estabilidade e resolução original.';
    } else {
      this.container.querySelector('#preview-prog-title').textContent = 'Programação ao vivo';
      this.container.querySelector('#preview-time-start').textContent = 'Agora';
      this.container.querySelector('#preview-time-end').textContent = 'Ao Vivo';
      this.container.querySelector('#preview-prog-desc').textContent = 'Pressione OK novamente para assistir em tela cheia com troca rápida de canais.';
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
    if (autoplay && channel.streamUrl) {
      this.startPreview(channel.streamUrl);
    }
  }

  startPreview(url) {
    const video = this.container.querySelector('#live-preview-video');
    this.stopPreview();

    const isHls = url.includes('.m3u8') || url.includes('type=m3u8');
    if (isHls && Hls.isSupported()) {
      try {
        this.previewHls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 10
        });
        this.previewHls.loadSource(url);
        this.previewHls.attachMedia(video);
        this.previewHls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
        });
      } catch (e) {
        console.warn('[LiveView] HLS startPreview error:', e);
      }
    } else {
      video.src = url;
      video.play().catch(() => {});
    }
  }

  stopPreview() {
    if (this.previewHls) {
      try {
        this.previewHls.stopLoad();
        this.previewHls.detachMedia();
        this.previewHls.destroy();
      } catch (e) {
        console.warn('[LiveView] Hls destroy note:', e);
      }
      this.previewHls = null;
    }
    const video = this.container?.querySelector('#live-preview-video');
    if (video) {
      try {
        video.pause();
        video.removeAttribute('src');
        video.load(); // Vital for clearing Android hardware MediaCodec buffer!
      } catch (e) {
        console.warn('[LiveView] Video reset note:', e);
      }
    }
  }

  bindEvents() {
    this.container.querySelector('#live-filter-input').addEventListener('input', () => {
      this.filterChannels();
    });

    // Preview video click -> Fullscreen
    this.container.querySelector('#live-preview-box').addEventListener('click', () => {
      if (this.selectedChannel) {
        this.stopPreview();
        const currentList = this.categoryChannelsCache.get(this.selectedCategory) || this.channels;
        this.onPlayFullscreen(this.selectedChannel, currentList);
      }
    });

    this.container.querySelector('#live-fullscreen-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.selectedChannel) {
        this.stopPreview();
        const currentList = this.categoryChannelsCache.get(this.selectedCategory) || this.channels;
        this.onPlayFullscreen(this.selectedChannel, currentList);
      }
    });

    this.container.querySelector('#preview-fav-toggle-btn').addEventListener('click', () => {
      if (!this.selectedChannel) return;
      const added = storage.toggleFavorite('live', this.selectedChannel);
      toast.info(added ? 'Favoritado' : 'Removido', `${this.selectedChannel.name} ${added ? 'adicionado aos favoritos' : 'removido dos favoritos'}`);
      this.renderCategories();
      const currentList = this.categoryChannelsCache.get(this.selectedCategory) || this.channels;
      this.renderChannels(currentList, false);
      this.selectChannel(this.selectedChannel, currentList, false);
    });
  }
}
