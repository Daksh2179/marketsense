// Replace the entire file with this updated version
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import TimePeriodControls from '../components/common/TimePeriodControls';
import ModeToggle from '../components/common/ModeToggle';

import PriceChart from '../components/charts/PriceChart';
import SentimentChart from '../components/charts/SentimentChart';
import ComparativeChart from '../components/charts/ComparativeChart';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import DataErrorBoundary from '../components/common/DataErrorBoundary';
import { useGetCompanyByTickerQuery, useGetLatestPriceQuery } from '../services/api';

const Dashboard: React.FC = () => {
  // Get symbol from URL params if available
  const { symbol: urlSymbol } = useParams<{ symbol?: string }>();
  const navigate = useNavigate();
  
  const [symbol] = useState<string>(urlSymbol || 'AAPL');
  const [mode, setMode] = useState<'predict' | 'sense'>('predict');
  const [period, setPeriod] = useState('1M');
  
  // Fetch company data
  const { 
    data: companyData, 
    isLoading: isCompanyLoading,
    error: companyError,
    refetch: refetchCompany
  } = useGetCompanyByTickerQuery(symbol, { 
    skip: !symbol,
  });
  
  // Fetch latest price data
  const { 
    data: priceData, 
    isLoading: isPriceLoading,
    error: priceError,
    refetch: refetchPrice
  } = useGetLatestPriceQuery(symbol, { 
    skip: !symbol,
  });
  
  // Update URL when symbol changes
  useEffect(() => {
    if (symbol && symbol !== urlSymbol) {
      navigate(`/dashboard/${symbol}`);
    }
  }, [symbol, urlSymbol, navigate]);
  
  // // Handle company selection from search
  // const handleCompanySelect = (selectedSymbol: string) => {
  //   setSymbol(selectedSymbol);
  // };
  
  // Handle retry on error
  const handleRetry = () => {
    refetchCompany();
    refetchPrice();
  };
  
  // Loading state
  if (isCompanyLoading || isPriceLoading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-neutral-dark">Loading {symbol} data...</p>
        </div>
      </MainLayout>
    );
  }
  
  // Error state - only show if both requests failed
  if (companyError && priceError) {
    return (
      <MainLayout>
        <div className="max-w-md mx-auto mt-16">
          <ErrorMessage 
            message={`Error loading data for ${symbol}. Please try again.`}
            onRetry={handleRetry}
          />
        </div>
      </MainLayout>
    );
  }
  
  // Use available data or fallbacks
  const currentPrice = priceData?.close || 0;
  const previousClose = priceData?.open || currentPrice;
  const priceChange = currentPrice - previousClose;
  const priceChangePercent = previousClose ? (priceChange / previousClose) * 100 : 0;
  
  // Use company name from either source
  const companyName = companyData?.name || priceData?.name || symbol;
  const sector = companyData?.sector || priceData?.sector || 'Unknown';
  
  return (
    <MainLayout>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <div className="flex items-center">
  <h2 className="text-2xl font-bold text-neutral-darkest mr-4">
    {companyName} ({symbol})
  </h2>
</div>
            <div className="flex items-center mt-1">
              <span className="text-xl font-semibold">${currentPrice.toFixed(2)}</span>
              <span className={`ml-2 ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
          <div className="mt-4 sm:mt-0 space-y-2 sm:space-y-0 sm:space-x-4 flex flex-col sm:flex-row">
            <TimePeriodControls onPeriodChange={setPeriod} />
            <ModeToggle onModeChange={setMode} />
          </div>
        </div>
        
        {/* Display current selected period */}
        <div className="mb-4">
          <span className="text-sm text-neutral">Current time period: <strong>{period}</strong></span>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <DataErrorBoundary>
              <PriceChart 
                symbol={symbol}
                period={period}
                basePrice={currentPrice}
              />
            </DataErrorBoundary>
          </div>
          <div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-neutral-light h-80">
              <h3 className="text-lg font-medium mb-4">Company Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-neutral">Sector</p>
                  <p className="font-medium">{sector}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral">Latest Price</p>
                  <p className="font-medium">${currentPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral">Daily Change</p>
                  <p className={`font-medium ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral">Volume</p>
                  <p className="font-medium">{priceData?.volume?.toLocaleString() || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral">Open / Close</p>
                  <p className="font-medium">${priceData?.open?.toFixed(2) || 'N/A'} / ${priceData?.close?.toFixed(2) || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral">High / Low</p>
                  <p className="font-medium">${priceData?.high?.toFixed(2) || 'N/A'} / ${priceData?.low?.toFixed(2) || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {mode === 'sense' ? (
            <>
              <DataErrorBoundary>
                <SentimentChart 
                  symbol={symbol}
                  period={period}
                />
              </DataErrorBoundary>
              <DataErrorBoundary>
                <ComparativeChart 
                  symbol={symbol}
                  period={period}
                  basePrice={currentPrice}
                />
              </DataErrorBoundary>
            </>
          ) : (
            <>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-neutral-light h-80">
                <h3 className="text-lg font-medium mb-4">Technical Indicators</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-neutral mb-1">RSI (14-Day)</p>
                    <div className="h-2 bg-neutral-light rounded overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: '58%' }}></div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-neutral">Oversold</span>
                      <span className="text-xs text-neutral">Overbought</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-neutral mb-1">MACD</p>
                    <div className="h-2 bg-neutral-light rounded overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: '65%' }}></div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-neutral">Bearish</span>
                      <span className="text-xs text-neutral">Bullish</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-neutral-light h-80">
                <h3 className="text-lg font-medium mb-4">Price Prediction Metrics</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-neutral mb-1">Predicted Price Range (Next 7 Days)</p>
                    <p className="font-medium">${(currentPrice * 0.98).toFixed(2)} - ${(currentPrice * 1.03).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral mb-1">Confidence Level</p>
                    <p className="font-medium">85%</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral mb-1">Historical Accuracy</p>
                    <div className="h-2 bg-neutral-light rounded overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: '84%' }}></div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-neutral">0%</span>
                      <span className="text-xs text-neutral">100%</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;