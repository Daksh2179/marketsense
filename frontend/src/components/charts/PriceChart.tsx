import React, { useEffect, useState } from 'react';
import { 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';

// Define data type
interface PriceDataPoint {
  date: string;
  price: number;
  predicted: number;
  upperBound: number;
  lowerBound: number;
}

// Mock data generator function
const generateMockData = (days: number, basePrice: number): PriceDataPoint[] => {
  const today = new Date();
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (days - i - 1));
    
    // Generate a price that fluctuates around the base price
    const fluctuation = (Math.random() - 0.5) * 10;
    const price = Math.max(0, basePrice + fluctuation);
    const predicted = price * (1 + (Math.random() - 0.45) * 0.1);
    const upperBound = predicted * 1.05;
    const lowerBound = predicted * 0.95;
    
    return {
      date: date.toISOString().split('T')[0],
      price: parseFloat(price.toFixed(2)),
      predicted: parseFloat(predicted.toFixed(2)),
      upperBound: parseFloat(upperBound.toFixed(2)),
      lowerBound: parseFloat(lowerBound.toFixed(2))
    };
  });
};

interface PriceChartProps {
  symbol?: string;
  period?: string;
  basePrice?: number;
  showConfidenceBands?: boolean;
}

const PriceChart: React.FC<PriceChartProps> = ({ 
  symbol = 'AAPL',
  period = '1M',
  basePrice = 175.42,
  showConfidenceBands = true
}) => {
  const [data, setData] = useState<PriceDataPoint[]>([]);
  
  useEffect(() => {
    // Map period to number of days
    let days = 30;
    switch (period) {
      case '1D': days = 1; break;
      case '1W': days = 7; break;
      case '1M': days = 30; break;
      case '3M': days = 90; break;
      case '6M': days = 180; break;
      case '1Y': days = 365; break;
    }
    
    // Generate mock data based on period
    const mockData = generateMockData(days, basePrice);
    setData(mockData);
  }, [symbol, period, basePrice]);
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-neutral-light">
      <h3 className="text-lg font-medium mb-4">Price Prediction</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EB" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
              tick={{ fill: '#3E4C59' }}
            />
            <YAxis 
              domain={['auto', 'auto']}
              tick={{ fill: '#3E4C59' }}
              width={40}
            />
            <Tooltip 
              formatter={(value: number) => [`$${value}`, '']}
              labelFormatter={(label) => {
                const date = new Date(label);
                return date.toLocaleDateString();
              }}
            />
            <Legend />
            
            {showConfidenceBands && (
              <Area 
                type="monotone" 
                dataKey="upperBound" 
                stroke="none" 
                fillOpacity={0.1}
                fill="#4A6FA5" 
                name="Confidence Interval" 
              />
            )}
            {showConfidenceBands && (
              <Area 
                type="monotone" 
                dataKey="lowerBound" 
                stroke="none" 
                fillOpacity={0}
                fill="#4A6FA5" 
              />
            )}
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#173A6A" 
              strokeWidth={2} 
              dot={{ r: 4 }}
              name="Actual Price" 
            />
            <Line 
              type="monotone" 
              dataKey="predicted" 
              stroke="#FF9800" 
              strokeWidth={2} 
              strokeDasharray="5 5"
              dot={{ r: 4 }}
              name="Predicted Price" 
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PriceChart;