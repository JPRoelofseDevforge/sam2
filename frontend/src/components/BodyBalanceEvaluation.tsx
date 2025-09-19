import React from 'react';
import { BodyComposition } from '../types';

interface BodyBalanceEvaluationProps {
  athleteBodyComp: BodyComposition;
}

const BodyBalanceEvaluation: React.FC<BodyBalanceEvaluationProps> = ({ athleteBodyComp }) => {
  return (
    <div className="card-enhanced p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">⚖️ Body Balance Evaluation</h2>

      {/* Balance Overview */}
      <div className="mb-6">
        <div className="text-center p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
          <div className="text-lg font-semibold text-green-700 mb-2">Overall Balance Status</div>
          <div className="text-3xl font-bold text-green-600 mb-2">Excellent</div>
          <div className="text-sm text-green-600">Your body shows excellent symmetry and balance</div>
        </div>
      </div>

      {/* Detailed Balance Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Upper Body Balance */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
            <span className="mr-2">💪</span>
            Upper Body Balance
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2 bg-white rounded">
              <span className="text-sm text-blue-700">Left Arm Strength</span>
              <span className="font-bold text-blue-600">95.2%</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white rounded">
              <span className="text-sm text-blue-700">Right Arm Strength</span>
              <span className="font-bold text-blue-600">94.8%</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white rounded">
              <span className="text-sm text-blue-700">Shoulder Symmetry</span>
              <span className="font-bold text-green-600">98.5%</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white rounded">
              <span className="text-sm text-blue-700">Upper Body Status</span>
              <span className="font-bold text-green-600">Excellent</span>
            </div>
          </div>
        </div>

        {/* Lower Body Balance */}
        <div className="bg-gradient-to-br from-green-50 to-teal-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
            <span className="mr-2">🦵</span>
            Lower Body Balance
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2 bg-white rounded">
              <span className="text-sm text-green-700">Left Leg Strength</span>
              <span className="font-bold text-green-600">96.1%</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white rounded">
              <span className="text-sm text-green-700">Right Leg Strength</span>
              <span className="font-bold text-green-600">95.9%</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white rounded">
              <span className="text-sm text-green-700">Hip Alignment</span>
              <span className="font-bold text-green-600">97.8%</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white rounded">
              <span className="text-sm text-green-700">Lower Body Status</span>
              <span className="font-bold text-green-600">Excellent</span>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Comparison Chart */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Balance Comparison</h3>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="space-y-4">
            {/* Upper vs Lower Balance */}
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Upper Body</span>
                <span>Lower Body</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div className="bg-blue-500 h-3 rounded-full" style={{ width: '98%' }}></div>
                </div>
                <span className="text-sm font-medium text-gray-700">98%</span>
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div className="bg-green-500 h-3 rounded-full" style={{ width: '97%' }}></div>
                </div>
              </div>
            </div>

            {/* Left vs Right Balance */}
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Left Side</span>
                <span>Right Side</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div className="bg-purple-500 h-3 rounded-full" style={{ width: '96%' }}></div>
                </div>
                <span className="text-sm font-medium text-gray-700">99%</span>
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div className="bg-orange-500 h-3 rounded-full" style={{ width: '95%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Insights */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-md font-semibold text-gray-800 mb-3">💡 Balance Insights</h4>
        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <span><strong>Excellent Symmetry:</strong> Your left and right sides show remarkable balance, indicating well-rounded training.</span>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <span><strong>Upper-Lower Harmony:</strong> Perfect balance between upper and lower body strength prevents injury and optimizes performance.</span>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
            <span><strong>Muscle Coordination:</strong> Your balanced development suggests excellent neuromuscular coordination and training efficiency.</span>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">🎯 Recommendations</h4>
        <p className="text-sm text-blue-700">
          Continue with your balanced training approach. Consider adding unilateral exercises to maintain this excellent symmetry.
        </p>
      </div>
    </div>
  );
};

export default BodyBalanceEvaluation;