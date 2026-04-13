import { Response } from 'express';
import { supabase } from '../config/supabase.js';
import { AuthRequest } from '../middleware/auth.js';

interface CreatePlaylistBody {
  name: string;
}

interface AddTrackBody {
  track_id: string;
  title: string;
  artist: string;
  thumbnail_url: string;
  duration_seconds?: number;
}

interface RenamePlaylistBody {
  name: string;
}

interface ReorderTracksBody {
  // Ordered list of playlist_tracks.id for this playlist
  trackIds: string[];
}

// GET /api/playlists - Obtener todas las playlists del usuario
export async function getUserPlaylists(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const { data, error } = await supabase
      .from('playlists')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching playlists:', error);
      res.status(500).json({ error: 'Error al obtener playlists' });
      return;
    }

    res.json(data);
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Error inesperado' });
  }
}

// POST /api/playlists - Crear una nueva playlist
export async function createPlaylist(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { name } = req.body as CreatePlaylistBody;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    if (!name || typeof name !== 'string' || name.trim() === '') {
      res.status(400).json({ error: 'El nombre de la playlist es requerido' });
      return;
    }

    const { data, error } = await supabase
      .from('playlists')
      .insert([
        {
          user_id: userId,
          name: name.trim(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating playlist:', error);
      res.status(500).json({ error: 'Error al crear playlist' });
      return;
    }

    res.status(201).json(data);
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Error inesperado' });
  }
}

// GET /api/playlists/:id/tracks - Obtener tracks de una playlist
export async function getPlaylistTracks(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const playlistId = req.params.id;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    // Verificar que la playlist pertenece al usuario
    const { data: playlist, error: playlistError } = await supabase
      .from('playlists')
      .select('id')
      .eq('id', playlistId)
      .eq('user_id', userId)
      .single();

    if (playlistError || !playlist) {
      res.status(404).json({ error: 'Playlist no encontrada' });
      return;
    }

    const { data, error } = await supabase
      .from('playlist_tracks')
      .select('*')
      .eq('playlist_id', playlistId)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching tracks:', error);
      res.status(500).json({ error: 'Error al obtener tracks' });
      return;
    }

    res.json(data);
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Error inesperado' });
  }
}

// POST /api/playlists/:id/tracks - Agregar track a playlist
export async function addTrackToPlaylist(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const playlistId = req.params.id;
    const { track_id, title, artist, thumbnail_url, duration_seconds } = req.body as AddTrackBody;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    if (!track_id || !title || !artist) {
      res.status(400).json({ error: 'track_id, title y artist son requeridos' });
      return;
    }

    // Verificar que la playlist pertenece al usuario
    const { data: playlist, error: playlistError } = await supabase
      .from('playlists')
      .select('id')
      .eq('id', playlistId)
      .eq('user_id', userId)
      .single();

    if (playlistError || !playlist) {
      res.status(404).json({ error: 'Playlist no encontrada' });
      return;
    }

    // Obtener la siguiente posición
    const { data: lastTrack } = await supabase
      .from('playlist_tracks')
      .select('position')
      .eq('playlist_id', playlistId)
      .order('position', { ascending: false })
      .limit(1)
      .single();

    const nextPosition = (lastTrack?.position ?? -1) + 1;

    const { data, error } = await supabase
      .from('playlist_tracks')
      .insert([
        {
          playlist_id: playlistId,
          user_id: userId,
          track_id,
          title,
          artist,
          thumbnail_url,
          duration_seconds: duration_seconds || null,
          position: nextPosition,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error adding track:', error);
      res.status(500).json({ error: 'Error al agregar track' });
      return;
    }

    res.status(201).json(data);
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Error inesperado' });
  }
}

// DELETE /api/playlists/:id/tracks/:trackId - Remover track de playlist
export async function removeTrackFromPlaylist(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const playlistId = req.params.id;
    const trackId = req.params.trackId;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    // Verificar que la playlist pertenece al usuario
    const { data: playlist, error: playlistError } = await supabase
      .from('playlists')
      .select('id')
      .eq('id', playlistId)
      .eq('user_id', userId)
      .single();

    if (playlistError || !playlist) {
      res.status(404).json({ error: 'Playlist no encontrada' });
      return;
    }

    const { error } = await supabase
      .from('playlist_tracks')
      .delete()
      .eq('id', trackId)
      .eq('playlist_id', playlistId);

    if (error) {
      console.error('Error removing track:', error);
      res.status(500).json({ error: 'Error al remover track' });
      return;
    }

    res.status(204).send();
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Error inesperado' });
  }
}

// DELETE /api/playlists/:id - Eliminar playlist
export async function deletePlaylist(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const playlistId = req.params.id;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    // Verificar que la playlist pertenece al usuario
    const { data: playlist, error: playlistError } = await supabase
      .from('playlists')
      .select('id')
      .eq('id', playlistId)
      .eq('user_id', userId)
      .single();

    if (playlistError || !playlist) {
      res.status(404).json({ error: 'Playlist no encontrada' });
      return;
    }

    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('id', playlistId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting playlist:', error);
      res.status(500).json({ error: 'Error al eliminar playlist' });
      return;
    }

    res.status(204).send();
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Error inesperado' });
  }
}

// PATCH /api/playlists/:id - Renombrar playlist
export async function renamePlaylist(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const playlistId = req.params.id;
    const { name } = req.body as RenamePlaylistBody;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    if (!name || typeof name !== 'string' || name.trim() === '') {
      res.status(400).json({ error: 'El nombre de la playlist es requerido' });
      return;
    }

    // Verificar que la playlist pertenece al usuario
    const { data: playlist, error: playlistError } = await supabase
      .from('playlists')
      .select('id')
      .eq('id', playlistId)
      .eq('user_id', userId)
      .single();

    if (playlistError || !playlist) {
      res.status(404).json({ error: 'Playlist no encontrada' });
      return;
    }

    const { data, error } = await supabase
      .from('playlists')
      .update({ name: name.trim() })
      .eq('id', playlistId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error renaming playlist:', error);
      res.status(500).json({ error: 'Error al renombrar playlist' });
      return;
    }

    res.json(data);
  } catch (err) {
    console.error('Unexpected error renaming playlist:', err);
    res.status(500).json({ error: 'Error inesperado' });
  }
}

// PATCH /api/playlists/:id/tracks/reorder - Reordenar tracks de playlist
export async function reorderPlaylistTracks(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const playlistId = req.params.id;
    const { trackIds } = req.body as ReorderTracksBody;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    if (!Array.isArray(trackIds) || trackIds.length === 0) {
      res.status(400).json({ error: 'trackIds debe ser un array no vacío' });
      return;
    }

    // Verificar que la playlist pertenece al usuario
    const { data: playlist, error: playlistError } = await supabase
      .from('playlists')
      .select('id')
      .eq('id', playlistId)
      .eq('user_id', userId)
      .single();

    if (playlistError || !playlist) {
      res.status(404).json({ error: 'Playlist no encontrada' });
      return;
    }

    // Obtener los tracks actuales para validar que los ids pertenecen a la playlist
    const { data: existingTracks, error: tracksError } = await supabase
      .from('playlist_tracks')
      .select('id')
      .eq('playlist_id', playlistId)
      .order('position', { ascending: true });

    if (tracksError) {
      console.error('Error fetching playlist tracks for reorder:', tracksError);
      res.status(500).json({ error: 'Error al obtener tracks de playlist' });
      return;
    }

    const existing = existingTracks ?? [];

    // Debe ser un reordenamiento exacto: mismo número de elementos y mismos ids.
    const existingIds = existing.map((t) => String(t.id));

    if (existingIds.length !== trackIds.length) {
      res.status(400).json({ error: 'trackIds debe contener exactamente todos los tracks de la playlist' });
      return;
    }

    const existingSet = new Set(existingIds);
    for (const id of trackIds) {
      if (!existingSet.has(id)) {
        res
          .status(400)
          .json({ error: 'trackIds contiene elementos que no pertenecen a la playlist o faltan elementos' });
        return;
      }
    }

    // Reasignar posiciones de 0..n-1 según el nuevo orden
    const updates = trackIds.map((id, index) => ({
      id,
      playlist_id: playlistId,
      user_id: userId,
      position: index,
    }));

    const { error } = await supabase.from('playlist_tracks').upsert(updates, { onConflict: 'id' });

    if (error) {
      console.error('Error reordering playlist tracks:', error);
      res.status(500).json({ error: 'Error al reordenar tracks' });
      return;
    }

    res.status(204).send();
  } catch (err) {
    console.error('Unexpected error reordering playlist tracks:', err);
    res.status(500).json({ error: 'Error inesperado' });
  }
}
