import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SmartCompanySearch from '../components/common/SmartCompanySearch';
import { useAnalyzePortfolioMutation } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

// Enhanced portfolio data
const initialPortfolioData = [
  { 
    symbol: 'AAPL', 
    name: 'Apple Inc.', 
    shares: 100, 
    avgPrice: 165.50, 
    currentPrice: 175.42, 
    addedOn: '2025-06-15', 
    notes: 'Long-term growth play', 
    sector: 'Technology' 
  },
  { 
    symbol: 'MSFT', 
    name: 'Microsoft Corporation', 
    shares: 50, 
    avgPrice: 380.20, 
    currentPrice: 415.32, 
    addedOn: '2025-06-10', 
    notes: 'Cloud dominance', 
    sector: 'Technology' 
  },
  { 
    symbol: 'TSLA', 
    name: 'Tesla, Inc.', 
    shares: 25, 
    avgPrice: 210.00, 
    currentPrice: 193.57, 
    addedOn: '2025-06-08', 
    notes: 'EV leader with volatility', 
    sector: 'Consumer Discretionary' 
  },
  { 
    symbol: 'NVDA', 
    name: 'NVIDIA Corporation', 
    shares: 75, 
    avgPrice: 185.30, 
    currentPrice: 223.18, 
    addedOn: '2025-05-20', 
    notes: 'AI infrastructure play', 
    sector: 'Technology' 
  },
  { 
    symbol: 'SPY', 
    name: 'SPDR S&P 500 ETF', 
    shares: 200, 
    avgPrice: 420.50, 
    currentPrice: 450.25, 
    addedOn: '2025-05-18', 
    notes: 'Core index holding', 
    sector: 'ETF' 
  }
];

type RiskTolerance = 'conservative' | 'neutral' | 'aggressive';

interface PortfolioStock {
  symbol: string;
  name: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  addedOn: string;
  notes: string;
  sector: string;
}

interface PortfolioAnalysis {
  overallHealth: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  riskAssessment: string;
  diversificationScore: number;
}

const WatchlistPage: React.FC = () => {
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState<PortfolioStock[]>(initialPortfolioData);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState<{symbol: string, name: string} | null>(null);
  const [stockShares, setStockShares] = useState<number>(1);
  const [stockAvgPrice, setStockAvgPrice] = useState<number>(0);
  const [stockNotes, setStockNotes] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  // AI Portfolio Advisor State
  const [riskTolerance, setRiskTolerance] = useState<RiskTolerance>('neutral');
  const [hasSelectedRisk, setHasSelectedRisk] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<PortfolioAnalysis | null>(null);
  
  // Real Gemini AI integration
  const [analyzePortfolio, { isLoading: isAnalyzing }] = useAnalyzePortfolioMutation();

  const handleRemove = (symbol: string) => {
    setPortfolio(portfolio.filter(item => item.symbol !== symbol));
  };
  
  const handleView = (symbol: string) => {
    navigate(`/dashboard/${symbol}`);
  };

  const handleAddStock = () => {
    setShowAddModal(true);
    setSelectedStock(null);
    setStockShares(1);
    setStockAvgPrice(0);
    setStockNotes('');
  };

  const handleSelectStock = (stock: {ticker: string, name: string, sector?: string}) => {
    setSelectedStock({symbol: stock.ticker, name: stock.name});
    setStockAvgPrice(100 + Math.random() * 300);
  };

  const handleConfirmAdd = async () => {
    if (!selectedStock || stockShares <= 0 || stockAvgPrice <= 0) {
      alert('Please fill in all fields with valid values');
      return;
    }

    setIsAdding(true);

    const existingStock = portfolio.find(item => item.symbol === selectedStock.symbol);
    if (existingStock) {
      alert('This stock is already in your portfolio!');
      setIsAdding(false);
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    const newStock: PortfolioStock = {
      symbol: selectedStock.symbol,
      name: selectedStock.name,
      shares: stockShares,
      avgPrice: stockAvgPrice,
      currentPrice: stockAvgPrice * (0.95 + Math.random() * 0.1),
      addedOn: new Date().toISOString().split('T')[0],
      notes: stockNotes || `${stockShares} shares of ${selectedStock.symbol}`,
      sector: 'Technology'
    };

    setPortfolio([...portfolio, newStock]);
    setShowAddModal(false);
    setIsAdding(false);
    setSelectedStock(null);
    setStockShares(1);
    setStockAvgPrice(0);
    setStockNotes('');
  };

  const handleCancelAdd = () => {
    setShowAddModal(false);
    setSelectedStock(null);
    setStockShares(1);
    setStockAvgPrice(0);
    setStockNotes('');
  };

  // Risk tolerance selection and analysis trigger
  const handleRiskToleranceSelect = (risk: RiskTolerance) => {
    setRiskTolerance(risk);
    setHasSelectedRisk(true);
  };

  const handleStartAnalysis = async () => {
    if (!hasSelectedRisk) {
      alert('Please select your risk tolerance first');
      return;
    }

    setShowAIAnalysis(true);
    setAiAnalysis(null);

    try {
      const portfolioData = portfolio.map(stock => ({
        ticker: stock.symbol,
        name: stock.name,
        price: stock.currentPrice,
        changePercent: ((stock.currentPrice - stock.avgPrice) / stock.avgPrice) * 100,
        sentiment: 0.1 + (Math.random() - 0.5) * 0.8,
        sector: stock.sector,
        shares: stock.shares,
        avgPrice: stock.avgPrice,
        notes: stock.notes
      }));

      const response = await analyzePortfolio({
        stocks: portfolioData,
        riskTolerance
      }).unwrap();

      setAiAnalysis(response);
    } catch (error) {
      console.error('AI Analysis failed, using fallback:', error);
      setAiAnalysis(generateFallbackAnalysis());
    }
  };

  // Calculate portfolio metrics
  const portfolioMetrics = portfolio.reduce((acc, stock) => {
    const positionValue = stock.shares * stock.currentPrice;
    const costBasis = stock.shares * stock.avgPrice;
    const pnl = positionValue - costBasis;

    return {
      totalValue: acc.totalValue + positionValue,
      totalCost: acc.totalCost + costBasis,
      totalPnL: acc.totalPnL + pnl,
      positions: acc.positions + 1
    };
  }, { totalValue: 0, totalCost: 0, totalPnL: 0, positions: 0 });

  const portfolioPnLPercent = (portfolioMetrics.totalPnL / portfolioMetrics.totalCost) * 100;
  const positivePositions = portfolio.filter(stock => 
    (stock.shares * stock.currentPrice) > (stock.shares * stock.avgPrice)
  ).length;

  // Fallback analysis
  const generateFallbackAnalysis = (): PortfolioAnalysis => {
    const sectors = [...new Set(portfolio.map(stock => stock.sector))];
    const techWeight = portfolio.filter(s => s.sector === 'Technology').length / portfolio.length;

    const analyses: Record<RiskTolerance, PortfolioAnalysis> = {
      conservative: {
        overallHealth: portfolioPnLPercent > 5 ? 'Healthy - Good Conservative Returns' : 'Stable - Focus on Risk Management',
        strengths: [
          'Diversified holdings across quality companies',
          'Building solid foundation with established names',
          positivePositions > portfolio.length / 2 ? 'Majority of positions profitable' : 'Quality stock selection'
        ],
        weaknesses: [
          techWeight > 0.6 ? 'High tech concentration - consider utilities/healthcare' : 'Consider adding dividend stocks',
          'Missing defensive sectors for stability',
          'Consider cash allocation for opportunities'
        ],
        suggestions: [
          'Add dividend aristocrats: KO, JNJ, PG',
          'Reduce tech exposure below 50%',
          'Consider defensive ETFs',
          'Maintain 10-15% cash position'
        ],
        riskAssessment: 'Medium risk - suitable for wealth preservation',
        diversificationScore: Math.max(3, 10 - (techWeight * 4))
      },
      neutral: {
        overallHealth: 'Balanced Growth Portfolio - Solid Foundation',
        strengths: [
          'Good mix of growth and established companies',
          `Diversified across ${sectors.length} sectors`,
          portfolioPnLPercent > 0 ? 'Portfolio showing positive returns' : 'Quality companies despite volatility',
          'Appropriate position sizing'
        ],
        weaknesses: [
          techWeight > 0.7 ? 'Tech-heavy allocation increases correlation' : 'Room for international exposure',
          'Consider value stocks for balance',
          'Missing small-cap exposure'
        ],
        suggestions: [
          'Add international exposure: VEA',
          'Consider value plays: BRK.B, JPM',
          'Small-cap exposure: IJR or VB',
          'Rebalance when positions exceed 15%'
        ],
        riskAssessment: 'Moderate risk with balanced growth potential',
        diversificationScore: Math.min(8, sectors.length * 2.2)
      },
      aggressive: {
        overallHealth: 'Growth-Focused - High Potential Portfolio',
        strengths: [
          'Strong exposure to innovation leaders',
          'Well-positioned for secular growth trends',
          positivePositions > 3 ? 'Multiple winning positions' : 'Quality growth selections',
          'Concentrated approach for maximum impact'
        ],
        weaknesses: [
          'High correlation during market stress',
          'Missing emerging growth opportunities',
          'Could add more momentum plays'
        ],
        suggestions: [
          'Add high-growth: PLTR, COIN, RBLX',
          'Consider growth ETFs: QQQ, ARKK',
          'Options strategies for leverage',
          'Trim losers, add to winners'
        ],
        riskAssessment: 'High risk/reward - significant volatility expected',
        diversificationScore: Math.min(6, sectors.length * 1.8)
      }
    };

    return analyses[riskTolerance];
  };

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <motion.h1 
              className="text-3xl font-bold text-gray-800 mb-2"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              My Portfolio
            </motion.h1>
            <motion.p 
              className="text-gray-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              Track positions with AI-powered insights
            </motion.p>
          </div>
          <motion.button 
            className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-all duration-200 font-semibold shadow-lg"
            onClick={handleAddStock}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
          >
            + Add Position
          </motion.button>
        </div>
      </div>

      {/* Portfolio Overview Cards */}
      <motion.div 
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-light text-center">
          <div className="text-sm text-gray-500 mb-1">Portfolio Value</div>
          <div className="text-2xl font-bold text-blue-600">
            ${portfolioMetrics.totalValue.toLocaleString(undefined, {maximumFractionDigits: 0})}
          </div>
          <div className={`text-sm font-medium ${portfolioPnLPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {portfolioPnLPercent >= 0 ? '+' : ''}{portfolioPnLPercent.toFixed(1)}% return
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-light text-center">
          <div className="text-sm text-gray-500 mb-1">Total P&L</div>
          <div className={`text-2xl font-bold ${portfolioMetrics.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {portfolioMetrics.totalPnL >= 0 ? '+' : ''}${Math.round(portfolioMetrics.totalPnL/1000)}k
          </div>
          <div className="text-sm text-gray-500">
            Cost: ${Math.round(portfolioMetrics.totalCost/1000)}k
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-light text-center">
          <div className="text-sm text-gray-500 mb-1">Winning Positions</div>
          <div className="text-2xl font-bold text-green-600">{positivePositions}</div>
          <div className="text-sm text-gray-500">of {portfolio.length} positions</div>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-light text-center">
          <div className="text-sm text-gray-500 mb-1">Diversification</div>
          <div className="text-2xl font-bold text-purple-600">
            {aiAnalysis?.diversificationScore.toFixed(1) || '7.5'}/10
          </div>
          <div className="text-sm text-gray-500">Risk score</div>
        </div>
      </motion.div>

      {/* AI Portfolio Advisor */}
      <motion.div 
        className="bg-gradient-to-br from-white to-blue-50 p-6 rounded-2xl shadow-sm border border-blue-200 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center justify-center">
            🤖 AI Portfolio Advisor
          </h3>
          <p className="text-gray-600 text-sm">
            Get personalized investment advice powered by Gemini AI
          </p>
        </div>

        {/* Step 1 - Risk Tolerance Selection */}
        {!hasSelectedRisk && (
          <div className="text-center">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">
              Choose Your Investment Style
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(['conservative', 'neutral', 'aggressive'] as RiskTolerance[]).map((risk) => (
                <motion.button
                  key={risk}
                  onClick={() => handleRiskToleranceSelect(risk)}
                  className="p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-primary hover:shadow-lg transition-all duration-200 text-center"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-2xl mb-2">
                    {risk === 'conservative' ? '🛡️' : risk === 'neutral' ? '⚖️' : '🚀'}
                  </div>
                  <div className="font-bold mb-1 capitalize">{risk}</div>
                  <div className="text-xs text-gray-600">
                    {risk === 'conservative' ? 'Stability focused' :
                     risk === 'neutral' ? 'Balanced approach' :
                     'Growth focused'}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 - Analysis Trigger */}
        {hasSelectedRisk && !showAIAnalysis && (
          <div className="text-center">
            <div className="mb-4">
              <span className="px-3 py-1 bg-primary text-white rounded-full text-sm font-medium">
                Selected: {riskTolerance === 'conservative' ? '🛡️ Conservative' : 
                          riskTolerance === 'neutral' ? '⚖️ Neutral' : 
                          '🚀 Aggressive'}
              </span>
            </div>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setHasSelectedRisk(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                ← Change Style
              </button>
              <button
                onClick={handleStartAnalysis}
                disabled={isAnalyzing}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 transition-colors font-semibold flex items-center"
              >
                {isAnalyzing ? (
                  <>
                    <LoadingSpinner size="small" />
                    <span className="ml-2">Analyzing...</span>
                  </>
                ) : (
                  '🎯 Get AI Analysis'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 - Analysis Results */}
        {showAIAnalysis && aiAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-gray-800">
                📊 Your {riskTolerance.charAt(0).toUpperCase() + riskTolerance.slice(1)} Analysis
              </h4>
              <div className="flex gap-2">
                <button
                  onClick={() => handleStartAnalysis()}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                >
                  🔄 Refresh
                </button>
                <button
                  onClick={() => {
                    setShowAIAnalysis(false);
                    setHasSelectedRisk(false);
                    setAiAnalysis(null);
                  }}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  ← Start Over
                </button>
              </div>
            </div>

            {/* Portfolio Health */}
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <h5 className="font-bold text-gray-800 mb-2 flex items-center">
                🏥 Portfolio Health
              </h5>
              <p className="text-gray-700 font-medium">{aiAnalysis.overallHealth}</p>
            </div>

            {/* Analysis Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Strengths */}
              <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                <h5 className="font-bold text-green-800 mb-3 flex items-center">
                  ✅ Strengths ({aiAnalysis.strengths.length})
                </h5>
                <ul className="space-y-2">
                  {aiAnalysis.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start text-green-700 text-sm">
                      <span className="mr-2 mt-1">•</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Improvements */}
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                <h5 className="font-bold text-orange-800 mb-3 flex items-center">
                  ⚠️ Improvements ({aiAnalysis.weaknesses.length})
                </h5>
                <ul className="space-y-2">
                  {aiAnalysis.weaknesses.map((weakness, index) => (
                    <li key={index} className="flex items-start text-orange-700 text-sm">
                      <span className="mr-2 mt-1">•</span>
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* AI Recommendations */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <h5 className="font-bold text-blue-800 mb-3">
                🎯 AI Recommendations ({aiAnalysis.suggestions.length})
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {aiAnalysis.suggestions.map((suggestion, index) => (
                  <div key={index} className="bg-white p-3 rounded-lg border border-blue-200 text-sm">
                    <div className="flex items-start">
                      <span className="text-blue-500 mr-2">💡</span>
                      <span className="text-blue-700 font-medium">{suggestion}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="font-bold text-gray-800">🎯 Risk Assessment:</span>
                  <span className="text-gray-700 ml-2">{aiAnalysis.riskAssessment}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-600 mr-2">Diversification:</span>
                  <div className="flex items-center">
                    <div className="w-20 h-2 bg-gray-200 rounded-full mr-2">
                      <div 
                        className="h-full bg-purple-500 rounded-full transition-all duration-1000"
                        style={{ width: `${(aiAnalysis.diversificationScore / 10) * 100}%` }}
                      ></div>
                    </div>
                    <span className="font-bold text-purple-600 text-sm">{aiAnalysis.diversificationScore.toFixed(1)}/10</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* COMPLETELY NEW: Portfolio Cards Layout - NO TABLE */}
      <motion.div 
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">Portfolio Positions</h3>
          <div className="text-sm text-gray-500">
            {portfolio.length} positions • Updated {new Date().toLocaleTimeString()}
          </div>
        </div>

        {portfolio.length > 0 ? (
          <div className="space-y-3">
            {portfolio.map((stock, index) => {
              const positionValue = stock.shares * stock.currentPrice;
              const costBasis = stock.shares * stock.avgPrice;
              const pnl = positionValue - costBasis;
              const pnlPercent = (pnl / costBasis) * 100;
              const portfolioPercent = (positionValue / portfolioMetrics.totalValue) * 100;

              return (
                <motion.div
                  key={stock.symbol}
                  className="bg-white p-4 rounded-xl shadow-sm border border-neutral-light hover:shadow-md transition-all duration-200"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Stock Info */}
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                          <span className="font-bold text-primary text-sm">{stock.symbol}</span>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-gray-800 truncate">{stock.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          <span>{stock.shares} shares</span>
                          <span>•</span>
                          <span>{stock.sector}</span>
                          <span>•</span>
                          <span>Added {stock.addedOn}</span>
                        </div>
                      </div>
                    </div>

                    {/* Price Info */}
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-xs text-gray-500">Avg Price</div>
                        <div className="font-semibold text-gray-700">${stock.avgPrice.toFixed(0)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500">Current</div>
                        <div className="font-bold text-gray-800">${stock.currentPrice.toFixed(0)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500">Value</div>
                        <div className="font-bold text-gray-800">${Math.round(positionValue/1000)}k</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500">P&L</div>
                        <div className={`font-bold ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {pnl >= 0 ? '+' : ''}${Math.round(pnl)}
                          <div className="text-xs">
                            ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(0)}%)
                          </div>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500">% Portfolio</div>
                        <div className="font-semibold text-gray-700">{portfolioPercent.toFixed(0)}%</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      <button 
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium text-sm"
                        onClick={() => handleView(stock.symbol)}
                      >
                        View
                      </button>
                      <button 
                        className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors font-medium text-sm"
                        onClick={() => handleRemove(stock.symbol)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Position Notes */}
                  {stock.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Notes:</span> {stock.notes}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-2xl shadow-sm border border-neutral-light text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="text-6xl mb-6">📊</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">Your portfolio is empty</h3>
              <p className="text-gray-600 mb-8">
                Add your first position to start tracking performance and get AI insights
              </p>
              <button 
                className="px-8 py-4 bg-primary text-white rounded-xl hover:bg-primary-dark transition-all duration-200 font-semibold shadow-lg"
                onClick={handleAddStock}
              >
                🚀 Add Your First Position
              </button>
            </motion.div>
          </div>
        )}
      </motion.div>

      {/* Add Position Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div 
              className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-lg"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Add Position</h2>
                <button
                  onClick={handleCancelAdd}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ×
                </button>
              </div>
              
              {/* Stock Search */}
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2 text-gray-700">Search Stock</label>
                <SmartCompanySearch
                  onSelect={handleSelectStock}
                  placeholder="Search companies..."
                  maxResults={5}
                />
              </div>

              {/* Selected Stock */}
              {selectedStock && (
                <motion.div 
                  className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className="text-sm font-semibold text-green-800">✅ Selected:</p>
                  <p className="font-bold text-green-900">{selectedStock.symbol} - {selectedStock.name}</p>
                </motion.div>
              )}

              {/* Position Details */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Shares</label>
                  <input
                    type="number"
                    value={stockShares}
                    onChange={(e) => setStockShares(parseInt(e.target.value) || 0)}
                    placeholder="100"
                    min="1"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    disabled={isAdding}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Avg Price</label>
                  <input
                    type="number"
                    value={stockAvgPrice}
                    onChange={(e) => setStockAvgPrice(parseFloat(e.target.value) || 0)}
                    placeholder="150.00"
                    step="0.01"
                    min="0"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    disabled={isAdding}
                  />
                </div>
              </div>

              {/* Position Value */}
              {stockShares > 0 && stockAvgPrice > 0 && (
                <motion.div 
                  className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <p className="text-sm text-blue-700">💰 Position Value</p>
                  <p className="text-xl font-bold text-blue-900">
                    ${(stockShares * stockAvgPrice).toLocaleString()}
                  </p>
                </motion.div>
              )}

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2 text-gray-700">Notes (optional)</label>
                <textarea
                  value={stockNotes}
                  onChange={(e) => setStockNotes(e.target.value)}
                  placeholder="Investment thesis or notes..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  rows={2}
                  disabled={isAdding}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCancelAdd}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isAdding}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAdd}
                  disabled={!selectedStock || stockShares <= 0 || stockAvgPrice <= 0 || isAdding}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 transition-colors flex items-center font-semibold"
                >
                  {isAdding ? (
                    <>
                      <LoadingSpinner size="small" />
                      <span className="ml-2">Adding...</span>
                    </>
                  ) : (
                    '✅ Add Position'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MainLayout>
  );
};

export default WatchlistPage;