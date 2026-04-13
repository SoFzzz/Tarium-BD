import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  registerPlay,
  getRecentHistory,
  getTopHistory,
} from '../controllers/historyController.js';

const router = Router();

router.use(authMiddleware);

// POST /api/history/play - registrar reproducción (upsert)
router.post('/play', registerPlay);

// GET /api/history/recent - últimos reproducidos
router.get('/recent', getRecentHistory);

// GET /api/history/top - más escuchados
router.get('/top', getTopHistory);

export default router;
