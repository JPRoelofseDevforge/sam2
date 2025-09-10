import React, { useState, useEffect } from 'react';
import type { BloodResults as BloodResultsType } from '../types';
import { bloodResultsService } from '../services/dataService';
import { HormoneBalanceChart } from './HormoneBalanceChart';
import { MetabolicHealthChart } from './MetabolicHealthChart';
import { InflammationChart } from './InflammationChart';
import { OrganFunctionChart } from './OrganFunctionChart';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  TestTube,
  Heart,
  Shield,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3
} from 'lucide-react';

interface BloodResultsProps {
  athleteId: string | number;
}

const BloodResults: React.FC<BloodResultsProps> = ({ athleteId }) => {
  const [bloodResults, setBloodResults] = useState<BloodResultsType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBloodResults = async () => {
      try {
        setLoading(true);
        setError(null);
        const athleteIdNum = typeof athleteId === 'string' ? parseInt(athleteId, 10) : athleteId;

        const results = await bloodResultsService.getBloodResultsByAthlete(athleteIdNum);
        console.log('Fetched blood results:', results);
        setBloodResults(results);
      } catch (error) {
        console.error('Failed to fetch blood results:', error);
        setError('Failed to load blood results data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchBloodResults();
  }, [athleteId]);

  const formatValue = (value: number | undefined, decimals: number = 2): string => {
    if (value === undefined || value === null) return 'N/A';
    return value.toFixed(decimals);
  };

  const getStatusIcon = (value: number | undefined, normalRange?: { min: number; max: number }) => {
    if (value === undefined || value === null || !normalRange) {
      return <Minus className="w-4 h-4 text-gray-400" />;
    }

    if (value < normalRange.min) {
      return <TrendingDown className="w-4 h-4 text-blue-500" />;
    } else if (value > normalRange.max) {
      return <TrendingUp className="w-4 h-4 text-red-500" />;
    } else {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getStatusColor = (value: number | undefined, normalRange?: { min: number; max: number }) => {
    if (value === undefined || value === null || !normalRange) {
      return 'text-gray-400';
    }

    if (value < normalRange.min || value > normalRange.max) {
      return 'text-red-600 bg-red-50';
    } else {
      return 'text-green-600 bg-green-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading blood results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 font-medium text-lg">Error loading blood results</p>
          <p className="text-gray-400 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (bloodResults.length === 0) {
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

  const latestResult = bloodResults[bloodResults.length - 1];

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
              <TestTube className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-red-200 to-pink-200 bg-clip-text text-transparent mb-2">
              Blood Results
            </h1>
            <p className="text-gray-400 text-lg">
              Comprehensive blood analysis from PostgreSQL database
            </p>
            <p className="text-gray-500 text-sm mt-2">
              {bloodResults.length} test result{bloodResults.length !== 1 ? 's' : ''} available
            </p>
          </div>

          {/* Lab Information */}
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6" />
              Test Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="text-sm text-gray-400 mb-1">Test Date</div>
                <div className="text-lg font-semibold text-white">
                  {latestResult.date ? new Date(latestResult.date).toLocaleDateString() : 'N/A'}
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="text-sm text-gray-400 mb-1">Lab Name</div>
                <div className="text-lg font-semibold text-white">
                  {latestResult.lab_name || 'N/A'}
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="text-sm text-gray-400 mb-1">Test Method</div>
                <div className="text-lg font-semibold text-white">
                  {latestResult.test_method || 'N/A'}
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="text-sm text-gray-400 mb-1">Status</div>
                <div className="text-lg font-semibold text-white flex items-center gap-2">
                  {latestResult.is_abnormal ? (
                    <>
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      Abnormal
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      Normal
                    </>
                  )}
                </div>
              </div>
            </div>
            {latestResult.notes && (
              <div className="mt-4 bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="text-sm text-gray-400 mb-1">Notes</div>
                <div className="text-white">{latestResult.notes}</div>
              </div>
            )}
          </div>

          {/* Hormones Section */}
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Heart className="w-6 h-6" />
              Hormones
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">Cortisol</div>
                  {getStatusIcon(latestResult.cortisol_nmol_l, { min: 100, max: 600 })}
                </div>
                <div className={`text-2xl font-bold ${getStatusColor(latestResult.cortisol_nmol_l, { min: 100, max: 600 })}`}>
                  {formatValue(latestResult.cortisol_nmol_l)} nmol/L
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">Testosterone</div>
                  {getStatusIcon(latestResult.testosterone, { min: 8.4, max: 28.7 })}
                </div>
                <div className={`text-2xl font-bold ${getStatusColor(latestResult.testosterone, { min: 8.4, max: 28.7 })}`}>
                  {formatValue(latestResult.testosterone)} nmol/L
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">Vitamin D</div>
                  {getStatusIcon(latestResult.vitamin_d, { min: 50, max: 150 })}
                </div>
                <div className={`text-2xl font-bold ${getStatusColor(latestResult.vitamin_d, { min: 50, max: 150 })}`}>
                  {formatValue(latestResult.vitamin_d)} nmol/L
                </div>
              </div>
            </div>
          </div>

          {/* Metabolic & Muscle Markers */}
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="w-6 h-6" />
              Metabolic & Muscle Markers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">Creatine Kinase</div>
                  {getStatusIcon(latestResult.ck, { min: 30, max: 200 })}
                </div>
                <div className={`text-2xl font-bold ${getStatusColor(latestResult.ck, { min: 30, max: 200 })}`}>
                  {formatValue(latestResult.ck)} U/L
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">Fasting Glucose</div>
                  {getStatusIcon(latestResult.fasting_glucose, { min: 3.9, max: 5.6 })}
                </div>
                <div className={`text-2xl font-bold ${getStatusColor(latestResult.fasting_glucose, { min: 3.9, max: 5.6 })}`}>
                  {formatValue(latestResult.fasting_glucose)} mmol/L
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">HbA1c</div>
                  {getStatusIcon(latestResult.hba1c, { min: 4.0, max: 6.0 })}
                </div>
                <div className={`text-2xl font-bold ${getStatusColor(latestResult.hba1c, { min: 4.0, max: 6.0 })}`}>
                  {formatValue(latestResult.hba1c)} %
                </div>
              </div>
            </div>
          </div>

          {/* Kidney Function */}
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Kidney Function
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">Urea</div>
                  {getStatusIcon(latestResult.urea, { min: 2.5, max: 7.8 })}
                </div>
                <div className={`text-2xl font-bold ${getStatusColor(latestResult.urea, { min: 2.5, max: 7.8 })}`}>
                  {formatValue(latestResult.urea)} mmol/L
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">Creatinine</div>
                  {getStatusIcon(latestResult.creatinine, { min: 60, max: 110 })}
                </div>
                <div className={`text-2xl font-bold ${getStatusColor(latestResult.creatinine, { min: 60, max: 110 })}`}>
                  {formatValue(latestResult.creatinine)} µmol/L
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">eGFR</div>
                  {getStatusIcon(latestResult.egfr, { min: 90, max: 120 })}
                </div>
                <div className={`text-2xl font-bold ${getStatusColor(latestResult.egfr, { min: 90, max: 120 })}`}>
                  {formatValue(latestResult.egfr)} mL/min/1.73m²
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">Uric Acid</div>
                  {getStatusIcon(latestResult.uric_acid, { min: 150, max: 420 })}
                </div>
                <div className={`text-2xl font-bold ${getStatusColor(latestResult.uric_acid, { min: 150, max: 420 })}`}>
                  {formatValue(latestResult.uric_acid)} µmol/L
                </div>
              </div>
            </div>
          </div>

          {/* Liver Function */}
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="w-6 h-6" />
              Liver Function
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">ALT</div>
                  {getStatusIcon(latestResult.s_alanine_transaminase, { min: 7, max: 56 })}
                </div>
                <div className={`text-2xl font-bold ${getStatusColor(latestResult.s_alanine_transaminase, { min: 7, max: 56 })}`}>
                  {formatValue(latestResult.s_alanine_transaminase)} U/L
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">AST</div>
                  {getStatusIcon(latestResult.s_aspartate_transaminase, { min: 10, max: 40 })}
                </div>
                <div className={`text-2xl font-bold ${getStatusColor(latestResult.s_aspartate_transaminase, { min: 10, max: 40 })}`}>
                  {formatValue(latestResult.s_aspartate_transaminase)} U/L
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">GGT</div>
                  {getStatusIcon(latestResult.s_glutamyl_transferase, { min: 9, max: 48 })}
                </div>
                <div className={`text-2xl font-bold ${getStatusColor(latestResult.s_glutamyl_transferase, { min: 9, max: 48 })}`}>
                  {formatValue(latestResult.s_glutamyl_transferase)} U/L
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">LDH</div>
                  {getStatusIcon(latestResult.lactate_dehydrogenase, { min: 125, max: 220 })}
                </div>
                <div className={`text-2xl font-bold ${getStatusColor(latestResult.lactate_dehydrogenase, { min: 125, max: 220 })}`}>
                  {formatValue(latestResult.lactate_dehydrogenase)} U/L
                </div>
              </div>
            </div>
          </div>

          {/* Complete Blood Count */}
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="w-6 h-6" />
              Complete Blood Count
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">Hemoglobin</div>
                  {getStatusIcon(latestResult.hemoglobin, { min: 130, max: 170 })}
                </div>
                <div className={`text-2xl font-bold ${getStatusColor(latestResult.hemoglobin, { min: 130, max: 170 })}`}>
                  {formatValue(latestResult.hemoglobin)} g/dL
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">White Blood Cells</div>
                  {getStatusIcon(latestResult.leucocyte_count, { min: 4.0, max: 11.0 })}
                </div>
                <div className={`text-2xl font-bold ${getStatusColor(latestResult.leucocyte_count, { min: 4.0, max: 11.0 })}`}>
                  {formatValue(latestResult.leucocyte_count)} ×10⁹/L
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">Platelets</div>
                  {getStatusIcon(latestResult.platelets, { min: 150, max: 400 })}
                </div>
                <div className={`text-2xl font-bold ${getStatusColor(latestResult.platelets, { min: 150, max: 400 })}`}>
                  {formatValue(latestResult.platelets)} ×10⁹/L
                </div>
              </div>
            </div>
          </div>

          {/* Inflammation Markers */}
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Inflammation & Minerals
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">C-Reactive Protein</div>
                  {getStatusIcon(latestResult.c_reactive_protein, { min: 0, max: 3.0 })}
                </div>
                <div className={`text-2xl font-bold ${getStatusColor(latestResult.c_reactive_protein, { min: 0, max: 3.0 })}`}>
                  {formatValue(latestResult.c_reactive_protein)} mg/L
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">ESR</div>
                  {getStatusIcon(latestResult.esr, { min: 1, max: 20 })}
                </div>
                <div className={`text-2xl font-bold ${getStatusColor(latestResult.esr, { min: 1, max: 20 })}`}>
                  {formatValue(latestResult.esr)} mm/hr
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">Calcium</div>
                  {getStatusIcon(latestResult.calcium_adjusted, { min: 2.15, max: 2.55 })}
                </div>
                <div className={`text-2xl font-bold ${getStatusColor(latestResult.calcium_adjusted, { min: 2.15, max: 2.55 })}`}>
                  {formatValue(latestResult.calcium_adjusted)} mmol/L
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">Magnesium</div>
                  {getStatusIcon(latestResult.magnesium, { min: 0.7, max: 1.0 })}
                </div>
                <div className={`text-2xl font-bold ${getStatusColor(latestResult.magnesium, { min: 0.7, max: 1.0 })}`}>
                  {formatValue(latestResult.magnesium)} mmol/L
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6" />
              Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">{bloodResults.length}</div>
                <div className="text-sm text-gray-400">Total Tests</div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">
                  {latestResult.date ? new Date(latestResult.date).toLocaleDateString() : 'N/A'}
                </div>
                <div className="text-sm text-gray-400">Latest Test Date</div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">
                  {latestResult.is_abnormal ? '⚠️' : '✅'}
                </div>
                <div className="text-sm text-gray-400">Overall Status</div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <BarChart3 className="w-6 h-6" />
              Blood Results Trends
            </h2>
            <div className="space-y-8">
              {/* Hormone Balance Chart */}
              <HormoneBalanceChart athleteId={athleteId} />

              {/* Metabolic Health Chart */}
              <MetabolicHealthChart athleteId={athleteId} />

              {/* Inflammation Chart */}
              <InflammationChart athleteId={athleteId} />

              {/* Organ Function Chart */}
              <OrganFunctionChart athleteId={athleteId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { BloodResults };