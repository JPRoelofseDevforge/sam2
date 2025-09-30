import React, { useMemo, useState, useEffect } from 'react';
import { geneticProfileService } from '../services/dataService';
import { GeneticProfile } from '../types';

interface GeneticMark {
  gene: string;
  genetic_call: string;
  known_call?: string;
  category?: string;
  priority?: string;
  summary_flag?: string;
  interpretation_code?: string;
  supplement?: string;
  dosage?: string;
  timing?: string;
  created_at?: string;
  confidence_score?: number;
  risk_level?: 'low' | 'medium' | 'high';
}

interface SupplementRecommendation {
  supplement: string;
  gene: string;
  genotype: string;
  rationale: string;
  dosage: string;
  timing: string;
  priority: 'high' | 'medium' | 'low';
  category?: string;
  confidence_score?: number;
  risk_level?: 'low' | 'medium' | 'high';
  genetic_mark_id?: string;
}

export const Nutrigenomics: React.FC<{ athleteId: string }> = ({ athleteId }) => {
  const [geneticMarks, setGeneticMarks] = useState<GeneticMark[]>([]);
  const [geneticProfiles, setGeneticProfiles] = useState<GeneticProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [athleteName, setAthleteName] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

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

        // Fetch genetic marks from controllers (nutrigenomics data)
        const [marksData, profilesData] = await Promise.all([
          geneticProfileService.getNutrigenomicsByAthlete(athleteIdNum),
          geneticProfileService.getGeneticProfileByAthlete(athleteIdNum)
        ]);

        // Process genetic marks data
        const processedMarks = Array.isArray(marksData) ? marksData.map((mark, index) => ({
          gene: mark.gene || mark.GeneName || `GENE_${index}`,
          genetic_call: mark.genetic_call || mark.GeneticCall || mark.genotype || 'Unknown',
          known_call: mark.known_call || mark.KnownCall,
          category: mark.category || mark.Category || 'General',
          priority: mark.priority || mark.Priority || mark.summary_flag || 'medium',
          summary_flag: mark.summary_flag || mark.SummaryFlag,
          interpretation_code: mark.interpretation_code || mark.InterpretationCode || mark.rationale,
          supplement: mark.supplement || mark.Supplement,
          dosage: mark.dosage || mark.Dosage,
          timing: mark.timing || mark.Timing,
          created_at: mark.created_at || mark.CreatedAt,
          confidence_score: mark.confidence_score || mark.ConfidenceScore,
          risk_level: mark.risk_level || mark.RiskLevel || (mark.priority === 'high' ? 'high' : mark.priority === 'medium' ? 'medium' : 'low')
        })) : [];

        setGeneticMarks(processedMarks);
        setGeneticProfiles(profilesData);
        setLastUpdated(new Date().toISOString());

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

  // Get nutrigenomics recommendations for the athlete
  const supplementRecommendations = useMemo<SupplementRecommendation[]>(() => {
    const recommendations: SupplementRecommendation[] = [];

    // Use genetic marks from controllers if available
    if (geneticMarks.length > 0) {
      geneticMarks.forEach((mark, index) => {
        // Only create recommendations for marks that have supplement information
        if (mark.supplement && mark.gene) {
          recommendations.push({
            supplement: mark.supplement,
            gene: mark.gene,
            genotype: mark.genetic_call || mark.known_call || 'Unknown',
            rationale: mark.interpretation_code || 'Genetic-based recommendation',
            dosage: mark.dosage || 'Dosage not specified',
            timing: mark.timing || 'Timing not specified',
            priority: (mark.priority || mark.summary_flag || 'medium').toLowerCase() as 'low' | 'medium' | 'high',
            category: mark.category || 'General',
            confidence_score: mark.confidence_score,
            risk_level: mark.risk_level,
            genetic_mark_id: `mark_${index}`
          });
        }
      });
    }

    // Fallback to legacy genetic profiles if no controller data
    if (recommendations.length === 0) {
      const geneticArray = Array.isArray(geneticProfiles) ? geneticProfiles : [];
      geneticArray.forEach(profile => {
        switch(profile.gene) {
          case 'MTHFR':
            if (profile.genotype === 'TT' || profile.genotype === 'CT') {
              recommendations.push({
                supplement: 'Methylated Folate (5-MTHF)',
                gene: profile.gene,
                genotype: profile.genotype,
                rationale: 'Reduced enzyme activity affects folate metabolism',
                dosage: '400-800 mcg daily',
                timing: 'With breakfast for better absorption',
                priority: profile.genotype === 'TT' ? 'high' : 'medium',
                category: 'Methylation',
                confidence_score: 0.85,
                risk_level: profile.genotype === 'TT' ? 'high' : 'medium'
              });
            }
            break;

          case 'VDR':
            if (profile.genotype === 'FF' || profile.genotype === 'Ff') {
              recommendations.push({
                supplement: 'Vitamin D3',
                gene: profile.gene,
                genotype: profile.genotype,
                rationale: 'Reduced vitamin D receptor sensitivity',
                dosage: '2000-4000 IU daily (with blood testing)',
                timing: 'With fat-containing meal for better absorption',
                priority: 'high',
                category: 'Vitamin Metabolism',
                confidence_score: 0.90,
                risk_level: 'high'
              });
            }
            break;

          case 'FTO':
            if (profile.genotype === 'AA' || profile.genotype === 'AT') {
              recommendations.push({
                supplement: 'Green Tea Extract (EGCG)',
                gene: profile.gene,
                genotype: profile.genotype,
                rationale: 'Increased risk of weight gain, enhanced fat oxidation support',
                dosage: '250-500 mg EGCG daily',
                timing: '30 minutes before exercise',
                priority: 'medium',
                category: 'Metabolism',
                confidence_score: 0.75,
                risk_level: 'medium'
              });
            }
            break;

          case 'ACTN3':
            if (profile.genotype === 'XX') {
              recommendations.push({
                supplement: 'Creatine Monohydrate',
                gene: profile.gene,
                genotype: profile.genotype,
                rationale: 'Reduced power/strength potential, creatine can help',
                dosage: '3-5g daily',
                timing: 'Post-workout with carbohydrates',
                priority: 'medium',
                category: 'Performance',
                confidence_score: 0.80,
                risk_level: 'medium'
              });
            } else if (profile.genotype === 'RR') {
              recommendations.push({
                supplement: 'Beta-Alanine',
                gene: profile.gene,
                genotype: profile.genotype,
                rationale: 'Enhanced power capacity, buffering support',
                dosage: '3-5g daily (divided doses)',
                timing: 'Pre-workout',
                priority: 'medium',
                category: 'Performance',
                confidence_score: 0.80,
                risk_level: 'low'
              });
            }
            break;

          case 'PPARGC1A':
            if (profile.genotype.includes('Ser')) {
              recommendations.push({
                supplement: 'Resveratrol',
                gene: profile.gene,
                genotype: profile.genotype,
                rationale: 'Enhanced mitochondrial biogenesis response',
                dosage: '250-500mg daily',
                timing: 'With dinner',
                priority: 'medium',
                category: 'Mitochondrial Function',
                confidence_score: 0.70,
                risk_level: 'low'
              });

              recommendations.push({
                supplement: 'Coenzyme Q10',
                gene: profile.gene,
                genotype: profile.genotype,
                rationale: 'Mitochondrial support for energy production',
                dosage: '100-200mg daily',
                timing: 'With breakfast',
                priority: 'medium',
                category: 'Mitochondrial Function',
                confidence_score: 0.75,
                risk_level: 'low'
              });
            }
            break;

          case 'ADRB2':
            if (profile.genotype === 'Gly16Gly') {
              recommendations.push({
                supplement: 'Caffeine (Genotype-Optimized)',
                gene: profile.gene,
                genotype: profile.genotype,
                rationale: 'Reduced fat mobilization, strategic caffeine use',
                dosage: '100-200mg (lower than typical doses)',
                timing: 'Pre-workout (avoid late in day)',
                priority: 'medium',
                category: 'Metabolism',
                confidence_score: 0.65,
                risk_level: 'medium'
              });
            }
            break;

          case 'NOS3':
            if (profile.genotype === 'CC' || profile.genotype === 'CT') {
              recommendations.push({
                supplement: 'L-Citrulline',
                gene: profile.gene,
                genotype: profile.genotype,
                rationale: 'Enhanced nitric oxide production support',
                dosage: '6-8g daily',
                timing: '30 minutes before exercise',
                priority: 'medium',
                category: 'Cardiovascular',
                confidence_score: 0.80,
                risk_level: 'low'
              });
            }
            break;
        }
      });
    }

    return recommendations;
  }, [geneticMarks, geneticProfiles]);
  
  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card-enhanced p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Nutrigenomics Report</h2>
            <div className="text-sm text-gray-500">Loading genetic marks from controllers...</div>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Fetching genetic data and processing recommendations...</span>
          </div>
          <div className="mt-4 text-center">
            <div className="inline-flex items-center text-sm text-gray-500">
              <div className="animate-pulse mr-2">●</div>
              <div className="animate-pulse mr-2">●</div>
              <div className="animate-pulse">●</div>
            </div>
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Nutrigenomics Report</h2>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Refresh
            </button>
          </div>
          <div className="text-center py-12">
            <div className="text-red-500 mb-4 text-4xl">⚠️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Genetic Data</h3>
            <p className="text-gray-600 mb-4 max-w-md mx-auto">{error}</p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Retry Loading
              </button>
              <p className="text-xs text-gray-500">
                If the problem persists, please check your connection or contact support.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card-enhanced p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Nutrigenomics Report</h2>
            <p className="text-gray-600 mt-1">
              Personalized supplement recommendations for {athleteName}
            </p>
            <div className="flex items-center gap-4 mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {geneticMarks.length > 0 ? `${geneticMarks.length} genetic marks from controllers` : 'Legacy genetic profiles'}
              </span>
              {geneticMarks.length > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Controller Data Available
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-1"
            title="Refresh genetic data"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
        
        {supplementRecommendations.length > 0 ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Supplement Recommendations ({supplementRecommendations.length})
              </h3>
              <div className="flex gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {supplementRecommendations.filter(r => r.priority === 'high').length} High Priority
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {supplementRecommendations.filter(r => r.priority === 'medium').length} Medium Priority
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {supplementRecommendations.filter(r => r.priority === 'low').length} Low Priority
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {supplementRecommendations.map((rec, index) => (
                <div
                  key={rec.genetic_mark_id || index}
                  className="p-5 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors bg-white shadow-sm"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{rec.supplement}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {rec.gene} • {rec.genotype}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          rec.priority === 'high'
                            ? 'bg-red-100 text-red-800'
                            : rec.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                        }`}>
                          {rec.priority.charAt(0).toUpperCase() + rec.priority.slice(1)} Priority
                        </span>
                        {rec.category && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {rec.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium text-gray-900">Rationale:</span> {rec.rationale}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium text-gray-900 text-sm">Dosage:</span>
                        <p className="text-sm text-gray-700 mt-1">{rec.dosage}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900 text-sm">Timing:</span>
                        <p className="text-sm text-gray-700 mt-1">{rec.timing}</p>
                      </div>
                    </div>

                    {rec.confidence_score && (
                      <div className="pt-2 border-t border-gray-100">
                        <div className="flex justify-between items-center text-xs text-gray-600">
                          <span>Confidence Score:</span>
                          <span className={`font-medium ${
                            rec.confidence_score >= 0.8 ? 'text-green-600' :
                            rec.confidence_score >= 0.6 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {(rec.confidence_score * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className={`h-2 rounded-full ${
                              rec.confidence_score >= 0.8 ? 'bg-green-500' :
                              rec.confidence_score >= 0.6 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${rec.confidence_score * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {rec.risk_level && (
                      <div className="pt-2 border-t border-gray-100">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Risk Level:</span>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            rec.risk_level === 'high' ? 'bg-red-100 text-red-800' :
                            rec.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {rec.risk_level.charAt(0).toUpperCase() + rec.risk_level.slice(1)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🥗</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Specific Genetic-Based Supplement Recommendations</h3>
            <p className="text-gray-600">
              Based on available genetic data, no specific supplement recommendations were identified.
            </p>
          </div>
        )}
        
        <div className="mt-8 p-5 bg-blue-50 rounded-lg border border-blue-100">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Implementation Notes</h3>
          <ul className="text-blue-700 text-sm list-disc pl-5 space-y-1">
            <li>Start with high-priority supplements and monitor response</li>
            <li>Introduce one supplement at a time to assess individual effects</li>
            <li>Combine with regular blood testing to optimize dosages</li>
            <li>Consult with a sports nutritionist for personalized meal planning</li>
            <li>Consider interactions between supplements and any medications</li>
          </ul>
        </div>
      </div>

      {/* Personalized Nutrition Plan */}
      <div className="card-enhanced p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Personalized Nutrition Plan</h3>
            <p className="text-gray-600 mt-1">Genetically-tailored dietary strategy for {athleteName}</p>
          </div>
          {lastUpdated && (
            <span className="text-xs text-gray-500">
              Plan updated: {new Date(lastUpdated).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Macronutrient Distribution */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            Macronutrient Distribution
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-700 mb-1">40%</div>
              <div className="text-sm text-blue-600">Carbohydrates</div>
              <div className="text-xs text-blue-500 mt-1">Focus on complex carbs for sustained energy</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-700 mb-1">30%</div>
              <div className="text-sm text-green-600">Protein</div>
              <div className="text-xs text-green-500 mt-1">High-quality sources for muscle repair</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-700 mb-1">30%</div>
              <div className="text-sm text-yellow-600">Healthy Fats</div>
              <div className="text-xs text-yellow-500 mt-1">Omega-3s and MUFAs for inflammation control</div>
            </div>
          </div>
        </div>

        {/* Meal Timing Strategy */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Optimal Meal Timing
          </h4>
          <div className="space-y-3">
            <div className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="w-12 text-sm font-medium text-green-700">7:00 AM</div>
              <div className="ml-4 flex-1">
                <div className="font-medium text-gray-900">Pre-Training Breakfast</div>
                <div className="text-sm text-gray-600">Complex carbs + protein for sustained energy</div>
              </div>
            </div>
            <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="w-12 text-sm font-medium text-blue-700">10:00 AM</div>
              <div className="ml-4 flex-1">
                <div className="font-medium text-gray-900">Mid-Morning Snack</div>
                <div className="text-sm text-gray-600">Fruit + nuts for steady blood sugar</div>
              </div>
            </div>
            <div className="flex items-center p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="w-12 text-sm font-medium text-purple-700">1:00 PM</div>
              <div className="ml-4 flex-1">
                <div className="font-medium text-gray-900">Post-Training Lunch</div>
                <div className="text-sm text-gray-600">Balanced meal with recovery focus</div>
              </div>
            </div>
            <div className="flex items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="w-12 text-sm font-medium text-orange-700">4:00 PM</div>
              <div className="ml-4 flex-1">
                <div className="font-medium text-gray-900">Afternoon Snack</div>
                <div className="text-sm text-gray-600">Protein-focused for muscle maintenance</div>
              </div>
            </div>
            <div className="flex items-center p-3 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="w-12 text-sm font-medium text-indigo-700">7:00 PM</div>
              <div className="ml-4 flex-1">
                <div className="font-medium text-gray-900">Dinner</div>
                <div className="text-sm text-gray-600">Lighter meal with anti-inflammatory foods</div>
              </div>
            </div>
          </div>
        </div>

        {/* Genetic-Specific Food Recommendations */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
            Genetic-Based Food Priorities
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <h5 className="font-semibold text-red-800 mb-2">High Priority Foods</h5>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Leafy greens (folate-rich)</li>
                  <li>• Fatty fish (omega-3s)</li>
                  <li>• Berries (antioxidants)</li>
                  <li>• Nuts and seeds</li>
                  <li>• Grass-fed proteins</li>
                </ul>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h5 className="font-semibold text-yellow-800 mb-2">Moderate Priority Foods</h5>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Whole grains</li>
                  <li>• Legumes</li>
                  <li>• Root vegetables</li>
                  <li>• Eggs</li>
                  <li>• Avocado</li>
                </ul>
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h5 className="font-semibold text-green-800 mb-2">Foods to Limit</h5>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Processed sugars</li>
                  <li>• Trans fats</li>
                  <li>• Excessive caffeine</li>
                  <li>• Alcohol</li>
                  <li>• Processed meats</li>
                </ul>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h5 className="font-semibold text-blue-800 mb-2">Hydration Strategy</h5>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 3-4L water daily</li>
                  <li>• Electrolyte balance post-training</li>
                  <li>• Herbal teas for recovery</li>
                  <li>• Bone broth for minerals</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Structure */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
            Weekly Meal Structure
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['Training Days', 'Rest Days', 'Competition Days', 'Recovery Days'].map((dayType, index) => (
              <div key={index} className="p-3 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200 text-center">
                <div className="font-medium text-indigo-800 text-sm">{dayType}</div>
                <div className="text-xs text-indigo-600 mt-1">
                  {dayType === 'Training Days' && 'Higher carbs'}
                  {dayType === 'Rest Days' && 'Normal balance'}
                  {dayType === 'Competition Days' && 'Fast energy'}
                  {dayType === 'Recovery Days' && 'Anti-inflammatory'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Genetic Profile Impact */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
            Your Genetic Profile Impact
          </h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {geneticMarks.length > 0 ? (
              geneticMarks.slice(0, 4).map((mark, index) => (
                <div key={index} className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-gray-900">{mark.gene} ({mark.genetic_call})</div>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      mark.category === 'Metabolism' ? 'bg-blue-100 text-blue-800' :
                      mark.category === 'Performance' ? 'bg-green-100 text-green-800' :
                      mark.category === 'Recovery' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {mark.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">
                    {mark.gene === 'FTO' && 'Influences weight management and fat metabolism efficiency'}
                    {mark.gene === 'ACTN3' && 'Affects muscle power and endurance capabilities'}
                    {mark.gene === 'MTHFR' && 'Impacts folate metabolism and methylation processes'}
                    {mark.gene === 'VDR' && 'Controls vitamin D receptor sensitivity and calcium metabolism'}
                    {mark.gene === 'PPARGC1A' && 'Regulates mitochondrial biogenesis and energy production'}
                    {mark.gene === 'ADRB2' && 'Affects fat mobilization and metabolic response'}
                    {mark.gene === 'NOS3' && 'Influences nitric oxide production and blood flow'}
                    {mark.gene !== 'FTO' && mark.gene !== 'ACTN3' && mark.gene !== 'MTHFR' &&
                     mark.gene !== 'VDR' && mark.gene !== 'PPARGC1A' && mark.gene !== 'ADRB2' &&
                     mark.gene !== 'NOS3' && 'Genetic variant affecting nutritional needs'}
                  </p>
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">Dietary Focus:</span>
                    {mark.gene === 'FTO' && ' Higher protein, controlled portions, green tea'}
                    {mark.gene === 'ACTN3' && ' Performance carbs, creatine-rich foods'}
                    {mark.gene === 'MTHFR' && ' Methylated folate sources, leafy greens'}
                    {mark.gene === 'VDR' && ' Vitamin D rich foods, fatty fish, mushrooms'}
                    {mark.gene === 'PPARGC1A' && ' Antioxidant-rich foods, resveratrol sources'}
                    {mark.gene === 'ADRB2' && ' Moderate caffeine, balanced macros'}
                    {mark.gene === 'NOS3' && ' Nitric oxide boosters, beetroot, citrulline'}
                    {mark.gene !== 'FTO' && mark.gene !== 'ACTN3' && mark.gene !== 'MTHFR' &&
                     mark.gene !== 'VDR' && mark.gene !== 'PPARGC1A' && mark.gene !== 'ADRB2' &&
                     mark.gene !== 'NOS3' && ' Personalized nutrition strategy required'}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <h5 className="font-semibold text-blue-800 mb-2">Standard Athletic Nutrition Profile</h5>
                <p className="text-blue-700 text-sm">
                  Based on your genetic profile, you have a standard athletic metabolism pattern.
                  Focus on balanced nutrition with complex carbohydrates, lean proteins, and healthy fats.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Daily Meal Examples */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
            Sample Daily Meal Plan
          </h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <h5 className="font-semibold text-orange-800 mb-3">Training Day Example</h5>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-black">Breakfast (7:00 AM):</span>
                    <span className="text-gray-600">Oatmeal with berries, eggs, spinach</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-black">Mid-Morning (10:00 AM):</span>
                    <span className="text-gray-600">Greek yogurt with almonds</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-black">Lunch (1:00 PM):</span>
                    <span className="text-gray-600">Grilled chicken, quinoa, vegetables</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-black">Post-Training (4:00 PM):</span>
                    <span className="text-gray-600">Protein shake with banana</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-black">Dinner (7:00 PM):</span>
                    <span className="text-gray-600">Salmon, sweet potato, broccoli</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                <h5 className="font-semibold text-teal-800 mb-3">Rest Day Example</h5>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-black">Breakfast (8:00 AM):</span>
                    <span className="text-gray-600">Smoothie with kale, berries, protein</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-black">Mid-Morning (11:00 AM):</span>
                    <span className="text-gray-600">Apple with handful of walnuts</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-black">Lunch (2:00 PM):</span>
                    <span className="text-gray-600">Turkey salad with mixed greens</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-black">Afternoon (5:00 PM):</span>
                    <span className="text-gray-600">Cottage cheese with tomatoes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-black">Dinner (8:00 PM):</span>
                    <span className="text-gray-600">Grilled fish, brown rice, asparagus</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Nutrition Strategies */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
            Key Nutrition Strategies
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <h6 className="font-semibold text-emerald-800 mb-2">Metabolic Optimization</h6>
              <ul className="text-sm text-emerald-700 space-y-1">
                <li>• Time carbs around training</li>
                <li>• Focus on nutrient density</li>
                <li>• Balance blood sugar</li>
                <li>• Support liver function</li>
              </ul>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h6 className="font-semibold text-amber-800 mb-2">Recovery Enhancement</h6>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Anti-inflammatory foods</li>
                <li>• Adequate protein timing</li>
                <li>• Micronutrient support</li>
                <li>• Sleep-optimized meals</li>
              </ul>
            </div>
            <div className="p-4 bg-rose-50 rounded-lg border border-rose-200">
              <h6 className="font-semibold text-rose-800 mb-2">Performance Support</h6>
              <ul className="text-sm text-rose-700 space-y-1">
                <li>• Pre-training fuel</li>
                <li>• Intra-training support</li>
                <li>• Post-training recovery</li>
                <li>• Competition day strategy</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Supplement Integration */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <h5 className="font-semibold text-blue-800 mb-3 flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            Supplement Integration with Meals
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-800 mb-1">Morning Integration:</div>
              <div className="text-gray-600">Take vitamins with breakfast for optimal absorption</div>
            </div>
            <div>
              <div className="font-medium text-gray-800 mb-1">Post-Training Integration:</div>
              <div className="text-gray-600">Protein and creatine immediately after workouts</div>
            </div>
            <div>
              <div className="font-medium text-gray-800 mb-1">Evening Integration:</div>
              <div className="text-gray-600">Anti-inflammatory supplements with dinner</div>
            </div>
            <div>
              <div className="font-medium text-gray-800 mb-1">Pre-Bed Integration:</div>
              <div className="text-gray-600">Magnesium and melatonin for recovery</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};