import React from 'react';
import { BodyComposition } from '../types';

interface BioelectricalImpedanceProps {
  athleteBodyComp: BodyComposition;
}

const BioelectricalImpedance: React.FC<BioelectricalImpedanceProps> = ({ athleteBodyComp }) => {
  return (
    <div className="card-enhanced p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">⚡ Bioelectrical Impedance Analysis</h2>

      {/* Explanation */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">📡 What is Bioelectrical Impedance?</h3>
        <p className="text-sm text-blue-700 mb-3">
          Bioelectrical impedance measures how easily electrical currents pass through different body tissues.
          Lower impedance (Ω) indicates higher muscle mass, while higher impedance suggests more fat tissue.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-blue-600">
          <div>
            <strong>20kHz:</strong> Measures extracellular water (fat tissue)
          </div>
          <div>
            <strong>100kHz:</strong> Measures total body water (muscle tissue)
          </div>
        </div>
      </div>

      {/* Enhanced Data Visualization */}
      <div className="space-y-6">
        {/* Frequency Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 20kHz Analysis */}
          <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-orange-800 mb-4">📊 20kHz Analysis (Fat Tissue)</h3>
            <div className="space-y-3">
              {[
                { part: 'Right Arm', value: 376.5, range: '300-450', status: 'Normal' },
                { part: 'Left Arm', value: 381.9, range: '300-450', status: 'Normal' },
                { part: 'Trunk', value: 17.8, range: '15-25', status: 'Good' },
                { part: 'Right Leg', value: 332.1, range: '280-400', status: 'Normal' },
                { part: 'Left Leg', value: 329.9, range: '280-400', status: 'Normal' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border">
                  <span className="font-medium text-gray-700">{item.part}</span>
                  <div className="text-right">
                    <div className="font-bold text-orange-600">{item.value}Ω</div>
                    <div className="text-xs text-gray-500">{item.range}Ω</div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    item.status === 'Good' ? 'bg-green-100 text-green-800' :
                    item.status === 'Normal' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {item.status}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 100kHz Analysis */}
          <div className="bg-gradient-to-br from-green-50 to-teal-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-4">📈 100kHz Analysis (Muscle Tissue)</h3>
            <div className="space-y-3">
              {[
                { part: 'Right Arm', value: 336.2, range: '280-380', status: 'Good' },
                { part: 'Left Arm', value: 341.4, range: '280-380', status: 'Good' },
                { part: 'Trunk', value: 7.9, range: '6-12', status: 'Excellent' },
                { part: 'Right Leg', value: 305.7, range: '250-350', status: 'Good' },
                { part: 'Left Leg', value: 302.8, range: '250-350', status: 'Good' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border">
                  <span className="font-medium text-gray-700">{item.part}</span>
                  <div className="text-right">
                    <div className="font-bold text-green-600">{item.value}Ω</div>
                    <div className="text-xs text-gray-500">{item.range}Ω</div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    item.status === 'Excellent' ? 'bg-green-100 text-green-800' :
                    item.status === 'Good' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {item.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Body Symmetry Analysis */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-800 mb-4">⚖️ Body Symmetry Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-white rounded-lg border-2 border-purple-200">
              <div className="text-sm text-gray-600 mb-1">Arm Symmetry</div>
              <div className="text-xl font-bold text-purple-600">
                {((Math.abs(336.2 - 341.4) / Math.max(336.2, 341.4)) * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded mt-1">Excellent Balance</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border-2 border-purple-200">
              <div className="text-sm text-gray-600 mb-1">Leg Symmetry</div>
              <div className="text-xl font-bold text-purple-600">
                {((Math.abs(305.7 - 302.8) / Math.max(305.7, 302.8)) * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded mt-1">Excellent Balance</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border-2 border-purple-200">
              <div className="text-sm text-gray-600 mb-1">Overall Balance</div>
              <div className="text-xl font-bold text-purple-600">96.2%</div>
              <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded mt-1">Well Balanced</div>
            </div>
          </div>
        </div>

        {/* Health Insights */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-md font-semibold text-gray-800 mb-3">💡 Bioelectrical Insights</h4>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <span><strong>Excellent muscle quality</strong> - Your impedance values indicate good muscle development and low fat content.</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <span><strong>Perfect symmetry</strong> - Your left and right sides show excellent balance, indicating balanced training.</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <span><strong>Optimal hydration</strong> - Your impedance values suggest good cellular health and proper hydration levels.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BioelectricalImpedance;