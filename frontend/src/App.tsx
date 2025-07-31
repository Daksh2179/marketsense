import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import SectorAnalysis from './pages/SectorAnalysis';
import WatchlistPage from './pages/WatchlistPage';
import NotFound from './pages/NotFound';
import Companies from './pages/Companies';

// Placeholder components for routes that aren't fully implemented yet
const ComingSoon: React.FC<{ feature: string }> = ({ feature }) => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center">
      <h1 className="text-3xl font-bold mb-4">{feature}</h1>
      <p className="text-xl">Coming Soon!</p>
      <p className="mt-2 text-neutral-dark">This feature is under development.</p>
    </div>
  </div>
);

function App() {
  return (
    <Provider store={store}>
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/:symbol" element={<Dashboard />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/sectors" element={<SectorAnalysis />} />
          <Route path="/watchlist" element={<WatchlistPage />} />
          <Route path="/settings" element={<ComingSoon feature="Settings" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </Provider>
  );
}

export default App;