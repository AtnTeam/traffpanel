import express from 'express';
import { resolveKeitaroClick, getKeitaroLogs, getSubId2 } from '../controllers/keitaroController.js';
import { keitaroApiAuth, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Legacy endpoint for redirect-based flow (kept for backward compatibility)
// No authentication - used by Keitaro tracker
router.get('/resolve', resolveKeitaroClick);
router.post('/resolve', resolveKeitaroClick);

// New API endpoint for server-to-server requests (returns JSON)
// Optional authentication via KEITARO_API_KEY env variable
// No JWT auth - used by Keitaro tracker
router.get('/api/sub_id_2', keitaroApiAuth, getSubId2);
router.post('/api/sub_id_2', keitaroApiAuth, getSubId2);

// Endpoint for getting logs - requires JWT authentication
router.get('/logs', authenticateToken, getKeitaroLogs);

export default router;

