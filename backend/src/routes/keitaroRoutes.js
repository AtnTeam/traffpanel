import express from 'express';
import { getSubId2 } from '../controllers/keitaroController.js';
import { keitaroApiAuth } from '../middleware/auth.js';

const router = express.Router();

// API endpoint for server-to-server requests (returns JSON)
// Optional authentication via KEITARO_API_KEY env variable
router.get('/api/sub_id_2', keitaroApiAuth, getSubId2);
router.post('/api/sub_id_2', keitaroApiAuth, getSubId2);

export default router;

