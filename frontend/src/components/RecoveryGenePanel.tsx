import React, { useMemo, useState, useEffect } from 'react';
import { geneticProfileService } from '../services/dataService';

interface RecoveryGene {
  gene: string;
  genotype: string;
  rsid: string;
  category: string;
  impact: 'beneficial' | 'neutral' | 'challenging';
  description: string;
  recoveryRecommendation: string;
  priority: 'high' | 'medium' | 'low';
  score: number;
}

export const RecoveryGenePanel: React.FC<{ athleteId: string }> = ({ athleteId }) => {
  const [geneticSummary, setGeneticSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Recovery-related genes from geneText.docx
  const recoveryGenesList = [
    // Core Sleep markers
    'COMT', 'PER3', 'CLOCK', 'BDNF', 'PPARGC1A', 'ACTN3', 'NOS3', 'TPH2', 'GABRA6', 'GSK3B', 'PER2',
    // Additional recovery genes
    'IL6', 'TNF', 'IL10', 'VDR', 'ADRB1', 'HSD11B1', 'FKBP5', 'MAO-A', 'SLC6A4'
  ];

  // Function to analyze recovery genes based on geneText.docx data
  const getRecoveryGeneAnalysis = (geneName: string, genotype: string): RecoveryGene | null => {
    const geneAnalysis: Record<string, any> = {
      // Core Sleep markers from geneText.docx - Coach/Physio/Biokinetic friendly recommendations
      'COMT': {
        rsid: 'rs4680',
        analysis: {
          'GG': { impact: 'beneficial', description: 'Efficient stress hormone processing', recoveryRecommendation: 'Standard recovery protocols sufficient', priority: 'low', score: 85 },
          'GA': { impact: 'neutral', description: 'Balanced stress response', recoveryRecommendation: 'Monitor training load carefully', priority: 'low', score: 75 },
          'AA': { impact: 'challenging', description: 'Slower stress recovery', recoveryRecommendation: 'Extend rest periods between high-intensity sessions', priority: 'high', score: 60 }
        }
      },
      'PER3': {
        rsid: 'rs228697',
        analysis: {
          '4/4': { impact: 'beneficial', description: 'Morning chronotype - early riser', recoveryRecommendation: 'Schedule morning training, ensure 8+ hours sleep', priority: 'low', score: 85 },
          '4/5': { impact: 'neutral', description: 'Flexible chronotype', recoveryRecommendation: 'Adapt training times to athlete preference', priority: 'low', score: 75 },
          '5/5': { impact: 'challenging', description: 'Evening chronotype - night owl', recoveryRecommendation: 'Schedule afternoon/evening sessions, strict sleep hygiene', priority: 'medium', score: 65 }
        }
      },
      'CLOCK': {
        rsid: 'rs1801260',
        analysis: {
          'TT': { impact: 'beneficial', description: 'Strong circadian rhythm', recoveryRecommendation: 'Consistent training and sleep times', priority: 'low', score: 85 },
          'TC': { impact: 'neutral', description: 'Moderate rhythm regulation', recoveryRecommendation: 'Maintain regular schedule', priority: 'low', score: 75 },
          'CC': { impact: 'challenging', description: 'Weak circadian control', recoveryRecommendation: 'Strict sleep schedule, avoid shift work', priority: 'medium', score: 65 }
        }
      },
      'BDNF': {
        rsid: 'rs6265',
        analysis: {
          'Val/Val': { impact: 'beneficial', description: 'Superior brain recovery', recoveryRecommendation: 'Include cognitive training in recovery protocols', priority: 'low', score: 90 },
          'Val/Met': { impact: 'neutral', description: 'Normal brain adaptation', recoveryRecommendation: 'Standard neurological recovery', priority: 'low', score: 75 },
          'Met/Met': { impact: 'challenging', description: 'Slower neurological recovery', recoveryRecommendation: 'Extended rest periods, monitor concussion risk', priority: 'high', score: 55 }
        }
      },
      'PPARGC1A': {
        rsid: 'rs8192678',
        analysis: {
          'GG': { impact: 'beneficial', description: 'Elite mitochondrial function', recoveryRecommendation: 'Can handle higher training volumes', priority: 'low', score: 90 },
          'GA': { impact: 'neutral', description: 'Normal energy recovery', recoveryRecommendation: 'Standard aerobic conditioning', priority: 'low', score: 75 },
          'AA': { impact: 'challenging', description: 'Poor mitochondrial recovery', recoveryRecommendation: 'Limit high-intensity work, focus on aerobic base', priority: 'medium', score: 65 }
        }
      },
      'ACTN3': {
        rsid: 'rs1815739',
        analysis: {
          'RR': { impact: 'beneficial', description: 'Power athlete genetics', recoveryRecommendation: 'Focus on strength recovery, shorter rest between sets', priority: 'low', score: 85 },
          'RX': { impact: 'neutral', description: 'Balanced muscle fibers', recoveryRecommendation: 'Mixed training approach suitable', priority: 'low', score: 75 },
          'XX': { impact: 'beneficial', description: 'Endurance athlete genetics', recoveryRecommendation: 'Emphasize aerobic recovery, longer sessions', priority: 'low', score: 85 }
        }
      },
      'NOS3': {
        rsid: 'rs1799983',
        analysis: {
          'TT': { impact: 'beneficial', description: 'Excellent circulation', recoveryRecommendation: 'Good recovery from cardiovascular stress', priority: 'low', score: 85 },
          'GT': { impact: 'neutral', description: 'Normal circulation', recoveryRecommendation: 'Standard cardiovascular recovery', priority: 'low', score: 75 },
          'GG': { impact: 'challenging', description: 'Poor circulation recovery', recoveryRecommendation: 'Monitor blood pressure, enhance circulation with massage/heat', priority: 'medium', score: 65 }
        }
      },
      'TPH2': {
        rsid: 'rs4570625',
        analysis: {
          'CC': { impact: 'beneficial', description: 'Stable mood regulation', recoveryRecommendation: 'Good psychological recovery', priority: 'low', score: 85 },
          'CT': { impact: 'neutral', description: 'Normal mood stability', recoveryRecommendation: 'Monitor training stress', priority: 'low', score: 75 },
          'TT': { impact: 'challenging', description: 'Mood instability risk', recoveryRecommendation: 'Monitor for overtraining signs, ensure adequate rest', priority: 'medium', score: 65 }
        }
      },
      'GABRA6': {
        rsid: 'rs3219151',
        analysis: {
          'GG': { impact: 'beneficial', description: 'Excellent sleep quality', recoveryRecommendation: 'Natural sleep enhancement strategies', priority: 'low', score: 85 },
          'GA': { impact: 'neutral', description: 'Normal sleep patterns', recoveryRecommendation: 'Standard sleep hygiene', priority: 'low', score: 75 },
          'AA': { impact: 'challenging', description: 'Sleep quality issues', recoveryRecommendation: 'Implement sleep optimization protocols', priority: 'medium', score: 65 }
        }
      }
    };

    const geneData = geneAnalysis[geneName];
    if (!geneData) return null;

    const genotypeAnalysis = geneData.analysis[genotype] || geneData.analysis['default'];
    if (!genotypeAnalysis) return null;

    return {
      gene: geneName,
      genotype: genotype,
      rsid: geneData.rsid,
      category: 'Recovery',
      impact: genotypeAnalysis.impact,
      description: genotypeAnalysis.description,
      recoveryRecommendation: genotypeAnalysis.recoveryRecommendation,
      priority: genotypeAnalysis.priority,
      score: genotypeAnalysis.score
    };
  };

  // Fetch genetic summary data for the athlete
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

        // Fetch genetic summary data from athletegeneticsummary table
        const summaryData = await geneticProfileService.getGeneticSummaryByAthlete(athleteIdNum);
        setGeneticSummary(summaryData);

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

    // Process genetic summary data to find recovery-related genes
    geneticSummary.forEach(summary => {
      const genesData = summary.Genes || summary.genes || {};
      const categoryName = (summary.Category || summary.category || '').toLowerCase();

      // Check if this category contains recovery-related genes
      if (typeof genesData === 'object' && genesData !== null) {
        Object.entries(genesData).forEach(([geneName, genotype]) => {
          // Check if this gene is in our recovery genes list
          if (recoveryGenesList.includes(geneName)) {
            const recoveryGene = getRecoveryGeneAnalysis(geneName, genotype as string);
            if (recoveryGene) {
              genes.push({
                ...recoveryGene,
                category: categoryName
              });
            }
          }
        });
      }
    });

    return genes;
  }, [geneticSummary]);

  // Calculate overall recovery score
  const overallRecoveryScore = useMemo(() => {
    if (recoveryGenes.length === 0) return 0;
    return recoveryGenes.reduce((sum, gene) => sum + gene.score, 0) / recoveryGenes.length;
  }, [recoveryGenes]);

  const highPriorityCount = recoveryGenes.filter(g => g.priority === 'high').length;
  const mediumPriorityCount = recoveryGenes.filter(g => g.priority === 'medium').length;
  
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white-900">🧬 Recovery Genetics</h2>
          <p className="text-gray-600">Key genetic markers affecting recovery</p>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-bold ${overallRecoveryScore > 75 ? 'text-green-600' : overallRecoveryScore > 60 ? 'text-yellow-600' : 'text-red-600'}`}>
            {overallRecoveryScore.toFixed(0)}%
          </div>
          <div className="text-sm text-gray-600">Recovery Score</div>
        </div>
      </div>

      {/* Charts Section */}
      {recoveryGenes.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Priority Distribution Bar Chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4 text-center">Recovery Priorities</h3>
            <div className="space-y-4">
              {/* High Priority */}
              {highPriorityCount > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span className="text-sm font-medium text-gray-700">High Priority</span>
                    </div>
                    <span className="text-sm font-bold text-red-600">{highPriorityCount}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 bg-red-500 rounded-full transition-all duration-500"
                      style={{ width: `${(highPriorityCount / recoveryGenes.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Medium Priority */}
              {mediumPriorityCount > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                      <span className="text-sm font-medium text-gray-700">Medium Priority</span>
                    </div>
                    <span className="text-sm font-bold text-yellow-600">{mediumPriorityCount}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 bg-yellow-500 rounded-full transition-all duration-500"
                      style={{ width: `${(mediumPriorityCount / recoveryGenes.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Low Priority */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-sm font-medium text-gray-700">Good Profile</span>
                  </div>
                  <span className="text-sm font-bold text-green-600">{recoveryGenes.filter(g => g.priority === 'low').length}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 bg-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${(recoveryGenes.filter(g => g.priority === 'low').length / recoveryGenes.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{recoveryGenes.length}</div>
                <div className="text-sm text-gray-600">Total Genes</div>
              </div>
            </div>
          </div>

          {/* Recovery Scores Bar Chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4 text-center">Recovery Scores</h3>
            <div className="space-y-3">
              {recoveryGenes.slice(0, 6).map((gene, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-12 text-xs font-medium text-gray-600 truncate">{gene.gene}</div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          gene.score > 75 ? 'bg-green-500' :
                          gene.score > 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${gene.score}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-8 text-xs font-semibold text-gray-900 text-right">{gene.score}</div>
                </div>
              ))}
              {recoveryGenes.length > 6 && (
                <div className="text-xs text-gray-500 text-center mt-2">
                  +{recoveryGenes.length - 6} more genes
                </div>
              )}
            </div>
          </div>

          {/* Recovery Categories */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4 text-center">Recovery Focus Areas</h3>
            <div className="space-y-3">
              {[
                { category: 'Sleep & Rhythm', genes: ['CLOCK', 'PER3', 'BDNF'], icon: '😴' },
                { category: 'Stress Response', genes: ['COMT', 'BDNF'], icon: '🧠' },
                { category: 'Energy Systems', genes: ['PPARGC1A', 'ACTN3'], icon: '⚡' },
                { category: 'Circulation', genes: ['NOS3'], icon: '❤️' }
              ].map((cat, index) => {
                const catGenes = recoveryGenes.filter(g => cat.genes.includes(g.gene));
                const avgScore = catGenes.length > 0 ? catGenes.reduce((sum, g) => sum + g.score, 0) / catGenes.length : 0;

                return (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{cat.icon}</span>
                      <span className="text-sm font-medium text-gray-700">{cat.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">({catGenes.length})</span>
                      <div className={`w-16 h-2 rounded-full ${
                        avgScore > 75 ? 'bg-green-500' :
                        avgScore > 60 ? 'bg-yellow-500' : 'bg-gray-300'
                      }`} style={{ width: avgScore > 0 ? '40px' : '0px' }} />
                      <span className={`text-xs font-semibold ${
                        avgScore > 75 ? 'text-green-600' :
                        avgScore > 60 ? 'text-yellow-600' : 'text-gray-400'
                      }`}>
                        {avgScore > 0 ? Math.round(avgScore) : '-'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Priority Actions */}
      {recoveryGenes.length > 0 && (highPriorityCount > 0 || mediumPriorityCount > 0) && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Priority Recovery Actions</h3>
          <div className="space-y-2">
            {recoveryGenes.filter(g => g.priority === 'high').map(g => (
              <div key={g.gene} className="flex items-center gap-3 p-2 bg-red-50 rounded">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm text-red-800">{g.gene} ({g.genotype}): {g.recoveryRecommendation}</span>
              </div>
            ))}
            {recoveryGenes.filter(g => g.priority === 'medium').map(g => (
              <div key={g.gene} className="flex items-center gap-3 p-2 bg-yellow-50 rounded">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-yellow-800">{g.gene} ({g.genotype}): {g.recoveryRecommendation}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recovery Genes Grid */}
      {recoveryGenes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recoveryGenes.map((gene, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-lg transition-all duration-200">
              {/* Header with Gene Name and Priority */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-900 mb-1">{gene.gene}</h4>
                  <p className="text-sm text-gray-500">Recovery Gene</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  gene.priority === 'high' ? 'bg-red-100 text-red-700 border border-red-200' :
                  gene.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                  'bg-green-100 text-green-700 border border-green-200'
                }`}>
                  {gene.priority === 'high' ? '⚠️ High Priority' :
                   gene.priority === 'medium' ? '⚡ Medium Priority' :
                   '✅ Good Profile'}
                </div>
              </div>

              {/* Your Genotype */}
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Your Result</span>
                  <span className="text-xl font-mono font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded">
                    {gene.genotype}
                  </span>
                </div>
              </div>

              {/* Recovery Score */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Recovery Potential</span>
                  <span className={`text-sm font-bold ${
                    gene.score > 75 ? 'text-green-600' :
                    gene.score > 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {gene.score > 75 ? 'Excellent' :
                     gene.score > 60 ? 'Good' : 'Needs Attention'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className={`h-3 rounded-full transition-all duration-500 ${
                    gene.score > 75 ? 'bg-green-500' :
                    gene.score > 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`} style={{ width: `${gene.score}%` }} />
                </div>
                <div className="text-xs text-gray-500 mt-1 text-center">
                  Score: {gene.score}/100
                </div>
              </div>

              {/* Recommendation */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
                <div className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">💡</span>
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-1">Recommendation</p>
                    <p className="text-sm text-blue-800 leading-relaxed">{gene.recoveryRecommendation}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <div className="text-4xl mb-2">🧬</div>
          <p className="text-gray-600">No recovery-related genetic data found</p>
        </div>
      )}
    </div>
  );
};