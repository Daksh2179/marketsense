import { Request, Response } from 'express';
import Sentiment from '../models/Sentiment';

// Get sentiment data for a stock
export const getSentimentBySymbol = async (req: Request, res: Response): Promise<void> => {
  try {
    const { symbol } = req.params;
    const { period } = req.query;
    
    let startDate: Date;
    const endDate = new Date();
    
    // Determine start date based on period
    switch (period) {
      case '1D':
        startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '1W':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '1M':
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '3M':
        startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '6M':
        startDate = new Date(endDate.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case '1Y':
        startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // Default to 1M
    }
    
    const sentimentData = await Sentiment.find({
      symbol: symbol.toUpperCase(),
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });
    
    res.status(200).json(sentimentData);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sentiment data', error });
  }
};

// Get sentiment-enhanced predictions
export const getSentimentEnhancedPredictions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { symbol } = req.params;
    
    // Mock data for demonstration
    const today = new Date();
    const predictions = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() + i + 1);
      
      // Generate a random technical price
      const basePrice = 150;
      const technicalFactor = 0.95 + Math.random() * 0.1;
      const technicalPrice = basePrice * technicalFactor;
      
      // Add sentiment factor (random for demo)
      const sentimentImpact = (Math.random() - 0.5) * 10; // -5% to +5%
      const enhancedPrice = technicalPrice + sentimentImpact;
      
      return {
        date: date.toISOString().split('T')[0],
        technicalPrice: parseFloat(technicalPrice.toFixed(2)),
        enhancedPrice: parseFloat(enhancedPrice.toFixed(2)),
        sentimentImpact: parseFloat((sentimentImpact / technicalPrice * 100).toFixed(2)) // as percentage
      };
    });
    
    res.status(200).json({
      symbol: symbol.toUpperCase(),
      predictions
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating sentiment-enhanced predictions', error });
  }
};