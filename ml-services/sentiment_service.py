import json
import numpy as np
import pandas as pd
import logging
from datetime import datetime, timedelta
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
from sklearn.preprocessing import MinMaxScaler

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Lambda handler function for AWS Lambda deployment
def handler(event, context):
    try:
        # Parse input from API Gateway
        body = json.loads(event.get('body', '{}')) if event.get('body') else {}
        
        # Check which endpoint is being called based on path parameter
        path = event.get('pathParameters', {}).get('proxy', '') or event.get('path', '').split('/')[-1]
        
        # Handle different endpoints
        if path == 'analyze-sentiment' or 'headlines' in body:
            # Sentiment analysis endpoint
            headlines = body.get('headlines', [])
            
            if not headlines or not isinstance(headlines, list):
                return {
                    'statusCode': 400,
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'application/json'
                    },
                    'body': json.dumps({
                        'error': 'Valid headlines array required',
                        'success': False
                    })
                }
            
            # Generate simple demo sentiment analysis (since we can't load the full FinBERT model in Lambda)
            results = []
            total_score = 0
            
            for headline in headlines[:20]:
                if not headline or not isinstance(headline, str):
                    continue
                    
                # Simple sentiment scoring based on keyword presence
                score = 0
                if any(word in headline.lower() for word in ['growth', 'profit', 'rise', 'gain', 'positive', 'up']):
                    score = 0.5
                elif any(word in headline.lower() for word in ['drop', 'fall', 'loss', 'negative', 'down', 'concern']):
                    score = -0.5
                
                label = 'positive' if score > 0 else 'negative' if score < 0 else 'neutral'
                confidence = abs(score) + 0.3
                
                results.append({
                    'headline': headline,
                    'sentiment_score': score,
                    'label': label,
                    'confidence': confidence
                })
                
                total_score += score
            
            overall_sentiment = total_score / len(results) if results else 0.0
            
            # Categorize headlines
            positive_headlines = [r for r in results if r['sentiment_score'] > 0]
            negative_headlines = [r for r in results if r['sentiment_score'] < 0]
            neutral_headlines = [r for r in results if r['sentiment_score'] == 0]
            
            response = {
                'overall_sentiment': round(overall_sentiment, 3),
                'headline_results': results,
                'positive_count': len(positive_headlines),
                'negative_count': len(negative_headlines),
                'neutral_count': len(neutral_headlines),
                'timestamp': datetime.now().isoformat(),
                'success': True
            }
            
        elif path == 'analyze-single' or 'text' in body:
            # Single headline analysis
            text = body.get('text', '')
            
            if not text or not isinstance(text, str):
                return {
                    'statusCode': 400,
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'application/json'
                    },
                    'body': json.dumps({
                        'error': 'Valid text string required',
                        'success': False
                    })
                }
            
            # Simple sentiment analysis
            score = 0
            if any(word in text.lower() for word in ['growth', 'profit', 'rise', 'gain', 'positive', 'up']):
                score = 0.5
            elif any(word in text.lower() for word in ['drop', 'fall', 'loss', 'negative', 'down', 'concern']):
                score = -0.5
            
            label = 'positive' if score > 0 else 'negative' if score < 0 else 'neutral'
            confidence = abs(score) + 0.3
            
            response = {
                'text': text,
                'sentiment_score': score,
                'label': label,
                'confidence': confidence,
                'timestamp': datetime.now().isoformat(),
                'success': True
            }
            
        else:
            # Default to health check
            response = {
                'status': 'healthy',
                'sentiment_service': 'online',
                'timestamp': datetime.now().isoformat(),
                'success': True
            }
        
        # Return successful response
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps(response)
        }
        
    except Exception as e:
        # Return error response
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'error': str(e),
                'success': False
            })
        }

class SentimentEnhancedLSTM(nn.Module):
    """
    Enhanced LSTM that incorporates news sentiment and market features
    """
    def __init__(self, price_input_size=1, sentiment_input_size=3, hidden_size=64, num_layers=3, output_size=1, dropout=0.3):
        super(SentimentEnhancedLSTM, self).__init__()
        
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        
        # Separate LSTM for price data
        self.price_lstm = nn.LSTM(
            input_size=price_input_size,
            hidden_size=hidden_size // 2,
            num_layers=2,
            dropout=dropout,
            batch_first=True
        )
        
        # Separate LSTM for sentiment data
        self.sentiment_lstm = nn.LSTM(
            input_size=sentiment_input_size,  # sentiment_score, news_count, buzz_score
            hidden_size=hidden_size // 2,
            num_layers=2,
            dropout=dropout,
            batch_first=True
        )
        
        # Attention mechanism for feature fusion
        self.attention = nn.MultiheadAttention(
            embed_dim=hidden_size,
            num_heads=8,
            dropout=dropout,
            batch_first=True
        )
        
        # Feature fusion layers
        self.fusion_layer = nn.Sequential(
            nn.Linear(hidden_size, hidden_size),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_size, hidden_size // 2),
            nn.ReLU(),
            nn.Dropout(dropout)
        )
        
        # Final prediction layers
        self.predictor = nn.Sequential(
            nn.Linear(hidden_size // 2, hidden_size // 4),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_size // 4, output_size)
        )
        
    def forward(self, price_data, sentiment_data):
        batch_size = price_data.size(0)
        
        # Process price data
        price_h0 = torch.zeros(2, batch_size, self.hidden_size // 2)
        price_c0 = torch.zeros(2, batch_size, self.hidden_size // 2)
        price_out, _ = self.price_lstm(price_data, (price_h0, price_c0))
        
        # Process sentiment data
        sent_h0 = torch.zeros(2, batch_size, self.hidden_size // 2)
        sent_c0 = torch.zeros(2, batch_size, self.hidden_size // 2)
        sentiment_out, _ = self.sentiment_lstm(sentiment_data, (sent_h0, sent_c0))
        
        # Combine features
        combined_features = torch.cat([price_out[:, -1, :], sentiment_out[:, -1, :]], dim=1)
        combined_features = combined_features.unsqueeze(1)  # Add sequence dimension for attention
        
        # Apply attention mechanism
        attended_features, _ = self.attention(combined_features, combined_features, combined_features)
        attended_features = attended_features.squeeze(1)
        
        # Feature fusion
        fused_features = self.fusion_layer(attended_features)
        
        # Final prediction
        prediction = self.predictor(fused_features)
        
        return prediction

class AdvancedStockPredictor:
    """
    Advanced Stock Prediction with Sentiment Integration
    """
    
    def __init__(self, sequence_length=30, prediction_days=7):
        self.sequence_length = sequence_length
        self.prediction_days = prediction_days
        self.price_scaler = MinMaxScaler(feature_range=(0, 1))
        self.sentiment_scaler = MinMaxScaler(feature_range=(0, 1))
        self.model = None
        self.is_trained = False
        
    def prepare_enhanced_data(self, price_data, sentiment_data):
        """
        Prepare multi-modal data for enhanced LSTM
        """
        try:
            # Convert price data to DataFrame
            if isinstance(price_data[0], dict):
                prices = [float(item.get('close', item.get('price', 0))) for item in price_data]
            else:
                prices = [float(p) for p in price_data]
            
            # Handle sentiment data
            if sentiment_data and len(sentiment_data) > 0:
                # Pad sentiment data to match price data length if needed
                if len(sentiment_data) < len(prices):
                    # Fill missing sentiment with neutral values
                    missing_count = len(prices) - len(sentiment_data)
                    for _ in range(missing_count):
                        sentiment_data.append({
                            'sentiment_score': 0.0,
                            'news_count': 1,
                            'buzz_score': 1.0
                        })
                
                sentiment_features = []
                for i in range(len(prices)):
                    if i < len(sentiment_data):
                        item = sentiment_data[i]
                        sentiment_features.append([
                            float(item.get('sentiment_score', 0)),
                            int(item.get('news_count', 1)),
                            float(item.get('buzz_score', 1))
                        ])
                    else:
                        sentiment_features.append([0.0, 1, 1.0])
            else:
                # No sentiment data - use neutral values
                sentiment_features = [[0.0, 1, 1.0] for _ in range(len(prices))]
            
            # Scale features
            prices_array = np.array(prices).reshape(-1, 1)
            scaled_prices = self.price_scaler.fit_transform(prices_array)
            
            sentiment_array = np.array(sentiment_features)
            scaled_sentiment = self.sentiment_scaler.fit_transform(sentiment_array)
            
            # Create sequences
            X_price, X_sentiment, y = [], [], []
            
            for i in range(self.sequence_length, len(scaled_prices)):
                # Price sequence
                X_price.append(scaled_prices[i-self.sequence_length:i, 0])
                # Sentiment sequence
                X_sentiment.append(scaled_sentiment[i-self.sequence_length:i])
                # Target (next day price)
                y.append(scaled_prices[i, 0])
            
            return np.array(X_price), np.array(X_sentiment), np.array(y)
            
        except Exception as e:
            logger.error(f"Error preparing enhanced data: {str(e)}")
            raise
    
    def train_enhanced_model(self, price_data, sentiment_data, epochs=80, batch_size=16):
        """
        Train sentiment-enhanced LSTM model
        """
        try:
            logger.info("Training Sentiment-Enhanced LSTM model...")
            
            # Prepare multi-modal data
            X_price, X_sentiment, y = self.prepare_enhanced_data(price_data, sentiment_data)
            
            if len(X_price) < 10:
                raise ValueError("Insufficient data for training")
            
            # Convert to PyTorch tensors
            X_price_tensor = torch.FloatTensor(X_price).unsqueeze(-1)
            X_sentiment_tensor = torch.FloatTensor(X_sentiment)
            y_tensor = torch.FloatTensor(y)
            
            # Create data loader
            dataset = TensorDataset(X_price_tensor, X_sentiment_tensor, y_tensor)
            dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)
            
            # Initialize enhanced model
            self.model = SentimentEnhancedLSTM(
                price_input_size=1,
                sentiment_input_size=3,  # sentiment, news_count, buzz_score
                hidden_size=64,
                num_layers=3,
                output_size=1,
                dropout=0.3
            )
            
            # Define loss and optimizer with learning rate scheduling
            criterion = nn.MSELoss()
            optimizer = torch.optim.AdamW(self.model.parameters(), lr=0.001, weight_decay=0.01)
            scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', patience=10)
            
            # Training loop with early stopping
            best_loss = float('inf')
            patience_counter = 0
            
            self.model.train()
            for epoch in range(epochs):
                total_loss = 0
                for batch_price, batch_sentiment, batch_y in dataloader:
                    optimizer.zero_grad()
                    
                    # Forward pass
                    predictions = self.model(batch_price, batch_sentiment).squeeze()
                    loss = criterion(predictions, batch_y)
                    
                    # Backward pass
                    loss.backward()
                    
                    # Gradient clipping for stability
                    torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)
                    
                    optimizer.step()
                    total_loss += loss.item()
                
                avg_loss = total_loss / len(dataloader)
                scheduler.step(avg_loss)
                
                # Early stopping
                if avg_loss < best_loss:
                    best_loss = avg_loss
                    patience_counter = 0
                else:
                    patience_counter += 1
                
                if epoch % 20 == 0:
                    logger.info(f"Epoch {epoch}/{epochs}, Loss: {avg_loss:.6f}")
                
                # Early stopping
                if patience_counter >= 20:
                    logger.info(f"Early stopping at epoch {epoch}")
                    break
            
            self.is_trained = True
            logger.info("✅ Sentiment-Enhanced LSTM training completed!")
            
            return True
            
        except Exception as e:
            logger.error(f"Error training enhanced model: {str(e)}")
            return False
    
    def predict_with_sentiment(self, recent_price_data, recent_sentiment_data, days_ahead=7):
        """
        Generate predictions using both price and sentiment data
        """
        try:
            if not self.is_trained or self.model is None:
                raise ValueError("Model not trained")
            
            # Prepare recent price data
            if isinstance(recent_price_data[0], dict):
                recent_prices = [float(item.get('close', item.get('price', 0))) for item in recent_price_data]
            else:
                recent_prices = [float(p) for p in recent_price_data]
            
            recent_prices_array = np.array(recent_prices).reshape(-1, 1)
            scaled_recent_prices = self.price_scaler.transform(recent_prices_array)
            
            # Prepare sentiment features
            if recent_sentiment_data and len(recent_sentiment_data) >= self.sequence_length:
                sentiment_features = []
                for item in recent_sentiment_data[-self.sequence_length:]:
                    sentiment_features.append([
                        float(item.get('sentiment_score', 0)),
                        int(item.get('news_count', 1)),
                        float(item.get('buzz_score', 1))
                    ])
                scaled_sentiment = self.sentiment_scaler.transform(np.array(sentiment_features))
            else:
                # Default neutral sentiment if no data
                scaled_sentiment = np.zeros((self.sequence_length, 3))
            
            # Get sequences
            price_sequence = scaled_recent_prices[-self.sequence_length:].reshape(1, self.sequence_length, 1)
            sentiment_sequence = scaled_sentiment.reshape(1, self.sequence_length, 3)
            
            self.model.eval()
            predictions = []
            
            current_price_seq = torch.FloatTensor(price_sequence)
            current_sentiment_seq = torch.FloatTensor(sentiment_sequence)
            
            # Generate predictions
            for day in range(days_ahead):
                with torch.no_grad():
                    # Predict next price
                    next_price_scaled = self.model(current_price_seq, current_sentiment_seq).item()
                    predictions.append(next_price_scaled)
                    
                    # Update price sequence
                    new_price_seq = torch.cat([
                        current_price_seq[:, 1:, :],
                        torch.FloatTensor([[[next_price_scaled]]])
                    ], dim=1)
                    
                    # Update sentiment sequence (sentiment impact decays over time)
                    decay_factor = 0.9 ** (day + 1)
                    new_sentiment_seq = current_sentiment_seq.clone()
                    new_sentiment_seq[:, -1, 0] *= decay_factor  # Decay sentiment score
                    new_sentiment_seq = torch.cat([
                        new_sentiment_seq[:, 1:, :],
                        torch.FloatTensor([[[0, 1, 1]]])  # Add neutral sentiment for future day
                    ], dim=1)
                    
                    current_price_seq = new_price_seq
                    current_sentiment_seq = new_sentiment_seq
            
            # Inverse transform predictions
            predictions_array = np.array(predictions).reshape(-1, 1)
            actual_predictions = self.price_scaler.inverse_transform(predictions_array).flatten()
            
            # Enhanced confidence calculation
            base_price = recent_prices[-1]
            price_volatility = np.std(recent_prices[-30:]) if len(recent_prices) >= 30 else np.std(recent_prices)
            
            # Sentiment confidence factor
            if recent_sentiment_data and len(recent_sentiment_data) > 0:
                recent_sentiment_strength = abs(np.mean([item.get('sentiment_score', 0) for item in recent_sentiment_data[-7:]]))
                sentiment_confidence_boost = min(0.2, recent_sentiment_strength * 0.3)
            else:
                sentiment_confidence_boost = 0
            
            # Generate results with enhanced confidence
            results = []
            for i in range(days_ahead):
                time_decay = 0.95 ** i
                
                base_confidence = self.calculate_enhanced_confidence(
                    recent_price_data, 
                    recent_sentiment_data, 
                    price_volatility
                ) * time_decay + sentiment_confidence_boost
                
                confidence_bounds_factor = (1 - base_confidence/100) * 2 + 1
                
                results.append({
                    'date': (datetime.now().date() + timedelta(days=i+1)).isoformat(),
                    'predicted_price': round(float(actual_predictions[i]), 2),
                    'upper_bound': round(float(actual_predictions[i] * confidence_bounds_factor), 2),
                    'lower_bound': round(float(actual_predictions[i] / confidence_bounds_factor), 2),
                    'confidence': round(base_confidence, 1),
                    'sentiment_factor': round(sentiment_confidence_boost * 100, 1)
                })
            
            return results
            
        except Exception as e:
            logger.error(f"Error making enhanced predictions: {str(e)}")
            raise
    
    def calculate_enhanced_confidence(self, price_data, sentiment_data, volatility):
        """
        Calculate prediction confidence incorporating sentiment data quality
        """
        try:
            # Extract prices
            if isinstance(price_data[0], dict):
                prices = [float(item.get('close', item.get('price', 0))) for item in price_data]
            else:
                prices = [float(p) for p in price_data]
            
            # Base confidence on price data quality
            price_data_quality = min(1.0, len(prices) / 100)
            
            # Volatility factor
            avg_price = np.mean(prices[-30:])
            volatility_factor = max(0.2, 1.0 - (volatility / avg_price * 3))
            
            # Sentiment data quality factor
            if sentiment_data and len(sentiment_data) > 0:
                sentiment_coverage = min(1.0, len(sentiment_data) / len(prices))
                avg_news_count = np.mean([item.get('news_count', 0) for item in sentiment_data[-7:]])
                news_volume_factor = min(1.0, avg_news_count / 10)
                sentiment_quality = (sentiment_coverage * 0.7 + news_volume_factor * 0.3)
            else:
                sentiment_quality = 0.3
            
            # Combine all factors
            confidence = (
                price_data_quality * 0.4 +
                volatility_factor * 0.3 + 
                sentiment_quality * 0.3
            ) * 100
            
            return min(92, max(35, confidence))
            
        except Exception as e:
            logger.error(f"Error calculating enhanced confidence: {str(e)}")
            return 60.0

def analyze_financial_sentiment(text):
    """
    Simple sentiment analysis function (replaces FinBERT for Lambda compatibility)
    """
    try:
        # Simple sentiment scoring based on keyword presence
        score = 0
        if any(word in text.lower() for word in ['growth', 'profit', 'rise', 'gain', 'positive', 'up']):
            score = 0.5
        elif any(word in text.lower() for word in ['drop', 'fall', 'loss', 'negative', 'down', 'concern']):
            score = -0.5
        
        label = 'positive' if score > 0 else 'negative' if score < 0 else 'neutral'
        confidence = abs(score) + 0.3
        
        return {
            'score': round(score, 3),
            'label': label,
            'confidence': round(confidence, 3)
        }
        
    except Exception as e:
        logger.error(f"Error analyzing sentiment: {str(e)}")
        return {
            'score': 0.0,
            'label': 'neutral',
            'confidence': 0.0,
            'error': str(e)
        }

def analyze_technical_indicators(prices):
    """
    Calculate technical indicators for enhanced predictions
    """
    try:
        prices_series = pd.Series(prices)
        
        # Simple Moving Averages
        sma_20 = prices_series.rolling(window=20).mean().iloc[-1] if len(prices) >= 20 else prices_series.mean()
        sma_50 = prices_series.rolling(window=50).mean().iloc[-1] if len(prices) >= 50 else prices_series.mean()
        
        # RSI calculation
        def calculate_rsi(prices, window=14):
            deltas = np.diff(prices)
            gains = np.where(deltas > 0, deltas, 0)
            losses = np.where(deltas < 0, -deltas, 0)
            
            if len(gains) >= window:
                avg_gain = np.mean(gains[-window:])
                avg_loss = np.mean(losses[-window:])
                
                if avg_loss == 0:
                    return 100
                
                rs = avg_gain / avg_loss
                rsi = 100 - (100 / (1 + rs))
                return rsi
            return 50
        
        rsi = calculate_rsi(prices)
        
        # Bollinger Bands
        sma_20_full = prices_series.rolling(window=20).mean()
        std_20 = prices_series.rolling(window=20).std()
        
        upper_band = sma_20_full.iloc[-1] + (2 * std_20.iloc[-1]) if len(prices) >= 20 else prices[-1] * 1.02
        lower_band = sma_20_full.iloc[-1] - (2 * std_20.iloc[-1]) if len(prices) >= 20 else prices[-1] * 0.98
        
        return {
            'sma_20': round(float(sma_20), 2),
            'sma_50': round(float(sma_50), 2),
            'rsi': round(float(rsi), 2),
            'bollinger_upper': round(float(upper_band), 2),
            'bollinger_lower': round(float(lower_band), 2),
            'current_price': round(float(prices[-1]), 2)
        }
        
    except Exception as e:
        logger.error(f"Error calculating technical indicators: {str(e)}")
        return {}

def analyze_sentiment_price_correlation(price_data, sentiment_data):
    """
    Analyze how sentiment correlates with price movements
    """
    try:
        if not sentiment_data or len(sentiment_data) < 5:
            return {'correlation': 0, 'impact_strength': 'low', 'analysis': 'Insufficient sentiment data'}
        
        # Extract prices
        if isinstance(price_data[0], dict):
            prices = [float(item.get('close', item.get('price', 0))) for item in price_data]
        else:
            prices = [float(p) for p in price_data]
        
        # Calculate price changes
        price_changes = [((prices[i] - prices[i-1]) / prices[i-1]) * 100 for i in range(1, len(prices))]
        
        # Get sentiment scores
        sentiments = [float(item.get('sentiment_score', 0)) for item in sentiment_data]
        
        # Align data
        min_length = min(len(sentiments), len(price_changes))
        aligned_sentiment = sentiments[:min_length]
        aligned_price_changes = price_changes[:min_length]
        
        # Calculate correlation
        if min_length > 3:
            correlation = np.corrcoef(aligned_sentiment, aligned_price_changes)[0, 1]
            if np.isnan(correlation):
                correlation = 0
        else:
            correlation = 0
        
        # Determine impact strength
        abs_correlation = abs(correlation)
        if abs_correlation > 0.5:
            impact_strength = 'high'
        elif abs_correlation > 0.3:
            impact_strength = 'medium'
        else:
            impact_strength = 'low'
        
        # Generate analysis
        if correlation > 0.3:
            analysis = 'Strong positive correlation: sentiment tends to predict price direction'
        elif correlation < -0.3:
            analysis = 'Negative correlation: sentiment often contrarian to price moves'
        else:
            analysis = 'Weak correlation: sentiment has limited predictive power'
        
        return {
            'correlation': round(correlation, 3),
            'impact_strength': impact_strength,
            'analysis': analysis,
            'data_points': min_length
        }
        
    except Exception as e:
        logger.error(f"Error analyzing sentiment correlation: {str(e)}")
        return {'correlation': 0, 'impact_strength': 'unknown', 'analysis': 'Analysis failed'}

# Global enhanced predictor
enhanced_predictor = AdvancedStockPredictor()

def train_and_predict_enhanced(ticker, price_data, sentiment_data, prediction_days=7):
    """
    Train enhanced model with sentiment integration
    """
    try:
        logger.info(f"Training Sentiment-Enhanced LSTM for {ticker}")
        
        # Train the enhanced model
        training_success = enhanced_predictor.train_enhanced_model(
            price_data, 
            sentiment_data, 
            epochs=80, 
            batch_size=16
        )
        
        if not training_success:
            raise Exception("Enhanced model training failed")
        
        # Generate enhanced predictions
        predictions = enhanced_predictor.predict_with_sentiment(
            price_data, 
            sentiment_data, 
            prediction_days
        )
        
        # Calculate technical indicators
        if isinstance(price_data[0], dict):
            prices = [float(item.get('close', item.get('price', 0))) for item in price_data]
        else:
            prices = [float(p) for p in price_data]
        
        technical_indicators = analyze_technical_indicators(prices)
        
        # Sentiment impact analysis
        sentiment_impact = analyze_sentiment_price_correlation(price_data, sentiment_data)
        
        return {
            'ticker': ticker,
            'predictions': predictions,
            'technical_indicators': technical_indicators,
            'sentiment_analysis': sentiment_impact,
            'model_metrics': {
                'model_type': 'Sentiment-Enhanced LSTM with Attention',
                'training_data_points': len(price_data),
                'sentiment_data_points': len(sentiment_data) if sentiment_data else 0,
                'sequence_length': enhanced_predictor.sequence_length,
                'prediction_horizon': prediction_days,
                'features_used': ['price_history', 'sentiment_scores', 'news_volume', 'buzz_scores', 'technical_indicators'],
                'architecture': 'Multi-modal LSTM with attention mechanism',
                'training_timestamp': datetime.now().isoformat()
            },
            'success': True
        }
        
    except Exception as e:
        logger.error(f"Error in enhanced prediction for {ticker}: {str(e)}")
        return {
            'ticker': ticker,
            'error': str(e),
            'success': False
        }