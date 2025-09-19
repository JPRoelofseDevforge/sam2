import React from 'react';
import { BodyComposition } from '../types';
import { safeValue } from './scaleReportUtils';

interface WeightControlGoalsProps {
  athleteBodyComp: BodyComposition;
}

const WeightControlGoals: React.FC<WeightControlGoalsProps> = ({ athleteBodyComp }) => {
  return (
    <div className="card-enhanced p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">🎯 Weight Control Goals</h2>

      {/* Current vs Target Overview */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-white rounded-lg shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Current Weight</div>
            <div className="text-2xl font-bold text-blue-600">{safeValue(athleteBodyComp.weight).toFixed(1)} kg</div>
          </div>
          <div className="p-3 bg-white rounded-lg shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Target Weight</div>
            <div className="text-2xl font-bold text-green-600">{safeValue(athleteBodyComp.targetWeight).toFixed(1)} kg</div>
          </div>
          <div className="p-3 bg-white rounded-lg shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Difference</div>
            <div className={`text-2xl font-bold ${safeValue(athleteBodyComp.weight) - safeValue(athleteBodyComp.targetWeight) >= 0 ? 'text-orange-600' : 'text-red-600'}`}>
              {safeValue(athleteBodyComp.weight) - safeValue(athleteBodyComp.targetWeight) >= 0 ? '+' : ''}{(safeValue(athleteBodyComp.weight) - safeValue(athleteBodyComp.targetWeight)).toFixed(1)} kg
            </div>
          </div>
        </div>
      </div>

      {/* Progress Visualization */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">📊 Progress to Target Weight</h3>
        <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg shadow-sm border-2 border-blue-200">
          {/* Current Position Indicator */}
          <div className="flex justify-between items-center text-sm font-medium text-gray-700 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{safeValue(athleteBodyComp.weight).toFixed(1)}kg</div>
              <div className="text-xs text-gray-600">CURRENT</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{safeValue(athleteBodyComp.targetWeight).toFixed(1)}kg</div>
              <div className="text-xs text-gray-600">TARGET</div>
            </div>
          </div>

          {/* Enhanced Progress Bar */}
          <div className="relative mb-4">
            <div className="w-full bg-gray-300 rounded-full h-6 shadow-inner">
              <div
                className="bg-gradient-to-r from-blue-500 via-blue-600 to-green-500 h-6 rounded-full transition-all duration-500 shadow-lg"
                style={{
                  width: `${Math.min(100, Math.max(0, ((safeValue(athleteBodyComp.targetWeight) - safeValue(athleteBodyComp.weight)) / (safeValue(athleteBodyComp.targetWeight) - safeValue(athleteBodyComp.weight) + Math.abs(safeValue(athleteBodyComp.weight) - safeValue(athleteBodyComp.targetWeight)))) * 100))}%`
                }}
              ></div>
            </div>

            {/* Target Marker */}
            <div className="absolute top-0 w-1 h-8 bg-green-600 rounded-full shadow-lg" style={{ left: '100%', transform: 'translateX(-50%)' }}>
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                <div className="text-xs font-bold text-green-600">🎯</div>
              </div>
            </div>

            {/* Current Position Marker */}
            <div className="absolute top-0 w-4 h-10 bg-blue-600 rounded-full shadow-lg border-2 border-white" style={{
              left: `${Math.min(100, Math.max(0, ((safeValue(athleteBodyComp.targetWeight) - safeValue(athleteBodyComp.weight)) / (safeValue(athleteBodyComp.targetWeight) - safeValue(athleteBodyComp.weight) + Math.abs(safeValue(athleteBodyComp.weight) - safeValue(athleteBodyComp.targetWeight)))) * 100))}%`,
              transform: 'translateX(-50%)'
            }}>
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                <div className="text-xs font-bold text-blue-600 whitespace-nowrap">📍 {safeValue(athleteBodyComp.weight).toFixed(1)}kg</div>
              </div>
            </div>
          </div>

          {/* Progress Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="text-sm text-gray-600">Difference</div>
              <div className={`text-lg font-bold ${safeValue(athleteBodyComp.weight) - safeValue(athleteBodyComp.targetWeight) >= 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {safeValue(athleteBodyComp.weight) - safeValue(athleteBodyComp.targetWeight) >= 0 ? '+' : ''}{(safeValue(athleteBodyComp.weight) - safeValue(athleteBodyComp.targetWeight)).toFixed(1)} kg
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="text-sm text-gray-600">Progress</div>
              <div className="text-lg font-bold text-blue-600">
                {Math.min(100, Math.max(0, ((safeValue(athleteBodyComp.targetWeight) - safeValue(athleteBodyComp.weight)) / (safeValue(athleteBodyComp.targetWeight) - safeValue(athleteBodyComp.weight) + Math.abs(safeValue(athleteBodyComp.weight) - safeValue(athleteBodyComp.targetWeight)))) * 100)).toFixed(0)}%
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="text-sm text-gray-600">Status</div>
              <div className={`text-lg font-bold ${safeValue(athleteBodyComp.weight) - safeValue(athleteBodyComp.targetWeight) <= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                {safeValue(athleteBodyComp.weight) - safeValue(athleteBodyComp.targetWeight) <= 0 ? 'On Track' : 'Adjusting'}
              </div>
            </div>
          </div>

          {/* Motivational Message */}
          <div className="mt-4 text-center">
            <div className="text-sm text-gray-700 bg-white p-3 rounded-lg shadow-sm">
              {safeValue(athleteBodyComp.weight) - safeValue(athleteBodyComp.targetWeight) <= 0 ?
                `🎉 Great progress! Only ${Math.abs(safeValue(athleteBodyComp.weight) - safeValue(athleteBodyComp.targetWeight)).toFixed(1)}kg to reach your target!` :
                `💪 You're ${Math.abs(safeValue(athleteBodyComp.weight) - safeValue(athleteBodyComp.targetWeight)).toFixed(1)}kg above target. Let's adjust your plan!`
              }
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weight Control */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
            <span className="mr-2">⚖️</span>
            Weight Management
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2 bg-white rounded">
              <span className="text-sm text-blue-700">Target Weight</span>
              <span className="font-bold text-blue-600">{safeValue(athleteBodyComp.targetWeight).toFixed(1)} kg</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white rounded">
              <span className="text-sm text-blue-700">Current Status</span>
              <span className={`font-bold ${safeValue(athleteBodyComp.weight) - safeValue(athleteBodyComp.targetWeight) >= 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {safeValue(athleteBodyComp.weight) - safeValue(athleteBodyComp.targetWeight) >= 0 ? 'Above Target' : 'On Track'}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white rounded">
              <span className="text-sm text-blue-700">Weekly Goal</span>
              <span className="font-bold text-blue-600">
                {safeValue(athleteBodyComp.weight) - safeValue(athleteBodyComp.targetWeight) > 2 ? `-${Math.min(1.0, (safeValue(athleteBodyComp.weight) - safeValue(athleteBodyComp.targetWeight)) / 8).toFixed(2)} kg/week` :
                 safeValue(athleteBodyComp.weight) - safeValue(athleteBodyComp.targetWeight) > 0 ? `-${Math.min(0.5, (safeValue(athleteBodyComp.weight) - safeValue(athleteBodyComp.targetWeight)) / 8).toFixed(2)} kg/week` :
                 safeValue(athleteBodyComp.weight) - safeValue(athleteBodyComp.targetWeight) < -2 ? `+${Math.min(0.5, Math.abs(safeValue(athleteBodyComp.weight) - safeValue(athleteBodyComp.targetWeight)) / 8).toFixed(2)} kg/week` : 'Maintain'}
              </span>
            </div>
          </div>
        </div>

        {/* Body Composition Goals */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
            <span className="mr-2">💪</span>
            Body Composition Goals
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2 bg-white rounded">
              <span className="text-sm text-green-700">Fat Control</span>
              <span className={`font-bold ${safeValue(athleteBodyComp.bodyFat) - 15 >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {safeValue(athleteBodyComp.bodyFat) - 15 >= 0 ? '+' : ''}{(safeValue(athleteBodyComp.bodyFat) - 15).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white rounded">
              <span className="text-sm text-green-700">Muscle Control</span>
              <span className={`font-bold ${safeValue(athleteBodyComp.muscleMass) - 35 >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {safeValue(athleteBodyComp.muscleMass) - 35 >= 0 ? '+' : ''}{(safeValue(athleteBodyComp.muscleMass) - 35).toFixed(1)} kg
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white rounded">
              <span className="text-sm text-green-700">Target Fat %</span>
              <span className="font-bold text-green-600">15%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Plan */}
      <div className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-purple-800 mb-3">🎯 Action Plan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-700">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
            <div>
              <div className="font-medium">Nutrition Focus</div>
              <div>
                {safeValue(athleteBodyComp.weight) - safeValue(athleteBodyComp.targetWeight) > 2 ? `Calorie deficit: ${Math.round((safeValue(athleteBodyComp.weight) - safeValue(athleteBodyComp.targetWeight)) * 1250)} kcal/day` :
                 safeValue(athleteBodyComp.weight) - safeValue(athleteBodyComp.targetWeight) > 0 ? `Calorie deficit: ${Math.round((safeValue(athleteBodyComp.weight) - safeValue(athleteBodyComp.targetWeight)) * 625)} kcal/day` :
                 safeValue(athleteBodyComp.weight) - safeValue(athleteBodyComp.targetWeight) < -2 ? `Calorie surplus: ${Math.round(Math.abs(safeValue(athleteBodyComp.weight) - safeValue(athleteBodyComp.targetWeight)) * 625)} kcal/day` : 'Balanced nutrition'}
              </div>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <div>
              <div className="font-medium">Training Focus</div>
              <div>
                {safeValue(athleteBodyComp.muscleMass) < 35 ? 'Strength training 3x/week' :
                 safeValue(athleteBodyComp.bodyFat) > 15 ? 'HIIT + cardio 3x/week' : 'Mixed training program'}
              </div>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <div>
              <div className="font-medium">Timeline</div>
              <div>
                {Math.abs(safeValue(athleteBodyComp.weight) - safeValue(athleteBodyComp.targetWeight)) > 5 ? `${Math.round(Math.abs(safeValue(athleteBodyComp.weight) - safeValue(athleteBodyComp.targetWeight)) * 2.4)} weeks` :
                 Math.abs(safeValue(athleteBodyComp.weight) - safeValue(athleteBodyComp.targetWeight)) > 2 ? `${Math.round(Math.abs(safeValue(athleteBodyComp.weight) - safeValue(athleteBodyComp.targetWeight)) * 1.5)} weeks` : '4-6 weeks'}
              </div>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
            <div>
              <div className="font-medium">Monitoring</div>
              <div>Weekly weigh-ins + monthly body composition</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeightControlGoals;