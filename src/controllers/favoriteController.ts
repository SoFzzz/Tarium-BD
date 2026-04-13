import { Response } from 'express';
import { supabase } from '../config/supabase.js';
import { AuthRequest } from '../middleware/auth.js';

interface AddFavoriteBody {
  track_id: string;
  title: string;
  artist: string;
  thumbnail_url: string;
}

// GET /api/favorites - Obtener todos los favoritos del usuario
export async function getUserFavorites(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching favorites:', error);
      res.status(500).json({ error: 'Error al obtener favoritos' });
      return;
    }

    res.json(data);
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Error inesperado' });
  }
}

// POST /api/favorites - Agregar track a favoritos
export async function addFavorite(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { track_id, title, artist, thumbnail_url } = req.body as AddFavoriteBody;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    if (!track_id || !title || !artist) {
      res.status(400).json({ error: 'track_id, title y artist son requeridos' });
      return;
    }

    // Verificar si ya existe en favoritos
    const { data: existingFavorite } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('track_id', track_id)
      .single();

    if (existingFavorite) {
      res.status(409).json({ error: 'Track ya está en favoritos' });
      return;
    }

    const { data, error } = await supabase
      .from('favorites')
      .insert([
        {
          user_id: userId,
          track_id,
          title,
          artist,
          thumbnail_url,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error adding favorite:', error);
      res.status(500).json({ error: 'Error al agregar favorito' });
      return;
    }

    res.status(201).json(data);
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Error inesperado' });
  }
}

// DELETE /api/favorites/:trackId - Remover track de favoritos
export async function removeFavorite(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const trackId = req.params.trackId;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('track_id', trackId);

    if (error) {
      console.error('Error removing favorite:', error);
      res.status(500).json({ error: 'Error al remover favorito' });
      return;
    }

    res.status(204).send();
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Error inesperado' });
  }
}
