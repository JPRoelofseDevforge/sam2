// components/BodyComposition.tsx
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { BodyComposition as BodyCompositionType } from '../types';

interface BodyCompositionProps {
  data: BodyCompositionType;
  history?: BodyCompositionType[]; // Optional: for trend charts
  geneticData?: { gene: string; genotype: string }[];
}

export const BodyComposition: React.FC<BodyCompositionProps> = ({ data, history = [], geneticData = [] }) => {
  const hasHistory = history.length > 1;

  // Sort history by date
  const sortedHistory = hasHistory
    ? [...history].sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())
    : [];

  // BMI & Body Fat Status
  const getBMIStatus = (bmi: number) => {
    if (bmi < 16) return { status: 'Severely Underweight', color: 'text-red-600' };
    if (bmi < 18.5) return { status: 'Underweight', color: 'text-blue-600' };
    if (bmi < 25) return { status: 'Healthy', color: 'text-green-600' };
    if (bmi < 30) return { status: 'Overweight', color: 'text-yellow-600' };
    return { status: 'Obese', color: 'text-red-600' };
  };

  const getBodyFatStatus = (bodyFat: number) => {
    // Assuming male; adjust if gender is available
    if (bodyFat < 6) return { status: 'Very Low', color: 'text-blue-600' };
    if (bodyFat < 14) return { status: 'Low', color: 'text-green-600' };
    if (bodyFat < 18) return { status: 'Normal', color: 'text-green-600' };
    if (bodyFat < 25) return { status: 'High', color: 'text-yellow-600' };
    return { status: 'Very High', color: 'text-red-600' };
  };

  const bmiStatus = getBMIStatus(data.bmi);
  const bodyFatStatus = getBodyFatStatus(data.body_fat_rate);

  // Body Score Calculation
  const calculateBodyScore = () => {
    let score = 100;

    // Deduct for being off-target
    if (data.weight_control_kg > 0.5) score -= 10;
    if (data.weight_control_kg < -0.5) score -= 5;

    if (data.fat_control_kg > 0) score -= Math.abs(data.fat_control_kg) * 8;
    if (data.muscle_control_kg < 0) score -= Math.abs(data.muscle_control_kg) * 5;

    // Bonus for low visceral fat
    if (data.visceral_fat_grade <= 1) score += 10;
    if (data.visceral_fat_grade >= 4) score -= 15;

    return Math.max(0, Math.round(score));
  };

  const bodyScore = calculateBodyScore();

  // Nutrition Tips Based on Genetics
  const getNutritionTips = () => {
    const tips: { gene: string; trait: string; tip: string }[] = [];

    geneticData.forEach((g) => {
      if (g.gene === 'ACTN3') {
        tips.push({
          gene: 'ACTN3',
          trait: 'Power vs Endurance',
          tip:
            g.genotype === 'RR'
              ? 'High-protein + creatine may boost power gains.'
              : g.genotype === 'XX'
              ? 'Prioritize complex carbs and antioxidants for endurance recovery.'
              : 'Hybrid profile — balance macronutrients.',
        });
      }
      if (g.gene === 'ADRB2' && g.genotype === 'Gly16Gly') {
        tips.push({
          gene: 'ADRB2',
          trait: 'Fat Metabolism',
          tip: 'Reduced fat mobilization — optimize carb timing around training.',
        });
      }
      if (g.gene === 'PPARGC1A' && g.genotype.includes('Ser')) {
        tips.push({
          gene: 'PPARGC1A',
          trait: 'Mitochondrial Health',
          tip: 'Polyphenol-rich foods (green tea, berries) may support endurance adaptation.',
        });
      }
    });

    return tips;
  };

  const nutritionTips = getNutritionTips();

  return (
    <div className="space-y-8 text-gray-900">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-enhanced p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {data.weight_kg.toFixed(1)} kg
          </div>
          <div className="text-gray-700 mb-2">Weight</div>
          <div className="text-sm text-gray-600">
            Target: {data.target_weight_kg.toFixed(1)} kg
          </div>
        </div>

        <div className="card-enhanced p-6 text-center">
          <div className="text-3xl font-bold text-orange-600 mb-2">
            {data.body_fat_rate.toFixed(1)}%
          </div>
          <div className="text-gray-700 mb-2">Body Fat</div>
          <div className={`text-sm font-medium ${bodyFatStatus.color}`}>
            {bodyFatStatus.status}
          </div>
        </div>

        <div className="card-enhanced p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {data.muscle_mass_kg.toFixed(1)} kg
          </div>
          <div className="text-gray-700 mb-2">Muscle Mass</div>
          <div className="text-sm text-gray-600">
            Skeletal: {data.skeletal_muscle_kg.toFixed(1)} kg
          </div>
        </div>
      </div>

      {/* BMI & Body Fat Scales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* BMI */}
        <div className="card-enhanced p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⚖️ BMI: {data.bmi.toFixed(1)}</h3>
          <div className={`text-lg font-medium mb-3 ${bmiStatus.color}`}>{bmiStatus.status}</div>
          <div className="relative h-3 bg-gradient-to-r from-blue-500 via-green-500 to-yellow-500 to-red-500 rounded-full mb-2">
            <div
              className="absolute top-0 w-1 h-6 bg-gray-800 rounded-full transform -translate-x-1/2 shadow-md"
              style={{ left: `${Math.min(100, Math.max(0, ((data.bmi - 15) / 20) * 100))}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>15</span>
            <span>18.5</span>
            <span>25</span>
            <span>30</span>
            <span>35</span>
          </div>
        </div>

        {/* Body Fat */}
        <div className="card-enhanced p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🥑 Fat: {data.body_fat_rate.toFixed(1)}%</h3>
          <div className={`text-lg font-medium mb-3 ${bodyFatStatus.color}`}>{bodyFatStatus.status}</div>
          <div className="relative h-3 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full mb-2">
            <div
              className="absolute top-0 w-1 h-6 bg-gray-800 rounded-full transform -translate-x-1/2 shadow-md"
              style={{ left: `${Math.min(100, Math.max(0, (data.body_fat_rate / 30) * 100))}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>5%</span>
            <span>15%</span>
            <span>25%</span>
            <span>35%</span>
          </div>
        </div>
      </div>

      {/* Weight Control Goals */}
      <div className="card-enhanced p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Progress Toward Goals</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-600">Target Weight</div>
            <div className="text-xl font-bold text-indigo-600">{data.target_weight_kg.toFixed(1)}kg</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Weight Δ</div>
            <div className={`text-xl font-bold ${data.weight_control_kg >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.weight_control_kg >= 0 ? '+' : ''}
              {data.weight_control_kg.toFixed(1)}kg
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Fat Δ</div>
            <div className={`text-xl font-bold ${data.fat_control_kg >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.fat_control_kg >= 0 ? '+' : ''}
              {data.fat_control_kg.toFixed(1)}kg
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Muscle Δ</div>
            <div className={`text-xl font-bold ${data.muscle_control_kg >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.muscle_control_kg >= 0 ? '+' : ''}
              {data.muscle_control_kg.toFixed(1)}kg
            </div>
          </div>
        </div>
      </div>

      {/* Trend Chart (if history) */}
      {hasHistory && (
        <div className="card-enhanced p-6">
          <h3 className="text-lg font-semibold text-blue-700 mb-4">📈 Body Trends (Last 8 Weeks)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sortedHistory} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  stroke="#6b7280"
                />
                <YAxis yAxisId="left" stroke="#6366f1" domain={['auto', 'auto']} />
                <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#1f2937' }}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="weight_kg"
                  name="Weight"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={false}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="muscle_mass_kg"
                  name="Muscle"
                  stroke="#10b981"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="body_fat_rate"
                  name="Body Fat %"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Additional Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-enhanced p-4 text-center">
          <div className="text-sm text-gray-600">Visceral Fat</div>
          <div className="text-2xl font-bold text-red-600">{data.visceral_fat_grade}</div>
          <div className="text-xs text-gray-500">Grade</div>
        </div>
        <div className="card-enhanced p-4 text-center">
          <div className="text-sm text-gray-600">BMR</div>
          <div className="text-2xl font-bold text-blue-600">{data.basal_metabolic_rate_kcal}</div>
          <div className="text-xs text-gray-500">kcal/day</div>
        </div>
        <div className="card-enhanced p-4 text-center">
          <div className="text-sm text-gray-600">SMI</div>
          <div className="text-2xl font-bold text-purple-600">{data.smi_kg_m2.toFixed(1)}</div>
          <div className="text-xs text-gray-500">kg/m²</div>
        </div>
        <div className="card-enhanced p-4 text-center">
          <div className="text-sm text-gray-600">Body Age</div>
          <div className="text-2xl font-bold text-green-600">{data.body_age}</div>
          <div className="text-xs text-gray-500">vs </div>
        </div>
      </div>

      {/* Body Score */}
      <div className="card-enhanced p-6 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">🏆 Body Composition Score</h3>
        <div className={`text-6xl font-extrabold mb-2 ${bodyScore > 90 ? 'text-green-600' : bodyScore > 70 ? 'text-yellow-600' : 'text-red-600'}`}>
          {bodyScore}
        </div>
        <p className="text-gray-700 text-sm">
          {bodyScore > 90
            ? 'Elite body composition'
            : bodyScore > 70
            ? 'Good balance — focus on refinement'
            : 'Needs improvement in fat/muscle ratio'}
        </p>
      </div>

      {/* Genetic Nutrition Tips */}
      {nutritionTips.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-amber-700 flex items-center gap-2">
            <span>🥗</span> Personalized Nutrition Insights
          </h3>
          {nutritionTips.map((tip, i) => (
            <div
              key={i}
              className="card-enhanced p-5"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-amber-700">{tip.gene}</h4>
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Nutrition</span>
              </div>
              <p className="text-gray-700 text-sm">
                <strong className="text-amber-600">Trait:</strong> {tip.trait}
              </p>
              <p className="text-gray-600 text-sm mt-1">
                <strong className="text-amber-600">Tip:</strong> {tip.tip}
              </p>
            </div>
          ))}
        </div>
      )}

            {/* Muscle Symmetry Analysis */}
      {data.symmetry && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-blue-700 flex items-center gap-2">
            <span>⚖️</span> Muscle Symmetry Analysis
          </h3>

          {/* Arms */}
          <div className="card-enhanced p-5">
            <h4 className="font-semibold text-gray-900 mb-3">💪 Arms</h4>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Left</span>
                  <span className="text-gray-900">{data.symmetry.arm_mass_left_kg.toFixed(1)}kg</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${(data.symmetry.arm_mass_left_kg / Math.max(data.symmetry.arm_mass_left_kg, data.symmetry.arm_mass_right_kg)) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Right</span>
                  <span className="text-gray-900">{data.symmetry.arm_mass_right_kg.toFixed(1)}kg</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${(data.symmetry.arm_mass_right_kg / Math.max(data.symmetry.arm_mass_left_kg, data.symmetry.arm_mass_right_kg)) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-600 mt-2">
              Imbalance: {Math.abs(data.symmetry.arm_mass_left_kg - data.symmetry.arm_mass_right_kg).toFixed(1)}kg (
              {((Math.abs(data.symmetry.arm_mass_left_kg - data.symmetry.arm_mass_right_kg) / ((data.symmetry.arm_mass_left_kg + data.symmetry.arm_mass_right_kg) / 2)) * 100).toFixed(1)}%)
            </div>
          </div>

          {/* Legs */}
          <div className="card-enhanced p-5">
            <h4 className="font-semibold text-gray-900 mb-3">🦵 Legs</h4>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Left</span>
                  <span className="text-gray-900">{data.symmetry.leg_mass_left_kg.toFixed(1)}kg</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${(data.symmetry.leg_mass_left_kg / Math.max(data.symmetry.leg_mass_left_kg, data.symmetry.leg_mass_right_kg)) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Right</span>
                  <span className="text-gray-900">{data.symmetry.leg_mass_right_kg.toFixed(1)}kg</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${(data.symmetry.leg_mass_right_kg / Math.max(data.symmetry.leg_mass_left_kg, data.symmetry.leg_mass_right_kg)) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-600 mt-2">
              Imbalance: {Math.abs(data.symmetry.leg_mass_left_kg - data.symmetry.leg_mass_right_kg).toFixed(1)}kg (
              {((Math.abs(data.symmetry.leg_mass_left_kg - data.symmetry.leg_mass_right_kg) / ((data.symmetry.leg_mass_left_kg + data.symmetry.leg_mass_right_kg) / 2)) * 100).toFixed(1)}%)
            </div>
          </div>

          {/* Risk & Recommendation */}
          <div className="card-enhanced p-5">
            <h4 className="font-semibold text-amber-700 mb-2">⚠️ Asymmetry Risk</h4>
            <p className="text-amber-600 text-sm">
              {(() => {
                const armDiff = Math.abs(data.symmetry.arm_mass_left_kg - data.symmetry.arm_mass_right_kg);
                const legDiff = Math.abs(data.symmetry.leg_mass_left_kg - data.symmetry.leg_mass_right_kg);
                if (legDiff > 0.4 || armDiff > 0.3) {
                  return 'Significant muscle imbalance detected. Consider unilateral training and mobility work to reduce injury risk.';
                }
                if (legDiff > 0.2 || armDiff > 0.2) {
                  return 'Minor asymmetry. Monitor over time and include balanced strength work.';
                }
                return 'Excellent symmetry. Keep up balanced training.';
              })()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};