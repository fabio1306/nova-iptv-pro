// ==========================================================================
// VIRTUAL SMART TV REMOTE COMPONENT (TESTING & REMOTE CONTROL SIMULATOR)
// ==========================================================================

import { tvNav } from '../services/tv-navigation.service.js';

import { storage } from '../services/storage.service.js';

export class VirtualRemoteComponent {
  constructor() {
    this.container = null;
    this.widgetEl = null;
  }

  updateVisibility() {
    const settings = storage.getSettings();
    const btn = this.container?.querySelector('#remote-toggle-btn');
    const widget = this.container?.querySelector('#remote-widget');
    if (btn) {
      btn.style.display = settings.showVirtualRemote ? 'flex' : 'none';
    }
    if (!settings.showVirtualRemote && widget) {
      widget.classList.remove('visible');
    }
  }

  render(parentElement = document.body) {
    this.container = document.createElement('div');
    this.container.id = 'virtual-remote-root';
    const settings = storage.getSettings();
    const isVisible = settings.showVirtualRemote;

    this.container.innerHTML = `
      <!-- Floating Toggle Pill (Hidden on Smart TV, visible only if enabled on PC) -->
      <button class="tv-remote-toggle-btn" id="remote-toggle-btn" title="Abrir Controle Remoto Virtual" style="display: ${isVisible ? 'flex' : 'none'};">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17 1H7c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm0 18H7V5h10v14zm-4-8h-2v2h2v-2zm-3-4h-2v2h2V7zm6 0h-2v2h2V7zm-3 8h-2v2h2v-2z"/></svg>
        Controle TV (PC)
      </button>

      <!-- Remote Control Controller Widget -->
      <div class="tv-remote-widget" id="remote-widget">
        <div class="tv-remote-header">
          <span class="tv-remote-title">Controle Remoto TV</span>
          <span class="tv-remote-close" id="remote-close-btn">✕</span>
        </div>

        <!-- D-Pad Directional Arrows -->
        <div class="tv-dpad-container">
          <button class="tv-dpad-btn up" id="remote-up" title="Cima">▲</button>
          <button class="tv-dpad-btn left" id="remote-left" title="Esquerda">◀</button>
          <button class="tv-dpad-center-ok" id="remote-ok" title="OK / Selecionar">OK</button>
          <button class="tv-dpad-btn right" id="remote-right" title="Direita">▶</button>
          <button class="tv-dpad-btn down" id="remote-down" title="Baixo">▼</button>
        </div>

        <!-- Back and Home Buttons -->
        <div class="tv-remote-actions-row">
          <button class="tv-remote-pill-btn" id="remote-back" title="Voltar (ESC)">
            ↩ Voltar
          </button>
          <button class="tv-remote-pill-btn" id="remote-home" title="Início">
            ⌂ Início
          </button>
        </div>

        <!-- TV Colors (Red, Green, Yellow, Blue) -->
        <div class="tv-remote-colors-row">
          <div class="tv-color-dot tv-color-red" id="remote-red" title="Vermelho"></div>
          <div class="tv-color-dot tv-color-green" id="remote-green" title="Verde"></div>
          <div class="tv-color-dot tv-color-yellow" id="remote-yellow" title="Amarelo"></div>
          <div class="tv-color-dot tv-color-blue" id="remote-blue" title="Azul"></div>
        </div>
      </div>
    `;

    parentElement.appendChild(this.container);
    this.widgetEl = this.container.querySelector('#remote-widget');
    this.bindEvents();
  }

  bindEvents() {
    const toggleBtn = this.container.querySelector('#remote-toggle-btn');
    const closeBtn = this.container.querySelector('#remote-close-btn');

    toggleBtn.addEventListener('click', () => {
      this.widgetEl.classList.toggle('visible');
    });

    closeBtn.addEventListener('click', () => {
      this.widgetEl.classList.remove('visible');
    });

    // Remote D-Pad Actions
    this.container.querySelector('#remote-up').addEventListener('click', () => tvNav.simulateKey('up'));
    this.container.querySelector('#remote-down').addEventListener('click', () => tvNav.simulateKey('down'));
    this.container.querySelector('#remote-left').addEventListener('click', () => tvNav.simulateKey('left'));
    this.container.querySelector('#remote-right').addEventListener('click', () => tvNav.simulateKey('right'));
    this.container.querySelector('#remote-ok').addEventListener('click', () => tvNav.simulateKey('ok'));
    this.container.querySelector('#remote-back').addEventListener('click', () => tvNav.simulateKey('back'));
    this.container.querySelector('#remote-home').addEventListener('click', () => {
      document.querySelector('#nav-brand-btn')?.click();
    });

    // Colors
    this.container.querySelector('#remote-red').addEventListener('click', () => tvNav.simulateKey('red'));
    this.container.querySelector('#remote-green').addEventListener('click', () => tvNav.simulateKey('green'));
    this.container.querySelector('#remote-yellow').addEventListener('click', () => tvNav.simulateKey('yellow'));
    this.container.querySelector('#remote-blue').addEventListener('click', () => tvNav.simulateKey('blue'));
  }
}
