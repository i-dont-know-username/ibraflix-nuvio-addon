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
    // Add future episodes here
  ]
};

const EPISODES = {
  '1:1': {
    url: 'https://0807.st/epiNrPV.mp4',
    quality: '1080p',
    title: 'Supernatural Powers — S01E01'
  }
  // future: '1:2': { url: '...', quality: '1080p', title: '...' }
};

const SUBTITLES = {
  // future: '1:1': [ { id: 'en-1-1', url: '...', lang: 'eng' } ]
};

// ---------- HELPERS ----------
function json(res, body) {
  res.set('Cache-Control', 'public, max-age=60');
  return res.json(body);
}

app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ---------- ROUTES ----------
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

// Catalog
app.get('/catalog/tv/ibraflix-supernatural-powers.json', (req, res) => {
  const q = (req.query.search || '').trim().toLowerCase();
  const matches = (!q || 'supernatural powers'.includes(q) || q.includes('supernatural powers'))
    ? [{ id: SHOW_ID, type: 'tv', name: SHOW.name }]
    : [];
  return json(res, { metas: matches });
});

// Meta (show)
app.get('/meta/tv/tmdb:333643.json', (req, res) => {
  return json(res, { meta: SHOW });
});

// Meta (episode) – optional but good practice
app.get('/meta/tv/:id.json', (req, res) => {
  const id = req.params.id;
  if (id === SHOW_ID) return json(res, { meta: SHOW });
  // parse episode: tmdb:333643:1:1
  const match = id.match(/^tmdb:333643:(\d+):(\d+)$/);
  if (match) {
    const ep = SHOW.videos.find(v => v.season === parseInt(match[1]) && v.number === parseInt(match[2]));
    if (ep) return json(res, { meta: { ...SHOW, videos: [ep] } });
  }
  return json(res, { meta: null });
});

// Stream
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

// Subtitles
app.get('/subtitles/tv/:id.json', (req, res) => {
  const id = req.params.id;
  const match = id.match(/^tmdb:333643:(\d+):(\d+)$/);
  if (!match) return json(res, { subtitles: [] });
  const key = match[1] + ':' + match[2];
  return json(res, { subtitles: SUBTITLES[key] || [] });
});

app.listen(PORT, () => console.log(`Ibraflix addon listening on port ${PORT}`));
