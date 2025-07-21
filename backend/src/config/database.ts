import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export const connectToDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/marketsense';
    
    await mongoose.connect(mongoUri);
    
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};