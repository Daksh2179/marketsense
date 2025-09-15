// Type definitions for database results
export interface DatabaseRow {
  [key: string]: any;
}

export interface PredictionRow extends DatabaseRow {
  id: number;
  ticker: string;
  date: string;
  target_date: string;
  predicted_price: string | number;
  predicted_direction: string;
  confidence_score: string | number;
  prediction_type: string;
  accuracy_score?: string | number;
  created_at: string;
  updated_at: string;
}

export interface SentimentRow extends DatabaseRow {
  id: number;
  ticker: string;
  date: string;
  sentiment_score: string | number;
  sentiment_magnitude?: string | number;
  news_count: string | number;
  positive_count?: number;
  negative_count?: number;
  neutral_count?: number;
  buzz_score?: string | number;
  created_at: string;
}

export interface StockPriceRow extends DatabaseRow {
  id: number;
  ticker: string;
  date: string;
  open: string | number;
  high: string | number;
  low: string | number;
  close: string | number;
  volume: string | number;
  adjusted_close?: string | number;
  created_at: string;
}

export interface NewsHeadlineRow extends DatabaseRow {
  id: number;
  ticker: string;
  headline: string;
  source?: string;
  url?: string;
  published_at: string;
  created_at: string;
}

export interface TableInfoRow extends DatabaseRow {
  table_name: string;
}