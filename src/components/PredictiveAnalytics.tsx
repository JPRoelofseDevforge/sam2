import React, { useMemo, useState, useEffect } from 'react';
import { athleteService, biometricDataService } from '../services/dataService';
import { Athlete, BiometricData } from '../types';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';

interface InjuryRiskData {
  athleteId: string;
  name: string;
  injuryRiskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  contributingFactors: string[];
}

interface PerformanceForecast {
  date: string;
  predictedReadiness: number;
  optimalTrainingLoad: number;
  confidence: number;
}

export const PredictiveAnalytics: React.FC<{ athleteId?: string }> = ({ athleteId }) => {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [biometricData, setBiometricData] = useState<BiometricData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataFetched, setDataFetched] = useState(false);

  // Fetch athletes data
  useEffect(() => {
    const fetchAthletes = async () => {
      try {
        console.log('🔍 PredictiveAnalytics: Fetching athletes data...');
        const athletesResponse = await athleteService.getAllAthletes();
        console.log('📊 PredictiveAnalytics: Raw athletes response:', athletesResponse);

        // Handle the $values structure from .NET JSON serialization
        let athletesArray: any[] = [];
        if (athletesResponse && typeof athletesResponse === 'object') {
          if (athletesResponse.athletes) {
            if (Array.isArray(athletesResponse.athletes)) {
              athletesArray = athletesResponse.athletes;
            } else if (athletesResponse.athletes.$values && Array.isArray(athletesResponse.athletes.$values)) {
              athletesArray = athletesResponse.athletes.$values;
            }
          } else if (athletesResponse.$values && Array.isArray(athletesResponse.$values)) {
            athletesArray = athletesResponse.$values;
          } else if (Array.isArray(athletesResponse)) {
            athletesArray = athletesResponse;
          }
        }

        console.log('✅ PredictiveAnalytics: Processed athletes array:', athletesArray);

        // Transform athletes data with proper name handling
        const transformedAthletes = athletesArray.map(athlete => {
          // Build athlete name with multiple fallbacks
          let athleteName = '';
          if (athlete.FirstName && athlete.LastName) {
            athleteName = `${athlete.FirstName} ${athlete.LastName}`.trim();
          } else if (athlete.FirstName) {
            athleteName = athlete.FirstName;
          } else if (athlete.LastName) {
            athleteName = athlete.LastName;
          } else if (athlete.Name) {
            athleteName = athlete.Name;
          } else if (athlete.FullName) {
            athleteName = athlete.FullName;
          } else {
            athleteName = `Athlete ${athlete.Id || athlete.UnionId || 'Unknown'}`;
          }

          return {
            id: athlete.Id || athlete.UnionId,
            athlete_id: (athlete.Id || athlete.UnionId)?.toString() || '',
            name: athleteName,
            sport: athlete.Sport || athlete.SportName || 'General',
            age: athlete.DateOfBirth ? new Date().getFullYear() - new Date(athlete.DateOfBirth).getFullYear() : 0,
            team: athlete.Team || athlete.TeamName || 'Default Team',
            baseline_start_date: undefined,
            date_of_birth: athlete.DateOfBirth
          };
        });

        console.log('✅ PredictiveAnalytics: Final transformed athletes:', transformedAthletes);
        setAthletes(transformedAthletes);
        setDataFetched(false); // Reset dataFetched when athletes change
      } catch (err) {
        console.error('❌ PredictiveAnalytics: Failed to fetch athletes:', err);
        setError('Failed to load athletes data');
        setAthletes([]);
        setLoading(false); // Set loading to false on error
        setDataFetched(true); // Prevent further fetches
      }
    };

    fetchAthletes();
  }, []);

  // Fetch biometric data
  useEffect(() => {
    const fetchBiometricData = async () => {
      // Only fetch if we have athletes data and haven't fetched yet
      if (athletes.length === 0 || dataFetched) {
        console.log('⚠️ PredictiveAnalytics: Skipping biometric fetch - athletes empty or already fetched');
        return;
      }

      try {
        console.log('🔄 PredictiveAnalytics: Starting biometric data fetch...');
        setLoading(true);
        setError(null);

        const allBiometricData: BiometricData[] = [];

        // If athleteId is specified, fetch only that athlete's data
        if (athleteId) {
          console.log(`🎯 PredictiveAnalytics: Fetching data for specific athlete: ${athleteId}`);
          const athleteIdNum = parseInt(athleteId, 10);
          if (!isNaN(athleteIdNum)) {
            const athleteBiometrics = await biometricDataService.getBiometricDataByAthlete(athleteIdNum);
            console.log(`📊 PredictiveAnalytics: Retrieved ${athleteBiometrics.length} records for athlete ${athleteId}`);
            setBiometricData(athleteBiometrics);
          } else {
            console.warn(`⚠️ PredictiveAnalytics: Invalid athlete ID: ${athleteId}`);
            setBiometricData([]);
          }
        } else {
          // Fetch data for all athletes
          console.log(`🔄 PredictiveAnalytics: Fetching data for ${athletes.length} athletes...`);
          for (const athlete of athletes) {
            const athleteIdNum = parseInt(athlete.athlete_id, 10);
            if (!isNaN(athleteIdNum)) {
              try {
                console.log(`🔍 PredictiveAnalytics: Fetching data for athlete ${athlete.name} (${athlete.athlete_id})`);
                const athleteBiometrics = await biometricDataService.getBiometricDataByAthlete(athleteIdNum);
                console.log(`✅ PredictiveAnalytics: Retrieved ${athleteBiometrics.length} records for ${athlete.name}`);
                allBiometricData.push(...athleteBiometrics);
              } catch (err) {
                console.error(`❌ PredictiveAnalytics: Failed to fetch data for athlete ${athlete.athlete_id}:`, err);
                // Continue with other athletes even if one fails
              }
            } else {
              console.warn(`⚠️ PredictiveAnalytics: Invalid athlete ID for ${athlete.name}: ${athlete.athlete_id}`);
            }
          }
          console.log(`📊 PredictiveAnalytics: Total biometric records retrieved: ${allBiometricData.length}`);
          setBiometricData(allBiometricData);
        }

        setDataFetched(true);
      } catch (err) {
        console.error('❌ PredictiveAnalytics: Failed to fetch biometric data:', err);
        setError('Failed to load biometric data');
        setBiometricData([]);
        setDataFetched(true); // Prevent further fetches on error
      } finally {
        console.log('✅ PredictiveAnalytics: Biometric data fetch completed');
        setLoading(false);
      }
    };

    fetchBiometricData();
  }, [athletes, athleteId, dataFetched]);

  // Calculate injury risk for all athletes or selected athlete
  const injuryRiskData = useMemo<InjuryRiskData[]>(() => {
    console.log('🔢 PredictiveAnalytics: Calculating injury risk data...');
    console.log('📊 Athletes available:', athletes.length);
    console.log('🎯 Selected athlete ID:', athleteId);
    console.log('📈 Biometric data available:', biometricData.length);

    if (athletes.length === 0) {
      console.log('⚠️ PredictiveAnalytics: No athletes data available');
      return [];
    }

    const relevantAthletes = athleteId
      ? athletes.filter(a => a.athlete_id === athleteId)
      : athletes;

    console.log('🎯 Relevant athletes for calculation:', relevantAthletes.length);
      
    return relevantAthletes.map(athlete => {
      const athleteBiometrics = biometricData.filter(d => d.athlete_id === athlete.athlete_id);
      
      // Calculate injury risk based on various factors
      let riskScore = 0;
      const factors: string[] = [];
      
      // Check for decreasing HRV trend
      if (athleteBiometrics.length >= 7) {
        const recentHrv = athleteBiometrics.slice(-7).map(d => d.hrv_night);
        const avgRecent = recentHrv.reduce((a, b) => a + b, 0) / recentHrv.length;
        const previousHrv = athleteBiometrics.slice(-14, -7).map(d => d.hrv_night);
        const avgPrevious = previousHrv.reduce((a, b) => a + b, 0) / previousHrv.length;
        
        if (avgRecent < avgPrevious * 0.85) {
          riskScore += 30;
          factors.push('Decreasing HRV trend');
        }
      }
      
      // Check for elevated resting heart rate
      const latestData = athleteBiometrics[athleteBiometrics.length - 1];
      if (latestData && latestData.resting_hr > 70) {
        riskScore += 20;
        factors.push('Elevated resting heart rate');
      }
      
      // Check for low sleep duration
      if (latestData && latestData.sleep_duration_h < 6) {
        riskScore += 15;
        factors.push('Inadequate sleep');
      }
      
      // Check for high training load
      if (latestData && latestData.training_load_pct > 85) {
        riskScore += 25;
        factors.push('High training load');
      }
      
      // Check for consecutive high load days
      if (athleteBiometrics.length >= 3) {
        const highLoadDays = athleteBiometrics.slice(-3).filter(d => d.training_load_pct > 80);
        if (highLoadDays.length === 3) {
          riskScore += 20;
          factors.push('Consecutive high load days');
        }
      }
      
      // Normalize risk score to 0-100
      riskScore = Math.min(100, riskScore);
      
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (riskScore > 70) riskLevel = 'high';
      else if (riskScore > 40) riskLevel = 'medium';
      
      console.log(`✅ PredictiveAnalytics: Calculated risk for ${athlete.name}:`, {
        riskScore,
        riskLevel,
        factors: factors.length,
        biometricRecords: athleteBiometrics.length
      });

      return {
        athleteId: athlete.athlete_id,
        name: athlete.name,
        injuryRiskScore: riskScore,
        riskLevel,
        contributingFactors: factors
      };
    });

    console.log('📊 PredictiveAnalytics: Final injury risk data:', relevantAthletes.map(a => ({
      name: a.name,
      riskScore: 'calculated'
    })));

  }, [athletes, biometricData, athleteId]);
  
  // Generate performance forecast data
  const performanceForecast = useMemo<PerformanceForecast[]>(() => {
    const forecast: PerformanceForecast[] = [];
    const today = new Date();
    
    // Generate 14 days of forecast
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // This is a simplified model - in reality this would use ML algorithms
      // For demo purposes, we'll base it on recent biometric data
      const forecastData: PerformanceForecast = {
        date: date.toISOString().split('T')[0],
        predictedReadiness: 0,
        optimalTrainingLoad: 0,
        confidence: 0
      };
      
      if (athleteId) {
        const athleteBiometrics = biometricData.filter(d => d.athlete_id === athleteId);
        if (athleteBiometrics.length > 0) {
          // Calculate based on recent trends
          const recentData = athleteBiometrics.slice(-7);
          const avgReadiness = recentData.reduce((sum, d) => {
            // Simplified readiness calculation
            const hrvScore = d.hrv_night > 50 ? 1 : d.hrv_night > 30 ? 0.5 : 0;
            const rhrScore = d.resting_hr < 60 ? 1 : d.resting_hr < 70 ? 0.5 : 0;
            const sleepScore = d.sleep_duration_h > 7 ? 1 : d.sleep_duration_h > 6 ? 0.5 : 0;
            return sum + (hrvScore + rhrScore + sleepScore) / 3 * 100;
          }, 0) / recentData.length;
          
          // Predicted readiness decreases slightly each day in future
          forecastData.predictedReadiness = Math.max(30, avgReadiness - i * 2);
          
          // Optimal training load based on predicted readiness
          if (forecastData.predictedReadiness > 80) {
            forecastData.optimalTrainingLoad = 85;
          } else if (forecastData.predictedReadiness > 60) {
            forecastData.optimalTrainingLoad = 70;
          } else if (forecastData.predictedReadiness > 40) {
            forecastData.optimalTrainingLoad = 50;
          } else {
            forecastData.optimalTrainingLoad = 30;
          }
          
          // Confidence decreases with forecast horizon
          forecastData.confidence = Math.max(50, 100 - i * 5);
        }
      } else {
        // Team view - calculate average readiness across all athletes
        const allAthleteReadiness: number[] = [];

        if (Array.isArray(athletes)) {
          athletes.forEach(athlete => {
            const athleteBiometrics = biometricData.filter(d => d.athlete_id === athlete.athlete_id);
            if (athleteBiometrics.length > 0) {
              const recentData = athleteBiometrics.slice(-7);
              const avgReadiness = recentData.reduce((sum, d) => {
                // Simplified readiness calculation
                const hrvScore = d.hrv_night > 50 ? 1 : d.hrv_night > 30 ? 0.5 : 0;
                const rhrScore = d.resting_hr < 60 ? 1 : d.resting_hr < 70 ? 0.5 : 0;
                const sleepScore = d.sleep_duration_h > 7 ? 1 : d.sleep_duration_h > 6 ? 0.5 : 0;
                return sum + (hrvScore + rhrScore + sleepScore) / 3 * 100;
              }, 0) / recentData.length;

              allAthleteReadiness.push(avgReadiness);
            }
          });
        }
        
        // Calculate team average readiness
        const teamAvgReadiness = allAthleteReadiness.length > 0 
          ? allAthleteReadiness.reduce((a, b) => a + b, 0) / allAthleteReadiness.length 
          : 70; // Default value if no data
        
        // Predicted readiness decreases slightly each day in future
        forecastData.predictedReadiness = Math.max(30, teamAvgReadiness - i * 2);
        
        // Optimal training load based on predicted readiness
        if (forecastData.predictedReadiness > 80) {
          forecastData.optimalTrainingLoad = 85;
        } else if (forecastData.predictedReadiness > 60) {
          forecastData.optimalTrainingLoad = 70;
        } else if (forecastData.predictedReadiness > 40) {
          forecastData.optimalTrainingLoad = 50;
        } else {
          forecastData.optimalTrainingLoad = 30;
        }
        
        // Confidence decreases with forecast horizon
        forecastData.confidence = Math.max(50, 100 - i * 5);
      }
      
      forecast.push(forecastData);
    }
    
    return forecast;
  }, [athleteId]);

  // Get selected athlete name
  const selectedAthlete = athleteId && Array.isArray(athletes) ? athletes.find(a => a.athlete_id === athleteId) : null;

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="card-enhanced p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {athleteId ? `${selectedAthlete?.name} - Injury Risk Prediction` : 'Team Injury Risk Prediction'}
          </h2>
          <p className="text-gray-600 mb-6">
            Predicting injury likelihood based on historical biometric data
          </p>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading predictive analytics...</p>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {athleteId ? `${selectedAthlete?.name} - Injury Risk Prediction` : 'Team Injury Risk Prediction'}
          </h2>
          <p className="text-gray-600 mb-6">
            Predicting injury likelihood based on historical biometric data
          </p>
          <div className="text-center py-12">
            <p className="text-red-600 mb-2">⚠️ Error loading data</p>
            <p className="text-sm text-gray-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Injury Risk Prediction */}
      <div className="card-enhanced p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {athleteId ? `${selectedAthlete?.name} - Injury Risk Prediction` : 'Team Injury Risk Prediction'}
        </h2>
        <p className="text-gray-600 mb-6">
          Predicting injury likelihood based on historical biometric data
        </p>
        
        {!athleteId ? (
          // Team view
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {injuryRiskData.map((athlete) => (
              <div 
                key={athlete.athleteId} 
                className={`p-5 rounded-lg border-l-4 ${
                  athlete.riskLevel === 'high' 
                    ? 'border-red-500 bg-red-50' 
                    : athlete.riskLevel === 'medium' 
                      ? 'border-yellow-500 bg-yellow-50' 
                      : 'border-green-500 bg-green-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold text-gray-900">{athlete.name}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    athlete.riskLevel === 'high' 
                      ? 'bg-red-100 text-red-800' 
                      : athlete.riskLevel === 'medium' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                  }`}>
                    {athlete.riskLevel.charAt(0).toUpperCase() + athlete.riskLevel.slice(1)} Risk
                  </span>
                </div>
                
                <div className="mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Risk Score</span>
                    <span className="font-bold text-gray-900">{athlete.injuryRiskScore.toFixed(0)}/100</span>
                  </div>
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        athlete.riskLevel === 'high' 
                          ? 'bg-red-500' 
                          : athlete.riskLevel === 'medium' 
                            ? 'bg-yellow-500' 
                            : 'bg-green-500'
                      }`} 
                      style={{ width: `${athlete.injuryRiskScore}%` }}
                    ></div>
                  </div>
                </div>
                
                {athlete.contributingFactors.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-700 mb-1">Contributing Factors:</p>
                    <div className="flex flex-wrap gap-1">
                      {athlete.contributingFactors.map((factor, idx) => (
                        <span 
                          key={idx} 
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {factor}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          // Individual athlete view
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="card-enhanced p-5 text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {injuryRiskData[0]?.injuryRiskScore.toFixed(0) || '0'}
                </div>
                <div className="text-gray-600 mb-2">Injury Risk Score</div>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  injuryRiskData[0]?.riskLevel === 'high' 
                    ? 'bg-red-100 text-red-800' 
                    : injuryRiskData[0]?.riskLevel === 'medium' 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-green-100 text-green-800'
                }`}>
                  {injuryRiskData[0]?.riskLevel.charAt(0).toUpperCase() + (injuryRiskData[0]?.riskLevel.slice(1) || '')} Risk
                </div>
              </div>
              
              <div className="card-enhanced p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Risk Factors</h3>
                <ul className="space-y-2">
                  {injuryRiskData[0]?.contributingFactors.map((factor, idx) => (
                    <li key={idx} className="flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-700">{factor}</span>
                    </li>
                  )) || <li className="text-sm text-gray-500">No significant risk factors identified</li>}
                </ul>
              </div>
              
              <div className="card-enhanced p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Recommendations</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  {injuryRiskData[0]?.riskLevel === 'high' && (
                    <>
                      <li>• Reduce training load by 20-30%</li>
                      <li>• Prioritize recovery modalities</li>
                      <li>• Monitor biometrics daily</li>
                    </>
                  )}
                  {injuryRiskData[0]?.riskLevel === 'medium' && (
                    <>
                      <li>• Maintain current training with attention to form</li>
                      <li>• Add extra recovery session</li>
                      <li>• Monitor for increasing risk factors</li>
                    </>
                  )}
                  {injuryRiskData[0]?.riskLevel === 'low' && (
                    <>
                      <li>• Current training plan is appropriate</li>
                      <li>• Continue monitoring biometrics</li>
                      <li>• Maintain recovery protocols</li>
                    </>
                  )}
                  {!injuryRiskData[0] && (
                    <li className="text-gray-500">No data available for recommendations</li>
                  )}
                </ul>
              </div>
            </div>
            
            {/* Injury Risk Trend */}
            <div className="card-enhanced p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Injury Risk Trend</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={biometricData
                      .filter(d => d.athlete_id === athleteId)
                      .slice(-30)
                      .map((d, i) => ({
                        date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        risk: Math.min(100, 
                          (d.resting_hr > 70 ? 20 : 0) + 
                          (d.sleep_duration_h < 6 ? 15 : 0) + 
                          (d.training_load_pct > 85 ? 25 : 0)
                        ),
                        hrv: d.hrv_night,
                        trainingLoad: d.training_load_pct
                      }))
                    }
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="risk" 
                      name="Injury Risk" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="trainingLoad" 
                      name="Training Load" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Performance Forecasting */}
      <div className="card-enhanced p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {athleteId ? `${selectedAthlete?.name} - Performance Forecasting` : 'Team Performance Forecasting'}
        </h2>
        <p className="text-gray-600 mb-6">
          Predicting optimal training loads based on recovery patterns
        </p>
        
        <div className="h-96">
          {performanceForecast && performanceForecast.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={performanceForecast}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis yAxisId="left" domain={[0, 100]} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'predictedReadiness') return [`${value}%`, 'Predicted Readiness'];
                    if (name === 'optimalTrainingLoad') return [`${value}%`, 'Optimal Training Load'];
                    if (name === 'confidence') return [`${value}%`, 'Confidence'];
                    return [value, name];
                  }}
                  labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
                />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="predictedReadiness" 
                  name="Predicted Readiness" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="optimalTrainingLoad" 
                  name="Optimal Training Load" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="confidence" 
                  name="Prediction Confidence" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  strokeDasharray="2 2"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              No forecast data available
            </div>
          )}
        </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card-enhanced p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Next 3 Days</h3>
            <p className="text-sm text-gray-600">
              {performanceForecast.slice(0, 3).every(d => d.predictedReadiness > 70)
                ? "High readiness expected - optimal for intensive training"
                : performanceForecast.slice(0, 3).every(d => d.predictedReadiness > 50)
                  ? "Moderate readiness - balanced training approach"
                  : "Lower readiness - focus on recovery and technique"}
            </p>
          </div>
          
          <div className="card-enhanced p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Training Load Guidance</h3>
            <p className="text-sm text-gray-600">
              {performanceForecast[0].optimalTrainingLoad > 80
                ? "High training load capacity (80-85%)"
                : performanceForecast[0].optimalTrainingLoad > 60
                  ? "Moderate training load (60-70%)"
                  : "Low training load recommended (30-50%)"}
            </p>
          </div>
          
          <div className="card-enhanced p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Confidence Level</h3>
            <p className="text-sm text-gray-600">
              {performanceForecast[0].confidence > 80
                ? "High confidence in predictions"
                : performanceForecast[0].confidence > 60
                  ? "Moderate confidence - monitor closely"
                  : "Lower confidence - use with caution"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};