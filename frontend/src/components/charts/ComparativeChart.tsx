import React, { useEffect, useState } from 'react';
import { 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ComposedChart
} from 'recharts';

// Define data type
interface ComparativeDataPoint {
  date: string;
  price: number;
  technical: number;
  enhanced: number;
}

// Mock data generator function
const generateMockComparativeData = (days: number, basePrice: number): ComparativeDataPoint[] => {
  const today = new Date();
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (days - i - 1));
    
    // Generate prices with slight variations
    const fluctuation = (Math.random() - 0.5) * 10;
    const price = Math.max(0, basePrice + fluctuation);
    
    // Technical prediction adds a small upward bias
    const technicalFactor = 1 + (Math.random() * 0.06);
    const technical = price * technicalFactor;
    
    // Enhanced prediction adds sentiment impact
    const sentimentImpact = (Math.random() - 0.3) * 10; // Slight positive bias
    const enhanced = technical + sentimentImpact;
    
    return {
      date: date.toISOString().split('T')[0],
      price: parseFloat(price.toFixed(2)),
      technical: parseFloat(technical.toFixed(2)),
      enhanced: parseFloat(enhanced.toFixed(2))
    };
  });
};

interface ComparativeChartProps {
  symbol?: string;
  period?: string;
  basePrice?: number;
}

const ComparativeChart: React.FC<ComparativeChartProps> = ({ 
  symbol = 'AAPL',
  period = '1M',
  basePrice = 175.42
}) => {
  const [data, setData] = useState<ComparativeDataPoint[]>([]);
  
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
    const mockData = generateMockComparativeData(days, basePrice);
    setData(mockData);
  }, [symbol, period, basePrice]);
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-neutral-light">
      <h3 className="text-lg font-medium mb-4">Comparative Analysis</h3>
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
              dataKey="technical" 
              stroke="#FF9800" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 4 }}
              name="Technical Prediction" 
            />
            <Line 
              type="monotone" 
              dataKey="enhanced" 
              stroke="#4CAF50" 
              strokeWidth={2}
              strokeDasharray="3 3"
              dot={{ r: 4 }}
              name="Sentiment-Enhanced" 
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ComparativeChart;