import React from 'react';
import { Modal } from './Modal';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: Record<string, any> | null;
}

// Helper to format keys from camelCase or snake_case to Title Case
const formatLabel = (key: string) => {
  if (key === 'ip') return 'IP Address';
  if (key === 'os') return 'Operating System';
  const result = key
    .replace(/([A-Z])/g, ' $1') // For camelCase
    .replace(/_/g, ' ');       // For snake_case
  return result.charAt(0).toUpperCase() + result.slice(1);
};

// Helper to render status badges
const renderStatusBadge = (key: string, value: string) => {
    let badgeClass = 'bg-gray-100 text-gray-800';
    if (key.toLowerCase().includes('status')) {
        switch (value) {
            case 'OK':
            case 'Online':
            case 'Good':
            case 'GOOD':
                badgeClass = 'bg-green-100 text-green-800';
                break;
            case 'NO':
            case 'Offline':
            case 'Platform Problem':
            case 'BAD':
                badgeClass = 'bg-red-100 text-red-800';
                break;
            case 'Repair':
            case 'Maintenance':
            case 'Battery Problem':
                badgeClass = 'bg-yellow-100 text-yellow-800';
                break;
        }
    }
    return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${badgeClass}`}>{value}</span>;
};


export const DetailModal: React.FC<DetailModalProps> = ({ isOpen, onClose, title, data }) => {
  if (!isOpen || !data) return null;

  const { customFields, ...mainData } = data;
  const dataToShow = Object.entries(mainData).filter(([key]) => key !== 'id');
  const customDataToShow = customFields ? Object.entries(customFields) : [];


  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-1">
        {dataToShow.map(([key, value]) => (
          <div key={key} className="grid grid-cols-3 gap-4 py-3 border-b border-gray-100 last:border-b-0">
            <dt className="text-sm font-medium text-gray-600">{formatLabel(key)}</dt>
            <dd className="col-span-2 text-sm text-gray-800 break-words">
              {key.toLowerCase().includes('status') ? renderStatusBadge(key, String(value)) : String(value || 'N/A')}
            </dd>
          </div>
        ))}
        {customDataToShow.length > 0 && (
             <>
                <div className="pt-4">
                    <h4 className="text-md font-semibold text-gray-700 mb-2 border-t pt-4">Custom Fields</h4>
                </div>
                {customDataToShow.map(([key, value]) => (
                    <div key={key} className="grid grid-cols-3 gap-4 py-3 border-b border-gray-100 last:border-b-0">
                        <dt className="text-sm font-medium text-gray-600">{formatLabel(key)}</dt>
                        <dd className="col-span-2 text-sm text-gray-800 break-words">
                           {String(value || 'N/A')}
                        </dd>
                    </div>
                ))}
             </>
        )}
      </div>
      <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">Close</button>
      </div>
    </Modal>
  );
};