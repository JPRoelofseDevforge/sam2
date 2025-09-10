import React, { useMemo, useState, useEffect } from 'react';
import { geneticProfileService } from '../services/dataService';
import { GeneticProfile } from '../types';

interface RecoveryGene {
  gene: string;
  genotype: string;
  trait: string;
  impact: string;
  recoveryProtocol: string;
  priority: 'high' | 'medium' | 'low';
}

export const RecoveryGenePanel: React.FC<{ athleteId: string }> = ({ athleteId }) => {
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

  // Get recovery gene insights for the athlete
  const recoveryGenes = useMemo<RecoveryGene[]>(() => {
    const genes: RecoveryGene[] = [];

    // Expanded genetic markers related to recovery
    geneticProfiles.forEach(profile => {
      switch(profile.gene) {
        case 'IL6':
          genes.push({
            gene: profile.gene,
            genotype: profile.genotype,
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
            priority: profile.genotype === 'GG' ? 'high' : 'medium'
          });
          break;

        case 'TNF':
          genes.push({
            gene: profile.gene,
            genotype: profile.genotype,
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
            priority: profile.genotype === 'AA' ? 'high' : 'medium'
          });
          break;

        case 'IL10':
          genes.push({
            gene: profile.gene,
            genotype: profile.genotype,
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
            priority: profile.genotype === 'CC' ? 'high' : 'low'
          });
          break;

        case 'VDR':
          genes.push({
            gene: profile.gene,
            genotype: profile.genotype,
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
            priority: profile.genotype === 'FF' ? 'high' : 'medium'
          });
          break;

        case 'ADRB1':
          genes.push({
            gene: profile.gene,
            genotype: profile.genotype,
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
            priority: profile.genotype === 'AA' ? 'high' : 'medium'
          });
          break;

        case 'CLOCK':
          genes.push({
            gene: profile.gene,
            genotype: profile.genotype,
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
            priority: profile.genotype === 'AA' ? 'high' : 'medium'
          });
          break;

        case 'HSD11B1':
          genes.push({
            gene: profile.gene,
            genotype: profile.genotype,
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
            priority: profile.genotype === 'TT' ? 'high' : 'medium'
          });
          break;

        case 'COMT':
          genes.push({
            gene: profile.gene,
            genotype: profile.genotype,
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
            priority: profile.genotype === 'AA' ? 'high' : 'medium'
          });
          break;
      }
    });

    return genes;
  }, [geneticProfiles]);
  
  // Calculate overall recovery priority
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
      <div className="card-enhanced p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Recovery Gene Panel</h2>
        <p className="text-gray-600 mb-6">
          Expanded genetic markers for recovery optimization for {athleteName}
        </p>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="card-enhanced p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{highPriorityCount}</div>
            <div className="text-sm text-gray-600">High Priority Genes</div>
          </div>
          <div className="card-enhanced p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{mediumPriorityCount}</div>
            <div className="text-sm text-gray-600">Medium Priority Genes</div>
          </div>
          <div className="card-enhanced p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {recoveryGenes.filter(g => g.priority === 'low').length}
            </div>
            <div className="text-sm text-gray-600">Low Priority Genes</div>
          </div>
        </div>
        
        {recoveryGenes.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-6">
              {recoveryGenes.map((gene, index) => (
                <div 
                  key={index} 
                  className="p-5 rounded-lg border border-gray-200"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{gene.gene}</h3>
                      <div className="mt-1 flex items-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Genotype: {gene.genotype}
                        </span>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          gene.priority === 'high' 
                            ? 'bg-red-100 text-red-800' 
                            : gene.priority === 'medium' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-green-100 text-green-800'
                        }`}>
                          {gene.priority.charAt(0).toUpperCase() + gene.priority.slice(1)} Priority
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Trait:</span> {gene.trait}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Impact:</span> {gene.impact}
                    </p>
                    <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-md">
                      <span className="font-medium">Recovery Protocol:</span> {gene.recoveryProtocol}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🧬</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Recovery Gene Data Available</h3>
            <p className="text-gray-600">
              Additional genetic testing would be needed to unlock recovery gene insights.
            </p>
          </div>
        )}
        
        <div className="mt-8 p-5 bg-blue-50 rounded-lg border border-blue-100">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Implementation Strategy</h3>
          <ul className="text-blue-700 text-sm list-disc pl-5 space-y-1">
            <li>Focus first on high-priority genes with the greatest impact on recovery</li>
            <li>Implement one protocol change at a time to assess effectiveness</li>
            <li>Monitor biometric markers (HRV, resting HR, sleep) to validate interventions</li>
            <li>Adjust protocols based on individual response and seasonal training demands</li>
            <li>Reassess during off-season when training load is reduced</li>
          </ul>
        </div>
      </div>
    </div>
  );
};