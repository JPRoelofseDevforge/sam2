import React, { useState, useEffect } from 'react';
import { BloodResults } from '../types';
import { bloodResultsService } from '../services/dataService';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Target,
  Zap,
  Heart,
  Droplets,
  Shield,
  BarChart3,
  Clock,
  Thermometer,
  Weight,
  Users,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

interface PathologyAnalysisProps {
  athleteId: string | number;
}

interface KeyMetric {
  name: string;
  value: number;
  unit: string;
  status: 'optimal' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  reference: string;
  icon: React.ReactNode;
  description: string;
}

interface HormoneAnalysis {
  cortisol: number;
  testosterone: number;
  ratio: number;
  status: 'optimal' | 'catabolic' | 'anabolic';
  message: string;
  recommendations: string[];
}

const PathologyAnalysis: React.FC<PathologyAnalysisProps> = ({ athleteId }) => {
  const [bloodResults, setBloodResults] = useState<BloodResults[]>([]);
  const [latestResults, setLatestResults] = useState<BloodResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hormoneAnalysis, setHormoneAnalysis] = useState<HormoneAnalysis | null>(null);

  useEffect(() => {
    const fetchBloodResults = async () => {
      try {
        setLoading(true);
        setError(null);
        const athleteIdNum = typeof athleteId === 'string' ? parseInt(athleteId, 10) : athleteId;

        const results = await bloodResultsService.getBloodResultsByAthlete(athleteIdNum);
        setBloodResults(results);

        if (results.length > 0) {
          setLatestResults(results[0]);
          const analysis = analyzeHormones(results[0]);
          setHormoneAnalysis(analysis);
        }
      } catch (error) {
        console.error('Failed to fetch blood results:', error);
        setError('Failed to load pathology data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchBloodResults();
  }, [athleteId]);

  const analyzeHormones = (results: BloodResults): HormoneAnalysis => {
    const cortisol = results.cortisol_nmol_l || 0;
    const testosterone = results.testosterone || 0;
    const ratio = testosterone > 0 ? cortisol / testosterone : 0;

    let status: 'optimal' | 'catabolic' | 'anabolic' = 'optimal';
    let message = 'Hormonal balance is optimal for athletic performance.';
    const recommendations: string[] = [];

    if (ratio > 0.05) {
      status = 'catabolic';
      message = 'High cortisol relative to testosterone indicates potential overtraining or chronic stress.';
      recommendations.push('Consider reducing training intensity');
      recommendations.push('Prioritize recovery and sleep');
      recommendations.push('Monitor stress levels');
    } else if (ratio < 0.01) {
      status = 'anabolic';
      message = 'Low cortisol-testosterone ratio suggests good recovery and adaptation.';
      recommendations.push('Current training load is appropriate');
      recommendations.push('Continue monitoring for optimal performance');
    } else {
      recommendations.push('Maintain current training and recovery protocols');
    }

    return {
      cortisol,
      testosterone,
      ratio,
      status,
      message,
      recommendations
    };
  };

  const getKeyMetrics = (): KeyMetric[] => {
    if (!latestResults) return [];

    const metrics: KeyMetric[] = [];

    // Cortisol
    if (latestResults.cortisol_nmol_l !== undefined) {
      metrics.push({
        name: 'Cortisol',
        value: latestResults.cortisol_nmol_l,
        unit: 'nmol/L',
        status: latestResults.cortisol_nmol_l > 550 ? 'critical' : latestResults.cortisol_nmol_l > 150 ? 'warning' : 'optimal',
        trend: 'stable',
        reference: '150-550',
        icon: <Activity className="w-5 h-5" />,
        description: 'Stress hormone'
      });
    }

    // Testosterone
    if (latestResults.testosterone !== undefined) {
      metrics.push({
        name: 'Testosterone',
        value: latestResults.testosterone,
        unit: 'nmol/L',
        status: latestResults.testosterone < 10 ? 'critical' : latestResults.testosterone < 15 ? 'warning' : 'optimal',
        trend: 'stable',
        reference: '10-35',
        icon: <Target className="w-5 h-5" />,
        description: 'Anabolic hormone'
      });
    }

    // Hemoglobin
    if (latestResults.hemoglobin !== undefined) {
      metrics.push({
        name: 'Hemoglobin',
        value: latestResults.hemoglobin,
        unit: 'g/dL',
        status: latestResults.hemoglobin < 13 ? 'critical' : latestResults.hemoglobin < 14 ? 'warning' : 'optimal',
        trend: 'stable',
        reference: '13-17',
        icon: <Droplets className="w-5 h-5" />,
        description: 'Oxygen transport'
      });
    }

    // Creatine Kinase
    if (latestResults.ck !== undefined) {
      metrics.push({
        name: 'Creatine Kinase',
        value: latestResults.ck,
        unit: 'U/L',
        status: latestResults.ck > 200 ? 'critical' : latestResults.ck > 150 ? 'warning' : 'optimal',
        trend: 'stable',
        reference: '30-200',
        icon: <Zap className="w-5 h-5" />,
        description: 'Muscle damage marker'
      });
    }

    // ALT
    if (latestResults.s_alanine_transaminase !== undefined) {
      metrics.push({
        name: 'ALT',
        value: latestResults.s_alanine_transaminase,
        unit: 'U/L',
        status: latestResults.s_alanine_transaminase > 40 ? 'critical' : latestResults.s_alanine_transaminase > 30 ? 'warning' : 'optimal',
        trend: 'stable',
        reference: '7-40',
        icon: <Activity className="w-5 h-5" />,
        description: 'Liver function'
      });
    }

    // CRP
    if (latestResults.c_reactive_protein !== undefined) {
      metrics.push({
        name: 'CRP',
        value: latestResults.c_reactive_protein,
        unit: 'mg/L',
        status: latestResults.c_reactive_protein > 3 ? 'critical' : latestResults.c_reactive_protein > 1 ? 'warning' : 'optimal',
        trend: 'stable',
        reference: '<3',
        icon: <Shield className="w-5 h-5" />,
        description: 'Inflammation marker'
      });
    }

    return metrics;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal': return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'warning': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/30';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'optimal': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUp className="w-4 h-4" />;
      case 'down': return <ArrowDown className="w-4 h-4" />;
      default: return <Minus className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading pathology data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 font-medium text-lg">Error loading pathology data</p>
          <p className="text-gray-400 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!latestResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 font-medium text-lg">No blood results available</p>
          <p className="text-gray-500 mt-2">Blood test results will appear here once uploaded.</p>
        </div>
      </div>
    );
  }

  const keyMetrics = getKeyMetrics();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/5 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-pink-500/5 to-transparent"></div>

        <div className="relative z-10 p-8 space-y-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-red-500 to-pink-500 rounded-full mb-4 shadow-lg animate-pulse">
              <Activity className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-red-200 to-pink-200 bg-clip-text text-transparent mb-2">
              Pathology Analysis
            </h1>
            <p className="text-gray-400 text-lg">
              Key biomarkers for athletic performance
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Last updated: {latestResults.date || latestResults.created_at || 'Recent'}
            </p>
          </div>

          {/* Hormone Analysis - Priority Section */}
          {hormoneAnalysis && (
            <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Hormone Balance Analysis</h2>
                  <p className="text-gray-400">Cortisol vs Testosterone - Critical for recovery</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-400 text-sm">Cortisol</span>
                    <Activity className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">
                    {hormoneAnalysis.cortisol.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-400">nmol/L</div>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-400 text-sm">Testosterone</span>
                    <Target className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">
                    {hormoneAnalysis.testosterone.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-400">nmol/L</div>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-400 text-sm">C/T Ratio</span>
                    <BarChart3 className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">
                    {(hormoneAnalysis.ratio * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-400">Ratio</div>
                </div>
              </div>

              <div className={`rounded-xl p-6 border-2 ${
                hormoneAnalysis.status === 'optimal'
                  ? 'border-green-500/30 bg-green-500/5'
                  : hormoneAnalysis.status === 'catabolic'
                  ? 'border-red-500/30 bg-red-500/5'
                  : 'border-blue-500/30 bg-blue-500/5'
              }`}>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {hormoneAnalysis.status === 'optimal' ? (
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    ) : hormoneAnalysis.status === 'catabolic' ? (
                      <AlertTriangle className="w-6 h-6 text-red-400" />
                    ) : (
                      <Target className="w-6 h-6 text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-lg font-semibold mb-2 ${
                      hormoneAnalysis.status === 'optimal'
                        ? 'text-green-400'
                        : hormoneAnalysis.status === 'catabolic'
                        ? 'text-red-400'
                        : 'text-blue-400'
                    }`}>
                      {hormoneAnalysis.status === 'optimal' ? 'Optimal Balance' :
                       hormoneAnalysis.status === 'catabolic' ? 'Catabolic State' :
                       'Anabolic State'}
                    </h3>
                    <p className="text-gray-300 mb-4">{hormoneAnalysis.message}</p>
                    <div className="space-y-2">
                      {hormoneAnalysis.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-400">
                          <div className="w-1.5 h-1.5 bg-current rounded-full"></div>
                          {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {keyMetrics.map((metric, index) => (
              <div key={index} className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700/50 p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                      {metric.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-lg">{metric.name}</h3>
                      <p className="text-gray-400 text-sm">{metric.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(metric.status)}
                    {getTrendIcon(metric.trend)}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-3xl font-bold text-white mb-1">
                    {metric.value.toFixed(1)} <span className="text-lg text-gray-400">{metric.unit}</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    Reference: {metric.reference}
                  </div>
                </div>

                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(metric.status)}`}>
                  {getStatusIcon(metric.status)}
                  {metric.status.toUpperCase()}
                </div>
              </div>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30 p-6">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <span className="text-green-400 font-medium">Optimal</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {keyMetrics.filter(m => m.status === 'optimal').length}
              </div>
              <div className="text-sm text-gray-400">markers</div>
            </div>

            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl border border-yellow-500/30 p-6">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="w-6 h-6 text-yellow-500" />
                <span className="text-yellow-400 font-medium">Monitor</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {keyMetrics.filter(m => m.status === 'warning').length}
              </div>
              <div className="text-sm text-gray-400">markers</div>
            </div>

            <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-xl border border-red-500/30 p-6">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <span className="text-red-400 font-medium">Critical</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {keyMetrics.filter(m => m.status === 'critical').length}
              </div>
              <div className="text-sm text-gray-400">markers</div>
            </div>

            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-500/30 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-6 h-6 text-blue-500" />
                <span className="text-blue-400 font-medium">Total Tests</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {bloodResults.length}
              </div>
              <div className="text-sm text-gray-400">available</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { PathologyAnalysis };