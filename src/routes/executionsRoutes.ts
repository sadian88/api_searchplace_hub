import { Router } from 'express';
import { launchScraping, getExecutions, getExecutionById, getExecutionResults, updateExecutionStatus, getCategories, getDashboardStats } from '../controllers/executionsController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/categories', authMiddleware, getCategories as any);
router.get('/stats/dashboard', authMiddleware, getDashboardStats as any);
router.post('/launch', authMiddleware, launchScraping as any);
router.get('/', authMiddleware, getExecutions as any);
router.get('/:id', authMiddleware, getExecutionById as any);
router.patch('/:id/status', authMiddleware, updateExecutionStatus as any);
router.get('/:id/results', authMiddleware, getExecutionResults as any);

export default router;
