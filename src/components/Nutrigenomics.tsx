import React, { useMemo, useState, useEffect } from 'react';
import { geneticProfileService } from '../services/dataService';
import { GeneticProfile } from '../types';

interface SupplementRecommendation {
  supplement: string;
  gene: string;
  genotype: string;
  rationale: string;
  dosage: string;
  timing: string;
  priority: 'high' | 'medium' | 'low';
}

export const Nutrigenomics: React.FC<{ athleteId: string }> = ({ athleteId }) => {
  const [geneticProfiles, setGeneticProfiles] = useState<GeneticProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [athleteName, setAthleteName] = useState<string>('');

  // Fetch genetic profiles for the athlete
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

        const profiles = await geneticProfileService.getGeneticProfileByAthlete(athleteIdNum);
        setGeneticProfiles(profiles);

        // For now, we'll use a placeholder name since athlete service might not be available
        // In a real implementation, you'd fetch athlete details separately
        setAthleteName(`Athlete ${athleteId}`);

      } catch (err) {
        console.error('Failed to fetch genetic profiles:', err);
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
    const geneticArray = Array.isArray(geneticProfiles) ? geneticProfiles : [];

    // Common genetic variants affecting nutrition and supplementation
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
              priority: profile.genotype === 'TT' ? 'high' : 'medium'
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
              priority: 'high'
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
              priority: 'medium'
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
              priority: 'medium'
            });
          } else if (profile.genotype === 'RR') {
            recommendations.push({
              supplement: 'Beta-Alanine',
              gene: profile.gene,
              genotype: profile.genotype,
              rationale: 'Enhanced power capacity, buffering support',
              dosage: '3-5g daily (divided doses)',
              timing: 'Pre-workout',
              priority: 'medium'
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
              priority: 'medium'
            });

            recommendations.push({
              supplement: 'Coenzyme Q10',
              gene: profile.gene,
              genotype: profile.genotype,
              rationale: 'Mitochondrial support for energy production',
              dosage: '100-200mg daily',
              timing: 'With breakfast',
              priority: 'medium'
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
              priority: 'medium'
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
              priority: 'medium'
            });
          }
          break;
      }
    });

    return recommendations;
  }, [geneticProfiles]);
  
  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card-enhanced p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Nutrigenomics Report</h2>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Nutrigenomics Report</h2>
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
      <div className="card-enhanced p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Nutrigenomics Report</h2>
        <p className="text-gray-600 mb-6">
          Personalized supplement recommendations for {athleteName}
        </p>
        
        {supplementRecommendations.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {supplementRecommendations.map((rec, index) => (
                <div 
                  key={index} 
                  className="p-5 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{rec.supplement}</h3>
                      <div className="mt-1 flex items-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {rec.gene} • {rec.genotype}
                        </span>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          rec.priority === 'high' 
                            ? 'bg-red-100 text-red-800' 
                            : rec.priority === 'medium' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-green-100 text-green-800'
                        }`}>
                          {rec.priority.charAt(0).toUpperCase() + rec.priority.slice(1)} Priority
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Rationale:</span> {rec.rationale}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Dosage:</span> {rec.dosage}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Timing:</span> {rec.timing}
                    </p>
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
      
      {/* Genetic Profile Summary */}
      <div className="card-enhanced p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Genetic Profile Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Array.isArray(geneticProfiles) ? geneticProfiles : [])
            .filter(g => g.athlete_id === athleteId)
            .map((profile, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">{profile.gene}</div>
                <div className="text-sm text-gray-600 mt-1">Genotype: {profile.genotype}</div>
                <div className="mt-2 text-xs text-gray-500">
                  {profile.gene === 'MTHFR' && 'Folate metabolism'}
                  {profile.gene === 'VDR' && 'Vitamin D receptor'}
                  {profile.gene === 'FTO' && 'Weight management'}
                  {profile.gene === 'ACTN3' && 'Power vs endurance'}
                  {profile.gene === 'PPARGC1A' && 'Mitochondrial biogenesis'}
                  {profile.gene === 'ADRB2' && 'Fat metabolism'}
                  {profile.gene === 'NOS3' && 'Nitric oxide production'}
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
};