import React from 'react';
import { Link } from 'react-router-dom';
import { PeripheralLogEntry } from '../types';
import { ClockIcon } from './Icons';

interface RecentActivityCardProps {
  title: string;
  logs: PeripheralLogEntry[];
}

export const RecentActivityCard: React.FC<RecentActivityCardProps> = ({ title, logs }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 flex flex-col h-full">
      <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>
      <div className="flex-grow space-y-4">
        {logs.length > 0 ? (
          logs.map(log => (
            <div key={log.id} className="flex items-start space-x-3">
              <div className="bg-blue-100 text-blue-600 rounded-full p-2 mt-1">
                <ClockIcon />
              </div>
              <div>
                <p className="font-semibold text-gray-700 text-sm">{log.productName}</p>
                <p className="text-gray-500 text-xs mt-0.5">{log.comment}</p>
                {log.pcUsername && (
                    <p className="text-gray-500 text-xs mt-0.5">
                        Assigned to: <span className="font-semibold text-gray-600">{log.pcUsername}</span>
                    </p>
                )}
                <p className="text-gray-400 text-xs mt-1">{log.date}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-8">No recent activity.</p>
        )}
      </div>
       <Link
            to="/mouse-log"
            className="mt-4 text-sm text-blue-600 hover:underline font-semibold self-start"
        >
            View All
        </Link>
    </div>
  );
};