// ==========================================================================
// PROXY SERVICE - CORS MANAGEMENT & URL RESOLUTION
// ==========================================================================

import { storage } from './storage.service.js';

class ProxyService {
  constructor() {
    this.proxies = {
      direct: (url) => url,
      corsproxy: (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
      allorigins: (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
    };
  }

  getCurrentMode() {
    const settings = storage.getSettings();
    return settings.corsProxy || 'direct';
  }

  resolve(url) {
    if (!url) return '';
    // If it's already an absolute data/blob URL or internal, return direct
    if (url.startsWith('blob:') || url.startsWith('data:')) {
      return url;
    }

    const settings = storage.getSettings();
    const mode = settings.corsProxy || 'direct';

    if (mode === 'custom' && settings.customCorsProxyUrl) {
      return settings.customCorsProxyUrl.replace('{url}', encodeURIComponent(url));
    }

    const proxyFn = this.proxies[mode];
    return proxyFn ? proxyFn(url) : url;
  }

  // Safe fetch that tries direct first, and if CORS/network fails, tries fallback proxy
  async safeFetch(url, options = {}) {
    const mode = this.getCurrentMode();
    const targetUrl = this.resolve(url);

    try {
      const response = await fetch(targetUrl, {
        ...options,
        signal: options.signal || AbortSignal.timeout(12000)
      });
      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }
      return response;
    } catch (err) {
      // If direct failed and was direct, try corsproxy fallback automatically
      if (mode === 'direct' && !url.includes('corsproxy.io')) {
        console.warn(`[ProxyService] Direct request failed, attempting CORS proxy fallback for: ${url}`);
        const fallbackUrl = this.proxies.corsproxy(url);
        const retryRes = await fetch(fallbackUrl, {
          ...options,
          signal: options.signal || AbortSignal.timeout(12000)
        });
        if (!retryRes.ok) {
          throw new Error(`Fallback HTTP Error ${retryRes.status}: ${retryRes.statusText}`);
        }
        return retryRes;
      }
      throw err;
    }
  }
}

export const proxyService = new ProxyService();
