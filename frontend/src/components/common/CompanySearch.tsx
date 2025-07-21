import React, { useState } from 'react';

const CompanySearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);
  
  // Mock data for demonstration
  const mockCompanies = [
    'Apple Inc. (AAPL)', 
    'Microsoft Corporation (MSFT)', 
    'Amazon.com Inc. (AMZN)',
    'Alphabet Inc. (GOOGL)',
    'Meta Platforms Inc. (META)'
  ];
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.length > 1) {
      // Filter mock companies based on input
      const filtered = mockCompanies.filter(company => 
        company.toLowerCase().includes(value.toLowerCase())
      );
      setResults(filtered);
    } else {
      setResults([]);
    }
  };
  
  return (
    <div className="relative">
      <div className="flex items-center border border-neutral-light rounded-lg overflow-hidden bg-white">
        <div className="pl-3">
          <svg className="w-5 h-5 text-neutral" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </div>
        <input
          type="text"
          className="w-full py-2 px-3 text-neutral-darkest bg-transparent focus:outline-none"
          placeholder="Search for a company or ticker..."
          value={query}
          onChange={handleSearch}
        />
      </div>
      
      {results.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-light rounded-md shadow-lg max-h-60 overflow-auto">
          <ul className="py-1">
            {results.map((company, index) => (
              <li 
                key={index}
                className="px-4 py-2 hover:bg-neutral-lightest cursor-pointer"
                onClick={() => {
                  setQuery(company);
                  setResults([]);
                }}
              >
                {company}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CompanySearch;