// ==========================================================================
// LOADING OVERLAY COMPONENT - CENTER SCREEN PROGRESS MODAL FOR SMART TV
// ==========================================================================

class LoadingOverlay {
  constructor() {
    this.overlayEl = null;
  }

  show(title = 'Carregando...', message = 'Por favor, aguarde...', progress = null) {
    if (!this.overlayEl) {
      this.overlayEl = document.createElement('div');
      this.overlayEl.id = 'tv-center-loader';
      this.overlayEl.className = 'tv-modal-backdrop';
      this.overlayEl.style.zIndex = '99999';
      this.overlayEl.style.backgroundColor = 'rgba(5, 7, 12, 0.92)';

      this.overlayEl.innerHTML = `
        <div style="width: 90%; max-width: 520px; background: var(--bg-surface); border: 1px solid var(--border-card); border-radius: var(--radius-xl); padding: 36px 32px; display: flex; flex-direction: column; align-items: center; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.9); animation: modalScaleIn 0.25s ease;">
          <div class="tv-logo-icon" style="width: 56px; height: 56px; font-size: 28px; margin-bottom: 20px;">N</div>
          <h2 style="font-size: 22px; font-weight: 800; color: #fff; margin-bottom: 8px;" id="loader-title">${title}</h2>
          <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 24px; max-width: 420px; line-height: 1.5;" id="loader-message">${message}</p>
          
          <div style="width: 100%; height: 8px; background: rgba(255, 255, 255, 0.1); border-radius: 999px; overflow: hidden; position: relative;">
            <div id="loader-progress-bar" style="height: 100%; width: ${progress !== null ? `${progress}%` : '40%'}; background: var(--primary-gradient); border-radius: 999px; transition: width 0.3s ease; animation: ${progress === null ? 'indeterminate 1.5s infinite ease-in-out' : 'none'};"></div>
          </div>

          <div style="margin-top: 18px; font-size: 12px; font-weight: 600; color: var(--primary); letter-spacing: 0.5px;" id="loader-status-hint">
            POR FAVOR, AGUARDE
          </div>
        </div>
      `;

      document.body.appendChild(this.overlayEl);
    } else {
      this.overlayEl.querySelector('#loader-title').textContent = title;
      this.overlayEl.querySelector('#loader-message').textContent = message;
      const bar = this.overlayEl.querySelector('#loader-progress-bar');
      if (progress !== null) {
        bar.style.animation = 'none';
        bar.style.width = `${progress}%`;
      }
      this.overlayEl.style.display = 'flex';
    }
  }

  update(message, progress = null) {
    if (this.overlayEl) {
      const msgEl = this.overlayEl.querySelector('#loader-message');
      if (msgEl) msgEl.textContent = message;
      const bar = this.overlayEl.querySelector('#loader-progress-bar');
      if (bar && progress !== null) {
        bar.style.animation = 'none';
        bar.style.width = `${progress}%`;
      }
    }
  }

  hide() {
    if (this.overlayEl) {
      this.overlayEl.style.display = 'none';
    }
  }
}

export const loadingOverlay = new LoadingOverlay();
