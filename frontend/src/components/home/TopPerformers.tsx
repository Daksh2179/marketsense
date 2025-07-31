import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  percentChange: number;
}

interface TopPerformersProps {
  gainers: Stock[];
  losers: Stock[];
}

const TopPerformers: React.FC<TopPerformersProps> = ({ gainers, losers }) => {
  const navigate = useNavigate();
  
  const handleStockClick = (symbol: string) => {
    navigate(`/dashboard/${symbol}`);
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Top Gainers */}
      <div className="bg-card-bg p-4 rounded-lg shadow-sm border border-card-border">
        <h3 className="text-lg font-semibold mb-3">Top Gainers</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-card-border">
                <th className="py-2 px-3 text-left">Symbol</th>
                <th className="py-2 px-3 text-left">Company</th>
                <th className="py-2 px-3 text-right">Price</th>
                <th className="py-2 px-3 text-right">Change %</th>
              </tr>
            </thead>
            <tbody>
              {gainers.map((stock, index) => (
                <motion.tr 
                  key={stock.symbol} 
                  className="border-t border-card-border hover:bg-sidebar-hover cursor-pointer" 
                  onClick={() => handleStockClick(stock.symbol)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                  whileHover={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
                >
                  <td className="py-2 px-3 font-semibold">{stock.symbol}</td>
                  <td className="py-2 px-3">{stock.name}</td>
                  <td className="py-2 px-3 text-right">${stock.price.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right text-green-500">
                    +{stock.percentChange.toFixed(2)}%
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Top Losers */}
      <div className="bg-card-bg p-4 rounded-lg shadow-sm border border-card-border">
        <h3 className="text-lg font-semibold mb-3">Top Losers</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-card-border">
                <th className="py-2 px-3 text-left">Symbol</th>
                <th className="py-2 px-3 text-left">Company</th>
                <th className="py-2 px-3 text-right">Price</th>
                <th className="py-2 px-3 text-right">Change %</th>
              </tr>
            </thead>
            <tbody>
              {losers.map((stock, index) => (
                <motion.tr 
                  key={stock.symbol} 
                  className="border-t border-card-border hover:bg-sidebar-hover cursor-pointer" 
                  onClick={() => handleStockClick(stock.symbol)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                  whileHover={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
                >
                  <td className="py-2 px-3 font-semibold">{stock.symbol}</td>
                  <td className="py-2 px-3">{stock.name}</td>
                  <td className="py-2 px-3 text-right">${stock.price.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right text-red-500">
                    {stock.percentChange.toFixed(2)}%
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TopPerformers;