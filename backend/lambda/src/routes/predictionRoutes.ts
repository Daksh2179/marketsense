import express from 'express';
import { predictionController } from '../controllers/predictionController';

const router = express.Router();

/**
 * @route   GET /predictions/compare
 * @desc    Compare predictions across stocks
 */
router.get('/compare', predictionController.comparePredictions);

/**
 * @route   GET /predictions/:ticker
 * @desc    Get latest predictions for a stock
 */
router.get('/:ticker', predictionController.getLatestPredictions);

/**
 * @route   GET /predictions/:ticker/type
 * @desc    Get predictions by type
 */
router.get('/:ticker/type', predictionController.getPredictionsByType);

/**
 * @route   GET /predictions/:ticker/history
 * @desc    Get historical predictions
 */
router.get('/:ticker/history', predictionController.getHistoricalPredictions);

/**
 * @route   GET /predictions/:ticker/accuracy
 * @desc    Get prediction accuracy statistics
 */
router.get('/:ticker/accuracy', predictionController.getAccuracyStats);

/**
 * @route   GET /predictions/:ticker/confidence
 * @desc    Get prediction confidence visualization
 */
router.get('/:ticker/confidence', predictionController.getPredictionConfidenceData);

/**
 * @route   GET /predictions/:ticker/combined
 * @desc    Get combined predictions visualization
 */
router.get('/:ticker/combined', predictionController.getCombinedPredictionsVisualization);

export default router;