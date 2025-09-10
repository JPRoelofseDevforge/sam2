import React, { useState, useEffect, useRef } from 'react';
import {
  generateAlert,
  calculateReadinessScore,
  getGeneticInsights
} from '../utils/analytics';
import { Athlete, BiometricData, GeneticProfile, BodyComposition as BodyCompositionType } from '../types';
import dataService from '../services/dataService';
import { MetricCard } from './MetricCard';
import { AlertCard } from './AlertCard';
import { TrendChart } from './TrendChart';
import ScaleReport from './ScaleReport';
import { ArrowLeft } from 'lucide-react';
import { getTeamAverage } from '../utils/analytics';
import { DigitalTwin3D } from './DigitalTwin';
import { TrainingLoadHeatmap } from './TrainingLoadHeatmap';
import { RecoveryTimeline } from './RecoveryTimeline';
import { Pharmacogenomics } from './Pharmacogenomics';
import { Nutrigenomics } from './Nutrigenomics';
import { RecoveryGenePanel } from './RecoveryGenePanel';
import { PredictiveAnalytics } from './PredictiveAnalytics';
import { SleepMetrics } from './SleepMetrics';
import { StressManagement } from './StressManagement';
import { WeatherImpact } from './WeatherImpact';
import { BloodResults } from './BloodResults';
import { CircadianRhythm } from './CircadianRhythm';
import { HormoneBalanceChart } from './HormoneBalanceChart';
import { HeartRateTrendChart } from './HeartRateTrendChart';
import { SleepMetricsChart } from './SleepMetricsChart';
import { TrainingLoadChart } from './TrainingLoadChart';

interface AthleteProfileProps {
  athleteId: number;
  onBack: () => void;
}

export const AthleteProfile: React.FC<AthleteProfileProps> = ({
    athleteId,
      onBack
    }) => {
      const [activeTab, setActiveTab] = useState<'metrics' | 'trends' | 'insights' | 'digitalTwin' | 'trainingLoad' | 'recoveryTimeline' | 'pharmacogenomics' | 'nutrigenomics' | 'recoveryGenes' | 'predictive' | 'sleep' | 'stress' | 'weather' | 'scaleReport' | 'bloodResults' | 'circadian'>('metrics');
    const tabContentRef = useRef<HTMLDivElement>(null);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null); // For dynamic labels
  
  // State for database data
  const [athlete, setAthlete] = useState<Athlete | undefined>(undefined);
  const [athleteBiometrics, setAthleteBiometrics] = useState<BiometricData[]>([]);
  const [athleteGenetics, setAthleteGenetics] = useState<GeneticProfile[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [allBiometricData, setAllBiometricData] = useState<BiometricData[]>([]);

  // Fetch athlete data from database
  useEffect(() => {
    let isMounted = true;

    const fetchAthleteData = async () => {
      try {
        if (!isMounted) return;

        setDataLoading(true);

        // Fetch individual athlete data
        const data = await dataService.getAthleteData(athleteId, true); // true = use database

        if (!isMounted) return;

        // Set state with the received data
        setAthlete(data.athlete);
        setAthleteBiometrics(data.biometricData || []);
        setAthleteGenetics(data.geneticProfile || []);


        // Also fetch all biometric data for team averages
        const allData = await dataService.getData(true);
        if (!isMounted) return;

        setAllBiometricData(allData.biometricData || []);
      } catch (error) {
        if (!isMounted) return;
        console.error('❌ AthleteProfile: Failed to fetch athlete data:', error);
        // Data service will return empty arrays if database is unavailable
      } finally {
        if (isMounted) {
          setDataLoading(false);
        }
      }
    };

    fetchAthleteData();

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [athleteId]);

  // Show loading state while fetching data
  if (dataLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading athlete data...</p>
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Athlete not found</p>
        <button
          onClick={onBack}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          ← Back to Team Overview
        </button>
      </div>
    );
  }

  const alert = generateAlert(athlete?.athlete_id || '', athleteBiometrics, athleteGenetics);

  // Filter for valid biometric records (those with actual data, not just $ref)
  const validBiometricData = athleteBiometrics.filter(record => {
    const isValid = record &&
                   record.athlete_id &&
                   record.athlete_id !== '' &&
                   record.date &&
                   record.date !== '' &&
                   typeof record.hrv_night === 'number' &&
                   record.hrv_night >= 0 &&
                   typeof record.resting_hr === 'number' &&
                   record.resting_hr >= 0;

    return isValid;
  });

  // Get the most recent valid record
  const latest = validBiometricData.length > 0 ? validBiometricData[validBiometricData.length - 1] : null;
  const readinessScore = latest ? calculateReadinessScore(latest) : 0;
  const geneticInsights = getGeneticInsights(athleteGenetics);


  const geneticArray = Array.isArray(athleteGenetics) ? athleteGenetics : [];
  const geneticDict = geneticArray.reduce((acc, profile) => {
    acc[profile.gene] = profile.genotype;
    return acc;
  }, {} as Record<string, string>);

  // New: Digital Twin Labels (dynamic)
  const labelOptions = [
    { id: 'hrv', label: 'HRV High', color: 'bg-green-500', position: 'chest', description: 'Excellent recovery' },
    { id: 'sleep', label: 'Sleep Low', color: 'bg-red-500', position: 'head', description: 'Need more deep sleep' },
    { id: 'recovery', label: 'Recovering', color: 'bg-yellow-500', position: 'abdomen', description: 'Moderate fatigue' },
    { id: 'training', label: 'Training Load', color: 'bg-blue-500', position: 'shoulder', description: 'High intensity' },
  ];

  const tabs = [
    { id: 'metrics' as const, label: 'Current Metrics', icon: '📊', count: athleteBiometrics.length > 0 ? 9 : 0 },
    { id: 'bloodResults' as const, label: 'Blood Results', icon: '🩸', count: 1 },
    { id: 'circadian' as const, label: 'Circadian Rhythm', icon: '⏰', count: 1 },
    { id: 'trends' as const, label: 'Trends & Analysis', icon: '📈', count: athleteBiometrics.length },
    { id: 'insights' as const, label: 'Predictive Insights', icon: '🧠', count: geneticInsights.length },
    { id: 'scaleReport' as const, label: 'Scale Report', icon: '⚖️', count: 1 },
    { id: 'digitalTwin' as const, label: 'Digital Twin', icon: '🌐', count: 1 },
    { id: 'trainingLoad' as const, label: 'Training Load', icon: '🔥', count: athleteBiometrics.length },
    { id: 'recoveryTimeline' as const, label: 'Recovery Timeline', icon: '📅', count: athleteBiometrics.length },
    { id: 'pharmacogenomics' as const, label: 'Pharmacogenomics', icon: '💊', count: athleteGenetics.length },
    { id: 'nutrigenomics' as const, label: 'Nutrigenomics', icon: '🥗', count: athleteGenetics.length },
    { id: 'recoveryGenes' as const, label: 'Recovery Genes', icon: '🧬', count: athleteGenetics.length },
    { id: 'sleep' as const, label: 'Sleep Metrics', icon: '🌙', count: athleteBiometrics.length },
    { id: 'stress' as const, label: 'Stress Management', icon: '🧘', count: athleteBiometrics.length },
    { id: 'predictive' as const, label: 'Predictive Analytics', icon: '🔮', count: athleteBiometrics.length },
    { id: 'weather' as const, label: 'Weather Impact', icon: '🌤️', count: 1 }
  ];

  // Helper for getting label color class
  const getLabelColorClass = (id: string) => {
    return labelOptions.find(l => l.id === id)?.color || 'bg-purple-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-enhanced p-6">
        <div className="flex items-start justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center text-gray-700 hover:text-gray-900 transition-colors duration-200 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Team Overview
          </button>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-gray-900">{athlete.name}</h1>
            <p className="text-xl text-gray-700 mb-1">{athlete.sport}</p>
            <p className="text-gray-600">Age {athlete.age} | {athlete.team}</p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900">🧬 Genetic Profile</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(geneticDict).slice(0, 10).map(([gene, genotype], index) => (
                <div key={gene} className="text-sm text-gray-700">
                  <strong>{gene}:</strong> {genotype}
                </div>
              ))}
            </div>
            {Object.entries(geneticDict).length > 10 && (
              <div className="text-xs text-gray-500 mt-2">
                Showing top 10 of {Object.entries(geneticDict).length} genes
              </div>
            )}
          </div>
          
          <div className="text-center">
            <div className="text-4xl font-bold mb-2 text-gray-900">{readinessScore.toFixed(0)}%</div>
            <div className="text-gray-600">Readiness Score</div>
            <div className="text-sm text-gray-500 mt-1">
              Based on HRV, RHR, Sleep & SpO₂
            </div>
          </div>
        </div>
      </div>

      {/* Current Alert */}
      <AlertCard alert={alert} />

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-0">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  // Scroll to top of tab content with smooth animation
                  if (tabContentRef.current) {
                    tabContentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className={`flex items-center justify-start sm:justify-center gap-2 px-4 py-3 sm:py-2 text-sm font-medium transition-all duration-200 relative group
                  ${isActive
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                  }`}
              >
                <span className="flex items-center gap-2">
                  <span>{tab.icon}</span>
                  <span className="sm:hidden">{tab.label}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </span>

                {tab.count > 0 && (
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 text-xs font-semibold rounded-full
                      ${isActive 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 group-hover:bg-gray-300'
                      }`}
                  >
                    {tab.count}
                  </span>
                )}

                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div ref={tabContentRef} className="mt-6">
        {activeTab === 'bloodResults' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">🩸 Blood Results</h2>
            <BloodResults athleteId={athleteId} />
            <div className="mt-8">
              <HormoneBalanceChart athleteId={athleteId} />
            </div>
          </div>
        )}

        {activeTab === 'metrics' && latest && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
              <h2 className="text-2xl font-bold text-white">📊 Today's Readiness Metrics</h2>
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
                <span className={`w-2 h-2 rounded-full ${readinessScore > 75 ? 'bg-green-500' : readinessScore > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                {athlete.name.split(' ')[0]} is{' '}
                {readinessScore > 75 ? 'ready' : readinessScore > 50 ? 'recovering' : 'fatigued'}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* HRV */}
              <MetricCard
                title="HRV (Night)"
                value={latest.hrv_night}
                unit="ms"
                icon="❤️"
                subtitle={readinessScore > 75 ? "Excellent recovery" : "Moderate recovery"}
                trend={readinessScore > 75 ? "up" : "down"}
                data={athleteBiometrics.slice(-7).map(d => ({ date: d.date, value: d.hrv_night }))}
                teamAverage={getTeamAverage('hrv_night', athlete?.athlete_id || '', allBiometricData)}
                goalValue={50}
                goalLabel="Target"
              />
              
              {/* Resting HR */}
              <MetricCard
                title="Resting HR"
                value={latest.resting_hr}
                unit="bpm"
                icon="❤️"
                subtitle={latest.resting_hr < 60 ? "Optimal" : latest.resting_hr < 65 ? "Good" : "Elevated"}
                trend={latest.resting_hr < 60 ? "up" : "down"}
                data={athleteBiometrics.slice(-7).map(d => ({ date: d.date, value: d.resting_hr }))}
                teamAverage={getTeamAverage('resting_hr', athlete?.athlete_id || '', allBiometricData)}
                goalValue={60}
                goalLabel="Ideal"
              />
              
              {/* Deep Sleep */}
              <MetricCard
                title="Deep Sleep"
                value={latest.deep_sleep_pct}
                unit="%"
                icon="💤"
                subtitle={latest.deep_sleep_pct > 20 ? "Restorative" : "Low"}
                trend={latest.deep_sleep_pct > 20 ? "up" : "down"}
                data={athleteBiometrics.slice(-7).map(d => ({ date: d.date, value: d.deep_sleep_pct }))}
                teamAverage={getTeamAverage('deep_sleep_pct', athlete?.athlete_id || '', allBiometricData)}
                goalValue={20}
                goalLabel="Min"
              />

              {/* REM Sleep */}
              <MetricCard
                title="REM Sleep"
                value={latest.rem_sleep_pct}
                unit="%"
                icon="🧠"
                subtitle={latest.rem_sleep_pct > 18 ? "Cognitive recovery" : "Below ideal"}
                trend={latest.rem_sleep_pct > 18 ? "up" : "down"}
                data={athleteBiometrics.slice(-7).map(d => ({ date: d.date, value: d.rem_sleep_pct }))}
                teamAverage={getTeamAverage('rem_sleep_pct', athlete?.athlete_id || '', allBiometricData)}
                goalValue={18}
                goalLabel="Target"
              />

              {/* Sleep Duration */}
              <MetricCard
                title="Sleep Duration"
                value={latest.sleep_duration_h}
                unit="h"
                icon="🌙"
                subtitle={latest.sleep_duration_h >= 7 ? "Adequate" : "Short"}
                trend={latest.sleep_duration_h >= 7 ? "up" : "down"}
                data={athleteBiometrics.slice(-7).map(d => ({ date: d.date, value: d.sleep_duration_h }))}
                teamAverage={getTeamAverage('sleep_duration_h', athlete?.athlete_id || '', allBiometricData)}
                goalValue={7}
                goalLabel="Recommended"
              />

              {/* SpO₂ */}
              <MetricCard
                title="SpO₂ (Night)"
                value={latest.spo2_night}
                unit="%"
                icon="🫁"
                subtitle={latest.spo2_night > 96 ? "Normal" : "Monitor"}
                trend={latest.spo2_night > 96 ? "up" : "down"}
                data={athleteBiometrics.slice(-7).map(d => ({ date: d.date, value: d.spo2_night }))}
                teamAverage={getTeamAverage('spo2_night', athlete?.athlete_id || '', allBiometricData)}
                goalValue={96}
                goalLabel="Healthy"
              />

              {/* Respiratory Rate */}
              <MetricCard
                title="Respiratory Rate"
                value={latest.resp_rate_night}
                unit="/min"
                icon="🌬️"
                subtitle={latest.resp_rate_night <= 16 ? "Normal" : "Elevated"}
                trend={latest.resp_rate_night <= 16 ? "up" : "down"}
                data={athleteBiometrics.slice(-7).map(d => ({ date: d.date, value: d.resp_rate_night }))}
                teamAverage={getTeamAverage('resp_rate_night', athlete?.athlete_id || '', allBiometricData)}
                goalValue={16}
                goalLabel="Max"
              />

              {/* Body Temp */}
              <MetricCard
                title="Body Temp"
                value={latest.temp_trend_c}
                unit="°C"
                icon="🌡️"
                subtitle={Math.abs(latest.temp_trend_c - 36.8) < 0.3 ? "Stable" : "Elevated"}
                trend={Math.abs(latest.temp_trend_c - 36.8) < 0.3 ? "up" : "down"}
                data={athleteBiometrics.slice(-7).map(d => ({ date: d.date, value: d.temp_trend_c }))}
                teamAverage={getTeamAverage('temp_trend_c', athlete?.athlete_id || '', allBiometricData)}
                goalValue={36.8}
                goalLabel="Normal"
              />

              {/* Training Load */}
              <MetricCard
                title="Training Load"
                value={latest.training_load_pct}
                unit="%"
                icon="💪"
                subtitle={latest.training_load_pct > 85 ? "High" : "Moderate"}
                trend="neutral"
                data={athleteBiometrics.slice(-7).map(d => ({ date: d.date, value: d.training_load_pct }))}
                teamAverage={getTeamAverage('training_load_pct', athlete?.athlete_id || '', allBiometricData)}
                goalValue={85}
                goalLabel="Optimal"
              />
            </div>

            {/* New Charts Grid */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <HeartRateTrendChart athleteId={athleteId} />
              <SleepMetricsChart athleteId={athleteId} />
              <TrainingLoadChart athleteId={athleteId} />
            </div>

            {/* Summary Banner */}
            <div className="mt-8 card-enhanced p-5">
              <h3 className="font-semibold text-gray-900 mb-2">📋 Readiness Summary</h3>
              <p className="text-gray-700 text-sm">
                {readinessScore > 75
                  ? `${athlete.name.split(' ')[0]} shows strong recovery markers. Ready for high-intensity training.`
                  : readinessScore > 50
                  ? `Recovery is moderate. Consider active recovery or technique work.`
                  : `Fatigue detected. Prioritize sleep, hydration, and low-intensity sessions.`}
              </p>
            </div>
          </div>
        )}


        {activeTab === 'circadian' && (
          <CircadianRhythm
            biometricData={athleteBiometrics}
            geneticData={athleteGenetics}
            athleteId={athlete?.athlete_id || ''}
          />
        )}

        {activeTab === 'trends' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Performance Trends</h2>
            {athleteBiometrics.length >= 2 ? (
              <TrendChart data={athleteBiometrics} />
            ) : (
              <div className="text-center py-12 card-enhanced rounded-xl">
                <p className="text-gray-600 mb-2">📊 Insufficient data for trend analysis</p>
                <p className="text-sm text-gray-500">
                  Need at least 2 days of data. Current data points: {athleteBiometrics.length}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-8 text-gray-900">
            <h2 className="text-2xl font-bold mb-2 text-white">🧠 AI-Powered Recovery Insights</h2>
            <p className="text-white mb-6 text-sm">
              Personalized analysis based on biometrics, genetics, and performance trends
            </p>

            {/* Current Status Analysis */}
            <section className="card-enhanced p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="bg-purple-100 p-1.5 rounded-full text-purple-700 text-lg">🔍</span>
                Current Status Analysis
              </h3>
              <AlertCard alert={alert} />
            </section>

            {/* Genetic Insights */}
            <section>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="bg-green-100 p-1.5 rounded-full text-green-700 text-lg">🧬</span>
                <span className="text-white">Genotype-Specific Recommendations</span>
              </h3>

              {geneticInsights.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {geneticInsights.map((insight, index) => (
                    <div
                      key={index}
                      className="card-enhanced p-5"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="text-lg font-bold text-blue-700">{insight.gene}</h4>
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-medium">
                          Insight
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-700">
                          <strong className="text-blue-600">Trait:</strong> {insight.trait}
                        </p>
                        <p className="text-gray-600 leading-relaxed">
                          <strong className="text-blue-600">Strategy:</strong> {insight.recommendation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card-enhanced rounded-xl p-8 text-center">
                  <div className="text-4xl mb-3">🧬</div>
                  <p className="text-gray-700 font-medium">Genetic Insights Unavailable</p>
                  <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                    Genetic testing unlocks personalized training, recovery, and nutrition strategies.
                    <br />
                    <button className="text-blue-600 hover:text-blue-700 text-sm mt-1 underline">
                      Request Test →
                    </button>
                  </p>
                </div>
              )}
            </section>

          
            {/* Performance Forecast */}
            {athleteBiometrics.length >= 3 && latest && (
              <section className="card-enhanced p-6">
                <h3 className="text-xl font-semibold mb-5 flex items-center gap-2">
                  <span className="bg-indigo-100 p-1.5 rounded-full text-indigo-700 text-lg">🔮</span>
                  Performance Readiness Forecast
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Trend Indicators */}
                  <div className="card-enhanced p-5">
                    <h4 className="font-semibold text-blue-700 mb-4 flex items-center gap-2">
                      📈 Recent Trends
                    </h4>
                    <div className="space-y-3 text-sm">
                      {[
                        { label: 'HRV', value: latest.hrv_night, unit: 'ms', ideal: '↑', desc: 'Recovery capacity' },
                        { label: 'Resting HR', value: latest.resting_hr, unit: 'bpm', ideal: '↓', desc: 'Cardiac stress' },
                        { label: 'Sleep Duration', value: latest.sleep_duration_h, unit: 'h', ideal: '↑', desc: 'Recovery quality' },
                      ].map((item) => {
                        const isGood = item.ideal === '↑' 
                          ? (item.value > (item.label === 'HRV' ? 50 : 7)) 
                          : (item.value < (item.label === 'Resting HR' ? 65 : 0));
                        return (
                          <div
                            key={item.label}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <div>
                              <div className="font-medium text-gray-700">{item.label}</div>
                              <div className="text-xs text-gray-500">{item.desc}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-gray-900">
                                {item.value.toFixed(1)} {item.unit}
                              </div>
                              <div className={`text-xs font-medium ${isGood ? 'text-green-600' : 'text-red-600'}`}>
                                {item.ideal} {isGood ? 'Optimal' : 'Needs work'}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Readiness Score */}
                  <div className="card-enhanced p-5 text-center">
                    <h4 className="font-semibold text-blue-700 mb-3">📊 Today's Readiness Score</h4>
                    <div
                      className={`text-5xl font-extrabold mb-2 transition-all duration-300 ${
                        readinessScore > 75
                          ? 'text-green-600 drop-shadow-sm'
                          : readinessScore > 50
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {readinessScore > 75 ? '🟢' : readinessScore > 50 ? '🟡' : '🔴'}{' '}
                      {readinessScore.toFixed(0)}%
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Based on HRV, RHR, Sleep & SpO₂</p>

                    {/* Micro-Recommendation */}
                    <div className="bg-gray-100 rounded-lg p-3 text-xs border border-gray-200">
                      <strong>Suggestion:</strong>{' '}
                      {readinessScore > 75
                        ? 'Optimize with high-intensity training'
                        : readinessScore > 50
                        ? 'Focus on active recovery & technique'
                        : 'Prioritize sleep, hydration, and rest'}
                    </div>
                  </div>
                </div>

                {/* AI Coach Recommendation */}
                <div className="mt-6 card-enhanced p-5">
                  <h4 className="font-semibold text-amber-700 mb-2 flex items-center gap-2">
                    🤖 AI Coach Recommendation
                  </h4>
                  <p className="text-amber-600 text-sm leading-relaxed">
                    {readinessScore > 75
                      ? `Schedule high-load sessions today. ${athlete.name.split(' ')[0]} is in peak recovery.`
                      : readinessScore > 50
                      ? `Schedule moderate load or skill work. Monitor biometrics tomorrow.`
                      : `Prescribe full rest or active recovery. Consider adjusting sleep or nutrition.`}
                  </p>
                </div>
              </section>
            )}

            {/* Recovery Tip of the Day */}
            <section className="card-enhanced p-5">
              <h4 className="font-semibold text-rose-700 mb-2 flex items-center gap-2">
                💡 Recovery Tip of the Day
              </h4>
              <p className="text-rose-600 text-sm leading-relaxed">
                {[
                  'Hydration impacts HRV. Aim for 35ml/kg body weight daily.',
                  'Blue light after 9 PM suppresses melatonin. Use night mode.',
                  'Cold exposure post-training can delay muscle recovery in ACTN3 XX carriers.',
                  'Magnesium glycinate may improve deep sleep in PER3 long genotype athletes.',
                  'Morning sunlight resets circadian rhythm — get 10 mins upon waking.',
                  'Omega-3s may enhance recovery in BDNF Met carriers.',
                  'Caffeine clearance is slower in evening types (PER3 long) — avoid after 2 PM.',
                ][(athlete?.athlete_id || '').charCodeAt((athlete?.athlete_id || '').length - 1) % 7]}
              </p>
            </section>
          </div>
        )}


        {activeTab === 'scaleReport' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">⚖️ Scale Report</h2>
            <ScaleReport athleteId={athlete?.athlete_id || ''} />
          </div>
        )}

        {activeTab === 'digitalTwin' && (
          <DigitalTwin3D athleteId={athlete?.athlete_id || ''} />
        )}


        {activeTab === 'trainingLoad' && (
          <TrainingLoadHeatmap />
        )}

        {activeTab === 'recoveryTimeline' && (
          <RecoveryTimeline athleteId={athlete?.athlete_id || ''} />
        )}

        {activeTab === 'pharmacogenomics' && (
          <Pharmacogenomics athleteId={athlete?.athlete_id || ''} />
        )}

        {activeTab === 'nutrigenomics' && (
          <Nutrigenomics athleteId={athlete?.athlete_id || ''} />
        )}

        {activeTab === 'recoveryGenes' && (
          <RecoveryGenePanel athleteId={athlete?.athlete_id || ''} />
        )}

        {activeTab === 'predictive' && (
                <PredictiveAnalytics athleteId={athlete?.athlete_id || ''} />
              )}

              {activeTab === 'sleep' && (
                <SleepMetrics
                  biometricData={athleteBiometrics}
                  athleteId={athlete?.athlete_id || ''}
                />
              )}

              {activeTab === 'stress' && (
                <StressManagement
                  athleteId={athlete?.athlete_id || ''}
                  biometricData={athleteBiometrics}
                />
              )}

              {activeTab === 'weather' && (
                <WeatherImpact
                  athleteId={athlete?.athlete_id || ''}
                  geneticData={athleteGenetics}
                />
              )}

      </div>
    </div>
  );
};
