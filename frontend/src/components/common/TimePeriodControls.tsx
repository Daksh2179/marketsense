import React, { useState } from 'react';

interface TimePeriodControlsProps {
  onPeriodChange: (period: string) => void;
}

const TimePeriodControls: React.FC<TimePeriodControlsProps> = ({ onPeriodChange }) => {
  const [activePeriod, setActivePeriod] = useState('1M');
  
  const periods = ['1D', '1W', '1M', '3M', '6M', '1Y', 'Custom'];
  
  const handlePeriodChange = (period: string) => {
    setActivePeriod(period);
    onPeriodChange(period);
  };
  
  return (
    <div className="inline-flex rounded-md shadow-sm" role="group">
      {periods.map((period) => (
        <button
          key={period}
          type="button"
          className={
            activePeriod === period
              ? "px-4 py-2 text-sm font-medium bg-primary text-white border border-neutral-light"
              : "px-4 py-2 text-sm font-medium bg-white text-neutral-dark hover:bg-neutral-lightest border border-neutral-light"
          }
          style={{
            borderTopLeftRadius: period === periods[0] ? '0.375rem' : '0',
            borderBottomLeftRadius: period === periods[0] ? '0.375rem' : '0',
            borderTopRightRadius: period === periods[periods.length - 1] ? '0.375rem' : '0',
            borderBottomRightRadius: period === periods[periods.length - 1] ? '0.375rem' : '0'
          }}
          onClick={() => handlePeriodChange(period)}
        >
          {period}
        </button>
      ))}
    </div>
  );
};

export default TimePeriodControls;