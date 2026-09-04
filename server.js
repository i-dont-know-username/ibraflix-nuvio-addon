const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// 1. CONTENT DATABASE – add all your shows & movies here
// ============================================================
const CONTENT_DB = {
  // ---- SUPERNATURAL POWERS (TV SHOW) ----
  'tmdb:333643': {
    id: 'tmdb:333643',
    type: 'tv',
    name: 'Supernatural Powers',
    description: 'A creator-made series from Ibraflix Productions.',
    genres: ['Fantasy', 'Supernatural'],
    // ✅ POSTER – using your TMDB image
    poster: 'https://media.themoviedb.org/t/p/w500/AfLmDw7Fp3q2um4qi4TcmOGwKxf.jpg',
    posterShape: 'regular',
    // Optional backdrop (16:9)
    // background: 'https://media.themoviedb.org/t/p/original/your-backdrop.jpg',
    videos: [
      {
        id: 'tmdb:333643:1:1',
        season: 1,
        number: 1,
        title: 'Episode 1',
        name: 'Episode 1',
        // Optional thumbnail for the episode
        // thumbnail: 'https://media.themoviedb.org/t/p/w500/ep1-thumb.jpg'
      }
      // Add more episodes here:
      // {
      //   id: 'tmdb:333643:1:2',
      //   season: 1,
      //   number: 2,
      //   title: 'Episode 2',
      //   name: 'Episode 2'
      // }
    ]
  }

  // ---- EXAMPLE: MOVIE ----
  // 'tmdb:123456': {
  //   id: 'tmdb:123456',
  //   type: 'movie',
  //   name: 'Ibraflix Movie 1',
  //   description: 'An amazing original movie.',
  //   genres: ['Action', 'Adventure'],
  //   poster: 'https://example.com/poster.jpg',
  //   posterShape: 'regular',
  //   releaseInfo: '2025'
  // }
};

// ============================================================
// 2. STREAM DATABASE – map content ID to direct video URL
// ============================================================
const STREAM_DB = {
  // For TV episodes – use the full episode ID
  'tmdb:333643:1:1': {
    url: 'https://0807.st/epiNrPV.mp4',
    quality: '1080p',
    title: 'Supernatural Powers — S01E01'
  }
  // For movies – just use the content ID
  // 'tmdb:123456': {
  //   url: 'https://example.com/movie.mp4',
  //   quality: '1080p',
  //   title: 'Ibraflix Movie 1'
  // }
};

// ============================================================
// 3. SUBTITLE DATABASE (optional)
// ============================================================
const SUBTITLE_DB = {
  // 'tmdb:333643:1:1': [
  //   { id: 'en-1-1', url: 'https://example.com/ep1.vtt', lang: 'eng', label: 'English' }
  // ]
};

// ============================================================
// HELPERS
// ============================================================
function json(res, body) {
  res.set('Cache-Control', 'public, max-age=60');
  return res.json(body);
}

// ---------- MIDDLEWARE ----------
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ============================================================
// ROUTES
// ============================================================

app.get('/', (req, res) => {
  res.type('text').send('Ibraflix Productions — Multi-content addon');
});

// MANIFEST
app.get('/manifest.json', (req, res) => {
  return json(res, {
    id: 'com.ibraflix.productions',
    version: '1.0.0',
    name: 'Ibraflix Productions',
    description: 'Official catalog, metadata, streams, and subtitles for Ibraflix originals.',
    logo: '',
    resources: ['catalog', 'meta', 'stream', 'subtitles'],
    types: ['tv', 'movie'],
    idPrefixes: ['tmdb:'],
    catalogs: [
      {
        type: 'tv',
        id: 'ibraflix-catalog',
        name: 'Ibraflix Productions',
        extra: [{ name: 'search', isRequired: false }]
      },
      {
        type: 'movie',
        id: 'ibraflix-catalog-movies',
        name: 'Ibraflix Movies',
        extra: [{ name: 'search', isRequired: false }]
      }
    ],
    behaviorHints: { configurable: false }
  });
});

// CATALOG – returns all content from CONTENT_DB
app.get('/catalog/:type/:catalogId.json', (req, res) => {
  const { type, catalogId } = req.params;
  const search = (req.query.search || '').trim().toLowerCase();

  let results = [];

  for (const id in CONTENT_DB) {
    const item = CONTENT_DB[id];
    if (type !== 'other' && item.type !== type) continue;
    if (search && !item.name.toLowerCase().includes(search)) continue;

    results.push({
      id: item.id,
      type: item.type,
      name: item.name,
      poster: item.poster || null,
      posterShape: item.posterShape || 'regular'
    });
  }

  return json(res, { metas: results });
});

// META – returns full metadata for a specific ID
app.get('/meta/:type/:id.json', (req, res) => {
  const id = req.params.id;
  console.log('[Ibraflix] Meta requested for:', id);

  // Try to get the base content (e.g., "tmdb:333643")
  let content = CONTENT_DB[id];

  // If not found, maybe it's an episode ID (e.g., "tmdb:333643:1:1")
  if (!content) {
    const parts = id.split(':');
    if (parts.length >= 3) {
      const baseId = parts.slice(0, 2).join(':'); // e.g., "tmdb:333643"
      content = CONTENT_DB[baseId];
      if (content && content.type === 'tv') {
        const season = parseInt(parts[2], 10);
        const episode = parseInt(parts[3], 10);
        const ep = content.videos.find(v => v.season === season && v.number === episode);
        if (ep) {
          // Return only this episode's metadata (with show poster)
          return json(res, { meta: { 
            ...content, 
            videos: [ep] 
          } });
        }
      }
    }
    return json(res, { meta: null });
  }

  // Return full show/movie metadata
  return json(res, { meta: content });
});

// STREAM – returns the direct video URL
app.get('/stream/:type/:id.json', (req, res) => {
  const id = req.params.id;
  console.log('[Ibraflix] 📺 Stream requested for:', id);

  // Try exact match first
  let stream = STREAM_DB[id];

  // If not found, try to extract base ID (for movies) – but movies are stored directly
  if (!stream) {
    // For TV episodes, we already have the full ID in STREAM_DB
    // For movies, we would have a direct match as well
    console.log('[Ibraflix] ❌ No stream found for ID:', id);
    return json(res, { streams: [] });
  }

  console.log('[Ibraflix] ✅ Returning stream:', stream.url);
  return json(res, {
    streams: [{
      name: 'Ibraflix Productions',
      title: stream.title || 'Ibraflix Original',
      url: stream.url,
      quality: stream.quality || '1080p'
    }]
  });
});

// SUBTITLES
app.get('/subtitles/:type/:id.json', (req, res) => {
  const id = req.params.id;
  return json(res, { subtitles: SUBTITLE_DB[id] || [] });
});

app.listen(PORT, () => {
  console.log(`Ibraflix multi-content addon listening on port ${PORT}`);
});
