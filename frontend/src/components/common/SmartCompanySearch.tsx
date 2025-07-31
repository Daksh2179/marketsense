import React, { useState, useRef, useEffect } from 'react';
import { useSearchCompaniesQuery } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import LoadingSpinner from './LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';

interface SmartCompanySearchProps {
  onSelect: (company: { ticker: string; name: string; sector?: string }) => void;
  placeholder?: string;
  className?: string;
  maxResults?: number;
}

// Type for extended company database
interface ExtendedCompany {
  ticker: string;
  name: string;
  sector: string;
  aliases: string[];
  score?: number;
  source?: 'api' | 'extended' | 'custom';
}

// Type for search results (combines API and extended results)
interface SearchResult extends ExtendedCompany {
  score: number;
  source: 'api' | 'extended' | 'custom';
}

// Extended company database for fallback when API doesn't have companies
const EXTENDED_COMPANIES: ExtendedCompany[] = [
  // Mega Tech Giants
  { ticker: 'AAPL', name: 'Apple Inc.', sector: 'Technology', aliases: ['apple', 'iphone', 'mac'] },
  { ticker: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology', aliases: ['microsoft', 'windows', 'azure'] },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', aliases: ['google', 'alphabet', 'android'] },
  { ticker: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Discretionary', aliases: ['amazon', 'aws', 'prime'] },
  { ticker: 'META', name: 'Meta Platforms Inc.', sector: 'Technology', aliases: ['meta', 'facebook', 'instagram'] },
  { ticker: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer Discretionary', aliases: ['tesla', 'elon', 'electric'] },
  { ticker: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology', aliases: ['nvidia', 'gpu', 'ai'] },
  { ticker: 'NFLX', name: 'Netflix Inc.', sector: 'Communication Services', aliases: ['netflix', 'streaming'] },

  // AI & Growth Tech (Common AI Recommendations)
  { ticker: 'PLTR', name: 'Palantir Technologies Inc.', sector: 'Technology', aliases: ['palantir', 'data analytics', 'ai'] },
  { ticker: 'COIN', name: 'Coinbase Global Inc.', sector: 'Technology', aliases: ['coinbase', 'crypto', 'bitcoin'] },
  { ticker: 'PANW', name: 'Palo Alto Networks Inc.', sector: 'Technology', aliases: ['palo alto', 'cybersecurity', 'firewall'] },
  { ticker: 'RBLX', name: 'Roblox Corporation', sector: 'Technology', aliases: ['roblox', 'gaming', 'metaverse'] },
  { ticker: 'SNOW', name: 'Snowflake Inc.', sector: 'Technology', aliases: ['snowflake', 'cloud data', 'analytics'] },
  { ticker: 'ROKU', name: 'Roku Inc.', sector: 'Technology', aliases: ['roku', 'streaming', 'tv'] },
  { ticker: 'SQ', name: 'Block Inc.', sector: 'Technology', aliases: ['square', 'block', 'fintech'] },
  { ticker: 'PYPL', name: 'PayPal Holdings Inc.', sector: 'Technology', aliases: ['paypal', 'payments'] },
  { ticker: 'SPOT', name: 'Spotify Technology S.A.', sector: 'Technology', aliases: ['spotify', 'music', 'streaming'] },
  { ticker: 'ZOOM', name: 'Zoom Video Communications', sector: 'Technology', aliases: ['zoom', 'video calls'] },
  { ticker: 'DOCU', name: 'DocuSign Inc.', sector: 'Technology', aliases: ['docusign', 'digital signature'] },

  // Popular ETFs
  { ticker: 'SPY', name: 'SPDR S&P 500 ETF Trust', sector: 'ETF', aliases: ['spy', 's&p 500', 'etf', 'index'] },
  { ticker: 'QQQ', name: 'Invesco QQQ Trust', sector: 'ETF', aliases: ['qqq', 'nasdaq', 'tech etf'] },
  { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', sector: 'ETF', aliases: ['vti', 'total market', 'vanguard'] },
  { ticker: 'VOO', name: 'Vanguard S&P 500 ETF', sector: 'ETF', aliases: ['voo', 's&p 500', 'vanguard'] },
  { ticker: 'VEA', name: 'Vanguard FTSE Developed Markets ETF', sector: 'ETF', aliases: ['vea', 'international', 'developed'] },
  { ticker: 'VWO', name: 'Vanguard FTSE Emerging Markets ETF', sector: 'ETF', aliases: ['vwo', 'emerging markets'] },
  { ticker: 'IJR', name: 'iShares Core S&P Small-Cap ETF', sector: 'ETF', aliases: ['ijr', 'small cap', 'ishares'] },
  { ticker: 'VB', name: 'Vanguard Small-Cap ETF', sector: 'ETF', aliases: ['vb', 'small cap', 'vanguard'] },

  // Finance
  { ticker: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financials', aliases: ['jpmorgan', 'chase', 'banking'] },
  { ticker: 'BAC', name: 'Bank of America Corp.', sector: 'Financials', aliases: ['bofa', 'bank america'] },
  { ticker: 'WFC', name: 'Wells Fargo & Company', sector: 'Financials', aliases: ['wells fargo', 'wells'] },
  { ticker: 'GS', name: 'Goldman Sachs Group Inc.', sector: 'Financials', aliases: ['goldman', 'goldman sachs'] },
  { ticker: 'V', name: 'Visa Inc.', sector: 'Financials', aliases: ['visa', 'payments', 'credit card'] },
  { ticker: 'MA', name: 'Mastercard Incorporated', sector: 'Financials', aliases: ['mastercard', 'payments'] },

  // Healthcare
  { ticker: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', aliases: ['johnson', 'jnj', 'pharma'] },
  { ticker: 'UNH', name: 'UnitedHealth Group Inc.', sector: 'Healthcare', aliases: ['unitedhealth', 'insurance'] },
  { ticker: 'PFE', name: 'Pfizer Inc.', sector: 'Healthcare', aliases: ['pfizer', 'vaccine', 'pharma'] },
  { ticker: 'MRNA', name: 'Moderna Inc.', sector: 'Healthcare', aliases: ['moderna', 'vaccine', 'mrna'] },
  { ticker: 'ABBV', name: 'AbbVie Inc.', sector: 'Healthcare', aliases: ['abbvie', 'pharma'] },

  // Consumer & Retail
  { ticker: 'KO', name: 'The Coca-Cola Company', sector: 'Consumer Staples', aliases: ['coca cola', 'coke'] },
  { ticker: 'PEP', name: 'PepsiCo Inc.', sector: 'Consumer Staples', aliases: ['pepsi', 'pepsico'] },
  { ticker: 'WMT', name: 'Walmart Inc.', sector: 'Consumer Staples', aliases: ['walmart', 'retail'] },
  { ticker: 'TGT', name: 'Target Corporation', sector: 'Consumer Discretionary', aliases: ['target', 'retail'] },
  { ticker: 'COST', name: 'Costco Wholesale Corporation', sector: 'Consumer Staples', aliases: ['costco', 'wholesale'] },
  { ticker: 'HD', name: 'The Home Depot Inc.', sector: 'Consumer Discretionary', aliases: ['home depot', 'hardware'] },

  // Industrial & Transport
  { ticker: 'BA', name: 'The Boeing Company', sector: 'Industrials', aliases: ['boeing', 'airplane', 'aerospace'] },
  { ticker: 'CAT', name: 'Caterpillar Inc.', sector: 'Industrials', aliases: ['caterpillar', 'construction'] },
  { ticker: 'UPS', name: 'United Parcel Service', sector: 'Industrials', aliases: ['ups', 'shipping', 'logistics'] },
  { ticker: 'FDX', name: 'FedEx Corporation', sector: 'Industrials', aliases: ['fedex', 'shipping'] },

  // Enterprise Tech
  { ticker: 'CRM', name: 'Salesforce Inc.', sector: 'Technology', aliases: ['salesforce', 'crm', 'cloud'] },
  { ticker: 'ORCL', name: 'Oracle Corporation', sector: 'Technology', aliases: ['oracle', 'database'] },
  { ticker: 'ADBE', name: 'Adobe Inc.', sector: 'Technology', aliases: ['adobe', 'photoshop', 'creative'] },
  { ticker: 'NOW', name: 'ServiceNow Inc.', sector: 'Technology', aliases: ['servicenow', 'enterprise software'] },
  { ticker: 'SHOP', name: 'Shopify Inc.', sector: 'Technology', aliases: ['shopify', 'ecommerce'] },
  { ticker: 'WDAY', name: 'Workday Inc.', sector: 'Technology', aliases: ['workday', 'hr software'] },

  // Semiconductors
  { ticker: 'AMD', name: 'Advanced Micro Devices', sector: 'Technology', aliases: ['amd', 'cpu', 'processor'] },
  { ticker: 'INTC', name: 'Intel Corporation', sector: 'Technology', aliases: ['intel', 'cpu', 'chips'] },
  { ticker: 'QCOM', name: 'QUALCOMM Incorporated', sector: 'Technology', aliases: ['qualcomm', 'mobile chips'] },
  { ticker: 'AVGO', name: 'Broadcom Inc.', sector: 'Technology', aliases: ['broadcom', 'semiconductors'] },

  // Entertainment & Media
  { ticker: 'DIS', name: 'The Walt Disney Company', sector: 'Communication Services', aliases: ['disney', 'marvel', 'parks'] },
  { ticker: 'WBD', name: 'Warner Bros. Discovery', sector: 'Communication Services', aliases: ['warner', 'hbo', 'discovery'] },

  // Travel & Hospitality
  { ticker: 'ABNB', name: 'Airbnb Inc.', sector: 'Consumer Discretionary', aliases: ['airbnb', 'rental', 'travel'] },
  { ticker: 'UBER', name: 'Uber Technologies Inc.', sector: 'Technology', aliases: ['uber', 'ride', 'transport'] },
  { ticker: 'LYFT', name: 'Lyft Inc.', sector: 'Technology', aliases: ['lyft', 'rideshare'] },

  // Energy
  { ticker: 'XOM', name: 'Exxon Mobil Corporation', sector: 'Energy', aliases: ['exxon', 'oil', 'energy'] },
  { ticker: 'CVX', name: 'Chevron Corporation', sector: 'Energy', aliases: ['chevron', 'oil'] },

  // Electric Vehicle & Clean Energy
  { ticker: 'RIVN', name: 'Rivian Automotive Inc.', sector: 'Consumer Discretionary', aliases: ['rivian', 'electric truck'] },
  { ticker: 'LCID', name: 'Lucid Group Inc.', sector: 'Consumer Discretionary', aliases: ['lucid', 'electric car'] },
  { ticker: 'ENPH', name: 'Enphase Energy Inc.', sector: 'Technology', aliases: ['enphase', 'solar'] },

  // Biotech
  { ticker: 'GILD', name: 'Gilead Sciences Inc.', sector: 'Healthcare', aliases: ['gilead', 'biotech'] },
  { ticker: 'BIIB', name: 'Biogen Inc.', sector: 'Healthcare', aliases: ['biogen', 'biotech'] },

  // REITs (Real Estate Investment Trusts)
  { ticker: 'VNQ', name: 'Vanguard Real Estate ETF', sector: 'ETF', aliases: ['vnq', 'reit', 'real estate'] },
  { ticker: 'O', name: 'Realty Income Corporation', sector: 'Real Estate', aliases: ['realty income', 'reit', 'dividend'] }
];

const SmartCompanySearch: React.FC<SmartCompanySearchProps> = ({ 
  onSelect, 
  placeholder = "Search companies...",
  className = "",
  maxResults = 8
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search query
  const debouncedQuery = useDebounce(query, 200);

  // API search (for companies in your database)
  const { 
    data: apiResults = [], 
    isLoading: isApiLoading
  } = useSearchCompaniesQuery(debouncedQuery, {
    skip: debouncedQuery.length < 2,
  });

  // Fuzzy search function
  const fuzzyMatch = (text: string, pattern: string): number => {
    const textLower = text.toLowerCase();
    const patternLower = pattern.toLowerCase();
    
    // Exact match gets highest score
    if (textLower.includes(patternLower)) {
      return textLower.indexOf(patternLower) === 0 ? 100 : 80;
    }
    
    // Character matching score
    let score = 0;
    let patternIndex = 0;
    
    for (let i = 0; i < textLower.length && patternIndex < patternLower.length; i++) {
      if (textLower[i] === patternLower[patternIndex]) {
        score += 1;
        patternIndex++;
      }
    }
    
    return patternIndex === patternLower.length ? (score / patternLower.length) * 60 : 0;
  };

  // Smart search that combines API results with extended database
  const getSmartResults = (): SearchResult[] => {
    if (debouncedQuery.length < 2) return [];
    
    // Search extended database
    const extendedResults: SearchResult[] = EXTENDED_COMPANIES
      .map(company => {
        const tickerScore = fuzzyMatch(company.ticker, debouncedQuery);
        const nameScore = fuzzyMatch(company.name, debouncedQuery);
        const aliasScore = Math.max(...company.aliases.map(alias => fuzzyMatch(alias, debouncedQuery)));
        const maxScore = Math.max(tickerScore, nameScore, aliasScore);
        
        return { ...company, score: maxScore, source: 'extended' as const };
      })
      .filter(company => company.score > 30)
      .sort((a, b) => b.score - a.score);

    // Combine with API results (API results get priority)
    const apiTickers = new Set(apiResults.map(c => c.ticker));
    const apiResultsWithScore: SearchResult[] = apiResults.map(c => ({ 
      ticker: c.ticker,
      name: c.name,
      sector: c.sector || 'Unknown',
      aliases: [],
      score: 100, 
      source: 'api' as const 
    }));
    
    const combinedResults: SearchResult[] = [
      ...apiResultsWithScore,
      ...extendedResults.filter(c => !apiTickers.has(c.ticker))
    ];

    return combinedResults.slice(0, maxResults);
  };

  const searchResults = getSmartResults();
  const isLoading = isApiLoading && debouncedQuery.length >= 2;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(value.length >= 2);
    setSelectedIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % searchResults.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev <= 0 ? searchResults.length - 1 : prev - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          handleSelectCompany(searchResults[selectedIndex]);
        } else if (searchResults.length > 0) {
          handleSelectCompany(searchResults[0]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle company selection
  const handleSelectCompany = (company: SearchResult) => {
    onSelect({
      ticker: company.ticker,
      name: company.name,
      sector: company.sector
    });
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  // Handle input focus
  const handleFocus = () => {
    if (query.length >= 2) {
      setIsOpen(true);
    }
  };

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      {/* Enhanced Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm transition-all duration-200 text-sm placeholder-gray-500"
        />
        
        {/* Loading or clear button */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {isLoading ? (
            <LoadingSpinner size="small" />
          ) : query.length > 0 ? (
            <button
              onClick={() => {
                setQuery('');
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>

      {/* Enhanced Search Results Dropdown */}
      <AnimatePresence>
        {isOpen && query.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
          >
            {isLoading && searchResults.length === 0 ? (
              <div className="p-4 text-center">
                <LoadingSpinner size="small" />
                <p className="text-sm text-gray-500 mt-2">Searching companies...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="max-h-80 overflow-y-auto">
                {searchResults.map((company, index) => (
                  <motion.button
                    key={`${company.ticker}-${company.source}`}
                    onClick={() => handleSelectCompany(company)}
                    className={`w-full text-left p-4 transition-colors border-b border-gray-50 last:border-b-0 ${
                      index === selectedIndex 
                        ? 'bg-blue-50 border-blue-100' 
                        : 'hover:bg-gray-50'
                    }`}
                    onMouseEnter={() => setSelectedIndex(index)}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <div className="font-semibold text-gray-900 text-sm">
                            {company.ticker}
                          </div>
                          {company.source === 'api' && (
                            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                              Live
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 truncate mt-0.5">
                          {company.name}
                        </div>
                        {company.sector && (
                          <div className="text-xs text-gray-500 mt-1">
                            {company.sector}
                          </div>
                        )}
                      </div>
                      <div className="ml-3 flex-shrink-0">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </motion.button>
                ))}
                
                {/* Smart suggestions footer */}
                <div className="p-3 bg-gray-50 border-t border-gray-100">
                  <p className="text-xs text-gray-500 text-center">
                    💡 Tip: Try "apple", "tesla", "google" or any ticker symbol
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center">
                <div className="text-gray-400 mb-2">🔍</div>
                <p className="text-sm text-gray-500">
                  No companies found for "{query}"
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Try "AAPL", "Tesla", or "Microsoft"
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SmartCompanySearch;