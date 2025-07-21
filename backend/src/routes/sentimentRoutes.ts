import { Router } from 'express';
import * as sentimentController from '../controllers/sentimentController';

const router = Router();

// GET /api/sentiment/:symbol
router.get('/:symbol', sentimentController.getSentimentBySymbol);

// GET /api/sentiment/:symbol/predictions
router.get('/:symbol/predictions', sentimentController.getSentimentEnhancedPredictions);

export default router;