import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-medium mb-6">Page Not Found</h2>
        <p className="text-neutral-dark mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex space-x-4">
          <button 
            className="px-4 py-2 bg-neutral-light rounded-md hover:bg-neutral-lightest"
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
          <button 
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
            onClick={() => navigate('/')}
          >
            Go Home
          </button>
        </div>
      </div>
    </MainLayout>
  );
};

export default NotFound;