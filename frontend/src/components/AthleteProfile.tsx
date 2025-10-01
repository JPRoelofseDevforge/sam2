import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  generateAlert,
  calculateReadinessScore,
  getGeneticInsights,
  getTeamAverage
} from '../utils/analytics';
import { Athlete, BiometricData, GeneticProfile, BodyComposition as BodyCompositionType } from '../types';
import { useIndividualAthleteData, useTeamData } from '../hooks/useAthleteData';
import { geneticProfileService } from '../services/dataService';
import { MetricCard } from './MetricCard';
import { AlertCard } from './AlertCard';
import { TrendChart } from './TrendChart';
import ScaleReport from './ScaleReport';
import { ArrowLeft } from 'lucide-react';
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
import { ChatWithAI } from './ChatWithAI';
import { HormoneBalanceChart } from './HormoneBalanceChart';
import { HeartRateTrendChart } from './HeartRateTrendChart';
import { SleepMetricsChart } from './SleepMetricsChart';
import { TrainingLoadChart } from './TrainingLoadChart';
import { filterValidBiometricData, sortBiometricDataByDate, getLatestBiometricRecord, getSortedBiometricDataForCharts } from '../utils/athleteUtils';

// Helper function to get field values with multiple possible names
const getFieldValue = (marker: any, fieldName: string): string => {
  const possibleNames = [
    fieldName,
    fieldName.toLowerCase(),
    fieldName.toUpperCase(),
    fieldName.charAt(0).toUpperCase() + fieldName.slice(1).toLowerCase(),
    fieldName.charAt(0).toLowerCase() + fieldName.slice(1).toUpperCase()
  ];

  for (const name of possibleNames) {
    if (marker[name]) return marker[name];
  }
  return '';
};

// Genetic Search and Filter Component
const GeneticSearchAndFilter: React.FC<{
  geneticSummary: any[];
  onFilteredResults: (results: any[]) => void;
}> = ({ geneticSummary, onFilteredResults }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedImpact, setSelectedImpact] = useState('all');
  const [sortBy, setSortBy] = useState('gene');

  const categories = Array.from(new Set(geneticSummary.map((g: any) => getFieldValue(g, 'category'))));

  useEffect(() => {
    // First, deduplicate the genetic summary data
    const uniqueMarkers = geneticSummary.reduce((acc, marker: any) => {
      // Use the correct DbsnpRsId field as primary key
      const dbsnpField = marker.DbsnpRsId || '';
      const rsidField = marker.RSID || marker.rsid || marker.RSID || '';
      const geneField = marker.Gene || marker.gene || marker.GENE || '';
      const genotypeField = marker.GeneticCall || marker.genetic_call || marker.GENETIC_CALL || marker.Genotype || marker.genotype || '';

      // Prioritize DbsnpRsId as the unique key
      const key = dbsnpField || rsidField || `${geneField}_${genotypeField || 'unknown'}`;
      if (!acc.has(key)) {
        acc.set(key, marker);
      }
      return acc;
    }, new Map());

    let filtered = Array.from(uniqueMarkers.values());

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((marker: any) =>
        getFieldValue(marker, 'gene').toLowerCase().includes(searchTerm.toLowerCase()) ||
        getFieldValue(marker, 'dbsnp_rs_id').toLowerCase().includes(searchTerm.toLowerCase()) ||
        getFieldValue(marker, 'rsid').toLowerCase().includes(searchTerm.toLowerCase()) ||
        getFieldValue(marker, 'genetic_call').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((marker: any) => getFieldValue(marker, 'category') === selectedCategory);
    }

    // Apply impact filter
    if (selectedImpact !== 'all') {
      if (selectedImpact === 'high') {
        filtered = filtered.filter((marker: any) => {
          const genotype = getFieldValue(marker, 'genetic_call');
          return genotype.includes('AA') || genotype.includes('GG') || genotype.includes('TT') || genotype.includes('CC');
        });
      } else if (selectedImpact === 'medium') {
        filtered = filtered.filter((marker: any) => {
          const genotype = getFieldValue(marker, 'genetic_call');
          return genotype.includes('AG') || genotype.includes('CT') || genotype.includes('AC');
        });
      }
    }

    // Apply sorting
    filtered.sort((a: any, b: any) => {
      switch (sortBy) {
        case 'gene':
          return getFieldValue(a, 'gene').localeCompare(getFieldValue(b, 'gene'));
        case 'dbsnp':
          return getFieldValue(a, 'dbsnp_rs_id').localeCompare(getFieldValue(b, 'dbsnp_rs_id'));
        case 'category':
          return getFieldValue(a, 'category').localeCompare(getFieldValue(b, 'category'));
        case 'rsid':
          return getFieldValue(a, 'rsid').localeCompare(getFieldValue(b, 'rsid'));
        default:
          return 0;
      }
    });

    onFilteredResults(filtered);
  }, [searchTerm, selectedCategory, selectedImpact, sortBy, geneticSummary, onFilteredResults]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Search */}
      <div className="lg:col-span-2">
        <div className="relative">
          <input
            type="text"
            placeholder="Search genes, dbSNP RSID, or RSID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
          />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
        </div>
      </div>

      {/* Category Filter */}
      <select
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
      >
        <option value="all">All Categories</option>
        {categories.map(category => (
          <option key={category} value={category}>{category.replace('_', ' ')}</option>
        ))}
      </select>

      {/* Impact Filter */}
      <select
        value={selectedImpact}
        onChange={(e) => setSelectedImpact(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
      >
        <option value="all">All Impact Levels</option>
        <option value="high">High Impact</option>
        <option value="medium">Medium Impact</option>
      </select>

      {/* Sort By */}
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
      >
        <option value="gene">Sort by Gene</option>
        <option value="dbsnp">Sort by dbSNP RSID</option>
        <option value="category">Sort by Category</option>
        <option value="rsid">Sort by RSID</option>
      </select>
    </div>
  );
};

// Genetic Analysis Tabs Component
const GeneticAnalysisTabs: React.FC<{
  geneticSummary: any[];
  athlete: any;
  athleteBiometrics: any[];
}> = ({ geneticSummary, athlete, athleteBiometrics }) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'detailed' | 'insights' | 'performance'>('overview');

  const subTabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'detailed', label: 'Detailed Analysis', icon: '🔬' },
    { id: 'insights', label: 'Smart Insights', icon: '💡' },
    { id: 'performance', label: 'Performance Matrix', icon: '🎯' }
  ];

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {subTabs.map((tab) => {
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sub-tab Content */}
      {activeSubTab === 'overview' && <GeneticOverviewTab geneticSummary={geneticSummary} />}
      {activeSubTab === 'detailed' && <GeneticDetailedTab geneticSummary={geneticSummary} />}
      {activeSubTab === 'insights' && <GeneticInsightsTab geneticSummary={geneticSummary} athlete={athlete} />}
      {activeSubTab === 'performance' && <GeneticPerformanceTab geneticSummary={geneticSummary} athleteBiometrics={athleteBiometrics} />}
    </div>
  );
};

// Overview Tab Component
const GeneticOverviewTab: React.FC<{ geneticSummary: any[] }> = ({ geneticSummary }) => {
  const categories = Array.from(new Set(geneticSummary.map((g: any) => g.Category || g.category || g.CATEGORY)));

  return (
    <div className="space-y-6">
      {/* Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => {
          const categoryMarkers = geneticSummary.filter((g: any) => (g.Category || g.category || g.CATEGORY) === category);
          const categoryColors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
            'performance': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: '💪' },
            'recovery': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: '🔄' },
            'pharmacogenomics': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', icon: '💊' },
            'nutrigenomics': { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', icon: '🥗' },
            'injury': { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: '🛡️' },
            'metabolism': { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', icon: '⚡' },
            'cognition': { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-800', icon: '🧠' },
            'sleep': { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-800', icon: '😴' }
          };

          const colors = categoryColors[category.toLowerCase()] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800', icon: '🧬' };

          return (
            <div key={category} className={`card-enhanced p-6 ${colors.bg} ${colors.border} border`}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{colors.icon}</span>
                <div>
                  <h3 className={`text-lg font-semibold capitalize ${colors.text}`}>
                    {category.replace('_', ' ')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {categoryMarkers.length} marker{categoryMarkers.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {categoryMarkers.slice(0, 3).map((marker, index) => {
                  const gene = marker.Gene || marker.gene || marker.GENE || 'Unknown';
                  const dbsnpId = marker.DbsnpRsId || 'N/A';
                  const rsid = marker.RSID || marker.rsid || marker.RSID || null;

                  return (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded-lg">
                      <div>
                        <div className={`font-semibold ${colors.text} text-sm`}>{gene}</div>
                        <div className="text-xs text-gray-500 font-mono">{dbsnpId}</div>
                      </div>
                      {rsid && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {rsid}
                        </span>
                      )}
                    </div>
                  );
                })}
                {categoryMarkers.length > 3 && (
                  <div className="text-center text-xs text-gray-500 py-2">
                    +{categoryMarkers.length - 3} more markers
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Detailed Analysis Tab Component
const GeneticDetailedTab: React.FC<{ geneticSummary: any[] }> = ({ geneticSummary }) => {
  return (
    <div className="card-enhanced p-6">
      <h3 className="text-xl font-semibold mb-6 flex items-center gap-3 text-gray-900">
        <span className="bg-gradient-to-r from-green-100 to-blue-100 p-2 rounded-full text-green-700">📋</span>
        Detailed Genetic Analysis
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Gene</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">dbSNP RSID</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Category</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">RSID</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Impact</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Details</th>
            </tr>
          </thead>
          <tbody>
            {geneticSummary.map((marker, index) => {
              const gene = marker.Gene || marker.gene || marker.GENE || 'Unknown';
              const dbsnpId = marker.DbsnpRsId || 'N/A';
              const category = marker.Category || marker.category || marker.CATEGORY || 'Unknown';
              const rsid = marker.RSID || marker.rsid || marker.RSID || 'N/A';

              const getImpactLevel = (dbsnpId: string) => {
                // For now, we'll use a simple heuristic based on the RSID format
                if (dbsnpId.startsWith('rs') && dbsnpId.length > 5) {
                  return { level: 'Standard', color: 'text-blue-600', bg: 'bg-blue-100' };
                }
                return { level: 'Standard', color: 'text-blue-600', bg: 'bg-blue-100' };
              };

              const impact = getImpactLevel(dbsnpId);

              return (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{gene}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`font-mono font-bold ${impact.color}`}>{dbsnpId}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${impact.bg} ${impact.color}`}>
                      {category.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-gray-600 text-xs">{rsid}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${impact.bg} ${impact.color}`}>
                      {impact.level} Impact
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {marker.Description && (
                      <div className="text-xs text-gray-600 max-w-xs truncate" title={marker.Description}>
                        {marker.Description}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Smart Insights Tab Component
const GeneticInsightsTab: React.FC<{ geneticSummary: any[]; athlete: any }> = ({ geneticSummary, athlete }) => {
  // Helper function to get field values with multiple possible names
  const getFieldValue = (marker: any, fieldName: string): string => {
    // Special handling for DbsnpRsId field
    if (fieldName === 'dbsnp_rs_id') {
      return marker.DbsnpRsId || marker.dbsnp_rs_id || marker.DBSNP_RS_ID || marker.dbsnpRsId || marker.dbSNPRSID || '';
    }
  
    // For other fields, try multiple variations
    const possibleNames = [
      fieldName,
      fieldName.toLowerCase(),
      fieldName.toUpperCase(),
      fieldName.charAt(0).toUpperCase() + fieldName.slice(1).toLowerCase(),
      fieldName.charAt(0).toLowerCase() + fieldName.slice(1).toUpperCase()
    ];
  
    for (const name of possibleNames) {
      if (marker[name]) return marker[name];
    }
    return '';
  };

  // Analyze genetic data for insights
   const geneticInsights = geneticSummary.map((marker: any) => {
     const gene = getFieldValue(marker, 'gene') || 'Unknown';
     const genotype = getFieldValue(marker, 'genetic_call') || '';
     const dbsnpId = marker.DbsnpRsId || '';

     return {
       gene,
       genotype,
       dbsnpId,
       marker
     };
   }).filter(insight => insight.gene !== 'Unknown');

  // Categorize insights
  const powerGenes = geneticInsights.filter(insight =>
    ['ACTN3', 'MSTN', 'IGF1'].includes(insight.gene) &&
    insight.genotype.includes('RR')
  );

  const enduranceGenes = geneticInsights.filter(insight =>
    insight.gene === 'ACE' && insight.genotype.includes('II')
  );

  const injuryRiskGenes = geneticInsights.filter(insight =>
    insight.gene === 'COL5A1' && !insight.genotype.includes('TT')
  );

  return (
    <div className="space-y-6">
      {/* Key Insights */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card-enhanced p-6">
          <h4 className="font-semibold text-green-700 mb-4 flex items-center gap-2">
            <span className="bg-green-100 p-1.5 rounded-full text-green-700">✅</span>
            Genetic Strengths ({powerGenes.length + enduranceGenes.length} found)
          </h4>
          <div className="space-y-3">
            {powerGenes.map((insight, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="text-green-600 mt-0.5">💪</span>
                <div>
                  <div className="font-medium text-green-800">Elite Power Genetics</div>
                  <div className="text-sm text-green-600">
                    {insight.gene} {insight.genotype} genotype suggests exceptional sprint and strength capacity
                    {insight.dbsnpId && ` (${insight.dbsnpId})`}
                  </div>
                </div>
              </div>
            ))}

            {enduranceGenes.map((insight, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-blue-600 mt-0.5">🏃</span>
                <div>
                  <div className="font-medium text-blue-800">Superior Endurance Capacity</div>
                  <div className="text-sm text-blue-600">
                    {insight.gene} {insight.genotype} genotype indicates excellent cardiovascular efficiency
                    {insight.dbsnpId && ` (${insight.dbsnpId})`}
                  </div>
                </div>
              </div>
            ))}

            {geneticInsights.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No genetic data available for analysis
              </div>
            )}

            {geneticInsights.length > 0 && powerGenes.length === 0 && enduranceGenes.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No specific genetic advantages identified in current markers
              </div>
            )}
          </div>
        </div>

        <div className="card-enhanced p-6">
          <h4 className="font-semibold text-orange-700 mb-4 flex items-center gap-2">
            <span className="bg-orange-100 p-1.5 rounded-full text-orange-700">⚠️</span>
            Optimization Areas ({injuryRiskGenes.length} found)
          </h4>
          <div className="space-y-3">
            {injuryRiskGenes.map((insight, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <span className="text-red-600 mt-0.5">🛡️</span>
                <div>
                  <div className="font-medium text-red-800">Injury Risk Consideration</div>
                  <div className="text-sm text-red-600">
                    {insight.gene} {insight.genotype} variant suggests higher soft tissue injury risk
                    {insight.dbsnpId && ` (${insight.dbsnpId})`}
                  </div>
                </div>
              </div>
            ))}

            {geneticInsights.length > 0 && injuryRiskGenes.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No specific injury risk markers identified
              </div>
            )}

            {geneticInsights.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No genetic data available for analysis
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Genetic Markers Summary */}
      {geneticInsights.length > 0 && (
        <div className="card-enhanced p-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="bg-blue-100 p-1.5 rounded-full text-blue-700">📋</span>
            Genetic Markers Summary ({geneticInsights.length} markers)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {geneticInsights.slice(0, 6).map((insight, idx) => (
              <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-800">{insight.gene}</span>
                  <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                    {insight.dbsnpId || 'No RSID'}
                  </span>
                </div>
                <div className="text-sm font-mono text-gray-700">{insight.genotype}</div>
              </div>
            ))}
            {geneticInsights.length > 6 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                +{geneticInsights.length - 6} more markers
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Performance Matrix Tab Component
const GeneticPerformanceTab: React.FC<{ geneticSummary: any[]; athleteBiometrics: any[] }> = ({ geneticSummary, athleteBiometrics }) => {
  const performanceCategories = [
    {
      trait: 'Power & Strength',
      genes: geneticSummary.filter((m: any) => ['ACTN3', 'MSTN', 'IGF1'].includes(m.Gene || m.gene || m.GENE)),
      icon: '💪',
      color: 'orange',
      description: 'Explosive power & muscle strength'
    },
    {
      trait: 'Endurance',
      genes: geneticSummary.filter((m: any) => ['ACE', 'PPARA', 'PPARGC1A'].includes(m.Gene || m.gene || m.GENE)),
      icon: '🏃',
      color: 'blue',
      description: 'Cardiovascular efficiency'
    },
    {
      trait: 'Recovery',
      genes: geneticSummary.filter((m: any) => ['PPARA', 'BDNF', 'COMT'].includes(m.Gene || m.gene || m.GENE)),
      icon: '🔄',
      color: 'green',
      description: 'Recovery & adaptation rate'
    },
    {
      trait: 'Injury Risk',
      genes: geneticSummary.filter((m: any) => ['COL5A1', 'ADRB2'].includes(m.Gene || m.gene || m.GENE)),
      icon: '🛡️',
      color: 'red',
      description: 'Injury susceptibility'
    },
    {
      trait: 'Metabolism',
      genes: geneticSummary.filter((m: any) => ['PPARGC1A', 'PPARA', 'FTO'].includes(m.Gene || m.gene || m.GENE)),
      icon: '⚡',
      color: 'yellow',
      description: 'Energy & nutrient metabolism'
    },
    {
      trait: 'Cognition',
      genes: geneticSummary.filter((m: any) => ['BDNF', 'COMT'].includes(m.Gene || m.gene || m.GENE)),
      icon: '🧠',
      color: 'indigo',
      description: 'Mental performance & stress'
    }
  ];

  return (
    <div className="card-enhanced p-6">
      <h3 className="text-xl font-semibold mb-6 flex items-center gap-3 text-gray-900">
        <span className="bg-gradient-to-r from-purple-100 to-blue-100 p-2 rounded-full text-purple-700">🎯</span>
        Genetic Performance Matrix
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {performanceCategories.map((category, idx) => (
          <div key={idx} className="card-enhanced p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{category.icon}</span>
              <div>
                <h4 className="font-semibold text-gray-900">{category.trait}</h4>
                <p className="text-xs text-gray-500">{category.description}</p>
              </div>
            </div>

            <div className="text-center mb-4">
              <div className={`text-3xl font-bold text-${category.color}-600`}>
                {category.genes.length}
              </div>
              <div className="text-sm text-gray-600">Genetic Markers</div>
            </div>

            {category.genes.length > 0 && (
              <div className="space-y-2">
                {category.genes.map((gene, geneIdx) => (
                  <div key={geneIdx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                    <span className="font-medium text-gray-700">{gene.Gene || gene.gene || gene.GENE}</span>
                    <span className={`font-bold text-${category.color}-600 font-mono`}>
                      {gene.DbsnpRsId || 'N/A'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {category.genes.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                No markers in this category
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const AthleteProfile: React.FC = () => {
  
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const athleteId = parseInt(id || '0');
       const [activeTab, setActiveTab] = useState<'metrics' | 'trends' | 'insights' | 'digitalTwin' | 'trainingLoad' | 'recoveryTimeline' | 'pharmacogenomics' | 'nutrigenomics' | 'recoveryGenes' | 'predictive' | 'sleep' | 'stress' | 'weather' | 'scaleReport' | 'bloodResults' | 'circadian' | 'chatAI' | 'geneticSummary'>('metrics');
     const tabContentRef = useRef<HTMLDivElement>(null);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null); // For dynamic labels
   const [geneticSummary, setGeneticSummary] = useState<any[]>([]);
   const [filteredGeneticSummary, setFilteredGeneticSummary] = useState<any[]>([]);

  // Use custom hooks for data fetching
  const { athlete, biometricData: athleteBiometrics, geneticProfiles: athleteGenetics, loading: dataLoading } = useIndividualAthleteData(athleteId, true);
  const { biometricData: allBiometricData } = useTeamData(true);

  // Fetch genetic summary data
  useEffect(() => {
    const fetchGeneticSummary = async () => {
      try {
        const summaryData = await geneticProfileService.getGeneticSummaryByAthlete(athleteId);

        // Debug: Log the actual field names in the data
         if (summaryData.length > 0) {
           console.log('🔍 DEBUG: Genetic summary data sample:', summaryData[0]);
           console.log('🔍 DEBUG: Available fields:', Object.keys(summaryData[0]));
           console.log('🔍 DEBUG: All data samples:', summaryData.slice(0, 3));
           console.log('🔍 DEBUG: Data length:', summaryData.length);

           // Try to find dbSNP-like fields
           const firstItem = summaryData[0];
           const possibleDbsnpFields = Object.keys(firstItem).filter(key =>
             key.toLowerCase().includes('dbsnp') ||
             key.toLowerCase().includes('rsid') ||
             key.toLowerCase().includes('snp') ||
             key.toLowerCase().includes('reference')
           );
           console.log('🔍 DEBUG: Possible dbSNP fields found:', possibleDbsnpFields);

           // Specifically check for DbsnpRsId field
           console.log('🔍 DEBUG: DbsnpRsId field exists:', firstItem.hasOwnProperty('DbsnpRsId'));
           if (firstItem.DbsnpRsId) {
             console.log('🔍 DEBUG: DbsnpRsId sample values:', summaryData.slice(0, 3).map(item => item.DbsnpRsId));
           }

           // Show sample values for potential fields
           possibleDbsnpFields.forEach(field => {
             console.log(`🔍 DEBUG: ${field} sample values:`, summaryData.slice(0, 3).map(item => item[field]));
           });
         }

        setGeneticSummary(summaryData);
        setFilteredGeneticSummary(summaryData); // Initialize filtered results
      } catch (error) {
        console.error('Failed to fetch genetic summary:', error);
      }
    };

    if (athleteId) {
      fetchGeneticSummary();
    }
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
          onClick={() => navigate('/')}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          ← Back to Team Overview
        </button>
      </div>
    );
  }

  const alert = generateAlert(athlete?.athlete_id || athleteId.toString(), athleteBiometrics, athleteGenetics);

  // Process biometric data using utility functions
  console.log(`🔍 DEBUG: Processing ${athleteBiometrics.length} biometric records for athlete ${athleteId}`);
  const validBiometricData = filterValidBiometricData(athleteBiometrics);
  console.log(`🔍 DEBUG: Filtered to ${validBiometricData.length} valid biometric records`);

  const latest = getLatestBiometricRecord(validBiometricData);
  console.log('🔍 DEBUG: Latest Biometric Record date:', latest?.date);

  const sortedBiometricData = getSortedBiometricDataForCharts(athleteBiometrics);
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
    { id: 'insights' as const, label: 'Predictive Insights', icon: '🧠', count: geneticSummary.length > 0 ? geneticSummary.length : geneticInsights.length },
    { id: 'geneticSummary' as const, label: 'Genetic Summary', icon: '🧬', count: filteredGeneticSummary.length },
    { id: 'scaleReport' as const, label: 'Scale Report', icon: '⚖️', count: 1 },
    { id: 'digitalTwin' as const, label: 'Digital Twin', icon: '🌐', count: 1 },
    { id: 'trainingLoad' as const, label: 'Training Load', icon: '🔥', count: athleteBiometrics.length },
    { id: 'recoveryTimeline' as const, label: 'Recovery Timeline', icon: '📅', count: athleteBiometrics.length },
    { id: 'pharmacogenomics' as const, label: 'Pharmacogenomics', icon: '💊', count: geneticSummary.filter(g => g.category === 'pharmacogenomics').length || athleteGenetics.length },
    { id: 'nutrigenomics' as const, label: 'Nutrigenomics', icon: '🥗', count: geneticSummary.filter(g => g.category === 'nutrigenomics').length || athleteGenetics.length },
    { id: 'recoveryGenes' as const, label: 'Recovery Genes', icon: '🧬', count: geneticSummary.filter(g => g.category === 'recovery').length || athleteGenetics.length },
    { id: 'sleep' as const, label: 'Sleep Metrics', icon: '🌙', count: athleteBiometrics.length },
    { id: 'stress' as const, label: 'Stress Management', icon: '🧘', count: athleteBiometrics.length },
    { id: 'weather' as const, label: 'Weather Impact', icon: '🌤️', count: 1 },
    { id: 'chatAI' as const, label: 'Chat With AI', icon: '🤖', count: 1 }
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
            onClick={() => navigate('/')}
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
            {geneticSummary.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {geneticSummary.slice(0, 10).map((summary, index) => (
                    <div key={index} className="text-sm text-gray-700">
                      <strong>{summary.Gene || summary.gene || 'Unknown'}:</strong> {summary.GeneticCall || summary.genetic_call || 'Unknown'}
                      <div className="text-xs text-gray-500">{summary.Category || summary.category || 'Unknown'}</div>
                    </div>
                  ))}
                </div>
                {geneticSummary.length > 10 && (
                  <div className="text-xs text-gray-500 mt-2">
                    Showing top 10 of {geneticSummary.length} genetic markers
                  </div>
                )}
              </>
            ) : Object.entries(geneticDict).length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(geneticDict).slice(0, 10).map(([gene, genotype], index) => (
                    <div key={gene} className="text-sm text-gray-700">
                      <strong>{gene || 'Unknown'}:</strong> {genotype || 'Unknown'}
                    </div>
                  ))}
                </div>
                {Object.entries(geneticDict).length > 10 && (
                  <div className="text-xs text-gray-500 mt-2">
                    Showing top 10 of {Object.entries(geneticDict).length} genes
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-gray-500">No genetic data available</div>
            )}
          </div>
          
          <div className="text-center">
            <div className="text-4xl font-bold mb-2 text-gray-900">
              {latest ? `${readinessScore.toFixed(0)}%` : 'N/A'}
            </div>
            <div className="text-gray-600">Readiness Score</div>
            <div className="text-sm text-gray-500 mt-1">
              {latest ? 'Based on HRV, RHR, Sleep & SpO₂' : 'No biometric data available'}
            </div>
          </div>
        </div>
      </div>

      {/* Current Alert */}
      {/* <AlertCard alert={alert} /> */}

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

        {activeTab === 'metrics' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
              <h2 className="text-2xl font-bold text-white">📊 Current Readiness Metrics</h2>
              {latest && (
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
                  <span className={`w-2 h-2 rounded-full ${readinessScore > 75 ? 'bg-green-500' : readinessScore > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                  {athlete.name.split(' ')[0]} is{' '}
                  {readinessScore > 75 ? 'ready' : readinessScore > 50 ? 'recovering' : 'fatigued'}
                </div>
              )}
            </div>

            {latest ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {/* HRV */}
                  <MetricCard
                    title="HRV (Night)"
                    value={latest.hrv_night || 0}
                    unit="ms"
                    icon="❤️"
                    subtitle={readinessScore > 75 ? "Excellent recovery" : "Moderate recovery"}
                    trend={readinessScore > 75 ? "up" : "down"}
                    data={sortedBiometricData.slice(-7).map(d => ({ date: d.date, value: d.hrv_night || 0 }))}
                    teamAverage={getTeamAverage('hrv_night', athlete?.athlete_id || '', allBiometricData)}
                    goalValue={50}
                    goalLabel="Target"
                  />

                  {/* Resting HR */}
                  <MetricCard
                    title="Resting HR (Sleeping HR)"
                    value={latest.resting_hr || 0}
                    unit="bpm"
                    icon="❤️"
                    subtitle={(latest.resting_hr || 0) < 60 ? "Optimal" : (latest.resting_hr || 0) < 65 ? "Good" : "Elevated"}
                    trend={(latest.resting_hr || 0) < 60 ? "up" : "down"}
                    data={sortedBiometricData.slice(-7).map(d => ({ date: d.date, value: d.resting_hr || 0 }))}
                    teamAverage={getTeamAverage('resting_hr', athlete?.athlete_id || '', allBiometricData)}
                    goalValue={60}
                    goalLabel="Ideal"
                  />

                  {/* Average Heart Rate */}
                  <MetricCard
                    title="Avg Heart Rate"
                    value={latest.avg_heart_rate || 0}
                    unit="bpm"
                    icon="❤️"
                    subtitle={(latest.avg_heart_rate || 0) < 60 ? "Optimal" : (latest.avg_heart_rate || 0) < 65 ? "Good" : "Elevated"}
                    trend={(latest.avg_heart_rate || 0) < 60 ? "up" : "down"}
                    data={sortedBiometricData.slice(-7).map(d => ({ date: d.date, value: d.avg_heart_rate || 0 }))}
                    teamAverage={getTeamAverage('avg_heart_rate', athlete?.athlete_id || '', allBiometricData)}
                    goalValue={60}
                    goalLabel="Target"
                  />

                  {/* Deep Sleep */}
                  <MetricCard
                    title="Deep Sleep"
                    value={latest.deep_sleep_pct || 0}
                    unit="%"
                    icon="💤"
                    subtitle={(latest.deep_sleep_pct || 0) > 20 ? "Restorative" : "Low"}
                    trend={(latest.deep_sleep_pct || 0) > 20 ? "up" : "down"}
                    data={sortedBiometricData.slice(-7).map(d => ({ date: d.date, value: d.deep_sleep_pct || 0 }))}
                    teamAverage={getTeamAverage('deep_sleep_pct', athlete?.athlete_id || '', allBiometricData)}
                    goalValue={20}
                    goalLabel="Min"
                  />

                  {/* REM Sleep */}
                  <MetricCard
                    title="REM Sleep"
                    value={latest.rem_sleep_pct || 0}
                    unit="%"
                    icon="🧠"
                    subtitle={(latest.rem_sleep_pct || 0) > 18 ? "Cognitive recovery" : "Below ideal"}
                    trend={(latest.rem_sleep_pct || 0) > 18 ? "up" : "down"}
                    data={sortedBiometricData.slice(-7).map(d => ({ date: d.date, value: d.rem_sleep_pct || 0 }))}
                    teamAverage={getTeamAverage('rem_sleep_pct', athlete?.athlete_id || '', allBiometricData)}
                    goalValue={18}
                    goalLabel="Target"
                  />

                  {/* Sleep Duration */}
                  <MetricCard
                    title="Sleep Duration"
                    value={latest.sleep_duration_h || 0}
                    unit="h"
                    icon="🌙"
                    subtitle={(latest.sleep_duration_h || 0) >= 7 ? "Adequate" : "Short"}
                    trend={(latest.sleep_duration_h || 0) >= 7 ? "up" : "down"}
                    data={sortedBiometricData.slice(-7).map(d => ({ date: d.date, value: d.sleep_duration_h || 0 }))}
                    teamAverage={getTeamAverage('sleep_duration_h', athlete?.athlete_id || '', allBiometricData)}
                    goalValue={7}
                    goalLabel="Recommended"
                  />

                  {/* SpO₂ */}
                  <MetricCard
                    title="SpO₂ (Night)"
                    value={latest.spo2_night || 0}
                    unit="%"
                    icon="🫁"
                    subtitle={(latest.spo2_night || 0) > 96 ? "Normal" : "Monitor"}
                    trend={(latest.spo2_night || 0) > 96 ? "up" : "down"}
                    data={sortedBiometricData.slice(-7).map(d => ({ date: d.date, value: d.spo2_night || 0 }))}
                    teamAverage={getTeamAverage('spo2_night', athlete?.athlete_id || '', allBiometricData)}
                    goalValue={96}
                    goalLabel="Healthy"
                  />

                  {/* Respiratory Rate */}
                  <MetricCard
                    title="Respiratory Rate"
                    value={latest.resp_rate_night || 0}
                    unit="/min"
                    icon="🌬️"
                    subtitle={(latest.resp_rate_night || 0) <= 16 ? "Normal" : "Elevated"}
                    trend={(latest.resp_rate_night || 0) <= 16 ? "up" : "down"}
                    data={sortedBiometricData.slice(-7).map(d => ({ date: d.date, value: d.resp_rate_night || 0 }))}
                    teamAverage={getTeamAverage('resp_rate_night', athlete?.athlete_id || '', allBiometricData)}
                    goalValue={16}
                    goalLabel="Max"
                  />

                  {/* Body Temp */}
                  <MetricCard
                    title="Body Temp"
                    value={latest.temp_trend_c || 0}
                    unit="°C"
                    icon="🌡️"
                    subtitle={Math.abs((latest.temp_trend_c || 0) - 36.8) < 0.3 ? "Stable" : "Elevated"}
                    trend={Math.abs((latest.temp_trend_c || 0) - 36.8) < 0.3 ? "up" : "down"}
                    data={sortedBiometricData.slice(-7).map(d => ({ date: d.date, value: d.temp_trend_c || 0 }))}
                    teamAverage={getTeamAverage('temp_trend_c', athlete?.athlete_id || '', allBiometricData)}
                    goalValue={36.8}
                    goalLabel="Normal"
                  />

                  {/* Training Load */}
                  <MetricCard
                    title="Training Load"
                    value={latest.training_load_pct || 0}
                    unit="%"
                    icon="💪"
                    subtitle={(latest.training_load_pct || 0) > 85 ? "High" : "Moderate"}
                    trend="neutral"
                    data={sortedBiometricData.slice(-7).map(d => ({ date: d.date, value: d.training_load_pct || 0 }))}
                    teamAverage={getTeamAverage('training_load_pct', athlete?.athlete_id || '', allBiometricData)}
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
              </>
            ) : (
              <div className="text-center py-12 card-enhanced rounded-xl">
                <p className="text-gray-600 mb-2">📊 No biometric data available</p>
                <p className="text-sm text-gray-500">
                  Biometric data is required to display readiness metrics. Please ensure wearable data is being collected and synced.
                </p>
              </div>
            )}
          </div>
        )}


        {activeTab === 'circadian' && (
          <CircadianRhythm
            biometricData={athleteBiometrics}
            geneticData={athleteGenetics}
            athleteId={athleteId.toString()}
          />
        )}

        {activeTab === 'trends' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Performance Trends</h2>
            {athleteBiometrics.length >= 2 ? (
              <TrendChart data={athleteBiometrics.map(d => ({
                ...d,
                hrv_night: d.hrv_night || 0,
                resting_hr: d.resting_hr || 0,
                spo2_night: d.spo2_night || 0,
                resp_rate_night: d.resp_rate_night || 0,
                deep_sleep_pct: d.deep_sleep_pct || 0,
                rem_sleep_pct: d.rem_sleep_pct || 0,
                light_sleep_pct: d.light_sleep_pct || 0,
                sleep_duration_h: d.sleep_duration_h || 0,
                temp_trend_c: d.temp_trend_c || 0,
                training_load_pct: d.training_load_pct || 0
              }))} />
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
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white-900 mb-2">🧠 Advanced Predictive Insights</h2>
              <p className="text-gray-600 text-lg">
                AI-powered analysis combining {geneticSummary.length} genetic markers with biometric trends
              </p>
            </div>

            {/* Executive Summary Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="card-enhanced p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{geneticSummary.length}</div>
                <div className="text-sm text-gray-600">Genetic Markers</div>
                <div className="text-xs text-gray-500 mt-1">Analyzed</div>
              </div>
              <div className="card-enhanced p-6 text-center">
                <div className={`text-3xl font-bold mb-2 ${
                  readinessScore > 75 ? 'text-green-600' :
                  readinessScore > 50 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {readinessScore.toFixed(0)}%
                </div>
                <div className="text-sm text-gray-600">Current Readiness</div>
                <div className="text-xs text-gray-500 mt-1">Based on biometrics</div>
              </div>
              <div className="card-enhanced p-6 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {geneticInsights.length > 0 ? geneticInsights.length : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Key Genetic Insights</div>
                <div className="text-xs text-gray-500 mt-1">Performance factors</div>
              </div>
              <div className="card-enhanced p-6 text-center">
                <div className="text-3xl font-bold text-indigo-600 mb-2">
                  {athleteBiometrics.length}
                </div>
                <div className="text-sm text-gray-600">Biometric Records</div>
                <div className="text-xs text-gray-500 mt-1">Historical data</div>
              </div>
            </div>

            {/* Current Status Analysis */}
            <section className="card-enhanced p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-3 text-black">
                <span className="bg-purple-100 p-2 rounded-full text-purple-700">🔍</span>
                Current Status Analysis
              </h3>
              <AlertCard alert={alert} />
            </section>

            {/* Advanced Genetic Analysis */}
            <section className="card-enhanced p-6">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-3 text-black" >
                <span className="bg-green-100 p-2 rounded-full text-black-700">🧬</span>
                Advanced Genetic Performance Analysis
              </h3>

              {geneticSummary.length > 0 ? (
                <div className="space-y-6">
                  {/* Genetic Performance Profile */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Performance Genetics */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Performance Genetics</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Power Performance */}
                        <div className="card-enhanced p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h5 className="font-semibold text-gray-900 flex items-center gap-2">
                              <span className="text-xl">💪</span>
                              Power Performance
                            </h5>
                            <span className={`text-sm px-2 py-1 rounded-full ${
                              geneticSummary.filter(m => ['ACTN3', 'ACE', 'PPARGC1A', 'MSTN', 'IGF1', 'NOS3', 'BDKRB2'].includes(m.Gene || m.gene)).length > 0
                                ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {geneticSummary.filter(m => ['ACTN3', 'ACE', 'PPARGC1A', 'MSTN', 'IGF1', 'NOS3', 'BDKRB2'].includes(m.Gene || m.gene)).length} markers
                            </span>
                          </div>

                          <div className="space-y-4">
                            {/* ACTN3 - Sprint and Power */}
                            {geneticSummary.filter(m => m.Gene === 'ACTN3').map((marker, idx) => {
                              const genotype = marker.GeneticCall || marker.genetic_call;
                              const isPowerGenotype = genotype?.includes('RR');

                              return (
                                <div key={idx} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium text-orange-800">ACTN3 (Sprint/Power)</span>
                                    <span className={`font-bold ${isPowerGenotype ? 'text-orange-600' : 'text-gray-500'}`}>
                                      {genotype}
                                    </span>
                                  </div>
                                  <div className="w-full bg-orange-200 rounded-full h-2 mb-2">
                                    <div className={`h-2 rounded-full transition-all duration-300 ${
                                      isPowerGenotype ? 'bg-orange-500' : 'bg-orange-300'
                                    }`} style={{ width: isPowerGenotype ? '100%' : '60%' }}></div>
                                  </div>
                                  <p className="text-xs text-orange-700">
                                    {isPowerGenotype
                                      ? 'Elite power athlete genetics - exceptional sprint and strength capacity'
                                      : 'Standard power capacity - focus on technique and explosive training'
                                    }
                                  </p>
                                </div>
                              );
                            })}

                            {/* ACE - Power vs Endurance */}
                            {geneticSummary.filter(m => m.Gene === 'ACE').map((marker, idx) => {
                              const genotype = marker.GeneticCall || marker.genetic_call;
                              const isPowerGenotype = genotype?.includes('DD');

                              return (
                                <div key={idx} className="p-3 bg-red-50 rounded-lg border border-red-200">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium text-red-800">ACE (Power/Endurance)</span>
                                    <span className={`font-bold ${isPowerGenotype ? 'text-red-600' : 'text-blue-600'}`}>
                                      {genotype}
                                    </span>
                                  </div>
                                  <div className="w-full bg-red-200 rounded-full h-2 mb-2">
                                    <div className={`h-2 rounded-full transition-all duration-300 ${
                                      isPowerGenotype ? 'bg-red-500' : 'bg-blue-500'
                                    }`} style={{ width: isPowerGenotype ? '85%' : '90%' }}></div>
                                  </div>
                                  <p className="text-xs text-red-700">
                                    {isPowerGenotype
                                      ? 'DD genotype favors power - enhanced strength and anaerobic capacity'
                                      : 'II genotype favors endurance - superior cardiovascular efficiency'
                                    }
                                  </p>
                                </div>
                              );
                            })}

                            {/* PPARGC1A - Mitochondrial biogenesis */}
                            {geneticSummary.filter(m => m.Gene === 'PPARGC1A').map((marker, idx) => {
                              const genotype = marker.GeneticCall || marker.genetic_call;

                              return (
                                <div key={idx} className="p-3 bg-green-50 rounded-lg border border-green-200">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium text-green-800">PPARGC1A (Mitochondrial)</span>
                                    <span className="font-bold text-green-600">{genotype}</span>
                                  </div>
                                  <div className="w-full bg-green-200 rounded-full h-2 mb-2">
                                    <div className="h-2 rounded-full bg-green-500 transition-all duration-300" style={{ width: '88%' }}></div>
                                  </div>
                                  <p className="text-xs text-green-700">
                                    Influences mitochondrial biogenesis and muscle fiber composition
                                  </p>
                                </div>
                              );
                            })}

                            {/* MSTN - Muscle development */}
                            {geneticSummary.filter(m => m.Gene === 'MSTN').map((marker, idx) => {
                              const genotype = marker.GeneticCall || marker.genetic_call;

                              return (
                                <div key={idx} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium text-purple-800">MSTN (Muscle Growth)</span>
                                    <span className="font-bold text-purple-600">{genotype}</span>
                                  </div>
                                  <div className="w-full bg-purple-200 rounded-full h-2 mb-2">
                                    <div className="h-2 rounded-full bg-purple-500 transition-all duration-300" style={{ width: '92%' }}></div>
                                  </div>
                                  <p className="text-xs text-purple-700">
                                    Myostatin regulation affects muscle mass and strength potential
                                  </p>
                                </div>
                              );
                            })}

                            {/* IGF1 - Growth factor */}
                            {geneticSummary.filter(m => m.Gene === 'IGF1').map((marker, idx) => {
                              const genotype = marker.GeneticCall || marker.genetic_call;

                              return (
                                <div key={idx} className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium text-indigo-800">IGF1 (Growth Factor)</span>
                                    <span className="font-bold text-indigo-600">{genotype}</span>
                                  </div>
                                  <div className="w-full bg-indigo-200 rounded-full h-2 mb-2">
                                    <div className="h-2 rounded-full bg-indigo-500 transition-all duration-300" style={{ width: '87%' }}></div>
                                  </div>
                                  <p className="text-xs text-indigo-700">
                                    Insulin-like growth factor influences muscle development and recovery
                                  </p>
                                </div>
                              );
                            })}

                            {/* NOS3 - Nitric oxide */}
                            {geneticSummary.filter(m => m.Gene === 'NOS3').map((marker, idx) => {
                              const genotype = marker.GeneticCall || marker.genetic_call;

                              return (
                                <div key={idx} className="p-3 bg-pink-50 rounded-lg border border-pink-200">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium text-pink-800">NOS3 (Nitric Oxide)</span>
                                    <span className="font-bold text-pink-600">{genotype}</span>
                                  </div>
                                  <div className="w-full bg-pink-200 rounded-full h-2 mb-2">
                                    <div className="h-2 rounded-full bg-pink-500 transition-all duration-300" style={{ width: '85%' }}></div>
                                  </div>
                                  <p className="text-xs text-pink-700">
                                    Endothelial nitric oxide synthase affects blood flow and oxygen delivery
                                  </p>
                                </div>
                              );
                            })}

                            {/* BDKRB2 - Bradykinin receptor */}
                            {geneticSummary.filter(m => m.Gene === 'BDKRB2').map((marker, idx) => {
                              const genotype = marker.GeneticCall || marker.genetic_call;

                              return (
                                <div key={idx} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium text-yellow-800">BDKRB2 (Bradykinin)</span>
                                    <span className="font-bold text-yellow-600">{genotype}</span>
                                  </div>
                                  <div className="w-full bg-yellow-200 rounded-full h-2 mb-2">
                                    <div className="h-2 rounded-full bg-yellow-500 transition-all duration-300" style={{ width: '83%' }}></div>
                                  </div>
                                  <p className="text-xs text-yellow-700">
                                    Bradykinin receptor affects cardiovascular response to exercise
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Endurance Performance */}
                        <div className="card-enhanced p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-semibold text-gray-900 flex items-center gap-2">
                              <span className="text-xl">🏃</span>
                              Endurance Performance
                            </h5>
                            <span className={`text-sm px-2 py-1 rounded-full ${
                              geneticSummary.some(m => (m.Gene === 'ACE' && (m.GeneticCall || m.genetic_call)?.includes('II')) ||
                                                     (m.Gene === 'PPARA' && (m.GeneticCall || m.genetic_call)?.includes('GG')))
                                ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {geneticSummary.filter(m => m.Gene === 'ACE' || m.Gene === 'PPARA').length} markers
                            </span>
                          </div>

                          {geneticSummary.filter(m => m.Gene === 'ACE' || m.Gene === 'PPARA').slice(0, 2).map((marker, idx) => {
                            const gene = marker.Gene || marker.gene;
                            const genotype = marker.GeneticCall || marker.genetic_call;
                            const isEnduranceGenotype = (gene === 'ACE' && genotype?.includes('II')) ||
                                                       (gene === 'PPARA' && genotype?.includes('GG'));

                            return (
                              <div key={idx} className="mb-3 last:mb-0">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-sm font-medium text-gray-700">{gene} Genotype</span>
                                  <span className={`text-sm font-bold ${isEnduranceGenotype ? 'text-blue-600' : 'text-gray-500'}`}>
                                    {genotype}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                  <div className={`h-2 rounded-full transition-all duration-300 ${
                                    isEnduranceGenotype ? 'bg-blue-500' : 'bg-gray-400'
                                  }`} style={{ width: isEnduranceGenotype ? '100%' : '60%' }}></div>
                                </div>
                                <p className="text-xs text-gray-600">
                                  {gene === 'ACE' && genotype?.includes('II')
                                    ? 'Superior cardiovascular efficiency - ideal for endurance sports'
                                    : gene === 'PPARA' && genotype?.includes('GG')
                                      ? 'Enhanced fat metabolism - improved endurance capacity'
                                      : 'Standard endurance capacity - maintain aerobic training'
                                  }
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Training Recommendations Based on Genetics */}
                      <div className="card-enhanced p-4 mt-4">
                        <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <span className="text-lg">🎯</span>
                          Genetic-Based Training Recommendations
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          {geneticSummary.some(m => m.Gene === 'ACTN3' && (m.GeneticCall || m.genetic_call)?.includes('RR')) && (
                            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                              <div className="font-medium text-orange-800 mb-1">Power Athlete Profile</div>
                              <div className="text-xs text-orange-600">
                                ACTN3 RR genotype suggests excellent power capacity. Prioritize:
                                <br />• High-intensity interval training
                                <br />• Strength and power development
                                <br />• Sprint and explosive movements
                              </div>
                            </div>
                          )}

                          {geneticSummary.some(m => m.Gene === 'ACE' && (m.GeneticCall || m.genetic_call)?.includes('II')) && (
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="font-medium text-blue-800 mb-1">Endurance Athlete Profile</div>
                              <div className="text-xs text-blue-600">
                                ACE II genotype indicates superior cardiovascular efficiency. Focus on:
                                <br />• Long-duration aerobic training
                                <br />• Cardiovascular endurance development
                                <br />• Steady-state cardio protocols
                              </div>
                            </div>
                          )}

                          {geneticSummary.some(m => m.Gene === 'PPARA' && (m.GeneticCall || m.genetic_call)?.includes('GG')) && (
                            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                              <div className="font-medium text-green-800 mb-1">Metabolic Efficiency Profile</div>
                              <div className="text-xs text-green-600">
                                PPARA GG genotype suggests enhanced fat metabolism. Benefits from:
                                <br />• Longer training sessions
                                <br />• Carbohydrate-focused nutrition
                                <br />• Endurance-based activities
                              </div>
                            </div>
                          )}

                          {geneticSummary.some(m => m.Gene === 'COL5A1' && !(m.GeneticCall || m.genetic_call)?.includes('TT')) && (
                            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                              <div className="font-medium text-red-800 mb-1">Injury Risk Profile</div>
                              <div className="text-xs text-red-600">
                                COL5A1 variant detected - higher soft tissue injury risk. Implement:
                                <br />• Enhanced flexibility protocols
                                <br />• Regular mobility work
                                <br />• Progressive loading strategies
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Enhanced Genetic Performance Matrix */}
                  <div className="card-enhanced p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Enhanced Genetic Performance Matrix</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {[
                        {
                          trait: 'Sprint/Power',
                          genes: geneticSummary.filter(m => m.Gene === 'ACTN3'),
                          icon: '💪',
                          color: 'orange',
                          description: 'Explosive power & sprint capacity'
                        },
                        {
                          trait: 'Strength',
                          genes: geneticSummary.filter(m => m.Gene === 'MSTN' || m.Gene === 'IGF1'),
                          icon: '🏋️',
                          color: 'red',
                          description: 'Muscle strength & development'
                        },
                        {
                          trait: 'Endurance',
                          genes: geneticSummary.filter(m => m.Gene === 'ACE' || m.Gene === 'PPARA'),
                          icon: '🏃',
                          color: 'blue',
                          description: 'Cardiovascular efficiency'
                        },
                        {
                          trait: 'Mitochondrial',
                          genes: geneticSummary.filter(m => m.Gene === 'PPARGC1A'),
                          icon: '⚡',
                          color: 'green',
                          description: 'Energy production capacity'
                        },
                        {
                          trait: 'Recovery',
                          genes: geneticSummary.filter(m => m.Gene === 'PPARA' || m.Gene === 'BDNF'),
                          icon: '🔄',
                          color: 'purple',
                          description: 'Recovery & adaptation rate'
                        },
                        {
                          trait: 'Injury Risk',
                          genes: geneticSummary.filter(m => m.Gene === 'COL5A1' || m.Gene === 'ADRB2'),
                          icon: '🛡️',
                          color: 'gray',
                          description: 'Injury susceptibility'
                        }
                      ].map((category, idx) => (
                        <div key={idx} className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="text-2xl mb-2">{category.icon}</div>
                          <div className="font-semibold text-gray-900 text-sm mb-1">{category.trait}</div>
                          <div className={`text-lg font-bold mb-1 text-${category.color}-600`}>{category.genes.length}</div>
                          <div className="text-xs text-gray-500 mb-2">markers</div>
                          <div className="text-xs text-gray-400 leading-tight">{category.description}</div>
                        </div>
                      ))}
                    </div>

                    {/* Genetic Score Summary */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="card-enhanced p-4 text-center">
                        <div className="text-2xl font-bold text-orange-600 mb-1">
                          {Math.round(
                            (geneticSummary.filter(m => m.Gene === 'ACTN3' && (m.GeneticCall || m.genetic_call)?.includes('RR')).length * 25) +
                            (geneticSummary.filter(m => m.Gene === 'ACE' && (m.GeneticCall || m.genetic_call)?.includes('DD')).length * 20) +
                            (geneticSummary.filter(m => m.Gene === 'MSTN').length * 15) +
                            (geneticSummary.filter(m => m.Gene === 'IGF1').length * 15)
                          )}
                        </div>
                        <div className="font-semibold text-gray-900 text-sm">Power Score</div>
                        <div className="text-xs text-gray-500">/100</div>
                      </div>

                      <div className="card-enhanced p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          {Math.round(
                            (geneticSummary.filter(m => m.Gene === 'ACE' && (m.GeneticCall || m.genetic_call)?.includes('II')).length * 25) +
                            (geneticSummary.filter(m => m.Gene === 'PPARA' && (m.GeneticCall || m.genetic_call)?.includes('GG')).length * 20) +
                            (geneticSummary.filter(m => m.Gene === 'PPARGC1A').length * 18) +
                            (geneticSummary.filter(m => m.Gene === 'NOS3').length * 15)
                          )}
                        </div>
                        <div className="font-semibold text-gray-900 text-sm">Endurance Score</div>
                        <div className="text-xs text-gray-500">/100</div>
                      </div>

                      <div className="card-enhanced p-4 text-center">
                        <div className="text-2xl font-bold text-green-600 mb-1">
                          {Math.round(
                            (geneticSummary.filter(m => m.Gene === 'PPARA' && (m.GeneticCall || m.genetic_call)?.includes('GG')).length * 20) +
                            (geneticSummary.filter(m => m.Gene === 'BDNF' && (m.GeneticCall || m.genetic_call)?.includes('Val/Val')).length * 15) +
                            (latest && (latest.sleep_duration_h || 0) >= 7 ? 10 : 0) +
                            (latest && (latest.hrv_night || 0) > 50 ? 10 : 0)
                          )}
                        </div>
                        <div className="font-semibold text-gray-900 text-sm">Recovery Score</div>
                        <div className="text-xs text-gray-500">/100</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🧬</div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">Genetic Analysis Unavailable</h4>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Comprehensive genetic data is required for advanced performance insights and personalized recommendations.
                  </p>
                </div>
              )}
            </section>

            {/* Integrated Performance Forecast */}
            {athleteBiometrics.length >= 3 && latest && (
              <section className="card-enhanced p-6">
                <h3 className="text-xl font-semibold mb-6 flex items-center gap-3 text-black">
                  <span className="bg-indigo-100 p-2 rounded-full text-indigo-700">🔮</span>
                  AI-Powered Performance Forecast
                </h3>

                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Biometric Trends */}
                  <div className="card-enhanced p-5">
                    <h4 className="font-semibold text-blue-700 mb-4 flex items-center gap-2">
                      <span className="bg-blue-100 p-1.5 rounded-full text-blue-700">📈</span>
                      Biometric Trends
                    </h4>
                    <div className="space-y-3 text-sm">
                      {[
                        { label: 'HRV Recovery', value: latest.hrv_night || 0, unit: 'ms', trend: 'up', desc: 'Heart rate variability', icon: '❤️' },
                        { label: 'Resting HR', value: latest.resting_hr || 0, unit: 'bpm', trend: 'down', desc: 'Cardiac stress level', icon: '💓' },
                        { label: 'Sleep Duration', value: latest.sleep_duration_h || 0, unit: 'h', trend: 'up', desc: 'Recovery quality', icon: '😴' },
                        { label: 'SpO₂ Level', value: latest.spo2_night || 0, unit: '%', trend: 'up', desc: 'Oxygen saturation', icon: '🫁' },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{item.icon}</span>
                            <div>
                              <div className="font-medium text-gray-700">{item.label}</div>
                              <div className="text-xs text-gray-500">{item.desc}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-gray-900">{item.value.toFixed(1)} {item.unit}</div>
                            <div className={`text-xs font-medium ${
                              item.trend === 'up' ?
                                (item.value > (item.label === 'HRV Recovery' ? 50 : item.label === 'Sleep Duration' ? 7 : 95) ? 'text-green-600' : 'text-red-600') :
                                (item.value < (item.label === 'Resting HR' ? 65 : 0) ? 'text-green-600' : 'text-red-600')
                            }`}>
                              {item.trend === 'up' ? '↗' : '↘'} {item.trend === 'up' ?
                                (item.value > (item.label === 'HRV Recovery' ? 50 : item.label === 'Sleep Duration' ? 7 : 95) ? 'Good' : 'Low') :
                                (item.value < (item.label === 'Resting HR' ? 65 : 0) ? 'Optimal' : 'High')
                              }
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Genetic Performance Integration */}
                  <div className="card-enhanced p-5">
                    <h4 className="font-semibold text-purple-700 mb-4 flex items-center gap-2">
                      <span className="bg-purple-100 p-1.5 rounded-full text-purple-700">🧬⚡</span>
                      Genetic Performance Integration
                    </h4>
                    <div className="space-y-3">
                      {/* Power Genetic Score */}
                      <div className="p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-orange-800">Power Genetic Score</span>
                          <span className="text-lg font-bold text-orange-600">
                            {Math.round(
                              (geneticSummary.filter(m => m.Gene === 'ACTN3' && (m.GeneticCall || m.genetic_call)?.includes('RR')).length * 25) +
                              (geneticSummary.filter(m => m.Gene === 'ACE' && (m.GeneticCall || m.genetic_call)?.includes('DD')).length * 20) +
                              (geneticSummary.filter(m => m.Gene === 'MSTN').length * 15) +
                              (geneticSummary.filter(m => m.Gene === 'IGF1').length * 15) +
                              (geneticSummary.filter(m => m.Gene === 'NOS3').length * 13) +
                              (geneticSummary.filter(m => m.Gene === 'BDKRB2').length * 12)
                            )}/100
                          </span>
                        </div>
                        <div className="w-full bg-orange-200 rounded-full h-2 mb-2">
                          <div className="h-2 rounded-full bg-orange-500 transition-all duration-300" style={{
                            width: `${Math.min(100,
                              (geneticSummary.filter(m => m.Gene === 'ACTN3' && (m.GeneticCall || m.genetic_call)?.includes('RR')).length * 25) +
                              (geneticSummary.filter(m => m.Gene === 'ACE' && (m.GeneticCall || m.genetic_call)?.includes('DD')).length * 20) +
                              (geneticSummary.filter(m => m.Gene === 'MSTN').length * 15) +
                              (geneticSummary.filter(m => m.Gene === 'IGF1').length * 15) +
                              (geneticSummary.filter(m => m.Gene === 'NOS3').length * 13) +
                              (geneticSummary.filter(m => m.Gene === 'BDKRB2').length * 12)
                            )}%`
                          }}></div>
                        </div>
                        <p className="text-xs text-orange-700">
                          Based on {geneticSummary.filter(m => ['ACTN3', 'ACE', 'MSTN', 'IGF1', 'NOS3', 'BDKRB2'].includes(m.Gene || m.gene)).length} power-related genetic markers
                        </p>
                      </div>

                      {/* Endurance Genetic Score */}
                      <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-blue-800">Endurance Genetic Score</span>
                          <span className="text-lg font-bold text-blue-600">
                            {Math.round(
                              (geneticSummary.filter(m => m.Gene === 'ACE' && (m.GeneticCall || m.genetic_call)?.includes('II')).length * 25) +
                              (geneticSummary.filter(m => m.Gene === 'PPARGC1A').length * 20) +
                              (geneticSummary.filter(m => m.Gene === 'PPARA' && (m.GeneticCall || m.genetic_call)?.includes('GG')).length * 18) +
                              (geneticSummary.filter(m => m.Gene === 'NOS3').length * 15) +
                              (geneticSummary.filter(m => m.Gene === 'BDKRB2').length * 12) +
                              (geneticSummary.filter(m => m.Gene === 'IGF1').length * 10)
                            )}/100
                          </span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                          <div className="h-2 rounded-full bg-blue-500 transition-all duration-300" style={{
                            width: `${Math.min(100,
                              (geneticSummary.filter(m => m.Gene === 'ACE' && (m.GeneticCall || m.genetic_call)?.includes('II')).length * 25) +
                              (geneticSummary.filter(m => m.Gene === 'PPARGC1A').length * 20) +
                              (geneticSummary.filter(m => m.Gene === 'PPARA' && (m.GeneticCall || m.genetic_call)?.includes('GG')).length * 18) +
                              (geneticSummary.filter(m => m.Gene === 'NOS3').length * 15) +
                              (geneticSummary.filter(m => m.Gene === 'BDKRB2').length * 12) +
                              (geneticSummary.filter(m => m.Gene === 'IGF1').length * 10)
                            )}%`
                          }}></div>
                        </div>
                        <p className="text-xs text-blue-700">
                          Based on {geneticSummary.filter(m => ['ACE', 'PPARGC1A', 'PPARA', 'NOS3', 'BDKRB2', 'IGF1'].includes(m.Gene || m.gene)).length} endurance-related genetic markers
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Training Optimization Forecast */}
                  <div className="card-enhanced p-5">
                    <h4 className="font-semibold text-green-700 mb-4 flex items-center gap-2">
                      <span className="bg-green-100 p-1.5 rounded-full text-green-700">🎯</span>
                      Training Optimization Forecast
                    </h4>
                    <div className="space-y-4">
                      {/* Next 7 Days Forecast */}
                      <div>
                        <h5 className="font-medium text-gray-900 mb-3 text-sm">7-Day Performance Forecast</h5>
                        <div className="space-y-2">
                          {Array.from({ length: 7 }, (_, i) => {
                            const date = new Date();
                            date.setDate(date.getDate() + i);
                            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

                            // Calculate forecasted performance based on genetics and biometrics
                            const powerScore = Math.min(100,
                              (geneticSummary.filter(m => m.Gene === 'ACTN3' && (m.GeneticCall || m.genetic_call)?.includes('RR')).length * 25) +
                              (geneticSummary.filter(m => m.Gene === 'ACE' && (m.GeneticCall || m.genetic_call)?.includes('DD')).length * 20) +
                              ((latest.hrv_night || 0) > 50 ? 15 : 0) +
                              ((latest.resting_hr || 0) < 65 ? 10 : 0)
                            );

                            const enduranceScore = Math.min(100,
                              (geneticSummary.filter(m => m.Gene === 'ACE' && (m.GeneticCall || m.genetic_call)?.includes('II')).length * 25) +
                              (geneticSummary.filter(m => m.Gene === 'PPARA' && (m.GeneticCall || m.genetic_call)?.includes('GG')).length * 18) +
                              ((latest.sleep_duration_h || 0) >= 7 ? 15 : 0) +
                              ((latest.spo2_night || 0) > 96 ? 10 : 0)
                            );

                            return (
                              <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                                <span className="font-medium text-gray-700">{dayName}</span>
                                <div className="flex items-center gap-3">
                                  <div className="text-center">
                                    <div className={`font-bold ${powerScore > 70 ? 'text-orange-600' : 'text-gray-500'}`}>
                                      {powerScore.toFixed(0)}
                                    </div>
                                    <div className="text-xs text-gray-500">Power</div>
                                  </div>
                                  <div className="text-center">
                                    <div className={`font-bold ${enduranceScore > 70 ? 'text-blue-600' : 'text-gray-500'}`}>
                                      {enduranceScore.toFixed(0)}
                                    </div>
                                    <div className="text-xs text-gray-500">Endurance</div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Weekly Training Recommendations */}
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <h5 className="font-medium text-green-800 mb-2 text-sm">Optimal Training This Week</h5>
                        <div className="space-y-2 text-xs text-green-700">
                          {geneticSummary.some(m => m.Gene === 'ACTN3' && (m.GeneticCall || m.genetic_call)?.includes('RR')) && (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                              <span>Power-focused sessions: Mon, Wed, Fri</span>
                            </div>
                          )}
                          {geneticSummary.some(m => m.Gene === 'ACE' && (m.GeneticCall || m.genetic_call)?.includes('II')) && (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span>Endurance sessions: Tue, Thu, Sat</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span>Recovery focus: Sun</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Readiness Assessment */}
                <div className="mt-6 card-enhanced p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h4 className="font-semibold text-gray-900">Comprehensive Readiness Assessment</h4>
                      <p className="text-sm text-gray-600">AI-powered analysis combining biometrics and genetics</p>
                    </div>
                    <div className="text-center">
                      <div className={`text-4xl font-bold mb-1 ${
                        readinessScore > 75 ? 'text-green-600' :
                        readinessScore > 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {readinessScore.toFixed(0)}%
                      </div>
                      <div className={`text-sm font-medium ${
                        readinessScore > 75 ? 'text-green-600' :
                        readinessScore > 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {readinessScore > 75 ? 'Excellent' : readinessScore > 50 ? 'Good' : 'Needs Attention'}
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Biometric Assessment */}
                    <div className="card-enhanced p-4">
                      <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <span className="bg-blue-100 p-1 rounded-full text-blue-700">📊</span>
                        Biometric Assessment
                      </h5>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between p-2 rounded-lg" style={{backgroundColor: 'rgba(59, 130, 246, 0.1)'}}>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">❤️</span>
                            <span className="text-black">HRV Recovery</span>
                          </div>
                          <div className="text-right">
                            <div className={`font-bold ${(latest.hrv_night || 0) > 50 ? 'text-green-600' : 'text-red-600'}`}>
                              {(latest.hrv_night || 0).toFixed(0)}ms
                            </div>
                            <div className={`text-xs ${(latest.hrv_night || 0) > 50 ? 'text-green-600' : 'text-red-600'}`}>
                              {(latest.hrv_night || 0) > 50 ? 'Optimal' : 'Low'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-lg" style={{backgroundColor: 'rgba(59, 130, 246, 0.1)'}}>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">💓</span>
                            <span  className="text-black">Resting HR</span>
                          </div>
                          <div className="text-right">
                            <div className={`font-bold ${(latest.resting_hr || 0) < 65 ? 'text-green-600' : 'text-red-600'}`}>
                              {(latest.resting_hr || 0).toFixed(0)}bpm
                            </div>
                            <div className={`text-xs ${(latest.resting_hr || 0) < 65 ? 'text-green-600' : 'text-red-600'}`}>
                              {(latest.resting_hr || 0) < 65 ? 'Normal' : 'Elevated'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-lg" style={{backgroundColor: 'rgba(59, 130, 246, 0.1)'}}>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">😴</span>
                            <span  className="text-black">Sleep Quality</span>
                          </div>
                          <div className="text-right">
                            <div className={`font-bold ${(latest.sleep_duration_h || 0) >= 7 ? 'text-green-600' : 'text-red-600'}`}>
                              {(latest.sleep_duration_h || 0).toFixed(1)}h
                            </div>
                            <div className={`text-xs ${(latest.sleep_duration_h || 0) >= 7 ? 'text-green-600' : 'text-red-600'}`}>
                              {(latest.sleep_duration_h || 0) >= 7 ? 'Adequate' : 'Insufficient'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Genetic Assessment */}
                    <div className="card-enhanced p-4">
                      <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <span className="bg-purple-100 p-1 rounded-full text-purple-700">🧬</span>
                        Genetic Assessment
                      </h5>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between p-2 rounded-lg" style={{backgroundColor: 'rgba(147, 51, 234, 0.1)'}}>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">💪</span>
                            <span className="text-black">Power Genetics</span>
                          </div>
                          <div className="text-right">
                            <div className={`font-bold ${geneticSummary.some(m => m.Gene === 'ACTN3') ? 'text-purple-600' : 'text-gray-400'}`}>
                              {geneticSummary.filter(m => m.Gene === 'ACTN3').length}
                            </div>
                            <div className={`text-xs ${geneticSummary.some(m => m.Gene === 'ACTN3') ? 'text-purple-600' : 'text-gray-400'}`}>
                              markers
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-lg" style={{backgroundColor: 'rgba(147, 51, 234, 0.1)'}}>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🏃</span>
                            <span className="text-black">Endurance Genetics</span>
                          </div>
                          <div className="text-right">
                            <div className={`font-bold ${geneticSummary.some(m => m.Gene === 'ACE' || m.Gene === 'PPARA') ? 'text-purple-600' : 'text-gray-400'}`}>
                              {geneticSummary.filter(m => m.Gene === 'ACE' || m.Gene === 'PPARA').length}
                            </div>
                            <div className={`text-xs ${geneticSummary.some(m => m.Gene === 'ACE' || m.Gene === 'PPARA') ? 'text-purple-600' : 'text-gray-400'}`}>
                              markers
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-lg" style={{backgroundColor: 'rgba(147, 51, 234, 0.1)'}}>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🛡️</span>
                            <span className="text-black">Injury Resistance</span>
                          </div>
                          <div className="text-right">
                            <div className={`font-bold ${geneticSummary.some(m => m.Gene === 'COL5A1') ? 'text-purple-600' : 'text-gray-400'}`}>
                              {geneticSummary.filter(m => m.Gene === 'COL5A1').length}
                            </div>
                            <div className={`text-xs ${geneticSummary.some(m => m.Gene === 'COL5A1') ? 'text-purple-600' : 'text-gray-400'}`}>
                              markers
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Combined Insights */}
                    <div className="card-enhanced p-4">
                      <h5 className="font-medium text-green-700 mb-3 flex items-center gap-2">
                        <span className="bg-green-100 p-1 rounded-full">🎯</span>
                        Combined Insights
                      </h5>
                      <div className="space-y-3 text-sm">
                        <div className="p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                          <div className="font-medium text-green-800 mb-1">Training Capacity</div>
                          <div className="text-xs text-green-600">
                            {geneticSummary.some(m => m.Gene === 'ACTN3' && (m.GeneticCall || m.genetic_call)?.includes('RR')) &&
                             (latest.hrv_night || 0) > 50
                              ? 'High-intensity training optimal'
                              : geneticSummary.some(m => m.Gene === 'ACE' && (m.GeneticCall || m.genetic_call)?.includes('II'))
                                ? 'Endurance training recommended'
                                : 'Monitor recovery before increasing load'}
                          </div>
                        </div>

                        <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                          <div className="font-medium text-blue-800 mb-1">Recovery Strategy</div>
                          <div className="text-xs text-blue-600">
                            {geneticSummary.some(m => m.Gene === 'PPARA' && (m.GeneticCall || m.genetic_call)?.includes('GG'))
                              ? 'Enhanced fat metabolism - carb-focused recovery'
                              : (latest.sleep_duration_h || 0) >= 7
                                ? 'Good sleep foundation - maintain current protocols'
                                : 'Prioritize sleep optimization'}
                          </div>
                        </div>

                        <div className="p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                          <div className="font-medium text-orange-800 mb-1">Risk Management</div>
                          <div className="text-xs text-orange-600">
                            {geneticSummary.some(m => m.Gene === 'COL5A1' && !(m.GeneticCall || m.genetic_call)?.includes('TT'))
                              ? 'Soft tissue risk - implement preventive measures'
                              : (latest.resting_hr || 0) > 70
                                ? 'Monitor cardiac stress indicators'
                                : 'Standard protocols appropriate'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Enhanced Recovery Intelligence */}
            <section className="card-enhanced p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                <span className="bg-rose-100 p-2 rounded-full text-rose-700">💡</span>
                AI-Powered Recovery Intelligence
              </h3>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Genetic Recovery Profile */}
                <div className="card-enhanced p-5">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="bg-purple-100 p-1.5 rounded-full text-purple-700">🧬</span>
                    Genetic Recovery Profile
                  </h4>
                  <div className="space-y-4">
                    {/* Recovery Capacity Overview */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                        <div className="text-2xl font-bold text-purple-700 mb-1">
                          {geneticSummary.filter(m =>
                            (m.Gene === 'PPARA' && (m.GeneticCall || m.genetic_call)?.includes('GG')) ||
                            (m.Gene === 'BDNF' && (m.GeneticCall || m.genetic_call)?.includes('Val/Val'))
                          ).length}
                        </div>
                        <div className="text-sm text-purple-600 font-medium">Fast Recovery Markers</div>
                      </div>
                      <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                        <div className="text-2xl font-bold text-orange-700 mb-1">
                          {geneticSummary.filter(m =>
                            (m.Gene === 'ACTN3' && (m.GeneticCall || m.genetic_call)?.includes('XX')) ||
                            (m.Gene === 'COMT' && (m.GeneticCall || m.genetic_call)?.includes('Met/Met'))
                          ).length}
                        </div>
                        <div className="text-sm text-orange-600 font-medium">Extended Recovery Markers</div>
                      </div>
                    </div>

                    {/* Specific Recovery Insights */}
                    <div className="space-y-3">
                      {geneticSummary.filter(m =>
                        m.Gene === 'ACTN3' || m.Gene === 'PPARA' || m.Gene === 'BDNF' || m.Gene === 'COMT'
                      ).slice(0, 4).map((marker, idx) => {
                        const gene = marker.Gene || marker.gene;
                        const genotype = marker.GeneticCall || marker.genetic_call;

                        let recoveryInsight = '';
                        let icon = '🧬';
                        let bgColor = 'bg-purple-50';
                        let borderColor = 'border-purple-200';
                        let textColor = 'text-purple-800';

                        if (gene === 'ACTN3' && genotype?.includes('XX')) {
                          recoveryInsight = 'Endurance genotype: May need extended recovery periods between high-intensity sessions';
                          icon = '🏃';
                          bgColor = 'bg-blue-50';
                          borderColor = 'border-blue-200';
                          textColor = 'text-blue-800';
                        } else if (gene === 'PPARA' && genotype?.includes('GG')) {
                          recoveryInsight = 'Enhanced fat metabolism: Omega-3 supplementation may accelerate recovery processes';
                          icon = '🥗';
                          bgColor = 'bg-green-50';
                          borderColor = 'border-green-200';
                          textColor = 'text-green-800';
                        } else if (gene === 'BDNF' && genotype?.includes('Met')) {
                          recoveryInsight = 'Neuroplasticity focus: Cognitive training during recovery may enhance adaptation';
                          icon = '🧠';
                          bgColor = 'bg-indigo-50';
                          borderColor = 'border-indigo-200';
                          textColor = 'text-indigo-800';
                        } else if (gene === 'COMT' && genotype?.includes('Met/Met')) {
                          recoveryInsight = 'Stress-sensitive genotype: Prioritize stress management for optimal recovery';
                          icon = '🧘';
                          bgColor = 'bg-amber-50';
                          borderColor = 'border-amber-200';
                          textColor = 'text-amber-800';
                        }

                        return recoveryInsight ? (
                          <div key={idx} className={`p-3 bg-gradient-to-r from-${bgColor.split('-')[1]}-50 to-${bgColor.split('-')[1]}-100 rounded-lg border ${borderColor}`}>
                            <div className="flex items-start gap-3">
                              <span className="text-lg">{icon}</span>
                              <div>
                                <div className={`font-medium ${textColor} text-sm`}>{gene}: {genotype}</div>
                                <div className={`text-xs ${textColor.replace('800', '600')} mt-1`}>{recoveryInsight}</div>
                              </div>
                            </div>
                          </div>
                        ) : null;
                      })}

                      {/* Default recovery insights if no specific markers found */}
                      {geneticSummary.filter(m =>
                        m.Gene === 'ACTN3' || m.Gene === 'PPARA' || m.Gene === 'BDNF' || m.Gene === 'COMT'
                      ).length === 0 && (
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-start gap-3">
                            <span className="text-lg">📋</span>
                            <div>
                              <div className="font-medium text-gray-800 text-sm">Standard Recovery Profile</div>
                              <div className="text-xs text-gray-600 mt-1">
                                No specific recovery genetics identified. Follow standard recovery protocols based on training load and biometric indicators.
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Recovery Protocol Recommendations */}
                    <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                      <h5 className="font-medium text-purple-800 mb-2">Recovery Protocol Recommendations</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span className="text-purple-700">
                              {geneticSummary.some(m => m.Gene === 'PPARA' && (m.GeneticCall || m.genetic_call)?.includes('GG'))
                                ? 'Omega-3 supplementation for enhanced recovery'
                                : 'Standard protein supplementation protocol'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span className="text-purple-700">
                              {geneticSummary.some(m => m.Gene === 'COMT' && (m.GeneticCall || m.genetic_call)?.includes('Met/Met'))
                                ? 'Stress management essential for recovery'
                                : 'Standard stress management protocols'}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span className="text-purple-700">
                              {geneticSummary.some(m => m.Gene === 'ACTN3' && (m.GeneticCall || m.genetic_call)?.includes('XX'))
                                ? 'Extended recovery between sessions'
                                : 'Standard recovery timing'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span className="text-purple-700">
                              {geneticSummary.some(m => m.Gene === 'BDNF' && (m.GeneticCall || m.genetic_call)?.includes('Met'))
                                ? 'Include cognitive training in recovery'
                                : 'Focus on physical recovery modalities'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Current Recovery Status */}
                <div className="card-enhanced p-5">
                  <h4 className="font-semibold text-blue-700 mb-4 flex items-center gap-2">
                    <span className="bg-blue-100 p-1.5 rounded-full text-blue-700">📊</span>
                    Current Recovery Status
                  </h4>
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">❤️</span>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">HRV Recovery</div>
                            <div className="text-xs text-gray-600">Heart rate variability</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold text-lg ${latest && (latest.hrv_night || 0) > 50 ? 'text-green-600' : 'text-red-600'}`}>
                            {latest ? (latest.hrv_night || 0).toFixed(0) : '0'}ms
                          </div>
                          <div className={`text-xs ${latest && (latest.hrv_night || 0) > 50 ? 'text-green-600' : 'text-red-600'}`}>
                            {latest && (latest.hrv_night || 0) > 50 ? 'Good' : 'Needs work'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">😴</span>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">Sleep Quality</div>
                            <div className="text-xs text-gray-600">Duration & deep sleep</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold text-lg ${latest && (latest.sleep_duration_h || 0) >= 7 ? 'text-green-600' : 'text-red-600'}`}>
                            {latest ? (latest.sleep_duration_h || 0).toFixed(1) : '0.0'}h
                          </div>
                          <div className={`text-xs ${latest && (latest.sleep_duration_h || 0) >= 7 ? 'text-green-600' : 'text-red-600'}`}>
                            {latest && (latest.sleep_duration_h || 0) >= 7 ? 'Adequate' : 'Insufficient'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">💪</span>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">Training Stress</div>
                            <div className="text-xs text-gray-600">Current load vs capacity</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold text-lg ${latest && (latest.training_load_pct || 0) < 80 ? 'text-green-600' : 'text-orange-600'}`}>
                            {latest ? (latest.training_load_pct || 0).toFixed(0) : '0'}%
                          </div>
                          <div className={`text-xs ${latest && (latest.training_load_pct || 0) < 80 ? 'text-green-600' : 'text-orange-600'}`}>
                            {latest && (latest.training_load_pct || 0) < 80 ? 'Manageable' : 'High'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Personalized Recovery Plan */}
                <div className="card-enhanced p-5">
                  <h4 className="font-semibold text-green-700 mb-4 flex items-center gap-2">
                    <span className="bg-green-100 p-1.5 rounded-full text-green-700">🎯</span>
                    Personalized Recovery Plan
                  </h4>
                  <div className="space-y-4">
                    {/* Priority Actions */}
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2 text-sm">Priority Actions</h5>
                      <div className="space-y-2">
                        {latest && (latest.sleep_duration_h || 0) < 6 && (
                          <div className="flex items-start gap-3 p-2 bg-red-50 rounded-lg border-l-4 border-red-500">
                            <span className="text-red-500 mt-0.5">🔴</span>
                            <div>
                              <div className="font-medium text-red-800 text-sm">Sleep Priority</div>
                              <div className="text-xs text-red-600">Extend sleep duration to 7-9 hours</div>
                            </div>
                          </div>
                        )}

                        {latest && (latest.hrv_night || 0) < 40 && (
                          <div className="flex items-start gap-3 p-2 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                            <span className="text-orange-500 mt-0.5">🟠</span>
                            <div>
                              <div className="font-medium text-orange-800 text-sm">HRV Recovery</div>
                              <div className="text-xs text-orange-600">Include active recovery and stress reduction</div>
                            </div>
                          </div>
                        )}

                        {geneticSummary.some(m => m.Gene === 'COL5A1' && !(m.GeneticCall || m.genetic_call)?.includes('TT')) && (
                          <div className="flex items-start gap-3 p-2 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                            <span className="text-blue-500 mt-0.5">🔵</span>
                            <div>
                              <div className="font-medium text-blue-800 text-sm">Soft Tissue Care</div>
                              <div className="text-xs text-blue-600">Genetic risk - focus on flexibility and mobility</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Recovery Timeline */}
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2 text-sm">Recovery Timeline</h5>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                          <span className="text-green-800">Today</span>
                          <span className="font-medium text-green-700">
                            {readinessScore > 75 ? 'Full training capacity' : 'Modified training load'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                          <span className="text-blue-800">Next 48h</span>
                          <span className="font-medium text-blue-700">
                            {geneticSummary.some(m => m.Gene === 'PPARA') ? 'Enhanced recovery expected' : 'Standard recovery protocols'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                          <span className="text-purple-800">This Week</span>
                          <span className="font-medium text-purple-700">
                            Monitor genetic risk factors
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Daily Recovery Tip */}
            <section className="card-enhanced p-5">
              <div className="flex items-start gap-4">
                <span className="text-3xl">💡</span>
                <div>
                  <h4 className="font-semibold text-rose-700 mb-2">Daily Recovery Intelligence</h4>
                  <p className="text-rose-600 text-sm leading-relaxed">
                    {(() => {
                      const tips = [
                        'Hydration impacts HRV. Aim for 35ml/kg body weight daily.',
                        'Blue light after 9 PM suppresses melatonin. Use night mode.',
                        'Cold exposure post-training can delay muscle recovery in ACTN3 XX carriers.',
                        'Magnesium glycinate may improve deep sleep in PER3 long genotype athletes.',
                        'Morning sunlight resets circadian rhythm — get 10 mins upon waking.',
                        'Omega-3s may enhance recovery in BDNF Met carriers.',
                        'Caffeine clearance is slower in evening types (PER3 long) — avoid after 2 PM.',
                      ];

                      // Select tip based on genetic profile
                      if (geneticSummary.some(m => m.Gene === 'ACTN3')) {
                        return 'Power athletes (ACTN3 RR) benefit from protein-rich recovery meals within 30 minutes post-training.';
                      } else if (geneticSummary.some(m => m.Gene === 'PPARA')) {
                        return 'Endurance genetics (PPARA GG) respond well to carbohydrate-focused recovery nutrition.';
                      } else if (geneticSummary.some(m => m.Gene === 'COL5A1')) {
                        return 'Soft tissue injury risk detected - incorporate regular flexibility and mobility work.';
                      }

                      return tips[(athlete?.athlete_id || '').charCodeAt((athlete?.athlete_id || '').length - 1) % tips.length];
                    })()}
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'geneticSummary' && (
          <div className="space-y-6">
            {/* Header with Search and Filters */}
            <div className="card-enhanced p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-black mb-2">🧬 Advanced Genetic Analysis</h2>
                  <p className="text-gray-600 text-lg">
                    Interactive genetic profile for {athlete.name} • {filteredGeneticSummary.length} markers analyzed
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="flex gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{geneticSummary.length}</div>
                    <div className="text-xs text-gray-500">Total Markers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {new Set(geneticSummary.map(g => g.Category || g.category)).size}
                    </div>
                    <div className="text-xs text-gray-500">Categories</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {geneticSummary.filter(g => (g.Category || g.category) === 'performance').length}
                    </div>
                    <div className="text-xs text-gray-500">Performance</div>
                  </div>
                </div>
              </div>

              {/* Search and Filter Controls */}
              <GeneticSearchAndFilter
                geneticSummary={geneticSummary}
                onFilteredResults={setFilteredGeneticSummary}
              />
            </div>

            {filteredGeneticSummary.length > 0 ? (
              <GeneticAnalysisTabs
                geneticSummary={filteredGeneticSummary}
                athlete={athlete}
                athleteBiometrics={athleteBiometrics}
              />
            ) : (
              <div className="text-center py-12 card-enhanced">
                <div className="text-6xl mb-4">🧬</div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">No Genetic Data Available</h4>
                <p className="text-gray-600 max-w-md mx-auto">
                  Genetic summary data is not available for this athlete. Please ensure genetic testing has been completed and data has been uploaded to the system.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'scaleReport' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">⚖️ Scale Report</h2>
            <ScaleReport athleteId={athleteId.toString()} />
          </div>
        )}

        {activeTab === 'digitalTwin' && (
          <DigitalTwin3D athleteId={athleteId.toString()} />
        )}


        {activeTab === 'trainingLoad' && (
          <TrainingLoadHeatmap />
        )}

        {activeTab === 'recoveryTimeline' && (
          <RecoveryTimeline athleteId={athleteId.toString()} />
        )}

        {activeTab === 'pharmacogenomics' && (
          <Pharmacogenomics athleteId={athleteId.toString()} />
        )}

        {activeTab === 'nutrigenomics' && (
          <Nutrigenomics athleteId={athleteId.toString()} />
        )}

        {activeTab === 'recoveryGenes' && (
          <RecoveryGenePanel athleteId={athleteId.toString()} />
        )}

        {activeTab === 'predictive' && (
                <PredictiveAnalytics athleteId={athleteId.toString()} />
              )}

              {activeTab === 'sleep' && (
                <SleepMetrics
                  biometricData={athleteBiometrics}
                  athleteId={athleteId.toString()}
                />
              )}

              {activeTab === 'stress' && (
                <StressManagement
                  athleteId={athleteId.toString()}
                  biometricData={athleteBiometrics}
                />
              )}

              {activeTab === 'weather' && (
                <WeatherImpact
                  athleteId={athleteId.toString()}
                  geneticData={athleteGenetics}
                />
              )}

              {activeTab === 'chatAI' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">🤖 Chat With AI</h2>
                  <div className="mb-4 p-4 bg-gray-100 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">Data Status:</h3>
                    <p className="text-sm text-gray-600">Athlete: {athlete?.name}</p>
                    <p className="text-sm text-gray-600">Biometric Data Count: {athleteBiometrics.length}</p>
                    <p className="text-sm text-gray-600">Genetic Profiles Count: {athleteGenetics.length}</p>
                    <p className="text-sm text-gray-600">Athlete ID: {athlete?.athlete_id}</p>
                    <p className="text-sm text-gray-600">Latest Biometric Date: {getLatestBiometricRecord(athleteBiometrics)?.date || 'None'}</p>
                    {athleteBiometrics.length === 0 && (
                      <p className="text-xs text-yellow-600 mt-2">
                        ⚠️ No biometric data available. Check Current Metrics tab for data.
                      </p>
                    )}
                  </div>
                  <ChatWithAI
                    athlete={athlete}
                    biometricData={athleteBiometrics}
                    geneticProfiles={athleteGenetics}
                  />
                </div>
              )}

      </div>
    </div>
  );
};
