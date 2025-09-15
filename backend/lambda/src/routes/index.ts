import express from 'express';
import companyRoutes from './companyRoutes';
import stockRoutes from './stockRoutes';
import sentimentRoutes from './sentimentRoutes';
import predictionRoutes from './predictionRoutes';
import portfolioRoutes from './portfolioRoutes';
import mlRoutes from './mlRoutes';
import marketRoutes from './marketRoutes';
import chatRoutes from './chatRoutes';
import { FinancialApiService } from '../services/financialApiService';
import db from '../config/database';
import { logger } from '../utils/logger';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  const apiKeys = FinancialApiService.checkApiKeys();
  
  res.status(200).json({
    status: 'OK',
    message: 'MarketSense API is running',
    timestamp: new Date().toISOString(),
    apiKeys: {
      alphaVantage: apiKeys.alphaVantage ? 'Configured' : 'Missing',
      finnhub: apiKeys.finnhub ? 'Configured' : 'Missing',
      newsApi: apiKeys.newsApi ? 'Configured' : 'Missing',
      newsData: apiKeys.newsData ? 'Configured' : 'Missing'
    }
  });
});

// API usage statistics endpoint
router.get('/api-usage', (req, res) => {
  const apiUsage = FinancialApiService.getApiUsage();
  
  res.status(200).json({
    usage: apiUsage,
    timestamp: new Date().toISOString()
  });
});

// Database test endpoint
router.get('/test-db', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    logger.info('Database test successful');
    
    // Also test if tables exist
    const tablesResult = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    res.status(200).json({
      message: 'Database connection successful',
      timestamp: result.rows[0].now,
      tables: tablesResult.rows.map(row => row.table_name)
    });
  } catch (error: any) {
    logger.error('Database test failed:', error);
    res.status(500).json({
      error: 'Database connection failed',
      details: error.message
    });
  }
});

// Echo endpoint to check if request body is being parsed correctly
router.post('/echo', (req, res) => {
  logger.debug('Echo request body:', req.body);
  res.status(200).json({
    message: 'Echo endpoint',
    receivedBody: req.body,
    contentType: req.headers['content-type']
  });
});

// API Routes
router.use('/companies', companyRoutes);
router.use('/stocks', stockRoutes);
router.use('/sentiment', sentimentRoutes);
router.use('/predictions', predictionRoutes);
router.use('/portfolio', portfolioRoutes);
router.use('/ml', mlRoutes);
router.use('/market', marketRoutes);
router.use('/chat', chatRoutes);

export default router;