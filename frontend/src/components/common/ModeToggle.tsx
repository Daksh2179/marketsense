import React, { useState } from 'react';

interface ModeToggleProps {
  onModeChange: (mode: 'predict' | 'sense') => void;
}

const ModeToggle: React.FC<ModeToggleProps> = ({ onModeChange }) => {
  const [mode, setMode] = useState<'predict' | 'sense'>('predict');
  
  const handleModeChange = (newMode: 'predict' | 'sense') => {
    setMode(newMode);
    onModeChange(newMode);
  };
  
  return (
    <div className="bg-white rounded-lg p-1 inline-flex shadow-sm border border-neutral-light">
      <button
        className={`px-4 py-2 rounded-md text-sm font-medium ${
          mode === 'predict'
            ? 'bg-primary text-white'
            : 'bg-white text-neutral-dark hover:bg-neutral-lightest'
        }`}
        onClick={() => handleModeChange('predict')}
      >
        Predict Mode
      </button>
      <button
        className={`px-4 py-2 rounded-md text-sm font-medium ${
          mode === 'sense'
            ? 'bg-primary text-white'
            : 'bg-white text-neutral-dark hover:bg-neutral-lightest'
        }`}
        onClick={() => handleModeChange('sense')}
      >
        Sense Mode
      </button>
    </div>
  );
};

export default ModeToggle;