import db from '../config/database';
import { logger } from '../utils/logger';

export interface NewsHeadline {
  id?: number;
  ticker: string;
  headline: string;
  url?: string;
  source?: string;
  published_at: Date;
  created_at?: Date;
}

export class NewsHeadlineModel {
  /**
   * Get latest headlines for a stock
   */
  static async getLatestHeadlines(ticker: string, limit: number = 10): Promise<NewsHeadline[]> {
    try {
      const result = await db.query(
        `SELECT * FROM news_headlines 
         WHERE ticker = $1 
         ORDER BY published_at DESC 
         LIMIT $2`,
        [ticker.toUpperCase(), limit]
      );
      
      return result.rows;
    } catch (error) {
      logger.error(`Error getting latest headlines for ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Get headlines for a stock within a date range
   */
  static async getHeadlinesByDateRange(
    ticker: string, 
    startDate: string, 
    endDate: string,
    limit: number = 100
  ): Promise<NewsHeadline[]> {
    try {
      const result = await db.query(
        `SELECT * FROM news_headlines 
         WHERE ticker = $1 
           AND published_at >= $2 
           AND published_at <= $3 
         ORDER BY published_at DESC 
         LIMIT $4`,
        [ticker.toUpperCase(), startDate, endDate, limit]
      );
      
      return result.rows;
    } catch (error) {
      logger.error(`Error getting headlines by date range for ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Get headlines for multiple tickers
   */
  static async getHeadlinesForTickers(tickers: string[], limit: number = 20): Promise<NewsHeadline[]> {
    try {
      const upperTickers = tickers.map(ticker => ticker.toUpperCase());
      
      const result = await db.query(
        `SELECT * FROM news_headlines 
         WHERE ticker = ANY($1) 
         ORDER BY published_at DESC 
         LIMIT $2`,
        [upperTickers, limit]
      );
      
      return result.rows;
    } catch (error) {
      logger.error(`Error getting headlines for multiple tickers:`, error);
      throw error;
    }
  }

  /**
   * Create a new headline
   */
  static async create(headline: NewsHeadline): Promise<NewsHeadline> {
    try {
      // Ensure ticker is uppercase
      headline.ticker = headline.ticker.toUpperCase();
      
      const result = await db.query(
        `INSERT INTO news_headlines 
         (ticker, headline, url, source, published_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (url) DO NOTHING
         RETURNING *`,
        [
          headline.ticker,
          headline.headline,
          headline.url || null,
          headline.source || null,
          headline.published_at
        ]
      );
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating headline:', error);
      throw error;
    }
  }

  /**
   * Bulk insert multiple headlines efficiently
   */
  static async bulkCreate(headlines: NewsHeadline[]): Promise<number> {
    try {
      // Use a client transaction for better performance
      return await db.transaction(async (client) => {
        let insertedCount = 0;
        
        for (const headline of headlines) {
          // Ensure ticker is uppercase
          headline.ticker = headline.ticker.toUpperCase();
          
          try {
            const result = await client.query(
              `INSERT INTO news_headlines 
               (ticker, headline, url, source, published_at)
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT (url) DO NOTHING
               RETURNING id`,
              [
                headline.ticker,
                headline.headline,
                headline.url || null,
                headline.source || null,
                headline.published_at
              ]
            );
            
            if (result.rows.length > 0) {
              insertedCount++;
            }
          } catch (error) {
            logger.error(`Error inserting headline: ${headline.headline}`, error);
            // Continue with other headlines even if one fails
          }
        }
        
        return insertedCount;
      });
    } catch (error) {
      logger.error('Error in bulk create of headlines:', error);
      throw error;
    }
  }

  /**
   * Delete old headlines (data cleanup)
   */
  static async deleteOlderThan(days: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const result = await db.query(
        `DELETE FROM news_headlines 
         WHERE published_at < $1
         RETURNING id`,
        [cutoffDate]
      );
      
      return result.rowCount ?? 0;
    } catch (error) {
      logger.error(`Error deleting old headlines:`, error);
      throw error;
    }
  }

  /**
   * Search headlines by keyword
   */
  static async searchHeadlines(keyword: string, limit: number = 50): Promise<NewsHeadline[]> {
    try {
      const result = await db.query(
        `SELECT * FROM news_headlines 
         WHERE headline ILIKE $1 
         ORDER BY published_at DESC 
         LIMIT $2`,
        [`%${keyword}%`, limit]
      );
      
      return result.rows;
    } catch (error) {
      logger.error(`Error searching headlines with keyword ${keyword}:`, error);
      throw error;
    }
  }

  /**
   * Get headline sources distribution for a ticker
   */
  static async getSourceDistribution(ticker: string): Promise<{source: string, count: number}[]> {
    try {
      const result = await db.query(
        `SELECT source, COUNT(*) as count 
         FROM news_headlines 
         WHERE ticker = $1 AND source IS NOT NULL
         GROUP BY source 
         ORDER BY count DESC`,
        [ticker.toUpperCase()]
      );
      
      return result.rows;
    } catch (error) {
      logger.error(`Error getting source distribution for ${ticker}:`, error);
      throw error;
    }
  }
}