import React, { useState, useMemo, useEffect } from 'react';
import { athleteService, biometricDataService } from '../services/dataService';
import { Athlete, BiometricData } from '../types';

interface TrainingDay {
  date: string;
  trainingLoad: number;
  hrv?: number;
  restingHr?: number;
  sleepHours?: number;
}

interface AthleteTrainingData {
  athlete: Athlete;
  trainingDays: TrainingDay[];
  avgLoad: number;
  avgHrv: number;
  avgRestingHr: number;
  avgSleep: number;
}

export const TrainingLoadHeatmap: React.FC = () => {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [athleteTrainingData, setAthleteTrainingData] = useState<AthleteTrainingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '14d' | '30d'>('14d');

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch athletes first
        const athletesResponse = await athleteService.getAllAthletes(1, 50);
        const athletesData = athletesResponse.athletes || [];
        setAthletes(athletesData);

        console.log('📊 Training Load Data:', {
          athletes: athletesData.length,
          sampleAthletes: athletesData.slice(0, 3).map((a: Athlete) => ({ id: a.id, athlete_id: a.athlete_id, name: a.name }))
        });

        // Process biometric data for each athlete using the transformed service
        const processedData: AthleteTrainingData[] = await Promise.all(
          athletesData.map(async (athlete: Athlete) => {
            try {
              console.log(`🎯 Fetching data for athlete ${athlete.name} (ID: ${athlete.id})`);

              // Use the transformed biometric data service
              const athleteBiometricData = await biometricDataService.getBiometricDataByAthlete(athlete.id);

              console.log(`🔍 Athlete ${athlete.name} biometric data:`, {
                records: athleteBiometricData.length,
                sampleRecord: athleteBiometricData[0] || 'No records'
              });

              const trainingDays: TrainingDay[] = athleteBiometricData.map((record: BiometricData) => {
                console.log(`📊 Processing biometric record for ${athlete.name}:`, {
                  date: record.date,
                  training_load_pct: record.training_load_pct,
                  hrv_night: record.hrv_night,
                  resting_hr: record.resting_hr,
                  sleep_duration_h: record.sleep_duration_h,
                  allFields: Object.keys(record)
                });

                return {
                  date: record.date,
                  trainingLoad: record.training_load_pct || 0,
                  hrv: record.hrv_night,
                  restingHr: record.resting_hr,
                  sleepHours: record.sleep_duration_h
                };
              });

              console.log(`✅ Athlete ${athlete.name} processed:`, {
                trainingDays: trainingDays.length,
                avgLoad: trainingDays.length > 0 ? trainingDays.reduce((sum, day) => sum + day.trainingLoad, 0) / trainingDays.length : 0,
                avgHrv: trainingDays.length > 0
                  ? trainingDays.filter(d => d.hrv).reduce((sum, day) => sum + (day.hrv || 0), 0) /
                    trainingDays.filter(d => d.hrv).length
                  : 0,
                avgRestingHr: trainingDays.length > 0
                  ? trainingDays.filter(d => d.restingHr).reduce((sum, day) => sum + (day.restingHr || 0), 0) /
                    trainingDays.filter(d => d.restingHr).length
                  : 0,
                avgSleep: trainingDays.length > 0
                  ? trainingDays.filter(d => d.sleepHours).reduce((sum, day) => sum + (day.sleepHours || 0), 0) /
                    trainingDays.filter(d => d.sleepHours).length
                  : 0,
                sampleDay: trainingDays[0] || 'No days'
              });

              // Calculate averages with detailed logging
              const avgLoad = trainingDays.length > 0
                ? trainingDays.reduce((sum, day) => sum + day.trainingLoad, 0) / trainingDays.length
                : 0;

              const hrvValues = trainingDays.filter(d => d.hrv !== undefined && d.hrv !== null).map(d => d.hrv!);
              const avgHrv = hrvValues.length > 0
                ? hrvValues.reduce((sum, hrv) => sum + hrv, 0) / hrvValues.length
                : 0;

              const restingHrValues = trainingDays.filter(d => d.restingHr !== undefined && d.restingHr !== null).map(d => d.restingHr!);
              const avgRestingHr = restingHrValues.length > 0
                ? restingHrValues.reduce((sum, hr) => sum + hr, 0) / restingHrValues.length
                : 0;

              const sleepValues = trainingDays.filter(d => d.sleepHours !== undefined && d.sleepHours !== null && d.sleepHours > 0).map(d => d.sleepHours!);
              const avgSleep = sleepValues.length > 0
                ? sleepValues.reduce((sum, sleep) => sum + sleep, 0) / sleepValues.length
                : 0;

              console.log(`📈 Average calculations for ${athlete.name}:`, {
                trainingDays: trainingDays.length,
                avgLoad: avgLoad,
                hrvValues: hrvValues,
                avgHrv: avgHrv,
                restingHrValues: restingHrValues,
                avgRestingHr: avgRestingHr,
                sleepValues: sleepValues,
                avgSleep: avgSleep
              });

              const result = {
                athlete,
                trainingDays,
                avgLoad: Math.round(avgLoad),
                avgHrv: Math.round(avgHrv),
                avgRestingHr: Math.round(avgRestingHr),
                avgSleep: Math.round(avgSleep * 10) / 10
              };

              console.log(`✅ Final result for ${athlete.name}:`, {
                avgLoad: result.avgLoad,
                avgHrv: result.avgHrv,
                avgRestingHr: result.avgRestingHr,
                avgSleep: result.avgSleep,
                trainingDaysCount: result.trainingDays.length
              });

              return result;
            } catch (error) {
              console.error(`❌ Failed to fetch data for athlete ${athlete.name}:`, error);
              return {
                athlete,
                trainingDays: [],
                avgLoad: 0,
                avgHrv: 0,
                avgRestingHr: 0,
                avgSleep: 0
              };
            }
          })
        );

        setAthleteTrainingData(processedData);

      } catch (err) {
        console.error('❌ Failed to fetch training data:', err);
        setError('Failed to load training data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get color based on training load value
  const getLoadColor = (value: number) => {
    if (value >= 90) return 'bg-red-500';
    if (value >= 80) return 'bg-orange-500';
    if (value >= 70) return 'bg-yellow-500';
    if (value >= 60) return 'bg-green-400';
    if (value >= 50) return 'bg-green-500';
    return 'bg-blue-500';
  };

  // Get intensity label
  const getIntensityLabel = (value: number) => {
    if (value >= 90) return 'Very High';
    if (value >= 80) return 'High';
    if (value >= 70) return 'Moderate-High';
    if (value >= 60) return 'Moderate';
    if (value >= 50) return 'Low-Moderate';
    return 'Low';
  };

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="card-enhanced p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading training data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-8">
        <div className="card-enhanced p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-red-500 text-4xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Data</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show no data state
  if (!athletes.length) {
    return (
      <div className="space-y-8">
        <div className="card-enhanced p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-gray-400 text-4xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Training Data Available</h3>
              <p className="text-gray-600">No athletes found in the system.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="card-enhanced p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Training Load Overview</h2>
            <p className="text-gray-600">Monitor training intensity and recovery metrics</p>
          </div>

          {/* Time Range Selector */}
          <div className="flex gap-2">
            {(['7d', '14d', '30d'] as const).map((range) => (
              <button
                key={range}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  selectedTimeRange === range
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setSelectedTimeRange(range)}
              >
                {range === '7d' ? '7 Days' : range === '14d' ? '14 Days' : '30 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {athleteTrainingData.length}
            </div>
            <div className="text-sm text-gray-600">Active Athletes</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {(() => {
                const avg = athleteTrainingData.reduce((sum, data) => sum + data.avgLoad, 0) / athleteTrainingData.length;
                return isNaN(avg) ? 0 : Math.round(avg);
              })()}%
            </div>
            <div className="text-sm text-gray-600">Avg Training Load</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {(() => {
                const validHrvs = athleteTrainingData.filter(data => data.avgHrv > 0);
                const avg = validHrvs.length > 0 ? validHrvs.reduce((sum, data) => sum + data.avgHrv, 0) / validHrvs.length : 0;
                return isNaN(avg) ? 0 : Math.round(avg);
              })()}
            </div>
            <div className="text-sm text-gray-600">Avg HRV</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {(() => {
                const validSleep = athleteTrainingData.filter(data => data.avgSleep > 0);
                const avg = validSleep.length > 0 ? validSleep.reduce((sum, data) => sum + data.avgSleep, 0) / validSleep.length : 0;
                return isNaN(avg) ? 0 : Math.round(avg * 10) / 10;
              })()}h
            </div>
            <div className="text-sm text-gray-600">Avg Sleep</div>
          </div>
        </div>

        {/* Athlete Training Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {athleteTrainingData.map((data) => {
            console.log(`🎨 Displaying athlete ${data.athlete.name}:`, {
              avgHrv: data.avgHrv,
              avgRestingHr: data.avgRestingHr,
              avgSleep: data.avgSleep,
              trainingDays: data.trainingDays.length
            });
            return (
            <div key={data.athlete.athlete_id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              {/* Athlete Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{data.athlete.name}</h3>
                  <p className="text-sm text-gray-500">{data.athlete.sport}</p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  data.avgLoad >= 80 ? 'bg-red-100 text-red-800' :
                  data.avgLoad >= 60 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {getIntensityLabel(data.avgLoad)}
                </div>
              </div>

              {/* Training Load Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Training Load</span>
                  <span>{data.avgLoad}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${getLoadColor(data.avgLoad)}`}
                    style={{ width: `${Math.min(data.avgLoad, 100)}%` }}
                  ></div>
                </div>
                
              </div>

             

              {/* Recent Training Days */}
              {data.trainingDays.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Recent Training</div>
                  <div className="flex gap-1">
                    {data.trainingDays.slice(-7).map((day, index) => (
                      <div
                        key={index}
                        className={`w-6 h-6 rounded-sm ${getLoadColor(day.trainingLoad)}`}
                        title={`${day.date}: ${day.trainingLoad}% load`}
                      ></div>
                    ))}
                  </div>
                </div>
              )}

              {data.trainingDays.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">No training data available</p>
                </div>
              )}
            </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Training Load Intensity Scale</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Low (0-49%)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Moderate (50-69%)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600">High (70-79%)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-orange-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Very High (80-100%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};