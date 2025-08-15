import React, { useState } from 'react';
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


interface AthleteProfileProps {
  athleteId: string;
  onBack: () => void;
}

export const AthleteProfile: React.FC<AthleteProfileProps> = ({ 
  athleteId, 
  onBack 
}) => {
  const [activeTab, setActiveTab] = useState<'metrics' | 'trends' | 'insights' | 'body'>('metrics');

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

  const tabs = [
    { id: 'metrics' as const, label: '📊 Current Metrics', count: latest ? 9 : 0 },
    { id: 'trends' as const, label: '📈 Trends & Analysis', count: athleteBiometrics.length },
    { id: 'insights' as const, label: '🧠 Predictive Insights', count: geneticInsights.length },
    { id: 'body' as const, label: '⚖️ Body Composition', count: athleteBodyComp ? 1 : 0 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center text-white hover:text-gray-200 transition-colors duration-200 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Team Overview
          </button>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{athlete.name}</h1>
            <p className="text-xl text-blue-100 mb-1">{athlete.sport}</p>
            <p className="text-blue-200">Age {athlete.age} | {athlete.team}</p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">🧬 Genetic Profile</h3>
            {Object.entries(geneticDict).map(([gene, genotype]) => (
              <div key={gene} className="text-sm text-blue-100">
                <strong>{gene}:</strong> {genotype}
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">{readinessScore.toFixed(0)}%</div>
            <div className="text-blue-200">Readiness Score</div>
            <div className="text-sm text-blue-300 mt-1">
              Based on HRV, RHR, Sleep & SpO₂
            </div>
          </div>
        </div>
      </div>

      {/* Current Alert */}
      <AlertCard alert={alert} />

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">

          {activeTab === 'metrics' && latest && (
  <div>
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
      <h2 className="text-2xl font-bold text-gray-900">📊 Today's Readiness Metrics</h2>
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
        icon="💓"
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
    <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
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
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Performance Trends</h2>
            
            {athleteBiometrics.length >= 2 ? (
                
              <TrendChart data={athleteBiometrics} />
              
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <p className="text-gray-600 mb-2">📊 Insufficient data for trend analysis</p>
                <p className="text-sm text-gray-500">
                  Need at least 2 days of data. Current data points: {athleteBiometrics.length}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'insights' && (
  <div className="space-y-8 text-gray-100">
    <h2 className="text-2xl font-bold mb-2">🧠 AI-Powered Recovery Insights</h2>
    <p className="text-gray-400 mb-6 text-sm">
      Personalized analysis based on biometrics, genetics, and performance trends
    </p>

    {/* Current Status Analysis */}
    <section className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 backdrop-blur-sm rounded-xl p-6 border border-purple-700/50">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span className="bg-purple-800/70 p-1.5 rounded-full text-purple-200 text-lg">🔍</span>
        Current Status Analysis
      </h3>
      <AlertCard alert={alert} darkMode />
    </section>

    {/* Genetic Insights */}
    <section>
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span className="bg-green-800/70 p-1.5 rounded-full text-green-200 text-lg">🧬</span>
        Genotype-Specific Recommendations
      </h3>

      {geneticInsights.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {geneticInsights.map((insight, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-gray-800/60 to-gray-900/50 border border-gray-600 rounded-xl p-5 hover:border-blue-500/60 transition-colors duration-300"
            >
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-lg font-bold text-blue-300">{insight.gene}</h4>
                <span className="text-xs bg-gray-700 text-gray-200 px-2 py-1 rounded-full font-medium">
                  {insight.category}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-gray-300">
                  <strong className="text-blue-200">Trait:</strong> {insight.trait}
                </p>
                <p className="text-gray-400 leading-relaxed">
                  <strong className="text-blue-200">Strategy:</strong> {insight.recommendation}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-800/50 rounded-xl p-8 text-center border border-dashed border-gray-600">
          <div className="text-4xl mb-3">🧬</div>
          <p className="text-gray-200 font-medium">Genetic Insights Unavailable</p>
          <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">
            Genetic testing unlocks personalized training, recovery, and nutrition strategies.
            <br />
            <button className="text-blue-400 hover:text-blue-300 text-sm mt-1 underline">
              Request Test →
            </button>
          </p>
        </div>
      )}
    </section>

    {/* Nutrition & Genetics Interactions */}
    <section>
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span className="bg-amber-800/70 p-1.5 rounded-full text-amber-200 text-lg">🥗</span>
        Nutrition & Genetics Interactions
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
              className="bg-gradient-to-r from-gray-800/50 to-gray-900/40 border border-gray-600 rounded-xl p-5"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-amber-300">{g.gene}</h4>
                <span className="text-xs bg-gray-700 text-gray-200 px-2 py-1 rounded-full">
                  Nutrition
                </span>
              </div>
              <p className="text-gray-300 text-sm">
                <strong className="text-amber-200">Trait:</strong> {content.trait}
              </p>
              <p className="text-gray-400 text-sm mt-1 leading-relaxed">
                <strong className="text-amber-200">Nutrition Tip:</strong> {content.tip}
              </p>
            </div>
          );
        })}
      </div>

      {athleteGenetics.length === 0 && (
        <div className="bg-gray-800/50 rounded-xl p-6 text-center border border-dashed border-gray-600">
          <p className="text-gray-300">🧬 No genetic data available for nutrition insights</p>
          <p className="text-sm text-gray-500 mt-2">
            Unlock personalized nutrition strategies with genetic testing.
          </p>
        </div>
      )}
    </section>

    {/* Performance Forecast */}
    {athleteBiometrics.length >= 3 && latest && (
      <section className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 backdrop-blur-sm rounded-xl p-6 border border-indigo-700/50">
        <h3 className="text-xl font-semibold mb-5 flex items-center gap-2">
          <span className="bg-indigo-800/70 p-1.5 rounded-full text-indigo-200 text-lg">🔮</span>
          Performance Readiness Forecast
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Trend Indicators */}
          <div className="bg-gray-800/60 rounded-xl p-5 border border-gray-600">
            <h4 className="font-semibold text-blue-300 mb-4 flex items-center gap-2">
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
                    className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg border border-gray-600"
                  >
                    <div>
                      <div className="font-medium text-gray-200">{item.label}</div>
                      <div className="text-xs text-gray-400">{item.desc}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-100">
                        {item.value.toFixed(1)} {item.unit}
                      </div>
                      <div className={`text-xs font-medium ${isGood ? 'text-green-400' : 'text-red-400'}`}>
                        {item.ideal} {isGood ? 'Optimal' : 'Needs work'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Readiness Score */}
          <div className="bg-gray-800/60 rounded-xl p-5 border border-gray-600 text-center">
            <h4 className="font-semibold text-blue-300 mb-3">📊 Today’s Readiness Score</h4>
            <div
              className={`text-5xl font-extrabold mb-2 transition-all duration-300 ${
                readinessScore > 75
                  ? 'text-green-400 drop-shadow-sm'
                  : readinessScore > 50
                  ? 'text-yellow-400'
                  : 'text-red-400'
              }`}
            >
              {readinessScore > 75 ? '🟢' : readinessScore > 50 ? '🟡' : '🔴'}{' '}
              {readinessScore.toFixed(0)}%
            </div>
            <p className="text-sm text-gray-400 mb-3">Based on HRV, RHR, Sleep & SpO₂</p>

            {/* Micro-Recommendation */}
            <div className="bg-gray-700/60 rounded-lg p-3 text-xs border border-gray-600">
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
        <div className="mt-6 bg-gray-800/60 rounded-xl p-5 border border-yellow-600/40">
          <h4 className="font-semibold text-amber-300 mb-2 flex items-center gap-2">
            🤖 AI Coach Recommendation
          </h4>
          <p className="text-amber-200 text-sm leading-relaxed">
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
    <section className="bg-gradient-to-r from-rose-900/20 to-pink-900/20 backdrop-blur-sm rounded-xl p-5 border border-rose-700/40">
      <h4 className="font-semibold text-rose-300 mb-2 flex items-center gap-2">
        💡 Recovery Tip of the Day
      </h4>
      <p className="text-rose-200 text-sm leading-relaxed">
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
    <h2 className="text-2xl font-bold text-gray-900 mb-6">⚖️ Body Composition Analysis</h2>
    
    {athleteBodyComp ? (

        
      <BodyComposition 
        data={athleteBodyComp} 
        history={athleteBodyCompHistory} 
        geneticData={athleteGenetics} 
        />
    ) : (
      <div className="text-center py-12 bg-gray-50 rounded-xl">
        <p className="text-gray-600 mb-2">⚖️ No body composition data available</p>
        <p className="text-sm text-gray-500">
          Please ensure body composition measurements are recorded
        </p>
      </div>
    )}
  </div>
)}
      </div>
    </div>
  );
};