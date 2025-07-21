import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Types for our API responses
interface Stock {
  symbol: string;
  companyName: string;
  sector: string;
  price: number;
  priceDate: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface StockHistory {
  date: string;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface PricePrediction {
  date: string;
  predictedPrice: number;
  upperBound: number;
  lowerBound: number;
}

interface SentimentData {
  date: string;
  score: number;
  volume: number;
}

interface SentimentPrediction {
  date: string;
  technicalPrice: number;
  enhancedPrice: number;
  sentimentImpact: number;
}

// Define the base API
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ 
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  }),
  tagTypes: ['StockData', 'SentimentData'],
  endpoints: (builder) => ({
    // Stock endpoints
    getAllStocks: builder.query<Stock[], void>({
      query: () => '/stocks',
      providesTags: ['StockData'],
    }),
    
    getStockBySymbol: builder.query<Stock, string>({
      query: (symbol) => `/stocks/${symbol}`,
      providesTags: ['StockData'],
    }),
    
    getStockHistory: builder.query<StockHistory[], { symbol: string; period: string }>({
      query: ({ symbol, period }) => `/stocks/${symbol}/history?period=${period}`,
      providesTags: ['StockData'],
    }),
    
    getPredictedPrices: builder.query<{ symbol: string; predictions: PricePrediction[] }, string>({
      query: (symbol) => `/stocks/${symbol}/predictions`,
      providesTags: ['StockData'],
    }),
    
    // Sentiment endpoints
    getSentimentBySymbol: builder.query<SentimentData[], { symbol: string; period: string }>({
      query: ({ symbol, period }) => `/sentiment/${symbol}?period=${period}`,
      providesTags: ['SentimentData'],
    }),
    
    getSentimentEnhancedPredictions: builder.query<
      { symbol: string; predictions: SentimentPrediction[] },
      string
    >({
      query: (symbol) => `/sentiment/${symbol}/predictions`,
      providesTags: ['SentimentData'],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useGetAllStocksQuery,
  useGetStockBySymbolQuery,
  useGetStockHistoryQuery,
  useGetPredictedPricesQuery,
  useGetSentimentBySymbolQuery,
  useGetSentimentEnhancedPredictionsQuery,
} = api;