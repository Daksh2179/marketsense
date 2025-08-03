# MarketSense - AI-Powered Financial Analytics Platform

A comprehensive financial analytics platform combining real-time market data, sentiment analysis, and AI-driven insights for informed investment decisions.

## Overview

MarketSense integrates traditional quantitative analysis with advanced AI-powered sentiment analysis to provide institutional-grade market insights through an intuitive web interface. The platform leverages Google's Gemini AI for intelligent news analysis and portfolio optimization.

## Key Features

- Real-time stock price monitoring with interactive charts
- AI-powered news sentiment analysis and market impact assessment
- Portfolio tracking with position management and P&L calculations
- Risk-adjusted investment recommendations (Conservative/Neutral/Aggressive)
- Universal company search across 100+ stocks and ETFs
- Interactive sector analysis with performance heatmaps
- Side-by-side company comparison with AI insights
- Responsive design optimized for desktop and mobile

## Technology Stack

**Frontend**
- React 18 with TypeScript
- Redux Toolkit with RTK Query for state management
- Tailwind CSS for responsive styling
- Recharts for data visualization
- Framer Motion for animations
- Vite for build tooling

**Backend**
- Node.js with Express.js framework
- TypeScript for type safety
- PostgreSQL for data persistence
- Winston for structured logging

**AI & External APIs**
- Google Gemini AI (multi-key setup for reliability)
- Alpha Vantage API for stock data
- Finnhub API for company news
- NewsAPI for market headlines

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │  External APIs  │
│                 │    │                 │    │                 │
│ React Components│◄──►│ Express Routes  │◄──►│ Alpha Vantage   │
│ Redux Store     │    │ Controllers     │    │ Finnhub         │
│ Chart Components│    │ Database Models │    │ NewsAPI         │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        
         │                        ▼                        
         │              ┌─────────────────┐               
         │              │   Gemini AI     │               
         └─────────────►│                 │               
                        │ Key 1: News     │               
                        │ Key 2: Portfolio│               
                        │ Key 3: Chatbot  │               
                        └─────────────────┘               
```

## Project Structure

```
marketsense/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── charts/          # Data visualization components
│   │   │   ├── common/          # Reusable UI components
│   │   │   └── layout/          # Layout and navigation
│   │   ├── pages/               # Main application pages
│   │   ├── services/            # API integration layer
│   │   └── store/               # Redux store configuration
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── controllers/         # Request handlers
│   │   ├── models/              # Database models
│   │   ├── routes/              # API route definitions
│   │   ├── services/            # Business logic and external APIs
│   │   └── utils/               # Helper functions and logging
│   └── package.json
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js 18 or higher
- PostgreSQL 14 or higher
- API keys for external services

### Step 1: Clone Repository
```bash
git clone https://github.com/yourusername/marketsense.git
cd marketsense
```

### Step 2: Install Dependencies
```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### Step 3: Environment Configuration
Create `backend/.env` file:
```
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/marketsense

# Gemini AI Keys
GEMINI_API_KEY=your_gemini_key_1
GEMINI_API_KEY_2=your_gemini_key_2
GEMINI_API_KEY_3=your_gemini_key_3

# Financial Data APIs
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
FINNHUB_API_KEY=your_finnhub_key
NEWSAPI_API_KEY=your_newsapi_key

# Server Configuration
PORT=3001
NODE_ENV=development
```

### Step 4: Database Setup
```bash
# Create PostgreSQL database
createdb marketsense

# Database tables will be created automatically on first run
```

### Step 5: Start Development Servers
```bash
# Terminal 1: Start backend (from backend directory)
npm run dev

# Terminal 2: Start frontend (from frontend directory)
npm run dev
```

### Step 6: Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## API Documentation

### Core Endpoints

**Companies**
- `GET /api/companies` - List all tracked companies
- `GET /api/companies/search?query={term}` - Search companies by name or ticker
- `GET /api/companies/{ticker}` - Get detailed company information
- `POST /api/companies/{ticker}/refresh` - Refresh company data from external APIs

**Stock Data**
- `GET /api/stocks/{ticker}/price` - Current stock price and basic metrics
- `GET /api/stocks/{ticker}/history?range={period}` - Historical price data
- `GET /api/stocks/{ticker}/chart?range={period}` - Formatted chart data

**Sentiment Analysis**
- `GET /api/sentiment/{ticker}` - Latest sentiment score
- `GET /api/sentiment/{ticker}/chart?range={period}` - Historical sentiment data
- `GET /api/sentiment/{ticker}/headlines?limit={number}` - News headlines with AI analysis

**AI Portfolio Analysis**
- `POST /api/portfolio/analyze` - Generate AI-powered portfolio recommendations
- `GET /api/portfolio/health` - Check Gemini AI service status

### Request/Response Examples

**Portfolio Analysis Request:**
```json
{
  "stocks": [
    {
      "ticker": "AAPL",
      "name": "Apple Inc.",
      "price": 175.42,
      "changePercent": 1.36,
      "sentiment": 0.68,
      "sector": "Technology",
      "shares": 100,
      "avgPrice": 165.50
    }
  ],
  "riskTolerance": "neutral"
}
```

**Portfolio Analysis Response:**
```json
{
  "overallHealth": "Balanced - Good foundation for steady growth",
  "strengths": ["Diversified sector exposure", "Mix of growth and stability"],
  "weaknesses": ["Room for international exposure"],
  "suggestions": ["Add emerging market exposure", "Monitor rebalancing needs"],
  "riskAssessment": "Moderate risk with balanced growth potential",
  "diversificationScore": 7.5
}
```

## AI Integration Details

### Gemini AI Implementation
The platform uses a sophisticated three-key Gemini AI setup for reliability and load distribution:

**Key Distribution:**
- Key 1: News sentiment analysis and company comparisons
- Key 2: Portfolio optimization and risk assessment
- Key 3: Chatbot responses and sector analysis

**Features:**
- Automatic key rotation for rate limit management
- Intelligent fallback responses when AI services are unavailable
- JSON parsing with error handling for reliable data extraction
- Temperature optimization for different analysis types

### Fallback Strategy
When Gemini AI is unavailable, the system provides intelligent fallback responses that maintain functionality while preserving user experience. This ensures 100% uptime even during AI service outages.

## Development Workflow

### Code Quality
- TypeScript enforcement for type safety
- ESLint configuration for code consistency
- Component-driven development with reusable patterns
- Error boundary implementation for fault tolerance

### Performance Considerations
- Redux Toolkit Query for efficient API caching
- React.memo and useMemo for optimized re-renders
- Debounced search inputs to reduce server load
- Lazy loading for code splitting

### Data Flow
1. External APIs provide raw market data
2. Backend processes and stores data in PostgreSQL
3. Gemini AI analyzes news and generates insights
4. Frontend renders interactive visualizations
5. Real-time updates maintain data freshness

## Deployment

### Production Build
```bash
# Build frontend
cd frontend
npm run build

# Start production backend
cd ../backend
npm run start
```

### Environment Variables for Production
Ensure all API keys and database connections are properly configured for your production environment.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with proper TypeScript types
4. Test thoroughly across different screen sizes
5. Submit a pull request with detailed description

## Technical Achievements

- Implemented real-time financial data visualization with interactive charts
- Built AI-powered sentiment analysis using natural language processing
- Created responsive portfolio management with advanced P&L calculations
- Developed intelligent company search with fuzzy matching algorithms
- Integrated multiple external APIs with robust error handling
- Designed scalable architecture supporting future ML model integration

MarketSense demonstrates modern full-stack development practices combined with AI integration for practical financial applications.