import React, { useState, useMemo } from 'react';
import { athletes, biometricData, geneticProfiles } from '../data/mockData';
import { calculateReadinessScore, getGeneticInsights } from '../utils/analytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

interface ComparisonAthlete {
  athlete_id: string;
  name: string;
  readinessScore: number;
  hrv: number;
  restingHr: number;
  sleepDuration: number;
  spo2: number;
  trainingLoad: number;
  geneticInsights: Array<{
    gene: string;
    trait: string;
    recommendation: string;
  }>;
}

export const TeamComparisonDashboard: React.FC = () => {
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  const [metric, setMetric] = useState<string>('readiness');

  // Get comparison data for all athletes
  const comparisonData = useMemo<ComparisonAthlete[]>(() => {
    return athletes.map(athlete => {
      const athleteBiometrics = biometricData.filter(d => d.athlete_id === athlete.athlete_id);
      const athleteGenetics = geneticProfiles.filter(g => g.athlete_id === athlete.athlete_id);
      const latest = athleteBiometrics[athleteBiometrics.length - 1];
      
      return {
        athlete_id: athlete.athlete_id,
        name: athlete.name,
        readinessScore: latest ? calculateReadinessScore(latest) : 0,
        hrv: latest?.hrv_night || 0,
        restingHr: latest?.resting_hr || 0,
        sleepDuration: latest?.sleep_duration_h || 0,
        spo2: latest?.spo2_night || 0,
        trainingLoad: latest?.training_load_pct || 0,
        geneticInsights: getGeneticInsights(athleteGenetics)
      };
    });
  }, []);

  // Toggle athlete selection
  const toggleAthlete = (athleteId: string) => {
    if (selectedAthletes.includes(athleteId)) {
      setSelectedAthletes(selectedAthletes.filter(id => id !== athleteId));
    } else {
      setSelectedAthletes([...selectedAthletes, athleteId]);
    }
  };

  // Get data for selected athletes
  const selectedData = comparisonData.filter(athlete => 
    selectedAthletes.includes(athlete.athlete_id)
  );

  // Prepare chart data based on selected metric
  const chartData = selectedData.map(athlete => {
    let value = 0;
    let label = '';
    
    switch(metric) {
      case 'readiness':
        value = athlete.readinessScore;
        label = 'Readiness Score';
        break;
      case 'hrv':
        value = athlete.hrv;
        label = 'HRV (ms)';
        break;
      case 'restingHr':
        value = athlete.restingHr;
        label = 'Resting HR (bpm)';
        break;
      case 'sleep':
        value = athlete.sleepDuration;
        label = 'Sleep (h)';
        break;
      case 'spo2':
        value = athlete.spo2;
        label = 'SpO2 (%)';
        break;
      case 'trainingLoad':
        value = athlete.trainingLoad;
        label = 'Training Load (%)';
        break;
      default:
        value = athlete.readinessScore;
        label = 'Readiness Score';
    }
    
    return {
      name: athlete.name,
      value: value,
      label: label
    };
  });

  // Prepare radar chart data for genetic insights
  const radarData = selectedData.map(athlete => {
    const insightsCount = athlete.geneticInsights.length;
    return {
      name: athlete.name,
      insights: insightsCount,
      fullMark: 10
    };
  });
  
  // Prepare data for the selected metric comparison (spider chart)
  const metricRadarData = selectedData.map(athlete => {
    let value = 0;
    switch(metric) {
      case 'readiness':
        value = athlete.readinessScore;
        break;
      case 'hrv':
        value = athlete.hrv;
        break;
      case 'restingHr':
        value = athlete.restingHr;
        break;
      case 'sleep':
        value = athlete.sleepDuration;
        break;
      case 'spo2':
        value = athlete.spo2;
        break;
      case 'trainingLoad':
        value = athlete.trainingLoad;
        break;
      default:
        value = athlete.readinessScore;
    }
    
    return {
      name: athlete.name,
      value: value,
      fullMark: 100
    };
  });

  return (
    <div className="space-y-8">
      <div className="card-enhanced p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Team Comparison Dashboard</h2>
        <p className="text-gray-600 mb-6">Compare athletes side-by-side across key metrics</p>
        
        {/* Athlete Selection */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Athletes to Compare</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {comparisonData.map(athlete => (
              <div 
                key={athlete.athlete_id}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedAthletes.includes(athlete.athlete_id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggleAthlete(athlete.athlete_id)}
              >
                <div className="font-medium text-sm text-gray-900 truncate">{athlete.name}</div>
                <div className="text-xs text-gray-500 mt-1">{athlete.readinessScore.toFixed(0)}% ready</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Metric Selection */}
        {selectedData.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Metric</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'readiness', label: 'Readiness Score' },
                { id: 'hrv', label: 'HRV (ms)' },
                { id: 'restingHr', label: 'Resting HR (bpm)' },
                { id: 'sleep', label: 'Sleep Duration (h)' },
                { id: 'spo2', label: 'SpO2 (%)' },
                { id: 'trainingLoad', label: 'Training Load (%)' }
              ].map(m => (
                <button
                  key={m.id}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    metric === m.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setMetric(m.id)}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Comparison Charts */}
        {selectedData.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Bar Chart */}
            <div className="card-enhanced p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {chartData[0]?.label || 'Metric'} Comparison
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Radar Chart for Selected Metric Comparison */}
            <div className="card-enhanced p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {chartData[0]?.label || 'Metric'} Comparison (Spider Chart)
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={metricRadarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" />
                    <PolarRadiusAxis domain={[0, 100]} />
                    <Radar
                      name={chartData[0]?.label || 'Metric'}
                      dataKey="value"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select Athletes to Compare</h3>
            <p className="text-gray-600">Choose athletes from the grid above to see detailed comparisons</p>
          </div>
        )}
        
        {/* Detailed Comparison Table */}
        {selectedData.length > 0 && (
          <div className="mt-8 card-enhanced p-5 overflow-x-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Metrics Comparison</h3>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Athlete</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Readiness</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HRV (ms)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resting HR</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sleep (h)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SpO2 (%)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Training Load</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {selectedData.map(athlete => (
                  <tr key={athlete.athlete_id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{athlete.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{athlete.readinessScore.toFixed(0)}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{athlete.hrv.toFixed(0)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{athlete.restingHr.toFixed(0)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{athlete.sleepDuration.toFixed(1)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{athlete.spo2.toFixed(1)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{athlete.trainingLoad.toFixed(0)}%</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};