import express from 'express';
import { MLService } from '../services/mlService';
import { StockPriceModel } from '../models/StockPrice';
import { SentimentModel } from '../models/Sentiment';
import { CompanyModel } from '../models/Company';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * @route   POST /ml/predict/:ticker
 * @desc    Generate enhanced ML predictions for a stock
 */
router.post('/predict/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    const { prediction_days = 7 } = req.body;
    
    // Validate ticker
    const company = await CompanyModel.getByTicker(ticker);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Get price history (last 100 days for training)
    const priceHistory = await StockPriceModel.getHistoricalPrices(ticker);
    if (priceHistory.length < 40) {
      return res.status(400).json({ error: 'Insufficient price data for ML prediction' });
    }

    // Get sentiment history
    const sentimentHistory = await SentimentModel.getHistoricalSentiment(ticker);
    
    logger.info(`Generating ML predictions for ${ticker} with ${priceHistory.length} price points and ${sentimentHistory.length} sentiment points`);

    // Generate enhanced predictions
    const predictions = await MLService.generateEnhancedPredictions(
      ticker,
      priceHistory.slice(-100), // Use last 100 days
      sentimentHistory.slice(-100),
      prediction_days
    );

    res.status(200).json(predictions);
  } catch (error: any) {
    logger.error(`Error generating ML predictions for ${req.params.ticker}:`, error);
    
    // Return fallback prediction on error
    try {
      const latestPrice = await StockPriceModel.getLatestPrice(req.params.ticker);
      const fallbackPrediction = MLService.createFallbackPrediction(
        req.params.ticker,
        latestPrice?.close || 100,
        req.body.prediction_days || 7
      );
      
      res.status(200).json({
        ...fallbackPrediction,
        warning: 'Using fallback prediction - ML service unavailable'
      });
    } catch (fallbackError) {
      res.status(500).json({ error: 'ML prediction service failed' });
    }
  }
});

/**
 * @route   GET /ml/health
 * @desc    Check ML service health
 */
router.get('/health', async (req, res) => {
  try {
    const health = await MLService.checkHealth();
    res.status(200).json(health);
  } catch (error: any) {
    logger.error('Error checking ML service health:', error);
    res.status(500).json({ error: 'Failed to check ML service health' });
  }
});

export default router;