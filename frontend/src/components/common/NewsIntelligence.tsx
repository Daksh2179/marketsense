import React from 'react';
import { useGetHeadlinesWithSentimentQuery } from '../../services/api';
import LoadingSpinner from './LoadingSpinner';
import { motion } from 'framer-motion';

interface NewsIntelligenceProps {
  symbol: string;
}

interface AIInsights {
  positiveSummary: string[];
  negativeSummary: string[];
  keyThemes: { theme: string; sentiment: number }[];
  marketImpact: string;
  overallSentiment: number;
}

const NewsIntelligence: React.FC<NewsIntelligenceProps> = ({ symbol }) => {
  const { 
    data: newsData, 
    isLoading, 
    error,
    refetch 
  } = useGetHeadlinesWithSentimentQuery(
    { ticker: symbol, limit: 10 },
    { refetchOnMountOrArgChange: true }
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-light">
        <div className="flex items-center justify-center h-40">
          <div className="text-center">
            <LoadingSpinner size="medium" />
            <p className="mt-4 text-gray-600 font-medium">🤖 Analyzing news with AI...</p>
            <p className="text-sm text-gray-500 mt-1">Processing headlines and market sentiment</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !newsData) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-light">
        <h3 className="text-lg font-medium mb-4">📰 AI News Intelligence</h3>
        <div className="text-center py-6">
          <div className="text-red-500 text-2xl mb-2">⚠️</div>
          <p className="text-gray-500 mb-4">Unable to load news intelligence for {symbol}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Define the expected structure for newsData
  interface Headline {
    headline: string;
    source: string;
    published_at: string;
    url?: string;
  }

  interface NewsData {
    aiInsights?: AIInsights;
    headlines: Headline[];
  }

  // Extract AI insights or use fallback
  const aiInsights: AIInsights = (newsData as NewsData).aiInsights || {
    positiveSummary: ['No recent positive developments identified'],
    negativeSummary: ['No significant concerns identified'],
    keyThemes: [],
    marketImpact: 'Limited news impact expected on price action',
    overallSentiment: 0
  };

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

  const getSentimentLabel = (sentiment: number) => {
    if (sentiment > 0.5) return 'Very Positive';
    if (sentiment > 0.2) return 'Positive';
    if (sentiment > -0.2) return 'Neutral';
    if (sentiment > -0.5) return 'Negative';
    return 'Very Negative';
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-light">
      {/* Header with Overall Sentiment */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800">📰 AI News Intelligence</h3>
          <p className="text-sm text-gray-600 mt-1">
            Powered by Gemini AI • Based on {newsData.headlines.length} recent articles
          </p>
        </div>
        <div className={`px-4 py-2 rounded-full text-sm font-bold border ${getSentimentColor(aiInsights.overallSentiment)}`}>
          {getSentimentIcon(aiInsights.overallSentiment)} 
          {getSentimentLabel(aiInsights.overallSentiment)}
          <span className="ml-2 text-xs">({aiInsights.overallSentiment.toFixed(2)})</span>
        </div>
      </div>

      {/* AI Summaries Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Positive Summary */}
        <motion.div 
          className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h4 className="font-bold text-green-800 mb-3 flex items-center text-lg">
            ✅ Positive Developments
            <span className="ml-2 bg-green-200 text-green-800 text-xs px-2 py-0.5 rounded-full">
              {aiInsights.positiveSummary.length}
            </span>
          </h4>
          <ul className="space-y-2">
            {aiInsights.positiveSummary.map((item, index) => (
              <motion.li 
                key={index} 
                className="flex items-start text-sm text-green-700"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <span className="text-green-500 mr-2 mt-0.5">•</span>
                <span className="leading-relaxed">{item}</span>
              </motion.li>
            ))}
          </ul>
          {aiInsights.positiveSummary.length === 0 && (
            <p className="text-green-600 text-sm italic">No significant positive developments identified</p>
          )}
        </motion.div>

        {/* Negative Summary */}
        <motion.div 
          className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h4 className="font-bold text-orange-800 mb-3 flex items-center text-lg">
            ⚠️ Key Concerns
            <span className="ml-2 bg-orange-200 text-orange-800 text-xs px-2 py-0.5 rounded-full">
              {aiInsights.negativeSummary.length}
            </span>
          </h4>
          <ul className="space-y-2">
            {aiInsights.negativeSummary.map((item, index) => (
              <motion.li 
                key={index} 
                className="flex items-start text-sm text-orange-700"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <span className="text-orange-500 mr-2 mt-0.5">•</span>
                <span className="leading-relaxed">{item}</span>
              </motion.li>
            ))}
          </ul>
          {aiInsights.negativeSummary.length === 0 && (
            <p className="text-orange-600 text-sm italic">No significant concerns identified</p>
          )}
        </motion.div>
      </div>

      {/* Key Themes */}
      {aiInsights.keyThemes.length > 0 && (
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h4 className="font-bold mb-3 text-gray-800 text-lg">🏷️ Key Themes</h4>
          <div className="flex flex-wrap gap-3">
            {aiInsights.keyThemes.map((theme, index) => (
              <motion.div 
                key={index}
                className={`px-4 py-2 rounded-full text-sm font-bold border ${getSentimentColor(theme.sentiment)}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                {theme.theme} 
                <span className="ml-2 text-xs">
                  ({theme.sentiment > 0 ? '+' : ''}{theme.sentiment.toFixed(1)})
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Market Impact Assessment */}
      <motion.div 
        className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h4 className="font-bold text-blue-800 mb-2 flex items-center text-lg">
          🎯 AI Market Impact Assessment
        </h4>
        <p className="text-sm text-blue-700 leading-relaxed font-medium">
          {aiInsights.marketImpact}
        </p>
      </motion.div>

      {/* Recent Headlines */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h4 className="font-bold mb-3 text-gray-800 text-lg flex items-center">
          📈 Recent Headlines
          <span className="ml-2 bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">
            {newsData.headlines.length}
          </span>
        </h4>
        <div className="space-y-3 max-h-48 overflow-y-auto">
          {newsData.headlines.slice(0, 8).map((headline, index) => (
            <motion.div 
              key={index} 
              className="flex items-start p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.05 }}
              whileHover={{ x: 2 }}
            >
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 font-medium leading-relaxed">
                  {headline.headline}
                </p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <span className="font-medium">{headline.source}</span>
                  <span className="mx-2">•</span>
                  <span>{new Date(headline.published_at).toLocaleDateString()}</span>
                  {headline.url && headline.url !== '#' && (
                    <>
                      <span className="mx-2">•</span>
                      <a 
                        href={headline.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        Read more
                      </a>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* AI Attribution Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center">
            <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
            <span>🤖 AI-powered analysis by Gemini</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
            <button
              onClick={() => refetch()}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsIntelligence;