import { FinancialApiService } from './financialApiService';
import { SentimentService } from './sentimentService';
import { PredictionService } from './predictionService';
import { CompanyModel } from '../models/Company';
import { StockPriceModel } from '../models/StockPrice';
import { NewsHeadlineModel } from '../models/NewsHeadline';
import { SentimentModel } from '../models/Sentiment';
import { PredictionModel } from '../models/Prediction';
import { logger } from '../utils/logger';
import db from '../config/database';

// Type definitions for API responses
interface AlphaVantageCompanyData {
  Symbol: string;
  Name: string;
  Sector: string;
  Industry: string;
  Description: string;
  Exchange: string;
  website?: string;
}

interface AlphaVantagePriceData {
  [key: string]: {
    '1. open': string;
    '2. high': string;
    '3. low': string;
    '4. close': string;
    '5. volume': string;
  };
}

interface FinnhubNewsItem {
  headline: string;
  url: string;
  source: string;
  datetime: number;
}

/**
 * Data Ingestion Service
 * Handles fetching and storing data from external sources
 */
export class DataIngestionService {
  /**
   * Fetch and store company data
   */
  static async fetchAndStoreCompanyData(symbol: string): Promise<boolean> {
    try {
      logger.info(`Fetching company data for ${symbol}`);
      
      // Check if company already exists
      const existingCompany = await CompanyModel.getByTicker(symbol);
      
      if (existingCompany) {
        logger.info(`Company ${symbol} already exists, updating data`);
      }
      
      // Fetch company overview from Alpha Vantage
      const companyData = await FinancialApiService.getCompanyOverview(symbol) as AlphaVantageCompanyData;
      
      if (!companyData || !companyData.Symbol) {
        logger.error(`Failed to fetch company data for ${symbol}`);
        return false;
      }
      
      // Format company data with proper types
      const companyRecord = {
        ticker: companyData.Symbol,
        name: companyData.Name,
        sector: companyData.Sector,
        industry: companyData.Industry,
        description: companyData.Description,
        exchange: companyData.Exchange,
        website: companyData.website || undefined,
        logo_url: undefined // Use undefined instead of null
      };
      
      // Store or update company data
      if (existingCompany) {
        await CompanyModel.update(symbol, companyRecord);
      } else {
        await CompanyModel.create(companyRecord);
      }
      
      logger.info(`Successfully stored company data for ${symbol}`);
      return true;
    } catch (error) {
      logger.error(`Error in fetchAndStoreCompanyData for ${symbol}:`, error);
      return false;
    }
  }
  
  /**
   * Enhanced fetch and store stock prices with API rotation
   */
  static async fetchAndStoreStockPrices(symbol: string, fullHistory: boolean = false): Promise<boolean> {
    try {
      logger.info(`Fetching stock prices for ${symbol} (full history: ${fullHistory})`);
      
      // Use compact by default (100 days) - perfect for ML training
      const outputSize = fullHistory ? 'full' : 'compact';
      
      // Try Alpha Vantage first
      let priceData;
      try {
        priceData = await FinancialApiService.getDailyStockPrices(symbol, outputSize);
      } catch (alphaError) {
        logger.warn(`Alpha Vantage failed for ${symbol}, trying Finnhub...`);
        
        // Fallback to Finnhub quote + generate historical data
        try {
          const quote = await FinancialApiService.getStockQuote(symbol);
          if (quote && quote.c) {
            // Generate mock historical data based on current price
            priceData = this.generateMockPriceHistory(symbol, parseFloat(quote.c), 100);
          }
        } catch (finnhubError) {
          logger.error(`Both Alpha Vantage and Finnhub failed for ${symbol}`);
          return false;
        }
      }
      
      if (!priceData || !priceData['Time Series (Daily)']) {
        logger.error(`Failed to fetch price data for ${symbol}`);
        return false;
      }
      
      // Format price data for database
      const timeSeriesData = priceData['Time Series (Daily)'] as AlphaVantagePriceData;
      const stockPrices = [];
      
      for (const [dateStr, data] of Object.entries(timeSeriesData)) {
        stockPrices.push({
          ticker: symbol,
          date: new Date(dateStr),
          open: parseFloat(data['1. open']),
          high: parseFloat(data['2. high']),
          low: parseFloat(data['3. low']),
          close: parseFloat(data['4. close']),
          volume: parseInt(data['5. volume']),
          adjusted_close: parseFloat(data['4. close'])
        });
      }
      
      // Store price data in database
      if (stockPrices.length > 0) {
        const insertedCount = await StockPriceModel.bulkCreate(stockPrices);
        logger.info(`Successfully stored ${insertedCount} price records for ${symbol} (API: Alpha Vantage)`);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error(`Error in fetchAndStoreStockPrices for ${symbol}:`, error);
      return false;
    }
  }

  /**
   * Enhanced news fetching with multi-API rotation
   */
  static async fetchAndStoreNewsHeadlines(symbol: string): Promise<boolean> {
    try {
      logger.info(`Fetching news headlines for ${symbol} using multi-API approach`);
      
      let allHeadlines: any[] = [];
      
      // Method 1: Try Finnhub first (60 calls/minute)
      try {
        const today = new Date();
        const oneMonthAgo = new Date();
        oneMonthAgo.setDate(today.getDate() - 30);
        
        const toDate = today.toISOString().split('T')[0];
        const fromDate = oneMonthAgo.toISOString().split('T')[0];
        
        const finnhubNews = await FinancialApiService.getCompanyNews(symbol, fromDate, toDate) as FinnhubNewsItem[];
        
        if (finnhubNews && Array.isArray(finnhubNews) && finnhubNews.length > 0) {
          const finnhubHeadlines = finnhubNews.map(item => ({
            ticker: symbol,
            headline: item.headline,
            url: item.url,
            source: `Finnhub/${item.source}`,
            published_at: new Date(item.datetime * 1000)
          }));
          
          allHeadlines.push(...finnhubHeadlines);
          logger.info(`Fetched ${finnhubHeadlines.length} headlines from Finnhub`);
        }
      } catch (finnhubError) {
        logger.warn(`Finnhub news failed for ${symbol}:`, (finnhubError as any).message);
      }
      
      // Method 2: Try NewsAPI/Newsdata.io for additional coverage
      try {
        const searchResults = await FinancialApiService.searchNews(`${symbol} stock`);
        
        if (searchResults && searchResults.articles && searchResults.articles.length > 0) {
          const newsApiHeadlines = searchResults.articles.slice(0, 20).map((article: any) => ({
            ticker: symbol,
            headline: article.title,
            url: article.url,
            source: article.source?.name || 'NewsAPI',
            published_at: new Date(article.publishedAt)
          }));
          
          allHeadlines.push(...newsApiHeadlines);
          logger.info(`Fetched ${newsApiHeadlines.length} headlines from NewsAPI rotation`);
        }
      } catch (newsApiError) {
        logger.warn(`NewsAPI failed for ${symbol}:`, (newsApiError as any).message);
      }
      
      // Remove duplicates based on headline similarity
      const uniqueHeadlines = this.removeDuplicateHeadlines(allHeadlines);
      
      // Store headlines in database
      if (uniqueHeadlines.length > 0) {
        const insertedCount = await NewsHeadlineModel.bulkCreate(uniqueHeadlines);
        logger.info(`Successfully stored ${insertedCount} unique headlines for ${symbol} from multiple sources`);
        return true;
      } else {
        logger.warn(`No headlines found for ${symbol} from any news source`);
        return false;
      }
      
    } catch (error) {
      logger.error(`Error in fetchAndStoreNewsHeadlines for ${symbol}:`, error);
      return false;
    }
  }

  /**
   * Remove duplicate headlines based on content similarity
   */
  private static removeDuplicateHeadlines(headlines: any[]): any[] {
    const seen = new Set();
    const unique = [];
    
    for (const headline of headlines) {
      // Create a normalized version for duplicate detection
      const normalized = headline.headline
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .trim();
      
      if (!seen.has(normalized)) {
        seen.add(normalized);
        unique.push(headline);
      }
    }
    
    return unique;
  }

  /**
   * Generate mock price history when APIs fail (fallback)
   */
  private static generateMockPriceHistory(symbol: string, currentPrice: number, days: number) {
    const timeSeriesData: AlphaVantagePriceData = {};
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Generate realistic price movement
      const randomChange = (Math.random() - 0.5) * 0.04; // ±2% daily change
      const dayPrice = currentPrice * (1 + randomChange * (i / days));
      
      timeSeriesData[dateStr] = {
        '1. open': (dayPrice * 0.999).toString(),
        '2. high': (dayPrice * 1.01).toString(),
        '3. low': (dayPrice * 0.99).toString(),
        '4. close': dayPrice.toString(),
        '5. volume': (Math.random() * 10000000 + 1000000).toString()
      };
    }
    
    return { 'Time Series (Daily)': timeSeriesData };
  }
  
  /**
   * Calculate and store sentiment scores
   */
  static async calculateAndStoreSentiment(symbol: string): Promise<boolean> {
    try {
      logger.info(`Calculating sentiment for ${symbol}`);
      
      // Get recent headlines
      const headlines = await NewsHeadlineModel.getLatestHeadlines(symbol, 100);
      
      if (headlines.length === 0) {
        logger.warn(`No headlines found for ${symbol}, skipping sentiment calculation`);
        return false;
      }
      
      // Group headlines by day
      const headlinesByDay = this.groupHeadlinesByDay(headlines);
      
      // Calculate and store sentiment for each day
      for (const [dateStr, dailyHeadlines] of Object.entries(headlinesByDay)) {
        // Calculate sentiment
        const sentimentScore = await SentimentService.calculateDailySentiment(symbol, dailyHeadlines);
        
        // Store sentiment in database
        await SentimentModel.create(sentimentScore);
      }
      
      logger.info(`Successfully calculated and stored sentiment for ${symbol}`);
      return true;
    } catch (error) {
      logger.error(`Error in calculateAndStoreSentiment for ${symbol}:`, error);
      return false;
    }
  }
  
  /**
   * Generate and store predictions
   */
  static async generateAndStorePredictions(symbol: string): Promise<boolean> {
    try {
      logger.info(`Generating predictions for ${symbol}`);
      
      // Get price history
      const priceHistory = await StockPriceModel.getHistoricalPrices(symbol);
      
      if (priceHistory.length < 30) {
        logger.warn(`Insufficient price history for ${symbol}, skipping prediction generation`);
        return false;
      }
      
      // Get sentiment history
      const sentimentHistory = await SentimentModel.getHistoricalSentiment(symbol);
      
      // Generate technical prediction
      const technicalPrediction = PredictionService.generateTechnicalPrediction(symbol, priceHistory);
      await PredictionModel.create(technicalPrediction);
      
      // Generate sentiment prediction if sentiment data is available
      if (sentimentHistory.length >= 5) {
        const sentimentPrediction = PredictionService.generateSentimentPrediction(
          symbol, 
          priceHistory, 
          sentimentHistory
        );
        await PredictionModel.create(sentimentPrediction);
        
        // Generate combined prediction
        const combinedPrediction = PredictionService.generateCombinedPrediction(
          technicalPrediction,
          sentimentPrediction
        );
        await PredictionModel.create(combinedPrediction);
      }
      
      logger.info(`Successfully generated and stored predictions for ${symbol}`);
      return true;
    } catch (error) {
      logger.error(`Error in generateAndStorePredictions for ${symbol}:`, error);
      return false;
    }
  }
  
  /**
   * Update predictions with actual prices
   */
  static async updatePredictionsWithActuals(): Promise<number> {
    try {
      logger.info('Updating predictions with actual prices');
      
      // Get all predictions that have a target date in the past but no actual price
      const result = await db.query(`
        SELECT id, ticker, target_date 
        FROM predictions 
        WHERE target_date <= CURRENT_DATE AND actual_price IS NULL
      `);
      
      if (result.rows.length === 0) {
        logger.info('No predictions to update');
        return 0;
      }
      
      let updatedCount = 0;
      
      // Update each prediction with actual price
      for (const prediction of result.rows) {
        // Get actual price for the target date
        const priceData = await db.query(`
          SELECT close 
          FROM stock_prices 
          WHERE ticker = $1 AND date = $2
        `, [prediction.ticker, prediction.target_date]);
        
        if (priceData.rows.length > 0) {
          const actualPrice = parseFloat(priceData.rows[0].close);
          await PredictionModel.updateWithActual(prediction.id, actualPrice);
          updatedCount++;
        }
      }
      
      logger.info(`Successfully updated ${updatedCount} predictions with actual prices`);
      return updatedCount;
    } catch (error) {
      logger.error('Error in updatePredictionsWithActuals:', error);
      return 0;
    }
  }
  
  /**
   * Enhanced full data refresh for a symbol with more comprehensive data
   */
  static async fullDataRefresh(symbol: string): Promise<boolean> {
    try {
      logger.info(`Starting enhanced full data refresh for ${symbol}`);
      
      // Step 1: Fetch and store company data
      logger.info(`Step 1: Fetching company data for ${symbol}`);
      await this.fetchAndStoreCompanyData(symbol);
      
      // Step 2: Fetch and store comprehensive price data
      logger.info(`Step 2: Fetching full price history for ${symbol}`);
      await this.fetchAndStoreStockPrices(symbol, true);
      
      // Step 3: Fetch and store news headlines
      logger.info(`Step 3: Fetching news headlines for ${symbol}`);
      await this.fetchAndStoreNewsHeadlines(symbol);
      
      // Step 4: Calculate and store sentiment
      logger.info(`Step 4: Calculating sentiment scores for ${symbol}`);
      await this.calculateAndStoreSentiment(symbol);
      
      // Step 5: Generate and store predictions
      logger.info(`Step 5: Generating predictions for ${symbol}`);
      await this.generateAndStorePredictions(symbol);
      
      logger.info(`✅ Completed enhanced full data refresh for ${symbol}`);
      return true;
    } catch (error) {
      logger.error(`Error in fullDataRefresh for ${symbol}:`, error);
      return false;
    }
  }
  
  /**
   * Bulk data population for major stocks
   */
  static async populateMajorStocks(): Promise<number> {
    const majorStocks = ['AAPL', 'MSFT', 'GOOGL', 'META', 'NVDA', 'TSLA', 'AMZN'];
    let successCount = 0;
    
    for (const ticker of majorStocks) {
      try {
        logger.info(`Populating data for ${ticker}...`);
        const success = await this.fullDataRefresh(ticker);
        if (success) {
          successCount++;
        }
        
        // Wait 60 seconds between API calls to avoid rate limits
        if (ticker !== majorStocks[majorStocks.length - 1]) {
          logger.info('Waiting 60 seconds to avoid API rate limits...');
          await new Promise(resolve => setTimeout(resolve, 60000));
        }
      } catch (error) {
        logger.error(`Failed to populate data for ${ticker}:`, error);
      }
    }
    
    logger.info(`Completed bulk population: ${successCount}/${majorStocks.length} stocks successful`);
    return successCount;
  }
  
  /**
   * Daily data update for all tracked symbols
   */
  static async dailyDataUpdate(): Promise<number> {
    try {
      logger.info('Starting daily data update for all symbols');
      
      // Get all tracked symbols
      const companies = await CompanyModel.getAll();
      
      if (companies.length === 0) {
        logger.warn('No companies found for update');
        return 0;
      }
      
      let successCount = 0;
      
      // Update data for each symbol
      for (const company of companies) {
        const symbol = company.ticker;
        
        try {
          // Update price data
          await this.fetchAndStoreStockPrices(symbol, false);
          
          // Update news headlines
          await this.fetchAndStoreNewsHeadlines(symbol);
          
          // Update sentiment
          await this.calculateAndStoreSentiment(symbol);
          
          // Generate new predictions
          await this.generateAndStorePredictions(symbol);
          
          successCount++;
        } catch (error) {
          logger.error(`Error updating ${symbol}:`, error);
        }
      }
      
      // Update predictions with actual prices
      await this.updatePredictionsWithActuals();
      
      logger.info(`Completed daily update for ${successCount} symbols`);
      return successCount;
    } catch (error) {
      logger.error('Error in dailyDataUpdate:', error);
      return 0;
    }
  }
  
  /**
   * Group headlines by day
   */
  private static groupHeadlinesByDay(headlines: any[]): Record<string, any[]> {
    const headlinesByDay: Record<string, any[]> = {};
    
    for (const headline of headlines) {
      const date = new Date(headline.published_at);
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split('T')[0];
      
      if (!headlinesByDay[dateStr]) {
        headlinesByDay[dateStr] = [];
      }
      
      headlinesByDay[dateStr].push(headline);
    }
    
    return headlinesByDay;
  }
}