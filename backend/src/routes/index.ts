import { Router } from 'express';
import stockRoutes from './stockRoutes';
import sentimentRoutes from './sentimentRoutes';

const router = Router();

router.use('/stocks', stockRoutes);
router.use('/sentiment', sentimentRoutes);

export default router;