import axios from 'axios';
import { logger } from '../utils/logger';
import { StockPrice } from '../models/StockPrice';
import { SentimentScore } from '../models/Sentiment';

// ML Service Configuration
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';
const ML_SERVICE_TIMEOUT = 60000; // 60 seconds for ML training

export interface MLPredictionRequest {
  ticker: string;
  price_data: Array<{
    close: number;
    date: string;
  }>;
  sentiment_data?: Array<{
    sentiment_score: number;
    news_count: number;
    buzz_score: number;
    date?: string;
  }>;
  prediction_days?: number;
}

export interface MLPredictionResponse {
  ticker: string;
  predictions: Array<{
    date: string;
    predicted_price: number;
    upper_bound: number;
    lower_bound: number;
    confidence: number;
    sentiment_factor: number;
  }>;
  technical_indicators: {
    sma_20: number;
    sma_50: number;
    rsi: number;
    bollinger_upper: number;
    bollinger_lower: number;
    current_price: number;
  };
  sentiment_analysis: {
    correlation: number;
    impact_strength: 'high' | 'medium' | 'low';
    analysis: string;
    data_points: number;
  };
  model_metrics: {
    model_type: string;
    training_data_points: number;
    sentiment_data_points: number;
    sequence_length: number;
    prediction_horizon: number;
    features_used: string[];
    architecture: string;
    training_timestamp: string;
  };
  success: boolean;
  error?: string;
}

export interface SentimentAnalysisRequest {
  headlines: string[];
}

export interface SentimentAnalysisResponse {
  overall_sentiment: number;
  headline_results: Array<{
    headline: string;
    sentiment_score: number;
    label: string;
    confidence: number;
  }>;
  positive_summary: string[];
  negative_summary: string[];
  key_themes: Array<{
    theme: string;
    sentiment: number;
  }>;
  market_impact: string;
  analysis_metadata: {
    total_headlines: number;
    processed_headlines: number;
    positive_count: number;
    negative_count: number;
    neutral_count: number;
    model_used: string;
    timestamp: string;
  };
}

/**
 * ML Service for advanced financial predictions and sentiment analysis
 */
export class MLService {
  /**
   * Check ML service health and availability
   */
  static async checkHealth(): Promise<{
    available: boolean;
    status: string;
    modelLoaded: boolean;
    enhancedLSTMAvailable: boolean;
  }> {
    try {
      const response = await axios.get(`${ML_SERVICE_URL}/health`, {
        timeout: 5000
      });
      
      const data = response.data;
      
      logger.info('ML service health check successful');
      
      return {
        available: true,
        status: data.status,
        modelLoaded: data.model_loaded,
        enhancedLSTMAvailable: data.enhanced_lstm_available || false
      };
    } catch (error: any) {
      logger.warn('ML service health check failed:', error.message);
      return {
        available: false,
        status: 'unavailable',
        modelLoaded: false,
        enhancedLSTMAvailable: false
      };
    }
  }

  /**
   * Analyze headlines using FinBERT ML model
   */
  static async analyzeHeadlinesWithFinBERT(headlines: string[]): Promise<SentimentAnalysisResponse> {
    try {
      if (headlines.length === 0) {
        throw new Error('No headlines provided for analysis');
      }

      logger.info(`Analyzing ${headlines.length} headlines with FinBERT ML service`);
      
      const response = await axios.post(`${ML_SERVICE_URL}/analyze-sentiment`, {
        headlines
      }, {
        timeout: ML_SERVICE_TIMEOUT,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = response.data;
      
      logger.info(`FinBERT analysis complete. Overall sentiment: ${data.overall_sentiment}, Model: ${data.analysis_metadata.model_used}`);
      
      return data;
    } catch (error: any) {
      logger.error('FinBERT analysis failed:', error.message);
      throw new Error(`ML sentiment analysis failed: ${error.message}`);
    }
  }

  /**
   * Generate enhanced price predictions using sentiment-integrated LSTM
   */
  static async generateEnhancedPredictions(
    ticker: string,
    priceHistory: StockPrice[],
    sentimentHistory?: SentimentScore[],
    predictionDays: number = 7
  ): Promise<MLPredictionResponse> {
    try {
      if (priceHistory.length < 40) {
        throw new Error(`Insufficient price data for ${ticker}. Need at least 40 days, got ${priceHistory.length}`);
      }

      logger.info(`Generating enhanced ML predictions for ${ticker} with ${priceHistory.length} price points`);

      // Format price data
      const priceData = priceHistory.map(price => ({
        close: parseFloat(price.close.toString()),
        date: new Date(price.date).toISOString().split('T')[0]
      }));

      // Format sentiment data (optional)
      let sentimentData: Array<{
        sentiment_score: number;
        news_count: number;
        buzz_score: number;
        date: string;
      }> = [];

      if (sentimentHistory && sentimentHistory.length > 0) {
        sentimentData = sentimentHistory.map(sentiment => ({
          sentiment_score: parseFloat(sentiment.sentiment_score.toString()),
          news_count: sentiment.news_count,
          buzz_score: parseFloat(sentiment.buzz_score?.toString() || '1.0'),
          date: new Date(sentiment.date).toISOString().split('T')[0]
        }));
        
        logger.info(`Including ${sentimentData.length} sentiment data points in prediction`);
      } else {
        logger.info('No sentiment data available, using price-only prediction');
      }

      // Call ML service
      const request: MLPredictionRequest = {
        ticker,
        price_data: priceData,
        sentiment_data: sentimentData.length > 0 ? sentimentData : undefined,
        prediction_days: predictionDays
      };

      const response = await axios.post(`${ML_SERVICE_URL}/predict-price-enhanced`, request, {
        timeout: ML_SERVICE_TIMEOUT,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = response.data;

      if (!data.success) {
        throw new Error(data.error || 'ML prediction failed');
      }

      logger.info(`Enhanced ML prediction complete for ${ticker}. Generated ${data.predictions.length} predictions with ${data.model_metrics.model_type}`);

      return data;
    } catch (error: any) {
      logger.error(`Enhanced ML prediction failed for ${ticker}:`, error.message);
      throw new Error(`ML prediction service failed: ${error.message}`);
    }
  }

  /**
   * Generate technical indicators only
   */
  static async calculateTechnicalIndicators(prices: number[]): Promise<any> {
    try {
      if (prices.length < 20) {
        throw new Error('Need at least 20 price points for technical analysis');
      }

      const response = await axios.post(`${ML_SERVICE_URL}/technical-indicators`, {
        prices
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.data.technical_indicators;
    } catch (error: any) {
      logger.error('Technical indicators calculation failed:', error.message);
      throw new Error(`Technical analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze single headline sentiment
   */
  static async analyzeSingleHeadline(text: string): Promise<{
    sentiment_score: number;
    label: string;
    confidence: number;
  }> {
    try {
      const response = await axios.post(`${ML_SERVICE_URL}/analyze-single`, {
        text
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = response.data;
      
      return {
        sentiment_score: data.sentiment_score,
        label: data.label,
        confidence: data.confidence
      };
    } catch (error: any) {
      logger.error('Single headline analysis failed:', error.message);
      throw new Error(`Single sentiment analysis failed: ${error.message}`);
    }
  }

  /**
   * Create fallback prediction when ML service is unavailable
   */
  static createFallbackPrediction(
    ticker: string,
    recentPrice: number,
    predictionDays: number = 7
  ): MLPredictionResponse {
    const predictions = [];
    
    for (let i = 1; i <= predictionDays; i++) {
      // Simple trend continuation with random walk
      const randomFactor = 1 + (Math.random() - 0.5) * 0.02; // ±1% random
      const trendFactor = 1.001; // Slight upward bias
      const predictedPrice = recentPrice * Math.pow(trendFactor * randomFactor, i);
      
      predictions.push({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        predicted_price: Math.round(predictedPrice * 100) / 100,
        upper_bound: Math.round(predictedPrice * 1.1 * 100) / 100,
        lower_bound: Math.round(predictedPrice * 0.9 * 100) / 100,
        confidence: Math.max(30, 70 - i * 5), // Decreasing confidence
        sentiment_factor: 0
      });
    }

    return {
      ticker,
      predictions,
      technical_indicators: {
        sma_20: recentPrice,
        sma_50: recentPrice,
        rsi: 50,
        bollinger_upper: recentPrice * 1.05,
        bollinger_lower: recentPrice * 0.95,
        current_price: recentPrice
      },
      sentiment_analysis: {
        correlation: 0,
        impact_strength: 'low',
        analysis: 'ML service unavailable - using fallback prediction',
        data_points: 0
      },
      model_metrics: {
        model_type: 'Fallback Prediction',
        training_data_points: 0,
        sentiment_data_points: 0,
        sequence_length: 0,
        prediction_horizon: predictionDays,
        features_used: ['simple_trend'],
        architecture: 'Random Walk with Trend',
        training_timestamp: new Date().toISOString()
      },
      success: true
    };
  }
}