import express from 'express';
import { stockController } from '../controllers/stockController';
import { StockPriceModel } from '../models/StockPrice';

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

router.post('/:ticker/refresh-price', async (req, res) => {
  try {
    const { ticker } = req.params;
    const { FinancialApiService } = require('../services/financialApiService');
    
    // Force fetch from Finnhub
    const quote = await FinancialApiService.getStockQuote(ticker);
    
    if (quote && quote.c) {
      // Store in database
      await StockPriceModel.create({
        ticker,
        date: new Date(),
        close: parseFloat(quote.c),
        open: parseFloat(quote.o),
        high: parseFloat(quote.h),
        low: parseFloat(quote.l),
        volume: parseInt(quote.v),
        adjusted_close: parseFloat(quote.c)
      });
      
      res.status(200).json({
        success: true,
        price: quote.c,
        message: `Price updated for ${ticker}`
      });
    } else {
      throw new Error('Failed to fetch price');
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
export default router;