import { Pool } from 'pg';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

// Database configuration
const isProduction = process.env.NODE_ENV === 'production';

const connectionConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'marketsense',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  // Add SSL for production environments (like Heroku)
  ...(isProduction && {
    ssl: {
      rejectUnauthorized: false
    }
  })
};

// Create a new Pool instance
const pool = new Pool(connectionConfig);

// Test database connection
pool.on('connect', () => {
  logger.info('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  logger.error('PostgreSQL connection error:', err);
  process.exit(1);
});

/**
 * Query helper function to execute SQL queries
 */
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Executed query', { text, duration, rows: res.rowCount });
    }
    
    return res;
  } catch (error) {
    logger.error('Database query error:', error);
    throw error;
  }
};

/**
 * Transaction helper function
 */
export const transaction = async (callback: (client: any) => Promise<any>) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Transaction error:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Initialize database connection
export const connectDatabase = async (): Promise<void> => {
  try {
    // Test the connection
    const result = await query('SELECT NOW()');
    logger.info(`Database connection successful at ${result.rows[0].now}`);
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    process.exit(1);
  }
};

export default {
  query,
  transaction,
  connectDatabase,
  pool
};