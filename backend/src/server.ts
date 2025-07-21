import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { connectToDatabase } from './config/database';
import routes from './routes';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());

// API routes
app.use('/api', routes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB - wrapped in try/catch so server can start even if DB connection fails
    try {
      await connectToDatabase();
      logger.info('Connected to MongoDB');
    } catch (dbError) {
      logger.warn('MongoDB connection failed, but server will start anyway:', dbError);
      logger.info('Some API endpoints requiring database access may not work');
    }
    
    // Start Express server
    app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;