import React from 'react';
import { BodyComposition } from '../types';
import { safeValue } from './scaleReportUtils';

interface BodyTypeAssessmentProps {
  athleteBodyComp: BodyComposition;
}

const BodyTypeAssessment: React.FC<BodyTypeAssessmentProps> = ({ athleteBodyComp }) => {
  return (
    <div className="card-enhanced p-6 mt-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">🏋️ Body Type Assessment</h2>
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-lg">
        <div className="mb-4 text-center">
          <div className="text-sm text-gray-600 mb-1">Your Current Position</div>
          <div className="text-lg font-semibold text-indigo-700">
            BMI: {safeValue(athleteBodyComp.bmi).toFixed(1)} | Body Fat: {safeValue(athleteBodyComp.bodyFat).toFixed(1)}%
          </div>
        </div>

        {/* Body Type Grid */}
        <div className="relative bg-white rounded-lg p-4 shadow-sm">
          {/* Grid Container */}
          <div className="relative w-full h-96 border border-gray-200 rounded-lg overflow-hidden">
            {/* Grid Background */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
              {/* Row 1 (BMI 25-30) */}
              <div className="bg-gray-100 border-r border-b border-gray-200 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-700 text-center">Too thin</span>
              </div>
              <div className="bg-gray-100 border-r border-b border-gray-200 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-700 text-center">Thin</span>
              </div>
              <div className="bg-gray-100 border-b border-gray-200 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-700 text-center">Invisible fat</span>
              </div>

              {/* Row 2 (BMI 20-25) */}
              <div className="bg-gray-100 border-r border-b border-gray-200 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-700 text-center">Muscular slim</span>
              </div>
              <div className="bg-teal-100 border-r border-b border-gray-200 flex items-center justify-center relative">
                <span className="text-xs font-semibold text-teal-800 text-center">Fit</span>
                <div className="absolute inset-0 border-2 border-teal-300 rounded-sm"></div>
              </div>
              <div className="bg-gray-100 border-b border-gray-200 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-700 text-center">Slightly fat</span>
              </div>

              {/* Row 3 (BMI 15-20) */}
              <div className="bg-gray-100 border-r border-gray-200 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-700 text-center">Athletes</span>
              </div>
              <div className="bg-gray-100 border-r border-gray-200 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-700 text-center">Muscle</span>
              </div>
              <div className="bg-gray-100 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-700 text-center">Overweight</span>
              </div>
            </div>

            {/* Current Position Marker */}
            {(() => {
              const bmi = safeValue(athleteBodyComp.bmi);
              const fatRate = safeValue(athleteBodyComp.bodyFat);

              // Calculate position (inverse Y axis since lower BMI is at bottom)
              const xPos = Math.min(100, Math.max(0, (fatRate / 30) * 100));
              const yPos = Math.min(100, Math.max(0, 100 - ((bmi - 15) / 15) * 100));

              return (
                <div
                  className="absolute w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg z-10"
                  style={{
                    left: `${xPos}%`,
                    top: `${yPos}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div className="absolute inset-0 bg-red-500 rounded-full animate-pulse"></div>
                </div>
              );
            })()}
          </div>

          {/* Axis Labels */}
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            <span>Body Fat Rate (%)</span>
            <span>BMI (kg/m²)</span>
          </div>

          {/* X-axis Values */}
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>0</span>
            <span>10</span>
            <span>20</span>
            <span>30</span>
          </div>

          {/* Y-axis Values (right side) */}
          <div className="absolute right-2 top-4 bottom-4 flex flex-col justify-between text-xs text-gray-500">
            <span>30</span>
            <span>25</span>
            <span>20</span>
            <span>15</span>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 p-3 bg-white rounded-lg">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">📍 Your Position</h4>
          <div className="flex items-center space-x-2 text-sm">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-700">Current BMI & Body Fat position</span>
          </div>
          <div className="mt-2 text-xs text-gray-600">
            💡 The highlighted "Fit" region represents the optimal balance of BMI and body fat for health and fitness.
          </div>
        </div>
      </div>
    </div>
  );
};

export default BodyTypeAssessment;