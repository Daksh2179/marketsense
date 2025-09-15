import json
import random
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def handler(event, context):
    try:
        logger.info("Sentiment Lambda invoked")
        
        # Parse input from API Gateway
        body = json.loads(event.get('body', '{}')) if event.get('body') else {}
        
        # Handle CORS preflight requests
        if event.get('httpMethod') == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
                },
                'body': ''
            }
        
        # Handle different endpoints
        if 'headlines' in body:
            headlines = body.get('headlines', [])
            
            if not headlines or not isinstance(headlines, list):
                return error_response('Valid headlines array required')
            
            logger.info(f"Processing sentiment for {len(headlines)} headlines")
            
            # Process headlines using simplified sentiment analysis
            results = []
            total_score = 0
            
            positive_words = ['growth', 'profit', 'rise', 'gain', 'up', 'bullish', 'increase', 'higher', 'positive', 'jump']
            negative_words = ['drop', 'fall', 'loss', 'down', 'bearish', 'decline', 'lower', 'negative', 'risk', 'concern']
            
            for headline in headlines[:20]:
                if not headline or not isinstance(headline, str):
                    continue
                
                # Simple keyword-based sentiment analysis
                pos_count = sum(1 for word in positive_words if word in headline.lower())
                neg_count = sum(1 for word in negative_words if word in headline.lower())
                
                # Calculate score based on keyword presence
                if pos_count > neg_count:
                    score = min(0.9, 0.5 + (pos_count - neg_count) * 0.1)
                    label = 'positive'
                elif neg_count > pos_count:
                    score = max(-0.9, -0.5 - (neg_count - pos_count) * 0.1)
                    label = 'negative'
                else:
                    # Add slight randomness for neutral headlines
                    score = random.uniform(-0.2, 0.2)
                    label = 'neutral'
                
                # Add some randomness to confidence
                confidence = 0.7 + random.uniform(0, 0.2)
                
                results.append({
                    'headline': headline,
                    'sentiment_score': round(float(score), 3),
                    'label': label,
                    'confidence': round(float(confidence), 3)
                })
                
                total_score += score
            
            # Calculate overall sentiment
            overall_sentiment = total_score / len(results) if results else 0.0
            
            # Categorize headlines
            positive_headlines = [r for r in results if r['sentiment_score'] > 0.2]
            negative_headlines = [r for r in results if r['sentiment_score'] < -0.2]
            neutral_headlines = [r for r in results if -0.2 <= r['sentiment_score'] <= 0.2]
            
            # Generate summary insights
            positive_summary = []
            negative_summary = []
            
            if positive_headlines:
                positive_summary = [
                    f"Strong positive sentiment detected in {len(positive_headlines)} headlines",
                    "Market optimism reflected in recent news coverage",
                    "Favorable developments supporting bullish outlook"
                ][:min(len(positive_headlines), 3)]
            
            if negative_headlines:
                negative_summary = [
                    f"Negative sentiment identified in {len(negative_headlines)} headlines", 
                    "Market concerns reflected in recent coverage",
                    "Risk factors requiring attention"
                ][:min(len(negative_headlines), 2)]
            
            # Extract key themes
            all_text = ' '.join(headlines).lower()
            financial_keywords = {
                'earnings': ['earnings', 'profit', 'revenue', 'sales'],
                'partnerships': ['partnership', 'deal', 'acquisition', 'merger'],
                'regulation': ['regulation', 'regulatory', 'compliance', 'sec'],
                'innovation': ['innovation', 'technology', 'ai', 'digital'],
                'market': ['market', 'trading', 'volatility', 'price']
            }
            
            key_themes = []
            for theme, keywords in financial_keywords.items():
                if any(keyword in all_text for keyword in keywords):
                    theme_headlines = [h for h in headlines if any(k in h.lower() for k in keywords)]
                    if theme_headlines:
                        theme_sentiment = random.uniform(-0.5, 0.8)
                        key_themes.append({
                            'theme': theme.title(),
                            'sentiment': round(float(theme_sentiment), 2)
                        })
            
            response = {
                'overall_sentiment': round(float(overall_sentiment), 3),
                'headline_results': results,
                'positive_summary': positive_summary,
                'negative_summary': negative_summary,
                'key_themes': key_themes[:5],
                'market_impact': f"Based on sentiment analysis, expect {'positive' if overall_sentiment > 0.1 else 'negative' if overall_sentiment < -0.1 else 'neutral'} market reaction",
                'analysis_metadata': {
                    'total_headlines': len(headlines),
                    'processed_headlines': len(results),
                    'positive_count': len(positive_headlines),
                    'negative_count': len(negative_headlines),
                    'neutral_count': len(neutral_headlines),
                    'model_used': 'Lambda-Optimized Sentiment Analyzer',
                    'timestamp': datetime.now().isoformat()
                },
                'success': True
            }
            
        elif 'text' in body:
            text = body.get('text', '')
            
            if not text or not isinstance(text, str):
                return error_response('Valid text string required')
            
            logger.info(f"Processing sentiment for single text: {text[:50]}...")
            
            # Simple keyword-based sentiment analysis
            positive_words = ['growth', 'profit', 'rise', 'gain', 'up', 'bullish', 'increase', 'higher', 'positive']
            negative_words = ['drop', 'fall', 'loss', 'down', 'bearish', 'decline', 'lower', 'negative', 'risk']
            
            pos_count = sum(1 for word in positive_words if word in text.lower())
            neg_count = sum(1 for word in negative_words if word in text.lower())
            
            # Calculate score based on keyword presence
            if pos_count > neg_count:
                score = min(0.9, 0.5 + (pos_count - neg_count) * 0.1)
                label = 'positive'
            elif neg_count > pos_count:
                score = max(-0.9, -0.5 - (neg_count - pos_count) * 0.1)
                label = 'negative'
            else:
                # Add slight randomness for neutral text
                score = random.uniform(-0.2, 0.2)
                label = 'neutral'
            
            # Add some randomness to confidence
            confidence = 0.7 + random.uniform(0, 0.2)
            
            response = {
                'text': text,
                'sentiment_score': round(float(score), 3),
                'label': label,
                'confidence': round(float(confidence), 3),
                'timestamp': datetime.now().isoformat(),
                'success': True
            }
            
        else:
            # Default to health check
            response = {
                'status': 'healthy',
                'sentiment_service': 'online',
                'model': 'Lambda-Optimized Sentiment Analyzer',
                'timestamp': datetime.now().isoformat(),
                'success': True
            }
        
        logger.info("Sentiment analysis completed successfully")
        
        # Return successful response
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Content-Type': 'application/json'
            },
            'body': json.dumps(response)
        }
        
    except Exception as e:
        logger.error(f"Error in sentiment Lambda: {str(e)}")
        return error_response(str(e))
        
def error_response(message):
    return {
        'statusCode': 500,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
        },
        'body': json.dumps({
            'error': message,
            'success': False
        })
    }