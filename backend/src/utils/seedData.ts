import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Stock from '../models/Stock';
import Sentiment from '../models/Sentiment';
import { logger } from './logger';

// Load environment variables
dotenv.config();

// Sample stock data
const stocksData = [
  {
    symbol: 'AAPL',
    companyName: 'Apple Inc.',
    sector: 'Technology',
    price: 175.42,
    priceDate: new Date(),
    open: 173.88,
    high: 176.10,
    low: 173.54,
    close: 175.42,
    volume: 12345678
  },
  {
    symbol: 'MSFT',
    companyName: 'Microsoft Corporation',
    sector: 'Technology',
    price: 321.85,
    priceDate: new Date(),
    open: 320.30,
    high: 322.90,
    low: 319.70,
    close: 321.85,
    volume: 9876543
  },
  {
    symbol: 'AMZN',
    companyName: 'Amazon.com, Inc.',
    sector: 'Consumer Cyclical',
    price: 132.75,
    priceDate: new Date(),
    open: 131.50,
    high: 133.20,
    low: 131.10,
    close: 132.75,
    volume: 8765432
  }
];

// Sample sentiment data
const sentimentsData = [
  {
    symbol: 'AAPL',
    date: new Date(),
    score: 0.75,
    volume: 25,
    sources: ['CNBC', 'Bloomberg', 'Reuters'],
    headlines: [
      'Apple announces record iPhone sales',
      'Analysts bullish on Apple stock ahead of earnings'
    ]
  },
  {
    symbol: 'MSFT',
    date: new Date(),
    score: 0.62,
    volume: 18,
    sources: ['CNBC', 'WSJ'],
    headlines: [
      'Microsoft Cloud growth exceeds expectations',
      'Azure continues to gain market share'
    ]
  },
  {
    symbol: 'AMZN',
    date: new Date(),
    score: -0.3,
    volume: 22,
    sources: ['Reuters', 'Bloomberg', 'CNBC'],
    headlines: [
      'Amazon faces challenges in retail division',
      'AWS growth slows amid competition'
    ]
  }
];

// Function to seed data
const seedData = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/marketsense';
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB for seeding');
    
    // Clear existing data
    await Stock.deleteMany({});
    await Sentiment.deleteMany({});
    logger.info('Cleared existing data');
    
    // Insert stocks
    await Stock.insertMany(stocksData);
    logger.info(`Seeded ${stocksData.length} stocks`);
    
    // Insert sentiments
    await Sentiment.insertMany(sentimentsData);
    logger.info(`Seeded ${sentimentsData.length} sentiments`);
    
    logger.info('Data seeding completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding data:', error);
    process.exit(1);
  }
};

// Run seed function
seedData();