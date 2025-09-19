import React from 'react';

interface ScaleReportHeaderProps {
  loading: boolean;
  error: string | null;
  hasData: boolean;
}

const ScaleReportHeader: React.FC<ScaleReportHeaderProps> = ({ loading, error, hasData }) => {
  if (loading) {
    return (
      <div className="space-y-8 text-gray-900">
        <h1 className="text-3xl font-bold text-center text-white mb-8">⚖️ Body Composition Analysis</h1>
        <div className="text-center py-12 card-enhanced rounded-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading body composition data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8 text-gray-900">
        <h1 className="text-3xl font-bold text-center text-white mb-8">⚖️ Body Composition Analysis</h1>
        <div className="text-center py-12 card-enhanced rounded-xl">
          <p className="text-red-600 mb-2">⚠️ Error loading data</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="space-y-8 text-gray-900">
        <h1 className="text-3xl font-bold text-center text-white mb-8">⚖️ Body Composition Analysis</h1>
        <div className="text-center py-12 card-enhanced rounded-xl">
          <p className="text-gray-600 mb-2">⚖️ No body composition data available</p>
          <p className="text-sm text-gray-500">
            Please ensure body composition measurements are recorded
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-gray-900">
      <h1 className="text-3xl font-bold text-center text-white mb-8">⚖️ Body Composition Analysis</h1>
    </div>
  );
};

export default ScaleReportHeader;