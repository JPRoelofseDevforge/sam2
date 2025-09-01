import React, { useState, useEffect } from 'react';
import { bodyCompositionService } from '../services/dataService';
import { BodyComposition } from '../types';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface ScaleReportProps {
  athleteId: string;
}

const ScaleReport: React.FC<ScaleReportProps> = ({ athleteId }) => {
  const [athleteBodyComp, setAthleteBodyComp] = useState<BodyComposition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBodyCompositionData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Convert athleteId string to number for API call
        const athleteIdNum = parseInt(athleteId, 10);
        if (isNaN(athleteIdNum)) {
          throw new Error('Invalid athlete ID');
        }

        const bodyCompositionData = await bodyCompositionService.getBodyCompositionByAthlete(athleteIdNum);
        
        // Get the latest body composition data for this athlete
        const latestData = Array.isArray(bodyCompositionData)
          ? bodyCompositionData
              .filter(b => b.date)
              .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime())[0]
          : null;

        

        setAthleteBodyComp(latestData || null);
      } catch (err) {
        console.error('Failed to fetch body composition data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load body composition data');
      } finally {
        setLoading(false);
      }
    };

    if (athleteId) {
      fetchBodyCompositionData();
    }
  }, [athleteId]);

  // Helper function to safely handle numeric values
  const safeValue = (val: number | undefined) => typeof val === 'number' && !isNaN(val) ? val : 0;

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-8 text-gray-900">
        <h1 className="text-3xl font-bold text-center text-white mb-8">⚖️ Body Composition Analysis</h1>
        <div className="text-center py-12 card-enhanced rounded-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading body composition data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-8 text-gray-900">
        <h1 className="text-3xl font-bold text-center text-white mb-8">⚖️ Body Composition Analysis</h1>
        <div className="text-center py-12 card-enhanced rounded-xl">
          <p className="text-red-600 mb-2">⚠️ Error loading data</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  // If no data available, show a message
  if (!athleteBodyComp) {
    return (
      <div className="space-y-8 text-gray-900">
        <h1 className="text-3xl font-bold text-center text-white mb-8">⚖️ Body Composition Analysis</h1>
        <div className="text-center py-12 card-enhanced rounded-xl">
          <p className="text-gray-600 mb-2">⚖️ No body composition data available</p>
          <p className="text-sm text-gray-500">
            Please ensure body composition measurements are recorded
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-8 text-gray-900">
      <h1 className="text-3xl font-bold text-center text-white mb-8">⚖️ Body Composition Analysis</h1>

      {/* Body Composition Breakdown - Pie Chart */}
      <div className="card-enhanced p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">📈 Body Composition Breakdown</h2>
        <div className="flex justify-center">
          {(() => {
            const fatPercent = parseFloat(safeValue(athleteBodyComp.body_fat_rate).toFixed(1));
            const musclePercent = parseFloat(((safeValue(athleteBodyComp.muscle_mass_kg) / safeValue(athleteBodyComp.weight_kg)) * 100).toFixed(1));
            const waterPercent = parseFloat(((((safeValue(athleteBodyComp.fat_free_body_weight_kg) / safeValue(athleteBodyComp.weight_kg)) * 100) - safeValue(athleteBodyComp.body_fat_rate))).toFixed(1));
            const proteinPercent = parseFloat(((safeValue(athleteBodyComp.muscle_mass_kg) * 0.2 / safeValue(athleteBodyComp.weight_kg)) * 100).toFixed(1));
            const bonePercent = 15.0;

            // Normalize percentages to ensure they add up to 100%
            const total = fatPercent + musclePercent + waterPercent + proteinPercent + bonePercent;
            const normalizedFat = (fatPercent / total) * 100;
            const normalizedMuscle = (musclePercent / total) * 100;
            const normalizedWater = (waterPercent / total) * 100;
            const normalizedProtein = (proteinPercent / total) * 100;
            const normalizedBone = (bonePercent / total) * 100;

            const bodyCompositionData = [
              { name: 'Fat Mass', value: normalizedFat, weight: `${safeValue(athleteBodyComp.fat_mass_kg).toFixed(1)}kg` },
              { name: 'Muscle Mass', value: normalizedMuscle, weight: `${safeValue(athleteBodyComp.muscle_mass_kg).toFixed(1)}kg` },
              { name: 'Water Weight', value: normalizedWater, weight: `${safeValue(athleteBodyComp.fat_free_body_weight_kg).toFixed(1)}kg` },
              { name: 'Protein Mass', value: normalizedProtein, weight: `${(safeValue(athleteBodyComp.muscle_mass_kg) * 0.2).toFixed(1)}kg` },
              { name: 'Bone Mass', value: normalizedBone, weight: `${(safeValue(athleteBodyComp.weight_kg) * 0.15).toFixed(1)}kg` }
            ];

            const COLORS = ['#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'];

            return (
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
            );
          })()}
        </div>
      </div>

      <h2 className="text-xl font-semibold text-white mb-4">📈 Muscle Fat Analysis</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Weight Scale */}
        <div className="card-enhanced p-6">
          <h3 className="text-lg font-semibold text-purple-600 mb-4">⚖️ Weight Analysis</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Current:</span>
              <span className="font-bold text-purple-600">{safeValue(athleteBodyComp.weight_kg).toFixed(1)} kg</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Target Range:</span>
              <span className="font-bold text-green-600">{safeValue(athleteBodyComp.target_weight_kg).toFixed(1)} kg</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Healthy Range:</span>
              <span className="font-bold text-blue-600">{safeValue(athleteBodyComp.weight_range_min)}-{safeValue(athleteBodyComp.weight_range_max)} kg</span>
            </div>
          </div>
          <div className="mt-4 relative">
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all duration-300"
                style={{
                  width: `${Math.min(100, ((safeValue(athleteBodyComp.weight_kg) - safeValue(athleteBodyComp.weight_range_min)) / (safeValue(athleteBodyComp.weight_range_max) - safeValue(athleteBodyComp.weight_range_min))) * 100)}%`
                }}
              ></div>
            </div>
            {/* Current Weight Marker */}
            <div className="absolute top-0 w-0 h-0" style={{
              left: `${Math.min(100, Math.max(0, ((safeValue(athleteBodyComp.weight_kg) - safeValue(athleteBodyComp.weight_range_min)) / (safeValue(athleteBodyComp.weight_range_max) - safeValue(athleteBodyComp.weight_range_min))) * 100))}%`,
              transform: 'translateX(-50%)'
            }}>
              <div className="w-0 h-0 border-l-2 border-r-2 border-b-3 border-l-transparent border-r-transparent border-b-purple-600 mx-auto"></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{safeValue(athleteBodyComp.weight_range_min)}kg</span>
              <span>{safeValue(athleteBodyComp.weight_range_max)}kg</span>
            </div>
          </div>
          <div className="mt-3 p-2 bg-purple-50 rounded text-center">
            <div className="text-xs text-gray-600">Status</div>
            <div className={`text-sm font-semibold ${athleteBodyComp.weight_kg >= athleteBodyComp.weight_range_min && athleteBodyComp.weight_kg <= athleteBodyComp.weight_range_max ? 'text-green-600' : 'text-orange-600'}`}>
              {athleteBodyComp.weight_kg >= athleteBodyComp.weight_range_min && athleteBodyComp.weight_kg <= athleteBodyComp.weight_range_max ? 'Optimal' : 'Needs Adjustment'}
            </div>
          </div>
        </div>

        {/* Skeletal Muscle Scale */}
        <div className="card-enhanced p-6">
          <h3 className="text-lg font-semibold text-green-600 mb-4">💪 Skeletal Muscle Analysis</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Current:</span>
              <span className="font-bold text-green-600">{safeValue(athleteBodyComp.skeletal_muscle_kg).toFixed(1)} kg</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Standard Range:</span>
              <span className="font-bold text-blue-600">30.2-37.0 kg</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Muscle Mass:</span>
              <span className="font-bold text-green-600">{safeValue(athleteBodyComp.muscle_mass_kg).toFixed(1)} kg</span>
            </div>
          </div>
          <div className="mt-4 relative">
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{
                  width: `${Math.min(100, ((safeValue(athleteBodyComp.skeletal_muscle_kg) - 30.2) / (37.0 - 30.2)) * 100)}%`
                }}
              ></div>
            </div>
            {/* Current Skeletal Muscle Marker */}
            <div className="absolute top-0 w-0 h-0" style={{
              left: `${Math.min(100, Math.max(0, ((safeValue(athleteBodyComp.skeletal_muscle_kg) - 30.2) / (37.0 - 30.2)) * 100))}%`,
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
            <div className={`text-sm font-semibold ${athleteBodyComp.skeletal_muscle_kg >= 30.2 && athleteBodyComp.skeletal_muscle_kg <= 37.0 ? 'text-green-600' : 'text-orange-600'}`}>
              {athleteBodyComp.skeletal_muscle_kg >= 30.2 && athleteBodyComp.skeletal_muscle_kg <= 37.0 ? 'Excellent' : 'Needs Work'}
            </div>
          </div>
        </div>

        {/* Fat Mass Scale */}
        <div className="card-enhanced p-6">
          <h3 className="text-lg font-semibold text-orange-600 mb-4">🔥 Fat Mass Analysis</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Current:</span>
              <span className="font-bold text-orange-600">{safeValue(athleteBodyComp.fat_mass_kg).toFixed(1)} kg</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Body Fat %:</span>
              <span className="font-bold text-orange-600">{safeValue(athleteBodyComp.body_fat_rate).toFixed(1)}%</span>
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
                  width: `${Math.min(100, (safeValue(athleteBodyComp.body_fat_rate) / 20) * 100)}%`
                }}
              ></div>
            </div>
            {/* Current Fat Mass Marker */}
            <div className="absolute top-0 w-0 h-0" style={{
              left: `${Math.min(100, Math.max(0, (safeValue(athleteBodyComp.body_fat_rate) / 20) * 100))}%`,
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
            <div className={`text-sm font-semibold ${athleteBodyComp.body_fat_rate >= 8 && athleteBodyComp.body_fat_rate <= 20 ? 'text-green-600' : athleteBodyComp.body_fat_rate < 8 ? 'text-blue-600' : 'text-red-600'}`}>
              {athleteBodyComp.body_fat_rate >= 8 && athleteBodyComp.body_fat_rate <= 20 ? 'Healthy' : athleteBodyComp.body_fat_rate < 8 ? 'Low' : 'High'}
            </div>
          </div>
        </div>
      </div>

      {/* Obesity Analysis */}
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
                  left: `${Math.min(100, Math.max(0, ((athleteBodyComp.bmi - 0) / 40) * 100))}%`,
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
                {athleteBodyComp.bmi < 18.5 ? 'Underweight' :
                 athleteBodyComp.bmi < 25 ? 'Normal Weight' :
                 athleteBodyComp.bmi < 30 ? 'Overweight' :
                 athleteBodyComp.bmi < 35 ? 'Obese' : 'Severely Obese'}
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
                  left: `${Math.min(100, Math.max(0, (athleteBodyComp.body_fat_rate / 40) * 100))}%`,
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
              <div className="text-3xl font-bold text-purple-600 mb-1">{safeValue(athleteBodyComp.body_fat_rate).toFixed(1)}%</div>
              <div className="text-sm font-medium text-gray-700">
                {athleteBodyComp.body_fat_rate < 6 ? 'Essential Fat' :
                 athleteBodyComp.body_fat_rate < 14 ? 'Athletic' :
                 athleteBodyComp.body_fat_rate < 24 ? 'Average' :
                 athleteBodyComp.body_fat_rate < 32 ? 'High' : 'Obese'}
              </div>
            </div>
          </div>

          {/* Health Insights */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-md font-semibold text-gray-800 mb-3">💡 Health Insights</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start space-x-2">
                <div className={`w-3 h-3 rounded-full mt-1 ${athleteBodyComp.bmi < 18.5 ? 'bg-blue-500' : athleteBodyComp.bmi < 25 ? 'bg-green-500' : athleteBodyComp.bmi < 30 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                <div>
                  <div className="font-medium">BMI Status</div>
                  <div className="text-gray-600">
                    {athleteBodyComp.bmi < 18.5 ? 'Consider gaining weight for optimal health' :
                     athleteBodyComp.bmi < 25 ? 'Excellent BMI range for health' :
                     athleteBodyComp.bmi < 30 ? 'Consider weight management' : 'Focus on weight reduction for better health'}
                  </div>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className={`w-3 h-3 rounded-full mt-1 ${athleteBodyComp.body_fat_rate < 6 ? 'bg-blue-500' : athleteBodyComp.body_fat_rate < 14 ? 'bg-green-500' : athleteBodyComp.body_fat_rate < 24 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                <div>
                  <div className="font-medium">Body Fat Status</div>
                  <div className="text-gray-600">
                    {athleteBodyComp.body_fat_rate < 6 ? 'Essential fat level - monitor closely' :
                     athleteBodyComp.body_fat_rate < 14 ? 'Optimal for athletic performance' :
                     athleteBodyComp.body_fat_rate < 24 ? 'Average range - room for improvement' : 'Consider fat reduction strategies'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body Composition Metrics Table */}
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
                  value: `${athleteBodyComp.weight_kg} (${athleteBodyComp.weight_range_min}-${athleteBodyComp.weight_range_max})`,
                  percent: '100.0',
                  eval: 'Standard'
                },
                {
                  label: 'Fat mass',
                  value: `${safeValue(athleteBodyComp.fat_mass_kg)} (${safeValue(athleteBodyComp.fat_mass_range_min).toFixed(1)}-${safeValue(athleteBodyComp.fat_mass_range_max).toFixed(1)})`,
                  percent: safeValue(athleteBodyComp.body_fat_rate).toFixed(1),
                  eval: 'Standard'
                },
                {
                  label: 'Muscle mass',
                  value: `${safeValue(athleteBodyComp.muscle_mass_kg).toFixed(1)} (${safeValue(athleteBodyComp.muscle_mass_range_min).toFixed(1)}-${safeValue(athleteBodyComp.muscle_mass_range_max).toFixed(1)})`,
                  percent: ((safeValue(athleteBodyComp.muscle_mass_kg) / safeValue(athleteBodyComp.weight_kg)) * 100).toFixed(1),
                  eval: 'Standard'
                },
                {
                  label: 'Skeletal muscle',
                  value: `${safeValue(athleteBodyComp.skeletal_muscle_kg).toFixed(1)} (30.2-37.0)`,
                  percent: ((safeValue(athleteBodyComp.skeletal_muscle_kg) / safeValue(athleteBodyComp.weight_kg)) * 100).toFixed(1),
                  eval: 'Standard'
                },
                {
                  label: 'Water weight',
                  value: `${safeValue(athleteBodyComp.fat_free_body_weight_kg).toFixed(1)} (37.7-47.0)`,
                  percent: (((safeValue(athleteBodyComp.fat_free_body_weight_kg) / safeValue(athleteBodyComp.weight_kg)) * 100) - safeValue(athleteBodyComp.body_fat_rate)).toFixed(1),
                  eval: 'Standard'
                },
                {
                  label: 'Protein mass',
                  value: `${(safeValue(athleteBodyComp.muscle_mass_kg) * 0.2).toFixed(1)} (10.3-12.8)`,
                  percent: ((safeValue(athleteBodyComp.muscle_mass_kg) * 0.2 / safeValue(athleteBodyComp.weight_kg)) * 100).toFixed(1),
                  eval: 'Standard'
                },
                {
                  label: 'Bone Mass',
                  value: `${(safeValue(athleteBodyComp.weight_kg) * 0.15).toFixed(1)} (3.4-4.3)`,
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

      {/* Body Type Assessment */}
      <div className="card-enhanced p-6 mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">🏋️ Body Type Assessment</h2>
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-lg">
          <div className="mb-4 text-center">
            <div className="text-sm text-gray-600 mb-1">Your Current Position</div>
            <div className="text-lg font-semibold text-indigo-700">
              BMI: {safeValue(athleteBodyComp.bmi).toFixed(1)} | Body Fat: {safeValue(athleteBodyComp.body_fat_rate).toFixed(1)}%
            </div>
          </div>

          {/* Body Type Grid */}
          <div className="relative bg-white rounded-lg p-4 shadow-sm">
            {/* Grid Container */}
            <div className="relative w-full h-96 border border-gray-200 rounded-lg overflow-hidden">
              {/* Grid Background */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                {/* Row 1 (BMI 25-30) */}
                <div className="bg-gray-100 border-r border-b border-gray-200 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-700 text-center">Too thin</span>
                </div>
                <div className="bg-gray-100 border-r border-b border-gray-200 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-700 text-center">Thin</span>
                </div>
                <div className="bg-gray-100 border-b border-gray-200 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-700 text-center">Invisible fat</span>
                </div>

                {/* Row 2 (BMI 20-25) */}
                <div className="bg-gray-100 border-r border-b border-gray-200 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-700 text-center">Muscular slim</span>
                </div>
                <div className="bg-teal-100 border-r border-b border-gray-200 flex items-center justify-center relative">
                  <span className="text-xs font-semibold text-teal-800 text-center">Fit</span>
                  <div className="absolute inset-0 border-2 border-teal-300 rounded-sm"></div>
                </div>
                <div className="bg-gray-100 border-b border-gray-200 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-700 text-center">Slightly fat</span>
                </div>

                {/* Row 3 (BMI 15-20) */}
                <div className="bg-gray-100 border-r border-gray-200 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-700 text-center">Athletes</span>
                </div>
                <div className="bg-gray-100 border-r border-gray-200 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-700 text-center">Muscle</span>
                </div>
                <div className="bg-gray-100 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-700 text-center">Overweight</span>
                </div>
              </div>

              {/* Current Position Marker */}
              {(() => {
                const bmi = athleteBodyComp.bmi;
                const fatRate = athleteBodyComp.body_fat_rate;

                // Calculate position (inverse Y axis since lower BMI is at bottom)
                const xPos = Math.min(100, Math.max(0, (fatRate / 30) * 100));
                const yPos = Math.min(100, Math.max(0, 100 - ((bmi - 15) / 15) * 100));

                return (
                  <div
                    className="absolute w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg z-10"
                    style={{
                      left: `${xPos}%`,
                      top: `${yPos}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <div className="absolute inset-0 bg-red-500 rounded-full animate-pulse"></div>
                  </div>
                );
              })()}
            </div>

            {/* Axis Labels */}
            <div className="flex justify-between mt-2 text-xs text-gray-600">
              <span>Body Fat Rate (%)</span>
              <span>BMI (kg/m²)</span>
            </div>

            {/* X-axis Values */}
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>0</span>
              <span>10</span>
              <span>20</span>
              <span>30</span>
            </div>

            {/* Y-axis Values (right side) */}
            <div className="absolute right-2 top-4 bottom-4 flex flex-col justify-between text-xs text-gray-500">
              <span>30</span>
              <span>25</span>
              <span>20</span>
              <span>15</span>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 p-3 bg-white rounded-lg">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">📍 Your Position</h4>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-700">Current BMI & Body Fat position</span>
            </div>
            <div className="mt-2 text-xs text-gray-600">
              💡 The highlighted "Fit" region represents the optimal balance of BMI and body fat for health and fitness.
            </div>
          </div>
        </div>
      </div>

      {/* Segmental Fat & Muscle Balance */}
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
              {athleteBodyComp.symmetry && (
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{ top: '-60px', left: '-60px', width: 'calc(100% + 120px)', height: 'calc(100% + 120px)' }}
                  viewBox="0 0 120 120"
                  preserveAspectRatio="none"
                >
                  {/* Right Arm Fat */}
                  <line x1="25" y1="30" x2="35" y2="35" stroke="#f97316" strokeWidth="0.3" markerEnd="url(#arrowhead)" />
                  <text x="18" y="25" fontSize="2.5" fontWeight="bold" fill="#ea580c" textAnchor="middle">R Arm Fat: {athleteBodyComp.symmetry.arm_mass_right_kg.toFixed(1)}kg</text>
  
                  {/* Left Arm Fat */}
                  <line x1="95" y1="30" x2="85" y2="35" stroke="#f97316" strokeWidth="0.3" markerEnd="url(#arrowhead)" />
                  <text x="102" y="25" fontSize="2.5" fontWeight="bold" fill="#ea580c" textAnchor="middle">L Arm Fat: {athleteBodyComp.symmetry.arm_mass_left_kg.toFixed(1)}kg</text>
  
                  {/* Trunk Fat */}
                  <line x1="60" y1="25" x2="60" y2="40" stroke="#f97316" strokeWidth="0.3" markerEnd="url(#arrowhead)" />
                  <text x="60" y="20" fontSize="2.5" fontWeight="bold" fill="#ea580c" textAnchor="middle">Trunk Fat: {(athleteBodyComp.symmetry.trunk_mass_kg * 0.25).toFixed(1)}kg</text>
  
                  {/* Right Arm Muscle */}
                  <line x1="20" y1="45" x2="30" y2="50" stroke="#10b981" strokeWidth="0.3" markerEnd="url(#arrowhead)" />
                  <text x="13" y="40" fontSize="2.5" fontWeight="bold" fill="#059669" textAnchor="middle">R Arm Muscle: {athleteBodyComp.symmetry.arm_mass_right_kg.toFixed(1)}kg</text>
  
                  {/* Left Arm Muscle */}
                  <line x1="100" y1="45" x2="90" y2="50" stroke="#10b981" strokeWidth="0.3" markerEnd="url(#arrowhead)" />
                  <text x="107" y="40" fontSize="2.5" fontWeight="bold" fill="#059669" textAnchor="middle">L Arm Muscle: {athleteBodyComp.symmetry.arm_mass_left_kg.toFixed(1)}kg</text>
  
                  {/* Trunk Muscle */}
                  <line x1="60" y1="55" x2="60" y2="65" stroke="#10b981" strokeWidth="0.3" markerEnd="url(#arrowhead)" />
                  <text x="60" y="50" fontSize="2.5" fontWeight="bold" fill="#059669" textAnchor="middle">Trunk Muscle: {athleteBodyComp.symmetry.trunk_mass_kg.toFixed(1)}kg</text>
  
                  {/* Right Leg Fat */}
                  <line x1="30" y1="95" x2="40" y2="85" stroke="#f97316" strokeWidth="0.3" markerEnd="url(#arrowhead)" />
                  <text x="23" y="100" fontSize="2.5" fontWeight="bold" fill="#ea580c" textAnchor="middle">R Leg Fat: {(athleteBodyComp.symmetry.leg_mass_right_kg * 0.25).toFixed(1)}kg</text>
  
                  {/* Left Leg Fat */}
                  <line x1="90" y1="95" x2="80" y2="85" stroke="#f97316" strokeWidth="0.3" markerEnd="url(#arrowhead)" />
                  <text x="97" y="100" fontSize="2.5" fontWeight="bold" fill="#ea580c" textAnchor="middle">L Leg Fat: {(athleteBodyComp.symmetry.leg_mass_left_kg * 0.25).toFixed(1)}kg</text>
  
                  {/* Right Leg Muscle (Thigh) */}
                  <line x1="35" y1="85" x2="45" y2="75" stroke="#10b981" strokeWidth="0.3" markerEnd="url(#arrowhead)" />
                  <text x="28" y="88" fontSize="2.5" fontWeight="bold" fill="#059669" textAnchor="middle">R Thigh Muscle: {athleteBodyComp.symmetry.leg_mass_right_kg.toFixed(1)}kg</text>
  
                  {/* Left Leg Muscle (Thigh) */}
                  <line x1="85" y1="85" x2="75" y2="75" stroke="#10b981" strokeWidth="0.3" markerEnd="url(#arrowhead)" />
                  <text x="92" y="88" fontSize="2.5" fontWeight="bold" fill="#059669" textAnchor="middle">L Thigh Muscle: {athleteBodyComp.symmetry.leg_mass_left_kg.toFixed(1)}kg</text>
  
                  {/* Right Leg Muscle (Calf) */}
                  <line x1="40" y1="105" x2="50" y2="95" stroke="#10b981" strokeWidth="0.3" markerEnd="url(#arrowhead)" />
                  <text x="33" y="108" fontSize="2.5" fontWeight="bold" fill="#059669" textAnchor="middle">R Calf Muscle: {(athleteBodyComp.symmetry.leg_mass_right_kg * 0.35).toFixed(1)}kg</text>
  
                  {/* Left Leg Muscle (Calf) */}
                  <line x1="80" y1="105" x2="70" y2="95" stroke="#10b981" strokeWidth="0.3" markerEnd="url(#arrowhead)" />
                  <text x="87" y="108" fontSize="2.5" fontWeight="bold" fill="#059669" textAnchor="middle">L Calf Muscle: {(athleteBodyComp.symmetry.leg_mass_left_kg * 0.35).toFixed(1)}kg</text>
  
                  {/* Arrowhead Definition */}
                  <defs>
                    <marker id="arrowhead" markerWidth="3" markerHeight="2" refX="2" refY="1" orient="auto">
                      <polygon points="0 0, 3 1, 0 2" fill="#666" />
                    </marker>
                  </defs>
                </svg>
              )}
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
              {athleteBodyComp.symmetry && (
                <>
                  <div className="text-center p-3 bg-orange-50 rounded-lg border-2 border-orange-200">
                    <div className="text-sm text-gray-600">Right Arm</div>
                    <div className="text-xl font-bold text-orange-600">{athleteBodyComp.symmetry.arm_mass_right_kg.toFixed(1)}kg</div>
                    <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded mt-1">95.0% Standard</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg border-2 border-orange-200">
                    <div className="text-sm text-gray-600">Left Arm</div>
                    <div className="text-xl font-bold text-orange-600">{athleteBodyComp.symmetry.arm_mass_left_kg.toFixed(1)}kg</div>
                    <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded mt-1">95.0% Standard</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg border-2 border-orange-200">
                    <div className="text-sm text-gray-600">Right Leg</div>
                    <div className="text-xl font-bold text-orange-600">{(athleteBodyComp.symmetry.leg_mass_right_kg * 0.25).toFixed(1)}kg</div>
                    <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded mt-1">93.9% Standard</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg border-2 border-orange-200">
                    <div className="text-sm text-gray-600">Left Leg</div>
                    <div className="text-xl font-bold text-orange-600">{(athleteBodyComp.symmetry.leg_mass_left_kg * 0.25).toFixed(1)}kg</div>
                    <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded mt-1">93.9% Standard</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg border-2 border-orange-200">
                    <div className="text-sm text-gray-600">Trunk</div>
                    <div className="text-xl font-bold text-orange-600">{(athleteBodyComp.symmetry.trunk_mass_kg * 0.25).toFixed(1)}kg</div>
                    <div className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded mt-1">155.5% Standard</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg border-2 border-orange-200">
                    <div className="text-sm text-gray-600">Right Leg</div>
                    <div className="text-xl font-bold text-orange-600">{(athleteBodyComp.symmetry.leg_mass_right_kg * 0.35).toFixed(1)}kg</div>
                    <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded mt-1">116.4% Standard</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg border-2 border-orange-200">
                    <div className="text-sm text-gray-600">Left Leg</div>
                    <div className="text-xl font-bold text-orange-600">{(athleteBodyComp.symmetry.leg_mass_left_kg * 0.35).toFixed(1)}kg</div>
                    <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded mt-1">116.4% Standard</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg border-2 border-orange-200">
                    <div className="text-sm text-gray-600">Trunk</div>
                    <div className="text-xl font-bold text-orange-600">{(athleteBodyComp.symmetry.trunk_mass_kg * 0.75).toFixed(1)}kg</div>
                    <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded mt-1">101.9% Standard</div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-green-600 mb-4">Muscle Mass Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {athleteBodyComp.symmetry && (
                <>
                  <div className="text-center p-3 bg-green-50 rounded-lg border-2 border-green-200">
                    <div className="text-sm text-gray-600">Trunk</div>
                    <div className="text-xl font-bold text-green-600">{athleteBodyComp.symmetry.trunk_mass_kg.toFixed(1)}kg</div>
                    <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded mt-1">94.2% Standard</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg border-2 border-green-200">
                    <div className="text-sm text-gray-600">Right Arm</div>
                    <div className="text-xl font-bold text-green-600">{athleteBodyComp.symmetry.arm_mass_right_kg.toFixed(1)}kg</div>
                    <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded mt-1">90.1% Standard</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg border-2 border-green-200">
                    <div className="text-sm text-gray-600">Left Arm</div>
                    <div className="text-xl font-bold text-green-600">{athleteBodyComp.symmetry.arm_mass_left_kg.toFixed(1)}kg</div>
                    <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded mt-1">90.1% Standard</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg border-2 border-green-200">
                    <div className="text-sm text-gray-600">Right Leg</div>
                    <div className="text-xl font-bold text-green-600">{athleteBodyComp.symmetry.leg_mass_right_kg.toFixed(1)}kg</div>
                    <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded mt-1">116.8% Standard</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg border-2 border-green-200">
                    <div className="text-sm text-gray-600">Left Leg</div>
                    <div className="text-xl font-bold text-green-600">{athleteBodyComp.symmetry.leg_mass_left_kg.toFixed(1)}kg</div>
                    <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded mt-1">116.8% Standard</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg border-2 border-green-200">
                    <div className="text-sm text-gray-600">Right Leg</div>
                    <div className="text-xl font-bold text-green-600">{(athleteBodyComp.symmetry.leg_mass_right_kg * 0.35).toFixed(1)}kg</div>
                    <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded mt-1">102.0% Standard</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg border-2 border-green-200">
                    <div className="text-sm text-gray-600">Left Leg</div>
                    <div className="text-xl font-bold text-green-600">{(athleteBodyComp.symmetry.leg_mass_left_kg * 0.35).toFixed(1)}kg</div>
                    <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded mt-1">102.0% Standard</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
          <strong>Note:</strong> Standard range: 80%-160% • Segmental fat analysis is an inferred value • Left/right upper limbs (80%-115%), Trunk/lower limbs (90%-110%)
        </div>
      </div>

      {/* Bioelectrical Impedance */}
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

      {/* Body Score */}
      <div className="card-enhanced p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">🏆 Body Score Analysis</h2>

        {/* Calculate Body Score */}
        {(() => {
          // BMI Score (25 points max) - Optimal BMI is 22
          const bmiScore = Math.max(0, Math.min(25, 25 - Math.abs(athleteBodyComp.bmi - 22) * 2));

          // Body Fat Score (25 points max) - Optimal body fat is 15%
          const bodyFatScore = Math.max(0, Math.min(25, 25 - Math.abs(athleteBodyComp.body_fat_rate - 15) * 1.5));

          // Muscle Mass Score (25 points max) - Based on healthy range
          const muscleScore = Math.max(0, Math.min(25, ((athleteBodyComp.muscle_mass_kg - athleteBodyComp.muscle_mass_range_min) / (athleteBodyComp.muscle_mass_range_max - athleteBodyComp.muscle_mass_range_min)) * 25));

          // Skeletal Muscle Score (15 points max) - Based on standard ranges
          const skeletalMuscleScore = Math.max(0, Math.min(15, ((athleteBodyComp.skeletal_muscle_kg - 30.2) / (37.0 - 30.2)) * 15));

          // Visceral Fat Score (10 points max) - Lower visceral fat is better
          const visceralFatScore = Math.max(0, Math.min(10, 10 - athleteBodyComp.visceral_fat_grade * 0.1));

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
          const bmiScore = Math.max(0, Math.min(25, 25 - Math.abs(athleteBodyComp.bmi - 22) * 2));
          const bodyFatScore = Math.max(0, Math.min(25, 25 - Math.abs(athleteBodyComp.body_fat_rate - 15) * 1.5));
          const muscleScore = Math.max(0, Math.min(25, ((athleteBodyComp.muscle_mass_kg - athleteBodyComp.muscle_mass_range_min) / (athleteBodyComp.muscle_mass_range_max - athleteBodyComp.muscle_mass_range_min)) * 25));
          const skeletalMuscleScore = Math.max(0, Math.min(15, ((athleteBodyComp.skeletal_muscle_kg - 30.2) / (37.0 - 30.2)) * 15));
          const visceralFatScore = Math.max(0, Math.min(10, 10 - athleteBodyComp.visceral_fat_grade * 0.1));
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
          const bmiScore = Math.max(0, Math.min(25, 25 - Math.abs(athleteBodyComp.bmi - 22) * 2));
          const bodyFatScore = Math.max(0, Math.min(25, 25 - Math.abs(athleteBodyComp.body_fat_rate - 15) * 1.5));
          const muscleScore = Math.max(0, Math.min(25, ((athleteBodyComp.muscle_mass_kg - athleteBodyComp.muscle_mass_range_min) / (athleteBodyComp.muscle_mass_range_max - athleteBodyComp.muscle_mass_range_min)) * 25));
          const skeletalMuscleScore = Math.max(0, Math.min(15, ((athleteBodyComp.skeletal_muscle_kg - 30.2) / (37.0 - 30.2)) * 15));
          const visceralFatScore = Math.max(0, Math.min(10, 10 - athleteBodyComp.visceral_fat_grade * 0.1));
          const calculatedScore = Math.round(bmiScore + bodyFatScore + muscleScore + skeletalMuscleScore + visceralFatScore);

          // Calculate target score based on ideal values
          const targetBmiScore = Math.max(0, Math.min(25, 25 - Math.abs(22 - 22) * 2)); // BMI 22
          const targetBodyFatScore = Math.max(0, Math.min(25, 25 - Math.abs(15 - 15) * 1.5)); // Body fat 15%
          const targetMuscleScore = Math.max(0, Math.min(25, ((athleteBodyComp.muscle_mass_range_max - athleteBodyComp.muscle_mass_range_min) / (athleteBodyComp.muscle_mass_range_max - athleteBodyComp.muscle_mass_range_min)) * 25)); // Max muscle
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

      {/* Weight Control Goals */}
      <div className="card-enhanced p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">🎯 Weight Control Goals</h2>

        {/* Current vs Target Overview */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <div className="text-sm text-gray-600 mb-1">Current Weight</div>
              <div className="text-2xl font-bold text-blue-600">{safeValue(athleteBodyComp.weight_kg).toFixed(1)} kg</div>
            </div>
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <div className="text-sm text-gray-600 mb-1">Target Weight</div>
              <div className="text-2xl font-bold text-green-600">{safeValue(athleteBodyComp.target_weight_kg).toFixed(1)} kg</div>
            </div>
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <div className="text-sm text-gray-600 mb-1">Difference</div>
              <div className={`text-2xl font-bold ${safeValue(athleteBodyComp.weight_control_kg) >= 0 ? 'text-orange-600' : 'text-red-600'}`}>
                {safeValue(athleteBodyComp.weight_control_kg) >= 0 ? '+' : ''}{safeValue(athleteBodyComp.weight_control_kg).toFixed(1)} kg
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
                <div className="text-2xl font-bold text-blue-600">{safeValue(athleteBodyComp.weight_kg).toFixed(1)}kg</div>
                <div className="text-xs text-gray-600">CURRENT</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{safeValue(athleteBodyComp.target_weight_kg).toFixed(1)}kg</div>
                <div className="text-xs text-gray-600">TARGET</div>
              </div>
            </div>

            {/* Enhanced Progress Bar */}
            <div className="relative mb-4">
              <div className="w-full bg-gray-300 rounded-full h-6 shadow-inner">
                <div
                  className="bg-gradient-to-r from-blue-500 via-blue-600 to-green-500 h-6 rounded-full transition-all duration-500 shadow-lg"
                  style={{
                    width: `${Math.min(100, Math.max(0, ((athleteBodyComp.target_weight_kg - athleteBodyComp.weight_kg) / (athleteBodyComp.target_weight_kg - athleteBodyComp.weight_kg + Math.abs(athleteBodyComp.weight_control_kg))) * 100))}%`
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
                left: `${Math.min(100, Math.max(0, ((safeValue(athleteBodyComp.target_weight_kg) - safeValue(athleteBodyComp.weight_kg)) / (safeValue(athleteBodyComp.target_weight_kg) - safeValue(athleteBodyComp.weight_kg) + Math.abs(safeValue(athleteBodyComp.weight_control_kg)))) * 100))}%`,
                transform: 'translateX(-50%)'
              }}>
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                  <div className="text-xs font-bold text-blue-600 whitespace-nowrap">📍 {safeValue(athleteBodyComp.weight_kg).toFixed(1)}kg</div>
                </div>
              </div>
            </div>

            {/* Progress Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="text-sm text-gray-600">Difference</div>
                <div className={`text-lg font-bold ${safeValue(athleteBodyComp.weight_control_kg) >= 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {safeValue(athleteBodyComp.weight_control_kg) >= 0 ? '+' : ''}{safeValue(athleteBodyComp.weight_control_kg).toFixed(1)} kg
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="text-sm text-gray-600">Progress</div>
                <div className="text-lg font-bold text-blue-600">
                  {Math.min(100, Math.max(0, ((safeValue(athleteBodyComp.target_weight_kg) - safeValue(athleteBodyComp.weight_kg)) / (safeValue(athleteBodyComp.target_weight_kg) - safeValue(athleteBodyComp.weight_kg) + Math.abs(safeValue(athleteBodyComp.weight_control_kg)))) * 100)).toFixed(0)}%
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="text-sm text-gray-600">Status</div>
                <div className={`text-lg font-bold ${athleteBodyComp.weight_control_kg <= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                  {athleteBodyComp.weight_control_kg <= 0 ? 'On Track' : 'Adjusting'}
                </div>
              </div>
            </div>

            {/* Motivational Message */}
            <div className="mt-4 text-center">
              <div className="text-sm text-gray-700 bg-white p-3 rounded-lg shadow-sm">
                {safeValue(athleteBodyComp.weight_control_kg) <= 0 ?
                  `🎉 Great progress! Only ${Math.abs(safeValue(athleteBodyComp.weight_control_kg)).toFixed(1)}kg to reach your target!` :
                  `💪 You're ${Math.abs(safeValue(athleteBodyComp.weight_control_kg)).toFixed(1)}kg above target. Let's adjust your plan!`
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
                <span className="font-bold text-blue-600">{safeValue(athleteBodyComp.target_weight_kg).toFixed(1)} kg</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white rounded">
                <span className="text-sm text-blue-700">Current Status</span>
                <span className={`font-bold ${safeValue(athleteBodyComp.weight_control_kg) >= 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {safeValue(athleteBodyComp.weight_control_kg) >= 0 ? 'Above Target' : 'On Track'}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white rounded">
                <span className="text-sm text-blue-700">Weekly Goal</span>
                <span className="font-bold text-blue-600">
                  {safeValue(athleteBodyComp.weight_control_kg) > 2 ? `-${Math.min(1.0, safeValue(athleteBodyComp.weight_control_kg) / 8).toFixed(2)} kg/week` :
                   safeValue(athleteBodyComp.weight_control_kg) > 0 ? `-${Math.min(0.5, safeValue(athleteBodyComp.weight_control_kg) / 8).toFixed(2)} kg/week` :
                   safeValue(athleteBodyComp.weight_control_kg) < -2 ? `+${Math.min(0.5, Math.abs(safeValue(athleteBodyComp.weight_control_kg)) / 8).toFixed(2)} kg/week` : 'Maintain'}
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
                <span className={`font-bold ${safeValue(athleteBodyComp.fat_control_kg) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {safeValue(athleteBodyComp.fat_control_kg) >= 0 ? '+' : ''}{safeValue(athleteBodyComp.fat_control_kg).toFixed(1)} kg
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white rounded">
                <span className="text-sm text-green-700">Muscle Control</span>
                <span className={`font-bold ${safeValue(athleteBodyComp.muscle_control_kg) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {safeValue(athleteBodyComp.muscle_control_kg) >= 0 ? '+' : ''}{safeValue(athleteBodyComp.muscle_control_kg).toFixed(1)} kg
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
                  {safeValue(athleteBodyComp.weight_control_kg) > 2 ? `Calorie deficit: ${Math.round(safeValue(athleteBodyComp.weight_control_kg) * 1250)} kcal/day` :
                   safeValue(athleteBodyComp.weight_control_kg) > 0 ? `Calorie deficit: ${Math.round(safeValue(athleteBodyComp.weight_control_kg) * 625)} kcal/day` :
                   safeValue(athleteBodyComp.weight_control_kg) < -2 ? `Calorie surplus: ${Math.round(Math.abs(safeValue(athleteBodyComp.weight_control_kg)) * 625)} kcal/day` : 'Balanced nutrition'}
                </div>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <div className="font-medium">Training Focus</div>
                <div>
                  {athleteBodyComp.muscle_control_kg < 0 ? 'Strength training 3x/week' :
                   athleteBodyComp.fat_control_kg > 0 ? 'HIIT + cardio 3x/week' : 'Mixed training program'}
                </div>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <div className="font-medium">Timeline</div>
                <div>
                  {Math.abs(safeValue(athleteBodyComp.weight_control_kg)) > 5 ? `${Math.round(Math.abs(safeValue(athleteBodyComp.weight_control_kg)) * 2.4)} weeks` :
                   Math.abs(safeValue(athleteBodyComp.weight_control_kg)) > 2 ? `${Math.round(Math.abs(safeValue(athleteBodyComp.weight_control_kg)) * 1.5)} weeks` : '4-6 weeks'}
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

      {/* Other Indicators */}
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
                <span className="text-lg font-bold text-blue-600">{safeValue(athleteBodyComp.basal_metabolic_rate_kcal)} kcal</span>
              </div>
              <div className="text-xs text-blue-600 mb-2">Daily calories burned at rest</div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${Math.min(100, (athleteBodyComp.basal_metabolic_rate_kcal / 2500) * 100)}%` }}
                ></div>
              </div>
              <div className="text-xs text-blue-600 mt-1">Range: 1200-2500 kcal</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-green-700">Visceral Fat Grade</span>
                <span className="text-lg font-bold text-green-600">{athleteBodyComp.visceral_fat_grade}/10</span>
              </div>
              <div className="text-xs text-green-600 mb-2">Fat around internal organs</div>
              <div className="w-full bg-green-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${Math.min(100, (athleteBodyComp.visceral_fat_grade / 10) * 100)}%` }}
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
                <span className="text-lg font-bold text-purple-600">{safeValue(athleteBodyComp.fat_free_body_weight_kg).toFixed(1)} kg</span>
              </div>
              <div className="text-xs text-purple-600 mb-2">Weight without fat</div>
              <div className="w-full bg-purple-200 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full"
                  style={{ width: `${Math.min(100, (athleteBodyComp.fat_free_body_weight_kg / 80) * 100)}%` }}
                ></div>
              </div>
              <div className="text-xs text-purple-600 mt-1">Higher is better for muscle mass</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-orange-700">Subcutaneous Fat</span>
                <span className="text-lg font-bold text-orange-600">{safeValue(athleteBodyComp.subcutaneous_fat_percent).toFixed(1)}%</span>
              </div>
              <div className="text-xs text-orange-600 mb-2">Fat under the skin</div>
              <div className="w-full bg-orange-200 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full"
                  style={{ width: `${Math.min(100, athleteBodyComp.subcutaneous_fat_percent)}%` }}
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
              <div className="text-2xl font-bold text-indigo-600 mb-1">{athleteBodyComp.body_age}</div>
              <div className="text-xs text-indigo-600">years</div>
              <div className={`text-xs mt-2 px-2 py-1 rounded-full ${
                athleteBodyComp.body_age <= 25 ? 'bg-green-100 text-green-800' :
                athleteBodyComp.body_age <= 35 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {athleteBodyComp.body_age <= 25 ? 'Excellent' :
                 athleteBodyComp.body_age <= 35 ? 'Good' : 'Needs Attention'}
              </div>
            </div>
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-4 rounded-lg text-center">
              <div className="text-sm font-medium text-pink-700 mb-1">SMI</div>
              <div className="text-2xl font-bold text-pink-600 mb-1">{safeValue(athleteBodyComp.smi_kg_m2).toFixed(1)}</div>
              <div className="text-xs text-pink-600">kg/m²</div>
              <div className={`text-xs mt-2 px-2 py-1 rounded-full ${
                athleteBodyComp.smi_kg_m2 >= 7.0 ? 'bg-green-100 text-green-800' :
                athleteBodyComp.smi_kg_m2 >= 5.0 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {athleteBodyComp.smi_kg_m2 >= 7.0 ? 'Strong' :
                 athleteBodyComp.smi_kg_m2 >= 5.0 ? 'Average' : 'Low'}
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
              <span><strong>Metabolic Rate:</strong> Your BMR indicates {athleteBodyComp.basal_metabolic_rate_kcal > 1800 ? 'good muscle mass' : 'potential for improvement'} with strength training.</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <span><strong>Body Age:</strong> {athleteBodyComp.body_age <= 25 ? 'Excellent! Your body is in peak condition.' : 'Focus on consistent training and nutrition to improve.'}</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <span><strong>Muscle Quality:</strong> Your SMI suggests {athleteBodyComp.smi_kg_m2 >= 7.0 ? 'excellent muscle quality' : 'room for muscle development'}.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Body Balance Evaluation */}
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
    </div>
  );
};

// Styles
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
    maxWidth: '1000px',
    margin: '0 auto',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  header: {
    textAlign: 'center',
    color: '#333',
    fontSize: '24px',
    marginBottom: '20px',
  },
  subHeader: {
    color: '#333',
    marginTop: '20px',
    marginBottom: '10px',
    borderBottom: '2px solid #ddd',
    paddingBottom: '5px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '20px',
    backgroundColor: '#fff',
  },
  th: {
    border: '1px solid #ddd',
    padding: '8px',
    backgroundColor: '#f2f2f2',
    textAlign: 'left',
  },
  td: {
    border: '1px solid #ddd',
    padding: '8px',
    textAlign: 'left',
  },
  tdLabel: {
    border: '1px solid #ddd',
    padding: '8px',
    fontWeight: 'bold',
    backgroundColor: '#f2f2f2',
  },
  muscleFatSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginBottom: '20px',
  },
  axis: {
    position: 'relative',
    height: '60px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: '#fff',
    padding: '10px',
  },
  ticks: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#555',
    marginBottom: '5px',
  },
  tick: {
    transform: 'translateX(-50%)',
  },
  marker: {
    position: 'absolute',
    bottom: '10px',
    left: '10%',
    transform: 'translateX(-50%)',
    textAlign: 'center',
    fontSize: '14px',
  },
  label: {
    fontSize: '12px',
    color: '#555',
  },
  value: {
    fontWeight: 'bold',
    color: '#333',
  },
  obesitySection: {
    marginBottom: '20px',
  },
  bmiScale: {
    position: 'relative',
    height: '80px',
    marginBottom: '15px',
  },
  bfrScale: {
    position: 'relative',
    height: '80px',
  },
  scaleLabels: {
    display: 'flex',
  },
  scaleLabel: {
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    color: '#333',
  },
  scaleTicks: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#555',
    marginTop: '5px',
  },
  tickSmall: {
    transform: 'translateX(-50%)',
  },
  currentMarker: {
    position: 'absolute',
    bottom: '5px',
    left: '40%',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333',
  },
  segmentalSection: {
    marginBottom: '20px',
  },
  segmentalRow: {
    display: 'flex',
    gap: '40px',
    marginBottom: '10px',
  },
  segmentalGroup: {
    flex: 1,
  },
  segmentalLabel: {
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#333',
  },
  segmentalItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    margin: '5px 0',
    fontSize: '14px',
  },
  segmentalValue: {
    minWidth: '50px',
  },
  evalBox: {
    backgroundColor: '#e6f7e6',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '12px',
  },
  note: {
    fontSize: '12px',
    color: '#666',
    marginTop: '10px',
    fontStyle: 'italic',
  },
  scoreSection: {
    textAlign: 'center',
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #ddd',
  },
  score: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
  },
  disclaimer: {
    fontSize: '12px',
    color: '#666',
    marginTop: '10px',
  },
  controlTable: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '20px',
    backgroundColor: '#fff',
  },
};

export default ScaleReport;