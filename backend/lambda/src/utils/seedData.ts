import db from '../config/database';
import { CompanyModel } from '../models/Company';
import { StockPriceModel } from '../models/StockPrice';
import { SentimentModel } from '../models/Sentiment';
import { logger } from './logger';

// Sample stock data for seeding
const stocksData = [
  {
    ticker: 'AAPL',
    date: new Date(),
    open: 173.88,
    high: 176.10,
    low: 173.54,
    close: 175.42,
    volume: 12345678,
    adjusted_close: 175.42
  },
  {
    ticker: 'MSFT', 
    date: new Date(),
    open: 320.30,
    high: 322.90,
    low: 319.70,
    close: 321.85,
    volume: 9876543,
    adjusted_close: 321.85
  },
  {
    ticker: 'AMZN',
    date: new Date(),
    open: 131.50,
    high: 133.20,
    low: 131.10,
    close: 132.75,
    volume: 8765432,
    adjusted_close: 132.75
  }
];

// Sample sentiment data
const sentimentsData = [
  {
    ticker: 'AAPL',
    date: new Date(),
    sentiment_score: 0.75,
    sentiment_magnitude: 0.8,
    news_count: 25,
    positive_count: 18,
    negative_count: 4,
    neutral_count: 3,
    buzz_score: 2.1
  },
  {
    ticker: 'MSFT',
    date: new Date(),
    sentiment_score: 0.62,
    sentiment_magnitude: 0.7,
    news_count: 18,
    positive_count: 13,
    negative_count: 2,
    neutral_count: 3,
    buzz_score: 1.8
  },
  {
    ticker: 'AMZN',
    date: new Date(),
    sentiment_score: -0.3,
    sentiment_magnitude: 0.6,
    news_count: 22,
    positive_count: 6,
    negative_count: 12,
    neutral_count: 4,
    buzz_score: 2.2
  }
];

// Function to seed data
const seedData = async () => {
  try {
    logger.info('Starting data seeding for Lambda deployment...');
    
    // Test database connection first
    await db.query('SELECT 1');
    
    // Seed stock prices
    logger.info('Seeding stock prices...');
    const stockCount = await StockPriceModel.bulkCreate(stocksData);
    logger.info(`Seeded ${stockCount} stock price records`);
    
    // Seed sentiment data
    logger.info('Seeding sentiment data...');
    for (const sentimentData of sentimentsData) {
      await SentimentModel.create(sentimentData);
    }
    logger.info(`Seeded ${sentimentsData.length} sentiment records`);
    
    logger.info('✅ Data seeding completed successfully');
    return true;
  } catch (error) {
    logger.error('❌ Error seeding data:', error);
    throw error;
  }
};

export default seedData;