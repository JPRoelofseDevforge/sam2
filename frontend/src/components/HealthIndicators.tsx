import React from 'react';
import { BodyComposition } from '../types';
import { safeValue } from './scaleReportUtils';

interface HealthIndicatorsProps {
  athleteBodyComp: BodyComposition;
}

const HealthIndicators: React.FC<HealthIndicatorsProps> = ({ athleteBodyComp }) => {
  return (
    <div className="card-enhanced p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">📋 Health Indicators Overview</h2>

      {/* Metabolic Health */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
          <span className="mr-2">🔥</span>
          Metabolic Health
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-blue-700">Basal Metabolic Rate</span>
              <span className="text-lg font-bold text-blue-600">{safeValue(athleteBodyComp.basalMetabolicRate).toFixed(0)} kcal</span>
            </div>
            <div className="text-xs text-blue-600 mb-2">Daily calories burned at rest</div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${Math.min(100, (safeValue(athleteBodyComp.basalMetabolicRate) / 2500) * 100)}%` }}
              ></div>
            </div>
            <div className="text-xs text-blue-600 mt-1">Range: 1200-2500 kcal</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-green-700">Visceral Fat Grade</span>
              <span className="text-lg font-bold text-green-600">{safeValue(athleteBodyComp.visceralFatGrade)}/10</span>
            </div>
            <div className="text-xs text-green-600 mb-2">Fat around internal organs</div>
            <div className="w-full bg-green-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${Math.min(100, (safeValue(athleteBodyComp.visceralFatGrade) / 10) * 100)}%` }}
              ></div>
            </div>
            <div className="text-xs text-green-600 mt-1">Ideal: 1-3</div>
          </div>
        </div>
      </div>

      {/* Body Composition */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
          <span className="mr-2">💪</span>
          Body Composition
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-purple-700">Fat-Free Body Weight</span>
              <span className="text-lg font-bold text-purple-600">{safeValue(athleteBodyComp.weight - (athleteBodyComp.weight * athleteBodyComp.bodyFat / 100)).toFixed(1)} kg</span>
            </div>
            <div className="text-xs text-purple-600 mb-2">Weight without fat</div>
            <div className="w-full bg-purple-200 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full"
                style={{ width: `${Math.min(100, (safeValue(athleteBodyComp.weight - (athleteBodyComp.weight * athleteBodyComp.bodyFat / 100)) / 80) * 100)}%` }}
              ></div>
            </div>
            <div className="text-xs text-purple-600 mt-1">Higher is better for muscle mass</div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-orange-700">Subcutaneous Fat</span>
              <span className="text-lg font-bold text-orange-600">{safeValue(athleteBodyComp.bodyFat).toFixed(1)}%</span>
            </div>
            <div className="text-xs text-orange-600 mb-2">Fat under the skin</div>
            <div className="w-full bg-orange-200 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full"
                style={{ width: `${Math.min(100, safeValue(athleteBodyComp.bodyFat))}%` }}
              ></div>
            </div>
            <div className="text-xs text-orange-600 mt-1">Healthy range: 8-20%</div>
          </div>
        </div>
      </div>

      {/* Age & Ratios */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-indigo-800 mb-4 flex items-center">
          <span className="mr-2">⏳</span>
          Age & Body Ratios
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg text-center">
            <div className="text-sm font-medium text-indigo-700 mb-1">Body Age</div>
            <div className="text-2xl font-bold text-indigo-600 mb-1">{safeValue(athleteBodyComp.bodyAge)}</div>
            <div className="text-xs text-indigo-600">years</div>
            <div className={`text-xs mt-2 px-2 py-1 rounded-full ${
              safeValue(athleteBodyComp.bodyAge) <= 25 ? 'bg-green-100 text-green-800' :
              safeValue(athleteBodyComp.bodyAge) <= 35 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {safeValue(athleteBodyComp.bodyAge) <= 25 ? 'Excellent' :
               safeValue(athleteBodyComp.bodyAge) <= 35 ? 'Good' : 'Needs Attention'}
            </div>
          </div>
          <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-4 rounded-lg text-center">
            <div className="text-sm font-medium text-pink-700 mb-1">SMI</div>
            <div className="text-2xl font-bold text-pink-600 mb-1">{safeValue(athleteBodyComp.muscleMass / 1.8 ** 2).toFixed(1)}</div>
            <div className="text-xs text-pink-600">kg/m²</div>
            <div className={`text-xs mt-2 px-2 py-1 rounded-full ${
              safeValue(athleteBodyComp.muscleMass / 1.8 ** 2) >= 7.0 ? 'bg-green-100 text-green-800' :
              safeValue(athleteBodyComp.muscleMass / 1.8 ** 2) >= 5.0 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {safeValue(athleteBodyComp.muscleMass / 1.8 ** 2) >= 7.0 ? 'Strong' :
               safeValue(athleteBodyComp.muscleMass / 1.8 ** 2) >= 5.0 ? 'Average' : 'Low'}
            </div>
            <div className="text-xs text-pink-600 mt-2 italic">
              Skeletal Muscle Index - measures muscle mass relative to height
            </div>
          </div>
          <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-4 rounded-lg text-center">
            <div className="text-sm font-medium text-teal-700 mb-1">WHR</div>
            <div className="text-2xl font-bold text-teal-600 mb-1">0.86</div>
            <div className="text-xs text-teal-600">ratio</div>
            <div className="text-xs mt-2 px-2 py-1 rounded-full bg-green-100 text-green-800">
              Healthy
            </div>
            <div className="text-xs text-teal-600 mt-2 italic">
              Waist-to-Hip Ratio - measures body fat distribution and health risks
            </div>
          </div>
        </div>
      </div>

      {/* Health Insights */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-md font-semibold text-gray-800 mb-3">💡 Key Insights</h4>
        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <span><strong>Metabolic Rate:</strong> Your BMR indicates {safeValue(athleteBodyComp.basalMetabolicRate) > 1800 ? 'good muscle mass' : 'potential for improvement'} with strength training.</span>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <span><strong>Body Age:</strong> {safeValue(athleteBodyComp.bodyAge) <= 25 ? 'Excellent! Your body is in peak condition.' : 'Focus on consistent training and nutrition to improve.'}</span>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
            <span><strong>Muscle Quality:</strong> Your SMI suggests {safeValue(athleteBodyComp.muscleMass / 1.8 ** 2) >= 7.0 ? 'excellent muscle quality' : 'room for muscle development'}.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthIndicators;