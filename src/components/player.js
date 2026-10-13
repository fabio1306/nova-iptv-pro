// ==========================================================================
// VIDEO PLAYER COMPONENT - HLS.JS, SMART TV OSD, ZAPPING & RECOVERY
// ==========================================================================

import Hls from 'hls.js';
import { storage } from '../services/storage.service.js';
import { toast } from './toast.js';
import { tvNav } from '../services/tv-navigation.service.js';

export class PlayerComponent {
  constructor(options = {}) {
    this.onClose = options.onClose || (() => {});
    this.container = null;
    this.videoEl = null;
    this.hlsInstance = null;
    this.currentContent = null;
    this.channelList = [];
    this.channelIndex = -1;

    this.osdTimeout = null;
    this.isOsdVisible = true;
    this.isLive = true;
    this.aspectRatios = ['contain', 'cover', 'fill'];
    this.currentAspectIdx = 0;
  }

  init() {
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.className = 'tv-player-container';
    this.container.innerHTML = `
      <video class="tv-player-video" id="player-video" playsinline></video>

      <!-- Buffering & Status Overlay -->
      <div class="tv-player-status-overlay" id="player-status-overlay" style="display:none;">
        <div class="tv-spinner tv-spinner-lg" id="player-spinner"></div>
        <div class="tv-player-status-text" id="player-status-text">Carregando transmissão...</div>
        <button class="tv-btn tv-btn-primary tv-btn-sm tv-focusable" id="player-retry-btn" style="display:none; pointer-events:auto;">
          Tentar Novamente
        </button>
      </div>

      <!-- Quick Channel Drawer Overlay -->
      <div class="tv-player-channels-drawer" id="player-channel-drawer">
        <div style="padding:20px; border-bottom:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center;">
          <h3 style="font-size:16px; font-weight:800; color:#fff;">Lista Rápida de Canais</h3>
          <span style="font-size:12px; color:var(--text-secondary);" id="drawer-total-count">0 canais</span>
        </div>
        <div style="flex:1; overflow-y:auto; padding:10px; display:flex; flex-direction:column; gap:6px;" id="drawer-channels-list"></div>
      </div>

      <!-- TV OSD Overlay -->
      <div class="tv-osd-overlay" id="player-osd">
        <!-- Top Bar -->
        <div class="tv-osd-top">
          <div class="tv-osd-title-block">
            <span class="tv-osd-channel-num" id="osd-channel-num"></span>
            <div>
              <div class="tv-osd-channel-name" id="osd-title">Reproduzindo</div>
              <div class="tv-osd-now-playing" id="osd-subtitle">Transmissão ao vivo</div>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:16px;">
            <button class="tv-btn tv-btn-sm tv-focusable" id="osd-channels-drawer-btn" style="background:rgba(255,255,255,0.1);">
              📺 Canais (OK)
            </button>
            <button class="tv-btn tv-btn-danger tv-btn-sm tv-focusable" id="osd-close-btn">
              ✕ Sair
            </button>
          </div>
        </div>

        <!-- Center Click to toggle play/pause -->
        <div style="flex:1; cursor:pointer;" id="osd-center-touch-area"></div>

        <!-- Bottom Controls -->
        <div class="tv-osd-bottom">
          <div class="tv-osd-progress-wrap" id="osd-progress-container" style="display:none;">
            <span class="tv-osd-time-text" id="osd-time-current">00:00</span>
            <div class="tv-osd-seek-bar tv-focusable" id="osd-seek-bar" tabindex="0">
              <div class="tv-osd-seek-fill" id="osd-seek-fill"></div>
            </div>
            <span class="tv-osd-time-text" id="osd-time-total">00:00</span>
          </div>

          <div class="tv-osd-controls">
            <div class="tv-osd-buttons-group">
              <button class="tv-osd-btn tv-focusable" id="osd-prev-btn" title="Canal / Item Anterior">
                <svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
              </button>

              <button class="tv-osd-btn tv-focusable" id="osd-rewind-btn" title="Retroceder 10s" style="display:none;">
                <svg viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8zm-1.1 11h-.85v-3.26l-1.01.31v-.59l1.8-.63h.06V16zm4.29-1.74c0 .65-.17 1.14-.5 1.48-.34.34-.8.51-1.39.51-.58 0-1.04-.17-1.38-.51-.34-.34-.51-.83-.51-1.48v-1.1c0-.65.17-1.14.51-1.48.34-.34.8-.51 1.38-.51.59 0 1.05.17 1.39.51.33.34.5.83.5 1.48v1.1zm-.81-1.22c0-.46-.08-.8-.25-1.01-.16-.21-.42-.32-.78-.32s-.62.11-.78.32c-.16.21-.24.55-.24 1.01v1.34c0 .46.08.79.24 1 .16.21.42.31.78.31s.62-.1.78-.31c.17-.21.25-.54.25-1v-1.34z"/></svg>
              </button>

              <button class="tv-osd-btn tv-focusable" id="osd-play-btn" title="Play / Pause" style="width:60px; height:60px; background:var(--primary); color:#000;">
                <svg id="osd-play-icon" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </button>

              <button class="tv-osd-btn tv-focusable" id="osd-forward-btn" title="Avançar 10s" style="display:none;">
                <svg viewBox="0 0 24 24"><path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8zm-1.1 11h-.85v-3.26l-1.01.31v-.59l1.8-.63h.06V16zm4.29-1.74c0 .65-.17 1.14-.5 1.48-.34.34-.8.51-1.39.51-.58 0-1.04-.17-1.38-.51-.34-.34-.51-.83-.51-1.48v-1.1c0-.65.17-1.14.51-1.48.34-.34.8-.51 1.38-.51.59 0 1.05.17 1.39.51.33.34.5.83.5 1.48v1.1zm-.81-1.22c0-.46-.08-.8-.25-1.01-.16-.21-.42-.32-.78-.32s-.62.11-.78.32c-.16.21-.24.55-.24 1.01v1.34c0 .46.08.79.24 1 .16.21.42.31.78.31s.62-.1.78-.31c.17-.21.25-.54.25-1v-1.34z"/></svg>
              </button>

              <button class="tv-osd-btn tv-focusable" id="osd-next-btn" title="Próximo Canal / Item">
                <svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
              </button>
            </div>

            <div class="tv-osd-buttons-group">
              <button class="tv-btn tv-btn-sm tv-focusable" id="osd-aspect-btn" title="Proporção de Tela">
                Aspecto: Ajustar
              </button>

              <button class="tv-osd-btn tv-focusable" id="osd-mute-btn" title="Mudo">
                <svg id="osd-vol-icon" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
              </button>

              <button class="tv-osd-btn tv-focusable" id="osd-fullscreen-btn" title="Tela Cheia">
                <svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);
    this.videoEl = this.container.querySelector('#player-video');
    this.bindEvents();
  }

  play(content, channelList = []) {
    this.init();
    this.currentContent = content;
    this.channelList = channelList;
    this.channelIndex = channelList.findIndex(c => c.id === content.id);

    this.container.classList.add('active');
    this.isLive = content.type === 'live' || (!content.duration && !content.type);

    this.updateTitles();
    this.updateControlsVisibility();
    this.loadStream(content.streamUrl);

    // Save history
    storage.addToHistory(content);

    // Contextual back registered
    tvNav.pushBackHandler(() => {
      this.close();
      return true;
    });

    this.showOsd();
    tvNav.setFocus(this.container.querySelector('#osd-play-btn'));
  }

  loadStream(url) {
    this.showStatus('Conectando ao fluxo...', true);

    if (this.hlsInstance) {
      this.hlsInstance.destroy();
      this.hlsInstance = null;
    }

    const isHls = url.includes('.m3u8') || url.includes('type=m3u8');

    if (isHls && Hls.isSupported()) {
      this.hlsInstance = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60
      });

      this.hlsInstance.loadSource(url);
      this.hlsInstance.attachMedia(this.videoEl);

      this.hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
        this.hideStatus();
        this.videoEl.play().catch(e => console.warn('AutoPlay note:', e));
      });

      this.hlsInstance.on(Hls.Events.ERROR, (event, data) => {
        console.error('[Player] HLS Error:', data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              this.showError('Falha de rede ao reproduzir transmissão.');
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              this.hlsInstance.recoverMediaError();
              break;
            default:
              this.showError('Erro incompatível no stream.');
              this.hlsInstance.destroy();
              break;
          }
        }
      });
    } else {
      // Native HTML5 Video playback (MP4 / WebM / Browser HLS)
      this.videoEl.src = url;
      this.videoEl.load();

      // Check for saved playback position (resume)
      if (!this.isLive) {
        const savedPos = storage.getPlaybackPosition(this.currentContent.id);
        if (savedPos > 10) {
          this.videoEl.currentTime = savedPos;
          toast.info('Continuando', `Retomando de onde você parou.`);
        }
      }

      this.videoEl.play()
        .then(() => this.hideStatus())
        .catch(err => {
          console.warn('[Player] HTML5 Play Error:', err);
          this.showError('Não foi possível iniciar a reprodução.');
        });
    }
  }

  updateTitles() {
    const numEl = this.container.querySelector('#osd-channel-num');
    const titleEl = this.container.querySelector('#osd-title');
    const subEl = this.container.querySelector('#osd-subtitle');

    if (this.currentContent.num) {
      numEl.textContent = this.currentContent.num;
      numEl.style.display = 'block';
    } else {
      numEl.style.display = 'none';
    }

    titleEl.textContent = this.currentContent.name || this.currentContent.title || 'Conteúdo IPTV';

    if (this.currentContent.epg?.current) {
      subEl.textContent = `Agora: ${this.currentContent.epg.current.title}`;
    } else if (this.currentContent.genre) {
      subEl.textContent = `${this.currentContent.genre} • ${this.currentContent.year || ''}`;
    } else {
      subEl.textContent = this.isLive ? 'Canal ao vivo' : 'Vídeo sob demanda';
    }
  }

  updateControlsVisibility() {
    const progWrap = this.container.querySelector('#osd-progress-container');
    const rewindBtn = this.container.querySelector('#osd-rewind-btn');
    const forwardBtn = this.container.querySelector('#osd-forward-btn');

    if (this.isLive) {
      progWrap.style.display = 'none';
      rewindBtn.style.display = 'none';
      forwardBtn.style.display = 'none';
    } else {
      progWrap.style.display = 'flex';
      rewindBtn.style.display = 'flex';
      forwardBtn.style.display = 'flex';
    }
  }

  bindEvents() {
    const playBtn = this.container.querySelector('#osd-play-btn');
    const playIcon = this.container.querySelector('#osd-play-icon');

    playBtn.addEventListener('click', () => {
      if (this.videoEl.paused) {
        this.videoEl.play();
      } else {
        this.videoEl.pause();
      }
    });

    this.videoEl.addEventListener('play', () => {
      playIcon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
    });

    this.videoEl.addEventListener('pause', () => {
      playIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';
    });

    // Time update for VOD
    this.videoEl.addEventListener('timeupdate', () => {
      if (this.isLive) return;
      const cur = this.videoEl.currentTime;
      const dur = this.videoEl.duration || 0;

      this.container.querySelector('#osd-time-current').textContent = this.formatTime(cur);
      this.container.querySelector('#osd-time-total').textContent = this.formatTime(dur);

      if (dur > 0) {
        const pct = (cur / dur) * 100;
        this.container.querySelector('#osd-seek-fill').style.width = `${pct}%`;
        // Save resume position periodically
        if (Math.floor(cur) % 5 === 0) {
          storage.savePlaybackPosition(this.currentContent.id, cur);
        }
      }
    });

    // Seeking on click
    const seekBar = this.container.querySelector('#osd-seek-bar');
    seekBar.addEventListener('click', (e) => {
      const rect = seekBar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const pct = clickX / rect.width;
      if (this.videoEl.duration) {
        this.videoEl.currentTime = pct * this.videoEl.duration;
      }
    });

    // Fast forward / Rewind
    this.container.querySelector('#osd-forward-btn').addEventListener('click', () => {
      this.videoEl.currentTime = Math.min(this.videoEl.duration || 0, this.videoEl.currentTime + 10);
    });

    this.container.querySelector('#osd-rewind-btn').addEventListener('click', () => {
      this.videoEl.currentTime = Math.max(0, this.videoEl.currentTime - 10);
    });

    // Channel Switching (Next / Prev)
    this.container.querySelector('#osd-next-btn').addEventListener('click', () => this.nextChannel());
    this.container.querySelector('#osd-prev-btn').addEventListener('click', () => this.prevChannel());

    // Aspect Ratio toggle
    const aspectBtn = this.container.querySelector('#osd-aspect-btn');
    aspectBtn.addEventListener('click', () => {
      this.currentAspectIdx = (this.currentAspectIdx + 1) % this.aspectRatios.length;
      const mode = this.aspectRatios[this.currentAspectIdx];
      this.videoEl.style.objectFit = mode;
      const labels = { contain: 'Ajustar', cover: 'Preencher', fill: 'Esticar' };
      aspectBtn.textContent = `Aspecto: ${labels[mode]}`;
    });

    // Mute button
    const muteBtn = this.container.querySelector('#osd-mute-btn');
    const volIcon = this.container.querySelector('#osd-vol-icon');
    muteBtn.addEventListener('click', () => {
      this.videoEl.muted = !this.videoEl.muted;
      if (this.videoEl.muted) {
        volIcon.innerHTML = '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>';
      } else {
        volIcon.innerHTML = '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>';
      }
    });

    // Close Button
    this.container.querySelector('#osd-close-btn').addEventListener('click', () => this.close());

    // Retry Button
    this.container.querySelector('#player-retry-btn').addEventListener('click', () => {
      this.loadStream(this.currentContent.streamUrl);
    });

    // Channel Drawer Toggle
    const drawerBtn = this.container.querySelector('#osd-channels-drawer-btn');
    drawerBtn.addEventListener('click', () => this.toggleDrawer());

    // Touch center area to toggle OSD
    this.container.querySelector('#osd-center-touch-area').addEventListener('click', () => {
      if (this.isOsdVisible) {
        this.hideOsd();
      } else {
        this.showOsd();
      }
    });

    // Show OSD on interaction
    this.container.addEventListener('mousemove', () => this.showOsd());
  }

  nextChannel() {
    if (this.channelList.length <= 1) return;
    this.channelIndex = (this.channelIndex + 1) % this.channelList.length;
    this.play(this.channelList[this.channelIndex], this.channelList);
  }

  prevChannel() {
    if (this.channelList.length <= 1) return;
    this.channelIndex = (this.channelIndex - 1 + this.channelList.length) % this.channelList.length;
    this.play(this.channelList[this.channelIndex], this.channelList);
  }

  toggleDrawer() {
    const drawer = this.container.querySelector('#player-channel-drawer');
    const isOpen = drawer.classList.contains('open');

    if (isOpen) {
      drawer.classList.remove('open');
    } else {
      this.renderDrawerList();
      drawer.classList.add('open');
      tvNav.focusFirstVisible(drawer);
    }
  }

  renderDrawerList() {
    const listEl = this.container.querySelector('#drawer-channels-list');
    const totalEl = this.container.querySelector('#drawer-total-count');
    totalEl.textContent = `${this.channelList.length} canais`;

    listEl.innerHTML = this.channelList.map((ch, idx) => `
      <div class="tv-focusable" style="display:flex; align-items:center; gap:12px; padding:10px 14px; border-radius:var(--radius-md); background:rgba(255,255,255,0.03); cursor:pointer; ${ch.id === this.currentContent.id ? 'border:1px solid var(--primary);' : ''}" data-idx="${idx}">
        <span style="font-size:12px; font-weight:700; color:var(--text-muted); width:24px;">${ch.num || idx + 1}</span>
        <div style="font-size:13px; font-weight:700; color:#fff;" class="truncate">${ch.name}</div>
      </div>
    `).join('');

    listEl.querySelectorAll('[data-idx]').forEach(item => {
      item.addEventListener('click', (e) => {
        const idx = Number(e.currentTarget.dataset.idx);
        this.toggleDrawer();
        this.play(this.channelList[idx], this.channelList);
      });
    });
  }

  showOsd() {
    const osd = this.container?.querySelector('#player-osd');
    if (!osd) return;
    osd.classList.remove('hidden');
    this.isOsdVisible = true;

    if (this.osdTimeout) clearTimeout(this.osdTimeout);
    this.osdTimeout = setTimeout(() => {
      this.hideOsd();
    }, 4500);
  }

  hideOsd() {
    const osd = this.container?.querySelector('#player-osd');
    if (!osd) return;
    osd.classList.add('hidden');
    this.isOsdVisible = false;
  }

  showStatus(text, isBuffering = false) {
    const overlay = this.container.querySelector('#player-status-overlay');
    const statusText = this.container.querySelector('#player-status-text');
    const spinner = this.container.querySelector('#player-spinner');
    const retryBtn = this.container.querySelector('#player-retry-btn');

    statusText.textContent = text;
    spinner.style.display = isBuffering ? 'block' : 'none';
    retryBtn.style.display = 'none';
    overlay.style.display = 'flex';
  }

  showError(text) {
    const overlay = this.container.querySelector('#player-status-overlay');
    const statusText = this.container.querySelector('#player-status-text');
    const spinner = this.container.querySelector('#player-spinner');
    const retryBtn = this.container.querySelector('#player-retry-btn');

    statusText.textContent = text;
    spinner.style.display = 'none';
    retryBtn.style.display = 'inline-flex';
    overlay.style.display = 'flex';
    tvNav.setFocus(retryBtn);
  }

  hideStatus() {
    const overlay = this.container.querySelector('#player-status-overlay');
    overlay.style.display = 'none';
  }

  formatTime(secs) {
    if (!secs || isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  close() {
    if (this.hlsInstance) {
      this.hlsInstance.destroy();
      this.hlsInstance = null;
    }
    if (this.videoEl) {
      this.videoEl.pause();
      this.videoEl.removeAttribute('src');
      this.videoEl.load();
    }
    if (this.container) {
      this.container.classList.remove('active');
    }
    if (this.osdTimeout) clearTimeout(this.osdTimeout);

    this.onClose();
  }
}
