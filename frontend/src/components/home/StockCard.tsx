import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface StockCardProps {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  additionalInfo?: {
    [key: string]: string | number;
  };
}

const StockCard: React.FC<StockCardProps> = ({
  symbol,
  name,
  price,
  change,
  changePercent,
  additionalInfo
}) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate(`/dashboard/${symbol}`);
  };
  
  return (
    <motion.div
      className="bg-white rounded-lg shadow-sm border border-neutral-light p-4 cursor-pointer"
      whileHover={{ y: -4, boxShadow: '0 10px 15px rgba(0,0,0,0.05)' }}
      onClick={handleClick}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-lg font-bold">{symbol}</h3>
          <p className="text-sm text-neutral-dark">{name}</p>
        </div>
        <div className={`px-2 py-1 rounded text-sm font-medium ${changePercent >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
        </div>
      </div>
      
      <div className="flex justify-between items-baseline">
        <span className="text-xl font-bold">${price.toFixed(2)}</span>
        <span className={`${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {change >= 0 ? '+' : ''}{change.toFixed(2)}
        </span>
      </div>
      
      {additionalInfo && (
        <div className="mt-3 pt-3 border-t border-neutral-light">
          {Object.entries(additionalInfo).map(([key, value]) => (
            <div key={key} className="flex justify-between text-sm">
              <span className="text-neutral">{key}</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default StockCard;