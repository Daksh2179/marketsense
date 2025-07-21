import React, { useEffect, useState } from 'react';
import { 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Bar,
  ReferenceLine,
  ComposedChart
} from 'recharts';

// Define data type
interface SentimentDataPoint {
  date: string;
  sentiment: number;
  volume: number;
}

// Mock data generator function
const generateMockSentimentData = (days: number): SentimentDataPoint[] => {
  const today = new Date();
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (days - i - 1));
    
    // Generate a sentiment score between -1 and 1
    const sentiment = Math.random() * 2 - 1;
    // More articles on days with extreme sentiment
    const volume = Math.floor(Math.random() * 200) + 50;
    
    return {
      date: date.toISOString().split('T')[0],
      sentiment: parseFloat(sentiment.toFixed(2)),
      volume: volume
    };
  });
};

interface SentimentChartProps {
  symbol?: string;
  period?: string;
}

const SentimentChart: React.FC<SentimentChartProps> = ({ 
  symbol = 'AAPL',
  period = '1M'
}) => {
  const [data, setData] = useState<SentimentDataPoint[]>([]);
  
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
    const mockData = generateMockSentimentData(days);
    setData(mockData);
  }, [symbol, period]);
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-neutral-light">
      <h3 className="text-lg font-medium mb-4">News Sentiment Analysis</h3>
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
              yAxisId="left"
              domain={[-1, 1]}
              tick={{ fill: '#3E4C59' }}
              tickFormatter={(value) => value.toFixed(1)}
              width={40}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              domain={[0, 'auto']}
              tick={{ fill: '#3E4C59' }}
              width={40}
            />
            <Tooltip 
              formatter={(value: number, name: string) => {
                if (name === 'Sentiment') return [value.toFixed(2), name];
                return [value, name];
              }}
              labelFormatter={(label) => {
                const date = new Date(label);
                return date.toLocaleDateString();
              }}
            />
            <Legend />
            <ReferenceLine y={0} stroke="#E4E7EB" strokeWidth={2} yAxisId="left" />
            <Bar 
              dataKey="volume" 
              name="News Volume" 
              yAxisId="right"
              fill="#E4E7EB" 
              opacity={0.6}
              radius={[4, 4, 0, 0]}
            />
            <Line 
              type="monotone" 
              dataKey="sentiment" 
              name="Sentiment" 
              stroke="#173A6A"
              yAxisId="left"
              strokeWidth={2}
              dot={{ r: 4, fill: '#173A6A' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SentimentChart;