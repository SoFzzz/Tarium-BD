import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getUserPlaylists,
  createPlaylist,
  getPlaylistTracks,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  deletePlaylist,
  renamePlaylist,
  reorderPlaylistTracks,
} from '../controllers/playlistController.js';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// GET /api/playlists - Obtener todas las playlists del usuario
router.get('/', getUserPlaylists);

// POST /api/playlists - Crear una nueva playlist
router.post('/', createPlaylist);

// PATCH /api/playlists/:id - Renombrar playlist
router.patch('/:id', renamePlaylist);

// GET /api/playlists/:id/tracks - Obtener tracks de una playlist
router.get('/:id/tracks', getPlaylistTracks);

// POST /api/playlists/:id/tracks - Agregar track a playlist
router.post('/:id/tracks', addTrackToPlaylist);

// DELETE /api/playlists/:id/tracks/:trackId - Remover track de playlist
router.delete('/:id/tracks/:trackId', removeTrackFromPlaylist);

// PATCH /api/playlists/:id/tracks/reorder - Reordenar tracks de playlist
router.patch('/:id/tracks/reorder', reorderPlaylistTracks);

// DELETE /api/playlists/:id - Eliminar playlist
router.delete('/:id', deletePlaylist);

export default router;
