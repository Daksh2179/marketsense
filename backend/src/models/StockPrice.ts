import db from '../config/database';
import { logger } from '../utils/logger';

export interface StockPrice {
  id?: number;
  ticker: string;
  date: Date;
  open?: number;
  high?: number;
  low?: number;
  close: number;
  volume?: number;
  adjusted_close?: number;
  created_at?: Date;
}

export interface PricePoint {
  date: string;
  value: number;
}

export class StockPriceModel {
  /**
   * Get latest price for a stock
   */
  static async getLatestPrice(ticker: string): Promise<StockPrice | null> {
    try {
      const result = await db.query(
        `SELECT * FROM stock_prices 
         WHERE ticker = $1 
         ORDER BY date DESC 
         LIMIT 1`,
        [ticker.toUpperCase()]
      );
      
      return result.rows.length ? result.rows[0] : null;
    } catch (error) {
      logger.error(`Error getting latest price for ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Get historical prices for a stock within a date range
   */
  static async getHistoricalPrices(
    ticker: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<StockPrice[]> {
    try {
      let query = 'SELECT * FROM stock_prices WHERE ticker = $1';
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
      logger.error(`Error getting historical prices for ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Get price data in a format suitable for charts
   */
  static async getPriceChartData(
    ticker: string,
    range: string = '1m'
  ): Promise<{
    dates: string[];
    prices: number[];
    volumes: number[];
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
        case '5y':
          startDate.setFullYear(startDate.getFullYear() - 5);
          break;
        default:
          startDate.setMonth(startDate.getMonth() - 1); // Default to 1 month
      }
      
      const formattedStartDate = startDate.toISOString().split('T')[0];
      
      const result = await db.query(
        `SELECT date, close, volume FROM stock_prices 
         WHERE ticker = $1 AND date >= $2 
         ORDER BY date ASC`,
        [ticker.toUpperCase(), formattedStartDate]
      );
      
      // Format data for charts
      const dates = result.rows.map(row => {
        const date = new Date(row.date);
        return date.toISOString().split('T')[0];
      });
      
      const prices = result.rows.map(row => parseFloat(row.close));
      const volumes = result.rows.map(row => parseInt(row.volume || '0'));
      
      return { dates, prices, volumes };
    } catch (error) {
      logger.error(`Error getting price chart data for ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Create a new stock price record
   */
  static async create(stockPrice: StockPrice): Promise<StockPrice> {
    try {
      // Ensure ticker is uppercase
      stockPrice.ticker = stockPrice.ticker.toUpperCase();
      
      const result = await db.query(
        `INSERT INTO stock_prices 
         (ticker, date, open, high, low, close, volume, adjusted_close)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          stockPrice.ticker,
          stockPrice.date,
          stockPrice.open || null,
          stockPrice.high || null,
          stockPrice.low || null,
          stockPrice.close,
          stockPrice.volume || null,
          stockPrice.adjusted_close || null
        ]
      );
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating stock price record:', error);
      throw error;
    }
  }

  /**
   * Bulk insert multiple stock price records efficiently
   */
  static async bulkCreate(stockPrices: StockPrice[]): Promise<number> {
    try {
      // Use a client transaction for better performance
      return await db.transaction(async (client) => {
        let insertedCount = 0;
        
        for (const stockPrice of stockPrices) {
          // Ensure ticker is uppercase
          stockPrice.ticker = stockPrice.ticker.toUpperCase();
          
          try {
            await client.query(
              `INSERT INTO stock_prices 
               (ticker, date, open, high, low, close, volume, adjusted_close)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
               ON CONFLICT (ticker, date) DO UPDATE
               SET open = $3, high = $4, low = $5, close = $6, volume = $7, adjusted_close = $8`,
              [
                stockPrice.ticker,
                stockPrice.date,
                stockPrice.open || null,
                stockPrice.high || null,
                stockPrice.low || null,
                stockPrice.close,
                stockPrice.volume || null,
                stockPrice.adjusted_close || null
              ]
            );
            
            insertedCount++;
          } catch (error) {
            logger.error(`Error inserting price record for ${stockPrice.ticker} on ${stockPrice.date}:`, error);
            // Continue with other records even if one fails
          }
        }
        
        return insertedCount;
      });
    } catch (error) {
      logger.error('Error in bulk create of stock prices:', error);
      throw error;
    }
  }

  /**
   * Get technical indicators for a stock
   */
  static async getTechnicalIndicators(
    ticker: string,
    range: string = '3m'
  ): Promise<any> {
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
      
      // Get price data for technical indicators
      const priceData = await this.getHistoricalPrices(ticker, formattedStartDate);
      
      // If insufficient data, return empty indicators
      if (priceData.length < 20) {
        return {
          sma20: [],
          sma50: [],
          sma200: [],
          rsi: [],
          macd: {
            line: [],
            signal: [],
            histogram: []
          }
        };
      }
      
      // Calculate simple moving averages
      const sma20 = this.calculateSMA(priceData, 20);
      const sma50 = this.calculateSMA(priceData, 50);
      const sma200 = this.calculateSMA(priceData, 200);
      
      // Calculate RSI (Relative Strength Index)
      const rsi = this.calculateRSI(priceData, 14);
      
      // Calculate MACD (Moving Average Convergence Divergence)
      const macd = this.calculateMACD(priceData);
      
      return {
        sma20,
        sma50,
        sma200,
        rsi,
        macd
      };
    } catch (error) {
      logger.error(`Error calculating technical indicators for ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Calculate Simple Moving Average (SMA)
   */
  private static calculateSMA(priceData: StockPrice[], period: number): PricePoint[] {
    const result: PricePoint[] = [];
    
    if (priceData.length < period) {
      return result;
    }
    
    for (let i = period - 1; i < priceData.length; i++) {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += priceData[j].close;
      }
      
      const average = sum / period;
      result.push({
        date: new Date(priceData[i].date).toISOString().split('T')[0],
        value: parseFloat(average.toFixed(2))
      });
    }
    
    return result;
  }

  /**
   * Calculate RSI (Relative Strength Index)
   */
  private static calculateRSI(priceData: StockPrice[], period: number): PricePoint[] {
    const result: PricePoint[] = [];
    
    if (priceData.length <= period) {
      return result;
    }
    
    // Calculate price changes
    const changes: number[] = [];
    for (let i = 1; i < priceData.length; i++) {
      changes.push(priceData[i].close - priceData[i - 1].close);
    }
    
    // Calculate initial average gains and losses
    let avgGain = 0;
    let avgLoss = 0;
    
    for (let i = 0; i < period; i++) {
      if (changes[i] > 0) {
        avgGain += changes[i];
      } else {
        avgLoss += Math.abs(changes[i]);
      }
    }
    
    avgGain /= period;
    avgLoss /= period;
    
    // Calculate first RSI
    let rs = avgGain / (avgLoss === 0 ? 0.001 : avgLoss); // Avoid division by zero
    let rsiValue = 100 - (100 / (1 + rs));
    
    result.push({
      date: new Date(priceData[period].date).toISOString().split('T')[0],
      value: parseFloat(rsiValue.toFixed(2))
    });
    
    // Calculate rest of RSI values
    for (let i = period; i < changes.length; i++) {
      const change = changes[i];
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? Math.abs(change) : 0;
      
      avgGain = ((avgGain * (period - 1)) + gain) / period;
      avgLoss = ((avgLoss * (period - 1)) + loss) / period;
      
      rs = avgGain / (avgLoss === 0 ? 0.001 : avgLoss);
      rsiValue = 100 - (100 / (1 + rs));
      
      result.push({
        date: new Date(priceData[i + 1].date).toISOString().split('T')[0],
        value: parseFloat(rsiValue.toFixed(2))
      });
    }
    
    return result;
  }

  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   */
  private static calculateMACD(priceData: StockPrice[]): {
    line: PricePoint[],
    signal: PricePoint[],
    histogram: PricePoint[]
  } {
    const result = {
      line: [] as PricePoint[],
      signal: [] as PricePoint[],
      histogram: [] as PricePoint[]
    };
    
    if (priceData.length < 26) {
      return result;
    }
    
    // Calculate EMA 12 and EMA 26
    const ema12 = this.calculateEMA(priceData, 12);
    const ema26 = this.calculateEMA(priceData, 26);
    
    // Calculate MACD line (EMA 12 - EMA 26)
    const macdLine: PricePoint[] = [];
    const startIndex = ema26.findIndex(point => ema12.some(p => p.date === point.date));
    
    for (let i = startIndex; i < ema26.length; i++) {
      const ema12Point = ema12.find(p => p.date === ema26[i].date);
      if (ema12Point) {
        macdLine.push({
          date: ema26[i].date,
          value: parseFloat((ema12Point.value - ema26[i].value).toFixed(2))
        });
      }
    }
    
    // Calculate MACD signal line (9-day EMA of MACD line)
    const macdValues = macdLine.map(point => ({
      date: new Date(point.date),
      close: point.value
    }));
    
    const signalLine = this.calculateEMA(macdValues as any, 9);
    
    // Calculate MACD histogram (MACD line - MACD signal line)
    const histogram: PricePoint[] = [];
    const signalStartIndex = signalLine.findIndex(point => 
      macdLine.some(p => p.date === point.date)
    );
    
    for (let i = signalStartIndex; i < signalLine.length; i++) {
      const macdPoint = macdLine.find(p => p.date === signalLine[i].date);
      if (macdPoint) {
        histogram.push({
          date: signalLine[i].date,
          value: parseFloat((macdPoint.value - signalLine[i].value).toFixed(2))
        });
      }
    }
    
    return {
      line: macdLine,
      signal: signalLine,
      histogram
    };
  }

  /**
   * Calculate Exponential Moving Average (EMA)
   */
  private static calculateEMA(priceData: any[], period: number): PricePoint[] {
    const result: PricePoint[] = [];
    
    if (priceData.length < period) {
      return result;
    }
    
    // Calculate SMA for the first EMA value
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += priceData[i].close;
    }
    
    const multiplier = 2 / (period + 1);
    let ema = sum / period;
    
    result.push({
      date: new Date(priceData[period - 1].date).toISOString().split('T')[0],
      value: parseFloat(ema.toFixed(2))
    });
    
    // Calculate EMA for the rest of the data
    for (let i = period; i < priceData.length; i++) {
      ema = (priceData[i].close - ema) * multiplier + ema;
      result.push({
        date: new Date(priceData[i].date).toISOString().split('T')[0],
        value: parseFloat(ema.toFixed(2))
      });
    }
    
    return result;
  }
}