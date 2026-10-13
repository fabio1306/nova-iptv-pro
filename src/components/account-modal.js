// ==========================================================================
// ACCOUNT MODAL & MANAGER COMPONENT
// ==========================================================================

import { storage } from '../services/storage.service.js';
import { xtreamService } from '../services/xtream.service.js';
import { m3uService } from '../services/m3u.service.js';
import { toast } from './toast.js';
import { loadingOverlay } from './loading-overlay.js';
import { tvNav } from '../services/tv-navigation.service.js';

export class AccountModalComponent {
  constructor(options = {}) {
    this.onAccountChanged = options.onAccountChanged || (() => {});
    this.modalEl = null;
    this.editingAccountId = null;
  }

  // --- OPEN ACCOUNTS MANAGER MODAL ---
  openManager() {
    this.close();

    const accounts = storage.getAccounts();
    const activeId = storage.getActiveAccountId();

    this.modalEl = document.createElement('div');
    this.modalEl.className = 'tv-modal-backdrop';
    this.modalEl.innerHTML = `
      <div class="tv-modal" style="max-width: 740px;">
        <div class="tv-modal-header">
          <div class="tv-modal-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--primary)"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            Gerenciador de Contas IPTV
          </div>
          <button class="tv-icon-btn tv-focusable" id="acc-modal-close" title="Fechar">✕</button>
        </div>

        <div class="tv-modal-body">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:14px; color:var(--text-secondary);">Contas cadastradas (${accounts.length}):</span>
            <button class="tv-btn tv-btn-primary tv-btn-sm tv-focusable" id="acc-add-btn">
              + Adicionar Nova Conta
            </button>
          </div>

          <div style="display:flex; flex-direction:column; gap:10px; max-height:360px; overflow-y:auto; padding-right:4px;" id="acc-list-container">
            ${accounts.map(acc => `
              <div class="tv-focusable" style="display:flex; align-items:center; justify-content:space-between; padding:16px 20px; background:rgba(255,255,255,0.03); border:1px solid ${acc.id === activeId ? 'var(--primary)' : 'var(--border-subtle)'}; border-radius:var(--radius-lg);" data-id="${acc.id}">
                <div style="display:flex; align-items:center; gap:16px;">
                  <div class="tv-status-dot ${acc.status === 'active' ? 'active' : acc.status === 'warning' ? 'warning' : 'danger'}"></div>
                  <div>
                    <div style="font-size:16px; font-weight:700; color:#fff; display:flex; align-items:center; gap:10px;">
                      ${acc.name}
                      ${acc.id === activeId ? '<span style="font-size:10px; background:rgba(0,210,255,0.2); color:var(--primary); padding:2px 8px; border-radius:4px; border:1px solid rgba(0,210,255,0.3);">ATIVA</span>' : ''}
                      <span style="font-size:11px; color:var(--text-muted); text-transform:uppercase;">${acc.type || 'xtream'}</span>
                    </div>
                    <div style="font-size:12px; color:var(--text-secondary); margin-top:3px;">
                      ${acc.serverUrl ? `Servidor: ${acc.serverUrl.substring(0, 32)}...` : 'Lista local'} • ${acc.expiryDate ? `Vencimento: ${acc.expiryDate}` : 'Validade não informada'}
                    </div>
                  </div>
                </div>

                <div style="display:flex; align-items:center; gap:8px;">
                  ${acc.id !== activeId ? `
                    <button class="tv-btn tv-btn-sm tv-focusable btn-select-acc" data-id="${acc.id}">
                      Selecionar
                    </button>
                  ` : ''}
                  <button class="tv-btn tv-btn-sm tv-focusable btn-edit-acc" data-id="${acc.id}" title="Editar">
                    Editar
                  </button>
                  ${acc.type !== 'demo' ? `
                    <button class="tv-btn tv-btn-sm tv-btn-danger tv-focusable btn-del-acc" data-id="${acc.id}" title="Excluir">
                      Excluir
                    </button>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="tv-modal-footer">
          <button class="tv-btn tv-focusable" id="acc-modal-close-footer">Fechar</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.modalEl);
    this.bindManagerEvents();
    tvNav.pushBackHandler(() => { this.close(); return true; });
    tvNav.focusFirstVisible(this.modalEl);
  }

  bindManagerEvents() {
    this.modalEl.querySelector('#acc-modal-close').addEventListener('click', () => this.close());
    this.modalEl.querySelector('#acc-modal-close-footer').addEventListener('click', () => this.close());

    this.modalEl.querySelector('#acc-add-btn').addEventListener('click', () => {
      this.openAddEditModal();
    });

    this.modalEl.querySelectorAll('.btn-select-acc').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        storage.setActiveAccountId(id);
        toast.success('Conta alterada', 'Carregando conteúdos da conta selecionada...');
        this.close();
        this.onAccountChanged(id);
      });
    });

    this.modalEl.querySelectorAll('.btn-edit-acc').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        this.openAddEditModal(id);
      });
    });

    this.modalEl.querySelectorAll('.btn-del-acc').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        this.confirmDelete(id);
      });
    });
  }

  // --- CONFIRM DELETE MODAL ---
  confirmDelete(accountId) {
    const acc = storage.getAccounts().find(a => a.id === accountId);
    if (!acc) return;

    const confirmBackdrop = document.createElement('div');
    confirmBackdrop.className = 'tv-modal-backdrop';
    confirmBackdrop.style.zIndex = '1200';
    confirmBackdrop.innerHTML = `
      <div class="tv-modal" style="max-width: 480px;">
        <div class="tv-modal-header">
          <div class="tv-modal-title" style="color:var(--status-danger);">
            Excluir Conta
          </div>
        </div>
        <div class="tv-modal-body">
          <p style="font-size:15px; color:#fff;">Tem certeza que deseja excluir permanentemente o acesso "<strong>${acc.name}</strong>"?</p>
          <p style="font-size:13px; color:var(--text-secondary); margin-top:8px;">Todas as credenciais e configurações deste acesso serão removidas da Smart TV.</p>
        </div>
        <div class="tv-modal-footer">
          <button class="tv-btn tv-focusable" id="del-cancel-btn">Cancelar</button>
          <button class="tv-btn tv-btn-danger tv-focusable" id="del-confirm-btn">Sim, Excluir</button>
        </div>
      </div>
    `;

    document.body.appendChild(confirmBackdrop);
    tvNav.pushBackHandler(() => { confirmBackdrop.remove(); return true; });
    tvNav.focusFirstVisible(confirmBackdrop);

    confirmBackdrop.querySelector('#del-cancel-btn').addEventListener('click', () => confirmBackdrop.remove());
    confirmBackdrop.querySelector('#del-confirm-btn').addEventListener('click', () => {
      storage.deleteAccount(accountId);
      confirmBackdrop.remove();
      toast.success('Conta removida', 'O acesso foi excluído com sucesso.');
      this.openManager();
      this.onAccountChanged(storage.getActiveAccountId());
    });
  }

  // --- ADD / EDIT ACCOUNT MODAL ---
  openAddEditModal(accountId = null) {
    this.close();
    this.editingAccountId = accountId;

    const existing = accountId ? storage.getAccounts().find(a => a.id === accountId) : null;
    const isEdit = !!existing;

    this.modalEl = document.createElement('div');
    this.modalEl.className = 'tv-modal-backdrop';
    this.modalEl.innerHTML = `
      <div class="tv-modal" style="max-width: 660px;">
        <div class="tv-modal-header">
          <div class="tv-modal-title">
            ${isEdit ? 'Editar Acesso IPTV' : 'Adicionar Novo Acesso IPTV'}
          </div>
          <button class="tv-icon-btn tv-focusable" id="form-modal-close">✕</button>
        </div>

        <div class="tv-modal-body">
          <!-- Connection Mode Switcher -->
          <div style="display:flex; gap:12px; margin-bottom:12px;">
            <button class="tv-btn ${(!existing || existing.type === 'xtream') ? 'tv-btn-primary' : ''} tv-btn-sm tv-focusable" id="tab-xtream" type="button">
              Xtream Codes API
            </button>
            <button class="tv-btn ${existing?.type === 'm3u' ? 'tv-btn-primary' : ''} tv-btn-sm tv-focusable" id="tab-m3u" type="button">
              Lista M3U / M3U8
            </button>
          </div>

          <form id="acc-form" style="display:flex; flex-direction:column; gap:16px;">
            <input type="hidden" id="form-type" value="${existing?.type || 'xtream'}">

            <div class="tv-form-group">
              <label class="tv-form-label">Nome da Conta / Identificação</label>
              <input class="tv-input tv-focusable" id="form-name" type="text" placeholder="Ex: Minha Lista IPTV" value="${existing?.name || ''}" required>
            </div>

            <!-- Xtream Fields -->
            <div id="xtream-fields" style="display:${(!existing || existing.type === 'xtream') ? 'flex' : 'none'}; flex-direction:column; gap:16px;">
              <div class="tv-form-group">
                <label class="tv-form-label">URL do Servidor</label>
                <input class="tv-input tv-focusable" id="form-server" type="url" placeholder="http://servidor.com:8080" value="${existing?.serverUrl || ''}">
              </div>

              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
                <div class="tv-form-group">
                  <label class="tv-form-label">Usuário</label>
                  <input class="tv-input tv-focusable" id="form-user" type="text" placeholder="Nome de usuário" value="${existing?.username || ''}">
                </div>

                <div class="tv-form-group">
                  <label class="tv-form-label">Senha</label>
                  <div class="tv-input-wrap">
                    <input class="tv-input tv-focusable" id="form-pass" type="password" placeholder="Senha do servidor" value="${existing?.password || ''}">
                    <button type="button" class="tv-input-action-btn tv-focusable" id="toggle-pass-visibility">👁</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- M3U Fields -->
            <div id="m3u-fields" style="display:${existing?.type === 'm3u' ? 'flex' : 'none'}; flex-direction:column; gap:16px;">
              <div class="tv-form-group">
                <label class="tv-form-label">URL da Lista M3U / M3U8</label>
                <input class="tv-input tv-focusable" id="form-m3u-url" type="url" placeholder="https://exemplo.com/playlist.m3u8" value="${existing?.m3uUrl || ''}">
              </div>
              <div class="tv-form-group">
                <label class="tv-form-label">Ou importar arquivo local (.m3u, .m3u8):</label>
                <input class="tv-input tv-focusable" id="form-m3u-file" type="file" accept=".m3u,.m3u8,.txt">
              </div>
            </div>
          </form>
        </div>

        <div class="tv-modal-footer">
          <button class="tv-btn tv-focusable" id="form-cancel-btn">Cancelar</button>
          <button class="tv-btn tv-btn-primary tv-focusable" id="form-save-btn">
            ${isEdit ? 'Salvar Alterações' : 'Entrar no Aplicativo'}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.modalEl);
    this.bindAddEditEvents(existing);
    tvNav.pushBackHandler(() => { this.close(); return true; });
    tvNav.focusFirstVisible(this.modalEl);
  }

  bindAddEditEvents(existing) {
    const tabXtream = this.modalEl.querySelector('#tab-xtream');
    const tabM3u = this.modalEl.querySelector('#tab-m3u');
    const xtreamFields = this.modalEl.querySelector('#xtream-fields');
    const m3uFields = this.modalEl.querySelector('#m3u-fields');
    const formType = this.modalEl.querySelector('#form-type');

    tabXtream.addEventListener('click', () => {
      formType.value = 'xtream';
      tabXtream.classList.add('tv-btn-primary');
      tabM3u.classList.remove('tv-btn-primary');
      xtreamFields.style.display = 'flex';
      m3uFields.style.display = 'none';
    });

    tabM3u.addEventListener('click', () => {
      formType.value = 'm3u';
      tabM3u.classList.add('tv-btn-primary');
      tabXtream.classList.remove('tv-btn-primary');
      m3uFields.style.display = 'flex';
      xtreamFields.style.display = 'none';
    });

    // Password visibility toggle
    const passInput = this.modalEl.querySelector('#form-pass');
    const togglePass = this.modalEl.querySelector('#toggle-pass-visibility');
    togglePass.addEventListener('click', () => {
      if (passInput.type === 'password') {
        passInput.type = 'text';
        togglePass.textContent = '🔒';
      } else {
        passInput.type = 'password';
        togglePass.textContent = '👁';
      }
    });

    // Save & Connect Button
    this.modalEl.querySelector('#form-save-btn').addEventListener('click', async () => {
      const name = this.modalEl.querySelector('#form-name').value.trim();
      const type = formType.value;

      if (!name) {
        toast.error('Campo Obrigatório', 'Informe um nome para identificar a conta.');
        return;
      }

      let accountData = {
        id: existing ? existing.id : 'acc_' + Date.now(),
        name,
        type,
        status: 'active'
      };

      if (type === 'xtream') {
        const serverUrl = this.modalEl.querySelector('#form-server').value.trim();
        const username = this.modalEl.querySelector('#form-user').value.trim();
        const password = this.modalEl.querySelector('#form-pass').value.trim();

        if (!serverUrl || !username || !password) {
          toast.error('Campos Incompletos', 'Preencha o servidor, usuário e senha.');
          return;
        }

        accountData.serverUrl = serverUrl;
        accountData.username = username;
        accountData.password = password;

        loadingOverlay.show('Conectando ao Servidor', 'Validando usuário e senha no Xtream Codes...', 25);

        try {
          const auth = await xtreamService.authenticate(serverUrl, username, password);
          accountData.expiryDate = auth.userInfo.expiryDate;
          accountData.expiryDays = auth.userInfo.expiryDays;
          accountData.maxConnections = auth.userInfo.maxConnections;
          accountData.activeConnections = auth.userInfo.activeConnections;
          loadingOverlay.update('Credenciais validadas! Conectado.', 70);
        } catch (e) {
          console.error('[AccountModal] Authentication error:', e);
          loadingOverlay.hide();
          toast.error('Erro de Conexão', e.message || 'Não foi possível autenticar no servidor.');
          return;
        }
      } else {
        const m3uUrl = this.modalEl.querySelector('#form-m3u-url').value.trim();
        const fileInput = this.modalEl.querySelector('#form-m3u-file');

        accountData.m3uUrl = m3uUrl;
        if (fileInput.files.length > 0) {
          try {
            const parsed = await m3uService.loadFromFile(fileInput.files[0]);
            accountData.localPlaylistData = parsed;
          } catch (err) {
            toast.error('Erro de Arquivo', err.message);
            return;
          }
        }
      }

      storage.saveAccount(accountData);
      storage.setActiveAccountId(accountData.id);

      loadingOverlay.hide();
      toast.success('Conta salva', `Acesso "${name}" configurado com sucesso!`);
      this.close();
      this.onAccountChanged(accountData.id);
    });

    const handleCancel = () => {
      if (storage.getAccounts().length > 0) {
        this.openManager();
      } else {
        this.close();
      }
    };
    this.modalEl.querySelector('#form-modal-close').addEventListener('click', handleCancel);
    this.modalEl.querySelector('#form-cancel-btn').addEventListener('click', handleCancel);
  }

  // --- VIEW DETAILS MODAL ("MINHA CONTA") ---
  openAccountDetails() {
    this.close();
    const acc = storage.getActiveAccount();
    if (!acc) {
      this.openManager();
      return;
    }

    this.modalEl = document.createElement('div');
    this.modalEl.className = 'tv-modal-backdrop';
    this.modalEl.innerHTML = `
      <div class="tv-modal" style="max-width: 600px;">
        <div class="tv-modal-header">
          <div class="tv-modal-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--primary)"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
            Detalhes da Minha Conta
          </div>
          <button class="tv-icon-btn tv-focusable" id="details-close">✕</button>
        </div>

        <div class="tv-modal-body" style="gap: 16px;">
          <div style="display:flex; justify-content:space-between; padding:12px 16px; background:rgba(255,255,255,0.03); border-radius:var(--radius-md);">
            <span style="color:var(--text-secondary); font-size:14px;">Nome da Conta:</span>
            <span style="font-weight:700; color:#fff;">${acc.name}</span>
          </div>

          <div style="display:flex; justify-content:space-between; padding:12px 16px; background:rgba(255,255,255,0.03); border-radius:var(--radius-md);">
            <span style="color:var(--text-secondary); font-size:14px;">Tipo de Conexão:</span>
            <span style="font-weight:700; color:var(--primary); text-transform:uppercase;">${acc.type}</span>
          </div>

          <div style="display:flex; justify-content:space-between; padding:12px 16px; background:rgba(255,255,255,0.03); border-radius:var(--radius-md);">
            <span style="color:var(--text-secondary); font-size:14px;">Status do Acesso:</span>
            <span style="font-weight:700; color:var(--status-active);">Ativo & Conectado</span>
          </div>

          <div style="display:flex; justify-content:space-between; padding:12px 16px; background:rgba(255,255,255,0.03); border-radius:var(--radius-md);">
            <span style="color:var(--text-secondary); font-size:14px;">Data de Expiração:</span>
            <span style="font-weight:700; color:#fff;">${acc.expiryDate || 'Não informada pelo servidor'}</span>
          </div>

          <div style="display:flex; justify-content:space-between; padding:12px 16px; background:rgba(255,255,255,0.03); border-radius:var(--radius-md);">
            <span style="color:var(--text-secondary); font-size:14px;">Dias Restantes:</span>
            <span style="font-weight:700; color:${acc.expiryDays !== null ? 'var(--primary)' : 'var(--text-muted)'};">
              ${acc.expiryDays !== null ? `${acc.expiryDays} dias` : 'Ilimitado ou não aplicável'}
            </span>
          </div>

          ${acc.serverUrl ? `
            <div style="display:flex; justify-content:space-between; padding:12px 16px; background:rgba(255,255,255,0.03); border-radius:var(--radius-md);">
              <span style="color:var(--text-secondary); font-size:14px;">Servidor:</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:#fff;">${acc.serverUrl}</span>
            </div>
          ` : ''}

          ${acc.username ? `
            <div style="display:flex; justify-content:space-between; padding:12px 16px; background:rgba(255,255,255,0.03); border-radius:var(--radius-md);">
              <span style="color:var(--text-secondary); font-size:14px;">Usuário:</span>
              <span style="font-weight:700; color:#fff;">${acc.username}</span>
            </div>
          ` : ''}

          <div style="display:flex; justify-content:space-between; padding:12px 16px; background:rgba(255,255,255,0.03); border-radius:var(--radius-md);">
            <span style="color:var(--text-secondary); font-size:14px;">Última Atualização:</span>
            <span style="color:var(--text-secondary); font-size:13px;">${new Date(acc.updatedAt || Date.now()).toLocaleString('pt-BR')}</span>
          </div>
        </div>

        <div class="tv-modal-footer">
          <button class="tv-btn tv-focusable" id="btn-details-manage">Gerenciar Contas</button>
          <button class="tv-btn tv-btn-primary tv-focusable" id="details-close-btn">Fechar</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.modalEl);
    tvNav.pushBackHandler(() => { this.close(); return true; });
    tvNav.focusFirstVisible(this.modalEl);

    this.modalEl.querySelector('#details-close').addEventListener('click', () => this.close());
    this.modalEl.querySelector('#details-close-btn').addEventListener('click', () => this.close());
    this.modalEl.querySelector('#btn-details-manage').addEventListener('click', () => this.openManager());
  }

  close() {
    if (this.modalEl) {
      this.modalEl.remove();
      this.modalEl = null;
    }
  }
}
