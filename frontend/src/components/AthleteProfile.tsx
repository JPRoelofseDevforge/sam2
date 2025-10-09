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
import DigitalTwinV2 from './DigitalTwinV2';
import { TrainingLoadHeatmap } from './TrainingLoadHeatmap';
import { RecoveryTimeline } from './RecoveryTimeline';
import { Pharmacogenomics } from './Pharmacogenomics';
import { Nutrigenomics } from './Nutrigenomics';
import { RecoveryGenePanel } from './RecoveryGenePanel';
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
import { PredictiveAnalytics } from './PredictiveAnalytics';
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

// Comprehensive Genetic Analysis Component
const ComprehensiveGeneticAnalysis: React.FC<{ athlete: any; geneticSummary: any[]; athleteId: number }> = ({ athlete, geneticSummary, athleteId }) => {
  // Flatten all genes from summaries
  const allGenes = geneticSummary.flatMap((summary: any) => {
    let genesData = summary.Genes || {};
    if (typeof genesData === 'string') {
      try {
        genesData = JSON.parse(genesData);
      } catch {
        genesData = {};
      }
    }
    if (Array.isArray(genesData)) {
      if (typeof genesData[0] === 'object' && genesData[0] !== null) {
        return genesData.map((g: any) => ({
          gene: g.gene || g.Gene || g.rsid || g.RSID || 'Unknown',
          genotype: g.genotype || g.Genotype || 'Unknown',
          rsid: g.rsid || g.RSID || '',
          category: summary.Category || summary.category || 'Unknown',
          summary
        })).filter(g => !g.gene.startsWith('$') && g.gene !== 'id' && g.gene !== 'Id' && g.gene !== 'ID');
      } else {
        const obj = genesData.reduce((acc: any, item: any) => {
          acc[item.Key || item.key] = item.Value || item.value;
          return acc;
        }, {});
        return Object.entries(obj)
          .filter(([gene]) => !gene.startsWith('$') && gene !== 'id' && gene !== 'Id' && gene !== 'ID')
          .map(([gene, genotype]) => ({
            gene,
            genotype: genotype as string,
            rsid: '',
            category: summary.Category || summary.category || 'Unknown',
            summary
          }));
      }
    } else if (typeof genesData === 'object' && genesData !== null) {
      const entries = Object.entries(genesData).filter(([key]) => !key.startsWith('$') && key !== 'id' && key !== 'Id' && key !== 'ID');
      return entries.map(([gene, genotype]) => ({
        gene,
        genotype: genotype as string,
        rsid: '',
        category: summary.Category || summary.category || 'Unknown',
        summary
      }));
    }
    return [];
  });

  // Comprehensive genetic analysis data
  const geneticAnalysisData = {
    'Core Sleep markers': {
      genes: {
        'COMT': { rsid: 'rs4680', analysis: { 'GG': { impact: 'beneficial', description: 'Better dopamine metabolism, improved sleep quality and cognitive function', color: 'green' }, 'GA': { impact: 'neutral', description: 'Moderate dopamine metabolism', color: 'yellow' }, 'AA': { impact: 'challenging', description: 'Slower dopamine metabolism, may affect sleep and stress response', color: 'red' } } },
        'PER3 VNTR': { rsid: 'rs57875989', analysis: { '4/4': { impact: 'beneficial', description: 'Morning chronotype, better sleep efficiency', color: 'green' }, '4/5': { impact: 'neutral', description: 'Intermediate chronotype', color: 'yellow' }, '5/5': { impact: 'challenging', description: 'Evening chronotype, may have sleep difficulties', color: 'red' } } },
        'CLOCK': { rsid: 'rs1801260', analysis: { 'TT': { impact: 'beneficial', description: 'Better circadian rhythm regulation', color: 'green' }, 'TC': { impact: 'neutral', description: 'Moderate circadian regulation', color: 'yellow' }, 'CC': { impact: 'challenging', description: 'Evening preference, potential sleep issues', color: 'red' } } },
        'BDNF': { rsid: 'rs6265', analysis: { 'Val/Val': { impact: 'beneficial', description: 'Enhanced neuroplasticity and sleep quality', color: 'green' }, 'Val/Met': { impact: 'neutral', description: 'Moderate neuroplasticity', color: 'yellow' }, 'Met/Met': { impact: 'challenging', description: 'Reduced neuroplasticity, may affect sleep recovery', color: 'red' } } },
        'PPARGC1A': { rsid: 'rs8192678', analysis: { 'GG': { impact: 'beneficial', description: 'Enhanced mitochondrial function and sleep recovery', color: 'green' }, 'GA': { impact: 'neutral', description: 'Moderate mitochondrial function', color: 'yellow' }, 'AA': { impact: 'challenging', description: 'Reduced mitochondrial efficiency', color: 'red' } } },
        'ACTN3': { rsid: 'rs1815739', analysis: { 'RR': { impact: 'beneficial', description: 'Fast-twitch fiber dominance, explosive power', color: 'green' }, 'RX': { impact: 'neutral', description: 'Mixed fiber types', color: 'yellow' }, 'XX': { impact: 'beneficial', description: 'Slow-twitch fiber dominance, endurance focus', color: 'green' } } },
        'NOS3': { rsid: 'rs1799983', analysis: { 'TT': { impact: 'beneficial', description: 'Optimal nitric oxide production', color: 'green' }, 'GT': { impact: 'neutral', description: 'Moderate nitric oxide production', color: 'yellow' }, 'GG': { impact: 'challenging', description: 'Reduced nitric oxide production', color: 'red' } } },
        'TPH2': { rsid: 'rs4570625', analysis: { 'CC': { impact: 'beneficial', description: 'Optimal serotonin regulation', color: 'green' }, 'CT': { impact: 'neutral', description: 'Moderate serotonin regulation', color: 'yellow' }, 'TT': { impact: 'challenging', description: 'Altered serotonin regulation', color: 'red' } } },
        'GABRA6': { rsid: 'rs3219151', analysis: { 'GG': { impact: 'beneficial', description: 'Enhanced GABA function, better sleep', color: 'green' }, 'GA': { impact: 'neutral', description: 'Moderate GABA function', color: 'yellow' }, 'AA': { impact: 'challenging', description: 'Reduced GABA function', color: 'red' } } },
        'GSK3B': { rsid: '', analysis: { 'default': { impact: 'neutral', description: 'Glycogen synthase kinase regulation', color: 'blue' } } },
        'PER2': { rsid: '', analysis: { 'default': { impact: 'neutral', description: 'Circadian rhythm regulation', color: 'blue' } } }
      },
      description: 'Genes influencing sleep quality, circadian rhythms, and sleep recovery'
    },
    'Mental Health': {
      genes: {
        'COMT': { rsid: 'rs4680', analysis: { 'GG': { impact: 'beneficial', description: 'Efficient dopamine metabolism, better stress response', color: 'green' }, 'GA': { impact: 'neutral', description: 'Balanced dopamine metabolism', color: 'yellow' }, 'AA': { impact: 'challenging', description: 'Slower dopamine clearance, may increase anxiety', color: 'red' } } },
        'SLC6A4 5-HTTLPR': { rsid: 'rs4795541', analysis: { 'LL': { impact: 'beneficial', description: 'Efficient serotonin transport, better mood regulation', color: 'green' }, 'LS': { impact: 'neutral', description: 'Moderate serotonin transport', color: 'yellow' }, 'SS': { impact: 'challenging', description: 'Reduced serotonin transport, higher anxiety risk', color: 'red' } } },
        'TPH2': { rsid: 'rs4570625', analysis: { 'CC': { impact: 'beneficial', description: 'Optimal serotonin synthesis', color: 'green' }, 'CT': { impact: 'neutral', description: 'Moderate serotonin synthesis', color: 'yellow' }, 'TT': { impact: 'challenging', description: 'Reduced serotonin synthesis', color: 'red' } } },
        'BDNF': { rsid: 'rs6265', analysis: { 'Val/Val': { impact: 'beneficial', description: 'Enhanced neuroplasticity and resilience', color: 'green' }, 'Val/Met': { impact: 'neutral', description: 'Moderate neuroplasticity', color: 'yellow' }, 'Met/Met': { impact: 'challenging', description: 'Reduced neuroplasticity, higher depression risk', color: 'red' } } },
        'MAO-A': { rsid: 'rs6323', analysis: { 'TT': { impact: 'beneficial', description: 'Balanced neurotransmitter metabolism', color: 'green' }, 'TC': { impact: 'neutral', description: 'Moderate metabolism', color: 'yellow' }, 'CC': { impact: 'challenging', description: 'Altered metabolism, potential mood issues', color: 'red' } } },
        'FKBP5': { rsid: 'rs1360780', analysis: { 'TT': { impact: 'beneficial', description: 'Better stress response regulation', color: 'green' }, 'CT': { impact: 'neutral', description: 'Moderate stress response', color: 'yellow' }, 'CC': { impact: 'challenging', description: 'Heightened stress response', color: 'red' } } },
        'GABRA6': { rsid: 'rs3219151', analysis: { 'GG': { impact: 'beneficial', description: 'Enhanced GABA function, anxiety reduction', color: 'green' }, 'GA': { impact: 'neutral', description: 'Moderate GABA function', color: 'yellow' }, 'AA': { impact: 'challenging', description: 'Reduced GABA function, higher anxiety', color: 'red' } } },
        'HTR1A': { rsid: 'rs6295', analysis: { 'GG': { impact: 'beneficial', description: 'Better serotonin receptor function', color: 'green' }, 'GC': { impact: 'neutral', description: 'Moderate receptor function', color: 'yellow' }, 'CC': { impact: 'challenging', description: 'Reduced receptor function', color: 'red' } } },
        'OXTR': { rsid: 'rs53576', analysis: { 'GG': { impact: 'beneficial', description: 'Enhanced social bonding and trust', color: 'green' }, 'GA': { impact: 'neutral', description: 'Moderate social bonding', color: 'yellow' }, 'AA': { impact: 'challenging', description: 'Reduced social bonding capacity', color: 'red' } } }
      },
      description: 'Genes affecting mood regulation, anxiety, stress response, and mental resilience'
    },
    'Cardiovascular markers': {
      genes: {
        'APOE': { rsid: 'rs429358', analysis: { 'E2/E2': { impact: 'beneficial', description: 'Lowest cardiovascular risk, better lipid metabolism', color: 'green' }, 'E2/E3': { impact: 'beneficial', description: 'Low cardiovascular risk', color: 'green' }, 'E3/E3': { impact: 'neutral', description: 'Average cardiovascular risk', color: 'yellow' }, 'E2/E4': { impact: 'neutral', description: 'Moderate cardiovascular risk', color: 'yellow' }, 'E3/E4': { impact: 'challenging', description: 'Elevated cardiovascular risk', color: 'red' }, 'E4/E4': { impact: 'challenging', description: 'Highest cardiovascular risk', color: 'red' } } },
        'NOS3': { rsid: 'rs1799983', analysis: { 'TT': { impact: 'beneficial', description: 'Optimal endothelial function and blood flow', color: 'green' }, 'GT': { impact: 'neutral', description: 'Moderate endothelial function', color: 'yellow' }, 'GG': { impact: 'challenging', description: 'Reduced endothelial function', color: 'red' } } },
        'ACE': { rsid: 'rs4341', analysis: { 'II': { impact: 'beneficial', description: 'Lower blood pressure, better endurance', color: 'green' }, 'ID': { impact: 'neutral', description: 'Moderate ACE activity', color: 'yellow' }, 'DD': { impact: 'challenging', description: 'Higher blood pressure, power advantage', color: 'red' } } },
        'AGT': { rsid: 'rs699', analysis: { 'CC': { impact: 'beneficial', description: 'Lower angiotensinogen levels', color: 'green' }, 'CT': { impact: 'neutral', description: 'Moderate angiotensinogen levels', color: 'yellow' }, 'TT': { impact: 'challenging', description: 'Higher angiotensinogen levels', color: 'red' } } },
        'ADRB2': { rsid: 'rs1042713', analysis: { 'GG': { impact: 'beneficial', description: 'Better bronchodilation and cardiovascular response', color: 'green' }, 'GA': { impact: 'neutral', description: 'Moderate response', color: 'yellow' }, 'AA': { impact: 'challenging', description: 'Reduced bronchodilation', color: 'red' } } },
        'MTHFR C677T': { rsid: 'rs1801133', analysis: { 'CC': { impact: 'beneficial', description: 'Normal homocysteine metabolism', color: 'green' }, 'CT': { impact: 'neutral', description: 'Moderate homocysteine elevation risk', color: 'yellow' }, 'TT': { impact: 'challenging', description: 'Elevated homocysteine risk', color: 'red' } } },
        'LPA': { rsid: 'rs3798220', analysis: { 'low': { impact: 'beneficial', description: 'Lower cardiovascular risk', color: 'green' }, 'high': { impact: 'challenging', description: 'Elevated cardiovascular risk', color: 'red' } } },
        'CRP': { rsid: 'rs1205', analysis: { 'CC': { impact: 'beneficial', description: 'Lower inflammation risk', color: 'green' }, 'CG': { impact: 'neutral', description: 'Moderate inflammation risk', color: 'yellow' }, 'GG': { impact: 'challenging', description: 'Higher inflammation risk', color: 'red' } } }
      },
      description: 'Genes influencing heart health, blood pressure, cholesterol metabolism, and cardiovascular disease risk'
    },
    'Metabolic Health': {
      genes: {
        'TCF7L2': { rsid: 'rs7903146', analysis: { 'TT': { impact: 'beneficial', description: 'Lower type 2 diabetes risk', color: 'green' }, 'CT': { impact: 'neutral', description: 'Moderate diabetes risk', color: 'yellow' }, 'CC': { impact: 'challenging', description: 'Elevated type 2 diabetes risk', color: 'red' } } },
        'PPARG': { rsid: 'rs1801282', analysis: { 'CC': { impact: 'beneficial', description: 'Better insulin sensitivity', color: 'green' }, 'CG': { impact: 'neutral', description: 'Moderate insulin sensitivity', color: 'yellow' }, 'GG': { impact: 'challenging', description: 'Reduced insulin sensitivity', color: 'red' } } },
        'FTO': { rsid: 'rs9939609', analysis: { 'AA': { impact: 'beneficial', description: 'Lower obesity risk', color: 'green' }, 'AT': { impact: 'neutral', description: 'Moderate obesity risk', color: 'yellow' }, 'TT': { impact: 'challenging', description: 'Elevated obesity risk', color: 'red' } } },
        'MC4R': { rsid: 'rs17782313', analysis: { 'CC': { impact: 'beneficial', description: 'Better appetite regulation', color: 'green' }, 'CT': { impact: 'neutral', description: 'Moderate appetite control', color: 'yellow' }, 'TT': { impact: 'challenging', description: 'Reduced appetite regulation', color: 'red' } } },
        'ADIPOQ': { rsid: 'rs266729', analysis: { 'GG': { impact: 'beneficial', description: 'Better adiponectin function', color: 'green' }, 'GA': { impact: 'neutral', description: 'Moderate adiponectin function', color: 'yellow' }, 'AA': { impact: 'challenging', description: 'Reduced adiponectin function', color: 'red' } } },
        'SLC2A2': { rsid: 'rs5400', analysis: { 'GG': { impact: 'beneficial', description: 'Better glucose transport', color: 'green' }, 'GA': { impact: 'neutral', description: 'Moderate glucose transport', color: 'yellow' }, 'AA': { impact: 'challenging', description: 'Reduced glucose transport', color: 'red' } } },
        'MTNR1B': { rsid: 'rs10830963', analysis: { 'GG': { impact: 'beneficial', description: 'Lower diabetes risk', color: 'green' }, 'GC': { impact: 'neutral', description: 'Moderate diabetes risk', color: 'yellow' }, 'CC': { impact: 'challenging', description: 'Elevated diabetes risk', color: 'red' } } },
        'GCK': { rsid: 'rs1799884', analysis: { 'AA': { impact: 'beneficial', description: 'Normal glucose sensing', color: 'green' }, 'AG': { impact: 'neutral', description: 'Moderate glucose sensing', color: 'yellow' }, 'GG': { impact: 'challenging', description: 'Altered glucose sensing', color: 'red' } } }
      },
      description: 'Genes affecting metabolism, insulin sensitivity, obesity risk, and type 2 diabetes'
    },
    'Power and Strength': {
      genes: {
        'ACE': { rsid: 'rs4341', analysis: { 'DD': { impact: 'beneficial', description: 'Power advantage, better strength gains', color: 'green' }, 'ID': { impact: 'neutral', description: 'Balanced power/endurance', color: 'yellow' }, 'II': { impact: 'beneficial', description: 'Endurance advantage', color: 'green' } } },
        'ACTN3': { rsid: 'rs1815739', analysis: { 'RR': { impact: 'beneficial', description: 'Elite power genetics, fast-twitch dominance', color: 'green' }, 'RX': { impact: 'neutral', description: 'Mixed fiber types', color: 'yellow' }, 'XX': { impact: 'beneficial', description: 'Endurance genetics, slow-twitch dominance', color: 'green' } } },
        'AGT': { rsid: 'rs699', analysis: { 'TT': { impact: 'beneficial', description: 'Better strength potential', color: 'green' }, 'CT': { impact: 'neutral', description: 'Moderate strength potential', color: 'yellow' }, 'CC': { impact: 'challenging', description: 'Reduced strength potential', color: 'red' } } },
        'CKM': { rsid: 'rs8111989', analysis: { 'AA': { impact: 'beneficial', description: 'Enhanced creatine kinase activity', color: 'green' }, 'AG': { impact: 'neutral', description: 'Moderate creatine kinase activity', color: 'yellow' }, 'GG': { impact: 'challenging', description: 'Reduced creatine kinase activity', color: 'red' } } },
        'IL6': { rsid: 'rs1800795', analysis: { 'CC': { impact: 'beneficial', description: 'Better inflammation control', color: 'green' }, 'CG': { impact: 'neutral', description: 'Moderate inflammation control', color: 'yellow' }, 'GG': { impact: 'challenging', description: 'Higher inflammation risk', color: 'red' } } },
        'NOS3': { rsid: 'rs1799983', analysis: { 'TT': { impact: 'beneficial', description: 'Optimal blood flow to muscles', color: 'green' }, 'GT': { impact: 'neutral', description: 'Moderate blood flow', color: 'yellow' }, 'GG': { impact: 'challenging', description: 'Reduced blood flow', color: 'red' } } },
        'PPARA': { rsid: 'rs4253778', analysis: { 'GG': { impact: 'beneficial', description: 'Enhanced fat metabolism', color: 'green' }, 'GA': { impact: 'neutral', description: 'Moderate fat metabolism', color: 'yellow' }, 'AA': { impact: 'challenging', description: 'Reduced fat metabolism', color: 'red' } } },
        'PPARGC1A': { rsid: 'rs8192678', analysis: { 'GG': { impact: 'beneficial', description: 'Superior mitochondrial function', color: 'green' }, 'GA': { impact: 'neutral', description: 'Moderate mitochondrial function', color: 'yellow' }, 'AA': { impact: 'challenging', description: 'Reduced mitochondrial function', color: 'red' } } },
        'SOD2': { rsid: 'rs4880', analysis: { 'TT': { impact: 'beneficial', description: 'Better antioxidant protection', color: 'green' }, 'CT': { impact: 'neutral', description: 'Moderate antioxidant protection', color: 'yellow' }, 'CC': { impact: 'challenging', description: 'Reduced antioxidant protection', color: 'red' } } }
      },
      description: 'Genes influencing muscle fiber composition, strength development, and power output'
    },
    'Endurance Capability': {
      genes: {
        'ACE': { rsid: 'rs4341', analysis: { 'II': { impact: 'beneficial', description: 'Superior endurance capacity', color: 'green' }, 'ID': { impact: 'neutral', description: 'Balanced capacity', color: 'yellow' }, 'DD': { impact: 'beneficial', description: 'Power advantage', color: 'green' } } },
        'ACTN3': { rsid: 'rs1815739', analysis: { 'XX': { impact: 'beneficial', description: 'Elite endurance genetics', color: 'green' }, 'RX': { impact: 'neutral', description: 'Mixed capacity', color: 'yellow' }, 'RR': { impact: 'beneficial', description: 'Power genetics', color: 'green' } } },
        'COMT': { rsid: 'rs4680', analysis: { 'GG': { impact: 'beneficial', description: 'Better pain tolerance', color: 'green' }, 'GA': { impact: 'neutral', description: 'Moderate pain tolerance', color: 'yellow' }, 'AA': { impact: 'challenging', description: 'Lower pain tolerance', color: 'red' } } },
        'CRP': { rsid: 'rs1205', analysis: { 'CC': { impact: 'beneficial', description: 'Lower chronic inflammation', color: 'green' }, 'CG': { impact: 'neutral', description: 'Moderate inflammation', color: 'yellow' }, 'GG': { impact: 'challenging', description: 'Higher chronic inflammation', color: 'red' } } },
        'DRD4': { rsid: 'rs1800955', analysis: { '4R/4R': { impact: 'beneficial', description: 'Better focus and endurance', color: 'green' }, '4R/7R': { impact: 'neutral', description: 'Moderate focus', color: 'yellow' }, '7R/7R': { impact: 'challenging', description: 'Reduced focus capacity', color: 'red' } } },
        'HFE': { rsid: 'rs1799945', analysis: { 'CC': { impact: 'beneficial', description: 'Normal iron metabolism', color: 'green' }, 'CG': { impact: 'neutral', description: 'Moderate iron metabolism', color: 'yellow' }, 'GG': { impact: 'challenging', description: 'Altered iron metabolism', color: 'red' } } },
        'PPARA': { rsid: 'rs4253778', analysis: { 'GG': { impact: 'beneficial', description: 'Enhanced aerobic capacity', color: 'green' }, 'GA': { impact: 'neutral', description: 'Moderate aerobic capacity', color: 'yellow' }, 'AA': { impact: 'challenging', description: 'Reduced aerobic capacity', color: 'red' } } },
        'UCP3': { rsid: 'rs1800849', analysis: { 'CC': { impact: 'beneficial', description: 'Better energy efficiency', color: 'green' }, 'CT': { impact: 'neutral', description: 'Moderate energy efficiency', color: 'yellow' }, 'TT': { impact: 'challenging', description: 'Reduced energy efficiency', color: 'red' } } },
        'VEGFA': { rsid: 'rs2010963', analysis: { 'CC': { impact: 'beneficial', description: 'Enhanced angiogenesis', color: 'green' }, 'CT': { impact: 'neutral', description: 'Moderate angiogenesis', color: 'yellow' }, 'TT': { impact: 'challenging', description: 'Reduced angiogenesis', color: 'red' } } }
      },
      description: 'Genes affecting aerobic capacity, fatigue resistance, and endurance performance'
    },
    'Injury Risk': {
      genes: {
        'COL1A1': { rsid: 'rs1800012', analysis: { 'GG': { impact: 'beneficial', description: 'Stronger collagen structure', color: 'green' }, 'GT': { impact: 'neutral', description: 'Moderate collagen strength', color: 'yellow' }, 'TT': { impact: 'challenging', description: 'Weaker collagen structure', color: 'red' } } },
        'COL5A1': { rsid: 'rs12722', analysis: { 'CC': { impact: 'beneficial', description: 'Better tendon integrity', color: 'green' }, 'CT': { impact: 'neutral', description: 'Moderate tendon integrity', color: 'yellow' }, 'TT': { impact: 'challenging', description: 'Higher tendon injury risk', color: 'red' } } },
        'GDF5': { rsid: 'rs143383', analysis: { 'TT': { impact: 'beneficial', description: 'Better joint health', color: 'green' }, 'TC': { impact: 'neutral', description: 'Moderate joint health', color: 'yellow' }, 'CC': { impact: 'challenging', description: 'Higher joint injury risk', color: 'red' } } }
      },
      description: 'Genes influencing connective tissue strength, tendon integrity, and injury susceptibility'
    },
    'Recovery & Adaptation': {
      genes: {
        'PPARGC1A': { rsid: 'rs8192678', analysis: { 'GG': { impact: 'beneficial', description: 'Superior recovery capacity', color: 'green' }, 'GA': { impact: 'neutral', description: 'Moderate recovery capacity', color: 'yellow' }, 'AA': { impact: 'challenging', description: 'Reduced recovery capacity', color: 'red' } } },
        'BDNF': { rsid: 'rs6265', analysis: { 'Val/Val': { impact: 'beneficial', description: 'Enhanced adaptation and learning', color: 'green' }, 'Val/Met': { impact: 'neutral', description: 'Moderate adaptation', color: 'yellow' }, 'Met/Met': { impact: 'challenging', description: 'Reduced adaptation capacity', color: 'red' } } },
        'COMT': { rsid: 'rs4680', analysis: { 'GG': { impact: 'beneficial', description: 'Better stress recovery', color: 'green' }, 'GA': { impact: 'neutral', description: 'Moderate stress recovery', color: 'yellow' }, 'AA': { impact: 'challenging', description: 'Slower stress recovery', color: 'red' } } }
      },
      description: 'Genes affecting recovery rate, adaptation to training, and stress response'
    }
  };

  const getGeneAnalysis = (categoryName: string, geneName: string, genotype: string) => {
    const category = geneticAnalysisData[categoryName as keyof typeof geneticAnalysisData];
    if (!category || !category.genes[geneName as keyof typeof category.genes]) {
      return { impact: 'unknown', description: 'Analysis not available', color: 'gray' };
    }

    const geneData = category.genes[geneName as keyof typeof category.genes] as any;
    const analysis = geneData.analysis[genotype as keyof typeof geneData.analysis] ||
                    geneData.analysis['default'] ||
                    { impact: 'unknown', description: 'Analysis not available', color: 'gray' };

    return analysis;
  };

  const getGenesForCategory = (categoryName: string) => {
    return allGenes.filter(g => g.category === categoryName);
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-white-900 mb-4">🔬 Comprehensive Genetic Analysis</h2>
        <p className="text-xl text-gray-600 max-w-4xl mx-auto">
          Athlete-specific genetic analysis for {athlete.name} (ID: {athleteId}) from athletegeneticsummary table.
          Detailed analysis of {allGenes.filter(g => !g.gene.startsWith('$') && g.gene !== 'id' && g.gene !== 'Id' && g.gene !== 'ID').length} genetic markers across {Object.keys(geneticAnalysisData).length} health categories.
        </p>
        <div className="text-sm text-gray-500 mt-2">
          Data source: geneticProfileService.getGeneticSummaryByAthlete({athleteId})
        </div>
      </div>

      {/* Category Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
        {Object.entries(geneticAnalysisData).map(([categoryName, categoryData]) => {
          const categoryGenes = getGenesForCategory(categoryName);
          const beneficialCount = categoryGenes.filter(g =>
            getGeneAnalysis(categoryName, g.gene, g.genotype).impact === 'beneficial'
          ).length;
          const challengingCount = categoryGenes.filter(g =>
            getGeneAnalysis(categoryName, g.gene, g.genotype).impact === 'challenging'
          ).length;

          return (
            <div key={categoryName} className="card-enhanced p-4 text-center hover:shadow-lg transition-shadow">
              <div className="text-2xl mb-2">
                {categoryName.includes('Sleep') ? '😴' :
                 categoryName.includes('Mental') ? '🧠' :
                 categoryName.includes('Cardiovascular') ? '❤️' :
                 categoryName.includes('Metabolic') ? '⚡' :
                 categoryName.includes('Power') ? '💪' :
                 categoryName.includes('Endurance') ? '🏃' :
                 categoryName.includes('Injury') ? '🩹' :
                 categoryName.includes('Recovery') ? '🔄' :
                 '🧬'}
              </div>
              <div className="text-sm font-semibold text-gray-900 mb-1 leading-tight">
                {categoryName.replace(' markers', '').replace(' Capability', '').replace(' Risk', '')}
              </div>
              <div className="text-lg font-bold text-blue-600 mb-1">
                {categoryGenes.length}/{Object.keys(categoryData.genes).length}
              </div>
              <div className="text-xs text-gray-500 mb-2">markers</div>
              {beneficialCount > 0 && (
                <div className="flex justify-center items-center gap-1 text-xs">
                  <span className="text-green-600">●</span>
                  <span className="text-green-600 font-medium">{beneficialCount}</span>
                </div>
              )}
              {challengingCount > 0 && (
                <div className="flex justify-center items-center gap-1 text-xs mt-1">
                  <span className="text-red-600">●</span>
                  <span className="text-red-600 font-medium">{challengingCount}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Key Genetic Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Genetic Strengths */}
        <div className="card-enhanced p-6">
          <h3 className="text-xl font-bold text-green-700 mb-6 flex items-center gap-3">
            <span className="bg-green-100 p-2 rounded-full text-green-700">💪</span>
            Genetic Strengths
          </h3>
          <div className="space-y-4">
            {allGenes.filter(g => getGeneAnalysis(g.category, g.gene, g.genotype).impact === 'beneficial').slice(0, 5).map((gene, idx) => {
              const analysis = getGeneAnalysis(gene.category, gene.gene, gene.genotype);
              return (
                <div key={idx} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <span className="text-green-600 mt-0.5">✅</span>
                  <div>
                    <div className="font-medium text-green-800 text-sm">{gene.gene} ({gene.genotype})</div>
                    <div className="text-xs text-green-600 mt-1">{analysis.description}</div>
                    <div className="text-xs text-gray-500 mt-1">{gene.category}</div>
                  </div>
                </div>
              );
            })}
            {allGenes.filter(g => getGeneAnalysis(g.category, g.gene, g.genotype).impact === 'beneficial').length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No significant genetic advantages identified
              </div>
            )}
          </div>
        </div>

        {/* Areas for Attention */}
        <div className="card-enhanced p-6">
          <h3 className="text-xl font-bold text-orange-700 mb-6 flex items-center gap-3">
            <span className="bg-orange-100 p-2 rounded-full text-orange-700">⚠️</span>
            Areas for Attention
          </h3>
          <div className="space-y-4">
            {allGenes.filter(g => getGeneAnalysis(g.category, g.gene, g.genotype).impact === 'challenging').slice(0, 5).map((gene, idx) => {
              const analysis = getGeneAnalysis(gene.category, gene.gene, gene.genotype);
              return (
                <div key={idx} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <span className="text-orange-600 mt-0.5">⚠️</span>
                  <div>
                    <div className="font-medium text-orange-800 text-sm">{gene.gene} ({gene.genotype})</div>
                    <div className="text-xs text-orange-600 mt-1">{analysis.description}</div>
                    <div className="text-xs text-gray-500 mt-1">{gene.category}</div>
                  </div>
                </div>
              );
            })}
            {allGenes.filter(g => getGeneAnalysis(g.category, g.gene, g.genotype).impact === 'challenging').length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No significant genetic challenges identified
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Personalized Recommendations */}
      <div className="card-enhanced p-6 mb-8">
        <h3 className="text-xl font-bold text-blue-700 mb-6 flex items-center gap-3">
          <span className="bg-blue-100 p-2 rounded-full text-blue-700">🎯</span>
          Personalized Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Training Recommendations */}
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
              <span className="text-lg">🏋️</span>
              Training Focus
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              {allGenes.some(g => g.gene === 'ACTN3' && getGeneAnalysis(g.category, g.gene, g.genotype).impact === 'beneficial') && (
                <li>• Prioritize explosive power training</li>
              )}
              {allGenes.some(g => g.gene === 'ACE' && g.genotype.includes('II')) && (
                <li>• Focus on endurance-based sessions</li>
              )}
              {allGenes.some(g => g.gene === 'COL5A1' && getGeneAnalysis(g.category, g.gene, g.genotype).impact === 'challenging') && (
                <li>• Include extra mobility work</li>
              )}
              {allGenes.length > 0 && !allGenes.some(g => ['ACTN3', 'ACE'].includes(g.gene)) && (
                <li>• Balanced training approach recommended</li>
              )}
            </ul>
          </div>

          {/* Nutrition Recommendations */}
          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
              <span className="text-lg">🥗</span>
              Nutrition Focus
            </h4>
            <ul className="text-sm text-green-700 space-y-1">
              {allGenes.some(g => g.gene === 'MTHFR' && getGeneAnalysis(g.category, g.gene, g.genotype).impact === 'challenging') && (
                <li>• Consider methylated B vitamins</li>
              )}
              {allGenes.some(g => g.gene === 'PPARGC1A' && getGeneAnalysis(g.category, g.gene, g.genotype).impact === 'beneficial') && (
                <li>• Higher carbohydrate tolerance</li>
              )}
              {allGenes.some(g => g.gene === 'FTO' && getGeneAnalysis(g.category, g.gene, g.genotype).impact === 'challenging') && (
                <li>• Mindful portion control</li>
              )}
              {allGenes.length > 0 && !allGenes.some(g => ['MTHFR', 'PPARGC1A', 'FTO'].includes(g.gene)) && (
                <li>• Standard nutritional guidelines</li>
              )}
            </ul>
          </div>

          {/* Recovery Recommendations */}
          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
            <h4 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
              <span className="text-lg">😴</span>
              Recovery Focus
            </h4>
            <ul className="text-sm text-purple-700 space-y-1">
              {allGenes.some(g => g.gene === 'BDNF' && getGeneAnalysis(g.category, g.gene, g.genotype).impact === 'beneficial') && (
                <li>• Excellent neuroplasticity for learning</li>
              )}
              {allGenes.some(g => g.gene === 'COMT' && getGeneAnalysis(g.category, g.gene, g.genotype).impact === 'challenging') && (
                <li>• May need longer recovery periods</li>
              )}
              {allGenes.some(g => g.gene === 'PER3' && g.genotype === '4/4') && (
                <li>• Morning chronotype - early training optimal</li>
              )}
              {allGenes.length > 0 && !allGenes.some(g => ['BDNF', 'COMT', 'PER3'].includes(g.gene)) && (
                <li>• Standard recovery protocols</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Summary Insights */}
      <section className="card-enhanced p-8 bg-gradient-to-r from-blue-50 to-purple-50">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">📊 Genetic Profile Summary</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {allGenes.filter(g => getGeneAnalysis(g.category, g.gene, g.genotype).impact === 'beneficial').length}
            </div>
            <div className="text-lg font-semibold text-green-800">Beneficial Variants</div>
            <div className="text-sm text-green-600">Genetic advantages identified</div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600 mb-2">
              {allGenes.filter(g => getGeneAnalysis(g.category, g.gene, g.genotype).impact === 'neutral').length}
            </div>
            <div className="text-lg font-semibold text-yellow-800">Neutral Variants</div>
            <div className="text-sm text-yellow-600">Average genetic profile</div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-red-600 mb-2">
              {allGenes.filter(g => getGeneAnalysis(g.category, g.gene, g.genotype).impact === 'challenging').length}
            </div>
            <div className="text-lg font-semibold text-red-800">Areas for Attention</div>
            <div className="text-sm text-red-600">Potential optimization opportunities</div>
          </div>
        </div>

        <div className="text-center text-gray-700">
          <p className="text-lg mb-2">
            This comprehensive genetic analysis provides personalized insights into your athletic potential,
            health risks, and optimization strategies.
          </p>
          <p className="text-sm text-gray-600">
            Remember: Genetics are one piece of the puzzle. Lifestyle, training, and nutrition play crucial roles
            in maximizing your genetic potential.
          </p>
        </div>
      </section>
    </div>
  );
};

// Comprehensive Genetic Health Dashboard
const GeneticInsightsTab: React.FC<{ geneticSummary: any[]; athlete: any }> = ({ geneticSummary, athlete }) => {
  // Flatten all genes from summaries
  const allGenes = geneticSummary.flatMap((summary: any) => {
    let genesData = summary.Genes || {};
    if (typeof genesData === 'string') {
      try {
        genesData = JSON.parse(genesData);
      } catch {
        genesData = {};
      }
    }
    if (Array.isArray(genesData)) {
      if (typeof genesData[0] === 'object' && genesData[0] !== null) {
        return genesData.map((g: any) => ({
          gene: g.gene || g.Gene || g.rsid || g.RSID || 'Unknown',
          genotype: g.genotype || g.Genotype || 'Unknown',
          rsid: g.rsid || g.RSID || '',
          category: summary.Category || summary.category || 'Unknown',
          summary
        })).filter(g => !g.gene.startsWith('$') && g.gene !== 'id' && g.gene !== 'Id' && g.gene !== 'ID');
      } else {
        const obj = genesData.reduce((acc: any, item: any) => {
          acc[item.Key || item.key] = item.Value || item.value;
          return acc;
        }, {});
        return Object.entries(obj)
          .filter(([gene]) => !gene.startsWith('$') && gene !== 'id' && gene !== 'Id' && gene !== 'ID')
          .map(([gene, genotype]) => ({
            gene,
            genotype: genotype as string,
            rsid: '',
            category: summary.Category || summary.category || 'Unknown',
            summary
          }));
      }
    } else if (typeof genesData === 'object' && genesData !== null) {
      const entries = Object.entries(genesData).filter(([key]) => !key.startsWith('$') && key !== 'id' && key !== 'Id' && key !== 'ID');
      return entries.map(([gene, genotype]) => ({
        gene,
        genotype: genotype as string,
        rsid: '',
        category: summary.Category || summary.category || 'Unknown',
        summary
      }));
    }
    return [];
  });

  // Define comprehensive genetic categories from the document
  const geneticCategories = {
    'Performance & Fitness': [
      { name: 'Power and Strength', genes: ['ACTN3', 'ACE', 'AGT', 'CKM', 'IL6', 'NOS3', 'PPARA', 'PPARGC1A', 'SOD2'], icon: '💪', color: 'orange' },
      { name: 'Endurance Capability', genes: ['ACE', 'ACTN3', 'COMT', 'CRP', 'DRD4', 'HFE', 'PPARA', 'UCP3', 'VEGFA'], icon: '🏃', color: 'blue' },
      { name: 'Lactate Threshold', genes: ['ACTN3', 'AMPD1', 'PPARGC1A', 'VEGFA'], icon: '⚡', color: 'yellow' },
      { name: 'Energy production during Exercise', genes: ['AMPD1', 'GABPB1', 'PPARA', 'PPARGC1A'], icon: '🔋', color: 'green' },
      { name: 'Muscle building', genes: ['ACTN3', 'ACE', 'MYH7', 'MSTN', 'FST', 'ACVR2B', 'IGF1', 'COL1A1', 'COL5A1', 'VDR', 'AR', 'CYP19A1', 'SHBG', 'IL6', 'TNF', 'SOD2'], icon: '🏋️', color: 'purple' }
    ],
    'Health & Disease Risk': [
      { name: 'Cardiovascular markers', genes: ['APOE', 'NOS3', 'ACE', 'AGT', 'ADRB2', 'MTHFR', 'LPA', 'CRP'], icon: '❤️', color: 'red' },
      { name: 'Metabolic Health', genes: ['TCF7L2', 'PPARG', 'FTO', 'MC4R', 'ADIPOQ', 'SLC2A2', 'MTNR1B', 'GCK'], icon: '⚕️', color: 'orange' },
      { name: 'Insulin Resistance Risk', genes: ['KCNJ11', 'PPARG', 'SLC2A2', 'TCF7L2'], icon: '🩸', color: 'red' },
      { name: 'Blood Clotting Risk', genes: ['F2', 'F5'], icon: '🩸', color: 'purple' },
      { name: 'Blood Flow and Circulation', genes: ['ACE', 'ADRB2', 'AGT', 'BDKRB2', 'NOS3'], icon: '💉', color: 'blue' },
      { name: 'Blood pressure Regulation', genes: ['ACE', 'ADRB1', 'AGT', 'NOS3'], icon: '🩺', color: 'indigo' },
      { name: 'Haemochromatosis Risk', genes: ['HFE'], icon: '🩸', color: 'red' },
      { name: 'Concussion Risk', genes: ['APOE', 'MTHFR', 'PEMT'], icon: '🧠', color: 'gray' },
      { name: 'Oxidative Stress', genes: ['SOD2', 'GCLC', 'SOD3', 'NQO1', 'CAT', 'GPX1', 'GSTM1', 'OGG1', 'EPHX1'], icon: '⚡', color: 'yellow' }
    ],
    'Injury Risk': [
      { name: 'Knee injury Risk', genes: ['COL1A1', 'GDF5'], icon: '🦵', color: 'red' },
      { name: 'Achilles Tendonitis Risk', genes: ['COL5A1'], icon: '🦵', color: 'orange' },
      { name: 'Bone and Joint Health Risk', genes: ['COL6A4P1', 'IL1R1', 'MCF2L', 'VDR', 'CYP2R1', 'NADSYN1', 'GC'], icon: '🦴', color: 'blue' },
      { name: 'Lower Back Pain risk', genes: ['CILP', 'COL11A1', 'COL9A3'], icon: '🦴', color: 'purple' },
      { name: 'Soft tissue Injury Risk', genes: ['AMPD1', 'GDF5', 'INS-IGF2'], icon: '🩹', color: 'red' },
      { name: 'General Injury risk', genes: ['COL5A1', 'GDF5', 'COL1A1'], icon: '🩹', color: 'orange' }
    ],
    'Mental Health & Cognition': [
      { name: 'Mental Health', genes: ['COMT', 'SLC6A4', 'TPH2', 'BDNF', 'MAO-A', 'FKBP5', 'GABRA6', 'HTR1A', 'OXTR'], icon: '🧠', color: 'purple' },
      { name: 'Anxiety risk', genes: ['COMT', 'SLC6A4', 'TPH2', 'BDNF', 'MAO-A', 'FKBP5', 'HTR1A', 'IL1B', 'OPRM1', 'OXTR'], icon: '😰', color: 'orange' },
      { name: 'Cognitive Memory', genes: ['ANK3', 'APOE', 'BDNF', 'CACNA1C', 'CETP', 'DRD2', 'TNF'], icon: '🧠', color: 'blue' },
      { name: 'Dopamine Reward', genes: ['ANKK1', 'CACNA1C', 'COMT', 'DRD2', 'DRD4'], icon: '🎯', color: 'green' }
    ],
    'Recovery & Sleep': [
      { name: 'Core Sleep markers', genes: ['COMT', 'PER3', 'CLOCK', 'BDNF', 'PPARGC1A', 'ACTN3', 'NOS3', 'TPH2', 'GABRA6', 'GSK3B', 'PER2'], icon: '😴', color: 'indigo' },
      { name: 'Heart Rate Variability/Autonomic Stress', genes: ['ADRB1', 'ADRB2', 'ACE', 'NOS3', 'CHRM2', 'RGS6'], icon: '❤️', color: 'red' }
    ],
    'Metabolism & Nutrition': [
      { name: 'Methylation Pathways', genes: ['MTHFR', 'MTHFR', 'MTRR', 'MTR', 'BHMT-02', 'CBS', 'SHMT1', 'PEMT', 'SLC19A1', 'TCN2', 'MTHFD1', 'FUT2', 'MAT1A', 'TPH2', 'VDR', 'GSTM1', 'GSTP1', 'GSTT1'], icon: '🧬', color: 'green' },
      { name: 'Detox Phase 1', genes: ['CYP1A1', 'CYP1A2', 'CYP1B1', 'CYP2A6', 'CYP2D6'], icon: '🛡️', color: 'yellow' },
      { name: 'Detox phase 2', genes: ['GSTM1', 'GSTP1', 'GSTT1', 'NAT2', 'NQO1', 'SULT1A1'], icon: '🛡️', color: 'orange' },
      { name: 'Caffeine Metabolism', genes: ['CYP1A2', 'AHR', 'POR', 'ADORA2A'], icon: '☕', color: 'brown' },
      { name: 'Estrogen Metabolism', genes: ['COMT', 'CYP17A1', 'CYP19A1', 'GSTM1', 'GSTT1'], icon: '⚗️', color: 'pink' },
      { name: 'Sex hormone Metabolism', genes: ['COMT', 'CYP1A1', 'CYP1B1', 'SULT1A1'], icon: '⚗️', color: 'purple' },
      { name: 'Vitamin B12 / Pernicious Anaemia', genes: ['FUT2', 'MTR'], icon: '💊', color: 'cyan' },
      { name: 'Gluten Sensitivity', genes: ['TNF'], icon: '🌾', color: 'yellow' }
    ],
    'Environmental & Lifestyle': [
      { name: 'Altitude Training Response', genes: ['ACE', 'ADRB2', 'NOS3', 'PPARA'], icon: '⛰️', color: 'blue' },
      { name: 'Salt Sensitivity', genes: ['ACE', 'AGT'], icon: '🧂', color: 'gray' },
      { name: 'Airway and Allergy', genes: ['ADRB2', 'IL4', 'IL13', 'FCER1A', 'TSLP', 'FLG', 'HRH1', 'HRH4'], icon: '🌬️', color: 'green' },
      { name: 'Bone Health Density', genes: ['DBP', 'VDR'], icon: '🦴', color: 'blue' },
      { name: 'Inflammatory / Infection Response', genes: ['IL6', 'TNF', 'TLR4', 'HLA-DQA1', 'HLA-DQB1', 'HLA-DRB1', 'PON1', 'SH2B3', 'PTPN22', 'SLC23A1', 'GPX1', 'FOXO3', 'IL1B', 'IRF5', 'SOCS2', 'CRP', 'GSTA1', 'IL17A', 'IL1A', 'IL1RN', 'HMOX1'], icon: '🦠', color: 'red' }
    ]
  };

  // Function to get genes for a category
  const getGenesForCategory = (genes: string[]) => {
    return allGenes.filter(g => genes.includes(g.gene));
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">🧬 Comprehensive Genetic Health Dashboard</h2>
        <p className="text-gray-600 text-lg">
          Complete analysis across {Object.keys(geneticCategories).length} health domains • {allGenes.length} genetic markers analyzed
        </p>
      </div>

      {/* Executive Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card-enhanced p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">{allGenes.length}</div>
          <div className="text-sm text-gray-600">Total Genetic Markers</div>
          <div className="text-xs text-gray-500 mt-1">Across all categories</div>
        </div>
        <div className="card-enhanced p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {Object.values(geneticCategories).flat().filter(cat => getGenesForCategory(cat.genes).length > 0).length}
          </div>
          <div className="text-sm text-gray-600">Categories Analyzed</div>
          <div className="text-xs text-gray-500 mt-1">With genetic data</div>
        </div>
        <div className="card-enhanced p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {new Set(allGenes.map(g => g.category)).size}
          </div>
          <div className="text-sm text-gray-600">Genetic Categories</div>
          <div className="text-xs text-gray-500 mt-1">From database</div>
        </div>
        <div className="card-enhanced p-6 text-center">
          <div className="text-3xl font-bold text-indigo-600 mb-2">
            {new Set(allGenes.map(g => g.gene)).size}
          </div>
          <div className="text-sm text-gray-600">Unique Genes</div>
          <div className="text-xs text-gray-500 mt-1">Identified</div>
        </div>
      </div>

      {/* Health Domain Sections */}
      {Object.entries(geneticCategories).map(([domain, categories]) => (
        <section key={domain} className="space-y-6">
          <div className="border-t pt-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <span className="bg-gradient-to-r from-blue-100 to-purple-100 p-3 rounded-full">
                {domain === 'Performance & Fitness' ? '🏆' :
                 domain === 'Health & Disease Risk' ? '⚕️' :
                 domain === 'Injury Risk' ? '🩹' :
                 domain === 'Mental Health & Cognition' ? '🧠' :
                 domain === 'Recovery & Sleep' ? '😴' :
                 domain === 'Metabolism & Nutrition' ? '🥗' :
                 '🌍'}
              </span>
              {domain}
              <span className="text-lg font-normal text-gray-600">
                ({categories.filter(cat => getGenesForCategory(cat.genes).length > 0).length} active categories)
              </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category, idx) => {
                const categoryGenes = getGenesForCategory(category.genes);
                const hasData = categoryGenes.length > 0;

                return (
                  <div key={idx} className={`card-enhanced p-5 ${hasData ? 'hover:shadow-lg transition-shadow' : 'opacity-60'}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl">{category.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-sm leading-tight">
                          {category.name}
                        </h4>
                        <div className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                          hasData
                            ? `bg-${category.color}-100 text-${category.color}-800`
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {categoryGenes.length} markers
                        </div>
                      </div>
                    </div>

                    {hasData ? (
                      <div className="space-y-2">
                        {categoryGenes.slice(0, 3).map((gene, geneIdx) => (
                          <div key={geneIdx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                            <span className="font-medium text-gray-700">{gene.gene}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-gray-600">{gene.genotype}</span>
                              {gene.rsid && (
                                <span className="text-gray-500 bg-white px-1 py-0.5 rounded text-xs">
                                  {gene.rsid}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        {categoryGenes.length > 3 && (
                          <div className="text-center text-xs text-gray-500 py-1">
                            +{categoryGenes.length - 3} more genes
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        No genetic data available
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ))}

      {/* Genetic Data Summary */}
      {allGenes.length > 0 && (
        <section className="card-enhanced p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
            <span className="bg-gradient-to-r from-green-100 to-blue-100 p-2 rounded-full text-green-700">📊</span>
            Genetic Data Summary
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Object.entries(
              allGenes.reduce((acc, gene) => {
                acc[gene.category] = (acc[gene.category] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).sort(([,a], [,b]) => b - a).slice(0, 8).map(([category, count]) => (
              <div key={category} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-gray-900">{count}</div>
                <div className="text-xs text-gray-600">{category}</div>
              </div>
            ))}
          </div>

          <div className="text-center text-sm text-gray-600">
            Total genetic markers analyzed: {allGenes.filter(g => !g.gene.startsWith('$') && g.gene !== 'id' && g.gene !== 'Id' && g.gene !== 'ID').length} across {new Set(allGenes.map(g => g.category)).size} categories
          </div>
        </section>
      )}
    </div>
  );
};

// Performance Matrix Tab Component
const GeneticPerformanceTab: React.FC<{ geneticSummary: any[]; athleteBiometrics: any[] }> = ({ geneticSummary, athleteBiometrics }) => {
  const performanceCategories = [
    {
      trait: 'Power & Strength',
      genes: geneticSummary.filter((m: any) => ['ACTN3', 'ACE', 'AGT', 'CKM', 'IL6', 'NOS3', 'PPARA', 'PPARGC1A', 'SOD2'].includes(m.Gene || m.gene || m.GENE)),
      icon: '💪',
      color: 'orange',
      description: 'Explosive power & muscle strength'
    },
    {
      trait: 'Endurance',
      genes: geneticSummary.filter((m: any) => ['ACE', 'ACTN3', 'COMT', 'CRP', 'DRD4', 'HFE', 'PPARA', 'UCP3', 'VEGFA'].includes(m.Gene || m.gene || m.GENE)),
      icon: '🏃',
      color: 'blue',
      description: 'Cardiovascular efficiency'
    },
    {
      trait: 'Recovery',
      genes: geneticSummary.filter((m: any) => ['PPARA', 'BDNF', 'COMT', 'PPARGC1A', 'NOS3'].includes(m.Gene || m.gene || m.GENE)),
      icon: '🔄',
      color: 'green',
      description: 'Recovery & adaptation rate'
    },
    {
      trait: 'Injury Risk',
      genes: geneticSummary.filter((m: any) => ['COL5A1', 'GDF5', 'COL1A1', 'ADRB2'].includes(m.Gene || m.gene || m.GENE)),
      icon: '🛡️',
      color: 'red',
      description: 'Injury susceptibility'
    },
    {
      trait: 'Metabolism',
      genes: geneticSummary.filter((m: any) => ['TCF7L2', 'PPARG', 'FTO', 'MC4R', 'ADIPOQ', 'SLC2A2', 'MTNR1B', 'GCK'].includes(m.Gene || m.gene || m.GENE)),
      icon: '⚡',
      color: 'yellow',
      description: 'Energy & nutrient metabolism'
    },
    {
      trait: 'Cognition',
      genes: geneticSummary.filter((m: any) => ['ANK3', 'APOE', 'BDNF', 'CACNA1C', 'CETP', 'DRD2', 'TNF', 'COMT'].includes(m.Gene || m.gene || m.GENE)),
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
       const [activeTab, setActiveTab] = useState<'metrics' | 'trends' | 'insights' | 'digitalTwin' | 'trainingLoad' | 'recoveryTimeline' | 'pharmacogenomics' | 'nutrigenomics' | 'recoveryGenes' | 'predictive' | 'sleep' | 'stress' | 'weather' | 'scaleReport' | 'bloodResults' | 'circadian' | 'chatAI' | 'geneticSummary' | 'geneticAnalysis'>('metrics');
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

        // Handle genetic summary data

        setGeneticSummary(summaryData);
        setFilteredGeneticSummary(summaryData); // Initialize filtered results
      } catch (error) {
        // Handle error silently
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
  const validBiometricData = filterValidBiometricData(athleteBiometrics);

  const latest = getLatestBiometricRecord(validBiometricData);

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
    { id: 'geneticSummary' as const, label: 'Genetic Summary', icon: '🧬', count: filteredGeneticSummary.length },
    { id: 'geneticAnalysis' as const, label: 'Genetic Analysis', icon: '🔬', count: geneticSummary.length },
    { id: 'scaleReport' as const, label: 'Scale Report', icon: '⚖️', count: 1 },
    { id: 'digitalTwin' as const, label: 'Digital Twin', icon: '🌐', count: 1 },
    { id: 'trainingLoad' as const, label: 'Training Load', icon: '🔥', count: athleteBiometrics.length },
    { id: 'recoveryTimeline' as const, label: 'Recovery Timeline', icon: '📅', count: athleteBiometrics.length },
    { id: 'pharmacogenomics' as const, label: 'Pharmacogenomics', icon: '💊', count: geneticSummary.filter(g => (g.Category || g.category) === 'pharmacogenomics').length || athleteGenetics.length },
    { id: 'nutrigenomics' as const, label: 'Nutrigenomics', icon: '🥗', count: geneticSummary.filter(g => (g.Category || g.category) === 'nutrigenomics').length || athleteGenetics.length },
    { id: 'recoveryGenes' as const, label: 'Recovery Genes', icon: '🧬', count: geneticSummary.filter(g => (g.Category || g.category) === 'recovery').length || athleteGenetics.length },
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
                   {geneticSummary.slice(0, 8).map((summary, summaryIndex) => {
                     let genesData = summary.Genes || summary.genes || {};
                     if (typeof genesData === 'string') {
                       try {
                         genesData = JSON.parse(genesData);
                       } catch {
                         genesData = {};
                       }
                     }
                     let gene = 'Unknown';
                     let genotype = 'Unknown';
                     if (Array.isArray(genesData) && genesData.length > 0) {
                       if (typeof genesData[0] === 'object' && genesData[0] !== null) {
                         // Handle array of gene objects
                         const firstGene = genesData[0];
                         gene = firstGene.gene || firstGene.Gene || firstGene.rsid || firstGene.RSID || 'Unknown';
                         genotype = firstGene.genotype || firstGene.Genotype || 'Unknown';
                       } else {
                         // Handle .NET Dictionary serialization
                         genesData = genesData.reduce((acc: any, item: any) => {
                           acc[item.Key || item.key] = item.Value || item.value;
                           return acc;
                         }, {});
                         const entries = Object.entries(genesData);
                         if (entries.length > 0) {
                           gene = entries[0][0] as string;
                           genotype = entries[0][1] as string;
                         }
                       }
                     } else if (typeof genesData === 'object' && genesData !== null) {
                       // Handle object format
                       const entries = Object.entries(genesData).filter(([key]) => !key.startsWith('$'));
                       if (entries.length > 0) {
                         gene = entries[0][0] as string;
                         genotype = entries[0][1] as string;
                       }
                     }
                     return (
                       <div key={summaryIndex} className="text-sm text-gray-700">
                         <strong>{String(gene || 'Unknown')}:</strong> {String(genotype || 'Unknown')}
                         <div className="text-xs text-gray-500">{summary.Category || summary.category || 'Unknown'}</div>
                       </div>
                     );
                   }).filter(Boolean)}
                 </div>
                 {geneticSummary.reduce((total, summary) => {
                   const genesData = summary.Genes || summary.genes || {};
                   return total + Object.keys(genesData).length;
                 }, 0) > 8 && (
                   <div className="text-xs text-gray-500 mt-2">
                     Showing 8 of {geneticSummary.reduce((total, summary) => {
                       const genesData = summary.Genes || summary.genes || {};
                       return total + Object.keys(genesData).length;
                     }, 0)} genetic markers
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
            geneticData={geneticSummary}
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

      
        {activeTab === 'geneticSummary' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white-900 mb-2">🧬 Genetic Summary</h2>
              
            </div>

            {geneticSummary.length > 0 ? (
              <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="card-enhanced p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{geneticSummary.length}</div>
                    <div className="text-sm text-gray-600">Categories</div>
                  </div>
                  <div className="card-enhanced p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {geneticSummary.reduce((total, summary) => {
                        const genesData = summary.Genes || summary.genes || {};
                        return total + Object.keys(genesData).filter(key => !key.startsWith('$') && key !== 'id' && key !== 'Id' && key !== 'ID').length;
                      }, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Total Genes</div>
                  </div>
                  <div className="card-enhanced p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {new Set(geneticSummary.flatMap(summary => {
                        const genesData = summary.Genes || summary.genes || {};
                        return Object.keys(genesData).filter(key => !key.startsWith('$') && key !== 'id' && key !== 'Id' && key !== 'ID');
                      })).size}
                    </div>
                    <div className="text-sm text-gray-600">Unique Genes</div>
                  </div>
                  <div className="card-enhanced p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {geneticSummary.filter(summary => {
                        const genesData = summary.Genes || summary.genes || {};
                        return Object.keys(genesData).length > 0;
                      }).length}
                    </div>
                    <div className="text-sm text-gray-600">Active Categories</div>
                  </div>
                </div>

                {/* Category Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {geneticSummary.map((summary, index) => {
                    const categoryName = summary.Category || summary.category || 'Unknown';
                    const genesData = summary.Genes || summary.genes || {};
                    const geneCount = Object.keys(genesData).filter(key => !key.startsWith('$') && key !== 'id' && key !== 'Id' && key !== 'ID').length;

                    // Category icons and colors
                    const categoryConfig: Record<string, { icon: string; color: string; bgColor: string }> = {
                      'performance': { icon: '💪', color: 'text-blue-600', bgColor: 'bg-blue-50' },
                      'recovery': { icon: '🔄', color: 'text-green-600', bgColor: 'bg-green-50' },
                      'pharmacogenomics': { icon: '💊', color: 'text-purple-600', bgColor: 'bg-purple-50' },
                      'nutrigenomics': { icon: '🥗', color: 'text-orange-600', bgColor: 'bg-orange-50' },
                      'injury': { icon: '🛡️', color: 'text-red-600', bgColor: 'bg-red-50' },
                      'metabolism': { icon: '⚡', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
                      'cognition': { icon: '🧠', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
                      'sleep': { icon: '😴', color: 'text-pink-600', bgColor: 'bg-pink-50' }
                    };

                    const config = categoryConfig[categoryName.toLowerCase()] || { icon: '🧬', color: 'text-gray-600', bgColor: 'bg-gray-50' };

                    return (
                      <div key={index} className={`card-enhanced p-6 ${config.bgColor} border-l-4`} style={{
                        borderLeftColor: config.color.replace('text-', '').replace('-600', '')
                      }}>
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-2xl">{config.icon}</span>
                          <div>
                            <h3 className={`text-lg font-semibold ${config.color}`}>
                              {categoryName.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                            </h3>
                            <p className="text-sm text-gray-600">{Object.keys(genesData).filter(key => !key.startsWith('$') && key !== 'id' && key !== 'Id' && key !== 'ID').length} genetic marker{Object.keys(genesData).filter(key => !key.startsWith('$') && key !== 'id' && key !== 'Id' && key !== 'ID').length !== 1 ? 's' : ''}</p>
                          </div>
                        </div>

                        {geneCount > 0 ? (
                          <div className="space-y-3">
                            {Object.entries(genesData)
                              .filter(([gene]) => !gene.startsWith('$') && gene !== 'id' && gene !== 'Id' && gene !== 'ID')
                              .slice(0, 6)
                              .map(([gene, genotype], geneIndex) => (
                              <div key={geneIndex} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                                <div className="font-medium text-gray-900">{gene}</div>
                                <div className="font-mono font-bold text-blue-600">{String(genotype)}</div>
                              </div>
                            ))}
                            {Object.keys(genesData).filter(key => !key.startsWith('$') && key !== 'id' && key !== 'Id' && key !== 'ID').length > 6 && (
                              <div className="text-center text-sm text-gray-500 py-2">
                                +{Object.keys(genesData).filter(key => !key.startsWith('$') && key !== 'id' && key !== 'Id' && key !== 'ID').length - 6} more genes
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            No genetic data available for this category
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 card-enhanced">
                <div className="text-6xl mb-4">🧬</div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">No Genetic Summary Data</h4>
                <p className="text-gray-600 max-w-md mx-auto">
                  No genetic summary data found in the athletegeneticsummary table for this athlete.
                  Genetic testing results need to be uploaded to the database.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'geneticAnalysis' && (
          <ComprehensiveGeneticAnalysis athlete={athlete} geneticSummary={geneticSummary} athleteId={athleteId} />
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
                  geneticData={geneticSummary}
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
                    <p className="text-sm text-gray-600">Genetic Summary Count: {geneticSummary.length}</p>
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
                    geneticSummary={geneticSummary}
                  />
                </div>
              )}

      </div>
    </div>
  );
};
