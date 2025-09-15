import db from '../config/database';
import { logger } from '../utils/logger';

export interface Prediction {
  id?: number;
  ticker: string;
  date: Date;
  target_date: Date;
  predicted_price?: number;
  predicted_direction: 'UP' | 'DOWN' | 'NEUTRAL';
  confidence_score: number;
  prediction_type: 'TECHNICAL' | 'SENTIMENT' | 'COMBINED';
  actual_price?: number;
  accuracy_score?: number;
  created_at?: Date;
  updated_at?: Date;
}

export class PredictionModel {
  /**
   * Get latest predictions for a stock
   */
  static async getLatestPredictions(ticker: string): Promise<Prediction[]> {
    try {
      const result = await db.query(
        `SELECT * FROM predictions 
         WHERE ticker = $1 
         ORDER BY date DESC, prediction_type 
         LIMIT 3`,
        [ticker.toUpperCase()]
      );
      
      return result.rows;
    } catch (error) {
      logger.error(`Error getting latest predictions for ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Get prediction by ID
   */
  static async getById(id: number): Promise<Prediction | null> {
    try {
      const result = await db.query(
        'SELECT * FROM predictions WHERE id = $1',
        [id]
      );
      
      return result.rows.length ? result.rows[0] : null;
    } catch (error) {
      logger.error(`Error getting prediction by ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get predictions by type
   */
  static async getByType(
    ticker: string, 
    type: 'TECHNICAL' | 'SENTIMENT' | 'COMBINED'
  ): Promise<Prediction[]> {
    try {
      const result = await db.query(
        `SELECT * FROM predictions 
         WHERE ticker = $1 AND prediction_type = $2 
         ORDER BY date DESC`,
        [ticker.toUpperCase(), type]
      );
      
      return result.rows;
    } catch (error) {
      logger.error(`Error getting ${type} predictions for ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Get historical predictions for a stock
   */
  static async getHistoricalPredictions(
    ticker: string, 
    limit: number = 30
  ): Promise<Prediction[]> {
    try {
      const result = await db.query(
        `SELECT * FROM predictions 
         WHERE ticker = $1 
         ORDER BY date DESC 
         LIMIT $2`,
        [ticker.toUpperCase(), limit]
      );
      
      return result.rows;
    } catch (error) {
      logger.error(`Error getting historical predictions for ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Create a new prediction
   */
  static async create(prediction: Prediction): Promise<Prediction> {
    try {
      // Ensure ticker is uppercase
      prediction.ticker = prediction.ticker.toUpperCase();
      
      const result = await db.query(
        `INSERT INTO predictions 
         (ticker, date, target_date, predicted_price, predicted_direction, 
          confidence_score, prediction_type, actual_price, accuracy_score)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          prediction.ticker,
          prediction.date,
          prediction.target_date,
          prediction.predicted_price || null,
          prediction.predicted_direction,
          prediction.confidence_score,
          prediction.prediction_type,
          prediction.actual_price || null,
          prediction.accuracy_score || null
        ]
      );
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating prediction:', error);
      throw error;
    }
  }

  /**
   * Update prediction with actual price and accuracy
   */
  static async updateWithActual(
    id: number, 
    actualPrice: number
  ): Promise<Prediction | null> {
    try {
      // First get the prediction to calculate accuracy
      const predictionResult = await db.query(
        'SELECT * FROM predictions WHERE id = $1',
        [id]
      );
      
      if (predictionResult.rows.length === 0) {
        return null;
      }
      
      const prediction = predictionResult.rows[0];
      
      // Calculate accuracy score based on predicted direction
      let accuracyScore = 0;
      
      if (prediction.predicted_price) {
        // Calculate accuracy based on price difference
        const priceDifference = Math.abs(prediction.predicted_price - actualPrice);
        const percentageDifference = (priceDifference / actualPrice) * 100;
        
        // Convert to accuracy score (100% - percentage difference, with floor of 0)
        accuracyScore = Math.max(0, 100 - percentageDifference);
      } else {
        // Calculate accuracy based on direction
        const actualDirection = actualPrice > prediction.close ? 'UP' : 
                               actualPrice < prediction.close ? 'DOWN' : 'NEUTRAL';
        
        // 100% if correct, 0% if wrong
        accuracyScore = actualDirection === prediction.predicted_direction ? 100 : 0;
      }
      
      // Update the prediction with actual price and accuracy
      const updateResult = await db.query(
        `UPDATE predictions 
         SET actual_price = $1, 
             accuracy_score = $2, 
             updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [actualPrice, accuracyScore, id]
      );
      
      return updateResult.rows[0];
    } catch (error) {
      logger.error(`Error updating prediction ${id} with actual price:`, error);
      throw error;
    }
  }

  /**
   * Get prediction accuracy statistics
   */
  static async getAccuracyStats(
    ticker: string,
    predictionType?: 'TECHNICAL' | 'SENTIMENT' | 'COMBINED'
  ): Promise<{
    totalPredictions: number;
    averageAccuracy: number;
    correctDirections: number;
    incorrectDirections: number;
  }> {
    try {
      let query = `
        SELECT 
          COUNT(*) as total_predictions,
          AVG(accuracy_score) as average_accuracy,
          COUNT(CASE WHEN 
            (predicted_direction = 'UP' AND actual_price > predicted_price) OR
            (predicted_direction = 'DOWN' AND actual_price < predicted_price) OR
            (predicted_direction = 'NEUTRAL' AND ABS(actual_price - predicted_price) / predicted_price < 0.01)
          THEN 1 END) as correct_directions,
          COUNT(CASE WHEN 
            (predicted_direction = 'UP' AND actual_price <= predicted_price) OR
            (predicted_direction = 'DOWN' AND actual_price >= predicted_price) OR
            (predicted_direction = 'NEUTRAL' AND ABS(actual_price - predicted_price) / predicted_price >= 0.01)
          THEN 1 END) as incorrect_directions
        FROM predictions
        WHERE 
          ticker = $1 
          AND actual_price IS NOT NULL
      `;
      
      const queryParams: any[] = [ticker.toUpperCase()];
      
      if (predictionType) {
        query += ` AND prediction_type = $2`;
        queryParams.push(predictionType);
      }
      
      const result = await db.query(query, queryParams);
      
      const stats = result.rows[0];
      
      return {
        totalPredictions: parseInt(stats.total_predictions) || 0,
        averageAccuracy: parseFloat(stats.average_accuracy) || 0,
        correctDirections: parseInt(stats.correct_directions) || 0,
        incorrectDirections: parseInt(stats.incorrect_directions) || 0
      };
    } catch (error) {
      logger.error(`Error getting accuracy stats for ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Get prediction confidence visualization data
   */
  static async getPredictionConfidenceData(
    ticker: string,
    limit: number = 20
  ): Promise<{
    dates: string[];
    confidence: number[];
    accuracy: number[];
    type: string[];
  }> {
    try {
      const result = await db.query(
        `SELECT 
          date, 
          confidence_score, 
          accuracy_score, 
          prediction_type 
         FROM predictions 
         WHERE 
          ticker = $1 
          AND accuracy_score IS NOT NULL
         ORDER BY date DESC 
         LIMIT $2`,
        [ticker.toUpperCase(), limit]
      );
      
      // Format data for visualization
      const dates = result.rows.map(row => {
        const date = new Date(row.date);
        return date.toISOString().split('T')[0];
      });
      
      const confidence = result.rows.map(row => parseFloat(row.confidence_score));
      const accuracy = result.rows.map(row => parseFloat(row.accuracy_score || 0));
      const type = result.rows.map(row => row.prediction_type);
      
      return { dates, confidence, accuracy, type };
    } catch (error) {
      logger.error(`Error getting prediction confidence data for ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Get combined predictions visualization
   */
  static async getCombinedPredictionsVisualization(
    ticker: string
  ): Promise<any> {
    try {
      // Get the latest predictions of each type
      const result = await db.query(
        `SELECT DISTINCT ON (prediction_type) 
          * 
         FROM predictions 
         WHERE ticker = $1 
         ORDER BY prediction_type, date DESC`,
        [ticker.toUpperCase()]
      );
      
      const technicalPrediction = result.rows.find(row => row.prediction_type === 'TECHNICAL');
      const sentimentPrediction = result.rows.find(row => row.prediction_type === 'SENTIMENT');
      const combinedPrediction = result.rows.find(row => row.prediction_type === 'COMBINED');
      
      // Get current price
      const priceResult = await db.query(
        `SELECT close 
         FROM stock_prices 
         WHERE ticker = $1 
         ORDER BY date DESC 
         LIMIT 1`,
        [ticker.toUpperCase()]
      );
      
      const currentPrice = priceResult.rows.length ? parseFloat(priceResult.rows[0].close) : null;
      
      return {
        currentPrice,
        technical: technicalPrediction ? {
          predictedPrice: parseFloat(technicalPrediction.predicted_price || 0),
          predictedDirection: technicalPrediction.predicted_direction,
          confidenceScore: parseFloat(technicalPrediction.confidence_score),
          targetDate: new Date(technicalPrediction.target_date).toISOString().split('T')[0]
        } : null,
        sentiment: sentimentPrediction ? {
          predictedPrice: parseFloat(sentimentPrediction.predicted_price || 0),
          predictedDirection: sentimentPrediction.predicted_direction,
          confidenceScore: parseFloat(sentimentPrediction.confidence_score),
          targetDate: new Date(sentimentPrediction.target_date).toISOString().split('T')[0]
        } : null,
        combined: combinedPrediction ? {
          predictedPrice: parseFloat(combinedPrediction.predicted_price || 0),
          predictedDirection: combinedPrediction.predicted_direction,
          confidenceScore: parseFloat(combinedPrediction.confidence_score),
          targetDate: new Date(combinedPrediction.target_date).toISOString().split('T')[0]
        } : null
      };
    } catch (error) {
      logger.error(`Error getting combined predictions visualization for ${ticker}:`, error);
      throw error;
    }
  }
}