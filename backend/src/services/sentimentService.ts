import axios from 'axios';
import { logger } from '../utils/logger';
import dotenv from 'dotenv';
import { NewsHeadline } from '../models/NewsHeadline';
import { SentimentScore } from '../models/Sentiment';

dotenv.config();

// Sentiment analysis options
// 1. Use an external API (OPTION A)
const SENTIMENT_API_KEY = process.env.SENTIMENT_API_KEY; // Optional external API key
const SENTIMENT_API_URL = process.env.SENTIMENT_API_URL; // Optional external API URL

// 2. Use a local basic sentiment analysis (OPTION B)
// These are simple word lists for demonstration purposes
// In a production app, you would use a more sophisticated NLP library or API
const POSITIVE_WORDS = [
  'success', 'profit', 'growth', 'surge', 'rise', 'gain', 'positive', 'up',
  'soar', 'jump', 'exceed', 'beat', 'better', 'strong', 'bullish', 'advance',
  'recovery', 'improve', 'launch', 'innovative', 'breakthrough', 'promising',
  'opportunity', 'partnership', 'acquisition', 'dividend', 'bonus', 'robust',
  'upgrade', 'outperform', 'buy', 'recommend', 'target', 'higher', 'record',
  'milestone', 'leadership', 'patent', 'award', 'expansion', 'diversify',
  'deal', 'nears', 'take', 'over', 'partnership', 'agreement', 'acquire', 'merge'
];

const NEGATIVE_WORDS = [
  'loss', 'deficit', 'decline', 'drop', 'fall', 'plunge', 'negative', 'down',
  'tumble', 'crash', 'miss', 'weak', 'bearish', 'retreat', 'recession', 'struggle',
  'concern', 'risk', 'warning', 'investigation', 'lawsuit', 'litigation', 'fine',
  'penalty', 'debt', 'bankruptcy', 'layoff', 'cut', 'downgrade', 'underperform',
  'sell', 'avoid', 'lower', 'worst', 'failure', 'resign', 'scandal', 'recall',
  'delay', 'dispute', 'crisis', 'problem', 'challenge', 'volatility', 'uncertain',
  'falls', 'withholds', 'concerns', 'drop', 'decline', 'worry'
];

/**
 * Sentiment Analysis Service
 */
export class SentimentService {
  /**
   * Analyze sentiment of headlines
   */
  static async analyzeHeadlines(headlines: NewsHeadline[]): Promise<{
    overallSentiment: number;
    headlineResults: Array<{ headline: string; score: number }>;
  }> {
    try {
      if (headlines.length === 0) {
        return { overallSentiment: 0, headlineResults: [] };
      }
      
      // If external API is configured, use it
      if (SENTIMENT_API_KEY && SENTIMENT_API_URL) {
        return await this.analyzeWithExternalApi(headlines);
      } 
      
      // Otherwise, use basic local sentiment analysis
      return this.analyzeWithBasicMethod(headlines);
    } catch (error) {
      logger.error('Error analyzing headlines sentiment:', error);
      throw error;
    }
  }
  
  /**
   * Analyze using external sentiment API
   */
  private static async analyzeWithExternalApi(headlines: NewsHeadline[]): Promise<{
    overallSentiment: number;
    headlineResults: Array<{ headline: string; score: number }>;
  }> {
    try {
      const texts = headlines.map(h => h.headline);
      
      const response = await axios.post(SENTIMENT_API_URL!, {
        texts,
        apiKey: SENTIMENT_API_KEY
      });
      
      const results = response.data;
      
      if (!results || !Array.isArray(results.scores)) {
        throw new Error('Invalid response from sentiment API');
      }
      
      const headlineResults = headlines.map((headline, index) => ({
        headline: headline.headline,
        score: results.scores[index]
      }));
      
      const overallSentiment = headlineResults.reduce((sum, item) => sum + item.score, 0) / headlineResults.length;
      
      return {
        overallSentiment,
        headlineResults
      };
    } catch (error) {
      logger.error('Error with external sentiment API:', error);
      // Fall back to basic method if API fails
      return this.analyzeWithBasicMethod(headlines);
    }
  }
  
  /**
   * Analyze with basic word-matching sentiment analysis
   */
  private static analyzeWithBasicMethod(headlines: NewsHeadline[]): {
    overallSentiment: number;
    headlineResults: Array<{ headline: string; score: number }>;
  } {
    const headlineResults = headlines.map(headlineObj => {
      const headline = headlineObj.headline.toLowerCase();
      
      // Count positive and negative words
      let positiveCount = 0;
      let negativeCount = 0;
      
      for (const word of POSITIVE_WORDS) {
        if (headline.includes(word.toLowerCase())) {
          positiveCount++;
        }
      }
      
      for (const word of NEGATIVE_WORDS) {
        if (headline.includes(word.toLowerCase())) {
          negativeCount++;
        }
      }
      
      // Calculate sentiment score (-1 to 1)
      let score = 0;
      
      if (positiveCount + negativeCount > 0) {
        score = (positiveCount - negativeCount) / (positiveCount + negativeCount);
      }
      
      return {
        headline: headlineObj.headline,
        score
      };
    });
    
    // Calculate overall sentiment
    const overallSentiment = headlineResults.reduce((sum, item) => sum + item.score, 0) / headlineResults.length;
    
    return {
      overallSentiment,
      headlineResults
    };
  }
  
  /**
   * Calculate daily sentiment score for a stock
   */
  static async calculateDailySentiment(
    ticker: string,
    headlines: NewsHeadline[]
  ): Promise<SentimentScore> {
    try {
      const { overallSentiment, headlineResults } = await this.analyzeHeadlines(headlines);
      
      // Count positive, negative, and neutral headlines
      let positiveCount = 0;
      let negativeCount = 0;
      let neutralCount = 0;
      
      for (const result of headlineResults) {
        if (result.score > 0.2) {
          positiveCount++;
        } else if (result.score < -0.2) {
          negativeCount++;
        } else {
          neutralCount++;
        }
      }
      
      // Calculate sentiment magnitude (strength of sentiment)
      const sentimentMagnitude = headlineResults.reduce((sum, item) => sum + Math.abs(item.score), 0) / headlineResults.length;
      
      // Get today's date without time
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Create sentiment score object
      const sentimentScore: SentimentScore = {
        ticker,
        date: today,
        sentiment_score: parseFloat(overallSentiment.toFixed(2)),
        sentiment_magnitude: parseFloat(sentimentMagnitude.toFixed(2)),
        news_count: headlines.length,
        positive_count: positiveCount,
        negative_count: negativeCount,
        neutral_count: neutralCount,
        buzz_score: headlines.length > 5 ? parseFloat((headlines.length / 5).toFixed(2)) : 1.0,
      };
      
      return sentimentScore;
    } catch (error) {
      logger.error(`Error calculating daily sentiment for ${ticker}:`, error);
      throw error;
    }
  }
  
  /**
   * Extract top sentiment terms from headlines
   */
  static extractSentimentTerms(headlines: NewsHeadline[]): {
    positive: string[];
    negative: string[];
  } {
    const positiveTerms: Record<string, number> = {};
    const negativeTerms: Record<string, number> = {};
    
    for (const headline of headlines) {
      const text = headline.headline.toLowerCase();
      
      // Count positive terms
      for (const term of POSITIVE_WORDS) {
        if (text.includes(term.toLowerCase())) {
          positiveTerms[term] = (positiveTerms[term] || 0) + 1;
        }
      }
      
      // Count negative terms
      for (const term of NEGATIVE_WORDS) {
        if (text.includes(term.toLowerCase())) {
          negativeTerms[term] = (negativeTerms[term] || 0) + 1;
        }
      }
    }
    
    // Sort terms by frequency
    const sortedPositive = Object.entries(positiveTerms)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
      .slice(0, 10);
    
    const sortedNegative = Object.entries(negativeTerms)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
      .slice(0, 10);
    
    return {
      positive: sortedPositive,
      negative: sortedNegative
    };
  }
  
  /**
   * Analyze sentiment impact on stock price
   */
  static analyzeSentimentImpact(
    sentimentScores: SentimentScore[],
    priceMoves: { date: Date; priceChange: number }[]
  ): number {
    // Match sentiment scores with next-day price moves
    const matchedData: Array<{ sentiment: number; priceChange: number }> = [];
    
    for (const sentiment of sentimentScores) {
      // Find price change for the next trading day
      const sentimentDate = new Date(sentiment.date);
      const nextDay = new Date(sentimentDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      // Find closest price move after sentiment date
      const priceMove = priceMoves.find(move => {
        const moveDate = new Date(move.date);
        return moveDate >= nextDay;
      });
      
      if (priceMove) {
        matchedData.push({
          sentiment: sentiment.sentiment_score,
          priceChange: priceMove.priceChange
        });
      }
    }
    
    // Calculate correlation between sentiment and price change
    if (matchedData.length < 2) {
      return 0; // Not enough data for correlation
    }
    
    // Calculate means
    const sentimentMean = matchedData.reduce((sum, item) => sum + item.sentiment, 0) / matchedData.length;
    const priceMean = matchedData.reduce((sum, item) => sum + item.priceChange, 0) / matchedData.length;
    
    // Calculate correlation numerator and denominators
    let numerator = 0;
    let sentimentDenominator = 0;
    let priceDenominator = 0;
    
    for (const item of matchedData) {
      const sentimentDiff = item.sentiment - sentimentMean;
      const priceDiff = item.priceChange - priceMean;
      
      numerator += sentimentDiff * priceDiff;
      sentimentDenominator += sentimentDiff * sentimentDiff;
      priceDenominator += priceDiff * priceDiff;
    }
    
    // Calculate correlation coefficient
    const denominator = Math.sqrt(sentimentDenominator * priceDenominator);
    
    if (denominator === 0) {
      return 0;
    }
    
    return numerator / denominator;
  }
}