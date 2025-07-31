import React, { useState, useEffect } from 'react';
import { useGetLatestPriceQuery, useGetLatestSentimentQuery } from '../../services/api';
import LoadingSpinner from './LoadingSpinner';
import SmartCompanySearch from './SmartCompanySearch';
import { motion, AnimatePresence } from 'framer-motion';

interface SelectedCompany {
  ticker: string;
  name: string;
  sector?: string;
}

interface CompanyData {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  sentiment: number;
  volume: number;
  sector: string;
  isLoading: boolean;
}

const CompanyComparison: React.FC = () => {
  const [selectedCompanies, setSelectedCompanies] = useState<SelectedCompany[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  // Get data for selected companies (using individual hooks)
  const company1 = selectedCompanies[0];
  const company2 = selectedCompanies[1];
  const company3 = selectedCompanies[2];
  const company4 = selectedCompanies[3];

  const company1Price = useGetLatestPriceQuery(company1?.ticker, { skip: !company1 });
  const company1Sentiment = useGetLatestSentimentQuery(company1?.ticker, { skip: !company1 });
  
  const company2Price = useGetLatestPriceQuery(company2?.ticker, { skip: !company2 });
  const company2Sentiment = useGetLatestSentimentQuery(company2?.ticker, { skip: !company2 });
  
  const company3Price = useGetLatestPriceQuery(company3?.ticker, { skip: !company3 });
  const company3Sentiment = useGetLatestSentimentQuery(company3?.ticker, { skip: !company3 });
  
  const company4Price = useGetLatestPriceQuery(company4?.ticker, { skip: !company4 });
  const company4Sentiment = useGetLatestSentimentQuery(company4?.ticker, { skip: !company4 });

  // Auto-refresh data for companies without price data
  useEffect(() => {
    selectedCompanies.forEach(company => {
      // Check if company has no price data, trigger refresh
      const hasNoData = !company1Price.data?.close && company.ticker === company1?.ticker ||
                       !company2Price.data?.close && company.ticker === company2?.ticker ||
                       !company3Price.data?.close && company.ticker === company3?.ticker ||
                       !company4Price.data?.close && company.ticker === company4?.ticker;
      
      if (hasNoData) {
        // Trigger background data refresh
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/companies/${company.ticker}/refresh`, {
          method: 'POST'
        }).then(() => {
          console.log(`Refreshing data for ${company.ticker}`);
        }).catch(error => {
          console.log(`Background refresh for ${company.ticker}:`, error.message);
        });
      }
    });
  }, [selectedCompanies, company1Price.data, company2Price.data, company3Price.data, company4Price.data, company1, company2, company3, company4]);

  const handleAddCompany = (company: { ticker: string; name: string; sector?: string }) => {
    if (selectedCompanies.length >= 4) {
      alert('Maximum 4 companies can be compared at once');
      return;
    }
    
    if (selectedCompanies.find(c => c.ticker === company.ticker)) {
      alert('Company already selected');
      return;
    }

    setSelectedCompanies([...selectedCompanies, { 
      ticker: company.ticker, 
      name: company.name,
      sector: company.sector 
    }]);
    setShowSearch(false);
  };

  const handleRemoveCompany = (ticker: string) => {
    setSelectedCompanies(selectedCompanies.filter(c => c.ticker !== ticker));
  };

  const clearAll = () => {
    setSelectedCompanies([]);
  };

  // Process company data
  const companyData: CompanyData[] = selectedCompanies.map((company, index) => {
    let priceData, sentimentData, isLoading;
    
    switch (index) {
      case 0:
        priceData = company1Price.data;
        sentimentData = company1Sentiment.data;
        isLoading = company1Price.isLoading || company1Sentiment.isLoading;
        break;
      case 1:
        priceData = company2Price.data;
        sentimentData = company2Sentiment.data;
        isLoading = company2Price.isLoading || company2Sentiment.isLoading;
        break;
      case 2:
        priceData = company3Price.data;
        sentimentData = company3Sentiment.data;
        isLoading = company3Price.isLoading || company3Sentiment.isLoading;
        break;
      case 3:
        priceData = company4Price.data;
        sentimentData = company4Sentiment.data;
        isLoading = company4Price.isLoading || company4Sentiment.isLoading;
        break;
      default:
        priceData = null;
        sentimentData = null;
        isLoading = false;
    }

    return {
      ticker: company.ticker,
      name: company.name,
      price: priceData?.close || 0,
      change: priceData ? (priceData.close - priceData.open) : 0,
      changePercent: priceData ? ((priceData.close - priceData.open) / priceData.open) * 100 : 0,
      sentiment: sentimentData?.sentiment_score || 0,
      volume: priceData?.volume || 0,
      sector: company.sector || priceData?.sector || 'Unknown',
      isLoading
    };
  });

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.5) return 'text-green-600 bg-green-50 border-green-200';
    if (sentiment > 0) return 'text-green-500 bg-green-50 border-green-200';
    if (sentiment > -0.5) return 'text-orange-500 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getSentimentIcon = (sentiment: number) => {
    if (sentiment > 0.5) return '🚀';
    if (sentiment > 0) return '✅';
    if (sentiment > -0.5) return '⚠️';
    return '❌';
  };

  const generateAIInsights = () => {
    if (companyData.length === 0) return [];
    
    const insights = [];
    
    // Sector analysis
    const sectors = [...new Set(companyData.map(c => c.sector).filter(s => s !== 'Unknown'))];
    if (sectors.length === 1) {
      insights.push(`All companies are in ${sectors[0]} sector - consider diversification`);
    } else if (sectors.length > 1) {
      insights.push(`Good sector diversification across ${sectors.join(', ')}`);
    }

    // Sentiment analysis
    const validSentiments = companyData.filter(c => c.sentiment !== 0);
    if (validSentiments.length > 0) {
      const avgSentiment = validSentiments.reduce((sum, c) => sum + c.sentiment, 0) / validSentiments.length;
      if (avgSentiment > 0.3) {
        insights.push('Overall positive sentiment across selections');
      } else if (avgSentiment < -0.3) {
        insights.push('Negative sentiment trend - exercise caution');
      }
    }

    // Performance analysis
    const companiesWithPrices = companyData.filter(c => c.price > 0);
    if (companiesWithPrices.length > 0) {
      const positivePerformers = companiesWithPrices.filter(c => c.changePercent > 0).length;
      if (positivePerformers === companiesWithPrices.length) {
        insights.push('All companies showing positive momentum today');
      } else if (positivePerformers === 0) {
        insights.push('Market headwinds affecting all selections');
      }
    }

    // Valuation insight
    const highSentiment = companyData.find(c => c.sentiment > 0.5);
    if (highSentiment) {
      insights.push(`${highSentiment.ticker} showing strongest sentiment signals`);
    }

    return insights.slice(0, 3); // Max 3 insights
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-light">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">🔍 Company Research Hub</h2>
            <p className="text-gray-600">Compare up to 4 companies side-by-side with AI-powered insights</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all duration-200 font-medium shadow-sm flex items-center"
            >
              <span className="mr-2">+</span>
              Add Company
            </button>
            
            {selectedCompanies.length > 0 && (
              <button
                onClick={clearAll}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Smart Search Interface */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6"
            >
              <SmartCompanySearch
                onSelect={handleAddCompany}
                placeholder="Search any company... (try: Google, Tesla, Apple, NVIDIA, Airbnb)"
                maxResults={6}
                className="max-w-2xl"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected Companies Tags */}
        {selectedCompanies.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="text-sm font-medium text-gray-600 py-2">Selected Companies:</span>
            {selectedCompanies.map((company) => (
              <motion.div
                key={company.ticker}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 px-4 py-2 rounded-full text-sm border border-blue-200"
              >
                <span className="font-bold">{company.ticker}</span>
                <span className="ml-2 text-blue-600">•</span>
                <span className="ml-2 truncate max-w-32">{company.name}</span>
                <button
                  onClick={() => handleRemoveCompany(company.ticker)}
                  className="ml-3 text-blue-600 hover:text-red-600 font-bold transition-colors"
                >
                  ×
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Comparison Table */}
      {selectedCompanies.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-light">
          <h3 className="text-xl font-bold mb-6 text-gray-800">📊 Side-by-Side Comparison</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-6 font-bold text-gray-700 bg-gray-50">Metric</th>
                  {selectedCompanies.map((company) => (
                    <th key={company.ticker} className="text-center py-4 px-6 font-bold text-gray-700 bg-gray-50">
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-xl text-primary">{company.ticker}</span>
                        <span className="text-xs text-gray-500 font-normal truncate max-w-28 mt-1">
                          {company.name}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-gray-700">Price</td>
                  {companyData.map((data) => (
                    <td key={data.ticker} className="py-4 px-6 text-center">
                      {data.isLoading ? (
                        <LoadingSpinner size="small" />
                      ) : data.price > 0 ? (
                        <span className="font-bold text-xl text-gray-800">
                          ${data.price.toFixed(2)}
                        </span>
                      ) : (
                        <div className="text-center">
                          <span className="text-gray-400 text-sm">Refreshing...</span>
                          <div className="text-xs text-blue-600 mt-1">Getting latest data</div>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-gray-700">Daily Change</td>
                  {companyData.map((data) => (
                    <td key={data.ticker} className="py-4 px-6 text-center">
                      {data.isLoading ? (
                        <LoadingSpinner size="small" />
                      ) : data.price > 0 ? (
                        <div className={`px-3 py-2 rounded-full text-sm font-bold border ${
                          data.changePercent >= 0 
                            ? 'bg-green-100 text-green-700 border-green-200' 
                            : 'bg-red-100 text-red-700 border-red-200'
                        }`}>
                          {data.changePercent >= 0 ? '+' : ''}{data.changePercent.toFixed(2)}%
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-gray-700">Sentiment</td>
                  {companyData.map((data) => (
                    <td key={data.ticker} className="py-4 px-6 text-center">
                      {data.isLoading ? (
                        <LoadingSpinner size="small" />
                      ) : (
                        <div className={`px-3 py-2 rounded-full text-sm font-bold border ${getSentimentColor(data.sentiment)}`}>
                          {getSentimentIcon(data.sentiment)} {data.sentiment.toFixed(2)}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-gray-700">Volume</td>
                  {companyData.map((data) => (
                    <td key={data.ticker} className="py-4 px-6 text-center text-gray-600 font-medium">
                      {data.isLoading ? (
                        <LoadingSpinner size="small" />
                      ) : data.volume > 0 ? (
                        data.volume > 1000000 
                          ? `${(data.volume / 1000000).toFixed(1)}M`
                          : data.volume > 1000
                          ? `${(data.volume / 1000).toFixed(0)}K`
                          : data.volume.toString()
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-gray-700">Sector</td>
                  {companyData.map((data) => (
                    <td key={data.ticker} className="py-4 px-6 text-center">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold border border-blue-200">
                        {data.sector}
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Insights */}
      {selectedCompanies.length > 1 && (
        <div className="bg-gradient-to-br from-white to-blue-50 p-6 rounded-xl shadow-sm border border-blue-200">
          <h3 className="text-xl font-bold mb-4 flex items-center text-gray-800">
            🤖 AI Investment Insights
            <span className="ml-3 px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
              Powered by AI
            </span>
          </h3>
          <div className="space-y-3">
            {generateAIInsights().map((insight, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.15 }}
                className="flex items-start p-4 bg-white rounded-lg border-l-4 border-blue-400 shadow-sm"
              >
                <span className="text-blue-500 mr-3 mt-0.5 text-lg">💡</span>
                <span className="text-sm text-gray-700 font-medium leading-relaxed">{insight}</span>
              </motion.div>
            ))}
          </div>
          {generateAIInsights().length === 0 && (
            <div className="text-center py-6">
              <div className="text-gray-400 text-3xl mb-3">🤖</div>
              <p className="text-sm text-gray-500">
                Add more companies to unlock AI-powered insights
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {selectedCompanies.length === 0 && (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-neutral-light text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-lg mx-auto"
          >
            <div className="text-7xl mb-6">📊</div>
            <h3 className="text-2xl font-bold mb-3 text-gray-800">
              Compare Companies Side-by-Side
            </h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Add companies to see detailed comparison with real-time data and AI-powered investment insights. 
              Search for any major company like Apple, Tesla, Google, NVIDIA, or Airbnb.
            </p>
            <button
              onClick={() => setShowSearch(true)}
              className="px-8 py-4 bg-primary text-white rounded-xl hover:bg-primary-dark transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
            >
              🔍 Start Comparing Companies
            </button>
            
            <div className="mt-8 flex justify-center space-x-6 text-sm">
              <span className="flex items-center text-gray-500">
                <span className="w-3 h-3 bg-green-400 rounded-full mr-2"></span>
                Live Market Data
              </span>
              <span className="flex items-center text-gray-500">
                <span className="w-3 h-3 bg-blue-400 rounded-full mr-2"></span>
                AI-Powered Insights
              </span>
              <span className="flex items-center text-gray-500">
                <span className="w-3 h-3 bg-purple-400 rounded-full mr-2"></span>
                Smart Search
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CompanyComparison;