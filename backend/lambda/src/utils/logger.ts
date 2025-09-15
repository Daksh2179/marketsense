import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Check if running in Lambda environment
const isLambda = !!(process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);
const isDevelopment = process.env.NODE_ENV === 'development' || !isLambda;

// Create transports array
const transports: winston.transport[] = [];

// Always add console transport
transports.push(
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
        return `${timestamp} [${level}]: ${message} ${metaStr}`;
      })
    )
  })
);

// Add file transports only in local development (not in Lambda)
if (isDevelopment && !isLambda) {
  try {
    // Try to create logs directory only if we're not in Lambda
    const logsDir = path.join(process.cwd(), 'logs');
    
    // Check if we can write to filesystem (will fail in Lambda)
    if (!fs.existsSync(logsDir)) {
      try {
        fs.mkdirSync(logsDir, { recursive: true });
      } catch (err) {
        // Silently fail if can't create directory (Lambda environment)
        console.log('Running in read-only environment, using console logging only');
      }
    }
    
    // Only add file transports if directory exists
    if (fs.existsSync(logsDir)) {
      // Error log file
      transports.push(
        new winston.transports.File({
          filename: path.join(logsDir, 'error.log'),
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        })
      );
      
      // Combined log file
      transports.push(
        new winston.transports.File({
          filename: path.join(logsDir, 'combined.log'),
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        })
      );
    }
  } catch (error) {
    // If any filesystem operations fail, just use console
    console.log('Filesystem not available, using console logging only');
  }
}

// Create the logger with appropriate configuration
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports,
  // In Lambda, don't exit on error
  exitOnError: !isLambda
});

// Add context to logs in Lambda
if (isLambda) {
  logger.defaultMeta = {
    functionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
    functionVersion: process.env.AWS_LAMBDA_FUNCTION_VERSION,
    region: process.env.AWS_REGION
  };
}

// Enhanced logging methods with better error handling
export const logInfo = (message: string, meta?: any) => {
  logger.info(message, meta);
};

export const logError = (message: string, error?: any, meta?: any) => {
  if (error instanceof Error) {
    logger.error(message, {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      ...meta
    });
  } else {
    logger.error(message, { error, ...meta });
  }
};

export const logWarn = (message: string, meta?: any) => {
  logger.warn(message, meta);
};

export const logDebug = (message: string, meta?: any) => {
  logger.debug(message, meta);
};

// Performance logging
export const logPerformance = (operation: string, startTime: number, meta?: any) => {
  const duration = Date.now() - startTime;
  logger.info(`Performance: ${operation}`, {
    duration_ms: duration,
    ...meta
  });
};

// API request logging
export const logApiRequest = (service: string, endpoint: string, success: boolean, duration?: number) => {
  const level = success ? 'info' : 'warn';
  logger.log(level, `API Request: ${service}`, {
    service,
    endpoint,
    success,
    duration_ms: duration
  });
};

// Database query logging
export const logDatabaseQuery = (query: string, params: any[], duration?: number, error?: any) => {
  if (error) {
    logger.error('Database query failed', {
      query: query.substring(0, 200), // Truncate long queries
      params,
      duration_ms: duration,
      error: error.message
    });
  } else {
    logger.debug('Database query executed', {
      query: query.substring(0, 200),
      params,
      duration_ms: duration
    });
  }
};

// Export default logger for compatibility
export default logger;