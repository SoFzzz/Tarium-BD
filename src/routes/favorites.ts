import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getUserFavorites,
  addFavorite,
  removeFavorite,
} from '../controllers/favoriteController.js';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// GET /api/favorites - Obtener todos los favoritos del usuario
router.get('/', getUserFavorites);

// POST /api/favorites - Agregar track a favoritos
router.post('/', addFavorite);

// DELETE /api/favorites/:trackId - Remover track de favoritos
router.delete('/:trackId', removeFavorite);

export default router;
