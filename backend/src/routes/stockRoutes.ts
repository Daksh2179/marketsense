import { Router } from 'express';
import * as stockController from '../controllers/stockController';

const router = Router();

// GET /api/stocks
router.get('/', stockController.getAllStocks);

// GET /api/stocks/:symbol
router.get('/:symbol', stockController.getStockBySymbol);

// GET /api/stocks/:symbol/history
router.get('/:symbol/history', stockController.getStockHistory);

// GET /api/stocks/:symbol/predictions
router.get('/:symbol/predictions', stockController.getPredictedPrices);

export default router;