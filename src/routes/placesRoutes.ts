import { Router } from 'express';
import { getAllPlaces, updatePlaceStatus, getPlaceById, updatePlace, deletePlace } from '../controllers/placesController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, getAllPlaces);
router.get('/:id', authMiddleware, getPlaceById);
router.put('/:id', authMiddleware, updatePlace);
router.patch('/:id/status', authMiddleware, updatePlaceStatus);
router.delete('/:id', authMiddleware, deletePlace);

export default router;
