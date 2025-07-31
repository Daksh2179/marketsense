import express from 'express';
import { GeminiService } from '../services/geminiService';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * @route   POST /portfolio/analyze
 * @desc    Analyze portfolio with AI
 */
router.post('/analyze', async (req, res) => {
  try {
    const { stocks, riskTolerance } = req.body;
    
    if (!stocks || !Array.isArray(stocks) || stocks.length === 0) {
      return res.status(400).json({ error: 'Stocks array is required' });
    }
    
    if (!['conservative', 'neutral', 'aggressive'].includes(riskTolerance)) {
      return res.status(400).json({ error: 'Invalid risk tolerance' });
    }

    logger.info(`Analyzing portfolio with ${stocks.length} stocks, risk: ${riskTolerance}`);
    
    const analysis = await GeminiService.analyzePortfolio(stocks, riskTolerance);
    
    res.status(200).json(analysis);
  } catch (error: any) {
    logger.error('Error in portfolio analysis:', error);
    res.status(500).json({ error: 'Failed to analyze portfolio' });
  }
});

/**
 * @route   GET /portfolio/health
 * @desc    Check Gemini service health
 */
router.get('/health', async (req, res) => {
  try {
    const health = await GeminiService.healthCheck();
    res.status(200).json(health);
  } catch (error: any) {
    logger.error('Error checking Gemini health:', error);
    res.status(500).json({ error: 'Failed to check service health' });
  }
});

export default router;