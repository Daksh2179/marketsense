import { Request, Response } from 'express';
import { StockPriceModel } from '../models/StockPrice';
import { CompanyModel } from '../models/Company';
import { DataIngestionService } from '../services/dataIngestionService';
import { logger } from '../utils/logger';
import db from '../config/database';

export const stockController = {
  /**
   * Get latest price for a stock
   */
  getLatestPrice: async (req: Request, res: Response): Promise<void> => {
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
          
          // Also fetch initial price data
          await DataIngestionService.fetchAndStoreStockPrices(ticker);
        }
      }
      
      if (!company) {
        res.status(404).json({ error: 'Company not found' });
        return;
      }
      
      let latestPrice = await StockPriceModel.getLatestPrice(ticker);
      
      // If price data doesn't exist, fetch it
      if (!latestPrice) {
        logger.info(`Price data for ${ticker} not found in database, fetching from API`);
        const success = await DataIngestionService.fetchAndStoreStockPrices(ticker);
        
        if (success) {
          latestPrice = await StockPriceModel.getLatestPrice(ticker);
        }
      }
      
      if (!latestPrice) {
        res.status(404).json({ error: 'No price data found for this stock' });
        return;
      }
      
      res.status(200).json(latestPrice);
    } catch (error) {
      logger.error(`Error fetching latest price for ${req.params.ticker}:`, error);
      res.status(500).json({ error: 'Failed to fetch latest price' });
    }
  },

  /**
   * Get historical prices for a stock
   */
  getHistoricalPrices: async (req: Request, res: Response): Promise<void> => {
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
          
          // Also fetch initial price data
          await DataIngestionService.fetchAndStoreStockPrices(ticker, true);
        }
      }
      
      if (!company) {
        res.status(404).json({ error: 'Company not found' });
        return;
      }
      
      // Get historical prices
      let historicalPrices = await StockPriceModel.getHistoricalPrices(
        ticker, 
        startDate as string, 
        endDate as string
      );
      
      // If no historical prices found, fetch them
      if (historicalPrices.length === 0) {
        logger.info(`Historical prices for ${ticker} not found in database, fetching from API`);
        const success = await DataIngestionService.fetchAndStoreStockPrices(ticker, true);
        
        if (success) {
          historicalPrices = await StockPriceModel.getHistoricalPrices(
            ticker, 
            startDate as string, 
            endDate as string
          );
        }
      }
      
      if (historicalPrices.length === 0) {
        res.status(404).json({ error: 'No historical data found for this stock in the specified date range' });
        return;
      }
      
      res.status(200).json(historicalPrices);
    } catch (error) {
      logger.error(`Error fetching historical prices for ${req.params.ticker}:`, error);
      res.status(500).json({ error: 'Failed to fetch historical prices' });
    }
  },

  /**
   * Get price chart data
   */
  getPriceChartData: async (req: Request, res: Response): Promise<void> => {
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
          
          // Also fetch initial price data
          await DataIngestionService.fetchAndStoreStockPrices(ticker, true);
        }
      }
      
      if (!company) {
        res.status(404).json({ error: 'Company not found' });
        return;
      }
      
      // Check if we have price data - using db.query instead of StockPriceModel.query
      let priceCount = await db.query(
        'SELECT COUNT(*) FROM stock_prices WHERE ticker = $1',
        [ticker]
      );
      
      // If no price data, fetch it
      if (parseInt(priceCount.rows[0].count) === 0) {
        logger.info(`Price data for ${ticker} not found in database, fetching from API`);
        await DataIngestionService.fetchAndStoreStockPrices(ticker, true);
      }
      
      const chartData = await StockPriceModel.getPriceChartData(
        ticker, 
        range as string
      );
      
      res.status(200).json(chartData);
    } catch (error) {
      logger.error(`Error fetching price chart data for ${req.params.ticker}:`, error);
      res.status(500).json({ error: 'Failed to fetch price chart data' });
    }
  },

  /**
   * Get technical indicators
   */
  getTechnicalIndicators: async (req: Request, res: Response): Promise<void> => {
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
          
          // Also fetch initial price data
          await DataIngestionService.fetchAndStoreStockPrices(ticker, true);
        }
      }
      
      if (!company) {
        res.status(404).json({ error: 'Company not found' });
        return;
      }
      
      const indicators = await StockPriceModel.getTechnicalIndicators(
        ticker, 
        range as string
      );
      
      res.status(200).json(indicators);
    } catch (error) {
      logger.error(`Error fetching technical indicators for ${req.params.ticker}:`, error);
      res.status(500).json({ error: 'Failed to fetch technical indicators' });
    }
  },

  /**
   * Get price and sentiment correlation
   */
  getPriceSentimentCorrelation: async (req: Request, res: Response): Promise<void> => {
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
          
          // Also fetch initial price data
          await DataIngestionService.fetchAndStoreStockPrices(ticker, true);
          
          // Fetch news and calculate sentiment
          await DataIngestionService.fetchAndStoreNewsHeadlines(ticker);
          await DataIngestionService.calculateAndStoreSentiment(ticker);
        }
      }
      
      if (!company) {
        res.status(404).json({ error: 'Company not found' });
        return;
      }
      
      // Import SentimentModel here to avoid circular dependency
      const { SentimentModel } = require('../models/Sentiment');
      
      const correlationData = await SentimentModel.getSentimentPriceCorrelation(
        ticker, 
        range as string
      );
      
      res.status(200).json(correlationData);
    } catch (error) {
      logger.error(`Error fetching price-sentiment correlation for ${req.params.ticker}:`, error);
      res.status(500).json({ error: 'Failed to fetch price-sentiment correlation' });
    }
  },

  /**
   * Get market regime data
   */
  getMarketRegime: async (req: Request, res: Response): Promise<void> => {
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
          
          // Also fetch initial price data
          await DataIngestionService.fetchAndStoreStockPrices(ticker, true);
        }
      }
      
      if (!company) {
        res.status(404).json({ error: 'Company not found' });
        return;
      }
      
      // Get price history
      const priceHistory = await StockPriceModel.getHistoricalPrices(ticker);
      
      if (priceHistory.length < 60) {
        res.status(404).json({ error: 'Insufficient price history for market regime detection' });
        return;
      }
      
      // Import PredictionService here to avoid circular dependency
      const { PredictionService } = require('../services/predictionService');
      
      const regimeData = PredictionService.detectMarketRegime(priceHistory);
      
      res.status(200).json(regimeData);
    } catch (error) {
      logger.error(`Error detecting market regime for ${req.params.ticker}:`, error);
      res.status(500).json({ error: 'Failed to detect market regime' });
    }
  },

  /**
   * Compare stocks
   */
  compareStocks: async (req: Request, res: Response): Promise<void> => {
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
            await DataIngestionService.fetchAndStoreStockPrices(ticker, true);
          }
        }
      }
      
      // Get companies
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
      
      // Get price data for each company
      const priceData = await Promise.all(
        tickerArray.map(ticker => StockPriceModel.getPriceChartData(ticker, '6m'))
      );
      
      // Format comparison data
      const comparisonData = tickerArray.map((ticker, index) => ({
        ticker,
        company: companies[index],
        priceData: priceData[index]
      }));
      
      res.status(200).json(comparisonData);
    } catch (error) {
      logger.error(`Error comparing stocks:`, error);
      res.status(500).json({ error: 'Failed to compare stocks' });
    }
  }
};