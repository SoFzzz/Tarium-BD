import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import playlistRoutes from './routes/playlists.js';
import favoriteRoutes from './routes/favorites.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

dotenv.config({ path: join(projectRoot, '.env.local') });

const app = express();
const port = parseInt(process.env.PORT || '3001', 10);
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

// Middleware
app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
  })
);
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/playlists', playlistRoutes);
app.use('/api/favorites', favoriteRoutes);

// Error handling
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Tarium API running on http://localhost:${port}`);
  console.log(`📡 Frontend CORS allowed from ${frontendUrl}`);
  console.log(`🏥 Health check: http://localhost:${port}/health`);
});
