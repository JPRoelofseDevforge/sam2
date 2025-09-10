import React from 'react';
import { Alert } from '../types';

interface AlertCardProps {
  alert: Alert;
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert }) => {
  const getAlertStyles = () => {
    switch (alert.type) {
      case 'inflammation':
      case 'airway':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'circadian':
      case 'nutrition':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'green':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getAlertIcon = () => {
    switch (alert.type) {
      case 'inflammation':
        return '🔥';
      case 'circadian':
        return '🌙';
      case 'nutrition':
        return '🥗';
      case 'airway':
        return '🌬️';
      case 'green':
        return '✅';
      default:
        return '📊';
    }
  };

  return (
    <div className={`card-enhanced p-5 rounded-xl border-l-4 ${getAlertStyles()} mb-4`}>
      <div className="flex items-start">
        <div className="text-2xl mr-3 mt-1">{getAlertIcon()}</div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-2">{alert.title}</h3>
          <div className="mb-3">
            <p className="font-medium mb-1">Cause:</p>
            <p className="text-sm opacity-90">{alert.cause}</p>
          </div>
          <div>
            <p className="font-medium mb-1">Recommendation:</p>
            <p className="text-sm opacity-90">{alert.rec}</p>
          </div>
        </div>
      </div>
    </div>
  );
};