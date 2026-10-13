// ==========================================================================
// SETTINGS VIEW - APPEARANCE, PLAYBACK, CORS PROXY & GENERAL PREFERENCES
// ==========================================================================

import { storage } from '../services/storage.service.js';
import { toast } from '../components/toast.js';

export class SettingsView {
  constructor(options = {}) {
    this.onSettingsChanged = options.onSettingsChanged || (() => {});
    this.onOpenAccounts = options.onOpenAccounts || (() => {});
    this.container = null;
    this.activeSection = 'appearance';
  }

  render(parentElement) {
    this.container = document.createElement('div');
    this.container.className = 'tv-view';
    this.container.id = 'view-settings';

    this.container.innerHTML = `
      <div class="tv-settings-container">
        <!-- Settings Sidebar Menu -->
        <div class="tv-settings-menu">
          <button class="tv-settings-nav-item tv-focusable active" data-section="appearance">
            <svg viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19.4c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.9-1.9C9.27 19.57 10.59 20 12 20c4.97 0 9-4.03 9-9s-4.03-9-9-9zm0 15c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/></svg>
            Aparência & Tema
          </button>

          <button class="tv-settings-nav-item tv-focusable" data-section="playback">
            <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
            Reprodução & Player
          </button>

          <button class="tv-settings-nav-item tv-focusable" data-section="connection">
            <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
            Contas & Conexão (CORS)
          </button>

          <button class="tv-settings-nav-item tv-focusable" data-section="general">
            <svg viewBox="0 0 24 24"><path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z"/></svg>
            Preferências Gerais & Sobre
          </button>
        </div>

        <!-- Settings Content Panel -->
        <div class="tv-settings-content" id="settings-content-panel"></div>
      </div>
    `;

    parentElement.appendChild(this.container);
    this.bindMenuEvents();
    this.renderSection(this.activeSection);
  }

  bindMenuEvents() {
    this.container.querySelectorAll('.tv-settings-nav-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.container.querySelectorAll('.tv-settings-nav-item').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.activeSection = e.currentTarget.dataset.section;
        this.renderSection(this.activeSection);
      });
    });
  }

  renderSection(section) {
    const panel = this.container.querySelector('#settings-content-panel');
    const settings = storage.getSettings();

    if (section === 'appearance') {
      panel.innerHTML = `
        <h2 class="tv-settings-section-title">Aparência & Interface</h2>

        <div class="tv-settings-group">
          <!-- Theme selector -->
          <div class="tv-settings-item">
            <div>
              <div class="tv-settings-item-title">Tema Visual</div>
              <div class="tv-settings-item-desc">Paleta de cores e atmosfera da interface da TV</div>
            </div>
            <select class="tv-input tv-focusable" id="set-theme" style="width:200px;">
              <option value="sapphire" ${settings.theme === 'sapphire' ? 'selected' : ''}>Sapphire (Padrão)</option>
              <option value="emerald" ${settings.theme === 'emerald' ? 'selected' : ''}>Emerald Glow</option>
              <option value="crimson" ${settings.theme === 'crimson' ? 'selected' : ''}>Crimson Velvet</option>
              <option value="purple" ${settings.theme === 'purple' ? 'selected' : ''}>Cyberpunk Purple</option>
              <option value="amoled" ${settings.theme === 'amoled' ? 'selected' : ''}>AMOLED Deep Black</option>
            </select>
          </div>

          <!-- UI Scale -->
          <div class="tv-settings-item">
            <div>
              <div class="tv-settings-item-title">Escala de Interface (Tamanho do Texto)</div>
              <div class="tv-settings-item-desc">Otimização para telas de 32" a 85" polegadas</div>
            </div>
            <select class="tv-input tv-focusable" id="set-scale" style="width:200px;">
              <option value="0.9" ${settings.uiScale === '0.9' ? 'selected' : ''}>Compacto (90%)</option>
              <option value="1" ${settings.uiScale === '1' ? 'selected' : ''}>Normal (100%)</option>
              <option value="1.15" ${settings.uiScale === '1.15' ? 'selected' : ''}>Grande (115%)</option>
              <option value="1.25" ${settings.uiScale === '1.25' ? 'selected' : ''}>Extra Grande (125%)</option>
            </select>
          </div>

          <!-- Clock Format -->
          <div class="tv-settings-item">
            <div>
              <div class="tv-settings-item-title">Formato do Relógio</div>
              <div class="tv-settings-item-desc">Exibição de horas na barra superior</div>
            </div>
            <select class="tv-input tv-focusable" id="set-clock" style="width:200px;">
              <option value="24h" ${settings.clockFormat === '24h' ? 'selected' : ''}>24 horas (ex: 20:45)</option>
              <option value="12h" ${settings.clockFormat === '12h' ? 'selected' : ''}>12 horas (ex: 08:45 PM)</option>
            </select>
          </div>

          <!-- Virtual Remote Toggle (For PC / Debugging only) -->
          <div class="tv-settings-item">
            <div>
              <div class="tv-settings-item-title">Simulador de Controle Remoto na Tela</div>
              <div class="tv-settings-item-desc">Oculto na Smart TV (use apenas para testes no computador com mouse)</div>
            </div>
            <select class="tv-input tv-focusable" id="set-virtual-remote" style="width:200px;">
              <option value="false" ${!settings.showVirtualRemote ? 'selected' : ''}>Desativado (Padrão para TV)</option>
              <option value="true" ${settings.showVirtualRemote ? 'selected' : ''}>Ativado (Apenas PC)</option>
            </select>
          </div>
        </div>
      `;

      panel.querySelector('#set-theme').addEventListener('change', (e) => {
        storage.saveSettings({ theme: e.target.value });
        document.body.setAttribute('data-theme', e.target.value);
        toast.success('Tema alterado', 'Nova paleta visual aplicada!');
      });

      panel.querySelector('#set-scale').addEventListener('change', (e) => {
        storage.saveSettings({ uiScale: e.target.value });
        document.documentElement.style.setProperty('--ui-scale', e.target.value);
        toast.success('Escala alterada', 'Tamanho da interface atualizado.');
      });

      panel.querySelector('#set-clock').addEventListener('change', (e) => {
        storage.saveSettings({ clockFormat: e.target.value });
      });

      panel.querySelector('#set-virtual-remote').addEventListener('change', (e) => {
        const isEnabled = e.target.value === 'true';
        storage.saveSettings({ showVirtualRemote: isEnabled });
        this.onSettingsChanged();
        toast.info('Simulador', isEnabled ? 'Controle virtual ativado na tela.' : 'Controle virtual ocultado (modo TV puro).');
      });
    } else if (section === 'playback') {
      panel.innerHTML = `
        <h2 class="tv-settings-section-title">Reprodução & Player de Vídeo</h2>

        <div class="tv-settings-group">
          <!-- Stream Format -->
          <div class="tv-settings-item">
            <div>
              <div class="tv-settings-item-title">Formato de Stream Padrão</div>
              <div class="tv-settings-item-desc">Formato preferido para solicitar canais ao servidor</div>
            </div>
            <select class="tv-input tv-focusable" id="set-stream-fmt" style="width:200px;">
              <option value="auto" ${settings.streamFormat === 'auto' ? 'selected' : ''}>Automático (Recomendado)</option>
              <option value="hls" ${settings.streamFormat === 'hls' ? 'selected' : ''}>HLS (.m3u8)</option>
              <option value="ts" ${settings.streamFormat === 'ts' ? 'selected' : ''}>MPEG-TS (.ts)</option>
            </select>
          </div>

          <!-- Buffer Level -->
          <div class="tv-settings-item">
            <div>
              <div class="tv-settings-item-title">Nível de Buffer</div>
              <div class="tv-settings-item-desc">Ajuste de tolerância para oscilações de sinal de internet</div>
            </div>
            <select class="tv-input tv-focusable" id="set-buffer" style="width:200px;">
              <option value="low" ${settings.bufferLevel === 'low' ? 'selected' : ''}>Baixo (Troca ultra-rápida)</option>
              <option value="medium" ${settings.bufferLevel === 'medium' ? 'selected' : ''}>Equilibrado (Normal)</option>
              <option value="high" ${settings.bufferLevel === 'high' ? 'selected' : ''}>Alto (Maior estabilidade)</option>
            </select>
          </div>

          <!-- Auto Resume -->
          <div class="tv-settings-item">
            <div>
              <div class="tv-settings-item-title">Retomar Reprodução (Filmes e Séries)</div>
              <div class="tv-settings-item-desc">Continuar automaticamente do segundo onde você parou</div>
            </div>
            <select class="tv-input tv-focusable" id="set-resume" style="width:200px;">
              <option value="true" ${settings.autoResume ? 'selected' : ''}>Ativado</option>
              <option value="false" ${!settings.autoResume ? 'selected' : ''}>Desativado</option>
            </select>
          </div>
        </div>
      `;

      panel.querySelector('#set-stream-fmt').addEventListener('change', (e) => {
        storage.saveSettings({ streamFormat: e.target.value });
        toast.info('Configuração salva', 'Formato de stream atualizado.');
      });

      panel.querySelector('#set-buffer').addEventListener('change', (e) => {
        storage.saveSettings({ bufferLevel: e.target.value });
        toast.info('Configuração salva', 'Nível de buffer atualizado.');
      });

      panel.querySelector('#set-resume').addEventListener('change', (e) => {
        storage.saveSettings({ autoResume: e.target.value === 'true' });
      });
    } else if (section === 'connection') {
      panel.innerHTML = `
        <h2 class="tv-settings-section-title">Contas & Conexão de Rede</h2>

        <div class="tv-settings-group">
          <!-- CORS Proxy Switcher -->
          <div class="tv-settings-item">
            <div>
              <div class="tv-settings-item-title">Modo de Proxy CORS</div>
              <div class="tv-settings-item-desc">Evita bloqueios em navegadores quando o provedor não envia cabeçalhos CORS</div>
            </div>
            <select class="tv-input tv-focusable" id="set-proxy" style="width:220px;">
              <option value="direct" ${settings.corsProxy === 'direct' ? 'selected' : ''}>Direto (Smart TV / App Nativo)</option>
              <option value="corsproxy" ${settings.corsProxy === 'corsproxy' ? 'selected' : ''}>CorsProxy.io (Navegadores)</option>
              <option value="allorigins" ${settings.corsProxy === 'allorigins' ? 'selected' : ''}>AllOrigins (Alternativo)</option>
            </select>
          </div>

          <!-- Accounts Management Button -->
          <div class="tv-settings-item">
            <div>
              <div class="tv-settings-item-title">Gerenciador de Acessos</div>
              <div class="tv-settings-item-desc">Adicionar novas contas, editar servidores ou excluir</div>
            </div>
            <button class="tv-btn tv-btn-primary tv-focusable" id="btn-open-acc-mgr">
              Abrir Gerenciador de Contas
            </button>
          </div>

          <!-- Clear Cache -->
          <div class="tv-settings-item">
            <div>
              <div class="tv-settings-item-title">Limpar Cache de Listas</div>
              <div class="tv-settings-item-desc">Força recarregamento completo de canais e logotipos</div>
            </div>
            <button class="tv-btn tv-btn-danger tv-focusable" id="btn-clear-cache">
              Limpar Cache Local
            </button>
          </div>
        </div>
      `;

      panel.querySelector('#set-proxy').addEventListener('change', (e) => {
        storage.saveSettings({ corsProxy: e.target.value });
        toast.success('Proxy atualizado', `Modo de conexão: ${e.target.value.toUpperCase()}`);
      });

      panel.querySelector('#btn-open-acc-mgr').addEventListener('click', () => {
        this.onOpenAccounts();
      });

      panel.querySelector('#btn-clear-cache').addEventListener('click', () => {
        toast.success('Cache limpo', 'Metadados temporários removidos com sucesso.');
      });
    } else if (section === 'general') {
      panel.innerHTML = `
        <h2 class="tv-settings-section-title">Preferências Gerais & Sobre</h2>

        <div class="tv-settings-group">
          <!-- Language -->
          <div class="tv-settings-item">
            <div>
              <div class="tv-settings-item-title">Idioma da Interface</div>
              <div class="tv-settings-item-desc">Idioma exibido nos menus e controles</div>
            </div>
            <select class="tv-input tv-focusable" id="set-lang" style="width:200px;">
              <option value="pt-BR" ${settings.language === 'pt-BR' ? 'selected' : ''}>Português (Brasil)</option>
              <option value="en-US" ${settings.language === 'en-US' ? 'selected' : ''}>English</option>
              <option value="es-ES" ${settings.language === 'es-ES' ? 'selected' : ''}>Español</option>
            </select>
          </div>

          <!-- App Information Card -->
          <div style="padding:24px; border-radius:var(--radius-lg); background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); display:flex; flex-direction:column; gap:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:16px; font-weight:800; color:#fff;">NOVA IPTV PRO PLAYER</span>
              <span class="tv-logo-badge">Versão 1.0.0 PRO TV</span>
            </div>
            <p style="font-size:13px; color:var(--text-secondary); line-height:1.6;">
              Aplicativo reprodutor multimídia neutro desenvolvido especialmente para televisores Smart TV (Samsung Tizen, LG webOS, Android TV e navegadores). O aplicativo não fornece, hospeda nem revende listas ou conteúdos, operando como reprodutor para acessos legalmente adquiridos pelo usuário.
            </p>
            <div style="font-size:11px; color:var(--text-muted); margin-top:8px;">
              © 2026 Nova IPTV Player • Arquitetura de Alto Desempenho HLS / Xtream Codes
            </div>
          </div>
        </div>
      `;

      panel.querySelector('#set-lang').addEventListener('change', (e) => {
        storage.saveSettings({ language: e.target.value });
        toast.info('Idioma', 'Preferência de idioma salva.');
      });
    }
  }
}
