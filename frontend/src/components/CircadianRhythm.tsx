import React, { useState } from 'react';
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
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import { BiometricData, GeneticProfile } from '../types';

interface CircadianRhythmProps {
  biometricData: BiometricData[];
  geneticData: GeneticProfile[];
  athleteId: string;
}

// Helper function to calculate circadian rhythm score
const calculateCircadianScore = (data: BiometricData[]): number => {
  if (data.length === 0) return 0;

  const latest = data[data.length - 1];
  let score = 100;

  // Sleep timing consistency (lower std dev = higher score)
  const sleepOnsetTimes = data.map(d => d.sleep_onset_time || '00:00');
  const wakeTimes = data.map(d => d.wake_time || '00:00');

  const onsetStdDev = calculateStandardDeviation(
    sleepOnsetTimes.map(time => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    })
  );

  const wakeStdDev = calculateStandardDeviation(
    wakeTimes.map(time => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    })
  );

  const avgStdDev = (onsetStdDev + wakeStdDev) / 2;
  const consistencyPenalty = Math.min(avgStdDev / 2, 30);

  // Sleep duration adequacy
  const avgSleepDuration = data.reduce((sum, d) => sum + d.sleep_duration_h, 0) / data.length;
  const durationPenalty = avgSleepDuration < 7 ? (7 - avgSleepDuration) * 5 : 0;

  // Deep sleep percentage
  const avgDeepSleep = data.reduce((sum, d) => sum + d.deep_sleep_pct, 0) / data.length;
  const deepSleepPenalty = avgDeepSleep < 20 ? (20 - avgDeepSleep) * 2 : 0;

  // HRV during sleep
  const avgHrvNight = data.reduce((sum, d) => sum + d.hrv_night, 0) / data.length;
  const hrvPenalty = avgHrvNight < 50 ? (50 - avgHrvNight) * 0.5 : 0;

  score -= consistencyPenalty + durationPenalty + deepSleepPenalty + hrvPenalty;

  return Math.max(0, Math.min(100, score));
};

// Helper function to calculate standard deviation
const calculateStandardDeviation = (values: number[]): number => {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
  const variance = squaredDifferences.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.sqrt(variance);
};

// Helper function to determine chronotype based on comprehensive genetics and sleep patterns
const determineChronotype = (geneticData: GeneticProfile[], biometricData: BiometricData[]): string => {
  const per3Gene = geneticData.find(g => g.gene === 'PER3');
  const clockGene = geneticData.find(g => g.gene === 'CLOCK');
  const per2Gene = geneticData.find(g => g.gene === 'PER2');
  const arntlGene = geneticData.find(g => g.gene === 'ARNTL');

  // Genetic influence with comprehensive circadian genes
  let geneticChronotype = 'Intermediate';
  let chronotypeScore = 0; // -1 = evening, 0 = intermediate, 1 = morning

  // CLOCK gene - AA = morning preference
  if (clockGene) {
    chronotypeScore += clockGene.genotype === 'AA' ? 1 : -0.5;
  }

  // PER3 gene - long allele = evening preference
  if (per3Gene) {
    chronotypeScore += per3Gene.genotype === 'long' ? -1 : 0.5;
  }

  // PER2 gene - certain variants affect morningness
  if (per2Gene) {
    chronotypeScore += per2Gene.genotype.includes('C') ? 0.3 : -0.3;
  }

  // ARNTL/BMAL1 gene - affects circadian rhythm strength
  if (arntlGene) {
    chronotypeScore += arntlGene.genotype.includes('G') ? 0.2 : -0.2;
  }

  // Determine genetic chronotype based on score
  if (chronotypeScore > 0.5) {
    geneticChronotype = 'Morning Type';
  } else if (chronotypeScore < -0.5) {
    geneticChronotype = 'Evening Type';
  } else {
    geneticChronotype = 'Intermediate';
  }

  // Behavioral influence from sleep patterns
  if (biometricData.length > 0) {
    const avgSleepOnset = biometricData.reduce((sum, d) => {
      const [hours] = (d.sleep_onset_time || '00:00').split(':').map(Number);
      return sum + hours;
    }, 0) / biometricData.length;

    const avgWakeTime = biometricData.reduce((sum, d) => {
      const [hours] = (d.wake_time || '00:00').split(':').map(Number);
      return sum + hours;
    }, 0) / biometricData.length;

    // Very late sleep onset = evening type
    if (avgSleepOnset >= 23 || avgSleepOnset <= 3) {
      return 'Evening Type';
    }
    // Early sleep onset = morning type
    else if (avgSleepOnset <= 21 && avgWakeTime <= 7) {
      return 'Morning Type';
    }
    // Moderate timing = intermediate
    else if (avgSleepOnset >= 22 && avgSleepOnset <= 23) {
      return 'Intermediate';
    }
  }

  return geneticChronotype;
};

// Helper function to calculate circadian disruption factors
const calculateCircadianDisruptions = (data: BiometricData[]): string[] => {
  const disruptions: string[] = [];

  if (data.length < 2) return disruptions;

  // Check for irregular sleep timing
  const sleepOnsetTimes = data.map(d => {
    const [hours, minutes] = (d.sleep_onset_time || '00:00').split(':').map(Number);
    return hours * 60 + minutes;
  });

  const onsetStdDev = calculateStandardDeviation(sleepOnsetTimes);
  if (onsetStdDev > 60) { // More than 1 hour variation
    disruptions.push('Irregular Sleep Schedule');
  }

  // Check for insufficient sleep
  const avgSleepDuration = data.reduce((sum, d) => sum + d.sleep_duration_h, 0) / data.length;
  if (avgSleepDuration < 7) {
    disruptions.push('Chronic Sleep Deprivation');
  }

  // Check for low deep sleep
  const avgDeepSleep = data.reduce((sum, d) => sum + d.deep_sleep_pct, 0) / data.length;
  if (avgDeepSleep < 15) {
    disruptions.push('Insufficient Deep Sleep');
  }

  // Check for elevated nighttime HR
  const avgRestingHr = data.reduce((sum, d) => sum + d.resting_hr, 0) / data.length;
  if (avgRestingHr > 65) {
    disruptions.push('Elevated Nighttime Heart Rate');
  }

  // Check for low nighttime HRV
  const avgHrvNight = data.reduce((sum, d) => sum + d.hrv_night, 0) / data.length;
  if (avgHrvNight < 40) {
    disruptions.push('Poor Nighttime Recovery');
  }

  return disruptions;
};

// Helper function to generate comprehensive circadian recommendations
const generateCircadianRecommendations = (
  chronotype: string,
  disruptions: string[],
  geneticData: GeneticProfile[],
  biometricData: BiometricData[]
): string[] => {
  const recommendations: string[] = [];

  // Chronotype-specific recommendations
  if (chronotype === 'Morning Type') {
    recommendations.push('Maintain consistent early bedtime (9-10 PM) and wake time (5-6 AM)');
    recommendations.push('Schedule high-intensity training in the morning when cortisol is naturally higher');
    recommendations.push('Avoid late-night screen time and bright lights after sunset');
  } else if (chronotype === 'Evening Type') {
    recommendations.push('Allow flexible scheduling but maintain consistent sleep duration');
    recommendations.push('Consider later training sessions when energy levels are higher');
    recommendations.push('Use morning sunlight exposure to help regulate circadian rhythm');
  } else {
    recommendations.push('Aim for 10-11 PM bedtime and 6-7 AM wake time as a balanced approach');
    recommendations.push('Monitor energy levels throughout the day to optimize training timing');
  }

  // Disruption-specific recommendations
  if (disruptions.includes('Irregular Sleep Schedule')) {
    recommendations.push('Establish a consistent sleep schedule, even on weekends');
    recommendations.push('Use alarm clocks for both bedtime and wake time');
  }

  if (disruptions.includes('Chronic Sleep Deprivation')) {
    recommendations.push('Prioritize 7-9 hours of sleep nightly');
    recommendations.push('Consider naps (20-30 minutes) if sleep debt accumulates');
  }

  if (disruptions.includes('Insufficient Deep Sleep')) {
    recommendations.push('Maintain cooler bedroom temperature (65-68°F/18-20°C)');
    recommendations.push('Avoid alcohol and heavy meals 3 hours before bedtime');
  }

  if (disruptions.includes('Elevated Nighttime Heart Rate')) {
    recommendations.push('Incorporate evening relaxation techniques (meditation, light stretching)');
    recommendations.push('Reduce screen time and blue light exposure 1 hour before bed');
  }

  // Comprehensive genetic-specific recommendations
  // Core Sleep markers
  const clockGene = geneticData.find(g => g.gene === 'CLOCK');
  if (clockGene) {
    if (clockGene.genotype === 'AA') {
      recommendations.push('Strong circadian drive (CLOCK AA) - maintain strict sleep consistency');
    } else {
      recommendations.push('Flexible circadian rhythm - use time-restricted eating (10-hour window)');
    }
  }

  const per3Gene = geneticData.find(g => g.gene === 'PER3');
  if (per3Gene) {
    if (per3Gene.genotype === 'long') {
      recommendations.push('Evening chronotype (PER3 long) - consider magnesium glycinate for better sleep onset');
      recommendations.push('Evening types: Stop caffeine by 3 PM to avoid sleep disruption');
    } else {
      recommendations.push('Morning chronotype (PER3 short) - optimize with morning sunlight exposure');
      recommendations.push('Morning types: Can consume caffeine until 2 PM without major sleep impact');
    }
  }

  const per2Gene = geneticData.find(g => g.gene === 'PER2');
  if (per2Gene) {
    recommendations.push('PER2 variant detected - monitor light exposure timing for optimal circadian regulation');
  }

  const arntlGene = geneticData.find(g => g.gene === 'ARNTL');
  if (arntlGene) {
    recommendations.push('BMAL1 (ARNTL) gene influences circadian strength - maintain consistent light/dark cycles');
  }

  const comtGene = geneticData.find(g => g.gene === 'COMT');
  if (comtGene) {
    if (comtGene.genotype === 'GG') {
      recommendations.push('Efficient dopamine metabolism (COMT GG) - better stress response during sleep deprivation');
    } else {
      recommendations.push('Slower dopamine clearance - prioritize sleep quality over quantity');
    }
  }

  const bdnfGene = geneticData.find(g => g.gene === 'BDNF');
  if (bdnfGene) {
    if (bdnfGene.genotype === 'Val/Val') {
      recommendations.push('Enhanced neuroplasticity (BDNF Val/Val) - better sleep-dependent memory consolidation');
    } else {
      recommendations.push('Reduced neuroplasticity - ensure adequate deep sleep for cognitive recovery');
    }
  }

  const ppargc1aGene = geneticData.find(g => g.gene === 'PPARGC1A');
  if (ppargc1aGene) {
    recommendations.push('Mitochondrial biogenesis gene (PPARGC1A) - cold exposure may enhance sleep quality');
  }

  // Mental Health genes affecting circadian rhythm
  const slc6a4Gene = geneticData.find(g => g.gene === 'SLC6A4');
  if (slc6a4Gene) {
    if (slc6a4Gene.genotype === 'LL') {
      recommendations.push('Efficient serotonin transport (SLC6A4 LL) - better mood stability with light exposure');
    } else {
      recommendations.push('Reduced serotonin transport - monitor seasonal mood changes');
    }
  }

  const tph2Gene = geneticData.find(g => g.gene === 'TPH2');
  if (tph2Gene) {
    recommendations.push('Serotonin synthesis gene (TPH2) - light therapy may help regulate mood and sleep');
  }

  const maoaGene = geneticData.find(g => g.gene === 'MAOA');
  if (maoaGene) {
    recommendations.push('Monoamine oxidase gene (MAOA) - stress management crucial for sleep quality');
  }

  // Vitamin D metabolism genes
  const gcGene = geneticData.find(g => g.gene === 'GC');
  if (gcGene) {
    recommendations.push('Vitamin D binding protein gene (GC) - monitor vitamin D levels, consider supplementation');
  }

  const cyp2r1Gene = geneticData.find(g => g.gene === 'CYP2R1');
  if (cyp2r1Gene) {
    recommendations.push('Vitamin D activation gene (CYP2R1) - may need higher UV exposure for vitamin D production');
  }

  const vdrGene = geneticData.find(g => g.gene === 'VDR');
  if (vdrGene) {
    recommendations.push('Vitamin D receptor gene (VDR) - optimize vitamin D utilization through diet and sunlight');
  }

  // Caffeine consumption recommendations based on chronotype
  if (chronotype === 'Morning Type') {
    recommendations.push('Stop caffeine consumption by 2 PM to avoid sleep interference');
    recommendations.push('Optimal caffeine timing: 8-11 AM when cortisol is naturally elevated');
  } else if (chronotype === 'Evening Type') {
    recommendations.push('Stop caffeine consumption by 4 PM to prevent delayed sleep onset');
    recommendations.push('Limit caffeine to morning hours only (before 12 PM)');
  } else {
    recommendations.push('Stop caffeine consumption by 3 PM for balanced circadian rhythm');
    recommendations.push('Monitor individual response and adjust caffeine cutoff time accordingly');
  }

  // Additional caffeine recommendations based on sleep patterns
  if (biometricData.length > 0) {
    const avgSleepOnset = biometricData.reduce((sum, d) => {
      const [hours] = (d.sleep_onset_time || '00:00').split(':').map(Number);
      return sum + hours;
    }, 0) / biometricData.length;

    if (avgSleepOnset < 23) {
      recommendations.push('Early sleep onset detected - stop caffeine 6-8 hours before bedtime');
    } else {
      recommendations.push('Later sleep onset - stop caffeine 4-6 hours before bedtime');
    }
  }

  return recommendations;
};

export const CircadianRhythm: React.FC<CircadianRhythmProps> = ({
  biometricData,
  geneticData,
  athleteId
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d'>('30d');

  // Filter data based on selected period
  const filteredData = selectedPeriod === '7d'
    ? biometricData.slice(-7)
    : biometricData.slice(-30);

  // Calculate circadian metrics
  const circadianScore = calculateCircadianScore(filteredData);
  const chronotype = determineChronotype(geneticData, filteredData);
  const disruptions = calculateCircadianDisruptions(filteredData);
  const recommendations = generateCircadianRecommendations(chronotype, disruptions, geneticData, filteredData);

  // Prepare chart data
  const circadianTrendData = filteredData.map(data => ({
    date: data.date,
    sleepDuration: data.sleep_duration_h,
    deepSleep: data.deep_sleep_pct,
    hrvNight: data.hrv_night,
    restingHr: data.resting_hr,
    circadianScore: calculateCircadianScore([data])
  }));

  // Circadian rhythm markers
  const circadianMarkers = [
    { name: 'Sleep Duration', value: filteredData.length > 0 ?
      filteredData.reduce((sum, d) => sum + d.sleep_duration_h, 0) / filteredData.length : 0, max: 10 },
    { name: 'Deep Sleep %', value: filteredData.length > 0 ?
      filteredData.reduce((sum, d) => sum + d.deep_sleep_pct, 0) / filteredData.length : 0, max: 30 },
    { name: 'Night HRV', value: filteredData.length > 0 ?
      filteredData.reduce((sum, d) => sum + d.hrv_night, 0) / filteredData.length : 0, max: 100 },
    { name: 'Resting HR', value: filteredData.length > 0 ?
      100 - (filteredData.reduce((sum, d) => sum + d.resting_hr, 0) / filteredData.length) : 0, max: 100 },
    { name: 'Sleep Consistency', value: 100 - Math.min(calculateStandardDeviation(
      filteredData.map(d => {
        const [hours] = (d.sleep_onset_time || '00:00').split(':').map(Number);
        return hours;
      })
    ) * 5, 100), max: 100 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold text-white">⏰ Circadian Rhythm Analysis</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedPeriod('7d')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedPeriod === '7d'
                ? 'bg-blue-600 text-gray-900'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setSelectedPeriod('30d')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedPeriod === '30d'
                ? 'bg-blue-600 text-gray-900'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            30 Days
          </button>
        </div>
      </div>

      {/* Circadian Rhythm Clock */}
      <div className="card-enhanced p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🕐 Daily Circadian Rhythm</h3>
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <div className="relative w-64 h-64 mx-auto">
              <svg className="w-full h-full" viewBox="0 0 120 120">
                {/* Clock face */}
                <circle
                  cx="60"
                  cy="60"
                  r="55"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="2"
                />

                {/* Hour markers */}
                {Array.from({ length: 24 }, (_, i) => {
                  const angle = (i * 15) - 90; // 15 degrees per hour
                  const x1 = 60 + 45 * Math.cos(angle * Math.PI / 180);
                  const y1 = 60 + 45 * Math.sin(angle * Math.PI / 180);
                  const x2 = 60 + 50 * Math.cos(angle * Math.PI / 180);
                  const y2 = 60 + 50 * Math.sin(angle * Math.PI / 180);

                  return (
                    <line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#6b7280"
                      strokeWidth={i % 6 === 0 ? "2" : "1"}
                    />
                  );
                })}

                {/* Hour labels */}
                {[6, 12, 18, 24].map(hour => {
                  const angle = (hour * 15) - 90;
                  const x = 60 + 38 * Math.cos(angle * Math.PI / 180);
                  const y = 60 + 38 * Math.sin(angle * Math.PI / 180);

                  return (
                    <text
                      key={hour}
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-xs font-medium fill-gray-600"
                    >
                      {hour === 24 ? '0' : hour}
                    </text>
                  );
                })}

                {/* Dynamic Cortisol curve based on chronotype */}
                {chronotype === 'Morning Type' && (
                  <path
                    d="M 60,60 Q 45,30 30,55 Q 45,80 60,60"
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="3"
                    opacity="0.8"
                  />
                )}
                {chronotype === 'Evening Type' && (
                  <path
                    d="M 60,60 Q 45,40 30,65 Q 45,90 60,60"
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="3"
                    opacity="0.8"
                  />
                )}
                {chronotype === 'Intermediate' && (
                  <path
                    d="M 60,60 Q 45,35 30,60 Q 45,85 60,60"
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="3"
                    opacity="0.8"
                  />
                )}

                {/* Dynamic Melatonin curve based on sleep patterns */}
                {filteredData.length > 0 && (
                  <path
                    d={`M 60,60 Q ${75 + (filteredData[0].sleep_duration_h < 7 ? 5 : 0)},${35 - (filteredData[0].deep_sleep_pct > 20 ? 5 : 0)} ${90 + (filteredData[0].sleep_duration_h < 7 ? 5 : 0)},${60 - (filteredData[0].deep_sleep_pct > 20 ? 10 : 0)} Q ${75 + (filteredData[0].sleep_duration_h < 7 ? 5 : 0)},${85 + (filteredData[0].deep_sleep_pct > 20 ? 5 : 0)} 60,60`}
                    fill="none"
                    stroke="#8B5CF6"
                    strokeWidth="3"
                    opacity="0.8"
                  />
                )}

                {/* Dynamic Body temperature curve */}
                {filteredData.length > 0 && (
                  <path
                    d={`M 30,${70 - (filteredData[0].temp_trend_c > 36.5 ? 5 : 0)} Q 45,${65 - (filteredData[0].temp_trend_c > 36.5 ? 3 : 0)} 60,${60 - (filteredData[0].temp_trend_c > 36.5 ? 0 : 5)} Q 75,${55 - (filteredData[0].temp_trend_c > 36.5 ? 0 : 3)} 90,${70 - (filteredData[0].temp_trend_c > 36.5 ? 5 : 0)}`}
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="2"
                    opacity="0.7"
                  />
                )}

                {/* Dynamic Energy levels based on readiness */}
                {filteredData.length > 0 && (
                  <path
                    d={`M 35,${75 - (circadianScore > 70 ? 15 : circadianScore > 50 ? 10 : 5)} Q 50,${50 - (circadianScore > 70 ? 10 : circadianScore > 50 ? 5 : 0)} 65,${45 - (circadianScore > 70 ? 5 : 0)} Q 80,${50 - (circadianScore > 70 ? 10 : circadianScore > 50 ? 5 : 0)} 95,${75 - (circadianScore > 70 ? 15 : circadianScore > 50 ? 10 : 5)}`}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2"
                    opacity="0.7"
                  />
                )}
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <div className="space-y-4">
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="font-medium text-orange-800">Cortisol</span>
                </div>
                <p className="text-sm text-orange-700">Peaks in morning, drives wakefulness and energy</p>
              </div>

              <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="font-medium text-purple-800">Melatonin</span>
                </div>
                <p className="text-sm text-purple-700">Rises in evening, promotes sleep and recovery</p>
              </div>

              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="font-medium text-red-800">Body Temperature</span>
                </div>
                <p className="text-sm text-red-700">Lowest at night, peaks in afternoon/evening</p>
              </div>

              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-green-800">Energy Levels</span>
                </div>
                <p className="text-sm text-green-700">Highest mid-morning to early afternoon</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Optimal Activity Times */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-2xl mb-1">🌅</div>
            <div className="font-medium text-blue-800">
              {chronotype === 'Morning Type' ? '5-8 AM' : chronotype === 'Evening Type' ? '7-10 AM' : '6-9 AM'}
            </div>
            <div className="text-sm text-blue-600">
              {circadianScore > 70 ? 'High-Intensity Training' : 'Light Exercise'}
            </div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="text-2xl mb-1">⚡</div>
            <div className="font-medium text-green-800">
              {chronotype === 'Morning Type' ? '9 AM-1 PM' : chronotype === 'Evening Type' ? '11 AM-3 PM' : '10 AM-2 PM'}
            </div>
            <div className="text-sm text-green-600">
              Peak Performance {circadianScore > 70 ? '(Optimal)' : '(Moderate)'}
            </div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="text-2xl mb-1">🧘</div>
            <div className="font-medium text-orange-800">
              {chronotype === 'Morning Type' ? '2-5 PM' : chronotype === 'Evening Type' ? '4-7 PM' : '3-6 PM'}
            </div>
            <div className="text-sm text-orange-600">
              Recovery & {filteredData[0]?.training_load_pct > 80 ? 'Active Rest' : 'Skill Work'}
            </div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="text-2xl mb-1">😴</div>
            <div className="font-medium text-purple-800">
              {filteredData.length > 0 && filteredData[0].sleep_onset_time ?
                (() => {
                  const sleepHour = parseInt(filteredData[0].sleep_onset_time.split(':')[0]);
                  const wakeHour = Math.floor((sleepHour + (filteredData[0].sleep_duration_h || 8)) % 24);
                  return `${sleepHour > 12 ? sleepHour - 12 : sleepHour} ${sleepHour >= 12 ? 'PM' : 'AM'}-${wakeHour > 12 ? wakeHour - 12 : wakeHour === 0 ? 12 : wakeHour} ${wakeHour >= 12 && wakeHour !== 0 ? 'PM' : 'AM'}`;
                })()
                : '10 PM-6 AM'}
            </div>
            <div className="text-sm text-purple-600">
              Sleep ({filteredData[0]?.sleep_duration_h.toFixed(1) || '8.0'}h avg)
            </div>
          </div>
        </div>
      </div>

      {/* Circadian Score Overview */}
      <div className="card-enhanced p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Circadian Rhythm Score</h3>
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <div className="relative w-48 h-48 mx-auto">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={circadianScore > 70 ? '#10B981' : circadianScore > 50 ? '#F59E0B' : '#EF4444'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${circadianScore * 2.83}, 1000`}
                  transform="rotate(-90 50 50)"
                />
                <text
                  x="50"
                  y="50"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-2xl font-bold"
                >
                  {circadianScore.toFixed(0)}
                </text>
                <text
                  x="50"
                  y="60"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-sm text-gray-600"
                >
                  Score
                </text>
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">Chronotype</h4>
                <p className="text-2xl font-bold mt-1 text-gray-900">{chronotype}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {chronotype === 'Morning Type' && 'Early riser, peaks in morning'}
                  {chronotype === 'Evening Type' && 'Night owl, peaks in evening'}
                  {chronotype === 'Intermediate' && 'Balanced sleep pattern'}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">Genetic Influence</h4>
                <div className="space-y-2 mt-2">
                  {geneticData.filter(g => [
                    'CLOCK', 'PER2', 'PER3', 'ARNTL', 'COMT', 'BDNF', 'PPARGC1A',
                    'SLC6A4', 'TPH2', 'MAOA', 'GC', 'CYP2R1', 'VDR'
                  ].includes(g.gene)).map((gene, index) => (
                    <div key={index} className="text-sm text-gray-900">
                      <span className="font-medium text-gray-900">{gene.gene}:</span> <span className="text-gray-700">{gene.genotype}</span>
                    </div>
                  ))}
                  {geneticData.filter(g => [
                    'CLOCK', 'PER2', 'PER3', 'ARNTL', 'COMT', 'BDNF', 'PPARGC1A',
                    'SLC6A4', 'TPH2', 'MAOA', 'GC', 'CYP2R1', 'VDR'
                  ].includes(g.gene)).length === 0 && (
                    <p className="text-sm text-gray-700">No circadian-related genetic data available</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Circadian Markers Radar */}
      <div className="card-enhanced p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Circadian Rhythm Markers</h3>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={circadianMarkers}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis dataKey="name" tick={{ fontSize: 12 }} />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 'dataMax']}
              tick={{ fontSize: 10 }}
              tickFormatter={(value) => `${value}`}
            />
            <Radar
              name="Circadian Health"
              dataKey="value"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Tooltip
              contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#1f2937' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Circadian Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-enhanced p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Sleep Duration & Quality</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={circadianTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis yAxisId="left" stroke="#6b7280" />
              <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#1f2937' }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="sleepDuration"
                name="Sleep Duration (h)"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="deepSleep"
                name="Deep Sleep (%)"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card-enhanced p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">❤️ Nighttime Recovery</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={circadianTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis yAxisId="left" stroke="#6b7280" />
              <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#1f2937' }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="hrvNight"
                name="Night HRV (ms)"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="restingHr"
                name="Resting HR (bpm)"
                stroke="#EF4444"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Circadian Disruptions */}
      {disruptions.length > 0 && (
        <div className="card-enhanced p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⚠️ Circadian Disruptions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {disruptions.map((disruption, index) => (
              <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                      <span className="text-red-600">⚠️</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-red-800">{disruption}</h4>
                    <p className="text-xs text-red-600 mt-1">
                      {disruption === 'Irregular Sleep Schedule' && 'Inconsistent bed/wake times disrupt circadian rhythm'}
                      {disruption === 'Chronic Sleep Deprivation' && 'Insufficient sleep duration affects hormone regulation'}
                      {disruption === 'Insufficient Deep Sleep' && 'Reduced deep sleep impairs physical recovery'}
                      {disruption === 'Elevated Nighttime Heart Rate' && 'High stress levels preventing proper recovery'}
                      {disruption === 'Poor Nighttime Recovery' && 'Low HRV indicates inadequate parasympathetic activity'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Circadian Recommendations */}
      <div className="card-enhanced p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Personalized Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((recommendation, index) => (
            <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600">💡</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-800">{recommendation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};