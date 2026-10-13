// ==========================================================================
// XTREAM CODES API SERVICE - AUTHENTICATION, CATALOG & STREAM RESOLUTION
// ==========================================================================

import { proxyService } from './proxy.service.js';

class XtreamService {
  normalizeServerUrl(url) {
    if (!url) return '';
    let cleaned = url.trim();
    if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
      cleaned = 'http://' + cleaned;
    }
    return cleaned.replace(/\/+$/, '');
  }

  formatExpiry(timestamp) {
    if (!timestamp || timestamp === 'null' || timestamp === null) {
      return { text: 'Ilimitado / Vitalício', daysLeft: 9999, isExpired: false, isWarning: false };
    }

    const expMs = Number(timestamp) * 1000;
    if (isNaN(expMs)) {
      return { text: 'Não informada', daysLeft: null, isExpired: false, isWarning: false };
    }

    const expDate = new Date(expMs);
    const now = new Date();
    const diffDays = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));

    const day = String(expDate.getDate()).padStart(2, '0');
    const month = String(expDate.getMonth() + 1).padStart(2, '0');
    const year = expDate.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    const isExpired = diffDays <= 0;
    const isWarning = diffDays > 0 && diffDays <= 7;

    return {
      text: formattedDate,
      daysLeft: diffDays,
      isExpired,
      isWarning
    };
  }

  async authenticate(serverUrl, username, password) {
    const base = this.normalizeServerUrl(serverUrl);
    const endpoint = `${base}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;

    try {
      const response = await proxyService.safeFetch(endpoint, {
        headers: { 'Accept': 'application/json' }
      });
      const data = await response.json();

      if (!data || !data.user_info) {
        throw new Error('Servidor não retornou dados de usuário válidos.');
      }

      const { user_info, server_info } = data;

      if (user_info.auth === 0 || user_info.status !== 'Active') {
        const msg = user_info.message || (user_info.status === 'Banned' ? 'Conta banida no servidor.' : 'Usuário ou senha incorretos.');
        throw new Error(msg);
      }

      const expiry = this.formatExpiry(user_info.exp_date);

      return {
        success: true,
        userInfo: {
          username: user_info.username,
          status: user_info.status,
          expiryDate: expiry.text,
          expiryDays: expiry.daysLeft,
          isExpired: expiry.isExpired,
          isWarning: expiry.isWarning,
          maxConnections: user_info.max_connections || 1,
          activeConnections: user_info.active_cons || 0,
          createdAt: user_info.created_at ? new Date(Number(user_info.created_at) * 1000).toLocaleDateString('pt-BR') : null
        },
        serverInfo: {
          url: base,
          port: server_info?.port || '',
          timezone: server_info?.timezone || '',
          serverProtocol: server_info?.server_protocol || 'http'
        }
      };
    } catch (err) {
      console.error('[XtreamService] Authentication failed:', err);
      throw new Error(err.message || 'Falha ao conectar ao servidor Xtream Codes.');
    }
  }

  async getLiveCategories(serverUrl, username, password) {
    const base = this.normalizeServerUrl(serverUrl);
    const url = `${base}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_live_categories`;
    const res = await proxyService.safeFetch(url);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }

  async getLiveStreams(serverUrl, username, password, categoryId = '') {
    const base = this.normalizeServerUrl(serverUrl);
    let url = `${base}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_live_streams`;
    if (categoryId && categoryId !== 'all') {
      url += `&category_id=${categoryId}`;
    }
    const res = await proxyService.safeFetch(url);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }

  async getVodCategories(serverUrl, username, password) {
    const base = this.normalizeServerUrl(serverUrl);
    const url = `${base}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_vod_categories`;
    const res = await proxyService.safeFetch(url);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }

  async getVodStreams(serverUrl, username, password, categoryId = '') {
    const base = this.normalizeServerUrl(serverUrl);
    let url = `${base}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_vod_streams`;
    if (categoryId && categoryId !== 'all') {
      url += `&category_id=${categoryId}`;
    }
    const res = await proxyService.safeFetch(url);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }

  async getSeriesCategories(serverUrl, username, password) {
    const base = this.normalizeServerUrl(serverUrl);
    const url = `${base}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_series_categories`;
    const res = await proxyService.safeFetch(url);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }

  async getSeries(serverUrl, username, password, categoryId = '') {
    const base = this.normalizeServerUrl(serverUrl);
    let url = `${base}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_series`;
    if (categoryId && categoryId !== 'all') {
      url += `&category_id=${categoryId}`;
    }
    const res = await proxyService.safeFetch(url);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }

  async getSeriesInfo(serverUrl, username, password, seriesId) {
    const base = this.normalizeServerUrl(serverUrl);
    const url = `${base}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_series_info&series_id=${seriesId}`;
    const res = await proxyService.safeFetch(url);
    return await res.json();
  }

  getLiveStreamUrl(serverUrl, username, password, streamId, format = 'm3u8') {
    const base = this.normalizeServerUrl(serverUrl);
    return `${base}/live/${username}/${password}/${streamId}.${format}`;
  }

  getVodStreamUrl(serverUrl, username, password, streamId, containerExtension = 'mp4') {
    const base = this.normalizeServerUrl(serverUrl);
    return `${base}/movie/${username}/${password}/${streamId}.${containerExtension}`;
  }

  getSeriesStreamUrl(serverUrl, username, password, streamId, containerExtension = 'mp4') {
    const base = this.normalizeServerUrl(serverUrl);
    return `${base}/series/${username}/${password}/${streamId}.${containerExtension}`;
  }
}

export const xtreamService = new XtreamService();
