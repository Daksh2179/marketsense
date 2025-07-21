import React, { useEffect, useState } from 'react';
import { motion, useAnimation, type Variants, easeOut } from 'framer-motion';
import { useInView } from 'react-intersection-observer';


interface IndexData {
  name: string;
  value: number;
  change: number;
  percentChange: number;
}

const AnimatedMetrics: React.FC = () => {
  const [indices] = useState<IndexData[]>([
    { name: 'S&P 500', value: 5438.32, change: 32.45, percentChange: 0.60 },
    { name: 'NASDAQ', value: 17842.64, change: 87.18, percentChange: 0.49 },
    { name: 'Dow Jones', value: 41256.78, change: -43.12, percentChange: -0.10 },
    { name: 'Russell 2000', value: 2235.42, change: 14.23, percentChange: 0.64 }
  ]);
  
  const controls = useAnimation();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  
  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);
  
 const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { 
      duration: 0.6, 
      ease: easeOut
    }
  }
};
  // Number counter animation component
  const Counter: React.FC<{ value: number, decimals?: number }> = ({ value, decimals = 2 }) => {
    const [count, setCount] = useState(0);
    
    useEffect(() => {
  let start = 0;
  const step = value / 30;
  const timer = setInterval(() => {
    start += step;
    if (start > value) {
      setCount(value);
      clearInterval(timer);
    } else {
      setCount(start);
    }
  }, 20);
  
  return () => clearInterval(timer);
}, [value]);
    
    return <>{count.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</>;
  };
  
  return (
    <motion.div 
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={containerVariants}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
    >
      {indices.map((index) => (
        <motion.div 
          key={index.name} 
          variants={itemVariants}
          className="bg-card-bg p-4 rounded-lg shadow-sm border border-card-border"
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
        >
          <h3 className="text-lg font-semibold">{index.name}</h3>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold">
              {inView ? <Counter value={index.value} /> : "0.00"}
            </span>
            <span className={`flex items-center ${index.percentChange >= 0 ? 'text-positive' : 'text-negative'}`}>
              {index.percentChange >= 0 ? '▲' : '▼'} 
              {inView ? <Counter value={Math.abs(index.change)} /> : "0.00"} 
              ({inView ? <Counter value={Math.abs(index.percentChange)} /> : "0.00"}%)
            </span>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default AnimatedMetrics;