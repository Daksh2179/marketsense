import axios from 'axios';
import { logger } from '../utils/logger';
import dotenv from 'dotenv';

dotenv.config();

// API Keys
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const NEWSAPI_API_KEY = process.env.NEWSAPI_API_KEY;
const NEWSDATA_API_KEY = process.env.NEWSDATA_API_KEY;

// Base URLs
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const NEWSAPI_BASE_URL = 'https://newsapi.org/v2';
const NEWSDATA_BASE_URL = 'https://newsdata.io/api/1';

// API usage tracking (simple in-memory tracking)
const apiUsage = {
  newsapi: {
    count: 0,
    resetTime: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
    limit: 100
  },
  newsdata: {
    count: 0,
    resetTime: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
    limit: 200  // Adjust based on your actual newsdata.io plan
  }
};

/**
 * Financial API Service - Handles external API calls to financial data providers
 */
export class FinancialApiService {
  
  /**
   * Get daily stock price data from Alpha Vantage
   */
  static async getDailyStockPrices(symbol: string, outputSize: 'compact' | 'full' = 'compact'): Promise<any> {
    try {
      // Check if API key is available
      if (!ALPHA_VANTAGE_API_KEY) {
        logger.warn('Alpha Vantage API key not found. Please add ALPHA_VANTAGE_API_KEY to your .env file');
        return null;
      }
      
      const response = await axios.get(ALPHA_VANTAGE_BASE_URL, {
        params: {
          function: 'TIME_SERIES_DAILY',
          symbol,
          outputsize: outputSize,
          apikey: ALPHA_VANTAGE_API_KEY
        }
      });
      
      // Check for API error responses
      if (response.data['Error Message']) {
        logger.error(`Alpha Vantage API error: ${response.data['Error Message']}`);
        return null;
      }
      
      return response.data;
    } catch (error) {
      logger.error(`Error fetching stock prices for ${symbol}:`, error);
      throw error;
    }
  }
  
  /**
   * Get company overview data from Alpha Vantage
   */
  static async getCompanyOverview(symbol: string): Promise<any> {
    try {
      // Check if API key is available
      if (!ALPHA_VANTAGE_API_KEY) {
        logger.warn('Alpha Vantage API key not found. Please add ALPHA_VANTAGE_API_KEY to your .env file');
        return null;
      }
      
      const response = await axios.get(ALPHA_VANTAGE_BASE_URL, {
        params: {
          function: 'OVERVIEW',
          symbol,
          apikey: ALPHA_VANTAGE_API_KEY
        }
      });
      
      // Check for API error responses
      if (response.data['Error Message']) {
        logger.error(`Alpha Vantage API error: ${response.data['Error Message']}`);
        return null;
      }
      
      return response.data;
    } catch (error) {
      logger.error(`Error fetching company overview for ${symbol}:`, error);
      throw error;
    }
  }
  
  /**
   * Get company news from Finnhub
   */
  static async getCompanyNews(symbol: string, from: string, to: string): Promise<any> {
    try {
      // Check if API key is available
      if (!FINNHUB_API_KEY) {
        logger.warn('Finnhub API key not found. Please add FINNHUB_API_KEY to your .env file');
        return null;
      }
      
      const response = await axios.get(`${FINNHUB_BASE_URL}/company-news`, {
        params: {
          symbol,
          from,
          to,
          token: FINNHUB_API_KEY
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Error fetching company news for ${symbol}:`, error);
      throw error;
    }
  }
  
  /**
   * Search for news articles - Automatically rotates between NewsAPI and newsdata.io
   */
  static async searchNews(query: string, from?: string, to?: string, sortBy: 'relevancy' | 'popularity' | 'publishedAt' = 'publishedAt'): Promise<any> {
    try {
      // Reset usage counters if a day has passed
      const now = Date.now();
      if (now > apiUsage.newsapi.resetTime) {
        apiUsage.newsapi.count = 0;
        apiUsage.newsapi.resetTime = now + 24 * 60 * 60 * 1000;
      }
      if (now > apiUsage.newsdata.resetTime) {
        apiUsage.newsdata.count = 0;
        apiUsage.newsdata.resetTime = now + 24 * 60 * 60 * 1000;
      }
      
      // Strategy: Try to balance usage between both APIs
      // Use the API with the most remaining quota percentage
      const newsapiRemainingPercentage = (apiUsage.newsapi.limit - apiUsage.newsapi.count) / apiUsage.newsapi.limit;
      const newsdataRemainingPercentage = (apiUsage.newsdata.limit - apiUsage.newsdata.count) / apiUsage.newsdata.limit;
      
      // First try the API with more remaining quota
      if ((NEWSAPI_API_KEY && newsapiRemainingPercentage >= newsdataRemainingPercentage) || 
          (!NEWSDATA_API_KEY && NEWSAPI_API_KEY)) {
        try {
          const result = await this.searchNewsWithNewsAPI(query, from, to, sortBy);
          apiUsage.newsapi.count++;
          return result;
        } catch (error) {
          logger.warn(`NewsAPI request failed, falling back to newsdata.io: ${(error instanceof Error ? error.message : String(error))}`);
          // Fall back to newsdata.io if NewsAPI fails
        }
      }
      
      // Try newsdata.io if it has more remaining quota or if NewsAPI failed
      if (NEWSDATA_API_KEY) {
        const result = await this.searchNewsWithNewsData(query, from, to);
        apiUsage.newsdata.count++;
        return result;
      }
      
      // If we get here, neither API is available
      logger.warn('No news API keys configured. Please add NEWSAPI_API_KEY or NEWSDATA_API_KEY to your .env file');
      return { articles: [] };
      
    } catch (error) {
      logger.error(`Error searching news for ${query}:`, error);
      return { articles: [] };
    }
  }
  
  /**
   * Search news using NewsAPI
   */
  private static async searchNewsWithNewsAPI(query: string, from?: string, to?: string, sortBy: 'relevancy' | 'popularity' | 'publishedAt' = 'publishedAt'): Promise<any> {
    // Check if API key is available
    if (!NEWSAPI_API_KEY) {
      throw new Error('NewsAPI key not found');
    }
    
    const params: any = {
      q: query,
      sortBy,
      apiKey: NEWSAPI_API_KEY
    };
    
    if (from) params.from = from;
    if (to) params.to = to;
    
    const response = await axios.get(`${NEWSAPI_BASE_URL}/everything`, { params });
    
    return response.data;
  }
  
  /**
   * Search news using newsdata.io
   */
  private static async searchNewsWithNewsData(query: string, from?: string, to?: string): Promise<any> {
    // Check if API key is available
    if (!NEWSDATA_API_KEY) {
      throw new Error('newsdata.io key not found');
    }
    
    const params: any = {
      q: query,
      apikey: NEWSDATA_API_KEY
    };
    
    // Convert date format if needed
    if (from) params.from_date = from;
    if (to) params.to_date = to;
    
    const response = await axios.get(`${NEWSDATA_BASE_URL}/news`, { params });
    
    // Transform newsdata.io response to match NewsAPI format for compatibility
    const transformed = {
      status: response.data.status,
      totalResults: response.data.totalResults,
      articles: response.data.results.map((item: any) => ({
        source: { id: item.source_id, name: item.source_name },
        author: item.creator ? item.creator.join(', ') : null,
        title: item.title,
        description: item.description,
        url: item.link,
        urlToImage: item.image_url,
        publishedAt: item.pubDate,
        content: item.content
      }))
    };
    
    return transformed;
  }
  
  /**
   * Get stock quote from Finnhub
   */
  static async getStockQuote(symbol: string): Promise<any> {
    try {
      // Check if API key is available
      if (!FINNHUB_API_KEY) {
        logger.warn('Finnhub API key not found. Please add FINNHUB_API_KEY to your .env file');
        return null;
      }
      
      const response = await axios.get(`${FINNHUB_BASE_URL}/quote`, {
        params: {
          symbol,
          token: FINNHUB_API_KEY
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Error fetching stock quote for ${symbol}:`, error);
      throw error;
    }
  }
  
  /**
   * Get multiple stock quotes efficiently
   */
  static async getBatchStockQuotes(symbols: string[]): Promise<Record<string, any>> {
    try {
      // Check if API key is available
      if (!FINNHUB_API_KEY) {
        logger.warn('Finnhub API key not found. Please add FINNHUB_API_KEY to your .env file');
        return {};
      }
      
      // Create promises for all API requests
      const requests = symbols.map(symbol => 
        axios.get(`${FINNHUB_BASE_URL}/quote`, {
          params: {
            symbol,
            token: FINNHUB_API_KEY
          }
        })
      );
      
      // Execute all requests in parallel
      const responses = await Promise.allSettled(requests);
      
      // Process responses
      const results: Record<string, any> = {};
      
      responses.forEach((response, index) => {
        const symbol = symbols[index];
        if (response.status === 'fulfilled') {
          results[symbol] = response.value.data;
        } else {
          logger.error(`Error fetching quote for ${symbol}:`, response.reason);
          results[symbol] = null;
        }
      });
      
      return results;
    } catch (error) {
      logger.error('Error fetching batch stock quotes:', error);
      throw error;
    }
  }
  
  /**
   * Check if API keys are configured
   */
  static checkApiKeys(): {
    alphaVantage: boolean;
    finnhub: boolean;
    newsApi: boolean;
    newsData: boolean;
  } {
    return {
      alphaVantage: !!ALPHA_VANTAGE_API_KEY,
      finnhub: !!FINNHUB_API_KEY,
      newsApi: !!NEWSAPI_API_KEY,
      newsData: !!NEWSDATA_API_KEY
    };
  }
  
  /**
   * Get API usage statistics
   */
  static getApiUsage(): any {
    return {
      newsapi: {
        used: apiUsage.newsapi.count,
        limit: apiUsage.newsapi.limit,
        remaining: apiUsage.newsapi.limit - apiUsage.newsapi.count,
        resetTime: new Date(apiUsage.newsapi.resetTime).toISOString()
      },
      newsdata: {
        used: apiUsage.newsdata.count,
        limit: apiUsage.newsdata.limit,
        remaining: apiUsage.newsdata.limit - apiUsage.newsdata.count,
        resetTime: new Date(apiUsage.newsdata.resetTime).toISOString()
      }
    };
  }
}