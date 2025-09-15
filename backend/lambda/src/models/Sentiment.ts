import db from '../config/database';
import { logger } from '../utils/logger';

export interface SentimentScore {
  id?: number;
  ticker: string;
  date: Date;
  sentiment_score: number;
  sentiment_magnitude?: number;
  news_count: number;
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  buzz_score?: number;
  created_at?: Date;
  updated_at?: Date;
}

export class SentimentModel {
  /**
   * Get latest sentiment score for a stock
   */
  static async getLatestSentiment(ticker: string): Promise<SentimentScore | null> {
    try {
      const result = await db.query(
        `SELECT * FROM sentiment_scores 
         WHERE ticker = $1 
         ORDER BY date DESC 
         LIMIT 1`,
        [ticker.toUpperCase()]
      );
      
      return result.rows.length ? result.rows[0] : null;
    } catch (error) {
      logger.error(`Error getting latest sentiment for ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Get historical sentiment scores for a stock
   */
  static async getHistoricalSentiment(
    ticker: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<SentimentScore[]> {
    try {
      let query = 'SELECT * FROM sentiment_scores WHERE ticker = $1';
      const queryParams: any[] = [ticker.toUpperCase()];
      
      if (startDate) {
        query += ' AND date >= $2';
        queryParams.push(startDate);
      }
      
      if (endDate) {
        query += ` AND date <= $${queryParams.length + 1}`;
        queryParams.push(endDate);
      }
      
      query += ' ORDER BY date ASC';
      
      const result = await db.query(query, queryParams);
      return result.rows;
    } catch (error) {
      logger.error(`Error getting historical sentiment for ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Get sentiment chart data formatted for visualization
   */
  static async getSentimentChartData(
    ticker: string,
    range: string = '1m'
  ): Promise<{
    dates: string[];
    scores: number[];
    newsCounts: number[];
    buzzScores: number[];
  }> {
    try {
      // Calculate start date based on range
      let startDate = new Date();
      switch (range) {
        case '1w':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '1m':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case '3m':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case '6m':
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case '1y':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(startDate.getMonth() - 1); // Default to 1 month
      }
      
      const formattedStartDate = startDate.toISOString().split('T')[0];
      
      const result = await db.query(
        `SELECT date, sentiment_score, news_count, buzz_score 
         FROM sentiment_scores 
         WHERE ticker = $1 AND date >= $2 
         ORDER BY date ASC`,
        [ticker.toUpperCase(), formattedStartDate]
      );
      
      // Format data for charts
      const dates = result.rows.map(row => {
        const date = new Date(row.date);
        return date.toISOString().split('T')[0];
      });
      
      const scores = result.rows.map(row => parseFloat(row.sentiment_score));
      const newsCounts = result.rows.map(row => parseInt(row.news_count));
      const buzzScores = result.rows.map(row => parseFloat(row.buzz_score || '0'));
      
      return { dates, scores, newsCounts, buzzScores };
    } catch (error) {
      logger.error(`Error getting sentiment chart data for ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Get sentiment and price correlation data
   */
  static async getSentimentPriceCorrelation(
    ticker: string,
    range: string = '3m'
  ): Promise<{
    dates: string[];
    prices: number[];
    sentiments: number[];
    correlation: number;
  }> {
    try {
      // Calculate start date based on range
      let startDate = new Date();
      switch (range) {
        case '1m':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case '3m':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case '6m':
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case '1y':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(startDate.getMonth() - 3); // Default to 3 months
      }
      
      const formattedStartDate = startDate.toISOString().split('T')[0];
      
      // Get combined price and sentiment data
      const result = await db.query(
        `SELECT ss.date, ss.sentiment_score, sp.close
         FROM sentiment_scores ss
         JOIN stock_prices sp ON ss.ticker = sp.ticker AND ss.date = sp.date
         WHERE ss.ticker = $1 AND ss.date >= $2
         ORDER BY ss.date ASC`,
        [ticker.toUpperCase(), formattedStartDate]
      );
      
      // Format data for charts
      const dates = result.rows.map(row => {
        const date = new Date(row.date);
        return date.toISOString().split('T')[0];
      });
      
      const prices = result.rows.map(row => parseFloat(row.close));
      const sentiments = result.rows.map(row => parseFloat(row.sentiment_score));
      
      // Calculate correlation coefficient
      const correlation = this.calculateCorrelation(prices, sentiments);
      
      return { dates, prices, sentiments, correlation };
    } catch (error) {
      logger.error(`Error getting sentiment-price correlation for ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Calculate correlation coefficient between two datasets
   */
  private static calculateCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    
    if (n === 0) {
      return 0;
    }
    
    // Calculate means
    let sumX = 0;
    let sumY = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += x[i];
      sumY += y[i];
    }
    
    const meanX = sumX / n;
    const meanY = sumY / n;
    
    // Calculate correlation components
    let numerator = 0;
    let denominatorX = 0;
    let denominatorY = 0;
    
    for (let i = 0; i < n; i++) {
      const xDiff = x[i] - meanX;
      const yDiff = y[i] - meanY;
      
      numerator += xDiff * yDiff;
      denominatorX += xDiff * xDiff;
      denominatorY += yDiff * yDiff;
    }
    
    const denominator = Math.sqrt(denominatorX * denominatorY);
    
    // Prevent division by zero
    if (denominator === 0) {
      return 0;
    }
    
    // Return Pearson correlation coefficient
    return parseFloat((numerator / denominator).toFixed(4));
  }

  /**
   * Get sentiment data for multiple stocks (comparison)
   */
  static async compareSentiments(tickers: string[]): Promise<Record<string, SentimentScore[]>> {
    try {
      const upperTickers = tickers.map(ticker => ticker.toUpperCase());
      
      // Get sentiment data for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const result = await db.query(
        `SELECT * FROM sentiment_scores 
         WHERE ticker = ANY($1) AND date >= $2
         ORDER BY ticker, date ASC`,
        [upperTickers, thirtyDaysAgo.toISOString().split('T')[0]]
      );
      
      // Group results by ticker
      const groupedResults: Record<string, SentimentScore[]> = {};
      
      for (const row of result.rows) {
        if (!groupedResults[row.ticker]) {
          groupedResults[row.ticker] = [];
        }
        
        groupedResults[row.ticker].push(row);
      }
      
      return groupedResults;
    } catch (error) {
      logger.error('Error comparing sentiments:', error);
      throw error;
    }
  }

  /**
   * Create a new sentiment score record
   */
  static async create(sentimentScore: SentimentScore): Promise<SentimentScore> {
    try {
      // Ensure ticker is uppercase
      sentimentScore.ticker = sentimentScore.ticker.toUpperCase();
      
      const result = await db.query(
        `INSERT INTO sentiment_scores 
         (ticker, date, sentiment_score, sentiment_magnitude, news_count, 
          positive_count, negative_count, neutral_count, buzz_score)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (ticker, date) DO UPDATE
         SET sentiment_score = $3,
             sentiment_magnitude = $4,
             news_count = $5,
             positive_count = $6,
             negative_count = $7,
             neutral_count = $8,
             buzz_score = $9,
             updated_at = NOW()
         RETURNING *`,
        [
          sentimentScore.ticker,
          sentimentScore.date,
          sentimentScore.sentiment_score,
          sentimentScore.sentiment_magnitude || null,
          sentimentScore.news_count,
          sentimentScore.positive_count,
          sentimentScore.negative_count,
          sentimentScore.neutral_count,
          sentimentScore.buzz_score || null
        ]
      );
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating sentiment score record:', error);
      throw error;
    }
  }

  /**
   * Get sentiment heatmap data across sectors
   */
  static async getSectorSentimentHeatmap(): Promise<any[]> {
    try {
      const result = await db.query(`
        SELECT 
          c.sector,
          AVG(ss.sentiment_score) as avg_sentiment,
          COUNT(DISTINCT c.ticker) as company_count
        FROM 
          companies c
        JOIN 
          sentiment_scores ss ON c.ticker = ss.ticker
        WHERE 
          c.sector IS NOT NULL
          AND ss.date >= (CURRENT_DATE - INTERVAL '30 days')
        GROUP BY 
          c.sector
        ORDER BY 
          avg_sentiment DESC
      `);
      
      return result.rows;
    } catch (error) {
      logger.error('Error getting sector sentiment heatmap:', error);
      throw error;
    }
  }

  /**
   * Get sentiment trend by analyzing change over time
   */
  static async getSentimentTrend(
    ticker: string,
    days: number = 30
  ): Promise<{
    trend: 'improving' | 'deteriorating' | 'stable';
    changePercent: number;
    startScore: number;
    endScore: number;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const result = await db.query(
        `SELECT date, sentiment_score FROM sentiment_scores 
         WHERE ticker = $1 AND date >= $2
         ORDER BY date ASC`,
        [ticker.toUpperCase(), startDate.toISOString().split('T')[0]]
      );
      
      if (result.rows.length < 2) {
        return {
          trend: 'stable',
          changePercent: 0,
          startScore: 0,
          endScore: 0
        };
      }
      
      const startScore = parseFloat(result.rows[0].sentiment_score);
      const endScore = parseFloat(result.rows[result.rows.length - 1].sentiment_score);
      
      // Calculate percentage change
      const absoluteChange = endScore - startScore;
      const changePercent = parseFloat((absoluteChange * 100).toFixed(2));
      
      // Determine trend
      let trend: 'improving' | 'deteriorating' | 'stable' = 'stable';
      
      if (changePercent > 5) {
        trend = 'improving';
      } else if (changePercent < -5) {
        trend = 'deteriorating';
      }
      
      return {
        trend,
        changePercent,
        startScore,
        endScore
      };
    } catch (error) {
      logger.error(`Error getting sentiment trend for ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Get count of sentiment records for a ticker
   */
  static async getSentimentCount(ticker: string): Promise<number> {
    try {
      const result = await db.query(
        'SELECT COUNT(*) FROM sentiment_scores WHERE ticker = $1',
        [ticker.toUpperCase()]
      );
      
      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error(`Error getting sentiment count for ${ticker}:`, error);
      throw error;
    }
  }
}