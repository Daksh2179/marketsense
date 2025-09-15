import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger';
import dotenv from 'dotenv';

dotenv.config();

// Initialize multiple Gemini API instances
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_KEY_2 = process.env.GEMINI_API_KEY_2;
const GEMINI_API_KEY_3 = process.env.GEMINI_API_KEY_3;

// API key validation
const apiKeys = [GEMINI_API_KEY, GEMINI_API_KEY_2, GEMINI_API_KEY_3].filter(Boolean);
if (apiKeys.length === 0) {
  logger.warn('No Gemini API keys found. Add GEMINI_API_KEY, GEMINI_API_KEY_2, GEMINI_API_KEY_3 to your .env file');
}

// Initialize Gemini clients
const genAI1 = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const genAI2 = GEMINI_API_KEY_2 ? new GoogleGenerativeAI(GEMINI_API_KEY_2) : null;
const genAI3 = GEMINI_API_KEY_3 ? new GoogleGenerativeAI(GEMINI_API_KEY_3) : null;

// Rate limiting and retry logic
interface GeminiRequest {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}

class GeminiRateLimiter {
  private keyUsage: { [key: string]: { count: number; resetTime: number } } = {};
  private readonly RATE_LIMIT = 15; // 15 requests per minute per key
  private readonly WINDOW = 60 * 1000; // 1 minute in milliseconds

  canMakeRequest(keyIndex: number): boolean {
    const keyId = `key_${keyIndex}`;
    const now = Date.now();
    
    if (!this.keyUsage[keyId] || now > this.keyUsage[keyId].resetTime) {
      this.keyUsage[keyId] = { count: 0, resetTime: now + this.WINDOW };
    }
    
    return this.keyUsage[keyId].count < this.RATE_LIMIT;
  }

  recordRequest(keyIndex: number): void {
    const keyId = `key_${keyIndex}`;
    if (this.keyUsage[keyId]) {
      this.keyUsage[keyId].count++;
    }
  }
}

const rateLimiter = new GeminiRateLimiter();

export class GeminiService {
  /**
   * Make a robust API call with automatic key rotation and retry logic
   */
  private static async makeRequest(
    request: GeminiRequest,
    preferredKeyIndex?: number
  ): Promise<string> {
    const clients = [genAI1, genAI2, genAI3];
    
    // Try preferred key first, then fallback to available keys
    const tryOrder = preferredKeyIndex !== undefined 
      ? [preferredKeyIndex, ...Array.from({length: 3}, (_, i) => i).filter(i => i !== preferredKeyIndex)]
      : [0, 1, 2];

    for (const keyIndex of tryOrder) {
      const client = clients[keyIndex];
      if (!client || !rateLimiter.canMakeRequest(keyIndex)) {
        continue;
      }

      try {
        const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: request.prompt }] }],
          generationConfig: {
            temperature: request.temperature || 0.7,
            maxOutputTokens: request.maxTokens || 1000,
          },
        });

        rateLimiter.recordRequest(keyIndex);
        const response = result.response.text();
        
        if (response) {
          logger.info(`Gemini request successful using key ${keyIndex + 1}`);
          return response;
        }
      } catch (error: any) {
        logger.warn(`Gemini API error with key ${keyIndex + 1}:`, error.message);
        continue;
      }
    }

    throw new Error('All Gemini API keys exhausted or failed');
  }

  /**
   * GENERATE AI INSIGHTS - NEW FUNCTION FOR NEWS SENTIMENT
   * This is the missing function that sentimentController needs
   */
  static async generateAIInsights(ticker: string, headlines: string[]): Promise<{
    positiveSummary: string[];
    negativeSummary: string[];
    overallSentiment: number;
    keyThemes: { theme: string; sentiment: number }[];
    marketImpact: string;
  }> {
    try {
      // Use the existing analyzeNews function which does exactly what we need
      return await this.analyzeNews(ticker, headlines);
    } catch (error) {
      logger.error(`Error generating AI insights for ${ticker}:`, error);
      
      // Return default insights on error
      return {
        positiveSummary: [
          `${ticker} maintaining market presence`,
          'Company operations continue as normal'
        ],
        negativeSummary: [
          'Standard market risks apply',
          'Monitor for volatility'
        ],
        overallSentiment: 0,
        keyThemes: [
          { theme: 'Market Activity', sentiment: 0 },
          { theme: 'Operations', sentiment: 0 }
        ],
        marketImpact: 'Neutral outlook based on available information'
      };
    }
  }

  /**
   * NEWS ANALYSIS (Uses Key 1)
   * Analyze financial news headlines for sentiment and generate summaries
   */
  static async analyzeNews(ticker: string, headlines: string[]): Promise<{
    positiveSummary: string[];
    negativeSummary: string[];
    overallSentiment: number;
    keyThemes: { theme: string; sentiment: number }[];
    marketImpact: string;
  }> {
    try {
      if (!headlines || headlines.length === 0) {
        return {
          positiveSummary: [`No recent news for ${ticker}`],
          negativeSummary: ['Limited news coverage'],
          overallSentiment: 0,
          keyThemes: [{ theme: 'Low Activity', sentiment: 0 }],
          marketImpact: 'Insufficient news data for market impact analysis'
        };
      }

      const headlinesText = headlines.slice(0, 10).join('\n');
      
      const prompt = `
As a financial analyst, analyze these news headlines for ${ticker}:

${headlinesText}

Provide a JSON response with:
{
  "positiveSummary": ["bullet point 1", "bullet point 2", "bullet point 3"],
  "negativeSummary": ["bullet point 1", "bullet point 2"],
  "overallSentiment": 0.4,
  "keyThemes": [
    {"theme": "Earnings", "sentiment": 0.6},
    {"theme": "Partnerships", "sentiment": 0.8},
    {"theme": "Regulation", "sentiment": -0.2}
  ],
  "marketImpact": "Brief assessment of how this news might impact stock price in next 1-2 weeks"
}

Rules:
- overallSentiment: -1 (very negative) to +1 (very positive)
- positiveSummary: 2-4 bullet points of positive developments
- negativeSummary: 1-3 bullet points of concerns/risks
- keyThemes: 3-5 main topics with sentiment scores
- marketImpact: 1-2 sentence practical impact assessment
- Keep bullet points concise (max 15 words each)
- Only return the JSON, no extra text
`;

      const response = await this.makeRequest({ prompt, temperature: 0.3 }, 0);
      
      // Parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return parsed;
        } catch (parseError) {
          logger.warn('Failed to parse Gemini JSON response');
          return this.createFallbackNewsAnalysis(headlines);
        }
      }
      
      // Fallback if JSON parsing fails
      return this.createFallbackNewsAnalysis(headlines);
    } catch (error) {
      logger.error(`Error in Gemini news analysis for ${ticker}:`, error);
      return this.createFallbackNewsAnalysis(headlines);
    }
  }

  /**
   * PORTFOLIO ANALYSIS (Uses Key 2)
   * Analyze user's portfolio and provide investment advice
   */
  static async analyzePortfolio(
    stocks: Array<{
      ticker: string;
      name: string;
      price: number;
      changePercent: number;
      sentiment: number;
      sector: string;
      shares?: number;
      avgPrice?: number;
      notes?: string;
    }>, 
    riskTolerance: 'conservative' | 'neutral' | 'aggressive'
  ): Promise<{
    overallHealth: string;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    riskAssessment: string;
    diversificationScore: number;
  }> {
    try {
      const portfolioData = stocks.map(stock => {
        const positionValue = stock.shares ? stock.shares * stock.price : stock.price;
        const pnl = stock.shares && stock.avgPrice ? 
          ((stock.price - stock.avgPrice) / stock.avgPrice * 100).toFixed(1) : '0';
        
        return `${stock.ticker} (${stock.name}) - ${stock.sector} - Price: $${stock.price} - Change: ${stock.changePercent.toFixed(2)}% - Sentiment: ${stock.sentiment.toFixed(2)} - Shares: ${stock.shares || 'N/A'} - P&L: ${pnl}%`;
      }).join('\n');

      const riskProfiles = {
        conservative: 'Prioritize capital preservation, steady income, and low volatility. Emphasize risk management and diversification.',
        neutral: 'Balance growth and stability. Focus on education and moderate risk strategies with reasonable growth potential.',
        aggressive: 'Focus on growth opportunities, emerging trends, and higher risk/reward strategies. Be more bullish on momentum plays.'
      };

      const prompt = `
As a financial advisor, analyze this portfolio with ${riskTolerance} risk tolerance:

PORTFOLIO:
${portfolioData}

RISK PROFILE: ${riskProfiles[riskTolerance]}

Provide JSON response:
{
  "overallHealth": "Strong/Moderate/Weak - brief assessment",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "riskAssessment": "Brief risk level assessment for this portfolio",
  "diversificationScore": 7.5
}

Rules:
- Tailor ALL advice to ${riskTolerance} risk tolerance
- diversificationScore: 0-10 (10 = perfectly diversified across sectors)
- Keep points actionable and specific to this portfolio
- Consider sector concentration, sentiment patterns, performance trends, position sizes
- Max 12 words per bullet point
- Be professional but practical
- Only return JSON, no extra text
`;

      const response = await this.makeRequest({ prompt, temperature: 0.4 }, 1);
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return parsed;
        } catch (parseError) {
          logger.warn('Failed to parse portfolio JSON response');
          return this.createFallbackPortfolioAnalysis(stocks, riskTolerance);
        }
      }
      
      return this.createFallbackPortfolioAnalysis(stocks, riskTolerance);
    } catch (error) {
      logger.error('Error in Gemini portfolio analysis:', error);
      return this.createFallbackPortfolioAnalysis(stocks, riskTolerance);
    }
  }

  /**
   * COMPANY COMPARISON (Uses Key 1)
   * Generate insights for company comparison
   */
  static async compareCompanies(companies: Array<{
    ticker: string;
    name: string;
    price: number;
    changePercent: number;
    sentiment: number;
    sector: string;
  }>): Promise<string[]> {
    try {
      const companiesData = companies.map(c => 
        `${c.ticker} (${c.name}) - ${c.sector} - $${c.price} - ${c.changePercent.toFixed(2)}% - Sentiment: ${c.sentiment.toFixed(2)}`
      ).join('\n');

      const prompt = `
Compare these companies and provide 3-4 key investment insights:

${companiesData}

Return as JSON array: ["insight 1", "insight 2", "insight 3"]

Focus on:
- Valuation differences and opportunities
- Sector positioning and competitive advantages  
- Sentiment patterns and market perception
- Performance trends and momentum
- Investment implications and recommendations

Keep insights under 15 words each, actionable, and professional.
Only return the JSON array, no extra text.
`;

      const response = await this.makeRequest({ prompt, temperature: 0.4 }, 0);
      
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return parsed;
        } catch (parseError) {
          logger.warn('Failed to parse comparison JSON response');
          return this.createFallbackComparisonInsights(companies);
        }
      }
      
      return this.createFallbackComparisonInsights(companies);
    } catch (error) {
      logger.error('Error in Gemini company comparison:', error);
      return this.createFallbackComparisonInsights(companies);
    }
  }
  
  /**
   * CHATBOT (Uses Key 3)
   * Handle conversational queries about markets and investments
   */
  static async handleChatQuery(
    userQuery: string,
    context: {
      currentStock?: string;
      portfolioSummary?: string;
      recentNews?: string[];
      systemCapabilities?: string[];
      currentPage?: string;
    }
  ): Promise<string> {
    try {
      const contextInfo = [
        context.currentStock ? `Current stock context: ${context.currentStock}` : '',
        context.portfolioSummary ? `Portfolio context: ${context.portfolioSummary}` : '',
        context.recentNews?.length ? `Recent news: ${context.recentNews.join('; ')}` : '',
        context.currentPage ? `User is on: ${context.currentPage}` : ''
      ].filter(Boolean).join('\n');

      const systemInfo = context.systemCapabilities ? 
        `System capabilities: ${context.systemCapabilities.join(', ')}` : 
        'System offers real-time prices, sentiment analysis, ML predictions, and portfolio insights';

      const prompt = `
You are MarketSense AI, a friendly and knowledgeable financial assistant. 

SYSTEM INFO:
${systemInfo}

CONTEXT:
${contextInfo}

USER QUESTION: ${userQuery}

Provide a helpful, accurate response about financial markets. Rules:
- Be conversational but professional
- Use the provided context when relevant
- If you don't know something specific, say so
- Keep responses under 150 words
- Use emojis sparingly (1-2 max)
- Focus on being helpful and educational
- Don't give specific buy/sell advice, provide general insights
- Mention relevant MarketSense features when appropriate
`;

      const response = await this.makeRequest({ prompt, temperature: 0.6 }, 2);
      return response.trim();
    } catch (error) {
      logger.error('Error in Gemini chat response:', error);
      return "I'm having trouble processing your question right now. Please try asking something else about markets or investments! You can ask me about stock analysis, market trends, portfolio advice, or any investment topic.";
    }
  }

  // Fallback methods when Gemini API fails
  private static createFallbackNewsAnalysis(headlines: string[]) {
    // Analyze headlines for basic sentiment
    const headlineText = headlines.join(' ').toLowerCase();
    const positiveWords = ['growth', 'profit', 'success', 'beat', 'rise', 'gain', 'strong', 'positive'];
    const negativeWords = ['loss', 'decline', 'fall', 'concern', 'risk', 'weak', 'negative', 'drop'];
    
    const positiveCount = positiveWords.filter(word => headlineText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => headlineText.includes(word)).length;
    
    const sentiment = positiveCount > negativeCount ? 0.3 : 
                     negativeCount > positiveCount ? -0.3 : 0;

    return {
      positiveSummary: [
        'Market activity showing continued interest', 
        'Company maintaining operational momentum',
        'Investor attention remains engaged'
      ],
      negativeSummary: [
        'Some market volatility concerns persist',
        'External factors may impact performance'
      ],
      overallSentiment: sentiment,
      keyThemes: [
        { theme: 'Market Activity', sentiment: sentiment },
        { theme: 'Operations', sentiment: 0.1 },
        { theme: 'Investor Sentiment', sentiment: sentiment * 0.5 }
      ],
      marketImpact: sentiment > 0 ? 
        'Positive momentum may support near-term price stability' :
        sentiment < 0 ?
        'Cautious outlook suggests potential volatility ahead' :
        'Mixed signals suggest neutral to cautious optimism in near term'
    };
  }

  private static createFallbackPortfolioAnalysis(
    stocks: any[], 
    riskTolerance: 'conservative' | 'neutral' | 'aggressive'
  ) {
    const sectors = [...new Set(stocks.map(s => s.sector))];
    const avgSentiment = stocks.reduce((sum, s) => sum + s.sentiment, 0) / stocks.length;
    const avgChange = stocks.reduce((sum, s) => sum + s.changePercent, 0) / stocks.length;
    
    const profiles = {
      conservative: {
        overallHealth: avgChange > 0 ? 'Moderate - Stable with positive bias' : 'Moderate - Focus on stability needed',
        strengths: [
          'Quality large-cap holdings', 
          'Established market leaders',
          sectors.length > 3 ? 'Good sector diversification' : 'Core sectors represented'
        ],
        weaknesses: [
          'Consider more defensive sectors', 
          'Monitor volatility exposure',
          avgSentiment < 0 ? 'Sentiment headwinds present' : 'Room for yield enhancement'
        ],
        suggestions: [
          'Add dividend stocks for income', 
          'Reduce concentration risk',
          'Consider bonds for stability'
        ],
        riskAssessment: 'Medium risk - suitable for conservative approach with adjustments'
      },
      neutral: {
        overallHealth: avgChange > 0 ? 'Good - Balanced growth trajectory' : 'Moderate - Rebalancing opportunity',
        strengths: [
          'Diversified sector exposure', 
          'Mix of growth and stability',
          avgSentiment > 0 ? 'Positive market sentiment' : 'Resilient holdings'
        ],
        weaknesses: [
          'Room for international exposure', 
          'Consider value opportunities',
          sectors.length < 5 ? 'Could improve diversification' : 'Watch correlation risk'
        ],
        suggestions: [
          'Add emerging market exposure', 
          'Monitor rebalancing needs',
          'Consider tech/healthcare balance'
        ],
        riskAssessment: 'Moderate risk with balanced growth potential'
      },
      aggressive: {
        overallHealth: avgChange > 0 ? 'Strong - Growth momentum present' : 'Moderate - Seek catalyst opportunities',
        strengths: [
          'Strong growth sector exposure', 
          'Momentum positioning',
          avgSentiment > 0 ? 'Favorable sentiment tailwinds' : 'Contrarian opportunities'
        ],
        weaknesses: [
          'High correlation during downturns', 
          'Missing small-cap exposure',
          'Consider volatility hedging'
        ],
        suggestions: [
          'Add high-growth opportunities', 
          'Consider options strategies',
          'Look for disruption plays'
        ],
        riskAssessment: 'High risk/reward with significant volatility expected'
      }
    };

    return {
      ...profiles[riskTolerance],
      diversificationScore: Math.min(9, sectors.length * 1.5 + (avgSentiment > 0 ? 1 : 0))
    };
  }

  private static createFallbackComparisonInsights(companies: any[]) {
    const avgPrice = companies.reduce((sum, c) => sum + c.price, 0) / companies.length;
    const avgChange = companies.reduce((sum, c) => sum + c.changePercent, 0) / companies.length;
    const sectors = [...new Set(companies.map(c => c.sector))];
    
    const insights = [
      'Companies show varied performance patterns across sectors',
      'Sentiment levels indicate different market perceptions'
    ];
    
    if (avgChange > 0) {
      insights.push('Overall positive momentum suggests market confidence');
    } else if (avgChange < -1) {
      insights.push('Negative trend may present value opportunities');
    }
    
    if (sectors.length > 1) {
      insights.push('Cross-sector exposure provides diversification benefits');
    } else {
      insights.push('Sector concentration increases correlation risk');
    }
    
    return insights.slice(0, 4);
  }

  /**
   * Health check for Gemini service
   */
  static async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    availableKeys: number;
    details: string;
  }> {
    const availableKeys = [genAI1, genAI2, genAI3].filter(Boolean).length;
    
    if (availableKeys === 0) {
      return {
        status: 'down',
        availableKeys: 0,
        details: 'No API keys configured'
      };
    }

    try {
      await this.makeRequest({
        prompt: 'Respond with just the word "OK" if you can read this.',
        temperature: 0,
        maxTokens: 10
      });

      return {
        status: 'healthy',
        availableKeys,
        details: `${availableKeys}/3 API keys available and working`
      };
    } catch (error) {
      return {
        status: 'degraded',
        availableKeys,
        details: 'API keys configured but requests failing'
      };
    }
  }
}

// Export both the class and a default instance for compatibility
export const GeminiServiceInstance = GeminiService;
export default GeminiService;