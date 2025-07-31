import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import CompanyComparison from '../components/common/CompanyComparison';

const Companies: React.FC = () => {
  return (
    <MainLayout>
      <div className="mb-6">
        <CompanyComparison />
      </div>
    </MainLayout>
  );
};

export default Companies;