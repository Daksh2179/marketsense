import React, { useState, useRef, useEffect } from 'react';
import { useSearchCompaniesQuery } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import LoadingSpinner from './LoadingSpinner';

interface CompanySearchProps {
  onSelect: (ticker: string) => void;
  placeholder?: string;
  className?: string;
}

const CompanySearch: React.FC<CompanySearchProps> = ({ 
  onSelect, 
  placeholder = "Search stocks...",
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search query to avoid too many API calls
  const debouncedQuery = useDebounce(query, 300);

  // Search for companies
  const { 
    data: searchResults = [], 
    isLoading,
    error 
  } = useSearchCompaniesQuery(debouncedQuery, {
    skip: debouncedQuery.length < 2, // Only search when user has typed at least 2 characters
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(value.length >= 2);
    setSelectedIndex(-1);
  };

  // Handle key navigation
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
  const handleSelectCompany = (company: { ticker: string; name: string }) => {
    onSelect(company.ticker);
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
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
        />
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <LoadingSpinner size="small" />
          </div>
        )}
        
        {/* Search icon */}
        {!isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center">
              <LoadingSpinner size="small" />
              <p className="text-sm text-gray-500 mt-2">Searching...</p>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500 text-sm">
              Error searching companies. Please try again.
            </div>
          ) : searchResults.length > 0 ? (
            <div>
              {searchResults.slice(0, 8).map((company, index) => (
                <button
                  key={company.ticker}
                  onClick={() => handleSelectCompany(company)}
                  className={`w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                    index === selectedIndex ? 'bg-blue-50 border-primary' : ''
                  }`}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{company.ticker}</div>
                      <div className="text-xs text-gray-600 truncate">{company.name}</div>
                      {company.sector && (
                        <div className="text-xs text-gray-500">{company.sector}</div>
                      )}
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
              
              {/* Show "more results" indicator if there are many results */}
              {searchResults.length > 8 && (
                <div className="p-2 text-center text-xs text-gray-500 bg-gray-50">
                  Showing first 8 results. Type more to narrow search.
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500 text-sm">
              No companies found for "{query}". Try a different search term.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompanySearch;