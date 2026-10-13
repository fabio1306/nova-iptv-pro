// ==========================================================================
// M3U / M3U8 PARSER SERVICE - URL FETCHER & PLAYLIST PROCESSOR
// ==========================================================================

import { proxyService } from './proxy.service.js';

class M3uService {
  parseText(content) {
    if (!content || !content.includes('#EXTM3U')) {
      throw new Error('Formato inválido: O arquivo ou URL não possui o cabeçalho #EXTM3U.');
    }

    const lines = content.split(/\r?\n/);
    const channels = [];
    const categoriesSet = new Set();

    let currentItem = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (line.startsWith('#EXTINF:')) {
        currentItem = this.parseExtInf(line);
      } else if (line.startsWith('#EXTGRP:') && currentItem) {
        currentItem.group = line.substring(8).trim();
      } else if (!line.startsWith('#') && currentItem) {
        // Stream URL line
        currentItem.streamUrl = line;
        currentItem.id = 'm3u_' + (channels.length + 1);
        currentItem.num = channels.length + 1;

        const cat = currentItem.group || 'Geral';
        categoriesSet.add(cat);
        currentItem.category = cat;

        // Classify stream type
        const urlLower = line.toLowerCase();
        if (urlLower.includes('/movie/') || urlLower.endsWith('.mp4') || urlLower.endsWith('.mkv') || urlLower.endsWith('.avi')) {
          currentItem.type = 'movie';
        } else if (urlLower.includes('/series/')) {
          currentItem.type = 'series';
        } else {
          currentItem.type = 'live';
        }

        channels.push(currentItem);
        currentItem = null;
      }
    }

    const categories = Array.from(categoriesSet).map((catName, idx) => ({
      id: 'cat_' + idx,
      name: catName
    }));

    return {
      channels,
      categories,
      total: channels.length
    };
  }

  parseExtInf(line) {
    const info = {
      name: 'Sem Nome',
      logo: '',
      group: 'Geral',
      tvgId: '',
      tvgName: ''
    };

    // Extract attributes tvg-name, tvg-logo, group-title, tvg-id
    const tvgNameMatch = line.match(/tvg-name="([^"]*)"/i);
    if (tvgNameMatch) info.tvgName = tvgNameMatch[1];

    const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/i);
    if (tvgLogoMatch) info.logo = tvgLogoMatch[1];

    const groupTitleMatch = line.match(/group-title="([^"]*)"/i);
    if (groupTitleMatch) info.group = groupTitleMatch[1];

    const tvgIdMatch = line.match(/tvg-id="([^"]*)"/i);
    if (tvgIdMatch) info.tvgId = tvgIdMatch[1];

    // Extract Channel Name after last comma
    const commaIndex = line.lastIndexOf(',');
    if (commaIndex !== -1) {
      info.name = line.substring(commaIndex + 1).trim() || info.tvgName || 'Sem Nome';
    } else {
      info.name = info.tvgName || 'Sem Nome';
    }

    return info;
  }

  async loadFromUrl(url) {
    try {
      const response = await proxyService.safeFetch(url, {
        headers: { 'Accept': 'text/plain, application/x-mpegurl, audio/x-mpegurl, */*' }
      });
      const text = await response.text();
      return this.parseText(text);
    } catch (err) {
      console.error('[M3uService] Error fetching playlist:', err);
      throw new Error(`Falha ao carregar lista M3U: ${err.message}`);
    }
  }

  async loadFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const result = this.parseText(e.target.result);
          resolve(result);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo local.'));
      reader.readAsText(file);
    });
  }
}

export const m3uService = new M3uService();
