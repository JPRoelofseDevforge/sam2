import React from 'react';
import { BodyComposition } from '../types';
import { safeValue } from './scaleReportUtils';

interface BodyCompositionTableProps {
  athleteBodyComp: BodyComposition;
}

const BodyCompositionTable: React.FC<BodyCompositionTableProps> = ({ athleteBodyComp }) => {
  return (
    <div className="card-enhanced p-6 mt-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Body Composition Metrics</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 px-4 py-2 text-left font-semibold"></th>
              <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Measurement (kg)</th>
              <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Proportion of weight (%)</th>
              <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Evaluation</th>
            </tr>
          </thead>
          <tbody>
            {[
              {
                label: 'Weight',
                value: `${safeValue(athleteBodyComp.weight)} (${safeValue(athleteBodyComp.weightRangeMin)}-${safeValue(athleteBodyComp.weightRangeMax)})`,
                percent: '100.0',
                eval: 'Standard'
              },
              {
                label: 'Fat mass',
                value: `${(safeValue(athleteBodyComp.weight) * safeValue(athleteBodyComp.bodyFat) / 100).toFixed(1)} (${(safeValue(athleteBodyComp.weightRangeMin) * 8 / 100).toFixed(1)}-${(safeValue(athleteBodyComp.weightRangeMax) * 20 / 100).toFixed(1)})`,
                percent: safeValue(athleteBodyComp.bodyFat).toFixed(1),
                eval: 'Standard'
              },
              {
                label: 'Muscle mass',
                value: `${safeValue(athleteBodyComp.muscleMass).toFixed(1)} (${(safeValue(athleteBodyComp.weightRangeMin) * 30.2 / 100).toFixed(1)}-${(safeValue(athleteBodyComp.weightRangeMax) * 37 / 100).toFixed(1)})`,
                percent: ((safeValue(athleteBodyComp.muscleMass) / safeValue(athleteBodyComp.weight)) * 100).toFixed(1),
                eval: 'Standard'
              },
              {
                label: 'Skeletal muscle',
                value: `${safeValue(athleteBodyComp.muscleMass).toFixed(1)} (30.2-37.0)`,
                percent: ((safeValue(athleteBodyComp.muscleMass) / safeValue(athleteBodyComp.weight)) * 100).toFixed(1),
                eval: 'Standard'
              },
              {
                label: 'Water weight',
                value: `${safeValue(athleteBodyComp.muscleMass + athleteBodyComp.boneDensity).toFixed(1)} (37.7-47.0)`,
                percent: (((safeValue(athleteBodyComp.muscleMass + athleteBodyComp.boneDensity) / safeValue(athleteBodyComp.weight)) * 100) - safeValue(athleteBodyComp.bodyFat)).toFixed(1),
                eval: 'Standard'
              },
              {
                label: 'Protein mass',
                value: `${(safeValue(athleteBodyComp.muscleMass) * 0.2).toFixed(1)} (10.3-12.8)`,
                percent: ((safeValue(athleteBodyComp.muscleMass) * 0.2 / safeValue(athleteBodyComp.weight)) * 100).toFixed(1),
                eval: 'Standard'
              },
              {
                label: 'Bone Mass',
                value: `${(safeValue(athleteBodyComp.weight) * 0.15).toFixed(1)} (3.4-4.3)`,
                percent: '15.0',
                eval: 'Standard'
              },
            ].map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2 font-semibold bg-gray-50">{row.label}</td>
                <td className="border border-gray-300 px-4 py-2">{row.value}</td>
                <td className="border border-gray-300 px-4 py-2">{row.percent}</td>
                <td className="border border-gray-300 px-4 py-2">{row.eval}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BodyCompositionTable;