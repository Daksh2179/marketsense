import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import routes from './routes';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Test endpoint for debugging
app.get('/test', (req, res) => {
  res.status(200).json({ message: 'Test endpoint works!' });
});

// Connect to database and start server
const startServer = async (): Promise<void> => {
  try {
    // Connect to PostgreSQL
    await connectDatabase();
    
    // Start Express server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to connect to database, but server will start anyway:', error);
    
    // Start server even if database connection fails
    app.listen(PORT, () => {
      logger.info('Server running on port ' + PORT);
      logger.info('Some API endpoints requiring database access may not work');
    });
  }
};

startServer();