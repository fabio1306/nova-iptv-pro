// ==========================================================================
// SMART TV SPATIAL NAVIGATION & REMOTE CONTROL ENGINE
// ==========================================================================

class TVNavigationService {
  constructor() {
    this.currentFocusedElement = null;
    this.backHandlers = [];
    this.colorHandlers = {
      red: null,
      green: null,
      yellow: null,
      blue: null
    };
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    window.addEventListener('keydown', (e) => this.handleKeyDown(e));

    // Handle mouse hover sync so mouse and remote don't fight
    document.addEventListener('mouseover', (e) => {
      const target = e.target.closest('.tv-focusable');
      if (target && target !== this.currentFocusedElement) {
        this.setFocus(target, false);
      }
    });

    // Auto set initial focus on first visible focusable element
    setTimeout(() => {
      this.focusFirstVisible();
    }, 200);
  }

  setFocus(el, shouldScroll = true) {
    if (!el || !document.body.contains(el)) return;

    if (this.currentFocusedElement) {
      this.currentFocusedElement.classList.remove('focused');
    }

    this.currentFocusedElement = el;
    el.classList.add('focused');
    el.focus({ preventScroll: true });

    if (shouldScroll) {
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });
    }
  }

  getCurrentFocus() {
    return this.currentFocusedElement;
  }

  getFocusableElements(container = document) {
    // Only elements visible on screen and not inside hidden containers/views
    const all = Array.from(container.querySelectorAll('.tv-focusable, button:not([disabled]), input:not([disabled]), [tabindex="0"]'));
    return all.filter(el => {
      if (el.disabled || el.getAttribute('aria-hidden') === 'true') return false;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
  }

  focusFirstVisible(container = null) {
    // Check if there is an active modal first
    const activeModal = document.querySelector('.tv-modal:not(.hidden)');
    const searchRoot = activeModal || container || document.querySelector('.tv-view.active') || document;
    const focusables = this.getFocusableElements(searchRoot);
    if (focusables.length > 0) {
      this.setFocus(focusables[0]);
    }
  }

  handleKeyDown(e) {
    const key = e.key;
    const keyCode = e.keyCode;

    // Handle Color Keys (Tizen / WebOS / Android TV)
    if (keyCode === 403 || key === 'ColorF0Red') {
      if (this.colorHandlers.red) { e.preventDefault(); this.colorHandlers.red(); return; }
    } else if (keyCode === 404 || key === 'ColorF1Green') {
      if (this.colorHandlers.green) { e.preventDefault(); this.colorHandlers.green(); return; }
    } else if (keyCode === 405 || key === 'ColorF2Yellow') {
      if (this.colorHandlers.yellow) { e.preventDefault(); this.colorHandlers.yellow(); return; }
    } else if (keyCode === 406 || key === 'ColorF3Blue') {
      if (this.colorHandlers.blue) { e.preventDefault(); this.colorHandlers.blue(); return; }
    }

    // Back / Return / Escape / Backspace
    if (key === 'Escape' || key === 'Backspace' || key === 'GoBack' || keyCode === 10009 || keyCode === 461) {
      // If typing inside an input text field and it's backspace, allow default backspace typing
      if (e.target.tagName === 'INPUT' && key === 'Backspace' && e.target.value.length > 0) {
        return;
      }
      e.preventDefault();
      this.triggerBack();
      return;
    }

    // Directional Spatial Navigation
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      e.preventDefault();
      this.moveDirection(key.replace('Arrow', '').toLowerCase());
      return;
    }

    // Select / OK / Enter
    if (key === 'Enter' || key === ' ' || keyCode === 13) {
      // If pressing on an input without clicking
      if (this.currentFocusedElement && this.currentFocusedElement.tagName !== 'INPUT') {
        e.preventDefault();
        this.currentFocusedElement.click();
      }
      return;
    }
  }

  moveDirection(dir) {
    // If no element currently focused, focus first visible
    if (!this.currentFocusedElement || !document.body.contains(this.currentFocusedElement)) {
      this.focusFirstVisible();
      return;
    }

    // Check if inside a modal
    const activeModal = document.querySelector('.tv-modal:not(.hidden)');
    const searchRoot = activeModal || document.querySelector('.tv-view.active') || document;
    const focusables = this.getFocusableElements(searchRoot);

    const currentRect = this.currentFocusedElement.getBoundingClientRect();
    const currentCenter = {
      x: currentRect.left + currentRect.width / 2,
      y: currentRect.top + currentRect.height / 2
    };

    let bestCandidate = null;
    let minDistance = Infinity;

    for (const el of focusables) {
      if (el === this.currentFocusedElement) continue;

      const rect = el.getBoundingClientRect();
      const center = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };

      const dx = center.x - currentCenter.x;
      const dy = center.y - currentCenter.y;

      let isCandidate = false;

      switch (dir) {
        case 'up':
          isCandidate = dy < -5 && Math.abs(dx) <= Math.abs(dy) * 2.2;
          break;
        case 'down':
          isCandidate = dy > 5 && Math.abs(dx) <= Math.abs(dy) * 2.2;
          break;
        case 'left':
          isCandidate = dx < -5 && Math.abs(dy) <= Math.abs(dx) * 2.2;
          break;
        case 'right':
          isCandidate = dx > 5 && Math.abs(dy) <= Math.abs(dx) * 2.2;
          break;
      }

      if (isCandidate) {
        // Distance with straight-line alignment weight bonus
        const primaryDist = dir === 'up' || dir === 'down' ? Math.abs(dy) : Math.abs(dx);
        const secondaryDist = dir === 'up' || dir === 'down' ? Math.abs(dx) : Math.abs(dy);
        const weightedDist = primaryDist + secondaryDist * 1.8;

        if (weightedDist < minDistance) {
          minDistance = weightedDist;
          bestCandidate = el;
        }
      }
    }

    if (bestCandidate) {
      this.setFocus(bestCandidate);
    }
  }

  // Register contextual back action
  pushBackHandler(fn) {
    this.backHandlers.push(fn);
  }

  popBackHandler() {
    return this.backHandlers.pop();
  }

  triggerBack() {
    if (this.backHandlers.length > 0) {
      const handler = this.backHandlers[this.backHandlers.length - 1];
      const handled = handler();
      if (handled) {
        this.backHandlers.pop();
      }
    } else {
      console.log('[TVNav] Back triggered at root');
    }
  }

  // Virtual Remote Simulation API
  simulateKey(keyName) {
    const eventMap = {
      up: { key: 'ArrowUp', keyCode: 38 },
      down: { key: 'ArrowDown', keyCode: 40 },
      left: { key: 'ArrowLeft', keyCode: 37 },
      right: { key: 'ArrowRight', keyCode: 39 },
      ok: { key: 'Enter', keyCode: 13 },
      back: { key: 'Escape', keyCode: 27 },
      red: { keyCode: 403, key: 'ColorF0Red' },
      green: { keyCode: 404, key: 'ColorF1Green' },
      yellow: { keyCode: 405, key: 'ColorF2Yellow' },
      blue: { keyCode: 406, key: 'ColorF3Blue' }
    };

    const evtData = eventMap[keyName];
    if (evtData) {
      this.handleKeyDown({
        key: evtData.key,
        keyCode: evtData.keyCode,
        preventDefault: () => {},
        target: document.activeElement
      });
    }
  }
}

export const tvNav = new TVNavigationService();
