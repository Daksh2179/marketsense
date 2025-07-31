import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Backend response interfaces that match your actual backend responses
interface BackendCompany {
  ticker: string;
  name: string;
  sector?: string;
  industry?: string;
  description?: string;
  website?: string;
  logo_url?: string;
  exchange?: string;
  created_at?: string;
  updated_at?: string;
}

interface BackendStockPrice {
  ticker: string;
  name?: string;
  sector?: string;
  date: string;
  close: string | number;
  open?: string | number;
  high?: string | number;
  low?: string | number;
  volume?: string | number;
  price?: string | number; // Some endpoints return 'price' instead of 'close'
}

interface BackendHistoricalPrice {
  date: string;
  close: string | number;
  open?: string | number;
  high?: string | number;
  low?: string | number;
  volume?: string | number;
}

interface BackendChartData {
  dates?: string[];
  prices?: (string | number)[];
  volumes?: (string | number)[];
}

interface BackendSentimentScore {
  date: string;
  sentiment_score: string | number;
  news_count: string | number;
  buzz_score?: string | number;
}

interface BackendSentimentChartData {
  dates?: string[];
  scores?: (string | number)[];
  newsCounts?: (string | number)[];
  buzzScores?: (string | number)[];
}

interface BackendNewsHeadline {
  headline: string;
  source?: string;
  published_at: string;
  url?: string;
}

interface BackendHeadlinesResponse {
  headlines?: BackendNewsHeadline[];
  company?: string;
  ticker?: string;
  aiInsights?: {
    positiveSummary: string[];
    negativeSummary: string[];
    keyThemes: { theme: string; sentiment: number }[];
    marketImpact: string;
    overallSentiment: number;
  };
}

interface NewsHeadlinesResponse {
  headlines: NewsHeadline[];
  aiInsights?: {
    positiveSummary: string[];
    negativeSummary: string[];
    keyThemes: { theme: string; sentiment: number }[];
    marketImpact: string;
    overallSentiment: number;
  };
}

interface BackendPrediction {
  date: string;
  predicted_price?: string | number;
  confidence_score: string | number;
  predicted_direction: string;
  target_date?: string;
}

interface BackendPredictionConfidence {
  dates?: string[];
  confidence?: (string | number)[];
  accuracy?: (string | number)[];
  type?: string[];
}

interface BackendCombinedPrediction {
  technical?: {
    predictedPrice: string | number;
    predictedDirection: string;
    confidenceScore: string | number;
    targetDate?: string;
  } | null;
  sentiment?: {
    predictedPrice: string | number;
    predictedDirection: string;
    confidenceScore: string | number;
    targetDate?: string;
  } | null;
  combined?: {
    predictedPrice: string | number;
    predictedDirection: string;
    confidenceScore: string | number;
    targetDate?: string;
  } | null;
  currentPrice?: string | number;
}

// Frontend interfaces (what our components expect)
interface Stock {
  ticker: string;
  name: string;
  sector: string;
  close: number;
  date: string;
  open: number;
  high: number;
  low: number;
  volume: number;
}

interface StockHistory {
  date: string;
  close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
}

interface SentimentData {
  date: string;
  sentiment_score: number;
  news_count: number;
}

interface PredictionDataPoint {
  date: string;
  predicted_price: number;
  confidence_score: number;
  predicted_direction: string;
}

interface CombinedPredictionData {
  technical: {
    predictedPrice: number;
    predictedDirection: string;
    confidenceScore: number;
  } | null;
  sentiment: {
    predictedPrice: number;
    predictedDirection: string;
    confidenceScore: number;
  } | null;
  combined: {
    predictedPrice: number;
    predictedDirection: string;
    confidenceScore: number;
  } | null;
}

interface NewsHeadline {
  headline: string;
  source: string;
  published_at: string;
  url: string;
}

// Helper functions for safe type conversion
const safeParseFloat = (value: string | number | undefined | null): number => {
  if (value === undefined || value === null) return 0;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? 0 : num;
};

const safeParseInt = (value: string | number | undefined | null): number => {
  if (value === undefined || value === null) return 0;
  const num = typeof value === 'string' ? parseInt(value) : Math.floor(value);
  return isNaN(num) ? 0 : num;
};

// Define the base API
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ 
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  }),
  tagTypes: ['StockData', 'SentimentData', 'PredictionData'],
  endpoints: (builder) => ({
    // Company endpoints
    getAllCompanies: builder.query<Stock[], void>({
      query: () => '/companies',
      providesTags: ['StockData'],
      transformResponse: (response: BackendCompany[]) => {
        return response.map(company => ({
          ticker: company.ticker,
          name: company.name,
          sector: company.sector || 'Unknown',
          close: 0,
          date: new Date().toISOString(),
          open: 0,
          high: 0,
          low: 0,
          volume: 0
        }));
      }
    }),
    
    searchCompanies: builder.query<Stock[], string>({
      query: (query) => `/companies/search?query=${encodeURIComponent(query)}`,
      providesTags: ['StockData'],
      transformResponse: (response: BackendCompany[]) => {
        return response.map(company => ({
          ticker: company.ticker,
          name: company.name,
          sector: company.sector || 'Unknown',
          close: 0,
          date: new Date().toISOString(),
          open: 0,
          high: 0,
          low: 0,
          volume: 0
        }));
      }
    }),
    
    getCompanyByTicker: builder.query<Stock, string>({
      query: (ticker) => `/companies/${ticker}`,
      providesTags: ['StockData'],
      transformResponse: (response: BackendCompany) => ({
        ticker: response.ticker,
        name: response.name,
        sector: response.sector || 'Unknown',
        close: 0,
        date: new Date().toISOString(),
        open: 0,
        high: 0,
        low: 0,
        volume: 0
      })
    }),
    
    // Stock price endpoints
    getLatestPrice: builder.query<Stock, string>({
      query: (ticker) => `/stocks/${ticker}/price`,
      providesTags: ['StockData'],
      transformResponse: (response: BackendStockPrice) => ({
        ticker: response.ticker,
        name: response.name || response.ticker,
        sector: response.sector || 'Unknown',
        close: safeParseFloat(response.close || response.price),
        date: response.date || new Date().toISOString(),
        open: safeParseFloat(response.open),
        high: safeParseFloat(response.high),
        low: safeParseFloat(response.low),
        volume: safeParseInt(response.volume)
      })
    }),
    
    getHistoricalPrices: builder.query<StockHistory[], { ticker: string; period: string }>({
      query: ({ ticker, period }) => `/stocks/${ticker}/history?range=${period}`,
      providesTags: ['StockData'],
      transformResponse: (response: BackendHistoricalPrice[]) => {
        return response.map(item => ({
          date: item.date,
          close: safeParseFloat(item.close),
          open: safeParseFloat(item.open || item.close),
          high: safeParseFloat(item.high || item.close),
          low: safeParseFloat(item.low || item.close),
          volume: safeParseInt(item.volume)
        }));
      }
    }),
    
    getPriceChartData: builder.query<StockHistory[], { ticker: string; period: string }>({
      query: ({ ticker, period }) => `/stocks/${ticker}/chart?range=${period}`,
      providesTags: ['StockData'],
      transformResponse: (response: BackendHistoricalPrice[] | BackendChartData) => {
        // Handle both array and object responses
        if (Array.isArray(response)) {
          return response.map(item => ({
            date: item.date,
            close: safeParseFloat(item.close),
            open: safeParseFloat(item.open || item.close),
            high: safeParseFloat(item.high || item.close),
            low: safeParseFloat(item.low || item.close),
            volume: safeParseInt(item.volume)
          }));
        } else if (response.dates && response.prices) {
          // Handle the format your backend actually returns
          return response.dates.map((date: string, index: number) => ({
            date,
            close: safeParseFloat(response.prices?.[index]),
            open: safeParseFloat(response.prices?.[index]),
            high: safeParseFloat(response.prices?.[index]),
            low: safeParseFloat(response.prices?.[index]),
            volume: safeParseInt(response.volumes?.[index])
          }));
        }
        return [];
      }
    }),
    
    // Sentiment endpoints
    getLatestSentiment: builder.query<SentimentData, string>({
      query: (ticker) => `/sentiment/${ticker}`,
      providesTags: ['SentimentData'],
      transformResponse: (response: BackendSentimentScore) => ({
        date: response.date,
        sentiment_score: safeParseFloat(response.sentiment_score),
        news_count: safeParseInt(response.news_count)
      })
    }),
    
    getSentimentHistory: builder.query<SentimentData[], { ticker: string; period: string }>({
      query: ({ ticker, period }) => `/sentiment/${ticker}/history?range=${period}`,
      providesTags: ['SentimentData'],
      transformResponse: (response: BackendSentimentScore[]) => {
        return response.map(item => ({
          date: item.date,
          sentiment_score: safeParseFloat(item.sentiment_score),
          news_count: safeParseInt(item.news_count)
        }));
      }
    }),
    
    getSentimentChartData: builder.query<SentimentData[], { ticker: string; period: string }>({
      query: ({ ticker, period }) => `/sentiment/${ticker}/chart?range=${period}`,
      providesTags: ['SentimentData'],
      transformResponse: (response: BackendSentimentScore[] | BackendSentimentChartData) => {
        // Handle the format your backend returns
        if (Array.isArray(response)) {
          return response.map(item => ({
            date: item.date,
            sentiment_score: safeParseFloat(item.sentiment_score),
            news_count: safeParseInt(item.news_count)
          }));
        } else if (response.dates && response.scores) {
          return response.dates.map((date: string, index: number) => ({
            date,
            sentiment_score: safeParseFloat(response.scores?.[index]),
            news_count: safeParseInt(response.newsCounts?.[index])
          }));
        }
        return [];
      }
    }),
    
    getHeadlinesWithSentiment: builder.query<NewsHeadlinesResponse, { ticker: string; limit?: number }>({
      query: ({ ticker, limit = 10 }) => `/sentiment/${ticker}/headlines?limit=${limit}`,
      providesTags: ['SentimentData'],
      transformResponse: (response: BackendHeadlinesResponse): NewsHeadlinesResponse => ({
        headlines: (response.headlines || []).map((item: BackendNewsHeadline) => ({
          headline: item.headline,
          source: item.source || 'Unknown',
          published_at: item.published_at,
          url: item.url || '#'
        })),
        aiInsights: response.aiInsights
      })
    }),
    
    // Prediction endpoints
    getLatestPredictions: builder.query<PredictionDataPoint, string>({
      query: (ticker) => `/predictions/${ticker}`,
      providesTags: ['PredictionData'],
      transformResponse: (response: BackendPrediction[]) => {
        const latest = response[0] || {} as BackendPrediction;
        return {
          date: latest.date || new Date().toISOString(),
          predicted_price: safeParseFloat(latest.predicted_price),
          confidence_score: safeParseFloat(latest.confidence_score),
          predicted_direction: latest.predicted_direction || 'NEUTRAL'
        };
      }
    }),
    
    getPredictionConfidenceData: builder.query<PredictionDataPoint[], { ticker: string; limit?: number }>({
      query: ({ ticker, limit = 20 }) => `/predictions/${ticker}/confidence?limit=${limit}`,
      providesTags: ['PredictionData'],
      transformResponse: (response: BackendPredictionConfidence) => {
        if (response.dates && response.confidence) {
          return response.dates.map((date: string, index: number) => ({
            date,
            predicted_price: 0,
            confidence_score: safeParseFloat(response.confidence?.[index]),
            predicted_direction: 'NEUTRAL' as const
          }));
        }
        return [];
      }
    }),
    
    getCombinedPredictionsVisualization: builder.query<CombinedPredictionData, string>({
      query: (ticker) => `/predictions/${ticker}/combined`,
      providesTags: ['PredictionData'],
      transformResponse: (response: BackendCombinedPrediction) => ({
        technical: response.technical ? {
          predictedPrice: safeParseFloat(response.technical.predictedPrice),
          predictedDirection: response.technical.predictedDirection || 'NEUTRAL',
          confidenceScore: safeParseFloat(response.technical.confidenceScore)
        } : null,
        sentiment: response.sentiment ? {
          predictedPrice: safeParseFloat(response.sentiment.predictedPrice),
          predictedDirection: response.sentiment.predictedDirection || 'NEUTRAL',
          confidenceScore: safeParseFloat(response.sentiment.confidenceScore)
        } : null,
        combined: response.combined ? {
          predictedPrice: safeParseFloat(response.combined.predictedPrice),
          predictedDirection: response.combined.predictedDirection || 'NEUTRAL',
          confidenceScore: safeParseFloat(response.combined.confidenceScore)
        } : null
      })
    }),

    // Portfolio Analysis with Real Gemini AI
    analyzePortfolio: builder.mutation<PortfolioAnalysisResponse, PortfolioAnalysisRequest>({
      query: (data) => ({
        url: '/portfolio/analyze',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

// Portfolio Analysis Types
interface PortfolioAnalysisRequest {
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
  }>;
  riskTolerance: 'conservative' | 'neutral' | 'aggressive';
}

interface PortfolioAnalysisResponse {
  overallHealth: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  riskAssessment: string;
  diversificationScore: number;
}

// Export hooks for usage in functional components
export const {
  useGetAllCompaniesQuery,
  useSearchCompaniesQuery,
  useGetCompanyByTickerQuery,
  useGetLatestPriceQuery,
  useGetHistoricalPricesQuery,
  useGetPriceChartDataQuery,
  useGetLatestSentimentQuery,
  useGetSentimentHistoryQuery,
  useGetSentimentChartDataQuery,
  useGetHeadlinesWithSentimentQuery,
  useGetLatestPredictionsQuery,
  useGetPredictionConfidenceDataQuery,
  useGetCombinedPredictionsVisualizationQuery,
  useAnalyzePortfolioMutation,
} = api;