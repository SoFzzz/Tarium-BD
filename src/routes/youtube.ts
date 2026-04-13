import { Router } from 'express';
import fetch from 'node-fetch';

const router = Router();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

if (!YOUTUBE_API_KEY) {
  console.warn('⚠️ YOUTUBE_API_KEY no está configurada. Las búsquedas de YouTube fallarán.');
}

// Normalización al tipo YouTubeSearchResult del frontend
function mapYouTubeItemToSearchResult(item: any) {
  const id = item.id?.videoId || item.id;
  const snippet = item.snippet || {};
  const thumbnails = snippet.thumbnails || {};
  const bestThumb = thumbnails.high || thumbnails.medium || thumbnails.default || {};

  return {
    youtubeId: id,
    title: snippet.title || '',
    artistOrChannel: snippet.channelTitle || '',
    thumbnailUrl: bestThumb.url || '',
    durationSeconds: undefined, // se puede ampliar con otra llamada si se requiere
  };
}

// GET /api/youtube/search?q=
router.get('/search', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) {
      res.json([]);
      return;
    }

    if (!YOUTUBE_API_KEY) {
      res.status(500).json({ error: 'YouTube API key no configurada' });
      return;
    }

    const params = new URLSearchParams({
      key: YOUTUBE_API_KEY,
      part: 'snippet',
      type: 'video',
      maxResults: '12',
      q,
    });

    const upstreamUrl = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;
    const upstreamRes = await fetch(upstreamUrl);

    if (!upstreamRes.ok) {
      console.error('YouTube search upstream error', upstreamRes.status, await upstreamRes.text());
      if (upstreamRes.status === 403 || upstreamRes.status === 429) {
        res.status(503).json({ error: 'YouTube rate limit o acceso denegado' });
        return;
      }
      res.status(502).json({ error: 'Error al consultar YouTube' });
      return;
    }

    const json = await upstreamRes.json();
    const items = Array.isArray(json.items) ? json.items : [];

    const normalized = items.map(mapYouTubeItemToSearchResult);
    res.json(normalized);
  } catch (err) {
    console.error('Unexpected YouTube search error', err);
    res.status(500).json({ error: 'Error inesperado al buscar en YouTube' });
  }
});

// GET /api/youtube/metadata?title=&artist=
router.get('/metadata', async (req, res) => {
  try {
    const title = String(req.query.title || '').trim();
    const artist = String(req.query.artist || '').trim();

    if (!title && !artist) {
      res.status(400).json({ error: 'Se requiere al menos title o artist' });
      return;
    }

    if (!YOUTUBE_API_KEY) {
      res.status(500).json({ error: 'YouTube API key no configurada' });
      return;
    }

    const q = artist ? `${title} ${artist}` : title;
    const params = new URLSearchParams({
      key: YOUTUBE_API_KEY,
      part: 'snippet',
      type: 'video',
      maxResults: '1',
      q,
    });

    const upstreamUrl = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;
    const upstreamRes = await fetch(upstreamUrl);

    if (!upstreamRes.ok) {
      console.error('YouTube metadata upstream error', upstreamRes.status, await upstreamRes.text());
      if (upstreamRes.status === 403 || upstreamRes.status === 429) {
        res.status(503).json({ error: 'YouTube rate limit o acceso denegado' });
        return;
      }
      res.status(502).json({ error: 'Error al consultar YouTube' });
      return;
    }

    const json = await upstreamRes.json();
    const item = Array.isArray(json.items) && json.items.length > 0 ? json.items[0] : null;

    if (!item) {
      res.json(null);
      return;
    }

    const mapped = mapYouTubeItemToSearchResult(item);

    res.json({
      title: mapped.title || title,
      artist: mapped.artistOrChannel || artist,
      thumbnailUrl: mapped.thumbnailUrl,
      source: 'youtube-search',
    });
  } catch (err) {
    console.error('Unexpected YouTube metadata error', err);
    res.status(500).json({ error: 'Error inesperado al obtener metadatos de YouTube' });
  }
});

export default router;
