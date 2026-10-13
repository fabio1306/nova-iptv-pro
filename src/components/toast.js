// ==========================================================================
// TOAST NOTIFICATIONS COMPONENT
// ==========================================================================

class ToastManager {
  constructor() {
    this.container = null;
  }

  getContainer() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'tv-toast-container';
      document.body.appendChild(this.container);
    }
    return this.container;
  }

  show(title, message = '', type = 'info', duration = 3500) {
    const container = this.getContainer();
    const toast = document.createElement('div');
    toast.className = `tv-toast ${type}`;

    const iconSvg = this.getIcon(type);

    toast.innerHTML = `
      <div style="flex-shrink:0;">${iconSvg}</div>
      <div style="display:flex; flex-direction:column; gap:2px; flex:1;">
        <div class="tv-toast-title">${title}</div>
        ${message ? `<div class="tv-toast-msg">${message}</div>` : ''}
      </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }

  success(title, msg) { this.show(title, msg, 'success'); }
  error(title, msg) { this.show(title, msg, 'error', 4500); }
  warning(title, msg) { this.show(title, msg, 'warning'); }
  info(title, msg) { this.show(title, msg, 'info'); }

  getIcon(type) {
    switch (type) {
      case 'success':
        return '<svg width="22" height="22" viewBox="0 0 24 24" fill="#00e676"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
      case 'error':
        return '<svg width="22" height="22" viewBox="0 0 24 24" fill="#ff3366"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>';
      case 'warning':
        return '<svg width="22" height="22" viewBox="0 0 24 24" fill="#ffab00"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>';
      default:
        return '<svg width="22" height="22" viewBox="0 0 24 24" fill="#00d2ff"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>';
    }
  }
}

export const toast = new ToastManager();
