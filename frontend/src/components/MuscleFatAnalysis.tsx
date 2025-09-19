import React from 'react';
import { BodyComposition } from '../types';
import { safeValue } from './scaleReportUtils';

interface MuscleFatAnalysisProps {
  athleteBodyComp: BodyComposition;
}

const MuscleFatAnalysis: React.FC<MuscleFatAnalysisProps> = ({ athleteBodyComp }) => {
  return (
    <>
      <h2 className="text-xl font-semibold text-white mb-4">📈 Muscle Fat Analysis</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Weight Scale */}
        <div className="card-enhanced p-6">
          <h3 className="text-lg font-semibold text-purple-600 mb-4">⚖️ Weight Analysis</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Current:</span>
              <span className="font-bold text-purple-600">{safeValue(athleteBodyComp.weight).toFixed(1)} kg</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Target Weight:</span>
              <span className="font-bold text-green-600">{athleteBodyComp.targetWeight ? safeValue(athleteBodyComp.targetWeight).toFixed(1) + ' kg' : 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Healthy Range:</span>
              <span className="font-bold text-blue-600">{athleteBodyComp.weightRangeMin && athleteBodyComp.weightRangeMax ? `${safeValue(athleteBodyComp.weightRangeMin)}-${safeValue(athleteBodyComp.weightRangeMax)} kg` : 'N/A'}</span>
            </div>
          </div>
          <div className="mt-4 relative">
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all duration-300"
                style={{
                  width: `${athleteBodyComp.weightRangeMin && athleteBodyComp.weightRangeMax && athleteBodyComp.weightRangeMax !== athleteBodyComp.weightRangeMin ? Math.min(100, Math.max(0, ((safeValue(athleteBodyComp.weight) - safeValue(athleteBodyComp.weightRangeMin)) / (safeValue(athleteBodyComp.weightRangeMax) - safeValue(athleteBodyComp.weightRangeMin))) * 100)) : 50}%`
                }}
              ></div>
            </div>
            {/* Current Weight Marker */}
            <div className="absolute top-0 w-0 h-0" style={{
              left: `${athleteBodyComp.weightRangeMin && athleteBodyComp.weightRangeMax && athleteBodyComp.weightRangeMax !== athleteBodyComp.weightRangeMin ? Math.min(100, Math.max(0, ((safeValue(athleteBodyComp.weight) - safeValue(athleteBodyComp.weightRangeMin)) / (safeValue(athleteBodyComp.weightRangeMax) - safeValue(athleteBodyComp.weightRangeMin))) * 100)) : 50}%`,
              transform: 'translateX(-50%)'
            }}>
              <div className="w-0 h-0 border-l-2 border-r-2 border-b-3 border-l-transparent border-r-transparent border-b-purple-600 mx-auto"></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{athleteBodyComp.weightRangeMin ? `${safeValue(athleteBodyComp.weightRangeMin)}kg` : 'N/A'}</span>
              <span>{athleteBodyComp.weightRangeMax ? `${safeValue(athleteBodyComp.weightRangeMax)}kg` : 'N/A'}</span>
            </div>
          </div>
          <div className="mt-3 p-2 bg-purple-50 rounded text-center">
            <div className="text-xs text-gray-600">Status</div>
            <div className={`text-sm font-semibold ${athleteBodyComp.weightRangeMin && athleteBodyComp.weightRangeMax && athleteBodyComp.weight >= athleteBodyComp.weightRangeMin && athleteBodyComp.weight <= athleteBodyComp.weightRangeMax ? 'text-green-600' : 'text-orange-600'}`}>
              {athleteBodyComp.weightRangeMin && athleteBodyComp.weightRangeMax && athleteBodyComp.weight >= athleteBodyComp.weightRangeMin && athleteBodyComp.weight <= athleteBodyComp.weightRangeMax ? 'Optimal' : 'Needs Adjustment'}
            </div>
          </div>
        </div>

        {/* Skeletal Muscle Scale */}
        <div className="card-enhanced p-6">
          <h3 className="text-lg font-semibold text-green-600 mb-4">💪 Skeletal Muscle Analysis</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Current:</span>
              <span className="font-bold text-green-600">{safeValue(athleteBodyComp.muscleMass).toFixed(1)} kg</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Standard Range:</span>
              <span className="font-bold text-blue-600">30.2-37.0 kg</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Muscle Mass:</span>
              <span className="font-bold text-green-600">{safeValue(athleteBodyComp.muscleMass).toFixed(1)} kg</span>
            </div>
          </div>
          <div className="mt-4 relative">
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{
                  width: `${Math.min(100, ((safeValue(athleteBodyComp.muscleMass) - 30.2) / (37.0 - 30.2)) * 100)}%`
                }}
              ></div>
            </div>
            {/* Current Skeletal Muscle Marker */}
            <div className="absolute top-0 w-0 h-0" style={{
              left: `${Math.min(100, Math.max(0, ((safeValue(athleteBodyComp.muscleMass) - 30.2) / (37.0 - 30.2)) * 100))}%`,
              transform: 'translateX(-50%)'
            }}>
              <div className="w-0 h-0 border-l-2 border-r-2 border-b-3 border-l-transparent border-r-transparent border-b-green-600 mx-auto"></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>30.2kg</span>
              <span>37.0kg</span>
            </div>
          </div>
          <div className="mt-3 p-2 bg-green-50 rounded text-center">
            <div className="text-xs text-gray-600">Muscle Status</div>
            <div className={`text-sm font-semibold ${athleteBodyComp.muscleMass >= 30.2 && athleteBodyComp.muscleMass <= 37.0 ? 'text-green-600' : 'text-orange-600'}`}>
              {athleteBodyComp.muscleMass >= 30.2 && athleteBodyComp.muscleMass <= 37.0 ? 'Excellent' : 'Needs Work'}
            </div>
          </div>
        </div>

        {/* Fat Mass Scale */}
        <div className="card-enhanced p-6">
          <h3 className="text-lg font-semibold text-orange-600 mb-4">🔥 Fat Mass Analysis</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Current:</span>
              <span className="font-bold text-orange-600">{(safeValue(athleteBodyComp.weight) * safeValue(athleteBodyComp.bodyFat) / 100).toFixed(1)} kg</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Body Fat %:</span>
              <span className="font-bold text-orange-600">{safeValue(athleteBodyComp.bodyFat).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Healthy Range:</span>
              <span className="font-bold text-blue-600">8-20%</span>
            </div>
          </div>
          <div className="mt-4 relative">
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 transition-all duration-300"
                style={{
                  width: `${Math.min(100, (safeValue(athleteBodyComp.bodyFat) / 20) * 100)}%`
                }}
              ></div>
            </div>
            {/* Current Fat Mass Marker */}
            <div className="absolute top-0 w-0 h-0" style={{
              left: `${Math.min(100, Math.max(0, (safeValue(athleteBodyComp.bodyFat) / 20) * 100))}%`,
              transform: 'translateX(-50%)'
            }}>
              <div className="w-0 h-0 border-l-2 border-r-2 border-b-3 border-l-transparent border-r-transparent border-b-orange-600 mx-auto"></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>8%</span>
              <span>20%</span>
            </div>
          </div>
          <div className="mt-3 p-2 bg-orange-50 rounded text-center">
            <div className="text-xs text-gray-600">Fat Status</div>
            <div className={`text-sm font-semibold ${athleteBodyComp.bodyFat >= 8 && athleteBodyComp.bodyFat <= 20 ? 'text-green-600' : athleteBodyComp.bodyFat < 8 ? 'text-blue-600' : 'text-red-600'}`}>
              {athleteBodyComp.bodyFat >= 8 && athleteBodyComp.bodyFat <= 20 ? 'Healthy' : athleteBodyComp.bodyFat < 8 ? 'Low' : 'High'}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MuscleFatAnalysis;