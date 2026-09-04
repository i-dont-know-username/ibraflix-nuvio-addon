const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

const SHOW = {
  id: 'tmdb-333643',
  type: 'series',
  name: 'Supernatural Powers',
  description: 'A creator-made series from Ibraflix Productions.',
  genres: [],
  videos: [
    {
      id: 'tmdb-333643:1:1',
      season: 1,
      number: 1,
      title: 'Episode 1',
      name: 'Episode 1'
    }
  ]
};

// Episode video sources. Add future episodes here.
const EPISODES = {
  '1:1': {
    url: 'https://0807.st/epiNrPV.mp4',
    quality: '1080p',
    title: 'Supernatural Powers — S01E01'
  }

  // Example:
  // ,'1:2': {
  //   url: 'https://example.com/episode-2.mp4',
  //   quality: '1080p',
  //   title: 'Supernatural Powers — S01E02'
  // }
};

// Optional subtitle URLs. Leave empty while the episodes have no dialogue.
// Later, add a direct .vtt URL (preferred) or .srt URL for an episode.
const SUBTITLES = {
  // '1:1': [
  //   { id: 'en-1-1', url: 'https://example.com/ep1-en.vtt', lang: 'eng', label: 'English' }
  // ]
};

function json(res, body) {
  res.set('Cache-Control', 'public, max-age=60');
  return res.json(body);
}

function addCors(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
}

app.use((req, res, next) => {
  addCors(res);
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get('/', (req, res) => {
  res.type('text').send('Ibraflix Productions — Supernatural Powers addon');
});

app.get('/manifest.json', (req, res) => {
  return json(res, {
    id: 'com.ibraflix.supernaturalpowers',
    version: '1.0.0',
    name: 'Ibraflix Productions',
    description: 'Official catalog, metadata, streams, and subtitles for Supernatural Powers.',
    logo: '',
    resources: [
      'catalog',
      'meta',
      'stream',
      'subtitles'
    ],
    types: ['series'],
    idPrefixes: ['tmdb:'],
    catalogs: [
      {
        type: 'series',
        id: 'ibraflix.supernatural-powers',
        name: 'Ibraflix Productions',
        extra: [
          { name: 'search', isRequired: false }
        ]
      }
    ],
    behaviorHints: {
      configurable: false,
      configurationRequired: false
    }
  });
});

app.get('/catalog/series/ibraflix.supernatural-powers.json', (req, res) => {
  const q = String(req.query.search || '').trim().toLowerCase();

  // For an exact/strong search match, return the show first.
  // With no query, this catalog still acts as a home/discover catalog.
  const matches = !q || 'supernatural powers'.includes(q) || q.includes('supernatural powers')
    ? [
        {
          id: SHOW.id,
          type: 'series',
          name: SHOW.name
        }
      ]
    : [];

  return json(res, { metas: matches });
});

app.get('/meta/series/tmdb-333643.json', (req, res) => {
  return json(res, {
    meta: {
      id: SHOW.id,
      type: SHOW.type,
      name: SHOW.name,
      description: SHOW.description,
      genres: SHOW.genres,
      videos: SHOW.videos
    }
  });
});

app.get('/stream/series/:id.json', (req, res) => {
  const rawId = decodeURIComponent(req.params.id);
  const match = rawId.match(/^tmdb-333643:(\d+):(\d+)$/);

  if (!match) return json(res, { streams: [] });

  const key = match[1] + ':' + match[2];
  const ep = EPISODES[key];
  if (!ep) return json(res, { streams: [] });

  return json(res, {
    streams: [
      {
        name: 'Ibraflix Productions',
        title: ep.title,
        url: ep.url,
        quality: ep.quality || '1080p'
      }
    ]
  });
});

app.get('/subtitles/series/:id.json', (req, res) => {
  const rawId = decodeURIComponent(req.params.id);
  const match = rawId.match(/^tmdb-333643:(\d+):(\d+)$/);

  if (!match) return json(res, { subtitles: [] });

  const key = match[1] + ':' + match[2];
  const subtitles = SUBTITLES[key] || [];

  return json(res, { subtitles });
});

app.listen(PORT, () => {
  console.log(`Ibraflix addon listening on port ${PORT}`);
});
