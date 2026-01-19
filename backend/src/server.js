import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './config/database.js';
import clicksRoutes from './routes/clicksRoutes.js';
import keitaroRoutes from './routes/keitaroRoutes.js';
import authRoutes from './routes/authRoutes.js';
import logsRoutes from './routes/logsRoutes.js';
import keitaroLogsRoutes from './routes/keitaroLogsRoutes.js';
import { requestLogger } from './middleware/requestLogger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for Cloudflare (important for correct IP detection and HTTPS)
app.set('trust proxy', true);

// CORS configuration - allow requests from any origin for Keitaro landing pages
app.use(cors({
  origin: true, // Allow all origins
  credentials: false,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));
app.use(express.json());

// Request logging middleware (should be after body parser)
app.use(requestLogger);

// Public routes (no authentication required)
app.use('/api/auth', authRoutes);

// Protected routes (authentication required)
app.use('/api/clicks', clicksRoutes);
app.use('/api/keitaro', keitaroRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/keitaro-logs', keitaroLogsRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

const startServer = async () => {
  try {
    await initDatabase();
    
    // Listen on all interfaces (0.0.0.0) to accept connections from domain
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Accessible via: http://localhost:${PORT} or https://cetoki.com`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

