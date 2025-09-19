import React from 'react';
import { BodyComposition } from '../types';
import { safeValue } from './scaleReportUtils';

interface BodyScoreAnalysisProps {
  athleteBodyComp: BodyComposition;
}

const BodyScoreAnalysis: React.FC<BodyScoreAnalysisProps> = ({ athleteBodyComp }) => {
  return (
    <div className="card-enhanced p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">🏆 Body Score Analysis</h2>

      {/* Calculate Body Score */}
      {(() => {
        // BMI Score (25 points max) - Optimal BMI is 22
        const bmiScore = Math.max(0, Math.min(25, 25 - Math.abs(safeValue(athleteBodyComp.bmi) - 22) * 2));

        // Body Fat Score (25 points max) - Optimal body fat is 15%
        const bodyFatScore = Math.max(0, Math.min(25, 25 - Math.abs(safeValue(athleteBodyComp.bodyFat) - 15) * 1.5));

        // Muscle Mass Score (25 points max) - Based on healthy range
        const muscleScore = Math.max(0, Math.min(25, ((safeValue(athleteBodyComp.muscleMass) - 30.2) / (37.0 - 30.2)) * 25));

        // Skeletal Muscle Score (15 points max) - Based on standard ranges
        const skeletalMuscleScore = Math.max(0, Math.min(15, ((athleteBodyComp.muscleMass - 30.2) / (37.0 - 30.2)) * 15));

        // Visceral Fat Score (10 points max) - Lower visceral fat is better
        const visceralFatScore = Math.max(0, Math.min(10, 10 - safeValue(athleteBodyComp.visceralFatGrade) * 0.1));

        // Total calculated score
        const calculatedScore = Math.round(bmiScore + bodyFatScore + muscleScore + skeletalMuscleScore + visceralFatScore);

        return (
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
                <div className="text-center text-white">
                  <div className="text-2xl font-bold">{calculatedScore}</div>
                  <div className="text-sm">Points</div>
                </div>
              </div>
              {/* Score Ring */}
              <div className="absolute inset-0 w-32 h-32 rounded-full border-4 border-green-200">
                <div
                  className="absolute top-0 left-1/2 w-1/2 h-1/2 border-4 border-green-500 rounded-full transform -translate-x-1/2 origin-bottom"
                  style={{
                    transform: `rotate(${Math.min(180, (calculatedScore / 100) * 180)}deg)`
                  }}
                ></div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-lg font-semibold text-green-600">
                {calculatedScore >= 80 ? 'Excellent' :
                 calculatedScore >= 60 ? 'Good' :
                 calculatedScore >= 40 ? 'Fair' : 'Needs Improvement'}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Out of 100 possible points
              </div>
            </div>
          </div>
        );
      })()}

      {/* Score Breakdown */}
      {(() => {
        // Calculate individual scores
        const bmiScore = Math.max(0, Math.min(25, 25 - Math.abs(safeValue(athleteBodyComp.bmi) - 22) * 2));
        const bodyFatScore = Math.max(0, Math.min(25, 25 - Math.abs(safeValue(athleteBodyComp.bodyFat) - 15) * 1.5));
        const muscleScore = Math.max(0, Math.min(25, ((safeValue(athleteBodyComp.muscleMass) - 30.2) / (37.0 - 30.2)) * 25));
        const skeletalMuscleScore = Math.max(0, Math.min(15, ((athleteBodyComp.muscleMass - 30.2) / (37.0 - 30.2)) * 15));
        const visceralFatScore = Math.max(0, Math.min(10, 10 - safeValue(athleteBodyComp.visceralFatGrade) * 0.1));
        const calculatedScore = Math.round(bmiScore + bodyFatScore + muscleScore + skeletalMuscleScore + visceralFatScore);

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">📊 Score Components</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-700">BMI Score</span>
                  <span className="font-bold text-blue-600">{Math.round(bmiScore)}/25</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-700">Body Fat Score</span>
                  <span className="font-bold text-blue-600">{Math.round(bodyFatScore)}/25</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-700">Muscle Mass Score</span>
                  <span className="font-bold text-blue-600">{Math.round(muscleScore)}/25</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-700">Skeletal Muscle Score</span>
                  <span className="font-bold text-blue-600">{Math.round(skeletalMuscleScore)}/15</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-700">Visceral Fat Score</span>
                  <span className="font-bold text-blue-600">{Math.round(visceralFatScore)}/10</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-3">🎯 Score Interpretation</h3>
              <div className="space-y-3 text-sm text-green-700">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <span><strong>Overall Health:</strong> Your score indicates {calculatedScore >= 80 ? 'excellent' : calculatedScore >= 60 ? 'good' : 'fair'} body composition</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <span><strong>Muscle Quality:</strong> {muscleScore >= 20 ? 'High muscle quality detected' : 'Room for muscle development'}</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <span><strong>Body Balance:</strong> {skeletalMuscleScore >= 10 ? 'Excellent symmetry' : 'Good overall balance'}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Score Comparison */}
      {(() => {
        // Calculate the score for comparison
        const bmiScore = Math.max(0, Math.min(25, 25 - Math.abs(safeValue(athleteBodyComp.bmi) - 22) * 2));
        const bodyFatScore = Math.max(0, Math.min(25, 25 - Math.abs(safeValue(athleteBodyComp.bodyFat) - 15) * 1.5));
        const muscleScore = Math.max(0, Math.min(25, ((safeValue(athleteBodyComp.muscleMass) - 30.2) / (37.0 - 30.2)) * 25));
        const skeletalMuscleScore = Math.max(0, Math.min(15, ((athleteBodyComp.muscleMass - 30.2) / (37.0 - 30.2)) * 15));
        const visceralFatScore = Math.max(0, Math.min(10, 10 - safeValue(athleteBodyComp.visceralFatGrade) * 0.1));
        const calculatedScore = Math.round(bmiScore + bodyFatScore + muscleScore + skeletalMuscleScore + visceralFatScore);

        // Calculate target score based on ideal values
        const targetBmiScore = Math.max(0, Math.min(25, 25 - Math.abs(22 - 22) * 2)); // BMI 22
        const targetBodyFatScore = Math.max(0, Math.min(25, 25 - Math.abs(15 - 15) * 1.5)); // Body fat 15%
        const targetMuscleScore = Math.max(0, Math.min(25, ((37.0 - 30.2) / (37.0 - 30.2)) * 25)); // Max muscle
        const targetSkeletalMuscleScore = Math.max(0, Math.min(15, ((37.0 - 30.2) / (37.0 - 30.2)) * 15)); // Max skeletal muscle
        const targetVisceralFatScore = Math.max(0, Math.min(10, 10 - 1 * 0.1)); // Min visceral fat
        const targetScore = Math.round(targetBmiScore + targetBodyFatScore + targetMuscleScore + targetSkeletalMuscleScore + targetVisceralFatScore);

        return (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-indigo-800 mb-4 text-center">📈 Score Comparison</h3>
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{calculatedScore}</div>
                <div className="text-sm text-indigo-600">Your Score</div>
              </div>
              <div className="w-16 h-1 bg-gray-300"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{targetScore}</div>
                <div className="text-sm text-green-600">Target Score</div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div
                className="bg-indigo-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (calculatedScore / targetScore) * 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>0</span>
              <span>{Math.round(targetScore / 2)}</span>
              <span>{targetScore}</span>
            </div>
          </div>
        );
      })()}

      {/* Disclaimer */}
      <div className="mt-6 p-3 bg-gray-50 rounded-lg text-center">
        <p className="text-xs text-gray-600">
          💡 <strong>Note:</strong> The total score reflects the evaluated value of body composition.
          A muscular person may get more than 100 points. This score is for informational purposes only.
        </p>
      </div>
    </div>
  );
};

export default BodyScoreAnalysis;