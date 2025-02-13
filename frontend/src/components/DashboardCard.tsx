import React from 'react';

interface DashboardCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-xl p-6 ${className}`}>
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{title}</h3>
      {children}
    </div>
  );
};

export default DashboardCard;