import { Request, Response } from 'express';
import { SentimentModel } from '../models/Sentiment';
import { NewsHeadlineModel } from '../models/NewsHeadline';
import { CompanyModel } from '../models/Company';
import { SentimentService } from '../services/sentimentService';
import { DataIngestionService } from '../services/dataIngestionService';
import { logger } from '../utils/logger';
import { GeminiService } from '../services/geminiService';

export const sentimentController = {
  /**
   * Get latest sentiment for a stock
   */
  getLatestSentiment: async (req: Request, res: Response): Promise<void> => {
    try {
      const { ticker } = req.params;
      
      // Validate ticker
      let company = await CompanyModel.getByTicker(ticker);
      
      // If company doesn't exist, try to fetch it first
      if (!company) {
        logger.info(`Company ${ticker} not found in database, fetching from API`);
        const success = await DataIngestionService.fetchAndStoreCompanyData(ticker);
        
        if (success) {
          company = await CompanyModel.getByTicker(ticker);
          
          // Also fetch price data, news, and calculate sentiment
          await DataIngestionService.fetchAndStoreStockPrices(ticker);
          await DataIngestionService.fetchAndStoreNewsHeadlines(ticker);
          await DataIngestionService.calculateAndStoreSentiment(ticker);
        }
      }
      
      if (!company) {
        res.status(404).json({ error: 'Company not found' });
        return;
      }
      
      const latestSentiment = await SentimentModel.getLatestSentiment(ticker);
      
      // If no sentiment data exists, try to calculate it
      if (!latestSentiment) {
        logger.info(`Sentiment data for ${ticker} not found, fetching news and calculating`);
        
        // Fetch news headlines first
        await DataIngestionService.fetchAndStoreNewsHeadlines(ticker);
        
        // Calculate sentiment
        await DataIngestionService.calculateAndStoreSentiment(ticker);
        
        // Try to get sentiment again
        const recalculatedSentiment = await SentimentModel.getLatestSentiment(ticker);
        
        if (!recalculatedSentiment) {
          res.status(404).json({ error: 'No sentiment data found for this stock' });
          return;
        }
        
        res.status(200).json(recalculatedSentiment);
        return;
      }
      
      res.status(200).json(latestSentiment);
    } catch (error) {
      logger.error(`Error fetching latest sentiment for ${req.params.ticker}:`, error);
      res.status(500).json({ error: 'Failed to fetch latest sentiment' });
    }
  },

  /**
   * Get historical sentiment for a stock
   */
  getHistoricalSentiment: async (req: Request, res: Response): Promise<void> => {
    try {
      const { ticker } = req.params;
      const { startDate, endDate } = req.query;
      
      // Validate ticker
      let company = await CompanyModel.getByTicker(ticker);
      
      // If company doesn't exist, try to fetch it first
      if (!company) {
        logger.info(`Company ${ticker} not found in database, fetching from API`);
        const success = await DataIngestionService.fetchAndStoreCompanyData(ticker);
        
        if (success) {
          company = await CompanyModel.getByTicker(ticker);
          
          // Also fetch price data, news, and calculate sentiment
          await DataIngestionService.fetchAndStoreStockPrices(ticker);
          await DataIngestionService.fetchAndStoreNewsHeadlines(ticker);
          await DataIngestionService.calculateAndStoreSentiment(ticker);
        }
      }
      
      if (!company) {
        res.status(404).json({ error: 'Company not found' });
        return;
      }
      
      const historicalSentiment = await SentimentModel.getHistoricalSentiment(
        ticker, 
        startDate as string, 
        endDate as string
      );
      
      // If no historical sentiment data, try to fetch news and calculate
      if (historicalSentiment.length === 0) {
        logger.info(`Historical sentiment for ${ticker} not found, fetching news and calculating`);
        
        // Fetch news headlines first
        await DataIngestionService.fetchAndStoreNewsHeadlines(ticker);
        
        // Calculate sentiment
        await DataIngestionService.calculateAndStoreSentiment(ticker);
        
        // Try to get sentiment again
        const recalculatedSentiment = await SentimentModel.getHistoricalSentiment(
          ticker, 
          startDate as string, 
          endDate as string
        );
        
        if (recalculatedSentiment.length === 0) {
          res.status(404).json({ error: 'No historical sentiment data found for this stock in the specified date range' });
          return;
        }
        
        res.status(200).json(recalculatedSentiment);
        return;
      }
      
      res.status(200).json(historicalSentiment);
    } catch (error) {
      logger.error(`Error fetching historical sentiment for ${req.params.ticker}:`, error);
      res.status(500).json({ error: 'Failed to fetch historical sentiment' });
    }
  },

  /**
   * Get sentiment chart data
   */
  getSentimentChartData: async (req: Request, res: Response): Promise<void> => {
    try {
      const { ticker } = req.params;
      const { range } = req.query;
      
      // Validate ticker
      let company = await CompanyModel.getByTicker(ticker);
      
      // If company doesn't exist, try to fetch it first
      if (!company) {
        logger.info(`Company ${ticker} not found in database, fetching from API`);
        const success = await DataIngestionService.fetchAndStoreCompanyData(ticker);
        
        if (success) {
          company = await CompanyModel.getByTicker(ticker);
          
          // Also fetch price data, news, and calculate sentiment
          await DataIngestionService.fetchAndStoreStockPrices(ticker);
          await DataIngestionService.fetchAndStoreNewsHeadlines(ticker);
          await DataIngestionService.calculateAndStoreSentiment(ticker);
        }
      }
      
      if (!company) {
        res.status(404).json({ error: 'Company not found' });
        return;
      }
      
      // Check if we have sentiment data
      const sentimentCount = await SentimentModel.getSentimentCount(ticker);
      
      // If no sentiment data, fetch news and calculate
      if (sentimentCount === 0) {
        logger.info(`Sentiment data for ${ticker} not found, fetching news and calculating`);
        
        // Fetch news headlines first
        await DataIngestionService.fetchAndStoreNewsHeadlines(ticker);
        
        // Calculate sentiment
        await DataIngestionService.calculateAndStoreSentiment(ticker);
      }
      
      const chartData = await SentimentModel.getSentimentChartData(
        ticker, 
        range as string
      );
      
      res.status(200).json(chartData);
    } catch (error) {
      logger.error(`Error fetching sentiment chart data for ${req.params.ticker}:`, error);
      res.status(500).json({ error: 'Failed to fetch sentiment chart data' });
    }
  },

  /**
   * Get sentiment trend
   */
  getSentimentTrend: async (req: Request, res: Response): Promise<void> => {
    try {
      const { ticker } = req.params;
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      
      // Validate ticker
      let company = await CompanyModel.getByTicker(ticker);
      
      // If company doesn't exist, try to fetch it first
      if (!company) {
        logger.info(`Company ${ticker} not found in database, fetching from API`);
        const success = await DataIngestionService.fetchAndStoreCompanyData(ticker);
        
        if (success) {
          company = await CompanyModel.getByTicker(ticker);
          
          // Also fetch price data, news, and calculate sentiment
          await DataIngestionService.fetchAndStoreStockPrices(ticker);
          await DataIngestionService.fetchAndStoreNewsHeadlines(ticker);
          await DataIngestionService.calculateAndStoreSentiment(ticker);
        }
      }
      
      if (!company) {
        res.status(404).json({ error: 'Company not found' });
        return;
      }
      
      const trendData = await SentimentModel.getSentimentTrend(ticker, days);
      
      res.status(200).json(trendData);
    } catch (error) {
      logger.error(`Error fetching sentiment trend for ${req.params.ticker}:`, error);
      res.status(500).json({ error: 'Failed to fetch sentiment trend' });
    }
  },


  /**
 * Get latest headlines with AI-powered sentiment analysis
 */
getHeadlinesWithSentiment: async (req: Request, res: Response): Promise<void> => {
  try {
    const { ticker } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    logger.info(`Getting headlines with AI sentiment for ${ticker}`);
    
    // Validate company exists
    let company = await CompanyModel.getByTicker(ticker);
    
    if (!company) {
      logger.info(`Company ${ticker} not found, attempting to fetch`);
      const success = await DataIngestionService.fetchAndStoreCompanyData(ticker);
      
      if (success) {
        company = await CompanyModel.getByTicker(ticker);
        await DataIngestionService.fetchAndStoreNewsHeadlines(ticker);
      }
    }
    
    if (!company) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }
    
    // Get headlines
    let headlines = await NewsHeadlineModel.getLatestHeadlines(ticker, limit);
    
    // If no headlines, try to fetch them
    if (headlines.length === 0) {
      logger.info(`No headlines found for ${ticker}, fetching from API`);
      const success = await DataIngestionService.fetchAndStoreNewsHeadlines(ticker);
      
      if (success) {
        headlines = await NewsHeadlineModel.getLatestHeadlines(ticker, limit);
      }
    }
    
    // Always try to get AI insights, even with no headlines
    let aiInsights;
    
    if (headlines.length > 0) {
      const headlineTexts = headlines.map(h => h.headline);
      
      logger.info(`Generating AI insights for ${ticker} with ${headlineTexts.length} headlines`);
      
      // Use the new method with better error handling
      aiInsights = await GeminiService.generateAIInsights(ticker, headlineTexts);
      
      logger.info(`AI insights generated - sentiment: ${aiInsights.overallSentiment}`);
    } else {
      // Even with no headlines, provide default insights
      aiInsights = {
        positiveSummary: ['Limited news coverage available'],
        negativeSummary: ['No recent concerns identified'],
        overallSentiment: 0,
        keyThemes: [{ theme: 'Low Activity', sentiment: 0 }],
        marketImpact: 'Insufficient news data for detailed analysis'
      };
    }
    
    // Return response with AI insights
    res.status(200).json({
      company: company.name,
      ticker: company.ticker,
      headlines: headlines.map(h => ({
        headline: h.headline,
        source: h.source || 'Unknown',
        published_at: h.published_at,
        url: h.url || '#'
      })),
      aiInsights,
      metadata: {
        headlineCount: headlines.length,
        analysisTimestamp: new Date().toISOString(),
        aiService: 'Gemini AI'
      }
    });
    
  } catch (error) {
    logger.error(`Error fetching headlines with sentiment for ${req.params.ticker}:`, error);
    
    // Return error but with fallback data
    res.status(500).json({
      error: 'Failed to fetch complete analysis',
      ticker: req.params.ticker,
      headlines: [],
      aiInsights: {
        positiveSummary: ['Analysis temporarily unavailable'],
        negativeSummary: ['Please try again later'],
        overallSentiment: 0,
        keyThemes: [],
        marketImpact: 'Unable to generate market impact assessment'
      }
    });
  }
},

  /**
   * Compare sentiments across stocks
   */
  compareSentiments: async (req: Request, res: Response): Promise<void> => {
    try {
      const { tickers } = req.query;
      
      if (!tickers) {
        res.status(400).json({ error: 'Tickers parameter is required' });
        return;
      }
      
      const tickerArray = (tickers as string).split(',').map(t => t.trim().toUpperCase());
      
      if (tickerArray.length < 2 || tickerArray.length > 5) {
        res.status(400).json({ error: 'Please provide between 2 and 5 tickers for comparison' });
        return;
      }
      
      // Check if companies exist and fetch them if needed
      for (const ticker of tickerArray) {
        let company = await CompanyModel.getByTicker(ticker);
        
        if (!company) {
          logger.info(`Company ${ticker} not found in database, fetching from API`);
          const success = await DataIngestionService.fetchAndStoreCompanyData(ticker);
          
          if (success) {
            // Fetch news and calculate sentiment
            await DataIngestionService.fetchAndStoreNewsHeadlines(ticker);
            await DataIngestionService.calculateAndStoreSentiment(ticker);
          }
        }
      }
      
      // Validate tickers
      const companies = await Promise.all(
        tickerArray.map(ticker => CompanyModel.getByTicker(ticker))
      );
      
      // Check if all companies exist
      const missingCompanies = companies.map((company, index) => company ? null : tickerArray[index])
        .filter(ticker => ticker !== null);
      
      if (missingCompanies.length > 0) {
        res.status(404).json({ 
          error: `The following companies were not found: ${missingCompanies.join(', ')}` 
        });
        return;
      }
      
      // Get sentiment data for comparison
      const sentimentData = await SentimentModel.compareSentiments(tickerArray);
      
      // Format comparison data
      const comparisonData = tickerArray.map(ticker => ({
        ticker,
        company: companies.find(c => c?.ticker === ticker),
        sentimentData: sentimentData[ticker] || []
      }));
      
      res.status(200).json(comparisonData);
    } catch (error) {
      logger.error(`Error comparing sentiments:`, error);
      res.status(500).json({ error: 'Failed to compare sentiments' });
    }
  },

  /**
   * Get sector sentiment heatmap
   */
  getSectorSentimentHeatmap: async (req: Request, res: Response): Promise<void> => {
    try {
      const heatmapData = await SentimentModel.getSectorSentimentHeatmap();
      
      res.status(200).json(heatmapData);
    } catch (error) {
      logger.error('Error fetching sector sentiment heatmap:', error);
      res.status(500).json({ error: 'Failed to fetch sector sentiment heatmap' });
    }
  }
};