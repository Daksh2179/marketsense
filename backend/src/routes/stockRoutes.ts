import express from 'express';
import { stockController } from '../controllers/stockController';

const router = express.Router();

/**
 * @route   GET /stocks/compare
 * @desc    Compare multiple stocks
 */
router.get('/compare', stockController.compareStocks);

/**
 * @route   GET /stocks/:ticker/price
 * @desc    Get latest price for a stock
 */
router.get('/:ticker/price', stockController.getLatestPrice);

/**
 * @route   GET /stocks/:ticker/history
 * @desc    Get historical prices for a stock
 */
router.get('/:ticker/history', stockController.getHistoricalPrices);

/**
 * @route   GET /stocks/:ticker/chart
 * @desc    Get price chart data
 */
router.get('/:ticker/chart', stockController.getPriceChartData);

/**
 * @route   GET /stocks/:ticker/indicators
 * @desc    Get technical indicators
 */
router.get('/:ticker/indicators', stockController.getTechnicalIndicators);

/**
 * @route   GET /stocks/:ticker/correlation
 * @desc    Get price and sentiment correlation
 */
router.get('/:ticker/correlation', stockController.getPriceSentimentCorrelation);

/**
 * @route   GET /stocks/:ticker/regime
 * @desc    Get market regime data
 */
router.get('/:ticker/regime', stockController.getMarketRegime);

export default router;