import React from 'react';

interface StatusItem {
  name: string;
  count: number;
  color: string; // e.g., 'bg-green-500'
}

interface StatusSummaryCardProps {
  title: string;
  icon: React.ReactNode;
  total: number;
  statuses: StatusItem[];
}

export const StatusSummaryCard: React.FC<StatusSummaryCardProps> = ({ title, icon, total, statuses }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 flex flex-col h-full">
      <div className="flex items-center mb-4">
        <div className="bg-gray-100 text-gray-600 p-2 rounded-lg mr-3">{icon}</div>
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
      </div>
      <div className="flex-grow space-y-2">
        {statuses.map(status => (
          <div key={status.name} className="flex justify-between items-center text-sm">
            <div className="flex items-center">
              <span className={`h-2.5 w-2.5 rounded-full ${status.color} mr-2`}></span>
              <span className="text-gray-600">{status.name}</span>
            </div>
            <span className="font-semibold text-gray-800">{status.count}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-200 mt-4 pt-3 flex justify-between items-center">
        <span className="font-bold text-gray-600">Total</span>
        <span className="font-bold text-xl text-gray-800">{total}</span>
      </div>
    </div>
  );
};
