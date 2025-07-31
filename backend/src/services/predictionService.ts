import { logger } from '../utils/logger';
import { StockPrice } from '../models/StockPrice';
import { SentimentScore } from '../models/Sentiment';
import { Prediction } from '../models/Prediction';

/**
 * Prediction Service - Handles price prediction algorithms
 */
export class PredictionService {
  /**
   * Generate technical prediction for a stock
   */
  static generateTechnicalPrediction(
    ticker: string,
    priceHistory: StockPrice[],
    daysAhead: number = 7
  ): Prediction {
    try {
      if (priceHistory.length < 30) {
        throw new Error('Insufficient price history for prediction');
      }
      
      // Sort price history by date (oldest first)
      const sortedPrices = [...priceHistory].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      // Simple prediction using moving averages and trend analysis
      const prices = sortedPrices.map(p => p.close);
      const latestPrice = prices[prices.length - 1];
      
      // Calculate short-term and long-term moving averages
      const shortTermMA = this.calculateSMA(prices, 5);
      const longTermMA = this.calculateSMA(prices, 20);
      
      // Calculate momentum (rate of change)
      const momentum = this.calculateMomentum(prices, 10);
      
      // Calculate volatility
      const volatility = this.calculateVolatility(prices, 20);
      
      // Determine trend direction
      let trendDirection: 'UP' | 'DOWN' | 'NEUTRAL' = 'NEUTRAL';
      
      if (shortTermMA > longTermMA && momentum > 0) {
        trendDirection = 'UP';
      } else if (shortTermMA < longTermMA && momentum < 0) {
        trendDirection = 'DOWN';
      }
      
      // Predict future price using simple trend extrapolation
      let predictedPrice = latestPrice;
      
      if (trendDirection === 'UP') {
        predictedPrice *= (1 + (momentum * daysAhead * 0.01));
      } else if (trendDirection === 'DOWN') {
        predictedPrice *= (1 + (momentum * daysAhead * 0.01));
      }
      
      // Calculate confidence score based on volatility and trend consistency
      const volatilityFactor = Math.max(0, 1 - (volatility * 2));
      const trendConsistency = this.calculateTrendConsistency(prices, 10);
      
      const confidenceScore = Math.min(100, Math.max(0, 
        50 + (trendConsistency * 30) + (volatilityFactor * 20)
      ));
      
      // Create target date
      const today = new Date();
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + daysAhead);
      
      return {
        ticker,
        date: today,
        target_date: targetDate,
        predicted_price: parseFloat(predictedPrice.toFixed(2)),
        predicted_direction: trendDirection,
        confidence_score: parseFloat(confidenceScore.toFixed(2)),
        prediction_type: 'TECHNICAL'
      };
    } catch (error) {
      logger.error(`Error generating technical prediction for ${ticker}:`, error);
      throw error;
    }
  }
  
  /**
   * Generate sentiment-based prediction
   */
  static generateSentimentPrediction(
    ticker: string,
    priceHistory: StockPrice[],
    sentimentHistory: SentimentScore[],
    daysAhead: number = 7
  ): Prediction {
    try {
      if (priceHistory.length < 10 || sentimentHistory.length < 5) {
        throw new Error('Insufficient data for sentiment prediction');
      }
      
      // Sort price history by date (oldest first)
      const sortedPrices = [...priceHistory].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      // Sort sentiment history by date (oldest first)
      const sortedSentiment = [...sentimentHistory].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      const prices = sortedPrices.map(p => p.close);
      const latestPrice = prices[prices.length - 1];
      
      // Calculate recent sentiment trend
      const recentSentiments = sortedSentiment.slice(-10);
      const avgSentiment = recentSentiments.reduce((sum, s) => sum + s.sentiment_score, 0) / recentSentiments.length;
      
      // Calculate sentiment momentum
      const sentimentMomentum = this.calculateSentimentMomentum(recentSentiments);
      
      // Determine sentiment-based direction
      let predictedDirection: 'UP' | 'DOWN' | 'NEUTRAL' = 'NEUTRAL';
      
      if (avgSentiment > 0.2 && sentimentMomentum > 0) {
        predictedDirection = 'UP';
      } else if (avgSentiment < -0.2 && sentimentMomentum < 0) {
        predictedDirection = 'DOWN';
      }
      
      // Calculate sentiment impact factor
      // This is a simplified approach - in a real system you would use historical correlation
      const sentimentImpactFactor = Math.min(0.1, Math.max(-0.1, avgSentiment * 0.05));
      
      // Predict future price based on sentiment
      const predictedPrice = latestPrice * (1 + (sentimentImpactFactor * daysAhead));
      
      // Calculate confidence score based on sentiment strength and consistency
      const sentimentStrength = Math.abs(avgSentiment);
      const sentimentConsistency = this.calculateSentimentConsistency(recentSentiments);
      const newsDensity = Math.min(1, recentSentiments.reduce((sum, s) => sum + s.news_count, 0) / 50);
      
      const confidenceScore = Math.min(100, Math.max(0,
        40 + (sentimentStrength * 30) + (sentimentConsistency * 20) + (newsDensity * 10)
      ));
      
      // Create target date
      const today = new Date();
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + daysAhead);
      
      return {
        ticker,
        date: today,
        target_date: targetDate,
        predicted_price: parseFloat(predictedPrice.toFixed(2)),
        predicted_direction: predictedDirection,
        confidence_score: parseFloat(confidenceScore.toFixed(2)),
        prediction_type: 'SENTIMENT'
      };
    } catch (error) {
      logger.error(`Error generating sentiment prediction for ${ticker}:`, error);
      throw error;
    }
  }
  
  /**
   * Generate combined prediction (technical + sentiment)
   */
  static generateCombinedPrediction(
    technicalPrediction: Prediction,
    sentimentPrediction: Prediction
  ): Prediction {
    try {
      // Verify both predictions are for the same ticker and target date
      if (technicalPrediction.ticker !== sentimentPrediction.ticker) {
        throw new Error('Predictions are for different tickers');
      }
      
      // Calculate weights based on confidence scores
      const technicalWeight = technicalPrediction.confidence_score / 
        (technicalPrediction.confidence_score + sentimentPrediction.confidence_score);
      
      const sentimentWeight = 1 - technicalWeight;
      
      // Calculate weighted predicted price
      const predictedPrice = (
        technicalPrediction.predicted_price! * technicalWeight +
        sentimentPrediction.predicted_price! * sentimentWeight
      );
      
      // Determine overall direction
      let predictedDirection: 'UP' | 'DOWN' | 'NEUTRAL';
      
      if (technicalPrediction.predicted_direction === sentimentPrediction.predicted_direction) {
        // Both predictions agree
        predictedDirection = technicalPrediction.predicted_direction;
      } else if (technicalWeight > 0.7) {
        // Technical prediction has much higher confidence
        predictedDirection = technicalPrediction.predicted_direction;
      } else if (sentimentWeight > 0.7) {
        // Sentiment prediction has much higher confidence
        predictedDirection = sentimentPrediction.predicted_direction;
      } else {
        // No clear winner, use weighted price change to determine direction
        const latestPrice = technicalPrediction.predicted_price! / 
          (1 + this.calculatePriceChangePercent(technicalPrediction));
        
        if (predictedPrice > latestPrice * 1.01) {
          predictedDirection = 'UP';
        } else if (predictedPrice < latestPrice * 0.99) {
          predictedDirection = 'DOWN';
        } else {
          predictedDirection = 'NEUTRAL';
        }
      }
      
      // Calculate combined confidence
      // When predictions agree, confidence is higher
      const directionAgreement = technicalPrediction.predicted_direction === 
        sentimentPrediction.predicted_direction ? 1.2 : 0.8;
      
      const confidenceScore = Math.min(100, Math.max(0,
        (technicalPrediction.confidence_score * technicalWeight +
        sentimentPrediction.confidence_score * sentimentWeight) * directionAgreement
      ));
      
      return {
        ticker: technicalPrediction.ticker,
        date: technicalPrediction.date,
        target_date: technicalPrediction.target_date,
        predicted_price: parseFloat(predictedPrice.toFixed(2)),
        predicted_direction: predictedDirection,
        confidence_score: parseFloat(confidenceScore.toFixed(2)),
        prediction_type: 'COMBINED'
      };
    } catch (error) {
      logger.error('Error generating combined prediction:', error);
      throw error;
    }
  }
  
  /**
   * Detect market regime (bull, bear, or sideways)
   */
  static detectMarketRegime(priceHistory: StockPrice[]): {
    regime: 'BULL' | 'BEAR' | 'SIDEWAYS';
    strength: number;
    duration: number;
  } {
    try {
      if (priceHistory.length < 60) { // Need at least 60 days of data
        throw new Error('Insufficient price history for regime detection');
      }
      
      // Sort price history by date (oldest first)
      const sortedPrices = [...priceHistory].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      const prices = sortedPrices.map(p => p.close);
      
      // Calculate 20-day and 50-day moving averages
      const ma20 = this.calculateSMA(prices.slice(-20));
      const ma50 = this.calculateSMA(prices.slice(-50));
      
      // Calculate price trend over different periods
      const trend30d = this.calculatePriceTrend(prices.slice(-30));
      const trend60d = this.calculatePriceTrend(prices.slice(-60));
      
      // Calculate volatility
      const volatility = this.calculateVolatility(prices, 30);
      
      // Determine regime
      let regime: 'BULL' | 'BEAR' | 'SIDEWAYS' = 'SIDEWAYS';
      let strength = 0;
      
      if (ma20 > ma50 && trend30d > 0.05 && trend60d > 0) {
        regime = 'BULL';
        strength = Math.min(1, (trend30d * 5 + trend60d * 3) / 8);
      } else if (ma20 < ma50 && trend30d < -0.05 && trend60d < 0) {
        regime = 'BEAR';
        strength = Math.min(1, (Math.abs(trend30d) * 5 + Math.abs(trend60d) * 3) / 8);
      } else {
        regime = 'SIDEWAYS';
        strength = Math.min(1, (1 - Math.abs(trend30d) * 10) * (1 - Math.abs(trend60d) * 5));
      }
      
      // Adjust strength based on volatility
      // High volatility reduces strength in sideways markets but can enhance bull/bear signals
      if (regime === 'SIDEWAYS') {
        strength *= Math.max(0.2, 1 - volatility * 5);
      } else {
        strength = Math.min(1, strength * (1 + volatility));
      }
      
      // Calculate duration of current regime
      let duration = 0;
      const regimeThreshold = regime === 'BULL' ? 0.05 : (regime === 'BEAR' ? -0.05 : 0);
      
      for (let i = prices.length - 2; i >= 0; i--) {
        const periodReturn = (prices[i + 1] - prices[i]) / prices[i];
        
        if ((regime === 'BULL' && periodReturn < regimeThreshold) ||
            (regime === 'BEAR' && periodReturn > regimeThreshold) ||
            (regime === 'SIDEWAYS' && Math.abs(periodReturn) > 0.03)) {
          break;
        }
        
        duration++;
      }
      
      return {
        regime,
        strength: parseFloat(strength.toFixed(2)),
        duration
      };
    } catch (error) {
      logger.error('Error detecting market regime:', error);
      return {
        regime: 'SIDEWAYS', // Default to sideways if error
        strength: 0.5,
        duration: 0
      };
    }
  }
  
  // Helper methods
  
  /**
   * Calculate Simple Moving Average (SMA)
   */
  private static calculateSMA(data: number[], period: number = data.length): number {
    if (data.length === 0) return 0;
    if (data.length < period) period = data.length;
    
    const sum = data.slice(-period).reduce((total, value) => total + value, 0);
    return sum / period;
  }
  
  /**
   * Calculate momentum (rate of change)
   */
  private static calculateMomentum(data: number[], period: number = 14): number {
    if (data.length <= period) return 0;
    
    const currentValue = data[data.length - 1];
    const pastValue = data[data.length - 1 - period];
    
    return ((currentValue - pastValue) / pastValue) * 100;
  }
  
  /**
   * Calculate volatility (standard deviation of returns)
   */
  private static calculateVolatility(data: number[], period: number = 20): number {
    if (data.length < period + 1) return 0;
    
    // Calculate daily returns
    const returns: number[] = [];
    for (let i = 1; i < data.length; i++) {
      returns.push((data[i] - data[i - 1]) / data[i - 1]);
    }
    
    // Use only the last 'period' returns
    const recentReturns = returns.slice(-period);
    
    // Calculate mean return
    const mean = recentReturns.reduce((sum, value) => sum + value, 0) / recentReturns.length;
    
    // Calculate sum of squared differences
    const squaredDiffs = recentReturns.map(value => Math.pow(value - mean, 2));
    const variance = squaredDiffs.reduce((sum, value) => sum + value, 0) / recentReturns.length;
    
    return Math.sqrt(variance);
  }
  
  /**
   * Calculate trend consistency
   */
  private static calculateTrendConsistency(data: number[], period: number = 10): number {
    if (data.length < period + 1) return 0;
    
    // Calculate daily changes
    const changes: number[] = [];
    for (let i = 1; i < data.length; i++) {
      changes.push(data[i] - data[i - 1]);
    }
    
    // Use only the last 'period' changes
    const recentChanges = changes.slice(-period);
    
    // Count how many changes are in the same direction as the overall trend
    const trendDirection = recentChanges.reduce((sum, change) => sum + change, 0) >= 0 ? 1 : -1;
    const consistentChanges = recentChanges.filter(change => (change > 0 && trendDirection > 0) || 
                                                           (change < 0 && trendDirection < 0));
    
    return consistentChanges.length / recentChanges.length;
  }
  
  /**
   * Calculate sentiment momentum
   */
  private static calculateSentimentMomentum(sentiments: SentimentScore[]): number {
    if (sentiments.length < 2) return 0;
    
    // Split the sentiment history in half and compare average sentiment
    const midpoint = Math.floor(sentiments.length / 2);
    const recentSentiments = sentiments.slice(midpoint);
    const olderSentiments = sentiments.slice(0, midpoint);
    
    const recentAvg = recentSentiments.reduce((sum, s) => sum + s.sentiment_score, 0) / recentSentiments.length;
    const olderAvg = olderSentiments.reduce((sum, s) => sum + s.sentiment_score, 0) / olderSentiments.length;
    
    return recentAvg - olderAvg;
  }
  
  /**
   * Calculate sentiment consistency
   */
  private static calculateSentimentConsistency(sentiments: SentimentScore[]): number {
    if (sentiments.length < 2) return 0;
    
    // Determine the overall sentiment direction
    const avgSentiment = sentiments.reduce((sum, s) => sum + s.sentiment_score, 0) / sentiments.length;
    const direction = avgSentiment >= 0 ? 1 : -1;
    
    // Count how many sentiment scores are in the same direction as the average
    const consistentScores = sentiments.filter(s => (s.sentiment_score >= 0 && direction > 0) || 
                                                 (s.sentiment_score < 0 && direction < 0));
    
    return consistentScores.length / sentiments.length;
  }
  
  /**
   * Calculate price change percent from prediction
   */
  private static calculatePriceChangePercent(prediction: Prediction): number {
    // This is a simplified method and assumes that the base price is available
    // In a real system, you would compare with the latest actual price
    
    if (!prediction.predicted_price) return 0;
    
    // Estimate original price based on the predicted price and direction
    const estimatedChange = prediction.predicted_direction === 'UP' ? 0.02 : 
                          (prediction.predicted_direction === 'DOWN' ? -0.02 : 0);
    
    const estimatedOriginalPrice = prediction.predicted_price / (1 + estimatedChange);
    
    return (prediction.predicted_price - estimatedOriginalPrice) / estimatedOriginalPrice;
  }
  
  /**
   * Calculate price trend over a period
   */
  private static calculatePriceTrend(prices: number[]): number {
    if (prices.length < 2) return 0;
    
    const startPrice = prices[0];
    const endPrice = prices[prices.length - 1];
    
    return (endPrice - startPrice) / startPrice;
  }
}