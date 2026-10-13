// ==========================================================================
// MOCK DATA SERVICE - VERIFIED PUBLIC DEMO STREAMS, EPG & CATALOG
// ==========================================================================

export const DEMO_ACCOUNT = {
  id: 'demo_default',
  name: 'Servidor Demonstração IPTV Pro',
  type: 'demo', // 'xtream' | 'm3u' | 'demo'
  serverUrl: 'https://demo.novaiptv.tv:8080',
  username: 'demo_user',
  password: '••••••••',
  status: 'active', // 'active' | 'expiring' | 'expired'
  expiryDate: '2027-12-31',
  expiryDays: 444,
  maxConnections: 3,
  activeConnections: 1,
  createdAt: 1735689600000,
  updatedAt: Date.now()
};

export const LIVE_CATEGORIES = [
  { id: 'all', name: 'Todos os Canais', icon: 'tv' },
  { id: 'news', name: 'Notícias & Jornalismo', icon: 'newspaper' },
  { id: 'movies_ch', name: 'Cinema & Filmes', icon: 'film' },
  { id: 'sports', name: 'Esportes & Aventura', icon: 'activity' },
  { id: 'nature', name: 'Documentários & Natureza', icon: 'globe' },
  { id: 'kids', name: 'Infantil & Desenhos', icon: 'smile' },
  { id: 'music', name: 'Música & Shows', icon: 'music' }
];

export const LIVE_CHANNELS = [
  {
    id: 'live_1',
    num: 1,
    name: 'NASA TV HD (Oficial)',
    category: 'nature',
    logo: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=120&auto=format&fit=crop&q=80',
    streamUrl: 'https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8',
    epg: {
      current: { title: 'ISS Live Earth Views & Space Station Operations', start: '11:00', end: '13:00', desc: 'Transmissão ao vivo de imagens da Terra e operações a bordo da Estação Espacial Internacional (ISS).' },
      next: { title: 'Artemis Moon Mission Science & Briefing', start: '13:00', end: '14:30' }
    }
  },
  {
    id: 'live_2',
    num: 2,
    name: 'DW News 24/7 HD',
    category: 'news',
    logo: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=120&auto=format&fit=crop&q=80',
    streamUrl: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8',
    epg: {
      current: { title: 'Global News Hour & Financial Markets', start: '11:30', end: '12:30', desc: 'As principais notícias do mundo, análises de economia global e correspondentes internacionais.' },
      next: { title: 'Documentary Special: Energy of the Future', start: '12:30', end: '13:30' }
    }
  },
  {
    id: 'live_3',
    num: 3,
    name: 'France 24 English HD',
    category: 'news',
    logo: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=120&auto=format&fit=crop&q=80',
    streamUrl: 'https://static.france24.com/live/F24_EN_LO_HLS/live_tv.m3u8',
    epg: {
      current: { title: 'Live World News & Paris Editorial', start: '11:00', end: '12:00', desc: 'Cobertura em tempo real dos principais eventos políticos, culturais e sociais.' },
      next: { title: 'Tech 24: Digital Innovations & AI', start: '12:00', end: '12:30' }
    }
  },
  {
    id: 'live_4',
    num: 4,
    name: 'Cine Open Cinema HD',
    category: 'movies_ch',
    logo: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=120&auto=format&fit=crop&q=80',
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    epg: {
      current: { title: 'Festival de Curtas e Animações Digitais', start: '11:00', end: '13:30', desc: 'Seleção premiada de produções cinematográficas abertas com alta fidelidade de som e imagem.' },
      next: { title: 'Ficção Científica: Futuro Distópico', start: '13:30', end: '15:30' }
    }
  },
  {
    id: 'live_5',
    num: 5,
    name: 'Red Bull Extreme Sports',
    category: 'sports',
    logo: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=120&auto=format&fit=crop&q=80',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    epg: {
      current: { title: 'Rally dos Campeões & Manobras Aéreas', start: '10:30', end: '12:45', desc: 'Velocidade, montanhas, pistas off-road e manobras radicais de motocross e downhill.' },
      next: { title: 'Mundial de Surfe em Ondas Gigantes', start: '12:45', end: '14:30' }
    }
  },
  {
    id: 'live_6',
    num: 6,
    name: 'Wild Nature & Wildlife 4K',
    category: 'nature',
    logo: 'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=120&auto=format&fit=crop&q=80',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    epg: {
      current: { title: 'Segredos da Savana Africana', start: '11:15', end: '12:30', desc: 'Imagens impressionantes em altíssima definição dos maiores predadores do reino animal.' },
      next: { title: 'Oceanos Profundos: O Mundo Submerso', start: '12:30', end: '13:45' }
    }
  },
  {
    id: 'live_7',
    num: 7,
    name: 'Kids Toon Planet HD',
    category: 'kids',
    logo: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=120&auto=format&fit=crop&q=80',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    epg: {
      current: { title: 'As Aventuras de Big Buck Bunny', start: '11:00', end: '12:15', desc: 'Diversão para toda a família com o coelho gigante e seus amigos travessos da floresta.' },
      next: { title: 'Aventuras Espaciais dos Bichinhos', start: '12:15', end: '13:00' }
    }
  },
  {
    id: 'live_8',
    num: 8,
    name: 'Lounge Music & Beats HD',
    category: 'music',
    logo: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=80',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    epg: {
      current: { title: 'Sunset Chillout & Melodic Electronic Sessions', start: '11:00', end: '14:00', desc: 'Trilhas sonoras relaxantes para o dia a dia com efeitos visuais psicodélicos em HD.' },
      next: { title: 'Festival Live Clubbing 2026', start: '14:00', end: '16:00' }
    }
  }
];

export const VOD_CATEGORIES = [
  { id: 'all', name: 'Todos os Filmes' },
  { id: 'action', name: 'Ação & Aventura' },
  { id: 'scifi', name: 'Ficção Científica' },
  { id: 'animation', name: 'Animação & Família' },
  { id: 'drama', name: 'Drama & Suspense' }
];

export const VOD_MOVIES = [
  {
    id: 'movie_1',
    title: 'Tears of Steel: A Rebelião',
    year: '2024',
    duration: '1h 12m',
    rating: '8.8',
    category: 'scifi',
    genre: 'Ficção Científica / Cyberpunk',
    poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
    overview: 'Num futuro distópico em Amsterdã, um grupo de cientistas e combatentes luta contra robôs gigantes para recuperar o controle da cidade antes da aniquilação total.',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
  },
  {
    id: 'movie_2',
    title: 'Sintel: A Jornada do Dragão',
    year: '2023',
    duration: '1h 35m',
    rating: '9.1',
    category: 'action',
    genre: 'Aventura / Fantasia Épica',
    poster: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=400&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
    overview: 'Uma jovem guerreira viaja por terras desérticas e montanhas congeladas enfrentando perigos mortais para resgatar seu pequeno dragão de estimação.',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'
  },
  {
    id: 'movie_3',
    title: 'Big Buck Bunny: O Guardião da Floresta',
    year: '2024',
    duration: '1h 22m',
    rating: '8.6',
    category: 'animation',
    genre: 'Animação / Comédia',
    poster: 'https://images.unsplash.com/photo-1535083783855-76ae62b2914e?w=400&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&auto=format&fit=crop&q=80',
    overview: 'Quando três roedores maliciosos começam a atormentar os animais indefesos da floresta, um coelho de coração bondoso decide dar uma lição inesquecível a eles.',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
  },
  {
    id: 'movie_4',
    title: 'Elephant\'s Dream: Máquinas Vivas',
    year: '2022',
    duration: '1h 18m',
    rating: '7.9',
    category: 'drama',
    genre: 'Mistério / Surrealismo',
    poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80',
    overview: 'Dois homens exploram uma estrutura mecânica gigante e infinita que parece responder diretamente aos pensamentos e medos inconscientes de seus habitantes.',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
  },
  {
    id: 'movie_5',
    title: 'Velocidade Urbana: Bullrun',
    year: '2025',
    duration: '1h 45m',
    rating: '8.4',
    category: 'action',
    genre: 'Ação / Velocidade',
    poster: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&auto=format&fit=crop&q=80',
    overview: 'Pilotos profissionais cruzam os Estados Unidos em supercarros de alta potência numa disputa alucinante onde apenas os mais rápidos sobrevivem.',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4'
  }
];

export const SERIES_CATEGORIES = [
  { id: 'all', name: 'Todas as Séries' },
  { id: 'scifi', name: 'Ficção & Aventura' },
  { id: 'doc', name: 'Documentários & Ciência' }
];

export const SERIES_CATALOG = [
  {
    id: 'series_1',
    title: 'Crônicas do Multiverso',
    rating: '9.3',
    year: '2024',
    category: 'scifi',
    genre: 'Sci-Fi / Aventura',
    poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
    overview: 'Exploradores dimensionais desvendam fendas no espaço-tempo e se deparam com civilizações e tecnologias além da compreensão humana.',
    seasons: [
      {
        seasonNumber: 1,
        seasonName: 'Temporada 1',
        episodes: [
          {
            id: 's1_ep1',
            number: 1,
            title: 'Episódio 1: A Primeira Fronteira',
            duration: '28 min',
            overview: 'A equipe ativa pela primeira vez o acelerador de partículas gravitacionais e descobre um portal para um mundo paralelo.',
            streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
          },
          {
            id: 's1_ep2',
            number: 2,
            title: 'Episódio 2: Máquinas do Destino',
            duration: '32 min',
            overview: 'Após ficarem isolados numa estação orbital abandonada, sinais misteriosos indicam a aproximação de inteligência não-humana.',
            streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'
          },
          {
            id: 's1_ep3',
            number: 3,
            title: 'Episódio 3: O Ponto de Convergência',
            duration: '35 min',
            overview: 'A rota de volta para a Terra começa a se fechar rapidamente enquanto os campos magnéticos entram em colapso.',
            streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
          }
        ]
      }
    ]
  },
  {
    id: 'series_2',
    title: 'Expedição Planeta Selvagem',
    rating: '9.0',
    year: '2025',
    category: 'doc',
    genre: 'Documentário / Natureza',
    poster: 'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=400&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&auto=format&fit=crop&q=80',
    overview: 'Viaje pelos ecossistemas mais intocados e extremos da Terra, acompanhando de perto os hábitos e sobrevivência da fauna selvagem.',
    seasons: [
      {
        seasonNumber: 1,
        seasonName: 'Temporada 1',
        episodes: [
          {
            id: 's2_ep1',
            number: 1,
            title: 'Episódio 1: Santuário das Savanas',
            duration: '42 min',
            overview: 'Os ciclos de chuva e seca e a grande migração de manadas em busca de pastagens verdes na África.',
            streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
          },
          {
            id: 's2_ep2',
            number: 2,
            title: 'Episódio 2: As Montanhas Nebulosas',
            duration: '38 min',
            overview: 'Animais raros que desenvolveram adaptações extremas para sobreviver a altitudes congelantes.',
            streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
          }
        ]
      }
    ]
  }
];
