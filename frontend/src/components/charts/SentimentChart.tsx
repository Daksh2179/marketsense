import React, { useState, useEffect, useCallback } from 'react';
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
  ComposedChart,
  Brush
} from 'recharts';
import { useGetSentimentChartDataQuery } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import NewsIntelligence from '../common/NewsIntelligence';

interface SentimentChartProps {
  symbol?: string;
  period?: string;
}

// Define type for sentiment data that matches API response
interface CombinedSentimentDataPoint {
  date: string;
  sentiment: number;
  volume: number;
}

// Define types for API response format
interface SentimentDataArray {
  date: string;
  sentiment_score: number;
  news_count: number;
}

interface SentimentDataObject {
  dates: string[];
  scores: number[];
  newsCounts: number[];
  buzzScores?: number[];
}

const SentimentChart: React.FC<SentimentChartProps> = ({ 
  symbol = 'AAPL',
  period = '1M'
}) => {
  // Convert period to API format
  const getApiPeriod = (period: string) => {
    switch(period) {
      case '1D': return '1d';
      case '1W': return '1w';
      case '1M': return '1m';
      case '3M': return '3m';
      case '6M': return '6m';
      case '1Y': return '1y';
      default: return '1m';
    }
  };
  
  const apiPeriod = getApiPeriod(period);
  
  // Fetch sentiment data from API
  const { 
    data: sentimentData, 
    isLoading, 
    error,
    refetch
  } = useGetSentimentChartDataQuery({ ticker: symbol, period: apiPeriod }, { 
    skip: !symbol,
    refetchOnMountOrArgChange: true
  });
  
  // State for the processed data
  const [chartData, setChartData] = useState<CombinedSentimentDataPoint[]>([]);
  
  // Generate mock data function wrapped in useCallback
  const generateMockData = useCallback(() => {
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
    
    const today = new Date();
    const mockData: CombinedSentimentDataPoint[] = Array.from({ length: days }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (days - i - 1));
      
      // Generate a sentiment score between -1 and 1
      const sentiment = parseFloat((Math.random() * 2 - 1).toFixed(2));
      // More articles on days with extreme sentiment
      const volume = Math.floor(Math.random() * 200) + 50;
      
      return {
        date: date.toISOString().split('T')[0],
        sentiment,
        volume
      };
    });
    
    setChartData(mockData);
    console.log("Using mock sentiment data");
  }, [period]);
  
  // Process API data when it arrives
  useEffect(() => {
    if (sentimentData && sentimentData.length > 0) {
      // Handle array format (if API returns array)
      if (Array.isArray(sentimentData)) {
        const arrayData = sentimentData as SentimentDataArray[];
        const formattedData: CombinedSentimentDataPoint[] = arrayData.map(item => ({
          date: new Date(item.date).toISOString().split('T')[0],
          sentiment: item.sentiment_score,
          volume: item.news_count
        }));
        setChartData(formattedData);
      }
    } else if (sentimentData && typeof sentimentData === 'object' && !Array.isArray(sentimentData)) {
      // Handle object format (what your API actually returns)
      const objectData = sentimentData as unknown as SentimentDataObject;
      if (objectData.dates && objectData.scores) {
        const formattedData: CombinedSentimentDataPoint[] = objectData.dates.map((date: string, index: number) => ({
          date: new Date(date).toISOString().split('T')[0],
          sentiment: parseFloat(String(objectData.scores[index] || 0)),
          volume: parseInt(String(objectData.newsCounts?.[index] || 0))
        }));
        setChartData(formattedData);
        console.log("Using real sentiment data:", formattedData);
      }
    } else if (!isLoading && (!sentimentData || error)) {
      // Generate mock data if API data is not available
      generateMockData();
    }
  }, [sentimentData, isLoading, error, generateMockData]);
  
  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border border-neutral-light h-64 flex items-center justify-center">
        <LoadingSpinner size="medium" />
      </div>
    );
  }
  
  // Error state
  if (error && (!chartData || chartData.length === 0)) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border border-neutral-light">
        <h3 className="text-lg font-medium mb-4">News Sentiment Analysis</h3>
        <div className="h-64 flex items-center justify-center">
          <ErrorMessage 
            message="Error loading sentiment data. Using sample data instead."
            onRetry={refetch}
          />
        </div>
      </div>
    );
  }
  
  // If we still don't have data after all checks, generate mock data
  if (chartData.length === 0) {
    generateMockData();
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border border-neutral-light h-64 flex items-center justify-center">
        <LoadingSpinner size="medium" />
      </div>
    );
  }
  
return (
  <div className="space-y-4">
    {/* Existing Chart */}
    <div className="bg-white p-4 rounded-lg shadow-sm border border-neutral-light">
      <h3 className="text-lg font-medium mb-4">News Sentiment Analysis</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {/* Your existing chart code stays the same */}
          <ComposedChart data={chartData}>
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
              label={{ value: 'Sentiment', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              domain={[0, 'auto']}
              tick={{ fill: '#3E4C59' }}
              width={40}
              label={{ value: 'Volume', angle: 90, position: 'insideRight', style: { textAnchor: 'middle' } }}
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
              contentStyle={{ backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
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
              activeDot={{ r: 6, stroke: '#173A6A', strokeWidth: 2 }}
            />
            <Brush 
              dataKey="date"
              height={30}
              stroke="#173A6A"
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      {/* Existing legend and data source indicator */}
      <div className="mt-4 grid grid-cols-4 gap-2 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
          <span>Very Positive (&gt;0.5)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-300 mr-2"></div>
          <span>Positive (0 to 0.5)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-orange-400 mr-2"></div>
          <span>Negative (-0.5 to 0)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
          <span>Very Negative (&lt;-0.5)</span>
        </div>
      </div>
      
      <div className="mt-2 text-xs text-neutral text-right">
        {error ? "Using sample data" : chartData.length === 1 ? "Real sentiment data" : ""}
      </div>
    </div>

    {/* New AI News Intelligence */}
    <NewsIntelligence symbol={symbol} />
  </div>
);
};

export default SentimentChart;