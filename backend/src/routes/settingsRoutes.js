import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.get('/', authenticateToken, getSettings);
router.post('/', authenticateToken, updateSettings);

export default router;

