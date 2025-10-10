import React, { useMemo, useState, useEffect } from 'react';
import { geneticProfileService } from '../services/dataService';

type Impact = 'beneficial' | 'neutral' | 'challenging';
type Priority = 'high' | 'medium' | 'low';
type SortOption = 'relevance' | 'score_desc' | 'score_asc' | 'gene_az' | 'gene_za';

interface RecoveryGene {
  gene: string;
  genotype: string;
  rsid: string;
  category: string; // focus area or source category
  impact: Impact;
  description: string;
  recoveryRecommendation: string;
  priority: Priority;
  score: number; // 0-100
}

const priorityRank: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

export const RecoveryGenePanel: React.FC<{ athleteId: string }> = ({ athleteId }) => {
  const [geneticSummary, setGeneticSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Controls
  const [search, setSearch] = useState('');
  const [impactFilter, setImpactFilter] = useState<Impact | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [focusFilter, setFocusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [risksOnly, setRisksOnly] = useState(false);

  // Recovery-related genes list
  const recoveryGenesList = [
    // Sleep / Rhythm
    'COMT',
    'PER3',
    'CLOCK',
    'BDNF',
    'GSK3B',
    'PER2',
    // Energy / Performance
    'PPARGC1A',
    'ACTN3',
    'NOS3',
    // Stress / Mood
    'TPH2',
    'GABRA6',
    'FKBP5',
    'MAO-A',
    'SLC6A4',
    // Inflammation / Endocrine
    'IL6',
    'TNF',
    'IL10',
    'VDR',
    'ADRB1',
    'HSD11B1'
  ];

  const focusAreas = [
    { key: 'sleep', label: 'Sleep & Rhythm', genes: ['CLOCK', 'PER3', 'BDNF', 'GSK3B', 'PER2'] },
    { key: 'stress', label: 'Stress Response', genes: ['COMT', 'BDNF', 'FKBP5', 'MAO-A', 'SLC6A4', 'TPH2', 'GABRA6'] },
    { key: 'energy', label: 'Energy Systems', genes: ['PPARGC1A', 'ACTN3'] },
    { key: 'circulation', label: 'Circulation', genes: ['NOS3', 'VDR', 'ADRB1'] },
    { key: 'inflammation', label: 'Inflammation', genes: ['IL6', 'TNF', 'IL10', 'HSD11B1'] }
  ];

  // Curated analysis with safe defaults
  const getRecoveryGeneAnalysis = (geneName: string, genotype: string): RecoveryGene | null => {
    const geneAnalysis: Record<string, any> = {
      COMT: {
        rsid: 'rs4680',
        analysis: {
          GG: {
            impact: 'beneficial',
            description: 'Efficient catecholamine/stress hormone breakdown',
            recoveryRecommendation: 'Standard recovery protocols sufficient',
            priority: 'low',
            score: 85
          },
          GA: {
            impact: 'neutral',
            description: 'Balanced stress response',
            recoveryRecommendation: 'Monitor training load carefully',
            priority: 'low',
            score: 75
          },
          AA: {
            impact: 'challenging',
            description: 'Slower catecholamine clearance; stress lingers',
            recoveryRecommendation: 'Extend rest between high-intensity sessions; emphasize parasympathetic work',
            priority: 'high',
            score: 60
          },
          default: {
            impact: 'neutral',
            description: 'Stress regulation impact possible',
            recoveryRecommendation: 'Monitor stress and ensure adequate sleep',
            priority: 'medium',
            score: 70
          }
        }
      },
      PER3: {
        rsid: 'rs228697',
        analysis: {
          '4/4': {
            impact: 'beneficial',
            description: 'Morning chronotype',
            recoveryRecommendation: 'Train mornings; ensure 8+ h sleep',
            priority: 'low',
            score: 85
          },
          '4/5': {
            impact: 'neutral',
            description: 'Flexible chronotype',
            recoveryRecommendation: 'Adapt training time to preference',
            priority: 'low',
            score: 75
          },
          '5/5': {
            impact: 'challenging',
            description: 'Evening chronotype',
            recoveryRecommendation: 'Train later day; strict sleep hygiene',
            priority: 'medium',
            score: 65
          },
          default: {
            impact: 'neutral',
            description: 'Circadian preference influence likely',
            recoveryRecommendation: 'Keep a consistent sleep schedule',
            priority: 'medium',
            score: 70
          }
        }
      },
      CLOCK: {
        rsid: 'rs1801260',
        analysis: {
          TT: {
            impact: 'beneficial',
            description: 'Strong circadian rhythm',
            recoveryRecommendation: 'Keep steady sleep/wake times',
            priority: 'low',
            score: 85
          },
          TC: {
            impact: 'neutral',
            description: 'Moderate rhythm regulation',
            recoveryRecommendation: 'Maintain regular schedule',
            priority: 'low',
            score: 75
          },
          CC: {
            impact: 'challenging',
            description: 'Weaker circadian entrainment',
            recoveryRecommendation: 'Strict sleep schedule; morning light exposure',
            priority: 'medium',
            score: 65
          },
          default: {
            impact: 'neutral',
            description: 'Circadian regulation influence possible',
            recoveryRecommendation: 'Optimize light exposure and wind-down routine',
            priority: 'medium',
            score: 70
          }
        }
      },
      BDNF: {
        rsid: 'rs6265',
        analysis: {
          'Val/Val': {
            impact: 'beneficial',
            description: 'Superior neuroplasticity and brain recovery',
            recoveryRecommendation: 'Include cognitive training in recovery',
            priority: 'low',
            score: 90
          },
          'Val/Met': {
            impact: 'neutral',
            description: 'Normal brain adaptation',
            recoveryRecommendation: 'Standard neuro recovery',
            priority: 'low',
            score: 75
          },
          'Met/Met': {
            impact: 'challenging',
            description: 'Slower neurological recovery',
            recoveryRecommendation: 'Extend rest; monitor cognitive load',
            priority: 'high',
            score: 55
          },
          default: {
            impact: 'neutral',
            description: 'Neural recovery influence possible',
            recoveryRecommendation: 'Prioritize sleep and low cognitive load post-intense sessions',
            priority: 'medium',
            score: 70
          }
        }
      },
      PPARGC1A: {
        rsid: 'rs8192678',
        analysis: {
          GG: {
            impact: 'beneficial',
            description: 'Excellent mitochondrial biogenesis',
            recoveryRecommendation: 'Can handle higher training volumes',
            priority: 'low',
            score: 90
          },
          GA: {
            impact: 'neutral',
            description: 'Normal energy recovery',
            recoveryRecommendation: 'Standard aerobic conditioning',
            priority: 'low',
            score: 75
          },
          AA: {
            impact: 'challenging',
            description: 'Reduced mitochondrial efficiency',
            recoveryRecommendation: 'Limit HIIT; build aerobic base',
            priority: 'medium',
            score: 65
          },
          default: {
            impact: 'neutral',
            description: 'Mitochondrial recovery influence possible',
            recoveryRecommendation: 'Focus on zone 2 base and nutrition',
            priority: 'medium',
            score: 70
          }
        }
      },
      ACTN3: {
        rsid: 'rs1815739',
        analysis: {
          RR: {
            impact: 'beneficial',
            description: 'Power fiber bias',
            recoveryRecommendation: 'Strength-focused recovery; shorter inter-set rest',
            priority: 'low',
            score: 85
          },
          RX: {
            impact: 'neutral',
            description: 'Mixed fiber profile',
            recoveryRecommendation: 'Mixed training and recovery',
            priority: 'low',
            score: 75
          },
          XX: {
            impact: 'beneficial',
            description: 'Endurance fiber bias',
            recoveryRecommendation: 'Aerobic recovery; longer sessions',
            priority: 'low',
            score: 85
          },
          default: {
            impact: 'neutral',
            description: 'Fiber-type influence possible',
            recoveryRecommendation: 'Align recovery to training emphasis',
            priority: 'low',
            score: 75
          }
        }
      },
      NOS3: {
        rsid: 'rs1799983',
        analysis: {
          TT: {
            impact: 'beneficial',
            description: 'Good endothelial function',
            recoveryRecommendation: 'Standard cardio recovery',
            priority: 'low',
            score: 85
          },
          GT: {
            impact: 'neutral',
            description: 'Normal circulation',
            recoveryRecommendation: 'Standard protocols',
            priority: 'low',
            score: 75
          },
          GG: {
            impact: 'challenging',
            description: 'Reduced nitric oxide availability',
            recoveryRecommendation: 'Heat/massage; monitor BP; mobility',
            priority: 'medium',
            score: 65
          },
          default: {
            impact: 'neutral',
            description: 'Circulatory recovery influence possible',
            recoveryRecommendation: 'Warm-up/cool-down emphasis; mobility',
            priority: 'medium',
            score: 70
          }
        }
      },
      TPH2: {
        rsid: 'rs4570625',
        analysis: {
          CC: {
            impact: 'beneficial',
            description: 'Stable mood regulation',
            recoveryRecommendation: 'Good psych recovery support',
            priority: 'low',
            score: 85
          },
          CT: {
            impact: 'neutral',
            description: 'Typical mood stability',
            recoveryRecommendation: 'Monitor training stress',
            priority: 'low',
            score: 75
          },
          TT: {
            impact: 'challenging',
            description: 'Higher mood fluctuation risk',
            recoveryRecommendation: 'Watch overtraining; include mindfulness',
            priority: 'medium',
            score: 65
          },
          default: {
            impact: 'neutral',
            description: 'Mood/stress impact possible',
            recoveryRecommendation: 'Mindfulness and adequate recovery windows',
            priority: 'medium',
            score: 70
          }
        }
      },
      GABRA6: {
        rsid: 'rs3219151',
        analysis: {
          GG: {
            impact: 'beneficial',
            description: 'Good sleep quality tendency',
            recoveryRecommendation: 'Maintain sleep hygiene',
            priority: 'low',
            score: 85
          },
          GA: {
            impact: 'neutral',
            description: 'Normal sleep patterns',
            recoveryRecommendation: 'Standard sleep hygiene',
            priority: 'low',
            score: 75
          },
          AA: {
            impact: 'challenging',
            description: 'Sleep quality challenges',
            recoveryRecommendation: 'Optimize sleep routine; limit caffeine late day',
            priority: 'medium',
            score: 65
          },
          default: {
            impact: 'neutral',
            description: 'Sleep regulation influence possible',
            recoveryRecommendation: 'Strengthen sleep routine',
            priority: 'medium',
            score: 70
          }
        }
      },
      IL6: {
        rsid: 'rs1800795',
        analysis: {
          default: {
            impact: 'neutral',
            description: 'Inflammation regulation influence',
            recoveryRecommendation: 'Anti-inflammatory nutrition; sleep priority',
            priority: 'medium',
            score: 70
          }
        }
      },
      TNF: {
        rsid: 'rs1800629',
        analysis: {
          default: {
            impact: 'neutral',
            description: 'Inflammatory signaling influence',
            recoveryRecommendation: 'Omega-3s, polyphenols; manage load spikes',
            priority: 'medium',
            score: 70
          }
        }
      },
      IL10: {
        rsid: 'rs1800896',
        analysis: {
          default: {
            impact: 'beneficial',
            description: 'Anti-inflammatory signaling support',
            recoveryRecommendation: 'Standard recovery; balanced diet',
            priority: 'low',
            score: 80
          }
        }
      },
      VDR: {
        rsid: 'rs2228570',
        analysis: {
          default: {
            impact: 'neutral',
            description: 'Vitamin D signaling influence',
            recoveryRecommendation: 'Monitor vitamin D status; daylight exposure',
            priority: 'medium',
            score: 72
          }
        }
      },
      ADRB1: {
        rsid: 'rs1801253',
        analysis: {
          default: {
            impact: 'neutral',
            description: 'Cardiovascular response influence',
            recoveryRecommendation: 'HR-based load management; aerobic base',
            priority: 'medium',
            score: 70
          }
        }
      },
      HSD11B1: {
        rsid: 'rs12086634',
        analysis: {
          default: {
            impact: 'neutral',
            description: 'Cortisol regeneration influence',
            recoveryRecommendation: 'Stress hygiene; consistent sleep; deloads',
            priority: 'medium',
            score: 68
          }
        }
      },
      FKBP5: {
        rsid: 'rs1360780',
        analysis: {
          default: {
            impact: 'challenging',
            description: 'Stress reactivity influence',
            recoveryRecommendation: 'Parasympathetic work; manage intensity clusters',
            priority: 'medium',
            score: 65
          }
        }
      },
      'MAO-A': {
        rsid: 'rs6323',
        analysis: {
          default: {
            impact: 'neutral',
            description: 'Monoamine turnover influence',
            recoveryRecommendation: 'Consistent routine; limit late stimulants',
            priority: 'medium',
            score: 69
          }
        }
      },
      SLC6A4: {
        rsid: '5-HTTLPR',
        analysis: {
          default: {
            impact: 'challenging',
            description: 'Serotonin transporter variation',
            recoveryRecommendation: 'Prioritize sleep, sunlight, low cognitive load post-HIIT',
            priority: 'medium',
            score: 64
          }
        }
      },
      GSK3B: {
        rsid: 'rs334558',
        analysis: {
          default: {
            impact: 'neutral',
            description: 'Circadian and neural signaling influence',
            recoveryRecommendation: 'Regular schedule; consistent wind-down',
            priority: 'medium',
            score: 70
          }
        }
      },
      PER2: {
        rsid: 'rs934945',
        analysis: {
          default: {
            impact: 'neutral',
            description: 'Circadian phase regulation influence',
            recoveryRecommendation: 'Morning light exposure; fixed sleep times',
            priority: 'medium',
            score: 70
          }
        }
      }
    };

    const geneData = geneAnalysis[geneName];
    if (!geneData) return null;

    const genotypeAnalysis = geneData.analysis[genotype] || geneData.analysis['default'];
    if (!genotypeAnalysis) return null;

    return {
      gene: geneName,
      genotype,
      rsid: geneData.rsid,
      category: 'Recovery',
      impact: genotypeAnalysis.impact,
      description: genotypeAnalysis.description,
      recoveryRecommendation: genotypeAnalysis.recoveryRecommendation,
      priority: genotypeAnalysis.priority,
      score: genotypeAnalysis.score
    };
  };

  // Normalize various formats of Genes payloads to [gene, genotype] pairs
  const extractGenePairs = (raw: any): Array<{ gene: string; genotype: string }> => {
    if (!raw) return [];

    let genesData: any = raw;

    if (typeof genesData === 'string') {
      try {
        genesData = JSON.parse(genesData);
      } catch {
        const pairs: Array<{ gene: string; genotype: string }> = [];
        genesData
          .split(/[;,]/)
          .map((s: string) => s.trim())
          .filter(Boolean)
          .forEach((seg: string) => {
            const [gene, genotype] = seg.split(/[:=]/).map((s) => s.trim());
            if (gene && genotype) pairs.push({ gene, genotype });
          });
        return pairs;
      }
    }

    if (Array.isArray(genesData)) {
      const pairs: Array<{ gene: string; genotype: string }> = [];
      genesData.forEach((item) => {
        if (item && typeof item === 'object') {
          const gene = item.gene || item.Gene || item.rsid || item.RSID || item.Key || item.key || '';
          const genotype = item.genotype || item.Genotype || item.Value || item.value || '';
          if (gene && genotype) pairs.push({ gene: String(gene), genotype: String(genotype) });
        }
      });
      return pairs;
    }

    if (typeof genesData === 'object' && genesData !== null) {
      return Object.entries(genesData)
        .filter(([k]) => !String(k).startsWith('$'))
        .map(([gene, genotype]) => ({ gene: String(gene), genotype: String(genotype) }));
    }

    return [];
  };

  // Fetch genetic summary data for the athlete
  useEffect(() => {
    const fetchGeneticData = async () => {
      try {
        setLoading(true);
        setError(null);

        const athleteIdNum = parseInt(athleteId, 10);
        if (isNaN(athleteIdNum)) {
          throw new Error('Invalid athlete ID');
        }

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

  // Build raw recovery genes from summary
  const rawRecoveryGenes = useMemo<RecoveryGene[]>(() => {
    const genes: RecoveryGene[] = [];

    geneticSummary.forEach((summary) => {
      const raw = summary.Genes ?? summary.genes ?? {};
      const categoryName = String(summary.Category ?? summary.category ?? 'Recovery');
      const pairs = extractGenePairs(raw);

      pairs.forEach(({ gene, genotype }) => {
        const geneName = String(gene).toUpperCase();
        if (!recoveryGenesList.includes(geneName)) return;
        const analysis = getRecoveryGeneAnalysis(geneName, String(genotype));
        if (analysis) {
          const focusMatch = focusAreas.find((f) => f.genes.includes(geneName))?.label || categoryName;
          genes.push({ ...analysis, category: focusMatch });
        }
      });
    });

    return genes;
  }, [geneticSummary]);

  // Deduplicate by gene, prefer higher risk; if same, prefer lower score to surface risk
  const recoveryGenes = useMemo<RecoveryGene[]>(() => {
    const bestByGene = new Map<string, RecoveryGene>();
    rawRecoveryGenes.forEach((g) => {
      const existing = bestByGene.get(g.gene);
      if (!existing) {
        bestByGene.set(g.gene, g);
        return;
      }
      const rankA = priorityRank[g.priority];
      const rankB = priorityRank[existing.priority];
      if (rankA < rankB) {
        bestByGene.set(g.gene, g);
      } else if (rankA === rankB) {
        if (g.score < existing.score) bestByGene.set(g.gene, g);
      }
    });
    return Array.from(bestByGene.values());
  }, [rawRecoveryGenes]);

  // Score and counts
  const overallRecoveryScore = useMemo(() => {
    if (recoveryGenes.length === 0) return 0;
    return recoveryGenes.reduce((sum, gene) => sum + gene.score, 0) / recoveryGenes.length;
  }, [recoveryGenes]);

  const counts = useMemo(() => {
    return {
      total: recoveryGenes.length,
      high: recoveryGenes.filter((g) => g.priority === 'high').length,
      medium: recoveryGenes.filter((g) => g.priority === 'medium').length,
      low: recoveryGenes.filter((g) => g.priority === 'low').length
    };
  }, [recoveryGenes]);

  // Filters + sorting
  const filteredSortedGenes = useMemo(() => {
    const q = search.trim().toLowerCase();

    let list = recoveryGenes.filter((g) => {
      if (q) {
        const hay = `${g.gene} ${g.genotype} ${g.rsid} ${g.description} ${g.recoveryRecommendation}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (risksOnly) {
        if (!(g.priority === 'high' || g.priority === 'medium' || g.impact === 'challenging')) return false;
      }
      if (impactFilter !== 'all' && g.impact !== impactFilter) return false;
      if (priorityFilter !== 'all' && g.priority !== priorityFilter) return false;
      if (focusFilter !== 'all') {
        const area = focusAreas.find((f) => f.key === focusFilter);
        if (area && !area.genes.includes(g.gene)) return false;
      }
      return true;
    });

    switch (sortBy) {
      case 'score_desc':
        list = list.sort((a, b) => b.score - a.score || a.gene.localeCompare(b.gene));
        break;
      case 'score_asc':
        list = list.sort((a, b) => a.score - b.score || a.gene.localeCompare(b.gene));
        break;
      case 'gene_az':
        list = list.sort((a, b) => a.gene.localeCompare(b.gene));
        break;
      case 'gene_za':
        list = list.sort((a, b) => b.gene.localeCompare(a.gene));
        break;
      case 'relevance':
      default:
        list = list.sort(
          (a, b) =>
            priorityRank[a.priority] - priorityRank[b.priority] ||
            a.score - b.score ||
            a.gene.localeCompare(b.gene)
        );
        break;
    }
    return list;
  }, [recoveryGenes, search, impactFilter, priorityFilter, focusFilter, sortBy, risksOnly]);

  const highPriorityCount = recoveryGenes.filter((g) => g.priority === 'high').length;
  const mediumPriorityCount = recoveryGenes.filter((g) => g.priority === 'medium').length;

  // Export CSV of current filtered view
  const exportCSV = () => {
    const rows = [
      ['Gene', 'Genotype', 'RSID', 'Impact', 'Priority', 'Score', 'Category', 'Description', 'Recommendation']
    ];
    filteredSortedGenes.forEach((g) => {
      rows.push([
        g.gene,
        g.genotype,
        g.rsid,
        g.impact,
        g.priority,
        String(g.score),
        g.category,
        g.description,
        g.recoveryRecommendation.replace(/\n/g, ' ')
      ]);
    });
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recovery_genes_${athleteId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setSearch('');
    setImpactFilter('all');
    setPriorityFilter('all');
    setFocusFilter('all');
    setSortBy('relevance');
    setRisksOnly(false);
  };

  // States
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
          <h2 className="text-2xl font-bold text-gray-900">🧬 Recovery Genetics</h2>
          <p className="text-gray-600">
            Genetic markers impacting recovery, sleep, stress, circulation, and energy systems
          </p>
        </div>
        <div className="text-right">
          <div
            className={`text-3xl font-bold ${
              overallRecoveryScore > 75 ? 'text-green-600' : overallRecoveryScore > 60 ? 'text-yellow-600' : 'text-red-600'
            }`}
          >
            {overallRecoveryScore.toFixed(0)}%
          </div>
          <div className="text-sm text-gray-600">Overall Recovery Score</div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search genes, RSID, recommendation..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <select
              value={impactFilter}
              onChange={(e) => setImpactFilter(e.target.value as any)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">Impact: All</option>
              <option value="beneficial">Impact: Beneficial</option>
              <option value="neutral">Impact: Neutral</option>
              <option value="challenging">Impact: Challenging</option>
            </select>
          </div>

          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">Priority: All</option>
              <option value="high">Priority: High</option>
              <option value="medium">Priority: Medium</option>
              <option value="low">Priority: Low</option>
            </select>
          </div>

          <div>
            <select
              value={focusFilter}
              onChange={(e) => setFocusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">Focus: All</option>
              {focusAreas.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="relevance">Sort: Relevance (Risk first)</option>
              <option value="score_desc">Sort: Score (High → Low)</option>
              <option value="score_asc">Sort: Score (Low → High)</option>
              <option value="gene_az">Sort: Gene (A → Z)</option>
              <option value="gene_za">Sort: Gene (Z → A)</option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={risksOnly}
                onChange={(e) => setRisksOnly(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Show only risks (High/Medium/Challenging)
            </label>
            <div className="text-xs text-gray-500">
              Showing {filteredSortedGenes.length} of {counts.total} genes
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={resetFilters} className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
              Reset
            </button>
            <button onClick={exportCSV} className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Summary widgets */}
      {recoveryGenes.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-2">
          {/* Priority Distribution */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4 text-center">Recovery Priorities</h3>
            <div className="space-y-4">
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

              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-sm font-medium text-gray-700">Good Profile</span>
                  </div>
                  <span className="text-sm font-bold text-green-600">{counts.low}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 bg-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${(counts.low / recoveryGenes.length) * 100}%` }}
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

          {/* Recovery Scores - top of current filtered view */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4 text-center">Recovery Scores</h3>
            <div className="space-y-3">
              {filteredSortedGenes.slice(0, 6).map((gene, index) => (
                <div key={`${gene.gene}-${index}`} className="flex items-center gap-3">
                  <div className="w-12 text-xs font-medium text-gray-600 truncate">{gene.gene}</div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          gene.score > 75 ? 'bg-green-500' : gene.score > 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${gene.score}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-8 text-xs font-semibold text-gray-900 text-right">{gene.score}</div>
                </div>
              ))}
              {filteredSortedGenes.length > 6 && (
                <div className="text-xs text-gray-500 text-center mt-2">
                  +{filteredSortedGenes.length - 6} more genes
                </div>
              )}
            </div>
          </div>

          {/* Recovery Focus Areas */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4 text-center">Recovery Focus Areas</h3>
            <div className="space-y-3">
              {focusAreas.map((cat) => {
                const catGenes = recoveryGenes.filter((g) => cat.genes.includes(g.gene));
                const avgScore = catGenes.length > 0 ? catGenes.reduce((s, g) => s + g.score, 0) / catGenes.length : 0;
                return (
                  <div key={cat.key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {cat.key === 'sleep' && '😴'}
                        {cat.key === 'stress' && '🧠'}
                        {cat.key === 'energy' && '⚡'}
                        {cat.key === 'circulation' && '❤️'}
                        {cat.key === 'inflammation' && '🔥'}
                      </span>
                      <span className="text-sm font-medium text-gray-700">{cat.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">({catGenes.length})</span>
                      <div
                        className={`w-16 h-2 rounded-full ${
                          avgScore > 75 ? 'bg-green-500' : avgScore > 60 ? 'bg-yellow-500' : 'bg-gray-300'
                        }`}
                        style={{ width: avgScore > 0 ? '40px' : '0px' }}
                      />
                      <span
                        className={`text-xs font-semibold ${
                          avgScore > 75 ? 'text-green-600' : avgScore > 60 ? 'text-yellow-600' : 'text-gray-400'
                        }`}
                      >
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
            {recoveryGenes
              .filter((g) => g.priority === 'high')
              .map((g) => (
                <div key={`${g.gene}-high`} className="flex items-center gap-3 p-2 bg-red-50 rounded">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-red-800">
                    {g.gene} ({g.genotype}): {g.recoveryRecommendation}
                  </span>
                </div>
              ))}
            {recoveryGenes
              .filter((g) => g.priority === 'medium')
              .map((g) => (
                <div key={`${g.gene}-medium`} className="flex items-center gap-3 p-2 bg-yellow-50 rounded">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-yellow-800">
                    {g.gene} ({g.genotype}): {g.recoveryRecommendation}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Recovery Genes Grid */}
      {filteredSortedGenes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSortedGenes.map((gene, index) => (
            <div
              key={`${gene.gene}-${index}`}
              className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-lg transition-all duration-200"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-900 mb-1">{gene.gene}</h4>
                  <p className="text-xs text-gray-500">
                    {gene.category} • RSID: <span className="font-mono">{gene.rsid}</span>
                  </p>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    gene.priority === 'high'
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : gene.priority === 'medium'
                      ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                      : 'bg-green-100 text-green-700 border border-green-200'
                  }`}
                >
                  {gene.priority === 'high' ? '⚠️ High Priority' : gene.priority === 'medium' ? '⚡ Medium Priority' : '✅ Good Profile'}
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
                  <span
                    className={`text-sm font-bold ${
                      gene.score > 75 ? 'text-green-600' : gene.score > 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}
                  >
                    {gene.score > 75 ? 'Excellent' : gene.score > 60 ? 'Good' : 'Needs Attention'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      gene.score > 75 ? 'bg-green-500' : gene.score > 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${gene.score}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1 text-center">Score: {gene.score}/100</div>
              </div>

              {/* Description and Recommendation */}
              <div className="mb-3">
                <p className="text-sm text-gray-700">{gene.description}</p>
              </div>
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