import express from 'express';
import { marketController } from '../controllers/marketController';

const router = express.Router();

/**
 * @route   GET /market/overview
 * @desc    Get market indices overview (S&P 500, NASDAQ, Dow, Russell)
 */
router.get('/overview', marketController.getMarketOverview);

/**
 * @route   GET /market/performers
 * @desc    Get top performing stocks (gainers and losers)
 */
router.get('/performers', marketController.getTopPerformers);

/**
 * @route   GET /market/trending
 * @desc    Get trending stocks with sentiment analysis
 */
router.get('/trending', marketController.getTrendingStocks);

/**
 * @route   GET /market/sentiment
 * @desc    Get stocks categorized by sentiment (positive/negative)
 */
router.get('/sentiment', marketController.getStocksBySentiment);

/**
 * @route   GET /market/news
 * @desc    Get recent market news
 */
router.get('/news', marketController.getMarketNews);

/**
 * @route   GET /market/summary
 * @desc    Get comprehensive market summary for homepage
 */
router.get('/summary', marketController.getMarketSummary);

export default router;