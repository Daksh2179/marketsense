/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import TimePeriodControls from '../components/common/TimePeriodControls';
import ModeToggle from '../components/common/ModeToggle';
import PriceChart from '../components/charts/PriceChart';
import SentimentChart from '../components/charts/SentimentChart';
import ComparativeChart from '../components/charts/ComparativeChart';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import DataErrorBoundary from '../components/common/DataErrorBoundary';
import { motion } from 'framer-motion';
import { 
  useGetCompanyByTickerQuery, 
  useGetLatestPriceQuery,
  useGetLatestSentimentQuery,
  useGetPriceChartDataQuery,
  useGenerateMLPredictionsMutation
} from '../services/api';

const Dashboard: React.FC = () => {
  const { symbol: urlSymbol } = useParams<{ symbol?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [currentSymbol, setCurrentSymbol] = useState<string>(urlSymbol || 'AAPL');
  const [mode, setMode] = useState<'predict' | 'sense'>('predict');
  const [period, setPeriod] = useState('1M');
  
  // Watch for URL changes
  useEffect(() => {
    if (urlSymbol && urlSymbol !== currentSymbol) {
      setCurrentSymbol(urlSymbol);
      setMode('predict');
      setPeriod('1M');
    }
  }, [urlSymbol, currentSymbol]);
  
  useEffect(() => {
    if (currentSymbol && !urlSymbol) {
      navigate(`/dashboard/${currentSymbol}`, { replace: true });
    }
  }, [currentSymbol, urlSymbol, navigate]);
  
  // API calls
  const { 
    data: companyData, 
    isLoading: isCompanyLoading,
    error: companyError,
    refetch: refetchCompany
  } = useGetCompanyByTickerQuery(currentSymbol, { 
    skip: !currentSymbol,
    refetchOnMountOrArgChange: true,
  });
  
  const { 
    data: priceData, 
    isLoading: isPriceLoading,
    error: priceError,
    refetch: refetchPrice
  } = useGetLatestPriceQuery(currentSymbol, { 
    skip: !currentSymbol,
    refetchOnMountOrArgChange: true,
  });

  const { 
    data: sentimentData,
    isLoading: isSentimentLoading
  } = useGetLatestSentimentQuery(currentSymbol, {
    skip: !currentSymbol,
    refetchOnMountOrArgChange: true,
  });

  const { 
    data: chartData 
  } = useGetPriceChartDataQuery({ ticker: currentSymbol, period: '1M' }, {
    skip: !currentSymbol,
    refetchOnMountOrArgChange: true,
  });

  const [generateMLPredictions, { data: mlData, isLoading: isMLLoading, error: mlError }] = useGenerateMLPredictionsMutation();
  
  // Loading state
  if (isCompanyLoading || isPriceLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-8"
          >
            <LoadingSpinner size="large" />
            <h3 className="mt-4 text-xl font-semibold text-gray-700">Loading {currentSymbol}</h3>
            <p className="mt-2 text-gray-500">Getting latest market data...</p>
          </motion.div>
        </div>
      </MainLayout>
    );
  }
  
  // Error state
  if (companyError && priceError) {
    return (
      <MainLayout>
        <div className="p-4">
          <div className="max-w-md mx-auto mt-16">
            <ErrorMessage 
              message={`Could not load ${currentSymbol}. Try another company.`}
              onRetry={() => {
                refetchCompany();
                refetchPrice();
              }}
            />
            <div className="mt-4 text-center">
              <button
                onClick={() => navigate('/dashboard/AAPL')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                View Apple Instead
              </button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  // Calculate data
  const currentPrice = priceData?.close || 0;
  const previousClose = priceData?.open || currentPrice;
  const priceChange = currentPrice - previousClose;
  const priceChangePercent = previousClose ? (priceChange / previousClose) * 100 : 0;
  const companyName = companyData?.name || priceData?.name || currentSymbol;
  const sector = companyData?.sector || priceData?.sector || 'Unknown';
  const volume = priceData?.volume || 0;
  const high = priceData?.high || currentPrice;
  const low = priceData?.low || currentPrice;

  // Technical calculations
  const calculateRSI = () => {
    if (!chartData || chartData.length < 14) return 50;
    const prices = chartData.map(d => d.close).slice(-14);
    const changes = prices.slice(1).map((price, i) => price - prices[i]);
    const gains = changes.filter(change => change > 0);
    const losses = changes.filter(change => change < 0).map(loss => Math.abs(loss));
    const avgGain = gains.length ? gains.reduce((sum, gain) => sum + gain, 0) / gains.length : 0;
    const avgLoss = losses.length ? losses.reduce((sum, loss) => sum + loss, 0) / losses.length : 1;
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    return isNaN(rsi) ? 50 : Math.max(0, Math.min(100, rsi));
  };

  const rsi = calculateRSI();

  const getSentimentColor = (score: number) => {
    if (score > 0.3) return 'bg-emerald-100 text-emerald-700 border-emerald-300';
    if (score > 0) return 'bg-green-100 text-green-700 border-green-300';
    if (score > -0.3) return 'bg-orange-100 text-orange-700 border-orange-300';
    return 'bg-red-100 text-red-700 border-red-300';
  };

  return (
    <MainLayout>
      {/* MOBILE-FIRST CONTAINER - NO OVERFLOW */}
      <div className="w-full max-w-none px-0">
        
        {/* Compact Header - Mobile Optimized */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                {currentSymbol}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold text-gray-800 truncate">{companyName}</h1>
                <p className="text-sm text-gray-500">{sector}</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-800">${currentPrice.toFixed(2)}</div>
                <div className={`text-sm font-medium ${priceChange >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)} ({priceChangePercent.toFixed(1)}%)
                </div>
              </div>
              {sentimentData && (
                <div className={`px-3 py-2 rounded-lg border text-sm font-medium ${getSentimentColor(sentimentData.sentiment_score)}`}>
                  {sentimentData.sentiment_score > 0 ? '📈' : '📉'} {sentimentData.sentiment_score.toFixed(2)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <TimePeriodControls onPeriodChange={setPeriod} />
          </div>
          <ModeToggle onModeChange={setMode} />
        </div>

        {/* Stats Grid - Mobile Responsive */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
            <p className="text-xs text-gray-500 mb-1">High</p>
            <p className="text-lg font-bold text-gray-800">${high.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
            <p className="text-xs text-gray-500 mb-1">Low</p>
            <p className="text-lg font-bold text-gray-800">${low.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
            <p className="text-xs text-gray-500 mb-1">RSI</p>
            <p className={`text-lg font-bold ${
              rsi > 70 ? 'text-red-500' : rsi < 30 ? 'text-green-500' : 'text-gray-800'
            }`}>
              {rsi.toFixed(1)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
            <p className="text-xs text-gray-500 mb-1">Volume</p>
            <p className="text-lg font-bold text-gray-800">
              {volume > 1000000 ? `${(volume/1000000).toFixed(1)}M` : 
               volume > 1000 ? `${(volume/1000).toFixed(0)}K` : 
               volume.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Main Chart - Full Width, No Overflow */}
        <div className="mb-6">
          <DataErrorBoundary>
            <PriceChart 
              symbol={currentSymbol}
              period={period}
              basePrice={currentPrice}
              mlPredictions={mlData?.predictions}
            />
          </DataErrorBoundary>
        </div>

        {/* Content Based on Mode */}
        {mode === 'sense' ? (
          /* Sense Mode - Stacked Layout for Mobile */
          <div className="space-y-6">
            <DataErrorBoundary>
              <SentimentChart 
                symbol={currentSymbol}
                period={period}
              />
            </DataErrorBoundary>
            <DataErrorBoundary>
              <ComparativeChart 
                symbol={currentSymbol}
                period={period}
                basePrice={currentPrice}
              />
            </DataErrorBoundary>
          </div>
        ) : (
          /* Predict Mode - Unique Card Layout */
          <div className="space-y-6">
            
            {/* Technical Indicators - Horizontal Layout */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                📊 Technical Signals
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">Live</span>
              </h3>
              
              {/* RSI Gauge */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">RSI (14-day)</span>
                  <span className={`font-bold ${
                    rsi > 70 ? 'text-red-500' : rsi < 30 ? 'text-green-500' : 'text-gray-800'
                  }`}>
                    {rsi.toFixed(1)}
                  </span>
                </div>
                <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div 
                    className={`h-full rounded-full ${
                      rsi > 70 ? 'bg-red-500' : rsi < 30 ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    initial={{ width: "0%" }}
                    animate={{ width: `${rsi}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                  <div className="absolute top-0 left-[30%] w-px h-full bg-white opacity-60"></div>
                  <div className="absolute top-0 left-[70%] w-px h-full bg-white opacity-60"></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Oversold</span>
                  <span className="font-medium">
                    {rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral'}
                  </span>
                  <span>Overbought</span>
                </div>
              </div>

              {/* Support/Resistance - Simple Layout */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-red-50 p-3 rounded-lg border border-red-200 text-center">
                  <p className="text-xs text-red-600 mb-1">Resistance</p>
                  <p className="font-bold text-red-700">${(currentPrice * 1.05).toFixed(2)}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-center">
                  <p className="text-xs text-blue-600 mb-1">Current</p>
                  <p className="font-bold text-blue-700">${currentPrice.toFixed(2)}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg border border-green-200 text-center">
                  <p className="text-xs text-green-600 mb-1">Support</p>
                  <p className="font-bold text-green-700">${(currentPrice * 0.95).toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Sentiment Analysis - Clean Card */}
            {sentimentData && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  🧠 Market Sentiment
                  <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-600 text-xs rounded-full">AI</span>
                </h3>
                
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${getSentimentColor(sentimentData.sentiment_score)}`}>
                      {sentimentData.sentiment_score > 0.3 ? '🚀' :
                       sentimentData.sentiment_score > 0 ? '✅' :
                       sentimentData.sentiment_score > -0.3 ? '⚠️' : '❌'}
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{sentimentData.sentiment_score.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">Based on {sentimentData.news_count} articles</p>
                    </div>
                  </div>
                  
                  <div className="text-center sm:text-right">
                    <p className="text-sm text-gray-500 mb-1">Sentiment Trend</p>
                    <p className={`font-semibold ${
                      sentimentData.sentiment_score > 0.3 ? 'text-green-600' :
                      sentimentData.sentiment_score > 0 ? 'text-blue-600' :
                      sentimentData.sentiment_score > -0.3 ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {sentimentData.sentiment_score > 0.3 ? 'Very Positive' :
                       sentimentData.sentiment_score > 0 ? 'Positive' :
                       sentimentData.sentiment_score > -0.3 ? 'Negative' : 'Very Negative'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ML Predictions - Compact Design */}
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl shadow-sm border border-blue-200 p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">🤖 AI Predictions</h3>
                  <p className="text-sm text-gray-600">
                    {mlData ? 'Enhanced LSTM with sentiment' : 'Generate ML forecasts for ' + currentSymbol}
                  </p>
                </div>
                
                <button
                  onClick={() => generateMLPredictions({ ticker: currentSymbol, prediction_days: 7 })}
                  disabled={isMLLoading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium flex items-center"
                >
                  {isMLLoading ? (
                    <>
                      <LoadingSpinner size="small" />
                      <span className="ml-2">Training...</span>
                    </>
                  ) : (
                    '🚀 Generate Forecast'
                  )}
                </button>
              </div>

              {mlData ? (
                <div className="space-y-4">
                  {/* Prediction Result */}
                  <div className="bg-white p-4 rounded-lg border border-blue-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Tomorrow's Prediction</p>
                        <p className="text-2xl font-bold text-blue-600">
                          ${mlData.predictions[0]?.predicted_price.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 mb-1">Confidence</p>
                        <p className="text-lg font-bold text-gray-800">
                          {mlData.predictions[0]?.confidence.toFixed(1)}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-1">Change</p>
                        <p className={`text-lg font-bold ${
                          mlData.predictions[0]?.predicted_price > currentPrice ? 'text-green-600' : 'text-red-500'
                        }`}>
                          {mlData.predictions[0]?.predicted_price > currentPrice ? '+' : ''}
                          {((mlData.predictions[0]?.predicted_price - currentPrice) / currentPrice * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Model Info */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700 mb-2">
                      <strong>Model:</strong> {mlData.sentiment_analysis.analysis}
                    </p>
                    <div className="flex flex-wrap gap-4 text-xs text-blue-600">
                      <span>Training: {mlData.model_metrics.training_data_points} days</span>
                      <span>Sentiment: {mlData.model_metrics.sentiment_data_points} points</span>
                      <span>Type: Enhanced LSTM</span>
                    </div>
                  </div>
                </div>
              ) : mlError ? (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-center">
                  <p className="text-red-700 mb-3">❌ ML service unavailable</p>
                  <button
                    onClick={() => generateMLPredictions({ ticker: currentSymbol, prediction_days: 7 })}
                    className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm"
                  >
                    🔄 Retry
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">🤖</div>
                  <p className="text-gray-600 mb-4">Ready to generate AI predictions for {currentSymbol}</p>
                  <p className="text-sm text-gray-500">
                    Using {chartData?.length || 0} days of historical data
                  </p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/companies/${currentSymbol}/refresh`, {
                    method: 'POST'
                  }).then(() => {
                    refetchCompany();
                    refetchPrice();
                  }).catch(console.error);
                }}
                className="flex-1 px-4 py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium transition-colors text-center"
              >
                🔄 Refresh Data
              </button>
              <button
                onClick={() => navigate('/companies')}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors text-center"
              >
                🔍 Compare Companies
              </button>
              <button
                onClick={() => navigate('/watchlist')}
                className="flex-1 px-4 py-3 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg font-medium transition-colors text-center"
              >
                ⭐ Add to Portfolio
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-6 text-sm text-gray-500">
          <p>Analyzing {currentSymbol} • Updated {new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;