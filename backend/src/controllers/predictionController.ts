import { Request, Response } from 'express';
import { PredictionModel } from '../models/Prediction';
import { CompanyModel } from '../models/Company';
import { logger } from '../utils/logger';

export const predictionController = {
  /**
   * Get latest predictions for a stock
   */
  getLatestPredictions: async (req: Request, res: Response): Promise<void> => {
    try {
      const { ticker } = req.params;
      
      // Validate ticker
      const company = await CompanyModel.getByTicker(ticker);
      
      if (!company) {
        res.status(404).json({ error: 'Company not found' });
        return;
      }
      
      const predictions = await PredictionModel.getLatestPredictions(ticker);
      
      if (predictions.length === 0) {
        res.status(404).json({ error: 'No predictions found for this stock' });
        return;
      }
      
      res.status(200).json(predictions);
    } catch (error) {
      logger.error(`Error fetching latest predictions for ${req.params.ticker}:`, error);
      res.status(500).json({ error: 'Failed to fetch latest predictions' });
    }
  },

  /**
   * Get predictions by type
   */
  getPredictionsByType: async (req: Request, res: Response): Promise<void> => {
    try {
      const { ticker } = req.params;
      const { type } = req.query;
      
      // Validate ticker
      const company = await CompanyModel.getByTicker(ticker);
      
      if (!company) {
        res.status(404).json({ error: 'Company not found' });
        return;
      }
      
      // Validate prediction type
      if (!type || !['TECHNICAL', 'SENTIMENT', 'COMBINED'].includes(type as string)) {
        res.status(400).json({ error: 'Invalid prediction type. Must be TECHNICAL, SENTIMENT, or COMBINED' });
        return;
      }
      
      const predictions = await PredictionModel.getByType(
        ticker, 
        type as 'TECHNICAL' | 'SENTIMENT' | 'COMBINED'
      );
      
      if (predictions.length === 0) {
        res.status(404).json({ error: `No ${type} predictions found for this stock` });
        return;
      }
      
      res.status(200).json(predictions);
    } catch (error) {
      logger.error(`Error fetching ${req.query.type} predictions for ${req.params.ticker}:`, error);
      res.status(500).json({ error: 'Failed to fetch predictions' });
    }
  },

  /**
   * Get historical predictions
   */
  getHistoricalPredictions: async (req: Request, res: Response): Promise<void> => {
    try {
      const { ticker } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 30;
      
      // Validate ticker
      const company = await CompanyModel.getByTicker(ticker);
      
      if (!company) {
        res.status(404).json({ error: 'Company not found' });
        return;
      }
      
      const predictions = await PredictionModel.getHistoricalPredictions(ticker, limit);
      
      if (predictions.length === 0) {
        res.status(404).json({ error: 'No historical predictions found for this stock' });
        return;
      }
      
      res.status(200).json(predictions);
    } catch (error) {
      logger.error(`Error fetching historical predictions for ${req.params.ticker}:`, error);
      res.status(500).json({ error: 'Failed to fetch historical predictions' });
    }
  },

  /**
   * Get prediction accuracy statistics
   */
  getAccuracyStats: async (req: Request, res: Response): Promise<void> => {
    try {
      const { ticker } = req.params;
      const { type } = req.query;
      
      // Validate ticker
      const company = await CompanyModel.getByTicker(ticker);
      
      if (!company) {
        res.status(404).json({ error: 'Company not found' });
        return;
      }
      
      // Validate prediction type if provided
      if (type && !['TECHNICAL', 'SENTIMENT', 'COMBINED'].includes(type as string)) {
        res.status(400).json({ error: 'Invalid prediction type. Must be TECHNICAL, SENTIMENT, or COMBINED' });
        return;
      }
      
      const stats = await PredictionModel.getAccuracyStats(
        ticker, 
        type as 'TECHNICAL' | 'SENTIMENT' | 'COMBINED'
      );
      
      res.status(200).json(stats);
    } catch (error) {
      logger.error(`Error fetching accuracy stats for ${req.params.ticker}:`, error);
      res.status(500).json({ error: 'Failed to fetch accuracy statistics' });
    }
  },

  /**
   * Get prediction confidence visualization
   */
  getPredictionConfidenceData: async (req: Request, res: Response): Promise<void> => {
    try {
      const { ticker } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      
      // Validate ticker
      const company = await CompanyModel.getByTicker(ticker);
      
      if (!company) {
        res.status(404).json({ error: 'Company not found' });
        return;
      }
      
      const confidenceData = await PredictionModel.getPredictionConfidenceData(ticker, limit);
      
      res.status(200).json(confidenceData);
    } catch (error) {
      logger.error(`Error fetching prediction confidence data for ${req.params.ticker}:`, error);
      res.status(500).json({ error: 'Failed to fetch prediction confidence data' });
    }
  },

  /**
   * Get combined predictions visualization
   */
  getCombinedPredictionsVisualization: async (req: Request, res: Response): Promise<void> => {
    try {
      const { ticker } = req.params;
      
      // Validate ticker
      const company = await CompanyModel.getByTicker(ticker);
      
      if (!company) {
        res.status(404).json({ error: 'Company not found' });
        return;
      }
      
      const visualizationData = await PredictionModel.getCombinedPredictionsVisualization(ticker);
      
      res.status(200).json({
        company: {
          ticker: company.ticker,
          name: company.name
        },
        ...visualizationData
      });
    } catch (error) {
      logger.error(`Error fetching combined predictions visualization for ${req.params.ticker}:`, error);
      res.status(500).json({ error: 'Failed to fetch combined predictions visualization' });
    }
  },

  /**
   * Compare predictions across stocks
   */
  comparePredictions: async (req: Request, res: Response): Promise<void> => {
    try {
      const { tickers } = req.query;
      const { type } = req.query;
      
      if (!tickers) {
        res.status(400).json({ error: 'Tickers parameter is required' });
        return;
      }
      
      // Validate prediction type if provided
      if (type && !['TECHNICAL', 'SENTIMENT', 'COMBINED'].includes(type as string)) {
        res.status(400).json({ error: 'Invalid prediction type. Must be TECHNICAL, SENTIMENT, or COMBINED' });
        return;
      }
      
      const predictionType = type as 'TECHNICAL' | 'SENTIMENT' | 'COMBINED' || 'COMBINED';
      
      const tickerArray = (tickers as string).split(',').map(t => t.trim().toUpperCase());
      
      if (tickerArray.length < 2 || tickerArray.length > 5) {
        res.status(400).json({ error: 'Please provide between 2 and 5 tickers for comparison' });
        return;
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
      
      // Get latest predictions for each company
      const predictions = await Promise.all(
        tickerArray.map(async (ticker) => {
          const latestPredictions = await PredictionModel.getLatestPredictions(ticker);
          const predictionOfType = latestPredictions.find(p => p.prediction_type === predictionType);
          return {
            ticker,
            company: companies.find(c => c?.ticker === ticker),
            prediction: predictionOfType || null
          };
        })
      );
      
      res.status(200).json(predictions);
    } catch (error) {
      logger.error(`Error comparing predictions:`, error);
      res.status(500).json({ error: 'Failed to compare predictions' });
    }
  }
};