import React from 'react';
import { BaseComponentProps, ChartConfig } from '../../types';

interface ChartContainerProps extends BaseComponentProps {
  config: ChartConfig;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  config,
  loading = false,
  error = null,
  onRetry,
  height = 300,
  showLegend = true,
  showGrid = true,
  className = '',
}) => {
  if (loading) {
    return (
      <div
        className={`card-enhanced p-6 ${className}`}
        style={{ height }}
      >
        <div className="animate-pulse h-full">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`card-enhanced p-6 ${className}`}
        style={{ height }}
      >
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="text-red-500 text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Chart Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reload Chart
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!config.data || config.data.length === 0) {
    return (
      <div
        className={`card-enhanced p-6 ${className}`}
        style={{ height }}
      >
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="text-gray-400 text-4xl mb-4">📈</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-600">There is no data to display for this chart.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`card-enhanced p-6 ${className}`}>
      {/* Chart Header */}
      <div className="mb-4">
        {config.title && (
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{config.title}</h3>
        )}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {config.data.length} data points
          </div>
          {config.goalValue && config.goalLabel && (
            <div className="flex items-center text-sm">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: config.color || '#6c00ff' }}
              ></div>
              <span className="text-gray-600">{config.goalLabel}: {config.goalValue}</span>
            </div>
          )}
        </div>
      </div>

      {/* Chart Content - This would be replaced with actual chart library components */}
      <div
        className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-gray-600 mb-2">Chart Component</p>
          <p className="text-sm text-gray-500">
            Replace this with your preferred chart library (Recharts, Chart.js, etc.)
          </p>
          <div className="mt-4 text-xs text-gray-400">
            Data points: {config.data.length}
            {config.goalValue && ` | Goal: ${config.goalValue}`}
            {config.teamAverage && ` | Team Avg: ${config.teamAverage}`}
          </div>
        </div>
      </div>

      {/* Legend */}
      {showLegend && (config.goalValue || config.teamAverage) && (
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          {config.goalValue && (
            <div className="flex items-center">
              <div className="w-3 h-0.5 bg-purple-500 mr-2"></div>
              <span className="text-gray-600">{config.goalLabel || 'Goal'}</span>
            </div>
          )}
          {config.teamAverage && (
            <div className="flex items-center">
              <div className="w-3 h-0.5 bg-blue-500 mr-2"></div>
              <span className="text-gray-600">Team Average</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};