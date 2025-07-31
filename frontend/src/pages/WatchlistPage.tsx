import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import InfoCard from '../components/common/InfoCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SmartCompanySearch from '../components/common/SmartCompanySearch';
import { useAnalyzePortfolioMutation } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

// Enhanced portfolio data with shares and cost basis
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
  const [showAIAnalysis, setShowAIAnalysis] = useState(true);
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
    // Set a reasonable default price (user can edit)
    setStockAvgPrice(100 + Math.random() * 300);
  };

  const handleConfirmAdd = async () => {
    if (!selectedStock || stockShares <= 0 || stockAvgPrice <= 0) {
      alert('Please fill in all fields with valid values');
      return;
    }

    setIsAdding(true);

    // Check if stock is already in portfolio
    const existingStock = portfolio.find(item => item.symbol === selectedStock.symbol);
    if (existingStock) {
      alert('This stock is already in your portfolio!');
      setIsAdding(false);
      return;
    }

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Add stock to portfolio
    const newStock: PortfolioStock = {
      symbol: selectedStock.symbol,
      name: selectedStock.name,
      shares: stockShares,
      avgPrice: stockAvgPrice,
      currentPrice: stockAvgPrice * (0.95 + Math.random() * 0.1), // Simulate current price
      addedOn: new Date().toISOString().split('T')[0],
      notes: stockNotes || `${stockShares} shares of ${selectedStock.symbol}`,
      sector: 'Technology' // Default sector
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

  // Calculate portfolio metrics
  const portfolioMetrics = portfolio.reduce((acc, stock) => {
    const positionValue = stock.shares * stock.currentPrice;
    const costBasis = stock.shares * stock.avgPrice;
    const pnl = positionValue - costBasis;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const pnlPercent = (pnl / costBasis) * 100;

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

  // Real AI Portfolio Analysis with Gemini
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const generateRealPortfolioAnalysis = async () => {
    try {
      const portfolioData = portfolio.map(stock => ({
        ticker: stock.symbol,
        name: stock.name,
        price: stock.currentPrice,
        changePercent: ((stock.currentPrice - stock.avgPrice) / stock.avgPrice) * 100,
        sentiment: 0.1 + (Math.random() - 0.5) * 0.8, // Mock sentiment for now
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
      // Use fallback analysis if AI fails
      setAiAnalysis(generateFallbackAnalysis());
    }
  };

  // Trigger AI analysis when portfolio or risk tolerance changes
  useEffect(() => {
    if (portfolio.length > 0) {
      generateRealPortfolioAnalysis();
    }
  }, [generateRealPortfolioAnalysis, portfolio, riskTolerance]);

  // Fallback analysis for when AI is unavailable
  const generateFallbackAnalysis = (): PortfolioAnalysis => {
    const sectors = [...new Set(portfolio.map(stock => stock.sector))];
    const techWeight = portfolio.filter(s => s.sector === 'Technology').length / portfolio.length;
    const totalValue = portfolioMetrics.totalValue;

    const analyses: Record<RiskTolerance, PortfolioAnalysis> = {
      conservative: {
        overallHealth: portfolioPnLPercent > 5 ? 'Healthy - Good Conservative Returns' : 'Stable - Focus on Risk Management',
        strengths: [
          'Diversified holdings across quality companies',
          totalValue > 50000 ? 'Substantial portfolio size' : 'Building solid foundation',
          positivePositions > portfolio.length / 2 ? 'Majority of positions profitable' : 'Quality stock selection'
        ],
        weaknesses: [
          techWeight > 0.6 ? 'High tech concentration (consider utilities/healthcare)' : 'Consider adding dividend stocks',
          'Missing defensive sectors for stability',
          portfolioPnLPercent < 0 ? 'Portfolio showing losses - review positions' : 'Consider cash allocation'
        ],
        suggestions: [
          'Add dividend aristocrats: KO, JNJ, PG',
          'Reduce tech exposure below 50%',
          'Consider defensive ETFs: VPU (utilities)',
          'Maintain 10-15% cash for opportunities'
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
          'Add international: VEA (developed markets)',
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
          portfolioPnLPercent < 5 ? 'Returns below growth expectations' : 'Could add more momentum plays'
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

  // Use real AI analysis or fallback
  const portfolioAnalysis = aiAnalysis || generateFallbackAnalysis();

  return (
    <MainLayout>
      <div className="mb-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">My Portfolio</h1>
            <p className="text-gray-600 mt-1">Track positions with AI-powered insights</p>
          </div>
          <button 
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium shadow-sm"
            onClick={handleAddStock}
          >
            + Add Position
          </button>
        </div>

        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <InfoCard title="Portfolio Value">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                ${portfolioMetrics.totalValue.toLocaleString()}
              </div>
              <div className={`text-sm font-medium ${portfolioPnLPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {portfolioPnLPercent >= 0 ? '+' : ''}{portfolioPnLPercent.toFixed(1)}% total return
              </div>
            </div>
          </InfoCard>
          
          <InfoCard title="Total P&L">
            <div className="text-center">
              <div className={`text-3xl font-bold ${portfolioMetrics.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {portfolioMetrics.totalPnL >= 0 ? '+' : ''}${portfolioMetrics.totalPnL.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">
                Cost: ${portfolioMetrics.totalCost.toLocaleString()}
              </div>
            </div>
          </InfoCard>
          
          <InfoCard title="Winning Positions">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{positivePositions}</div>
              <div className="text-sm text-gray-500">of {portfolio.length} positions</div>
            </div>
          </InfoCard>
          
          <InfoCard title="Diversification">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {portfolioAnalysis.diversificationScore.toFixed(1)}/10
              </div>
              <div className="text-sm text-gray-500">Risk distribution</div>
            </div>
          </InfoCard>
        </div>

        {/* AI Portfolio Advisor */}
        {showAIAnalysis && (
          <div className="bg-gradient-to-br from-white to-blue-50 p-6 rounded-xl shadow-sm border border-blue-200 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                🤖 AI Portfolio Advisor
                <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                  {isAnalyzing ? 'Analyzing...' : 'Powered by Gemini'}
                </span>
              </h3>
              <div className="flex items-center space-x-2">
                {isAnalyzing && <LoadingSpinner size="small" />}
                <button
                  onClick={() => setShowAIAnalysis(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Risk Tolerance Selector */}
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <span className="text-sm font-medium text-gray-700 mr-4">Advisory Style:</span>
                <div className="flex space-x-2">
                  {(['conservative', 'neutral', 'aggressive'] as RiskTolerance[]).map((risk) => (
                    <button
                      key={risk}
                      onClick={() => setRiskTolerance(risk)}
                      disabled={isAnalyzing}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        riskTolerance === risk
                          ? 'bg-primary text-white shadow-sm'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      } ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {risk === 'conservative' ? '🛡️ Conservative' : 
                       risk === 'neutral' ? '⚖️ Neutral' : 
                       '🚀 Aggressive'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Portfolio Health */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
              <h4 className="font-bold text-gray-800 mb-2">📊 Portfolio Health</h4>
              <p className="text-gray-700 font-medium">{portfolioAnalysis.overallHealth}</p>
            </div>

            {/* Analysis Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              {/* Strengths */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-bold text-green-800 mb-3">✅ Portfolio Strengths</h4>
                <ul className="space-y-2">
                  {portfolioAnalysis.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start text-sm text-green-700">
                      <span className="mr-2 mt-0.5">•</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Improvements */}
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h4 className="font-bold text-orange-800 mb-3">⚠️ Areas for Improvement</h4>
                <ul className="space-y-2">
                  {portfolioAnalysis.weaknesses.map((weakness, index) => (
                    <li key={index} className="flex items-start text-sm text-orange-700">
                      <span className="mr-2 mt-0.5">•</span>
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* AI Suggestions */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-bold text-blue-800 mb-3">🎯 AI Recommendations</h4>
              <ul className="space-y-2">
                {portfolioAnalysis.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start text-sm text-blue-700">
                    <span className="mr-2 mt-0.5">•</span>
                    <span className="font-medium">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Risk Assessment */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Risk Assessment:</span>
                <span className="text-sm text-gray-600">{portfolioAnalysis.riskAssessment}</span>
              </div>
            </div>
          </div>
        )}

        {/* Portfolio Table */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-light overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-800">Portfolio Positions</h3>
          </div>
          
          {portfolio.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-6 text-left font-semibold text-gray-700">Symbol</th>
                    <th className="py-3 px-6 text-left font-semibold text-gray-700">Company</th>
                    <th className="py-3 px-6 text-right font-semibold text-gray-700">Shares</th>
                    <th className="py-3 px-6 text-right font-semibold text-gray-700">Avg Price</th>
                    <th className="py-3 px-6 text-right font-semibold text-gray-700">Current</th>
                    <th className="py-3 px-6 text-right font-semibold text-gray-700">Value</th>
                    <th className="py-3 px-6 text-right font-semibold text-gray-700">P&L</th>
                    <th className="py-3 px-6 text-right font-semibold text-gray-700">% Port</th>
                    <th className="py-3 px-6 text-right font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.map((stock, index) => {
                    const positionValue = stock.shares * stock.currentPrice;
                    const costBasis = stock.shares * stock.avgPrice;
                    const pnl = positionValue - costBasis;
                    const pnlPercent = (pnl / costBasis) * 100;
                    const portfolioPercent = (positionValue / portfolioMetrics.totalValue) * 100;

                    return (
                      <motion.tr 
                        key={stock.symbol}
                        className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <td className="py-4 px-6 font-bold text-primary">{stock.symbol}</td>
                        <td className="py-4 px-6 text-gray-700 max-w-48 truncate">{stock.name}</td>
                        <td className="py-4 px-6 text-right font-medium">{stock.shares.toLocaleString()}</td>
                        <td className="py-4 px-6 text-right text-gray-600">${stock.avgPrice.toFixed(2)}</td>
                        <td className="py-4 px-6 text-right font-semibold">${stock.currentPrice.toFixed(2)}</td>
                        <td className="py-4 px-6 text-right font-bold">${positionValue.toLocaleString()}</td>
                        <td className="py-4 px-6 text-right">
                          <div className={`font-bold ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {pnl >= 0 ? '+' : ''}${pnl.toLocaleString()}
                            <div className="text-xs">
                              ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%)
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right text-sm text-gray-600">
                          {portfolioPercent.toFixed(1)}%
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end space-x-2">
                            <button 
                              className="px-3 py-1 bg-primary text-white rounded-md text-sm hover:bg-primary-dark transition-colors"
                              onClick={() => handleView(stock.symbol)}
                            >
                              View
                            </button>
                            <button 
                              className="px-3 py-1 bg-red-100 text-red-600 rounded-md text-sm hover:bg-red-200 transition-colors"
                              onClick={() => handleRemove(stock.symbol)}
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">Your portfolio is empty</h3>
              <p className="text-gray-600 mb-6">Add positions to track performance and get AI insights</p>
              <button 
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
                onClick={handleAddStock}
              >
                Add your first position
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Add Position Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div 
              className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg mx-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <h2 className="text-xl font-bold mb-4">Add Position to Portfolio</h2>
              
              {/* Stock Search */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Search for a stock</label>
                <SmartCompanySearch
                  onSelect={handleSelectStock}
                  placeholder="Search any company..."
                  maxResults={5}
                />
              </div>

              {/* Selected Stock Display */}
              {selectedStock && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800">Selected:</p>
                  <p className="font-bold text-green-900">{selectedStock.symbol} - {selectedStock.name}</p>
                </div>
              )}

              {/* Position Details */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Number of Shares</label>
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
                  <label className="block text-sm font-medium mb-2">Average Price</label>
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

              {/* Position Value Preview */}
              {stockShares > 0 && stockAvgPrice > 0 && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Position Value:</strong> ${(stockShares * stockAvgPrice).toLocaleString()}
                  </p>
                </div>
              )}

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Notes (optional)</label>
                <textarea
                  value={stockNotes}
                  onChange={(e) => setStockNotes(e.target.value)}
                  placeholder="Investment thesis or notes..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  rows={3}
                  disabled={isAdding}
                />
              </div>

              {/* Action Buttons */}
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
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {isAdding ? (
                    <>
                      <LoadingSpinner size="small" />
                      <span className="ml-2">Adding...</span>
                    </>
                  ) : (
                    'Add Position'
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