import React from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface InfoCardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

const InfoCard: React.FC<InfoCardProps> = ({ 
  title, 
  children,
  className = ''
}) => {
  return (
    <motion.div 
      className={`bg-white p-4 rounded-lg shadow-sm border border-neutral-light ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3 className="text-lg font-medium mb-4">{title}</h3>
      {children}
    </motion.div>
  );
};

export default InfoCard;