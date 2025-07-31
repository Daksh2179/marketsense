/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import AnimatedHero from '../components/home/AnimatedHero';
import AnimatedMetrics from '../components/home/AnimatedMetrics';
import StockCard from '../components/home/StockCard';
import TopPerformers from '../components/home/TopPerformers';

// For scrolling sections with fade-in animation
const FadeInSection: React.FC<{children: React.ReactNode, delay?: number}> = ({ children, delay = 0 }) => {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: { duration: 0.6, delay, ease: "easeOut" }
        }
      }}
    >
      {children}
    </motion.div>
  );
};

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  
  const navigateToCompany = (symbol: string) => {
    navigate(`/dashboard/${symbol}`);
  };
  
  // Top positive sentiment stocks
  const topPositiveSentiment = [
    { symbol: 'MSFT', name: 'Microsoft', price: 415.32, change: 5.43, percentChange: 1.32, sentiment: 0.87, volume: 12345678 },
    { symbol: 'NVDA', name: 'NVIDIA', price: 223.18, change: 2.78, percentChange: 1.26, sentiment: 0.82, volume: 25364789 },
    { symbol: 'AMZN', name: 'Amazon', price: 178.35, change: 3.15, percentChange: 1.80, sentiment: 0.79, volume: 15687423 },
    { symbol: 'GOOGL', name: 'Alphabet', price: 173.42, change: 0.85, percentChange: 0.49, sentiment: 0.75, volume: 8792345 }
  ];
  
  // Top negative sentiment stocks
  const topNegativeSentiment = [
    { symbol: 'META', name: 'Meta Platforms', price: 473.28, change: -8.92, percentChange: -1.85, sentiment: -0.68, volume: 18764532 },
    { symbol: 'BA', name: 'Boeing', price: 187.32, change: -3.45, percentChange: -1.81, sentiment: -0.72, volume: 9876543 },
    { symbol: 'NFLX', name: 'Netflix', price: 632.85, change: -5.32, percentChange: -0.83, sentiment: -0.58, volume: 5647892 },
    { symbol: 'JPM', name: 'JPMorgan Chase', price: 203.25, change: -1.23, percentChange: -0.60, sentiment: -0.53, volume: 7653421 }
  ];
  
  // Recent news
  const recentNews = [
    { 
      title: 'NVIDIA Announces Next-Generation AI Chips, Exceeding Analyst Expectations', 
      source: 'TechCrunch', 
      timestamp: '2 hours ago', 
      sentiment: 0.85,
      url: '#',
      ticker: 'NVDA'
    },
    { 
      title: 'Federal Reserve Signals Possible Rate Cut in September Meeting', 
      source: 'Wall Street Journal', 
      timestamp: '3 hours ago', 
      sentiment: 0.65,
      url: '#',
      ticker: ''
    },
    { 
      title: 'Meta Faces New Regulatory Challenges in European Markets', 
      source: 'Reuters', 
      timestamp: '5 hours ago', 
      sentiment: -0.72,
      url: '#',
      ticker: 'META'
    }
  ];
  
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        {/* Hero Section with Animation */}
        <AnimatedHero />
        
        {/* Market Overview */}
        <FadeInSection>
          <h2 className="text-2xl font-bold mb-4 text-main-header">Market Overview</h2>
          <AnimatedMetrics />
        </FadeInSection>
        
        {/* Top Performers */}
<FadeInSection delay={0.05}>
  <h2 className="text-2xl font-bold mb-4 text-main-header">Market Movers</h2>
  <TopPerformers 
    gainers={[
      { symbol: 'AAPL', name: 'Apple Inc.', price: 175.42, change: 2.35, percentChange: 1.36 },
      { symbol: 'MSFT', name: 'Microsoft', price: 415.32, change: 5.43, percentChange: 1.32 },
      { symbol: 'NVDA', name: 'NVIDIA', price: 223.18, change: 2.78, percentChange: 1.26 },
      { symbol: 'AMZN', name: 'Amazon', price: 178.35, change: 3.15, percentChange: 1.80 },
      { symbol: 'GOOGL', name: 'Alphabet', price: 173.42, change: 0.85, percentChange: 0.49 }
    ]}
    losers={[
      { symbol: 'META', name: 'Meta Platforms', price: 473.28, change: -8.92, percentChange: -1.85 },
      { symbol: 'BA', name: 'Boeing', price: 187.32, change: -3.45, percentChange: -1.81 },
      { symbol: 'NFLX', name: 'Netflix', price: 632.85, change: -5.32, percentChange: -0.83 },
      { symbol: 'JPM', name: 'JPMorgan Chase', price: 203.25, change: -1.23, percentChange: -0.60 },
      { symbol: 'XOM', name: 'Exxon Mobil', price: 114.48, change: -0.52, percentChange: -0.45 }
    ]}
  />
</FadeInSection>


        {/* Trending Stocks */}
        <FadeInSection delay={0.05}>
          <h2 className="text-2xl font-bold mb-4 text-main-header">Trending Stocks</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            {topPositiveSentiment.slice(0, 4).map((stock, i) => (
              <StockCard
                key={stock.symbol}
                symbol={stock.symbol}
                name={stock.name}
                price={stock.price}
                change={stock.change}
                changePercent={stock.percentChange}
                additionalInfo={{
                  'Sentiment': stock.sentiment.toFixed(2),
                  'Volume': (stock.volume / 1000000).toFixed(1) + 'M'
                }}
              />
            ))}
          </div>
        </FadeInSection>
        
        {/* Sentiment-Driven Insights */}
        <FadeInSection delay={0.1}>
          <h2 className="text-2xl font-bold mb-4 text-main-header">Sentiment-Driven Insights</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Top Positive Sentiment */}
            <div className="bg-card-bg p-4 rounded-lg shadow-sm border border-card-border">
              <h3 className="text-lg font-semibold mb-3">Top Positive Sentiment</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-card-border">
                      <th className="py-2 px-3 text-left">Symbol</th>
                      <th className="py-2 px-3 text-left">Company</th>
                      <th className="py-2 px-3 text-right">Price</th>
                      <th className="py-2 px-3 text-right">Change</th>
                      <th className="py-2 px-3 text-right">Sentiment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPositiveSentiment.map((stock, i) => (
                      <motion.tr 
                        key={stock.symbol} 
                        className="border-t border-card-border hover:bg-sidebar-hover cursor-pointer" 
                        onClick={() => navigateToCompany(stock.symbol)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 + 0.2 }}
                        whileHover={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
                      >
                        <td className="py-2 px-3 font-semibold">{stock.symbol}</td>
                        <td className="py-2 px-3">{stock.name}</td>
                        <td className="py-2 px-3 text-right">${stock.price.toFixed(2)}</td>
                        <td className={`py-2 px-3 text-right ${stock.percentChange >= 0 ? 'text-positive' : 'text-negative'}`}>
                          {stock.percentChange >= 0 ? '+' : ''}{stock.percentChange.toFixed(2)}%
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end">
                            <div className="h-2 w-16 bg-neutral-light rounded-full mr-2">
                              <motion.div 
                                className="h-full bg-positive rounded-full" 
                                initial={{ width: 0 }}
                                animate={{ width: `${(stock.sentiment * 100).toFixed(0)}%` }}
                                transition={{ duration: 1, delay: i * 0.1 + 0.5 }}
                              ></motion.div>
                            </div>
                            <span>{stock.sentiment.toFixed(2)}</span>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Top Negative Sentiment */}
            <div className="bg-card-bg p-4 rounded-lg shadow-sm border border-card-border">
              <h3 className="text-lg font-semibold mb-3">Top Negative Sentiment</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-card-border">
                      <th className="py-2 px-3 text-left">Symbol</th>
                      <th className="py-2 px-3 text-left">Company</th>
                      <th className="py-2 px-3 text-right">Price</th>
                      <th className="py-2 px-3 text-right">Change</th>
                      <th className="py-2 px-3 text-right">Sentiment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topNegativeSentiment.map((stock, i) => (
                      <motion.tr 
                        key={stock.symbol} 
                        className="border-t border-card-border hover:bg-sidebar-hover cursor-pointer" 
                        onClick={() => navigateToCompany(stock.symbol)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 + 0.2 }}
                        whileHover={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
                      >
                        <td className="py-2 px-3 font-semibold">{stock.symbol}</td>
                        <td className="py-2 px-3">{stock.name}</td>
                        <td className="py-2 px-3 text-right">${stock.price.toFixed(2)}</td>
                        <td className={`py-2 px-3 text-right ${stock.percentChange >= 0 ? 'text-positive' : 'text-negative'}`}>
                          {stock.percentChange >= 0 ? '+' : ''}{stock.percentChange.toFixed(2)}%
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end">
                            <div className="h-2 w-16 bg-neutral-light rounded-full mr-2">
                              <motion.div 
                                className="h-full bg-negative rounded-full" 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.abs(stock.sentiment * 100).toFixed(0)}%` }}
                                transition={{ duration: 1, delay: i * 0.1 + 0.5 }}
                              ></motion.div>
                            </div>
                            <span>{stock.sentiment.toFixed(2)}</span>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </FadeInSection>
        
        {/* Recent Market News */}
        <FadeInSection delay={0.2}>
          <h2 className="text-2xl font-bold mb-4 text-main-header">Recent Market News</h2>
          <div className="bg-card-bg rounded-lg shadow-sm border border-card-border overflow-hidden mb-8">
            {recentNews.map((news, i) => (
              <motion.div 
                key={i} 
                className={`p-4 ${i < recentNews.length - 1 ? 'border-b border-card-border' : ''}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 + 0.3 }}
              >
                <div className="flex justify-between items-start">
                  <h3 
                    className={`text-lg font-semibold mb-1 ${news.ticker ? 'cursor-pointer hover:text-primary' : ''}`}
                    onClick={() => news.ticker ? navigateToCompany(news.ticker) : null}
                  >
                    {news.title}
                  </h3>
                  <div className={`ml-4 px-2 py-1 rounded text-xs font-semibold ${
                    news.sentiment > 0.5 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                    news.sentiment > 0 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 
                    news.sentiment > -0.5 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' : 
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {news.sentiment > 0.5 ? 'Very Positive' : 
                     news.sentiment > 0 ? 'Positive' : 
                     news.sentiment > -0.5 ? 'Negative' : 
                     'Very Negative'}
                  </div>
                </div>
                <div className="flex text-sm text-neutral">
                  <span>{news.source}</span>
                  <span className="mx-2">•</span>
                  <span>{news.timestamp}</span>
                  {news.ticker && (
                    <>
                      <span className="mx-2">•</span>
                      <span 
                        className="font-medium cursor-pointer hover:text-primary"
                        onClick={() => navigateToCompany(news.ticker)}
                      >
                        ${news.ticker}
                      </span>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </FadeInSection>
        
        {/* Our Methodology */}
        <FadeInSection delay={0.3}>
          <h2 className="text-2xl font-bold mb-4 text-main-header">Our Methodology</h2>
          <div className="bg-card-bg p-6 rounded-lg shadow-sm border border-card-border mb-8">
            <h3 className="text-xl font-semibold mb-3">How MarketSense Works</h3>
            <p className="mb-4">
              MarketSense combines traditional quantitative analysis with advanced sentiment analysis to provide more accurate market predictions. Our approach recognizes that market movements are influenced by both technical factors and market sentiment derived from news and social media.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="text-lg font-semibold mb-2">Sentiment Analysis</h4>
                <p className="mb-2">
                  Our sentiment analysis uses natural language processing (NLP) with temporal weighting to analyze news articles, press releases, and financial reports.
                </p>
                <motion.div 
                  className="bg-sidebar-hover p-4 rounded"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true, amount: 0.3 }}
                >
                  <p className="font-mono text-sm">
                    CompanySentiment = Σ(ArticleSentiment * SourceCredibility * Relevance * Recency) / Σ(SourceCredibility * Relevance * Recency)
                  </p>
                  <ul className="mt-2 text-sm">
                    <li><span className="font-semibold">ArticleSentiment</span>: NLP-derived score from -1 to +1</li>
                    <li><span className="font-semibold">SourceCredibility</span>: Reliability weight of the news source</li>
                    <li><span className="font-semibold">Relevance</span>: How central the company is to the article</li>
                    <li><span className="font-semibold">Recency</span>: Exponential decay based on article age</li>
                  </ul>
                </motion.div>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold mb-2">Price Prediction</h4>
                <p className="mb-2">
                  We use an ensemble of forecasting methods for technical predictions, then enhance these with sentiment data using a dynamic weighting system.
                </p>
                <motion.div 
                  className="bg-sidebar-hover p-4 rounded"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  viewport={{ once: true, amount: 0.3 }}
                >
                  <p className="font-mono text-sm">
                    TechnicalPrediction = EnsembleModel(ARIMA, Prophet, ML)
                  </p>
                  <p className="font-mono text-sm mt-2">
                    SentimentWeight = AdaptiveFunction(SentimentPredictiveAccuracy)
                  </p>
                  <p className="font-mono text-sm mt-2">
                    EnhancedPrediction = (1-SW) * TechnicalPrediction + SW * (BasePrice * (1 + SentimentImpactFactor))
                  </p>
                  <p className="mt-2 text-sm">
                    The sentiment weight adapts dynamically based on how predictive sentiment has been for each specific company and the current market conditions.
                  </p>
                </motion.div>
              </div>
            </div>
            
            <div className="text-center mt-8">
              <button 
                className="px-6 py-3 bg-primary text-white rounded-lg shadow-sm hover:bg-primary-dark transition-colors"
                onClick={() => navigate('/dashboard')}
              >
                Try MarketSense Now
              </button>
            </div>
          </div>
        </FadeInSection>
      </div>
    </MainLayout>
  );
};

export default HomePage;