import React, { useEffect } from 'react';
import { motion, useAnimation, type Variants } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { 
  useGetMarketOverviewQuery,
  useGetTopPerformersQuery,
  useGetTrendingStocksQuery,
  useGetStocksBySentimentQuery,
  useGetMarketNewsQuery 
} from '../services/api';

// Define types for API responses
interface MarketIndex {
  name: string;
  symbol?: string;
  value: number;
  change: number;
  changePercent: number;
  timestamp?: string;
  isFallback?: boolean;
}

interface StockPerformer {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface TrendingStock extends StockPerformer {
  sentiment: number;
  volume: number;
  sector: string;
}

interface MarketNewsItem {
  title: string;
  source: string;
  timestamp: string;
  sentiment: number;
  ticker?: string | null;
}

// Enhanced animated section component
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

  const variants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0
    }
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={variants}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.div>
  );
};

// Enhanced animated hero with navy blue theme
const AnimatedHero: React.FC = () => {
  const [currentSlide, setCurrentSlide] = React.useState(0);
  
  const slides = [
    {
      title: 'Welcome to MarketSense',
      subtitle: 'AI-powered financial analytics combining real-time data with sentiment intelligence',
      icon: '📊'
    },
    {
      title: 'Advanced Sentiment Analysis',
      subtitle: 'FinBERT-powered news analysis across thousands of financial articles daily',
      icon: '🧠'
    },
    {
      title: 'Enhanced ML Predictions',
      subtitle: 'LSTM models with attention mechanisms for superior market forecasting',
      icon: '🤖'
    },
    {
      title: 'Your Market Advantage',
      subtitle: 'Professional-grade analytics platform for informed investment decisions',
      icon: '🚀'
    }
  ];
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [slides.length]);
  
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-700 to-blue-900 p-8 rounded-2xl text-white mb-8 shadow-2xl">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-400 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-purple-400 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-cyan-400 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>
      
      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.div
          key={slides[currentSlide].title}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.8 }}
          className="flex items-center justify-center text-center"
        >
          <div>
            <motion.div 
              className="text-7xl mb-6"
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              {slides[currentSlide].icon}
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              {slides[currentSlide].title}
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 leading-relaxed max-w-4xl mx-auto">
              {slides[currentSlide].subtitle}
            </p>
          </div>
        </motion.div>
        
        {/* Slide indicators with enhanced design */}
        <div className="flex justify-center mt-8 space-x-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`relative w-3 h-3 rounded-full transition-all duration-300 ${
                currentSlide === index ? 'bg-white scale-125' : 'bg-white/30 hover:bg-white/50'
              }`}
            >
              {currentSlide === index && (
                <motion.div
                  className="absolute inset-0 bg-blue-300 rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Enhanced animated metrics with live data
const AnimatedMetrics: React.FC = () => {
  const { data: marketData, isLoading } = useGetMarketOverviewQuery();
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
  
  // Number counter animation
  const Counter: React.FC<{ value: number, decimals?: number }> = ({ value, decimals = 2 }) => {
    const [count, setCount] = React.useState(0);
    
    useEffect(() => {
      if (!inView) return;
      
      let start = 0;
      const step = value / 60;
      const timer = setInterval(() => {
        start += step;
        if (start > value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(start);
        }
      }, 16);
      
      return () => clearInterval(timer);
    }, [value]);
    
    return <>{count.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</>;
  };
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 animate-pulse">
            <div className="h-4 bg-slate-200 rounded mb-4"></div>
            <div className="h-8 bg-slate-200 rounded mb-2"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }
  
  const indices = marketData?.indices || [
    { name: 'S&P 500', value: 5438.32, change: 32.45, changePercent: 0.60 },
    { name: 'NASDAQ', value: 17842.64, change: 87.18, changePercent: 0.49 },
    { name: 'Dow Jones', value: 41256.78, change: -43.12, changePercent: -0.10 },
    { name: 'Russell 2000', value: 2235.42, change: 14.23, changePercent: 0.64 }
  ];
  
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.8, ease: "easeOut" as const }
    }
  };
  
  return (
    <motion.div 
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={containerVariants}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
    >
      {indices.map((index: MarketIndex, i: number) => (
        <motion.div 
          key={index.name} 
          variants={itemVariants}
          className="relative bg-white p-6 rounded-2xl shadow-lg border border-slate-200 overflow-hidden group hover:shadow-xl transition-all duration-300"
          whileHover={{ y: -5, scale: 1.02 }}
        >
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-700 text-lg">{index.name}</h3>
              {marketData?.isFallback && (
                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                  Demo
                </span>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="text-3xl font-bold text-slate-800">
                {inView ? <Counter value={index.value} /> : "0.00"}
              </div>
              
              <div className={`flex items-center text-sm font-semibold ${
                index.changePercent >= 0 ? 'text-emerald-600' : 'text-red-500'
              }`}>
                <span className={`mr-2 text-lg ${index.changePercent >= 0 ? '📈' : '📉'}`}>
                  {index.changePercent >= 0 ? '▲' : '▼'}
                </span>
                <span>
                  {inView ? <Counter value={Math.abs(index.change)} /> : "0.00"} 
                  ({inView ? <Counter value={Math.abs(index.changePercent)} /> : "0.00"}%)
                </span>
              </div>
            </div>
            
            {/* Animated progress bar */}
            <div className="mt-4 h-1 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  index.changePercent >= 0 ? 'bg-emerald-500' : 'bg-red-500'
                }`}
                initial={{ width: "0%" }}
                animate={{ width: inView ? `${Math.min(100, Math.abs(index.changePercent) * 20)}%` : "0%" }}
                transition={{ duration: 1.5, delay: i * 0.2 }}
              />
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  
  // Fetch live data
  const { data: performersData, isLoading: isLoadingPerformers } = useGetTopPerformersQuery();
  const { data: trendingData, isLoading: isLoadingTrending } = useGetTrendingStocksQuery();
  const { data: sentimentData, isLoading: isLoadingSentiment } = useGetStocksBySentimentQuery();
  const { data: newsData, isLoading: isLoadingNews } = useGetMarketNewsQuery({ limit: 6 });
  
  const navigateToCompany = (symbol: string) => {
    navigate(`/dashboard/${symbol}`);
  };
  
  const getSentimentIcon = (sentiment: number) => {
    if (sentiment > 0.5) return '🚀';
    if (sentiment > 0) return '✅';
    if (sentiment > -0.5) return '⚠️';
    return '❌';
  };
  
  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.3) return 'text-emerald-600 bg-emerald-50';
    if (sentiment > 0) return 'text-green-600 bg-green-50';
    if (sentiment > -0.3) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };
  
  return (
    <MainLayout>
      <div className="space-y-12">
        {/* Revolutionary Hero Section */}
        <AnimatedHero />
        
        {/* Live Market Overview */}
        <FadeInSection>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-slate-800">Live Market Overview</h2>
            <div className="flex items-center text-sm text-slate-600">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
              Real-time data
            </div>
          </div>
          <AnimatedMetrics />
        </FadeInSection>
        
        {/* Market Movers with Live Data */}
        <FadeInSection delay={0.1}>
          <h2 className="text-3xl font-bold mb-6 text-slate-800">Market Movers</h2>
          {isLoadingPerformers ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1,2].map((i: number) => (
                <div key={i} className="bg-white p-6 rounded-2xl shadow-lg animate-pulse">
                  <div className="h-6 bg-slate-200 rounded mb-4"></div>
                  <div className="space-y-3">
                    {[1,2,3,4,5].map((j: number) => (
                      <div key={j} className="h-4 bg-slate-200 rounded"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Gainers */}
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center mb-4">
                  <span className="text-2xl mr-3">📈</span>
                  <h3 className="text-xl font-bold text-slate-800">Top Gainers</h3>
                </div>
                <div className="space-y-3">
                  {(performersData?.gainers || []).map((stock: StockPerformer, index: number) => (
                    <motion.div 
                      key={stock.symbol}
                      className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl hover:bg-emerald-100 cursor-pointer transition-colors"
                      onClick={() => navigateToCompany(stock.symbol)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div>
                        <div className="font-bold text-slate-800">{stock.symbol}</div>
                        <div className="text-sm text-slate-600 truncate max-w-40">{stock.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-800">${stock.price.toFixed(2)}</div>
                        <div className="text-emerald-600 font-semibold text-sm">
                          +{stock.changePercent.toFixed(2)}%
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              {/* Top Losers */}
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center mb-4">
                  <span className="text-2xl mr-3">📉</span>
                  <h3 className="text-xl font-bold text-slate-800">Top Losers</h3>
                </div>
                <div className="space-y-3">
                  {(performersData?.losers || []).map((stock: StockPerformer, index: number) => (
                    <motion.div 
                      key={stock.symbol}
                      className="flex items-center justify-between p-3 bg-red-50 rounded-xl hover:bg-red-100 cursor-pointer transition-colors"
                      onClick={() => navigateToCompany(stock.symbol)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div>
                        <div className="font-bold text-slate-800">{stock.symbol}</div>
                        <div className="text-sm text-slate-600 truncate max-w-40">{stock.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-800">${stock.price.toFixed(2)}</div>
                        <div className="text-red-500 font-semibold text-sm">
                          {stock.changePercent.toFixed(2)}%
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </FadeInSection>
        
        {/* Trending Stocks with Enhanced Design */}
        <FadeInSection delay={0.2}>
          <h2 className="text-3xl font-bold mb-6 text-slate-800">Trending Stocks</h2>
          {isLoadingTrending ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1,2,3,4].map((i: number) => (
                <div key={i} className="bg-white p-6 rounded-2xl shadow-lg animate-pulse">
                  <div className="h-6 bg-slate-200 rounded mb-4"></div>
                  <div className="h-8 bg-slate-200 rounded mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(trendingData?.trending || []).slice(0, 4).map((stock: TrendingStock, index: number) => (
                <motion.div
                  key={stock.symbol}
                  className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl cursor-pointer transition-all duration-300 group"
                  onClick={() => navigateToCompany(stock.symbol)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.03 }}
                >
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-bold text-xl text-slate-800">{stock.symbol}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getSentimentColor(stock.sentiment)}`}>
                        {getSentimentIcon(stock.sentiment)} {stock.sentiment.toFixed(1)}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold text-slate-700 mb-3 truncate group-hover:text-blue-700 transition-colors">
                      {stock.name}
                    </h3>
                    
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-slate-800">
                        ${stock.price.toFixed(2)}
                      </div>
                      <div className={`font-semibold ${stock.changePercent >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </div>
                      <div className="text-sm text-slate-500">
                        Vol: {(stock.volume / 1000000).toFixed(1)}M
                      </div>
                    </div>
                    
                    {/* Animated bottom border */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </FadeInSection>
        
        {/* Sentiment-Driven Insights */}
        <FadeInSection delay={0.3}>
          <h2 className="text-3xl font-bold mb-6 text-slate-800">AI Sentiment Intelligence</h2>
          {isLoadingSentiment ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1,2].map((i: number) => (
                <div key={i} className="bg-white p-6 rounded-2xl shadow-lg animate-pulse">
                  <div className="h-6 bg-slate-200 rounded mb-4"></div>
                  <div className="space-y-3">
                    {[1,2,3,4].map((j: number) => (
                      <div key={j} className="flex justify-between">
                        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                        <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Positive Sentiment */}
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-6 rounded-2xl shadow-lg border border-emerald-200">
                <div className="flex items-center mb-4">
                  <span className="text-2xl mr-3">🚀</span>
                  <h3 className="text-xl font-bold text-emerald-800">Bullish Sentiment</h3>
                </div>
                <div className="space-y-3">
                  {(sentimentData?.positive || []).map((stock: TrendingStock, index: number) => (
                    <motion.div 
                      key={stock.symbol}
                      className="flex items-center justify-between p-3 bg-white rounded-xl hover:shadow-md cursor-pointer transition-all"
                      onClick={() => navigateToCompany(stock.symbol)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ x: 5 }}
                    >
                      <div>
                        <div className="font-bold text-slate-800">{stock.symbol}</div>
                        <div className="text-sm text-slate-600 truncate max-w-32">{stock.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-800">${stock.price.toFixed(0)}</div>
                        <div className="flex items-center">
                          <div className="w-12 h-2 bg-emerald-200 rounded-full mr-2">
                            <div 
                              className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                              style={{ width: `${stock.sentiment * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-emerald-600 font-semibold">
                            {stock.sentiment.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              {/* Negative Sentiment */}
              <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-2xl shadow-lg border border-red-200">
                <div className="flex items-center mb-4">
                  <span className="text-2xl mr-3">⚠️</span>
                  <h3 className="text-xl font-bold text-red-800">Bearish Sentiment</h3>
                </div>
                <div className="space-y-3">
                  {(sentimentData?.negative || []).map((stock: TrendingStock, index: number) => (
                    <motion.div 
                      key={stock.symbol}
                      className="flex items-center justify-between p-3 bg-white rounded-xl hover:shadow-md cursor-pointer transition-all"
                      onClick={() => navigateToCompany(stock.symbol)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ x: 5 }}
                    >
                      <div>
                        <div className="font-bold text-slate-800">{stock.symbol}</div>
                        <div className="text-sm text-slate-600 truncate max-w-32">{stock.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-800">${stock.price.toFixed(0)}</div>
                        <div className="flex items-center">
                          <div className="w-12 h-2 bg-red-200 rounded-full mr-2">
                            <div 
                              className="h-full bg-red-500 rounded-full transition-all duration-1000"
                              style={{ width: `${Math.abs(stock.sentiment) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-red-600 font-semibold">
                            {stock.sentiment.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </FadeInSection>
        
        {/* Live Market News */}
        <FadeInSection delay={0.4}>
          <h2 className="text-3xl font-bold mb-6 text-slate-800">Latest Market Intelligence</h2>
          {isLoadingNews ? (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="space-y-4">
                {[1,2,3].map((i: number) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-6 bg-slate-200 rounded mb-2"></div>
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              {(newsData?.news || []).slice(0, 6).map((news: MarketNewsItem, index: number) => (
                <motion.div 
                  key={index} 
                  className={`p-6 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors ${
                    news.ticker ? 'cursor-pointer' : ''
                  }`}
                  onClick={() => news.ticker ? navigateToCompany(news.ticker) : null}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={news.ticker ? { x: 5 } : {}}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-lg font-semibold mb-2 text-slate-800 ${
                        news.ticker ? 'hover:text-blue-700' : ''
                      } transition-colors`}>
                        {news.title}
                      </h3>
                      <div className="flex items-center text-sm text-slate-600 space-x-4">
                        <span className="font-medium">{news.source}</span>
                        <span>•</span>
                        <span>{new Date(news.timestamp).toLocaleString()}</span>
                        {news.ticker && (
                          <>
                            <span>•</span>
                            <span className="font-semibold text-blue-600">${news.ticker}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className={`ml-4 px-3 py-1 rounded-full text-xs font-semibold ${getSentimentColor(news.sentiment)}`}>
                      {getSentimentIcon(news.sentiment)} 
                      {news.sentiment > 0.3 ? 'Bullish' : 
                       news.sentiment > 0 ? 'Positive' : 
                       news.sentiment > -0.3 ? 'Negative' : 'Bearish'}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {/* View All News Button */}
              <div className="p-6 bg-slate-50 text-center">
                <button 
                  className="px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors font-semibold"
                  onClick={() => navigate('/dashboard')}
                >
                  📊 Explore More Analytics →
                </button>
              </div>
            </div>
          )}
        </FadeInSection>
        
        {/* Call to Action */}
        <FadeInSection delay={0.5}>
          <div className="bg-gradient-to-br from-slate-800 to-blue-900 text-white p-12 rounded-2xl shadow-2xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
                Join thousands of investors using MarketSense for smarter trading decisions with AI-powered analytics
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  className="px-8 py-4 bg-white text-slate-800 rounded-xl hover:bg-blue-50 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl"
                  onClick={() => navigate('/dashboard')}
                >
                  🚀 Start Analyzing
                </button>
                <button 
                  className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl"
                  onClick={() => navigate('/watchlist')}
                >
                  📊 Build Portfolio
                </button>
              </div>
            </motion.div>
          </div>
        </FadeInSection>
      </div>
    </MainLayout>
  );
};

export default HomePage;