// ==========================================================================
// TOP NAVBAR COMPONENT - LOGO, LIVE CLOCK, ACCOUNT SUMMARY & QUICK ACTIONS
// ==========================================================================

import { storage } from '../services/storage.service.js';
import { toast } from './toast.js';

export class NavbarComponent {
  constructor(options = {}) {
    this.onNavigate = options.onNavigate || (() => {});
    this.onOpenAccounts = options.onOpenAccounts || (() => {});
    this.onOpenAccountDetails = options.onOpenAccountDetails || (() => {});
    this.onSyncAccount = options.onSyncAccount || (() => {});
    this.container = null;
    this.clockInterval = null;
  }

  render(parentElement) {
    this.container = document.createElement('header');
    this.container.className = 'tv-navbar';
    this.container.innerHTML = `
      <div class="tv-navbar-brand">
        <div class="tv-logo-container tv-focusable" tabindex="0" id="nav-brand-btn" role="button" title="Voltar ao Início">
          <div class="tv-logo-icon">N</div>
          <span class="tv-logo-text">NOVA<span style="color:var(--primary);">IPTV</span></span>
          <span class="tv-logo-badge">PRO TV</span>
        </div>

        <div class="tv-account-pill tv-focusable" tabindex="0" id="nav-account-pill" role="button" title="Ver detalhes da conta">
          <div class="tv-status-dot" id="nav-account-dot"></div>
          <div class="tv-account-info-text">
            <span class="tv-account-name truncate" id="nav-account-name">Carregando...</span>
            <span class="tv-account-expiry truncate" id="nav-account-expiry">Verificando...</span>
          </div>
        </div>
      </div>

      <div class="tv-navbar-actions">
        <button class="tv-icon-btn tv-focusable" tabindex="0" id="nav-search-btn" title="Pesquisa Global" aria-label="Pesquisa">
          <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
        </button>

        <button class="tv-icon-btn tv-focusable" tabindex="0" id="nav-sync-btn" title="Atualizar listas e conta" aria-label="Atualizar">
          <svg id="nav-sync-icon" viewBox="0 0 24 24"><path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
        </button>

        <button class="tv-icon-btn tv-focusable" tabindex="0" id="nav-accounts-btn" title="Gerenciar Contas" aria-label="Contas">
          <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
        </button>

        <button class="tv-icon-btn tv-focusable" tabindex="0" id="nav-settings-btn" title="Configurações" aria-label="Configurações">
          <svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
        </button>

        <div class="tv-clock-widget">
          <span class="tv-clock-time" id="nav-clock-time">00:00:00</span>
          <span class="tv-clock-date" id="nav-clock-date">--/--/----</span>
        </div>
      </div>
    `;

    parentElement.appendChild(this.container);
    this.bindEvents();
    this.startClock();
    this.updateAccountStatus();
  }

  bindEvents() {
    this.container.querySelector('#nav-brand-btn').addEventListener('click', () => {
      this.onNavigate('dashboard');
    });

    this.container.querySelector('#nav-account-pill').addEventListener('click', () => {
      this.onOpenAccountDetails();
    });

    this.container.querySelector('#nav-search-btn').addEventListener('click', () => {
      this.onNavigate('search');
    });

    this.container.querySelector('#nav-sync-btn').addEventListener('click', async () => {
      const syncIcon = this.container.querySelector('#nav-sync-icon');
      syncIcon.style.animation = 'spin 0.8s linear infinite';
      toast.info('Sincronizando', 'Consultando dados da conta e listas no servidor...');
      try {
        await this.onSyncAccount();
        toast.success('Atualizado', 'Listas e informações sincronizadas com sucesso!');
      } catch (err) {
        toast.error('Erro ao atualizar', err.message || 'Falha de conexão com o servidor.');
      } finally {
        syncIcon.style.animation = '';
        this.updateAccountStatus();
      }
    });

    this.container.querySelector('#nav-accounts-btn').addEventListener('click', () => {
      this.onOpenAccounts();
    });

    this.container.querySelector('#nav-settings-btn').addEventListener('click', () => {
      this.onNavigate('settings');
    });
  }

  updateAccountStatus() {
    const acc = storage.getActiveAccount();
    const nameEl = this.container.querySelector('#nav-account-name');
    const expiryEl = this.container.querySelector('#nav-account-expiry');
    const dotEl = this.container.querySelector('#nav-account-dot');

    if (!acc) {
      nameEl.textContent = 'Nenhuma conta ativa';
      expiryEl.textContent = 'Clique para adicionar conta';
      dotEl.className = 'tv-status-dot danger';
      return;
    }

    nameEl.textContent = acc.name || 'Conta IPTV';

    // Reset classes
    dotEl.className = 'tv-status-dot';
    expiryEl.className = 'tv-account-expiry truncate';

    if (acc.type === 'demo') {
      expiryEl.textContent = `Demonstração • ${acc.expiryDays} dias restantes`;
      dotEl.classList.add('active');
    } else if (acc.expiryDate) {
      if (acc.expiryDays !== null && acc.expiryDays <= 0) {
        expiryEl.textContent = `Expirado em ${acc.expiryDate}`;
        expiryEl.classList.add('expired');
        dotEl.classList.add('danger');
      } else if (acc.expiryDays !== null && acc.expiryDays <= 7) {
        expiryEl.textContent = `Expira em ${acc.expiryDays} dias (${acc.expiryDate})`;
        expiryEl.classList.add('expiring-soon');
        dotEl.classList.add('warning');
      } else {
        const daysText = acc.expiryDays !== null ? ` • ${acc.expiryDays} dias` : '';
        expiryEl.textContent = `Vencimento: ${acc.expiryDate}${daysText}`;
        dotEl.classList.add('active');
      }
    } else {
      expiryEl.textContent = 'Validade não informada pelo provedor';
      dotEl.classList.add('active');
    }
  }

  startClock() {
    const updateTime = () => {
      const now = new Date();
      const timeEl = this.container?.querySelector('#nav-clock-time');
      const dateEl = this.container?.querySelector('#nav-clock-date');
      if (timeEl && dateEl) {
        timeEl.textContent = now.toLocaleTimeString('pt-BR', { hour12: false });
        dateEl.textContent = now.toLocaleDateString('pt-BR', {
          weekday: 'short',
          day: '2-digit',
          month: 'short'
        });
      }
    };
    updateTime();
    this.clockInterval = setInterval(updateTime, 1000);
  }

  destroy() {
    if (this.clockInterval) clearInterval(this.clockInterval);
    this.container?.remove();
  }
}
