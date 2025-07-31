import React from 'react';
import type { ReactNode } from 'react';

type BadgeColor = 'green' | 'red' | 'blue' | 'orange' | 'gray';

interface BadgeProps {
  children: ReactNode;
  color?: BadgeColor;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ 
  children, 
  color = 'gray',
  className = ''
}) => {
  const colorClasses = {
    green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    gray: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  };
  
  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${colorClasses[color]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;