import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { BodyComposition } from '../types';
import { safeValue } from './scaleReportUtils';

interface BodyCompositionChartProps {
  athleteBodyComp: BodyComposition;
}

const BodyCompositionChart: React.FC<BodyCompositionChartProps> = ({ athleteBodyComp }) => {
  const fatPercent = parseFloat(safeValue(athleteBodyComp.bodyFat).toFixed(1));
  const musclePercent = parseFloat(((safeValue(athleteBodyComp.muscleMass) / safeValue(athleteBodyComp.weight)) * 100).toFixed(1));
  const waterPercent = parseFloat(((((safeValue(athleteBodyComp.muscleMass + athleteBodyComp.boneDensity) / safeValue(athleteBodyComp.weight)) * 100) - safeValue(athleteBodyComp.bodyFat))).toFixed(1));
  const proteinPercent = parseFloat(((safeValue(athleteBodyComp.muscleMass) * 0.2 / safeValue(athleteBodyComp.weight)) * 100).toFixed(1));
  const bonePercent = 15.0;

  // Normalize percentages to ensure they add up to 100%
  const total = fatPercent + musclePercent + waterPercent + proteinPercent + bonePercent;
  const normalizedFat = (fatPercent / total) * 100;
  const normalizedMuscle = (musclePercent / total) * 100;
  const normalizedWater = (waterPercent / total) * 100;
  const normalizedProtein = (proteinPercent / total) * 100;
  const normalizedBone = (bonePercent / total) * 100;

  const bodyCompositionData = [
    { name: 'Fat Mass', value: normalizedFat, weight: `${(safeValue(athleteBodyComp.weight) * safeValue(athleteBodyComp.bodyFat) / 100).toFixed(1)}kg` },
    { name: 'Muscle Mass', value: normalizedMuscle, weight: `${safeValue(athleteBodyComp.muscleMass).toFixed(1)}kg` },
    { name: 'Water Weight', value: normalizedWater, weight: `${(safeValue(athleteBodyComp.muscleMass + athleteBodyComp.boneDensity)).toFixed(1)}kg` },
    { name: 'Protein Mass', value: normalizedProtein, weight: `${(safeValue(athleteBodyComp.muscleMass) * 0.2).toFixed(1)}kg` },
    { name: 'Bone Mass', value: normalizedBone, weight: `${(safeValue(athleteBodyComp.weight) * 0.15).toFixed(1)}kg` }
  ];

  const COLORS = ['#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'];

  return (
    <div className="card-enhanced p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">📈 Body Composition Breakdown</h2>
      <div className="flex justify-center">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={bodyCompositionData}
              cx="50%"
              cy="50%"
              labelLine={true}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name}: ${(percent ? percent * 100 : 0).toFixed(0)}%`}
            >
              {bodyCompositionData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name, props) => [
                `${Number(value).toFixed(1)}% (${props.payload.weight})`,
                name
              ]}
              contentStyle={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                color: '#1f2937'
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BodyCompositionChart;