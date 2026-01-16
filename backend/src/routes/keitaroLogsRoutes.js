import express from 'express';
import {
  getAllKeitaroLogs,
  getKeitaroLogByIdController
} from '../controllers/keitaroLogsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All Keitaro logs routes require authentication
router.get('/', authenticateToken, getAllKeitaroLogs);
router.get('/:id', authenticateToken, getKeitaroLogByIdController);

export default router;

