import { FinancialApiService } from './financialApiService';
import { SentimentService } from './sentimentService';
import { PredictionService } from './predictionService';
import { CompanyModel } from '../models/Company';
import { StockPriceModel } from '../models/StockPrice';
import { NewsHeadlineModel } from '../models/NewsHeadline';
import { SentimentModel } from '../models/Sentiment';
import { PredictionModel } from '../models/Prediction';
import { logger } from '../utils/logger';

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
      const companyData = await FinancialApiService.getCompanyOverview(symbol);
      
      if (!companyData || !companyData.Symbol) {
        logger.error(`Failed to fetch company data for ${symbol}`);
        return false;
      }
      
      // Format company data
      const companyRecord = {
        ticker: companyData.Symbol,
        name: companyData.Name,
        sector: companyData.Sector,
        industry: companyData.Industry,
        description: companyData.Description,
        exchange: companyData.Exchange,
        website: companyData.website || null,
        logo_url: null // Add logo fetching if needed
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
   * Fetch and store stock price data
   */
  static async fetchAndStoreStockPrices(symbol: string, fullHistory: boolean = false): Promise<boolean> {
    try {
      logger.info(`Fetching stock prices for ${symbol}`);
      
      // Fetch stock price data from Alpha Vantage
      const priceData = await FinancialApiService.getDailyStockPrices(
        symbol, 
        fullHistory ? 'full' : 'compact'
      );
      
      if (!priceData || !priceData['Time Series (Daily)']) {
        logger.error(`Failed to fetch price data for ${symbol}`);
        return false;
      }
      
      // Format price data for database
      const timeSeriesData = priceData['Time Series (Daily)'];
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
          adjusted_close: parseFloat(data['4. close']) // Use regular close as adjusted if not available
        });
      }
      
      // Store price data in database
      if (stockPrices.length > 0) {
        const insertedCount = await StockPriceModel.bulkCreate(stockPrices);
        logger.info(`Successfully stored ${insertedCount} price records for ${symbol}`);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error(`Error in fetchAndStoreStockPrices for ${symbol}:`, error);
      return false;
    }
  }
  
  /**
   * Fetch and store news headlines
   */
  static async fetchAndStoreNewsHeadlines(symbol: string): Promise<boolean> {
    try {
      logger.info(`Fetching news headlines for ${symbol}`);
      
      // Calculate date range (last 30 days)
      const today = new Date();
      const oneMonthAgo = new Date();
      oneMonthAgo.setDate(today.getDate() - 30);
      
      // Format dates for API
      const toDate = today.toISOString().split('T')[0];
      const fromDate = oneMonthAgo.toISOString().split('T')[0];
      
      // Fetch news data from Finnhub
      const newsData = await FinancialApiService.getCompanyNews(symbol, fromDate, toDate);
      
      if (!newsData || !Array.isArray(newsData) || newsData.length === 0) {
        logger.warn(`No news data found for ${symbol}`);
        return false;
      }
      
      // Format news data for database
      const headlines = newsData.map(item => ({
        ticker: symbol,
        headline: item.headline,
        url: item.url,
        source: item.source,
        published_at: new Date(item.datetime * 1000) // Convert Unix timestamp to Date
      }));
      
      // Store headlines in database
      if (headlines.length > 0) {
        const insertedCount = await NewsHeadlineModel.bulkCreate(headlines);
        logger.info(`Successfully stored ${insertedCount} headlines for ${symbol}`);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error(`Error in fetchAndStoreNewsHeadlines for ${symbol}:`, error);
      return false;
    }
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
      const result = await PredictionModel.query(`
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
        const priceData = await StockPriceModel.query(`
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
   * Full data refresh for a symbol
   */
  static async fullDataRefresh(symbol: string): Promise<boolean> {
    try {
      logger.info(`Starting full data refresh for ${symbol}`);
      
      // Fetch and store company data
      await this.fetchAndStoreCompanyData(symbol);
      
      // Fetch and store price data
      await this.fetchAndStoreStockPrices(symbol, true);
      
      // Fetch and store news headlines
      await this.fetchAndStoreNewsHeadlines(symbol);
      
      // Calculate and store sentiment
      await this.calculateAndStoreSentiment(symbol);
      
      // Generate and store predictions
      await this.generateAndStorePredictions(symbol);
      
      logger.info(`Completed full data refresh for ${symbol}`);
      return true;
    } catch (error) {
      logger.error(`Error in fullDataRefresh for ${symbol}:`, error);
      return false;
    }
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
        
        // Update price data
        await this.fetchAndStoreStockPrices(symbol);
        
        // Update news headlines
        await this.fetchAndStoreNewsHeadlines(symbol);
        
        // Update sentiment
        await this.calculateAndStoreSentiment(symbol);
        
        // Generate new predictions
        await this.generateAndStorePredictions(symbol);
        
        successCount++;
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