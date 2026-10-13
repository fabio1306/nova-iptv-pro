// ==========================================================================
// WATCH HISTORY VIEW - RECENTS & RESUME PLAYBACK
// ==========================================================================

import { storage } from '../services/storage.service.js';
import { toast } from '../components/toast.js';

export class HistoryView {
  constructor(options = {}) {
    this.onPlay = options.onPlay || (() => {});
    this.container = null;
  }

  render(parentElement) {
    this.container = document.createElement('div');
    this.container.className = 'tv-view';
    this.container.id = 'view-history';

    this.container.innerHTML = `
      <div style="max-width: 1200px; margin: 0 auto; width: 100%;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px; margin-bottom:24px;">
          <div>
            <h1 style="font-size:28px; font-weight:800; color:#fff;">🕒 Histórico de Reprodução</h1>
            <p style="font-size:14px; color:var(--text-secondary); margin-top:4px;">Últimos canais e conteúdos assistidos nesta Smart TV</p>
          </div>

          <button class="tv-btn tv-btn-danger tv-btn-sm tv-focusable" id="hist-clear-btn">
            Limpar Todo o Histórico
          </button>
        </div>

        <div id="hist-list-container" style="display:flex; flex-direction:column; gap:12px; max-height:calc(100vh - 220px); overflow-y:auto; padding-bottom:30px;"></div>
      </div>
    `;

    parentElement.appendChild(this.container);
    this.bindEvents();
    this.updateData();
  }

  bindEvents() {
    this.container.querySelector('#hist-clear-btn').addEventListener('click', () => {
      storage.clearHistory();
      toast.info('Histórico limpo', 'O histórico de reprodução foi apagado com sucesso.');
      this.updateData();
    });
  }

  updateData() {
    const history = storage.getHistory();
    const container = this.container.querySelector('#hist-list-container');
    container.innerHTML = '';

    if (history.length === 0) {
      container.innerHTML = `
        <div style="padding: 60px 20px; text-align:center;">
          <div style="font-size:48px; margin-bottom:12px;">🕒</div>
          <h3 style="font-size:18px; font-weight:700; color:#fff;">Histórico vazio</h3>
          <p style="font-size:14px; color:var(--text-secondary); margin-top:6px;">
            Os conteúdos que você assistir aparecerão aqui para fácil continuação.
          </p>
        </div>
      `;
      return;
    }

    history.forEach(item => {
      const row = document.createElement('div');
      row.className = 'tv-focusable';
      row.tabIndex = 0;
      row.style.cssText = 'display:flex; align-items:center; justify-content:space-between; padding:16px 20px; background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:var(--radius-lg); cursor:pointer;';

      const dateStr = item.watchedAt ? new Date(item.watchedAt).toLocaleString('pt-BR') : '';

      row.innerHTML = `
        <div style="display:flex; align-items:center; gap:16px; flex:1;" class="truncate">
          ${item.logo || item.poster ? `
            <div class="tv-channel-logo-wrap" style="width:44px; height:44px;">
              <img class="tv-channel-logo" src="${item.logo || item.poster}" alt="">
            </div>
          ` : ''}
          <div class="truncate">
            <div style="font-size:15px; font-weight:700; color:#fff;" class="truncate">${item.name || item.title}</div>
            <div style="font-size:12px; color:var(--text-secondary); margin-top:2px;">
              Assistido em: ${dateStr} • ${item.category || item.genre || 'Vídeo'}
            </div>
          </div>
        </div>

        <button class="tv-btn tv-btn-sm tv-btn-primary tv-focusable hist-resume-btn">
          ▶ Continuar Assistindo
        </button>
      `;

      row.addEventListener('click', () => {
        this.onPlay(item);
      });

      container.appendChild(row);
    });
  }
}
