import React, { useMemo, useState, useEffect } from 'react';
import { geneticProfileService } from '../services/dataService';
import { GeneticProfile } from '../types';

interface RecoveryGene {
  gene: string;
  genotype: string;
  category: string;
  trait: string;
  impact: string;
  recoveryProtocol: string;
  priority: 'high' | 'medium' | 'low';
  score: number;
  confidence: number;
}

interface RecoveryInsight {
  category: string;
  title: string;
  description: string;
  score: number;
  recommendations: string[];
  geneticMarkers: string[];
  priority: 'high' | 'medium' | 'low';
}

export const RecoveryGenePanel: React.FC<{ athleteId: string }> = ({ athleteId }) => {
  const [geneticSummary, setGeneticSummary] = useState<any[]>([]);
  const [geneticProfiles, setGeneticProfiles] = useState<GeneticProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [athleteName, setAthleteName] = useState<string>('');

  // Fetch genetic data for the athlete
  useEffect(() => {
    const fetchGeneticData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Convert string athleteId to number for API call
        const athleteIdNum = parseInt(athleteId, 10);
        if (isNaN(athleteIdNum)) {
          throw new Error('Invalid athlete ID');
        }

        // Fetch new genetic summary data for recovery genetics
        const summaryData = await geneticProfileService.getRecoveryGeneticsByAthlete(athleteIdNum);
        setGeneticSummary(summaryData);

        // Also fetch legacy genetic profiles for backward compatibility
        const profiles = await geneticProfileService.getGeneticProfileByAthlete(athleteIdNum);
        setGeneticProfiles(profiles);

        // For now, we'll use a placeholder name since athlete service might not be available
        // In a real implementation, you'd fetch athlete details separately
        setAthleteName(`Athlete ${athleteId}`);

      } catch (err) {
        console.error('Failed to fetch genetic data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load genetic data');
      } finally {
        setLoading(false);
      }
    };

    if (athleteId) {
      fetchGeneticData();
    }
  }, [athleteId]);

  // Get recovery gene insights for the athlete
  const recoveryGenes = useMemo<RecoveryGene[]>(() => {
    const genes: RecoveryGene[] = [];

    // Use new genetic summary data if available
    if (geneticSummary.length > 0) {
      geneticSummary.forEach(summary => {
        genes.push({
          gene: summary.Gene || summary.gene || 'Unknown Gene',
          genotype: summary.GeneticCall || summary.genetic_call || summary.known_call || 'Unknown Genotype',
          category: summary.Category || summary.category || 'Recovery',
          trait: summary.Trait || summary.trait || 'Recovery Trait',
          impact: summary.Impact || summary.interpretation_code || 'Impact not specified',
          recoveryProtocol: summary.Recommendations || summary.override_comment || 'Recovery protocol not specified',
          priority: (summary.Priority || summary.summary_flag || 'medium').toLowerCase() as 'low' | 'medium' | 'high',
          score: summary.Score || 75,
          confidence: summary.Confidence || 80
        });
      });
    } else {
      // Fallback to legacy genetic profiles
      geneticProfiles.forEach(profile => {
        switch(profile.gene) {
          case 'IL6':
            genes.push({
              gene: profile.gene,
              genotype: profile.genotype,
              category: 'Inflammation',
              trait: 'Inflammatory Response',
              impact: profile.genotype === 'GG'
                ? 'Higher baseline inflammation, slower recovery'
                : profile.genotype === 'GC'
                  ? 'Moderate inflammation response'
                  : 'Lower baseline inflammation, faster recovery',
              recoveryProtocol: profile.genotype === 'GG'
                ? 'Emphasize anti-inflammatory nutrition (omega-3s, turmeric), longer recovery periods'
                : profile.genotype === 'GC'
                  ? 'Standard recovery protocols with attention to inflammation markers'
                  : 'May recover quickly with standard protocols',
              priority: profile.genotype === 'GG' ? 'high' : 'medium',
              score: profile.genotype === 'GG' ? 65 : profile.genotype === 'GC' ? 75 : 85,
              confidence: 80
            });
            break;

          case 'TNF':
            genes.push({
              gene: profile.gene,
              genotype: profile.genotype,
              category: 'Inflammation',
              trait: 'Inflammatory Cytokine Production',
              impact: profile.genotype === 'AA'
                ? 'Higher TNF-alpha production, increased inflammation'
                : profile.genotype === 'AG'
                  ? 'Moderate TNF-alpha production'
                  : 'Lower TNF-alpha production, reduced inflammation',
              recoveryProtocol: profile.genotype === 'AA'
                ? 'Prioritize anti-inflammatory interventions (cryotherapy, massage), monitor CRP levels'
                : profile.genotype === 'AG'
                  ? 'Standard anti-inflammatory approaches sufficient'
                  : 'May require less intensive anti-inflammatory interventions',
              priority: profile.genotype === 'AA' ? 'high' : 'medium',
              score: profile.genotype === 'AA' ? 60 : profile.genotype === 'AG' ? 75 : 85,
              confidence: 80
            });
            break;

          case 'IL10':
            genes.push({
              gene: profile.gene,
              genotype: profile.genotype,
              category: 'Anti-inflammation',
              trait: 'Anti-inflammatory Response',
              impact: profile.genotype === 'AA'
                ? 'Higher IL-10 production, better inflammation control'
                : profile.genotype === 'AC'
                  ? 'Moderate IL-10 production'
                  : 'Lower IL-10 production, reduced anti-inflammatory capacity',
              recoveryProtocol: profile.genotype === 'AA'
                ? 'May recover well with standard protocols'
                : profile.genotype === 'AC'
                  ? 'Standard recovery protocols appropriate'
                  : 'Emphasize anti-inflammatory nutrition and recovery modalities',
              priority: profile.genotype === 'CC' ? 'high' : 'low',
              score: profile.genotype === 'AA' ? 85 : profile.genotype === 'AC' ? 75 : 65,
              confidence: 80
            });
            break;

          case 'VDR':
            genes.push({
              gene: profile.gene,
              genotype: profile.genotype,
              category: 'Vitamin D',
              trait: 'Vitamin D Receptor Sensitivity',
              impact: profile.genotype === 'FF'
                ? 'Reduced vitamin D receptor sensitivity, potential deficiency effects'
                : profile.genotype === 'Ff'
                  ? 'Moderate sensitivity'
                  : 'Normal sensitivity',
              recoveryProtocol: profile.genotype === 'FF'
                ? 'Ensure optimal vitamin D status (supplementation if needed), supports immune function'
                : profile.genotype === 'Ff'
                  ? 'Monitor vitamin D levels, supplement as needed'
                  : 'Maintain adequate vitamin D through sun exposure and diet',
              priority: profile.genotype === 'FF' ? 'high' : 'medium',
              score: profile.genotype === 'FF' ? 65 : profile.genotype === 'Ff' ? 75 : 85,
              confidence: 80
            });
            break;

          case 'ADRB1':
            genes.push({
              gene: profile.gene,
              genotype: profile.genotype,
              category: 'Stress Response',
              trait: 'Catecholamine Sensitivity',
              impact: profile.genotype === 'AA'
                ? 'Higher adrenaline sensitivity, increased stress response'
                : profile.genotype === 'AG'
                  ? 'Moderate sensitivity'
                  : 'Lower adrenaline sensitivity, reduced stress response',
              recoveryProtocol: profile.genotype === 'AA'
                ? 'Emphasize parasympathetic activation (meditation, breathing), avoid overstimulation'
                : profile.genotype === 'AG'
                  ? 'Standard stress management techniques'
                  : 'May tolerate higher stimulation, monitor for under-recovery',
              priority: profile.genotype === 'AA' ? 'high' : 'medium',
              score: profile.genotype === 'AA' ? 60 : profile.genotype === 'AG' ? 75 : 85,
              confidence: 80
            });
            break;

          case 'CLOCK':
            genes.push({
              gene: profile.gene,
              genotype: profile.genotype,
              category: 'Circadian Rhythm',
              trait: 'Circadian Rhythm Regulation',
              impact: profile.genotype === 'AA'
                ? 'Enhanced circadian sensitivity, strict schedule benefits'
                : profile.genotype === 'AG'
                  ? 'Moderate circadian sensitivity'
                  : 'Reduced circadian sensitivity, more flexible timing',
              recoveryProtocol: profile.genotype === 'AA'
                ? 'Maintain strict sleep/wake times, minimize blue light exposure 2h before bed'
                : profile.genotype === 'AG'
                  ? 'Consistent schedule beneficial but some flexibility allowed'
                  : 'More adaptable to schedule changes, but still prioritize consistency',
              priority: profile.genotype === 'AA' ? 'high' : 'medium',
              score: profile.genotype === 'AA' ? 70 : profile.genotype === 'AG' ? 75 : 80,
              confidence: 80
            });
            break;

          case 'HSD11B1':
            genes.push({
              gene: profile.gene,
              genotype: profile.genotype,
              category: 'Cortisol',
              trait: 'Cortisol Regeneration',
              impact: profile.genotype === 'TT'
                ? 'Higher cortisol regeneration, increased stress response'
                : profile.genotype === 'TC'
                  ? 'Moderate cortisol regeneration'
                  : 'Lower cortisol regeneration, reduced stress response',
              recoveryProtocol: profile.genotype === 'TT'
                ? 'Prioritize stress management, cortisol-lowering interventions (adaptogens, meditation)'
                : profile.genotype === 'TC'
                  ? 'Standard stress management sufficient'
                  : 'May be more resilient to stress, but still monitor recovery markers',
              priority: profile.genotype === 'TT' ? 'high' : 'medium',
              score: profile.genotype === 'TT' ? 60 : profile.genotype === 'TC' ? 75 : 85,
              confidence: 80
            });
            break;

          case 'COMT':
            genes.push({
              gene: profile.gene,
              genotype: profile.genotype,
              category: 'Stress Response',
              trait: 'Catecholamine Breakdown',
              impact: profile.genotype === 'AA'
                ? 'Slower breakdown of adrenaline/noradrenaline, prolonged stress response'
                : profile.genotype === 'AG'
                  ? 'Moderate breakdown rate'
                  : 'Faster breakdown, quicker return to baseline',
              recoveryProtocol: profile.genotype === 'AA'
                ? 'Emphasize parasympathetic activation, longer recovery periods after high-stress sessions'
                : profile.genotype === 'AG'
                  ? 'Standard recovery protocols appropriate'
                  : 'May recover quickly but monitor for under-recovery from overtraining',
              priority: profile.genotype === 'AA' ? 'high' : 'medium',
              score: profile.genotype === 'AA' ? 60 : profile.genotype === 'AG' ? 75 : 85,
              confidence: 80
            });
            break;
        }
      });
    }

    return genes;
  }, [geneticSummary, geneticProfiles]);
  
  // Calculate overall recovery priority
  const highPriorityCount = recoveryGenes.filter(g => g.priority === 'high').length;
  const mediumPriorityCount = recoveryGenes.filter(g => g.priority === 'medium').length;

  // Generate comprehensive recovery insights
  const recoveryInsights = useMemo<RecoveryInsight[]>(() => {
    const insights: RecoveryInsight[] = [];

    if (geneticSummary.length > 0) {
      // Analyze genetic markers for recovery insights
      const inflammationMarkers = geneticSummary.filter(m =>
        (m.Gene === 'IL6' || m.Gene === 'TNF' || m.Gene === 'IL10') &&
        (m.Category || m.category) === 'recovery'
      );

      const stressMarkers = geneticSummary.filter(m =>
        (m.Gene === 'COMT' || m.Gene === 'ADRB1' || m.Gene === 'HSD11B1') &&
        (m.Category || m.category) === 'recovery'
      );

      const circadianMarkers = geneticSummary.filter(m =>
        (m.Gene === 'CLOCK' || m.Gene === 'PER3') &&
        (m.Category || m.category) === 'recovery'
      );

      // Inflammation Recovery Score
      if (inflammationMarkers.length > 0) {
        const avgScore = inflammationMarkers.reduce((sum, m) => sum + (m.Score || 75), 0) / inflammationMarkers.length;
        insights.push({
          category: 'Inflammation Management',
          title: 'Inflammatory Response Optimization',
          description: `Analysis of ${inflammationMarkers.length} inflammation-related genetic markers indicates specific recovery protocols for optimal inflammatory response.`,
          score: avgScore,
          recommendations: [
            inflammationMarkers.some(m => m.Gene === 'IL6' && (m.GeneticCall || m.genetic_call)?.includes('GG'))
              ? 'IL6 GG genotype: Prioritize omega-3 supplementation and anti-inflammatory nutrition'
              : 'Standard inflammatory response - maintain balanced nutrition protocols',
            inflammationMarkers.some(m => m.Gene === 'TNF' && (m.GeneticCall || m.genetic_call)?.includes('AA'))
              ? 'TNF AA genotype: Enhanced anti-inflammatory interventions recommended'
              : 'TNF genotype supports standard recovery protocols',
            inflammationMarkers.some(m => m.Gene === 'IL10' && (m.GeneticCall || m.genetic_call)?.includes('CC'))
              ? 'IL10 CC genotype: May need additional anti-inflammatory support'
              : 'IL10 genotype supports good anti-inflammatory capacity'
          ],
          geneticMarkers: inflammationMarkers.map(m => m.Gene || m.gene),
          priority: avgScore < 70 ? 'high' : avgScore < 80 ? 'medium' : 'low'
        });
      }

      // Stress Recovery Score
      if (stressMarkers.length > 0) {
        const avgScore = stressMarkers.reduce((sum, m) => sum + (m.Score || 75), 0) / stressMarkers.length;
        insights.push({
          category: 'Stress Recovery',
          title: 'Stress Response & Recovery',
          description: `Analysis of ${stressMarkers.length} stress-related genetic markers reveals catecholamine processing and stress recovery capacity.`,
          score: avgScore,
          recommendations: [
            stressMarkers.some(m => m.Gene === 'COMT' && (m.GeneticCall || m.genetic_call)?.includes('AA'))
              ? 'COMT AA genotype: Slower catecholamine breakdown - emphasize parasympathetic activation'
              : 'COMT genotype supports standard catecholamine processing',
            stressMarkers.some(m => m.Gene === 'ADRB1' && (m.GeneticCall || m.genetic_call)?.includes('AA'))
              ? 'ADRB1 AA genotype: Higher adrenaline sensitivity - prioritize stress management'
              : 'ADRB1 genotype indicates balanced stress response',
            stressMarkers.some(m => m.Gene === 'HSD11B1' && (m.GeneticCall || m.genetic_call)?.includes('TT'))
              ? 'HSD11B1 TT genotype: Higher cortisol regeneration - implement cortisol-lowering protocols'
              : 'HSD11B1 genotype supports normal cortisol regulation'
          ],
          geneticMarkers: stressMarkers.map(m => m.Gene || m.gene),
          priority: avgScore < 70 ? 'high' : avgScore < 80 ? 'medium' : 'low'
        });
      }

      // Circadian Recovery Score
      if (circadianMarkers.length > 0) {
        const avgScore = circadianMarkers.reduce((sum, m) => sum + (m.Score || 75), 0) / circadianMarkers.length;
        insights.push({
          category: 'Circadian Rhythm',
          title: 'Sleep & Circadian Optimization',
          description: `Analysis of ${circadianMarkers.length} circadian-related genetic markers indicates chronotype and sleep recovery patterns.`,
          score: avgScore,
          recommendations: [
            circadianMarkers.some(m => m.Gene === 'CLOCK' && (m.GeneticCall || m.genetic_call)?.includes('AA'))
              ? 'CLOCK AA genotype: Strict sleep schedule critical for optimal recovery'
              : 'CLOCK genotype supports flexible sleep timing',
            'Maintain consistent sleep/wake times aligned with genetic chronotype',
            'Minimize blue light exposure 2 hours before bedtime',
            'Consider chronotype-specific training timing for optimal recovery'
          ],
          geneticMarkers: circadianMarkers.map(m => m.Gene || m.gene),
          priority: avgScore < 70 ? 'high' : avgScore < 80 ? 'medium' : 'low'
        });
      }
    }

    return insights;
  }, [geneticSummary]);

  // Calculate overall recovery score
  const overallRecoveryScore = useMemo(() => {
    if (recoveryInsights.length === 0) return 0;
    return recoveryInsights.reduce((sum, insight) => sum + insight.score, 0) / recoveryInsights.length;
  }, [recoveryInsights]);
  
  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card-enhanced p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Recovery Gene Panel</h2>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading genetic data...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="card-enhanced p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Recovery Gene Panel</h2>
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">⚠️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Genetic Data</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-white-900 mb-3">🧬 Advanced Recovery Gene Panel</h2>
        <p className="text-xl text-gray-600 mb-2">
          Comprehensive genetic analysis for {geneticSummary.length} recovery-related markers
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full">
          <span className="text-purple-700 font-medium">Overall Recovery Score:</span>
          <span className={`text-2xl font-bold ${overallRecoveryScore > 75 ? 'text-green-600' : overallRecoveryScore > 60 ? 'text-yellow-600' : 'text-red-600'}`}>
            {overallRecoveryScore.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card-enhanced p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">{geneticSummary.length}</div>
          <div className="text-sm text-gray-600">Genetic Markers</div>
          <div className="text-xs text-gray-500 mt-1">Analyzed for Recovery</div>
        </div>
        <div className="card-enhanced p-6 text-center">
          <div className={`text-3xl font-bold mb-2 ${highPriorityCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {highPriorityCount}
          </div>
          <div className="text-sm text-gray-600">High Priority</div>
          <div className="text-xs text-gray-500 mt-1">Critical Recovery Genes</div>
        </div>
        <div className="card-enhanced p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">{recoveryInsights.length}</div>
          <div className="text-sm text-gray-600">Recovery Categories</div>
          <div className="text-xs text-gray-500 mt-1">AI-Generated Insights</div>
        </div>
        <div className="card-enhanced p-6 text-center">
          <div className={`text-3xl font-bold mb-2 ${overallRecoveryScore > 75 ? 'text-green-600' : overallRecoveryScore > 60 ? 'text-yellow-600' : 'text-red-600'}`}>
            {overallRecoveryScore.toFixed(0)}
          </div>
          <div className="text-sm text-gray-600">Recovery Score</div>
          <div className="text-xs text-gray-500 mt-1">Genetic + Biometric</div>
        </div>
      </div>

      {/* AI-Generated Recovery Insights */}
      {recoveryInsights.length > 0 && (
        <section className="card-enhanced p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <span className="bg-gradient-to-r from-purple-100 to-blue-100 p-2 rounded-full text-purple-700">🤖</span>
            AI-Generated Recovery Insights
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {recoveryInsights.map((insight, index) => (
              <div key={index} className={`card-enhanced p-6 border-l-4 ${
                insight.priority === 'high' ? 'border-l-red-500 bg-red-50' :
                insight.priority === 'medium' ? 'border-l-yellow-500 bg-yellow-50' :
                'border-l-green-500 bg-green-50'
              }`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-1">{insight.title}</h4>
                    <p className="text-sm text-gray-600">{insight.category}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${insight.score > 75 ? 'text-green-600' : insight.score > 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {insight.score.toFixed(0)}
                    </div>
                    <div className="text-xs text-gray-500">Score</div>
                  </div>
                </div>

                <p className="text-gray-700 mb-4 text-sm leading-relaxed">{insight.description}</p>

                <div className="mb-4">
                  <h5 className="font-medium text-gray-900 mb-2 text-sm">Genetic Markers Analyzed:</h5>
                  <div className="flex flex-wrap gap-2">
                    {insight.geneticMarkers.map((marker, idx) => (
                      <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white text-gray-700 border">
                        {marker}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="font-medium text-gray-900 mb-2 text-sm">Recommended Protocols:</h5>
                  <ul className="space-y-2">
                    {insight.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          insight.priority === 'high' ? 'bg-red-500' :
                          insight.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}></div>
                        <span className="text-sm text-gray-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Individual Gene Analysis */}
      <section className="card-enhanced p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <span className="bg-gradient-to-r from-green-100 to-blue-100 p-2 rounded-full text-green-700">🔬</span>
          Individual Genetic Marker Analysis
        </h3>

        {recoveryGenes.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {recoveryGenes.map((gene, index) => (
              <div
                key={index}
                className={`card-enhanced p-6 border-l-4 ${
                  gene.priority === 'high' ? 'border-l-red-500' :
                  gene.priority === 'medium' ? 'border-l-yellow-500' :
                  'border-l-green-500'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-1">{gene.gene}</h4>
                    <p className="text-sm text-gray-600">{gene.category} • {gene.trait}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${gene.score > 75 ? 'text-green-600' : gene.score > 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {gene.score}
                    </div>
                    <div className="text-xs text-gray-500 mb-1">Score</div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      gene.priority === 'high' ? 'bg-red-100 text-red-800' :
                      gene.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {gene.priority.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Genotype</span>
                      <span className="text-sm font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                        {gene.genotype}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={`h-2 rounded-full transition-all duration-300 ${
                        gene.score > 75 ? 'bg-green-500' : gene.score > 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`} style={{ width: `${gene.score}%` }}></div>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <h5 className="font-medium text-blue-800 mb-2 text-sm">Recovery Impact</h5>
                    <p className="text-sm text-blue-700 leading-relaxed">{gene.impact}</p>
                  </div>

                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <h5 className="font-medium text-green-800 mb-2 text-sm">Recommended Protocol</h5>
                    <p className="text-sm text-green-700 leading-relaxed">{gene.recoveryProtocol}</p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <span className="text-xs text-gray-500">Confidence: {gene.confidence}%</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${gene.score > 75 ? 'bg-green-500' : gene.score > 60 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                      <span className="text-xs font-medium text-gray-600">
                        {gene.score > 75 ? 'Excellent' : gene.score > 60 ? 'Good' : 'Needs Attention'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">🧬</div>
            <h4 className="text-2xl font-semibold text-gray-900 mb-3">No Recovery Gene Data Available</h4>
            <p className="text-gray-600 max-w-lg mx-auto leading-relaxed">
              Comprehensive genetic testing is required to unlock personalized recovery protocols and optimization strategies.
            </p>
          </div>
        )}
      </section>

      {/* Recovery Intelligence Dashboard */}
      {recoveryInsights.length > 0 && (
        <section className="card-enhanced p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <span className="bg-gradient-to-r from-indigo-100 to-purple-100 p-2 rounded-full text-indigo-700">📊</span>
            Recovery Intelligence Dashboard
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recovery Categories Overview */}
            <div className="card-enhanced p-5">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-lg">📈</span>
                Recovery Categories
              </h4>
              <div className="space-y-3">
                {recoveryInsights.map((insight, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{insight.category}</div>
                      <div className="text-xs text-gray-500">{insight.geneticMarkers.length} markers</div>
                    </div>
                    <div className={`text-lg font-bold ${insight.score > 75 ? 'text-green-600' : insight.score > 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {insight.score.toFixed(0)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority Actions */}
            <div className="card-enhanced p-5">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-lg">🎯</span>
                Priority Actions
              </h4>
              <div className="space-y-3">
                {recoveryInsights.filter(insight => insight.priority === 'high').length > 0 ? (
                  recoveryInsights
                    .filter(insight => insight.priority === 'high')
                    .slice(0, 3)
                    .map((insight, idx) => (
                      <div key={idx} className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="font-medium text-red-800 text-sm mb-1">{insight.category}</div>
                        <div className="text-xs text-red-600">{insight.recommendations[0]}</div>
                      </div>
                    ))
                ) : recoveryInsights.length > 0 ? (
                  // Show medium priority actions if no high priority ones exist
                  recoveryInsights
                    .filter(insight => insight.priority === 'medium')
                    .slice(0, 3)
                    .map((insight, idx) => (
                      <div key={idx} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="font-medium text-yellow-800 text-sm mb-1">{insight.category}</div>
                        <div className="text-xs text-yellow-600">{insight.recommendations[0]}</div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-sm">No priority actions available</div>
                    <div className="text-xs mt-1">Complete genetic testing to unlock personalized recommendations</div>
                  </div>
                )}
              </div>
            </div>

            {/* Implementation Timeline */}
            <div className="card-enhanced p-5">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-lg">⏰</span>
                Implementation Timeline
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 p-2 bg-red-50 rounded">
                  <span className="text-red-500 font-bold">Week 1</span>
                  <span className="text-red-700">Implement high-priority protocols</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-yellow-50 rounded">
                  <span className="text-yellow-600 font-bold">Week 2-3</span>
                  <span className="text-yellow-700">Monitor biometric response</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-green-50 rounded">
                  <span className="text-green-600 font-bold">Week 4+</span>
                  <span className="text-green-700">Optimize based on results</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Implementation Strategy */}
      <section className="card-enhanced p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
          <span className="bg-gradient-to-r from-blue-100 to-indigo-100 p-2 rounded-full text-blue-700">📋</span>
          Implementation Strategy & Monitoring
        </h3>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Protocol Implementation</h4>
            <div className="space-y-3">
              {[
                { step: '1', title: 'High-Priority Focus', desc: 'Implement protocols for high-priority genetic markers first' },
                { step: '2', title: 'One Change at a Time', desc: 'Modify one protocol to clearly assess individual impact' },
                { step: '3', title: 'Biometric Monitoring', desc: 'Track HRV, resting HR, and sleep quality for validation' },
                { step: '4', title: 'Response Assessment', desc: 'Evaluate effectiveness after 2-3 weeks of implementation' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {item.step}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{item.title}</div>
                    <div className="text-xs text-gray-600 mt-1">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Success Metrics</h4>
            <div className="space-y-3">
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="font-medium text-green-800 mb-1">Primary Metrics</div>
                <div className="text-sm text-green-700 space-y-1">
                  <div>• HRV improvement {'>'} 5ms</div>
                  <div>• Resting HR reduction {'>'} 3bpm</div>
                  <div>• Sleep duration increase {'>'} 30min</div>
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="font-medium text-blue-800 mb-1">Secondary Metrics</div>
                <div className="text-sm text-blue-700 space-y-1">
                  <div>• Training readiness score {'>'} 75%</div>
                  <div>• Reduced perceived soreness</div>
                  <div>• Improved training quality</div>
                </div>
              </div>

              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="font-medium text-purple-800 mb-1">Timeline</div>
                <div className="text-sm text-purple-700 space-y-1">
                  <div>• Initial assessment: 2 weeks</div>
                  <div>• Protocol optimization: 4-6 weeks</div>
                  <div>• Full adaptation: 8-12 weeks</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};