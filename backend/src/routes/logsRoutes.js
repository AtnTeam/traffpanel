import express from 'express';
import {
  getAllLogs,
  getLogById,
  cleanupOldLogs
} from '../controllers/logsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All logs routes require authentication
router.get('/', authenticateToken, getAllLogs);
router.get('/:id', authenticateToken, getLogById);
router.delete('/cleanup', authenticateToken, cleanupOldLogs);

export default router;

