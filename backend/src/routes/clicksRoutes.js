import express from 'express';
import { processClicksData, getAllClicksData } from '../controllers/clicksController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All clicks routes require authentication
router.post('/process', authenticateToken, processClicksData);
router.get('/data', authenticateToken, getAllClicksData);

export default router;

