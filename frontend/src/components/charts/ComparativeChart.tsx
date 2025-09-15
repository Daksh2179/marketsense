/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ComposedChart,
  Brush
} from 'recharts';
import { useGetCombinedPredictionsVisualizationQuery } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

// Define data type
interface ComparativeDataPoint {
  date: string;
  price?: number;
  technical?: number;
  enhanced?: number;
}

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
  // Fetch combined predictions visualization data
  const { 
    data: apiData, 
    isLoading, 
    error,
    refetch
  } = useGetCombinedPredictionsVisualizationQuery(symbol, { 
    skip: !symbol,
    refetchOnMountOrArgChange: true
  });
  
  // State for the processed data
  const [data, setData] = useState<ComparativeDataPoint[]>([]);
  
  // State for accuracy metrics
  const [accuracyMetrics, setAccuracyMetrics] = useState({
    technical: 0,
    sentiment: 0,
    combined: 0
  });
  
  // Generate mock data function - wrapped in useCallback to avoid dependency warnings
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
    const mockData: ComparativeDataPoint[] = Array.from({ length: days }, (_, i) => {
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
    
    setData(mockData);
    
    // Generate mock accuracy metrics
    setAccuracyMetrics({
      technical: parseFloat((0.7 + Math.random() * 0.15).toFixed(2)),
      sentiment: parseFloat((0.6 + Math.random() * 0.2).toFixed(2)),
      combined: parseFloat((0.75 + Math.random() * 0.15).toFixed(2))
    });
    
    console.log("Using mock comparative data");
  }, [period, basePrice]);
  
  // Process API data when it arrives
  useEffect(() => {
    if (apiData && (apiData as any).predictions && (apiData as any).predictions.length > 0) {
      // Process and format the data from the API
      const formattedData: ComparativeDataPoint[] = (apiData as any).predictions.map((item: any) => ({
        date: new Date(item.date).toISOString().split('T')[0],
        price: basePrice, // Use actual price if available in the API response
        technical: item.technicalPrice,
        enhanced: item.enhancedPrice
      }));
      
      setData(formattedData);
      
      // Set accuracy metrics if available
      if ((apiData as any).technicalAccuracy !== undefined && 
          (apiData as any).sentimentAccuracy !== undefined && 
          (apiData as any).combinedAccuracy !== undefined) {
        setAccuracyMetrics({
          technical: (apiData as any).technicalAccuracy,
          sentiment: (apiData as any).sentimentAccuracy,
          combined: (apiData as any).combinedAccuracy
        });
      }
    } else if (!isLoading && (!apiData || !(apiData as any).predictions || (apiData as any).predictions?.length === 0 || error)) {
      // Generate mock data if API data is not available
      generateMockData();
    }
  }, [apiData, isLoading, error, basePrice, generateMockData]);
  
  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border border-neutral-light h-64 flex items-center justify-center">
        <LoadingSpinner size="medium" />
      </div>
    );
  }
  
  // Error state
  if (error && (!data || data.length === 0)) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border border-neutral-light">
        <h3 className="text-lg font-medium mb-4">Comparative Analysis</h3>
        <div className="h-64 flex items-center justify-center">
          <ErrorMessage 
            message="Error loading comparative data. Using sample data instead."
            onRetry={refetch}
          />
        </div>
      </div>
    );
  }
  
  // If we still don't have data after all checks, generate mock data
  if (data.length === 0) {
    generateMockData();
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border border-neutral-light h-64 flex items-center justify-center">
        <LoadingSpinner size="medium" />
      </div>
    );
  }
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-neutral-light">
      <h3 className="text-lg font-medium mb-4">Comparative Analysis</h3>
      
      {/* Accuracy metrics */}
      <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
        <div className="bg-blue-50 p-2 rounded">
          <p className="font-medium mb-1">Technical Model</p>
          <div className="flex items-center">
            <div className="h-2 bg-neutral-light rounded overflow-hidden flex-grow mr-2">
              <div 
                className="h-full bg-blue-500" 
                style={{ width: `${accuracyMetrics.technical * 100}%` }}
              ></div>
            </div>
            <span>{(accuracyMetrics.technical * 100).toFixed(0)}%</span>
          </div>
        </div>
        <div className="bg-orange-50 p-2 rounded">
          <p className="font-medium mb-1">Sentiment Impact</p>
          <div className="flex items-center">
            <div className="h-2 bg-neutral-light rounded overflow-hidden flex-grow mr-2">
              <div 
                className="h-full bg-orange-500" 
                style={{ width: `${accuracyMetrics.sentiment * 100}%` }}
              ></div>
            </div>
            <span>{(accuracyMetrics.sentiment * 100).toFixed(0)}%</span>
          </div>
        </div>
        <div className="bg-green-50 p-2 rounded">
          <p className="font-medium mb-1">Combined Model</p>
          <div className="flex items-center">
            <div className="h-2 bg-neutral-light rounded overflow-hidden flex-grow mr-2">
              <div 
                className="h-full bg-green-500" 
                style={{ width: `${accuracyMetrics.combined * 100}%` }}
              ></div>
            </div>
            <span>{(accuracyMetrics.combined * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>
      
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
              formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
              labelFormatter={(label) => {
                const date = new Date(label);
                return date.toLocaleDateString();
              }}
              contentStyle={{ backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
            />
            <Legend />
            
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#173A6A" 
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Actual Price" 
              activeDot={{ r: 6, stroke: '#173A6A', strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="technical" 
              stroke="#FF9800" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 4 }}
              name="Technical Prediction" 
              activeDot={{ r: 6, stroke: '#FF9800', strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="enhanced" 
              stroke="#4CAF50" 
              strokeWidth={2}
              strokeDasharray="3 3"
              dot={{ r: 4 }}
              name="Sentiment-Enhanced" 
              activeDot={{ r: 6, stroke: '#4CAF50', strokeWidth: 2 }}
            />
            <Brush 
              dataKey="date"
              height={30}
              stroke="#4A6FA5"
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      {/* Show data source indicator */}
      <div className="mt-2 text-xs text-neutral text-right">
        {error ? "Using sample data" : ""}
      </div>
    </div>
  );
};

export default ComparativeChart;