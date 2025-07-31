import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import InfoCard from '../components/common/InfoCard';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';

// Enhanced sector data with real companies
const sectorsData = [
  { 
    id: 'technology', 
    name: 'Technology', 
    sentiment: 0.68, 
    change: 1.2, 
    companies: 87,
    description: 'Software, hardware, and digital innovation companies',
    topCompanies: [
      { ticker: 'AAPL', name: 'Apple Inc.', price: 175.42, change: 1.36, sentiment: 0.72 },
      { ticker: 'MSFT', name: 'Microsoft Corp.', price: 415.32, change: 1.32, sentiment: 0.68 },
      { ticker: 'NVDA', name: 'NVIDIA Corp.', price: 223.18, change: 1.26, sentiment: 0.85 },
      { ticker: 'GOOGL', name: 'Alphabet Inc.', price: 173.42, change: 0.49, sentiment: 0.61 },
      { ticker: 'META', name: 'Meta Platforms', price: 473.28, change: -1.85, sentiment: 0.45 }
    ],
    insights: [
      'AI boom driving semiconductor demand',
      'Cloud computing showing sustained growth',
      'Regulatory concerns affecting big tech'
    ]
  },
  { 
    id: 'healthcare', 
    name: 'Healthcare', 
    sentiment: 0.42, 
    change: 0.7, 
    companies: 64,
    description: 'Pharmaceutical, biotech, and medical device companies',
    topCompanies: [
      { ticker: 'JNJ', name: 'Johnson & Johnson', price: 162.45, change: 0.8, sentiment: 0.55 },
      { ticker: 'UNH', name: 'UnitedHealth Group', price: 528.90, change: 1.2, sentiment: 0.48 },
      { ticker: 'PFE', name: 'Pfizer Inc.', price: 29.84, change: -0.5, sentiment: 0.32 },
      { ticker: 'ABBV', name: 'AbbVie Inc.', price: 164.72, change: 0.9, sentiment: 0.58 },
      { ticker: 'MRNA', name: 'Moderna Inc.', price: 89.23, change: -2.1, sentiment: 0.28 }
    ],
    insights: [
      'Drug pricing pressure continues',
      'Biotech innovation driving growth',
      'Aging population supporting demand'
    ]
  },
  { 
    id: 'financial', 
    name: 'Financial Services', 
    sentiment: -0.13, 
    change: -0.3, 
    companies: 72,
    description: 'Banks, insurance, and financial technology companies',
    topCompanies: [
      { ticker: 'JPM', name: 'JPMorgan Chase', price: 296.99, change: -0.93, sentiment: -0.05 },
      { ticker: 'BAC', name: 'Bank of America', price: 42.18, change: -1.2, sentiment: -0.18 },
      { ticker: 'WFC', name: 'Wells Fargo', price: 58.42, change: -0.8, sentiment: -0.22 },
      { ticker: 'GS', name: 'Goldman Sachs', price: 428.90, change: 0.5, sentiment: 0.15 },
      { ticker: 'V', name: 'Visa Inc.', price: 285.47, change: 0.7, sentiment: 0.42 }
    ],
    insights: [
      'Interest rate environment challenging',
      'Credit concerns emerging',
      'Fintech disruption accelerating'
    ]
  },
  { 
    id: 'consumer', 
    name: 'Consumer Discretionary', 
    sentiment: 0.21, 
    change: 0.5, 
    companies: 58,
    description: 'Retail, automotive, and consumer goods companies',
    topCompanies: [
      { ticker: 'AMZN', name: 'Amazon.com Inc.', price: 178.35, change: 1.80, sentiment: 0.65 },
      { ticker: 'TSLA', name: 'Tesla Inc.', price: 193.57, change: -1.25, sentiment: 0.18 },
      { ticker: 'HD', name: 'Home Depot', price: 345.28, change: 0.9, sentiment: 0.38 },
      { ticker: 'TGT', name: 'Target Corp.', price: 128.45, change: -0.6, sentiment: 0.12 },
      { ticker: 'ABNB', name: 'Airbnb Inc.', price: 142.67, change: 2.1, sentiment: 0.52 }
    ],
    insights: [
      'Consumer spending showing resilience',
      'E-commerce growth moderating',
      'Travel demand recovering strongly'
    ]
  },
  { 
    id: 'energy', 
    name: 'Energy', 
    sentiment: -0.35, 
    change: -0.9, 
    companies: 42,
    description: 'Oil, gas, and renewable energy companies',
    topCompanies: [
      { ticker: 'XOM', name: 'Exxon Mobil', price: 114.48, change: -0.45, sentiment: -0.28 },
      { ticker: 'CVX', name: 'Chevron Corp.', price: 156.89, change: -0.8, sentiment: -0.35 },
      { ticker: 'COP', name: 'ConocoPhillips', price: 119.34, change: -1.2, sentiment: -0.42 },
      { ticker: 'SLB', name: 'Schlumberger', price: 48.92, change: -0.9, sentiment: -0.31 },
      { ticker: 'ENPH', name: 'Enphase Energy', price: 95.67, change: 1.8, sentiment: 0.45 }
    ],
    insights: [
      'Oil prices under pressure',
      'Renewable energy transition accelerating',
      'Geopolitical tensions affecting outlook'
    ]
  },
  { 
    id: 'materials', 
    name: 'Materials', 
    sentiment: 0.05, 
    change: 0.1, 
    companies: 38,
    description: 'Mining, chemicals, and construction materials',
    topCompanies: [
      { ticker: 'LIN', name: 'Linde plc', price: 428.55, change: 0.3, sentiment: 0.18 },
      { ticker: 'APD', name: 'Air Products', price: 288.90, change: -0.2, sentiment: 0.08 },
      { ticker: 'SHW', name: 'Sherwin-Williams', price: 298.67, change: 0.8, sentiment: 0.25 },
      { ticker: 'FCX', name: 'Freeport-McMoRan', price: 45.23, change: -1.1, sentiment: -0.15 },
      { ticker: 'NEM', name: 'Newmont Corp.', price: 42.18, change: -0.5, sentiment: -0.08 }
    ],
    insights: [
      'Commodity cycles affecting performance',
      'Infrastructure spending supporting demand',
      'Sustainability focus driving changes'
    ]
  }
];

const SectorAnalysis: React.FC = () => {
  const navigate = useNavigate();
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [expandedSector, setExpandedSector] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const handleSectorSelect = (sectorId: string) => {
    setSelectedSector(sectorId);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 800);
  };

  const handleToggleExpanded = (sectorId: string) => {
    setExpandedSector(expandedSector === sectorId ? null : sectorId);
  };

  const handleViewCompany = (ticker: string) => {
    navigate(`/dashboard/${ticker}`);
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.5) return 'green';
    if (sentiment > 0) return 'blue';
    if (sentiment > -0.5) return 'orange';
    return 'red';
  };

  const getSentimentIcon = (sentiment: number) => {
    if (sentiment > 0.5) return '🚀';
    if (sentiment > 0) return '✅';
    if (sentiment > -0.5) return '⚠️';
    return '❌';
  };

  // Calculate market overview
  const marketOverview = {
    totalCompanies: sectorsData.reduce((sum, sector) => sum + sector.companies, 0),
    avgSentiment: sectorsData.reduce((sum, sector) => sum + sector.sentiment, 0) / sectorsData.length,
    positiveSectors: sectorsData.filter(sector => sector.sentiment > 0).length,
    avgChange: sectorsData.reduce((sum, sector) => sum + sector.change, 0) / sectorsData.length
  };

  return (
    <MainLayout>
      <div className="mb-6 max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Sector Analysis</h1>
        
        {/* Market Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <InfoCard title="Total Companies">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{marketOverview.totalCompanies}</div>
              <div className="text-sm text-gray-500">Tracked stocks</div>
            </div>
          </InfoCard>
          
          <InfoCard title="Market Sentiment">
            <div className="text-center">
              <div className={`text-3xl font-bold ${marketOverview.avgSentiment > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {marketOverview.avgSentiment > 0 ? '+' : ''}{marketOverview.avgSentiment.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">Average score</div>
            </div>
          </InfoCard>
          
          <InfoCard title="Positive Sectors">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{marketOverview.positiveSectors}</div>
              <div className="text-sm text-gray-500">of {sectorsData.length} sectors</div>
            </div>
          </InfoCard>
          
          <InfoCard title="Avg Performance">
            <div className="text-center">
              <div className={`text-3xl font-bold ${marketOverview.avgChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {marketOverview.avgChange > 0 ? '+' : ''}{marketOverview.avgChange.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">Today's change</div>
            </div>
          </InfoCard>
        </div>

        {/* Sector Heatmap Visualization */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <InfoCard title="Sector Performance Heatmap">
            <div className="grid grid-cols-2 gap-2">
              {sectorsData.map((sector) => (
                <motion.div
                  key={sector.id}
                  className={`p-3 rounded-lg text-center cursor-pointer transition-all border-2 ${
                    selectedSector === sector.id 
                      ? 'border-primary bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  } ${
                    sector.sentiment > 0.3 ? 'bg-green-50' :
                    sector.sentiment > 0 ? 'bg-blue-50' :
                    sector.sentiment > -0.3 ? 'bg-orange-50' : 'bg-red-50'
                  }`}
                  onClick={() => handleSectorSelect(sector.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-xs font-medium text-gray-700 truncate">{sector.name}</div>
                  <div className="text-lg font-bold mt-1">
                    {getSentimentIcon(sector.sentiment)} {sector.sentiment.toFixed(2)}
                  </div>
                  <div className={`text-xs mt-1 ${sector.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {sector.change >= 0 ? '+' : ''}{sector.change}%
                  </div>
                </motion.div>
              ))}
            </div>
          </InfoCard>
          
          <InfoCard title="AI Sector Insights">
            <div className="space-y-3">
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-bold text-green-800 text-sm mb-1">🚀 Strongest Momentum</h4>
                <p className="text-green-700 text-sm">Technology sector leading with AI/cloud growth</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <h4 className="font-bold text-orange-800 text-sm mb-1">⚠️ Under Pressure</h4>
                <p className="text-orange-700 text-sm">Energy sector facing commodity headwinds</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-bold text-blue-800 text-sm mb-1">🎯 Opportunity</h4>
                <p className="text-blue-700 text-sm">Healthcare showing value opportunities</p>
              </div>
            </div>
          </InfoCard>
        </div>
        
        {/* All Sectors Table with Dropdowns */}
        <InfoCard title="All Sectors">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-card-border">
                  <th className="py-3 px-4 text-left font-semibold text-gray-700">Sector</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-700">Sentiment</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-700">Change</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-700">Companies</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sectorsData.map((sector) => (
                  <React.Fragment key={sector.id}>
                    {/* Main Sector Row */}
                    <motion.tr 
                      className={`border-t border-card-border hover:bg-neutral-50 transition-colors ${
                        selectedSector === sector.id ? 'bg-blue-50' : ''
                      }`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: sectorsData.indexOf(sector) * 0.05 }}
                    >
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-semibold text-gray-800">{sector.name}</div>
                          <div className="text-xs text-gray-500">{sector.description}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Badge color={getSentimentColor(sector.sentiment)}>
                          {getSentimentIcon(sector.sentiment)} {sector.sentiment.toFixed(2)}
                        </Badge>
                      </td>
                      <td className={`py-3 px-4 text-right font-medium ${sector.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {sector.change >= 0 ? '+' : ''}{sector.change.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-right font-medium">{sector.companies}</td>
                      <td className="py-3 px-4 text-right">
                        <button 
                          className="px-3 py-1 bg-primary text-white rounded-md text-sm hover:bg-primary-dark mr-2 transition-colors"
                          onClick={() => handleToggleExpanded(sector.id)}
                        >
                          {expandedSector === sector.id ? 'Hide' : 'View'} Top 5
                        </button>
                      </td>
                    </motion.tr>

                    {/* Expanded Companies Dropdown */}
                    <AnimatePresence>
                      {expandedSector === sector.id && (
                        <motion.tr
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-gray-50"
                        >
                          <td colSpan={5} className="px-4 py-4">
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                              <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                                🏆 Top 5 Companies in {sector.name}
                              </h4>
                              
                              {/* Companies Grid */}
                              <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 mb-4">
                                {sector.topCompanies.map((company, index) => (
                                  <motion.div
                                    key={company.ticker}
                                    className="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                                    onClick={() => handleViewCompany(company.ticker)}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ scale: 1.02 }}
                                  >
                                    <div className="font-bold text-primary text-sm">{company.ticker}</div>
                                    <div className="text-xs text-gray-600 truncate">{company.name}</div>
                                    <div className="text-sm font-semibold mt-1">${company.price}</div>
                                    <div className={`text-xs ${company.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {company.change >= 0 ? '+' : ''}{company.change}%
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      Sentiment: {company.sentiment.toFixed(2)}
                                    </div>
                                  </motion.div>
                                ))}
                              </div>

                              {/* Sector Insights */}
                              <div className="border-t border-gray-200 pt-3">
                                <h5 className="font-semibold text-gray-700 mb-2">🧠 AI Insights</h5>
                                <ul className="space-y-1">
                                  {sector.insights.map((insight, index) => (
                                    <li key={index} className="text-sm text-gray-600 flex items-start">
                                      <span className="mr-2 text-blue-500">•</span>
                                      <span>{insight}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* View All Button */}
                              <div className="text-center mt-4">
                                <button
                                  onClick={() => navigate(`/companies?sector=${sector.id}`)}
                                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors"
                                >
                                  View All {sector.companies} {sector.name} Companies →
                                </button>
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </InfoCard>
        
        {/* Selected Sector Details */}
        {selectedSector && (
          <div className="mt-6">
            <InfoCard title={`${sectorsData.find(s => s.id === selectedSector)?.name} Sector Analysis`}>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <LoadingSpinner />
                  <span className="ml-3 text-gray-600">Analyzing sector trends...</span>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-4">📊</div>
                    <h3 className="text-lg font-semibold mb-2">Detailed Analysis Coming Soon</h3>
                    <p className="text-gray-600">Advanced sector metrics and comparisons</p>
                  </div>
                </div>
              )}
            </InfoCard>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default SectorAnalysis;