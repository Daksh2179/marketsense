import { Pool, QueryResult, PoolConfig } from 'pg';
import { logger } from '../utils/logger';
import dotenv from 'dotenv';

dotenv.config();

// Use local URL for development, pooler URL for Lambda
const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const DATABASE_URL = isLambda 
  ? process.env.DATABASE_URL 
  : (process.env.DATABASE_URL_LOCAL || process.env.DATABASE_URL);

let pool: Pool | null = null;

const createPool = () => {
  if (!DATABASE_URL) {
    logger.warn('DATABASE_URL not configured, running in API-only mode');
    return null;
  }

  try {
    // Detect connection type
    const isPooler = DATABASE_URL.includes('pooler.supabase.com');
    const isTransactionPooler = DATABASE_URL.includes(':6543');
    
    logger.info(`Database connection type:`, {
      isLambda,
      isPooler,
      isTransactionPooler,
      host: DATABASE_URL.split('@')[1]?.split(':')[0] || 'unknown'
    });
    
    const poolConfig: PoolConfig = {
      connectionString: DATABASE_URL,
      // Transaction pooler requires these specific settings
      max: isTransactionPooler ? 1 : 2,
      min: 0,
      idleTimeoutMillis: isTransactionPooler ? 0 : 10000, // 0 for transaction pooler
      connectionTimeoutMillis: 15000,
      // SSL is required
      ssl: {
        rejectUnauthorized: false
      }
    };

    // Transaction pooler specific settings
    if (isTransactionPooler) {
      // Transaction pooler doesn't support prepared statements
      poolConfig.statement_timeout = 30000;
      poolConfig.query_timeout = 30000;
    }

    pool = new Pool(poolConfig);

    pool.on('error', (err) => {
      logger.error('Database pool error:', err.message);
    });

    return pool;
  } catch (error) {
    logger.error('Failed to create database pool:', error);
    return null;
  }
};

// Rest of your database.ts remains the same...
export const connectDatabase = async (): Promise<void> => {
  try {
    if (!pool) {
      pool = createPool();
    }
    
    if (pool) {
      const client = await pool.connect();
      const result = await client.query('SELECT NOW() as time');
      client.release();
      logger.info('Database connected successfully:', {
        time: result.rows[0].time,
        isLambda,
        connectionType: DATABASE_URL?.includes('pooler') ? 'pooler' : 'direct'
      });
    } else {
      logger.info('Running in API-only mode (no database)');
    }
  } catch (error: any) {
    logger.error('Database connection failed:', {
      message: error.message,
      code: error.code
    });
    pool = null;
  }
};

// Keep the rest of your existing code...
export const query = async (text: string, params?: any[]): Promise<QueryResult<any>> => {
  if (!pool) {
    pool = createPool();
  }

  if (!pool) {
    logger.debug('No database pool, returning empty result');
    return { 
      rows: [], 
      rowCount: 0,
      command: '',
      oid: 0,
      fields: []
    };
  }

  const start = Date.now();
  let client;
  
  try {
    client = await pool.connect();
    const result = await client.query(text, params);
    const duration = Date.now() - start;
    
    if (duration > 5000) {
      logger.warn('Slow query', { query: text.substring(0, 100), duration });
    }
    
    return result;
  } catch (error: any) {
    logger.error('Database query error:', {
      message: error.message,
      code: error.code,
      query: text.substring(0, 100)
    });
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      logger.warn('Connection error detected, resetting pool');
      if (pool) {
        await pool.end().catch(() => {});
        pool = null;
      }
    }
    
    return { 
      rows: [], 
      rowCount: 0,
      command: '',
      oid: 0,
      fields: []
    };
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Transaction handling - note that transaction pooler handles this differently
export const transaction = async (callback: (client: any) => Promise<any>): Promise<any> => {
  if (!pool) {
    pool = createPool();
  }

  if (!pool) {
    logger.warn('No database pool available for transaction');
    throw new Error('Database not available');
  }
  
  const client = await pool.connect();
  
  try {
    // Transaction pooler handles transactions automatically
    const isTransactionPooler = DATABASE_URL?.includes(':6543');
    
    if (!isTransactionPooler) {
      await client.query('BEGIN');
    }
    
    const result = await callback(client);
    
    if (!isTransactionPooler) {
      await client.query('COMMIT');
    }
    
    return result;
  } catch (error: any) {
    if (!DATABASE_URL?.includes(':6543')) {
      await client.query('ROLLBACK');
    }
    logger.error('Transaction failed:', {
      message: error.message,
      code: error.code
    });
    throw error;
  } finally {
    client.release();
  }
};

export const closeDatabase = async (): Promise<void> => {
  if (pool) {
    try {
      await pool.end();
      logger.info('Database pool closed');
    } catch (error) {
      logger.error('Error closing database pool:', error);
    }
    pool = null;
  }
};

export default { query, transaction, closeDatabase };