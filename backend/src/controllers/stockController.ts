import { Request, Response } from 'express';
import Stock from '../models/Stock';

// Get all stocks
export const getAllStocks = async (req: Request, res: Response): Promise<void> => {
  try {
    const stocks = await Stock.find().sort({ symbol: 1 });
    res.status(200).json(stocks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stocks', error });
  }
};

// Get a single stock by symbol
export const getStockBySymbol = async (req: Request, res: Response): Promise<void> => {
  try {
    const { symbol } = req.params;
    const stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
    
    if (!stock) {
      res.status(404).json({ message: 'Stock not found' });
      return;
    }
    
    res.status(200).json(stock);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stock', error });
  }
};

// Get historical data for a stock
export const getStockHistory = async (req: Request, res: Response): Promise<void> => {
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
    
    const history = await Stock.find({
      symbol: symbol.toUpperCase(),
      priceDate: { $gte: startDate, $lte: endDate }
    }).sort({ priceDate: 1 });
    
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stock history', error });
  }
};

// Mock function to get predicted stock prices
export const getPredictedPrices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { symbol } = req.params;
    
    // Mock data for demonstration
    const today = new Date();
    const predictions = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() + i + 1);
      
      // Generate a random price between 95% and 105% of a base price
      const basePrice = 150;
      const randomFactor = 0.95 + Math.random() * 0.1;
      const predictedPrice = basePrice * randomFactor;
      
      // Generate confidence intervals (±5%)
      const upperBound = predictedPrice * 1.05;
      const lowerBound = predictedPrice * 0.95;
      
      return {
        date: date.toISOString().split('T')[0],
        predictedPrice: parseFloat(predictedPrice.toFixed(2)),
        upperBound: parseFloat(upperBound.toFixed(2)),
        lowerBound: parseFloat(lowerBound.toFixed(2)),
      };
    });
    
    res.status(200).json({
      symbol: symbol.toUpperCase(),
      predictions
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating predictions', error });
  }
};