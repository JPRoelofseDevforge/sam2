import React from 'react';
import { BodyComposition } from '../types';
import { safeValue } from './scaleReportUtils';

interface SegmentalAnalysisProps {
  athleteBodyComp: BodyComposition;
}

const SegmentalAnalysis: React.FC<SegmentalAnalysisProps> = ({ athleteBodyComp }) => {

  const totalFatKg = (safeValue(athleteBodyComp.bodyFat) / 100) * safeValue(athleteBodyComp.weight);
  const totalMuscleKg = safeValue(athleteBodyComp.muscleMass);
  const armFatStandard = totalFatKg * 0.025;
  const trunkFatStandard = totalFatKg * 0.5;
  const legFatStandard = totalFatKg * 0.225;
  const armMuscleStandard = totalMuscleKg * 0.05;
  const trunkMuscleStandard = totalMuscleKg * 0.4;
  const legMuscleStandard = totalMuscleKg * 0.25;

  const calculatePercentage = (actual: number | undefined, standard: number) => {
    const safeActual = safeValue(actual);
    if (standard === 0) return '0.0';
    return ((safeActual / standard) * 100).toFixed(1);
  };

  const getStatusColor = (percentage: number, type: 'arm' | 'trunk' | 'leg') => {
    const ranges = {
      arm: { min: 80, max: 115 },
      trunk: { min: 90, max: 110 },
      leg: { min: 90, max: 110 }
    };
    const range = ranges[type];
    if (percentage >= range.min && percentage <= range.max) {
      return 'text-green-600 bg-green-100';
    } else {
      return 'text-yellow-600 bg-yellow-100';
    }
  };

  return (
    <div className="card-enhanced p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">🔍 Segmental Analysis</h2>

      {/* Human Silhouette Visualization */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-center text-gray-900 mb-6">Body Composition Distribution</h3>
        <div className="flex justify-center">
          <div className="relative inline-block" style={{ padding: '40px' }}>
            {/* Human Model Image */}
            <img
              src="/humanmodel.png"
              alt="Human Body Model"
              className="max-w-full h-auto drop-shadow-lg"
              style={{ maxHeight: '400px' }}
            />

            {/* SVG Arrows and Labels Overlay */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ top: '-60px', left: '-60px', width: 'calc(100% + 120px)', height: 'calc(100% + 120px)' }}
              viewBox="0 0 120 120"
              preserveAspectRatio="none"
            >
              {/* Right Arm Fat */}
              <line x1="25" y1="30" x2="35" y2="35" stroke="#f97316" strokeWidth="0.3" markerEnd="url(#arrowhead)" />

              {/* Left Arm Fat */}
              <line x1="95" y1="30" x2="85" y2="35" stroke="#f97316" strokeWidth="0.3" markerEnd="url(#arrowhead)" />

              {/* Trunk Fat */}
              <line x1="60" y1="25" x2="60" y2="40" stroke="#f97316" strokeWidth="0.3" markerEnd="url(#arrowhead)" />

              {/* Right Arm Muscle */}
              <line x1="20" y1="45" x2="30" y2="50" stroke="#10b981" strokeWidth="0.3" markerEnd="url(#arrowhead)" />

              {/* Left Arm Muscle */}
              <line x1="100" y1="45" x2="90" y2="50" stroke="#10b981" strokeWidth="0.3" markerEnd="url(#arrowhead)" />

              {/* Trunk Muscle */}
              <line x1="60" y1="55" x2="60" y2="65" stroke="#10b981" strokeWidth="0.3" markerEnd="url(#arrowhead)" />

              {/* Right Leg Fat */}
              <line x1="30" y1="95" x2="40" y2="85" stroke="#f97316" strokeWidth="0.3" markerEnd="url(#arrowhead)" />

              {/* Left Leg Fat */}
              <line x1="90" y1="95" x2="80" y2="85" stroke="#f97316" strokeWidth="0.3" markerEnd="url(#arrowhead)" />

              {/* Right Leg Muscle (Thigh) */}
              <line x1="35" y1="85" x2="45" y2="75" stroke="#10b981" strokeWidth="0.3" markerEnd="url(#arrowhead)" />

              {/* Left Leg Muscle (Thigh) */}
              <line x1="85" y1="85" x2="75" y2="75" stroke="#10b981" strokeWidth="0.3" markerEnd="url(#arrowhead)" />

              {/* Right Leg Muscle (Calf) */}
              <line x1="40" y1="105" x2="50" y2="95" stroke="#10b981" strokeWidth="0.3" markerEnd="url(#arrowhead)" />

              {/* Left Leg Muscle (Calf) */}
              <line x1="80" y1="105" x2="70" y2="95" stroke="#10b981" strokeWidth="0.3" markerEnd="url(#arrowhead)" />

              {/* Arrowhead Definition */}
              <defs>
                <marker id="arrowhead" markerWidth="3" markerHeight="2" refX="2" refY="1" orient="auto">
                  <polygon points="0 0, 3 1, 0 2" fill="#666" />
                </marker>
              </defs>

              {/* Labels */}
              <text x="22" y="28" font-size="2.5" fill="white" stroke="black" stroke-width="0.1" text-anchor="middle">Right Arm Fat: {safeValue(athleteBodyComp.ArmMassRightFatKg).toFixed(1)}kg</text>
              <text x="98" y="28" font-size="2.5" fill="white" stroke="black" stroke-width="0.1" text-anchor="middle">Left Arm Fat: {safeValue(athleteBodyComp.ArmMassLeftFatKg).toFixed(1)}kg</text>
              <text x="57" y="23" font-size="2.5" fill="white" stroke="black" stroke-width="0.1" text-anchor="middle">Trunk Fat: {safeValue(athleteBodyComp.TrunkMassFatKg).toFixed(1)}kg</text>
              <text x="17" y="43" font-size="2.5" fill="white" stroke="black" stroke-width="0.1" text-anchor="middle">Right Arm Muscle: {athleteBodyComp.armMassRightKg ? safeValue(athleteBodyComp.armMassRightKg).toFixed(1) : 'N/A'}kg</text>
              <text x="103" y="43" font-size="2.5" fill="white" stroke="black" stroke-width="0.1" text-anchor="middle">Left Arm Muscle: {athleteBodyComp.armMassLeftKg ? safeValue(athleteBodyComp.armMassLeftKg).toFixed(1) : 'N/A'}kg</text>
              <text x="57" y="53" font-size="2.5" fill="white" stroke="black" stroke-width="0.1" text-anchor="middle">Trunk Muscle: {athleteBodyComp.trunkMassKg ? safeValue(athleteBodyComp.trunkMassKg).toFixed(1) : 'N/A'}kg</text>
              <text x="27" y="97" font-size="2.5" fill="white" stroke="black" stroke-width="0.1" text-anchor="middle">Right Leg Fat: {safeValue(athleteBodyComp.LegMassRightFatKg).toFixed(1)}kg</text>
              <text x="93" y="97" font-size="2.5" fill="white" stroke="black" stroke-width="0.1" text-anchor="middle">Left Leg Fat: {safeValue(athleteBodyComp.LegMassLeftFatKg).toFixed(1)}kg</text>
              <text x="32" y="87" font-size="2.5" fill="white" stroke="black" stroke-width="0.1" text-anchor="middle">Right Leg Muscle: {athleteBodyComp.legMassRightKg ? safeValue(athleteBodyComp.legMassRightKg).toFixed(1) : 'N/A'}kg</text>
              <text x="88" y="87" font-size="2.5" fill="white" stroke="black" stroke-width="0.1" text-anchor="middle">Left Leg Muscle: {athleteBodyComp.legMassLeftKg ? safeValue(athleteBodyComp.legMassLeftKg).toFixed(1) : 'N/A'}kg</text>
              
            </svg>
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-center mt-4 space-x-6">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-orange-500 rounded mr-2"></div>
            <span className="text-sm text-gray-700">Fat Mass</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
            <span className="text-sm text-gray-700">Muscle Mass</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-orange-600 mb-4">Fat Mass Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-orange-50 rounded-lg border-2 border-orange-200">
              <div className="text-sm text-gray-600">Right Arm</div>
              <div className="text-xl font-bold text-orange-600">{athleteBodyComp.ArmMassRightFatKg}kg</div>
              <div className={`text-xs ${getStatusColor(parseFloat(calculatePercentage(athleteBodyComp.ArmMassRightFatKg, armFatStandard)), 'arm')} px-2 py-1 rounded mt-1`}>{calculatePercentage(athleteBodyComp.ArmMassRightFatKg, armFatStandard)}% Standard</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg border-2 border-orange-200">
              <div className="text-sm text-gray-600">Left Arm</div>
              <div className="text-xl font-bold text-orange-600">{athleteBodyComp.ArmMassLeftFatKg}kg</div>
              <div className={`text-xs ${getStatusColor(parseFloat(calculatePercentage(athleteBodyComp.ArmMassLeftFatKg, armFatStandard)), 'arm')} px-2 py-1 rounded mt-1`}>{calculatePercentage(athleteBodyComp.ArmMassLeftFatKg, armFatStandard)}% Standard</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg border-2 border-orange-200">
              <div className="text-sm text-gray-600">Right Leg</div>
              <div className="text-xl font-bold text-orange-600">{athleteBodyComp.LegMassRightFatKg}kg</div>
              <div className={`text-xs ${getStatusColor(parseFloat(calculatePercentage(athleteBodyComp.LegMassRightFatKg, legFatStandard)), 'leg')} px-2 py-1 rounded mt-1`}>{calculatePercentage(athleteBodyComp.LegMassRightFatKg, legFatStandard)}% Standard</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg border-2 border-orange-200">
              <div className="text-sm text-gray-600">Left Leg</div>
              <div className="text-xl font-bold text-orange-600">{athleteBodyComp.LegMassLeftFatKg}kg</div>
              <div className={`text-xs ${getStatusColor(parseFloat(calculatePercentage(athleteBodyComp.LegMassLeftFatKg, legFatStandard)), 'leg')} px-2 py-1 rounded mt-1`}>{calculatePercentage(athleteBodyComp.LegMassLeftFatKg, legFatStandard)}% Standard</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg border-2 border-orange-200">
              <div className="text-sm text-gray-600">Trunk</div>
              <div className="text-xl font-bold text-orange-600">{athleteBodyComp.TrunkMassFatKg}kg</div>
              <div className={`text-xs ${getStatusColor(parseFloat(calculatePercentage(athleteBodyComp.TrunkMassFatKg, trunkFatStandard)), 'trunk')} px-2 py-1 rounded mt-1`}>{calculatePercentage(athleteBodyComp.TrunkMassFatKg, trunkFatStandard)}% Standard</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg border-2 border-orange-200">
              <div className="text-sm text-gray-600">Right Leg</div>
              <div className="text-xl font-bold text-orange-600">{athleteBodyComp.LegMassRightFatKg}kg</div>
              <div className={`text-xs ${getStatusColor(parseFloat(calculatePercentage(athleteBodyComp.LegMassRightFatKg, legFatStandard)), 'leg')} px-2 py-1 rounded mt-1`}>{calculatePercentage(athleteBodyComp.LegMassRightFatKg, legFatStandard)}% Standard</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg border-2 border-orange-200">
              <div className="text-sm text-gray-600">Left Leg</div>
              <div className="text-xl font-bold text-orange-600">{athleteBodyComp.LegMassLeftFatKg}kg</div>
              <div className={`text-xs ${getStatusColor(parseFloat(calculatePercentage(athleteBodyComp.LegMassLeftFatKg, legFatStandard)), 'leg')} px-2 py-1 rounded mt-1`}>{calculatePercentage(athleteBodyComp.LegMassLeftFatKg, legFatStandard)}% Standard</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg border-2 border-orange-200">
              <div className="text-sm text-gray-600">Trunk</div>
              <div className="text-xl font-bold text-orange-600">{athleteBodyComp.TrunkMassFatKg}kg</div>
              <div className={`text-xs ${getStatusColor(parseFloat(calculatePercentage(athleteBodyComp.TrunkMassFatKg, trunkFatStandard)), 'trunk')} px-2 py-1 rounded mt-1`}>{calculatePercentage(athleteBodyComp.TrunkMassFatKg, trunkFatStandard)}% Standard</div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-green-600 mb-4">Muscle Mass Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg border-2 border-green-200">
              <div className="text-sm text-gray-600">Trunk</div>
              <div className="text-xl font-bold text-green-600">{athleteBodyComp.trunkMassKg ? safeValue(athleteBodyComp.trunkMassKg).toFixed(1) : 'N/A'}kg</div>
              <div className={`text-xs ${getStatusColor(parseFloat(calculatePercentage(athleteBodyComp.trunkMassKg, trunkMuscleStandard)), 'trunk')} px-2 py-1 rounded mt-1`}>{calculatePercentage(athleteBodyComp.trunkMassKg, trunkMuscleStandard)}% Standard</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg border-2 border-green-200">
              <div className="text-sm text-gray-600">Right Arm</div>
              <div className="text-xl font-bold text-green-600">{athleteBodyComp.armMassRightKg ? safeValue(athleteBodyComp.armMassRightKg).toFixed(1) : 'N/A'}kg</div>
              <div className={`text-xs ${getStatusColor(parseFloat(calculatePercentage(athleteBodyComp.armMassRightKg, armMuscleStandard)), 'arm')} px-2 py-1 rounded mt-1`}>{calculatePercentage(athleteBodyComp.armMassRightKg, armMuscleStandard)}% Standard</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg border-2 border-green-200">
              <div className="text-sm text-gray-600">Left Arm</div>
              <div className="text-xl font-bold text-green-600">{athleteBodyComp.armMassLeftKg ? safeValue(athleteBodyComp.armMassLeftKg).toFixed(1) : 'N/A'}kg</div>
              <div className={`text-xs ${getStatusColor(parseFloat(calculatePercentage(athleteBodyComp.armMassLeftKg, armMuscleStandard)), 'arm')} px-2 py-1 rounded mt-1`}>{calculatePercentage(athleteBodyComp.armMassLeftKg, armMuscleStandard)}% Standard</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg border-2 border-green-200">
              <div className="text-sm text-gray-600">Right Leg</div>
              <div className="text-xl font-bold text-green-600">{athleteBodyComp.legMassRightKg ? safeValue(athleteBodyComp.legMassRightKg).toFixed(1) : 'N/A'}kg</div>
              <div className={`text-xs ${getStatusColor(parseFloat(calculatePercentage(athleteBodyComp.legMassRightKg, legMuscleStandard)), 'leg')} px-2 py-1 rounded mt-1`}>{calculatePercentage(athleteBodyComp.legMassRightKg, legMuscleStandard)}% Standard</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg border-2 border-green-200">
              <div className="text-sm text-gray-600">Left Leg</div>
              <div className="text-xl font-bold text-green-600">{athleteBodyComp.legMassLeftKg ? safeValue(athleteBodyComp.legMassLeftKg).toFixed(1) : 'N/A'}kg</div>
              <div className={`text-xs ${getStatusColor(parseFloat(calculatePercentage(athleteBodyComp.legMassLeftKg, legMuscleStandard)), 'leg')} px-2 py-1 rounded mt-1`}>{calculatePercentage(athleteBodyComp.legMassLeftKg, legMuscleStandard)}% Standard</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg border-2 border-green-200">
              <div className="text-sm text-gray-600">Right Leg</div>
              <div className="text-xl font-bold text-green-600">{athleteBodyComp.legMassRightKg ? safeValue(athleteBodyComp.legMassRightKg).toFixed(1) : 'N/A'}kg</div>
              <div className={`text-xs ${getStatusColor(parseFloat(calculatePercentage(athleteBodyComp.legMassRightKg, legMuscleStandard)), 'leg')} px-2 py-1 rounded mt-1`}>{calculatePercentage(athleteBodyComp.legMassRightKg, legMuscleStandard)}% Standard</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg border-2 border-green-200">
              <div className="text-sm text-gray-600">Left Leg</div>
              <div className="text-xl font-bold text-green-600">{athleteBodyComp.legMassLeftKg ? safeValue(athleteBodyComp.legMassLeftKg).toFixed(1) : 'N/A'}kg</div>
              <div className={`text-xs ${getStatusColor(parseFloat(calculatePercentage(athleteBodyComp.legMassLeftKg, legMuscleStandard)), 'leg')} px-2 py-1 rounded mt-1`}>{calculatePercentage(athleteBodyComp.legMassLeftKg, legMuscleStandard)}% Standard</div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
        <strong>Note:</strong> Standard range: 80%-160% • Segmental fat analysis is an inferred value • Left/right upper limbs (80%-115%), Trunk/lower limbs (90%-110%)
      </div>
    </div>
  );
};

export default SegmentalAnalysis;