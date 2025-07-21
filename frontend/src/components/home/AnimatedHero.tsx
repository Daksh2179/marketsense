import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const slides = [
  {
    id: 'intro',
    title: 'Welcome to MarketSense',
    subtitle: 'Combining quantitative analysis with news sentiment for enhanced market insights',
    icon: '📊'
  },
  {
    id: 'sentiment',
    title: 'News Sentiment Analysis',
    subtitle: 'We analyze thousands of financial news articles daily to gauge market sentiment',
    icon: '📰'
  },
  {
    id: 'prediction',
    title: 'Enhanced Price Predictions',
    subtitle: 'Our algorithms combine technical analysis with sentiment data for better accuracy',
    icon: '🔮'
  },
  {
    id: 'advantage',
    title: 'Your Market Advantage',
    subtitle: 'Make more informed investment decisions with comprehensive market intelligence',
    icon: '📈'
  }
];

const AnimatedHero: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isAutoPlaying]);
  
  // Simplified animation
  return (
    <div className="bg-gradient-to-r from-primary-dark to-primary p-8 rounded-lg text-white mb-6 overflow-hidden relative">
      <div className="max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={slides[currentSlide].id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
            className="flex items-center"
          >
            <div className="mr-6 text-6xl">{slides[currentSlide].icon}</div>
            <div>
              <h1 className="text-3xl font-bold mb-2">{slides[currentSlide].title}</h1>
              <p className="text-xl">{slides[currentSlide].subtitle}</p>
            </div>
          </motion.div>
        </AnimatePresence>
        
        {/* Slide indicators */}
        <div className="flex justify-center mt-6">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => {
                setCurrentSlide(index);
                setIsAutoPlaying(false);
                // Resume auto-play after inactivity
                setTimeout(() => setIsAutoPlaying(true), 10000);
              }}
              className={`mx-1 w-3 h-3 rounded-full ${
                currentSlide === index ? 'bg-white' : 'bg-white/30'
              } transition-colors duration-200`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnimatedHero;