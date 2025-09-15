import express from 'express';
import { sentimentController } from '../controllers/sentimentController';

const router = express.Router();

/**
 * @route   GET /sentiment/compare
 * @desc    Compare sentiments across stocks
 */
router.get('/compare', sentimentController.compareSentiments);

/**
 * @route   GET /sentiment/sectors
 * @desc    Get sector sentiment heatmap
 */
router.get('/sectors', sentimentController.getSectorSentimentHeatmap);

/**
 * @route   GET /sentiment/:ticker
 * @desc    Get latest sentiment for a stock
 */
router.get('/:ticker', sentimentController.getLatestSentiment);

/**
 * @route   GET /sentiment/:ticker/history
 * @desc    Get historical sentiment for a stock
 */
router.get('/:ticker/history', sentimentController.getHistoricalSentiment);

/**
 * @route   GET /sentiment/:ticker/chart
 * @desc    Get sentiment chart data
 */
router.get('/:ticker/chart', sentimentController.getSentimentChartData);

/**
 * @route   GET /sentiment/:ticker/trend
 * @desc    Get sentiment trend
 */
router.get('/:ticker/trend', sentimentController.getSentimentTrend);

/**
 * @route   GET /sentiment/:ticker/headlines
 * @desc    Get latest headlines with sentiment
 */
router.get('/:ticker/headlines', sentimentController.getHeadlinesWithSentiment);

export default router;