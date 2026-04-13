import { Response } from 'express';
import { supabase } from '../config/supabase.js';
import { AuthRequest } from '../middleware/auth.js';

interface RegisterPlayBody {
  track_id: string;
  title: string;
  artist: string;
  album?: string;
  duration_seconds?: number;
  thumbnail_url?: string;
}

// POST /api/history/play
export async function registerPlay(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { track_id, title, artist, album, duration_seconds, thumbnail_url } = req.body as RegisterPlayBody;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    if (!track_id || !title || !artist) {
      res.status(400).json({ error: 'track_id, title y artist son requeridos' });
      return;
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('history')
      .upsert(
        {
          user_id: userId,
          track_id,
          source_type: 'local',
          title,
          artist,
          album: album ?? null,
          duration_seconds: duration_seconds ?? null,
          thumbnail_url: thumbnail_url ?? null,
          play_count: 1,
          last_played_at: now,
        },
        {
          onConflict: 'user_id,track_id,source_type',
        },
      )
      .select()
      .single();

    if (error) {
      console.error('Error upserting history:', error);
      res.status(500).json({ error: 'Error al registrar historial' });
      return;
    }

    // Si ya existía, incrementar play_count y last_played_at manualmente.
    if (data && data.id) {
      await supabase
        .from('history')
        .update({
          play_count: (data.play_count ?? 0) + 1,
          last_played_at: now,
        })
        .eq('id', data.id);
    }

    res.status(204).send();
  } catch (err) {
    console.error('Unexpected error registering history:', err);
    res.status(500).json({ error: 'Error inesperado' });
  }
}

// GET /api/history/recent
export async function getRecentHistory(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const { data, error } = await supabase
      .from('history')
      .select('*')
      .eq('user_id', userId)
      .order('last_played_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching recent history:', error);
      res.status(500).json({ error: 'Error al obtener historial reciente' });
      return;
    }

    res.json(data ?? []);
  } catch (err) {
    console.error('Unexpected error fetching recent history:', err);
    res.status(500).json({ error: 'Error inesperado' });
  }
}

// GET /api/history/top
export async function getTopHistory(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const { data, error } = await supabase
      .from('history')
      .select('*')
      .eq('user_id', userId)
      .order('play_count', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching top history:', error);
      res.status(500).json({ error: 'Error al obtener historial top' });
      return;
    }

    res.json(data ?? []);
  } catch (err) {
    console.error('Unexpected error fetching top history:', err);
    res.status(500).json({ error: 'Error inesperado' });
  }
}
