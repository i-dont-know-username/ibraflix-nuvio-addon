const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// ---------- CONFIGURATION ----------
const SHOW_ID = 'tmdb:333643';
const SHOW = {
  id: SHOW_ID,
  type: 'tv',
  name: 'Supernatural Powers',
  description: 'A creator-made series from Ibraflix Productions.',
  genres: [],
  videos: [
    {
      id: 'tmdb:333643:1:1',
      season: 1,
      number: 1,
      title: 'Episode 1',
      name: 'Episode 1'
    }
    // Add future episodes here, e.g.:
    // {
    //   id: 'tmdb:333643:1:2',
    //   season: 1,
    //   number: 2,
    //   title: 'Episode 2',
    //   name: 'Episode 2'
    // }
  ]
};

// Episode video sources – add future episodes here
const EPISODES = {
  '1:1': {
    url: 'https://0807.st/epiNrPV.mp4',
    quality: '1080p',
    title: 'Supernatural Powers — S01E01'
  }
  // Example future:
  // '1:2': {
  //   url: 'https://example.com/episode-2.mp4',
  //   quality: '1080p',
  //   title: 'Supernatural Powers — S01E02'
  // }
};

// Optional subtitles – leave empty for now
const SUBTITLES = {
  // '1:1': [
  //   { id: 'en-1-1', url: 'https://example.com/ep1.vtt', lang: 'eng', label: 'English' }
  // ]
};

// ---------- HELPERS ----------
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

// ---------- ROUTES ----------

// Root
app.get('/', (req, res) => {
  res.type('text').send('Ibraflix Productions — Supernatural Powers addon');
});

// Manifest
app.get('/manifest.json', (req, res) => {
  return json(res, {
    id: 'com.ibraflix.supernaturalpowers',
    version: '1.0.0',
    name: 'Ibraflix Productions',
    description: 'Official catalog, metadata, streams, and subtitles for Supernatural Powers.',
    logo: '',
    resources: ['catalog', 'meta', 'stream', 'subtitles'],
    types: ['tv'],
    idPrefixes: ['tmdb:'],
    catalogs: [
      {
        type: 'tv',
        id: 'ibraflix-supernatural-powers',
        name: 'Ibraflix Productions',
        extra: [{ name: 'search', isRequired: false }]
      }
    ],
    behaviorHints: { configurable: false }
  });
});

// Catalog – hardcoded for this specific catalog ID
app.get('/catalog/tv/ibraflix-supernatural-powers.json', (req, res) => {
  const q = (req.query.search || '').trim().toLowerCase();
  const matches = (!q || 'supernatural powers'.includes(q) || q.includes('supernatural powers'))
    ? [{ id: SHOW_ID, type: 'tv', name: SHOW.name }]
    : [];
  return json(res, { metas: matches });
});

// Metadata – generic route that handles both the show and individual episodes
app.get('/meta/tv/:id.json', (req, res) => {
  const id = req.params.id;

  // If it's the full show
  if (id === SHOW_ID) {
    return json(res, { meta: SHOW });
  }

  // If it's an episode (format: tmdb:333643:season:episode)
  const match = id.match(/^tmdb:333643:(\d+):(\d+)$/);
  if (match) {
    const season = parseInt(match[1], 10);
    const episode = parseInt(match[2], 10);
    const ep = SHOW.videos.find(v => v.season === season && v.number === episode);
    if (ep) {
      // Return only that episode's metadata
      return json(res, { meta: { ...SHOW, videos: [ep] } });
    }
  }

  // Not found
  return json(res, { meta: null });
});

// Streams – returns the direct video URL
app.get('/stream/tv/:id.json', (req, res) => {
  const id = req.params.id;
  const match = id.match(/^tmdb:333643:(\d+):(\d+)$/);
  if (!match) return json(res, { streams: [] });

  const key = match[1] + ':' + match[2];
  const ep = EPISODES[key];
  if (!ep) return json(res, { streams: [] });

  return json(res, {
    streams: [{
      name: 'Ibraflix Productions',
      title: ep.title,
      url: ep.url,
      quality: ep.quality || '1080p'
    }]
  });
});

// Subtitles – returns subtitle URLs (currently empty)
app.get('/subtitles/tv/:id.json', (req, res) => {
  const id = req.params.id;
  const match = id.match(/^tmdb:333643:(\d+):(\d+)$/);
  if (!match) return json(res, { subtitles: [] });

  const key = match[1] + ':' + match[2];
  return json(res, { subtitles: SUBTITLES[key] || [] });
});

// ---------- START SERVER ----------
app.listen(PORT, () => {
  console.log(`Ibraflix addon listening on port ${PORT}`);
});
