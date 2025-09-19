import React from 'react';
import { BodyComposition } from '../types';
import { safeValue } from './scaleReportUtils';

interface ObesityAnalysisProps {
  athleteBodyComp: BodyComposition;
}

const ObesityAnalysis: React.FC<ObesityAnalysisProps> = ({ athleteBodyComp }) => {
  return (
    <div className="card-enhanced p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">⚖️ Obesity Analysis</h2>
      <div className="space-y-8">
        {/* BMI Analysis */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-700 mb-4 flex items-center">
            <span className="mr-2">📊</span>
            BMI Analysis
          </h3>

          {/* BMI Scale */}
          <div className="mb-4">
            <div className="flex mb-2 relative">
              {/* BMI Scale Background */}
              <div className="absolute inset-0 flex">
                <div className="flex-1 bg-blue-200"></div>
                <div className="flex-1 bg-green-200"></div>
                <div className="flex-1 bg-yellow-200"></div>
                <div className="flex-1 bg-orange-200"></div>
                <div className="flex-1 bg-red-200"></div>
              </div>

              {/* BMI Scale Labels */}
              <div className="relative w-full flex">
                <div className="flex-1 h-8 flex items-center justify-center text-xs font-medium text-blue-800">Underweight</div>
                <div className="flex-1 h-8 flex items-center justify-center text-xs font-medium text-green-800">Normal</div>
                <div className="flex-1 h-8 flex items-center justify-center text-xs font-medium text-yellow-800">Overweight</div>
                <div className="flex-1 h-8 flex items-center justify-center text-xs font-medium text-orange-800">Obese</div>
                <div className="flex-1 h-8 flex items-center justify-center text-xs font-medium text-red-800">Severely Obese</div>
              </div>

              {/* Current BMI Marker */}
              <div className="absolute top-0 w-0 h-0" style={{
                left: `${Math.min(100, Math.max(0, ((safeValue(athleteBodyComp.bmi) - 0) / 40) * 100))}%`,
                transform: 'translateX(-50%)'
              }}>
                <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-blue-600 mx-auto"></div>
                <div className="w-1 h-8 bg-blue-600 mx-auto"></div>
              </div>
            </div>

            {/* BMI Value Labels */}
            <div className="flex justify-between text-xs text-gray-600 mb-2">
              <span>0</span><span>18.5</span><span>25</span><span>30</span><span>35</span><span>40+</span>
            </div>
          </div>

          {/* Current BMI Display */}
          <div className="text-center p-3 bg-white rounded-lg shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Your BMI</div>
            <div className="text-3xl font-bold text-blue-600 mb-1">{safeValue(athleteBodyComp.bmi).toFixed(1)}</div>
            <div className="text-sm font-medium text-gray-700">
              {safeValue(athleteBodyComp.bmi) < 18.5 ? 'Underweight' :
               safeValue(athleteBodyComp.bmi) < 25 ? 'Normal Weight' :
               safeValue(athleteBodyComp.bmi) < 30 ? 'Overweight' :
               safeValue(athleteBodyComp.bmi) < 35 ? 'Obese' : 'Severely Obese'}
            </div>
          </div>
        </div>

        {/* Body Fat Rate Analysis */}
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-700 mb-4 flex items-center">
            <span className="mr-2">🔥</span>
            Body Fat Analysis
          </h3>

          {/* Body Fat Scale */}
          <div className="mb-4">
            <div className="flex mb-2 relative">
              {/* Body Fat Scale Background */}
              <div className="absolute inset-0 flex">
                <div className="flex-1 bg-blue-200"></div>
                <div className="flex-1 bg-green-200"></div>
                <div className="flex-1 bg-yellow-200"></div>
                <div className="flex-1 bg-orange-200"></div>
                <div className="flex-1 bg-red-200"></div>
              </div>

              {/* Body Fat Scale Labels */}
              <div className="relative w-full flex">
                <div className="flex-1 h-8 flex items-center justify-center text-xs font-medium text-blue-800">Essential</div>
                <div className="flex-1 h-8 flex items-center justify-center text-xs font-medium text-green-800">Athletic</div>
                <div className="flex-1 h-8 flex items-center justify-center text-xs font-medium text-yellow-800">Average</div>
                <div className="flex-1 h-8 flex items-center justify-center text-xs font-medium text-orange-800">High</div>
                <div className="flex-1 h-8 flex items-center justify-center text-xs font-medium text-red-800">Obese</div>
              </div>

              {/* Current Body Fat Marker */}
              <div className="absolute top-0 w-0 h-0" style={{
                left: `${Math.min(100, Math.max(0, (safeValue(athleteBodyComp.bodyFat) / 40) * 100))}%`,
                transform: 'translateX(-50%)'
              }}>
                <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-purple-600 mx-auto"></div>
                <div className="w-1 h-8 bg-purple-600 mx-auto"></div>
              </div>
            </div>

            {/* Body Fat Value Labels */}
            <div className="flex justify-between text-xs text-gray-600 mb-2">
              <span>0%</span><span>6%</span><span>14%</span><span>24%</span><span>32%</span><span>40%+</span>
            </div>
          </div>

          {/* Current Body Fat Display */}
          <div className="text-center p-3 bg-white rounded-lg shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Your Body Fat</div>
            <div className="text-3xl font-bold text-purple-600 mb-1">{safeValue(athleteBodyComp.bodyFat).toFixed(1)}%</div>
            <div className="text-sm font-medium text-gray-700">
              {safeValue(athleteBodyComp.bodyFat) < 6 ? 'Essential Fat' :
               safeValue(athleteBodyComp.bodyFat) < 14 ? 'Athletic' :
               safeValue(athleteBodyComp.bodyFat) < 24 ? 'Average' :
               safeValue(athleteBodyComp.bodyFat) < 32 ? 'High' : 'Obese'}
            </div>
          </div>
        </div>

        {/* Health Insights */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-md font-semibold text-gray-800 mb-3">💡 Health Insights</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start space-x-2">
              <div className={`w-3 h-3 rounded-full mt-1 ${safeValue(athleteBodyComp.bmi) < 18.5 ? 'bg-blue-500' : safeValue(athleteBodyComp.bmi) < 25 ? 'bg-green-500' : safeValue(athleteBodyComp.bmi) < 30 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
              <div>
                <div className="font-medium">BMI Status</div>
                <div className="text-gray-600">
                  {safeValue(athleteBodyComp.bmi) < 18.5 ? 'Consider gaining weight for optimal health' :
                   safeValue(athleteBodyComp.bmi) < 25 ? 'Excellent BMI range for health' :
                   safeValue(athleteBodyComp.bmi) < 30 ? 'Consider weight management' : 'Focus on weight reduction for better health'}
                </div>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className={`w-3 h-3 rounded-full mt-1 ${safeValue(athleteBodyComp.bodyFat) < 6 ? 'bg-blue-500' : safeValue(athleteBodyComp.bodyFat) < 14 ? 'bg-green-500' : safeValue(athleteBodyComp.bodyFat) < 24 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
              <div>
                <div className="font-medium">Body Fat Status</div>
                <div className="text-gray-600">
                  {safeValue(athleteBodyComp.bodyFat) < 6 ? 'Essential fat level - monitor closely' :
                   safeValue(athleteBodyComp.bodyFat) < 14 ? 'Optimal for athletic performance' :
                   safeValue(athleteBodyComp.bodyFat) < 24 ? 'Average range - room for improvement' : 'Consider fat reduction strategies'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ObesityAnalysis;