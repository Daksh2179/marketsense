import { Request, Response } from 'express';
import { GeminiService } from '../services/geminiService';
import { CompanyModel } from '../models/Company';
import { StockPriceModel } from '../models/StockPrice';
import { SentimentModel } from '../models/Sentiment';
import { logger } from '../utils/logger';

interface ChatRequest {
  message: string;
  context?: {
    currentStock?: string;
    currentPage?: string;
    portfolioSummary?: string;
    recentNews?: string[];
    userSession?: string;
  };
}

interface ChatResponse {
  response: string;
  context: {
    timestamp: string;
    responseTime: number;
    contextUsed: string[];
    suggestedQuestions?: string[];
  };
  success: boolean;
  error?: string;
}

export const chatController = {
  /**
   * Handle chatbot conversation
   */
  handleChatMessage: async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const { message, context }: ChatRequest = req.body;
      
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        res.status(400).json({
          response: "I didn't receive a message. Please ask me about stocks, market analysis, or investment insights!",
          success: false,
          error: 'Message is required'
        });
        return;
      }
      
      logger.info(`Processing chat message: "${message.substring(0, 50)}..."`);
      
      // Build enhanced context
      const enhancedContext = await buildContextualInfo(context);
      
      // Process with Gemini AI
      const aiResponse = await GeminiService.handleChatQuery(message, enhancedContext);
      
      const responseTime = Date.now() - startTime;
      
      // Generate suggested follow-up questions
      const suggestedQuestions = generateSuggestedQuestions(message, context);
      
      const response: ChatResponse = {
        response: aiResponse,
        context: {
          timestamp: new Date().toISOString(),
          responseTime,
          contextUsed: Object.keys(enhancedContext).filter(key => enhancedContext[key as keyof typeof enhancedContext]),
          suggestedQuestions
        },
        success: true
      };
      
      res.status(200).json(response);
      
    } catch (error: any) {
      logger.error('Error in chat message handling:', error);
      
      const responseTime = Date.now() - startTime;
      
      // Fallback response
      const fallbackResponse: ChatResponse = {
        response: "I'm experiencing some technical difficulties right now. Here are some things I can help you with: stock analysis, market insights, portfolio advice, and investment research. Please try asking about a specific company or market topic!",
        context: {
          timestamp: new Date().toISOString(),
          responseTime,
          contextUsed: ['fallback'],
          suggestedQuestions: [
            "What's the latest on AAPL?",
            "How is the tech sector performing?",
            "Should I buy or sell Tesla?",
            "What are the market trends today?"
          ]
        },
        success: false,
        error: error.message
      };
      
      res.status(200).json(fallbackResponse);
    }
  },

  /**
   * Get chatbot health and capabilities
   */
  getChatbotStatus: async (req: Request, res: Response): Promise<void> => {
    try {
      // Check Gemini service health
      const geminiHealth = await GeminiService.healthCheck();
      
      res.status(200).json({
        status: geminiHealth.status,
        capabilities: [
          'Stock analysis and research',
          'Market insights and trends',
          'Portfolio advice and optimization',
          'News sentiment analysis',
          'Investment strategy guidance',
          'Technical analysis interpretation',
          'Risk assessment and management'
        ],
        availableKeys: geminiHealth.availableKeys,
        responseTime: '< 3 seconds',
        contextAwareness: [
          'Current stock being viewed',
          'Portfolio holdings and performance',
          'Recent market news and sentiment',
          "User's current page and actions"
        ],
        lastUpdated: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Error checking chatbot status:', error);
      res.status(500).json({ 
        error: 'Failed to check chatbot status',
        status: 'unavailable'
      });
    }
  },

  /**
   * Get suggested conversation starters
   */
  getConversationStarters: async (req: Request, res: Response): Promise<void> => {
    try {
      const { currentStock, currentPage } = req.query;
      
      let starters = [
        "What's happening in the markets today?",
        "Help me analyze my portfolio",
        "Show me trending stocks with good sentiment",
        "What should I know about market volatility?"
      ];
      
      // Context-specific starters
      if (currentStock) {
        starters = [
          `Tell me about ${currentStock}`,
          `What's the sentiment around ${currentStock}?`,
          `Should I buy or sell ${currentStock}?`,
          `What are the key risks for ${currentStock}?`
        ];
      } else if (currentPage === 'sectors') {
        starters = [
          "Which sectors are performing best?",
          "What's driving tech sector performance?",
          "Are there any undervalued sectors?",
          "How should I diversify across sectors?"
        ];
      } else if (currentPage === 'watchlist') {
        starters = [
          "How is my portfolio performing?",
          "What should I add to my portfolio?",
          "Help me rebalance my holdings",
          "What are my biggest risks?"
        ];
      }
      
      res.status(200).json({
        starters,
        context: {
          currentStock: currentStock || null,
          currentPage: currentPage || 'home'
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Error getting conversation starters:', error);
      res.status(500).json({ error: 'Failed to get conversation starters' });
    }
  }
};

/**
 * Build contextual information for enhanced AI responses
 */
async function buildContextualInfo(context?: ChatRequest['context']) {
  const enhancedContext: any = {};
  
  try {
    // Add current stock context if provided
    if (context?.currentStock) {
      try {
        const company = await CompanyModel.getByTicker(context.currentStock);
        const latestPrice = await StockPriceModel.getLatestPrice(context.currentStock);
        const sentiment = await SentimentModel.getLatestSentiment(context.currentStock);
        
        enhancedContext.currentStock = `${context.currentStock} (${company?.name || 'Unknown Company'}) - Price: $${latestPrice?.close || 'N/A'}, Sentiment: ${sentiment?.sentiment_score || 'N/A'}`;
      } catch (error) {
        enhancedContext.currentStock = context.currentStock;
      }
    }
    
    // Add portfolio summary if provided
    if (context?.portfolioSummary) {
      enhancedContext.portfolioSummary = context.portfolioSummary;
    }
    
    // Add recent news context
    if (context?.recentNews && context.recentNews.length > 0) {
      enhancedContext.recentNews = context.recentNews.slice(0, 3); // Limit to 3 recent headlines
    }
    
    // Add current page context
    if (context?.currentPage) {
      const pageDescriptions = {
        'dashboard': 'User is viewing detailed stock analysis dashboard',
        'watchlist': 'User is managing their portfolio and watchlist',
        'sectors': 'User is analyzing sector performance and trends',
        'companies': 'User is comparing different companies',
        'home': 'User is on the homepage viewing market overview'
      };
      
      enhancedContext.currentPage = pageDescriptions[context.currentPage as keyof typeof pageDescriptions] || context.currentPage;
    }
    
    // Add general market context
    enhancedContext.systemCapabilities = [
      'Real-time stock price analysis',
      'FinBERT-powered sentiment analysis', 
      'LSTM price predictions with attention mechanisms',
      'Portfolio optimization and risk assessment',
      'Technical indicators and market regime detection'
    ];
    
  } catch (error) {
    logger.warn('Error building contextual info:', error);
  }
  
  return enhancedContext;
}

/**
 * Generate intelligent follow-up questions based on user query and context
 */
function generateSuggestedQuestions(message: string, context?: ChatRequest['context']): string[] {
  const messageLower = message.toLowerCase();
  
  // Stock-specific suggestions
  if (context?.currentStock) {
    return [
      `What's the prediction for ${context.currentStock}?`,
      `Should I hold or sell ${context.currentStock}?`,
      `What are the risks for ${context.currentStock}?`,
      `How does ${context.currentStock} compare to competitors?`
    ];
  }
  
  // Portfolio-related suggestions
  if (messageLower.includes('portfolio') || context?.currentPage === 'watchlist') {
    return [
      "How should I diversify my portfolio?",
      "What's my portfolio's risk level?", 
      "Should I rebalance my holdings?",
      "What stocks should I consider adding?"
    ];
  }
  
  // Market analysis suggestions
  if (messageLower.includes('market') || messageLower.includes('sector')) {
    return [
      "Which sectors are trending up?",
      "What's driving market volatility?",
      "Are we in a bull or bear market?",
      "What economic indicators should I watch?"
    ];
  }
  
  // Sentiment-related suggestions
  if (messageLower.includes('sentiment') || messageLower.includes('news')) {
    return [
      "What's the overall market sentiment?",
      "Which stocks have positive news?",
      "How does news affect stock prices?",
      "What are investors worried about?"
    ];
  }
  
  // General suggestions
  return [
    "What are today's top market movers?",
    "Help me find undervalued stocks",
    "What's the best investment strategy now?",
    "Explain current market conditions"
  ];
}