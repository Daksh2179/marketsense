import React, { useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import TimePeriodControls from '../components/common/TimePeriodControls';
import ModeToggle from '../components/common/ModeToggle';
import PriceChart from '../components/charts/PriceChart';
import SentimentChart from '../components/charts/SentimentChart';
import ComparativeChart from '../components/charts/ComparativeChart';

const Dashboard: React.FC = () => {
  const [mode, setMode] = useState<'predict' | 'sense'>('predict');
  const [period, setPeriod] = useState('1M');
  
  // Mock company data
  const companyData = {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 175.42,
    change: 2.35,
    changePercent: 1.36,
    sector: 'Technology',
    industry: 'Consumer Electronics'
  };
  
  return (
    <MainLayout>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-neutral-darkest">{companyData.name} ({companyData.symbol})</h2>
            <div className="flex items-center mt-1">
              <span className="text-xl font-semibold">${companyData.price}</span>
              <span className={`ml-2 ${companyData.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {companyData.change >= 0 ? '+' : ''}{companyData.change} ({companyData.changePercent}%)
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
            <PriceChart 
              symbol={companyData.symbol}
              period={period}
              basePrice={companyData.price}
            />
          </div>
          <div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-neutral-light h-80">
              <h3 className="text-lg font-medium mb-4">Company Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-neutral">Sector</p>
                  <p className="font-medium">{companyData.sector}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral">Industry</p>
                  <p className="font-medium">{companyData.industry}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral">Technical Indicators</p>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <p className="text-xs text-neutral">RSI</p>
                      <p className="font-medium">58.3</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral">MACD</p>
                      <p className="font-medium">2.45</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral">50-Day MA</p>
                      <p className="font-medium">$172.15</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral">200-Day MA</p>
                      <p className="font-medium">$168.32</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {mode === 'sense' ? (
            <>
              <SentimentChart 
                symbol={companyData.symbol}
                period={period}
              />
              <ComparativeChart 
                symbol={companyData.symbol}
                period={period}
                basePrice={companyData.price}
              />
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
                    <p className="font-medium">$172.15 - $180.50</p>
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