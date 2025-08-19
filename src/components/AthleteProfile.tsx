import React, { useState, useEffect, useRef } from 'react';
import { 
  athletes, 
  biometricData, 
  geneticProfiles, 
  bodyCompositionData 
} from '../data/mockData';
import { 
  generateAlert, 
  calculateReadinessScore, 
  getGeneticInsights 
} from '../utils/analytics';
import { MetricCard } from './MetricCard';
import { AlertCard } from './AlertCard';
import { TrendChart } from './TrendChart';
import { BodyComposition } from './BodyComposition';
import { ArrowLeft } from 'lucide-react';
import { getTeamAverage } from '../utils/analytics';
import { DigitalTwin3D } from './DigitalTwin';
import { TeamComparisonDashboard } from './TeamComparisonDashboard';
import { TrainingLoadHeatmap } from './TrainingLoadHeatmap';
import { RecoveryTimeline } from './RecoveryTimeline';
import { Pharmacogenomics } from './Pharmacogenomics';
import { Nutrigenomics } from './Nutrigenomics';
import { RecoveryGenePanel } from './RecoveryGenePanel';
import { PredictiveAnalytics } from './PredictiveAnalytics';
import { SleepMetrics } from './SleepMetrics';
import { StressManagement } from './StressManagement';

interface AthleteProfileProps {
  athleteId: string;
  onBack: () => void;
}

export const AthleteProfile: React.FC<AthleteProfileProps> = ({
    athleteId,
      onBack
    }) => {
      const [activeTab, setActiveTab] = useState<'metrics' | 'trends' | 'insights' | 'body' | 'digitalTwin' | 'teamCompare' | 'trainingLoad' | 'recoveryTimeline' | 'pharmacogenomics' | 'nutrigenomics' | 'recoveryGenes' | 'predictive' | 'sleep' | 'stress' | 'weather'>('metrics');
    const tabContentRef = useRef<HTMLDivElement>(null);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null); // For dynamic labels

  const athlete = athletes.find(a => a.athlete_id === athleteId);
  const athleteBiometrics = biometricData.filter(d => d.athlete_id === athleteId);
  const athleteGenetics = geneticProfiles.filter(g => g.athlete_id === athleteId);
  const athleteBodyComp = bodyCompositionData.find(b => b.athlete_id === athleteId);
  const athleteBodyCompHistory = bodyCompositionData
    .filter(b => b.athlete_id === athleteId && b.date)
    .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());

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

  const alert = generateAlert(athleteId, athleteBiometrics, athleteGenetics);
  const latest = athleteBiometrics[athleteBiometrics.length - 1];
  const readinessScore = latest ? calculateReadinessScore(latest) : 0;
  const geneticInsights = getGeneticInsights(athleteGenetics);

  const geneticDict = athleteGenetics.reduce((acc, profile) => {
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
      { id: 'metrics' as const, label: 'Current Metrics', icon: '📊', count: latest ? 9 : 0 },
      { id: 'trends' as const, label: 'Trends & Analysis', icon: '📈', count: athleteBiometrics.length },
      { id: 'insights' as const, label: 'Predictive Insights', icon: '🧠', count: geneticInsights.length },
      { id: 'body' as const, label: 'Body Composition', icon: '⚖️', count: athleteBodyComp ? 1 : 0 },
      { id: 'digitalTwin' as const, label: 'Digital Twin', icon: '🌐', count: 1 },
      { id: 'teamCompare' as const, label: 'Team Compare', icon: '👥', count: 0 },
      { id: 'trainingLoad' as const, label: 'Training Load', icon: '🔥', count: 0 },
      { id: 'recoveryTimeline' as const, label: 'Recovery Timeline', icon: '📅', count: 0 },
      { id: 'pharmacogenomics' as const, label: 'Pharmacogenomics', icon: '💊', count: 0 },
      { id: 'nutrigenomics' as const, label: 'Nutrigenomics', icon: '🥗', count: 0 },
      { id: 'recoveryGenes' as const, label: 'Recovery Genes', icon: '🧬', count: 0 },
      { id: 'sleep' as const, label: 'Sleep Metrics', icon: '🌙', count: 0 },
      { id: 'stress' as const, label: 'Stress Management', icon: '🧘', count: 0 },
      { id: 'predictive' as const, label: 'Predictive Analytics', icon: '🔮', count: 0 },
      { id: 'weather' as const, label: 'Weather Impact', icon: '🌤️', count: 0 }
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
                teamAverage={getTeamAverage('hrv_night', athleteId, biometricData)}
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
                teamAverage={getTeamAverage('resting_hr', athleteId, biometricData)}
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
                teamAverage={getTeamAverage('deep_sleep_pct', athleteId, biometricData)}
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
                teamAverage={getTeamAverage('rem_sleep_pct', athleteId, biometricData)}
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
                teamAverage={getTeamAverage('sleep_duration_h', athleteId, biometricData)}
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
                teamAverage={getTeamAverage('spo2_night', athleteId, biometricData)}
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
                teamAverage={getTeamAverage('resp_rate_night', athleteId, biometricData)}
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
                teamAverage={getTeamAverage('temp_trend_c', athleteId, biometricData)}
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
                teamAverage={getTeamAverage('training_load_pct', athleteId, biometricData)}
                goalValue={85}
                goalLabel="Optimal"
              />
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

            {/* Nutrition & Genetics Interactions */}
            <section>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="bg-amber-100 p-1.5 rounded-full text-amber-700 text-lg">🥗</span>
                <span className="text-white">Nutrition & Genetics Interactions</span>
              </h3>

              <div className="space-y-4">
                {athleteGenetics.map((g, i) => {
                  const tipMap: Record<string, { trait: string; tip: string }> = {
                    ACTN3: {
                      trait: 'Power vs Endurance',
                      tip: g.genotype === 'RR'
                        ? 'High-protein and creatine supplementation may enhance power output.'
                        : g.genotype === 'XX'
                        ? 'Higher fat oxidation — consider moderate-fat, endurance-focused diet with antioxidant-rich foods.'
                        : 'Hybrid profile — balance protein and complex carbs for mixed training.',
                    },
                    PPARGC1A: {
                      trait: 'Mitochondrial Biogenesis',
                      tip: g.genotype.includes('Ser')
                        ? 'May benefit from polyphenol-rich foods (green tea, berries) to support mitochondrial function.'
                        : 'Responds well to omega-3s and aerobic training for metabolic efficiency.',
                    },
                    BDNF: {
                      trait: 'Neuroplasticity & Recovery',
                      tip: g.genotype === 'Met/Met' || g.genotype === 'Val/Met'
                        ? 'Increase omega-3 (DHA) and curcumin to support brain-derived neurotrophic factor.'
                        : 'Naturally high BDNF — maintain with sleep and resistance training.',
                    },
                    ADRB2: {
                      trait: 'Fat Metabolism',
                      tip: g.genotype === 'Arg16Arg'
                        ? 'Better fat mobilization — time fats around training; avoid excess pre-sleep.'
                        : g.genotype === 'Gly16Gly'
                        ? 'Reduced lipolysis — prioritize carb availability for high-intensity work.'
                        : 'Mixed response — use periodized nutrition (low-fat on recovery days).',
                    },
                    PER3: {
                      trait: 'Chronotype & Sleep',
                      tip: g.genotype === 'long'
                        ? 'Morning type — consume protein-rich breakfast; avoid late carbs.'
                        : 'Evening type — use magnesium and tart cherry juice to support sleep onset.',
                    },
                    CLOCK: {
                      trait: 'Circadian Rhythm',
                      tip: g.genotype === 'AA'
                        ? 'Strong circadian drive — eat meals at consistent times; avoid snacks after 8 PM.'
                        : 'Irregular rhythm — use morning light and time-restricted eating (10-hour window).',
                    },
                  };

                  const content = tipMap[g.gene];
                  if (!content) return null;

                  return (
                    <div
                      key={i}
                      className="card-enhanced p-5"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-amber-700">{g.gene}</h4>
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                          Nutrition
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm">
                        <strong className="text-amber-600">Trait:</strong> {content.trait}
                      </p>
                      <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                        <strong className="text-amber-600">Nutrition Tip:</strong> {content.tip}
                      </p>
                    </div>
                  );
                })}
              </div>

              {athleteGenetics.length === 0 && (
                <div className="card-enhanced rounded-xl p-6 text-center">
                  <p className="text-gray-700">🧬 No genetic data available for nutrition insights</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Unlock personalized nutrition strategies with genetic testing.
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
                ][athleteId.charCodeAt(athleteId.length - 1) % 7]}
              </p>
            </section>
          </div>
        )}

        {activeTab === 'body' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">⚖️ Body Composition Analysis</h2>
            {athleteBodyComp ? (
              <BodyComposition 
                data={athleteBodyComp} 
                history={athleteBodyCompHistory} 
                geneticData={athleteGenetics} 
              />
            ) : (
              <div className="text-center py-12 card-enhanced rounded-xl">
                <p className="text-gray-600 mb-2">⚖️ No body composition data available</p>
                <p className="text-sm text-gray-500">
                  Please ensure body composition measurements are recorded
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'digitalTwin' && (
          <DigitalTwin3D athleteId={athleteId} />
        )}
        
        {activeTab === 'teamCompare' && (
          <TeamComparisonDashboard />
        )}
        
        {activeTab === 'trainingLoad' && (
          <TrainingLoadHeatmap />
        )}
        
        {activeTab === 'recoveryTimeline' && (
          <RecoveryTimeline />
        )}
        
        {activeTab === 'pharmacogenomics' && (
          <Pharmacogenomics athleteId={athleteId} />
        )}
        
        {activeTab === 'nutrigenomics' && (
          <Nutrigenomics athleteId={athleteId} />
        )}
        
        {activeTab === 'recoveryGenes' && (
          <RecoveryGenePanel athleteId={athleteId} />
        )}
        
        {activeTab === 'predictive' && (
                <PredictiveAnalytics athleteId={athleteId} />
              )}
        
              {activeTab === 'sleep' && (
                <SleepMetrics
                  biometricData={athleteBiometrics}
                  athleteId={athleteId}
                />
              )}
              
              {activeTab === 'stress' && (
                <StressManagement
                  athleteId={athleteId}
                  biometricData={athleteBiometrics}
                />
              )}
              
              {activeTab === 'weather' && (
                <WeatherImpact
                  athleteId={athleteId}
                  geneticData={athleteGenetics}
                />
              )}
      </div>
    </div>
  );
};

// Weather Impact Component
const WeatherImpact: React.FC<{ athleteId: string; geneticData: any[] }> = ({ athleteId, geneticData }) => {
  const [airQuality, setAirQuality] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔧 CONFIG: Replace with your actual location and IQAir API key
  const IQAIR_API_KEY = import.meta.env.VITE_IQAIR_API_KEY || 'f8e6fb6c-6ec0-4064-a46b-a173e4137718';
  const CITY = import.meta.env.VITE_CITY || 'Pretoria';
  const STATE = import.meta.env.VITE_STATE || 'Gauteng';
  const COUNTRY = import.meta.env.VITE_COUNTRY || 'South Africa';

  // Fetch Air Quality from IQAir
  useEffect(() => {
    const fetchAirQuality = async () => {
      try {
        setLoading(true);
        const url = new URL('https://api.airvisual.com/v2/city');
        url.searchParams.append('city', CITY);
        url.searchParams.append('state', STATE);
        url.searchParams.append('country', COUNTRY);
        url.searchParams.append('key', IQAIR_API_KEY);

        const res = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
        const json = await res.json();
        const current = json.data.current;

        setAirQuality({
          temperature: current.weather.tp,
          humidity: current.weather.hu,
          aqi: current.pollution.aqius,
          co: current.pollution.co,
          pm25: current.pollution.pm25,
          pm10: current.pollution.pm10,
          windSpeed: current.weather.ws,
          pressure: current.weather.pr,
          weatherCondition: current.weather.ic,
          lastUpdated: new Date().toLocaleTimeString(),
        });
        setError(null);
      } catch (err: any) {
        console.error('AirQuality API Error:', err);
        setError(err.message || 'Failed to load air quality');
      } finally {
        setLoading(false);
      }
    };

    fetchAirQuality();
    const interval = setInterval(fetchAirQuality, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const getWeatherIcon = (condition: string | undefined) => {
    if (!condition) return '☁️';
    switch (condition) {
      case '01d': return '☀️'; // clear sky
      case '01n': return '🌙'; // clear sky (night)
      case '02d': return '⛅'; // few clouds
      case '02n': return '☁️'; // few clouds (night)
      case '03d':
      case '03n': return '☁️'; // scattered clouds
      case '04d':
      case '04n': return '☁️'; // broken clouds
      case '09d':
      case '09n': return '🌧️'; // shower rain
      case '10d':
      case '10n': return '🌧️'; // rain
      case '11d':
      case '11n': return '⛈️'; // thunderstorm
      case '13d':
      case '13n': return '❄️'; // snow
      case '50d':
      case '50n': return '🌫️'; // mist
      default: return '☁️';
    }
  };

  const getWeatherDescription = (condition: string | undefined) => {
    if (!condition) return 'Unknown';
    switch (condition) {
      case '01d':
      case '01n': return 'Clear';
      case '02d':
      case '02n': return 'Few Clouds';
      case '03d':
      case '03n': return 'Scattered Clouds';
      case '04d':
      case '04n': return 'Broken Clouds';
      case '09d':
      case '09n': return 'Shower Rain';
      case '10d':
      case '10n': return 'Rain';
      case '11d':
      case '11n': return 'Thunderstorm';
      case '13d':
      case '13n': return 'Snow';
      case '50d':
      case '50n': return 'Mist';
      default: return 'Cloudy';
    }
  };

  const getWeatherImpact = (temperature: number | undefined, humidity: number | undefined, windSpeed: number | undefined, geneticData: any[]) => {
    const impacts = [];
    
    // Check for genetic factors that affect heat tolerance
    const actn3Genotype = geneticData.find(g => g.gene === 'ACTN3')?.genotype;
    const adrb2Genotype = geneticData.find(g => g.gene === 'ADRB2')?.genotype;
    
    if (temperature && temperature > 30) {
      if (actn3Genotype === 'XX') {
        impacts.push("Heat stress risk - ACTN3 XX genotype has reduced heat tolerance");
      } else {
        impacts.push("Heat stress risk");
      }
    }
    
    if (temperature && temperature < 5) {
      impacts.push("Cold stress risk");
    }
    
    if (humidity && humidity > 80) {
      if (adrb2Genotype === 'Gly16Gly') {
        impacts.push("High humidity impact - ADRB2 Gly16Gly genotype affects sweat response");
      } else {
        impacts.push("High humidity impact");
      }
    }
    
    if (windSpeed && windSpeed > 10) {
      impacts.push("High wind resistance");
    }
    
    return impacts.length > 0 ? impacts : ["Optimal conditions"];
  };

  const getWeatherRecommendations = (temperature: number | undefined, humidity: number | undefined, windSpeed: number | undefined, geneticData: any[]) => {
    const recommendations = [];
    
    // Check for genetic factors that affect heat tolerance
    const actn3Genotype = geneticData.find(g => g.gene === 'ACTN3')?.genotype;
    const adrb2Genotype = geneticData.find(g => g.gene === 'ADRB2')?.genotype;
    const cftrGenotype = geneticData.find(g => g.gene === 'CFTR')?.genotype;
    
    if (temperature && temperature > 30) {
      if (actn3Genotype === 'XX') {
        recommendations.push("Extended cooling protocols - ACTN3 XX genotype has reduced heat tolerance");
      }
      recommendations.push("Increase hydration, consider electrolyte supplementation");
    }
    
    if (temperature && temperature < 5) {
      recommendations.push("Extended warm-up, layer clothing appropriately");
    }
    
    if (humidity && humidity > 80) {
      if (adrb2Genotype === 'Gly16Gly') {
        recommendations.push("Monitor hydration closely - ADRB2 Gly16Gly genotype affects sweat response");
      } else {
        recommendations.push("Monitor hydration closely, expect reduced evaporative cooling");
      }
    }
    
    if (windSpeed && windSpeed > 10) {
      recommendations.push("Adjust pacing strategy, expect increased energy expenditure");
    }
    
    if (cftrGenotype && cftrGenotype.includes('del') && (temperature && temperature > 25)) {
      recommendations.push("Monitor for dehydration - CFTR mutations affect sweat composition");
    }
    
    if (temperature && temperature >= 20 && temperature <= 25) {
      recommendations.push("Optimal performance conditions");
    }
    
    return recommendations.length > 0 ? recommendations : ["Standard training protocols apply"];
  };

  const getWeatherAlert = (temperature: number | undefined, humidity: number | undefined, windSpeed: number | undefined, aqi: number | undefined) => {
    if (aqi && aqi > 150) return { type: 'high', message: 'Poor air quality - increased respiratory stress risk' };
    if (temperature && temperature > 35) return { type: 'high', message: 'Extreme heat - heat illness risk' };
    if (temperature && temperature < 0) return { type: 'high', message: 'Extreme cold - hypothermia risk' };
    if (windSpeed && windSpeed > 15) return { type: 'medium', message: 'Strong winds - increased injury risk' };
    if (humidity && humidity > 90) return { type: 'medium', message: 'Very high humidity - heat dissipation impaired' };
    if (aqi && aqi > 100) return { type: 'medium', message: 'Moderate air quality - some respiratory sensitivity' };
    return { type: 'low', message: 'Weather conditions are favorable for training' };
  };

  if (loading) return <div className="text-center py-12">Loading weather data...</div>;
  if (error) return <div className="text-center py-12 text-red-600">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">🌤️ Weather Impact Analysis</h2>
      
      <div className="card-enhanced p-6">
        <h3 className="text-xl font-semibold mb-4">Current Conditions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl mb-2">{getWeatherIcon(airQuality?.weatherCondition)}</div>
            <div className="text-lg font-semibold">{getWeatherDescription(airQuality?.weatherCondition)}</div>
            <div className="text-gray-600">Condition</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl mb-2">🌡️</div>
            <div className="text-lg font-semibold">{airQuality?.temperature}°C</div>
            <div className="text-gray-600">Temperature</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl mb-2">💧</div>
            <div className="text-lg font-semibold">{airQuality?.humidity}%</div>
            <div className="text-gray-600">Humidity</div>
          </div>
        </div>
      </div>
      
      <div className="card-enhanced p-6">
        <h3 className="text-xl font-semibold mb-4">Weather Alert</h3>
        <div className={`p-4 rounded-lg text-center ${
          getWeatherAlert(airQuality?.temperature, airQuality?.humidity, airQuality?.windSpeed, airQuality?.aqi).type === 'high'
            ? 'bg-red-100 text-red-800'
            : getWeatherAlert(airQuality?.temperature, airQuality?.humidity, airQuality?.windSpeed, airQuality?.aqi).type === 'medium'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-green-100 text-green-800'
        }`}>
          {getWeatherAlert(airQuality?.temperature, airQuality?.humidity, airQuality?.windSpeed, airQuality?.aqi).message}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-enhanced p-6">
          <h3 className="text-xl font-semibold mb-4">Potential Impacts</h3>
          <ul className="space-y-2">
            {getWeatherImpact(airQuality?.temperature, airQuality?.humidity, airQuality?.windSpeed, geneticData).map((impact, index) => (
              <li key={index} className="flex items-start">
                <span className="text-yellow-500 mr-2">⚠️</span>
                <span>{impact}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="card-enhanced p-6">
          <h3 className="text-xl font-semibold mb-4">Recommendations</h3>
          <ul className="space-y-2">
            {getWeatherRecommendations(airQuality?.temperature, airQuality?.humidity, airQuality?.windSpeed, geneticData).map((rec, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-500 mr-2">💡</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="card-enhanced p-6">
        <h3 className="text-xl font-semibold mb-4">Genetic Considerations</h3>
        <div className="text-sm text-gray-700">
          <p className="mb-2">
            Your genetic profile affects how weather conditions impact your performance and recovery:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>ACTN3 XX genotype: Reduced power output in heat</li>
            <li>ADRB2 Gly16Gly genotype: Altered sweat response in humidity</li>
            <li>CFTR mutations: Increased dehydration risk in heat</li>
          </ul>
        </div>
      </div>
    </div>
  );
};