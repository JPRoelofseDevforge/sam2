import React, { useMemo, useState, useEffect } from 'react';
import { geneticProfileService, dataService } from '../services/dataService';
import { GeneticProfile } from '../types';

interface MedicationInsight {
  medication: string;
  gene: string;
  genotype: string;
  effect: string;
  recommendation: string;
  riskLevel: 'low' | 'medium' | 'high';
  category: 'safe' | 'caution' | 'avoid';
  dosage?: string;
  alternatives?: string[];
  interactions?: string[];
  athleticRelevance: 'high' | 'medium' | 'low';
  commonUse: string;
}

export const Pharmacogenomics: React.FC<{ athleteId: string }> = ({ athleteId }) => {
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

        // Fetch new genetic summary data
        const summaryData = await geneticProfileService.getPharmacogenomicsByAthlete(athleteIdNum);
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

  // Get pharmacogenomics insights for the athlete
  const medicationInsights = useMemo<MedicationInsight[]>(() => {
    const insights: MedicationInsight[] = [];

    // Enhanced medication database for athletes
    const athleticMedications = [
      // Pain Relief & Anti-inflammatory
      {
        medication: 'Ibuprofen',
        gene: 'General',
        genotype: 'Standard',
        effect: 'Standard anti-inflammatory response',
        recommendation: 'Safe for short-term use, monitor stomach',
        riskLevel: 'low' as const,
        category: 'safe' as const,
        athleticRelevance: 'high' as const,
        commonUse: 'Post-training soreness',
        dosage: '400-800mg every 6-8 hours as needed',
        alternatives: ['Acetaminophen', 'Naproxen'],
        interactions: ['Aspirin', 'Blood thinners']
      },
      {
        medication: 'Acetaminophen',
        gene: 'General',
        genotype: 'Standard',
        effect: 'Standard pain relief without anti-inflammatory effects',
        recommendation: 'Safe for pain relief, liver-safe dosing',
        riskLevel: 'low' as const,
        category: 'safe' as const,
        athleticRelevance: 'high' as const,
        commonUse: 'Headache and general pain',
        dosage: '500-1000mg every 4-6 hours as needed',
        alternatives: ['Ibuprofen', 'Aspirin'],
        interactions: ['Alcohol', 'Liver medications']
      },
      // Performance & Recovery
      {
        medication: 'Caffeine',
        gene: 'ADORA2A',
        genotype: 'Standard',
        effect: 'Performance enhancement through adenosine receptor',
        recommendation: 'Effective for endurance and focus',
        riskLevel: 'low' as const,
        category: 'safe' as const,
        athleticRelevance: 'high' as const,
        commonUse: 'Pre-training stimulation',
        dosage: '200-400mg 30-60 minutes before activity',
        alternatives: ['Green tea extract', 'Guarana'],
        interactions: ['Stimulants', 'Heart medications']
      },
      // Respiratory
      {
        medication: 'Albuterol',
        gene: 'ADRB2',
        genotype: 'Standard',
        effect: 'Bronchodilation for improved breathing',
        recommendation: 'Effective for exercise-induced bronchoconstriction',
        riskLevel: 'low' as const,
        category: 'safe' as const,
        athleticRelevance: 'high' as const,
        commonUse: 'Asthma and breathing support',
        dosage: '2 puffs as needed before exercise',
        alternatives: ['Levalbuterol', 'Ipratropium'],
        interactions: ['Beta-blockers', 'Heart medications']
      },
      // Supplements that interact with medications
      {
        medication: 'Vitamin K',
        gene: 'VKORC1',
        genotype: 'Standard',
        effect: 'Can interfere with blood thinning medications',
        recommendation: 'Monitor intake if on anticoagulants',
        riskLevel: 'medium' as const,
        category: 'caution' as const,
        athleticRelevance: 'medium' as const,
        commonUse: 'Bone health supplement',
        dosage: '90-120mcg daily from food sources',
        alternatives: ['Calcium', 'Vitamin D'],
        interactions: ['Warfarin', 'Blood thinners']
      }
    ];

    // Add comprehensive athletic medications
    insights.push(...athleticMedications);

    // Use genetic summary data if available, but only if it contains meaningful information
    if (geneticSummary.length > 0) {
      geneticSummary.forEach(summary => {
        // Only include entries with specific medication information
        if (summary.medication &&
            summary.medication !== 'Unknown Medication' &&
            summary.medication.trim() !== '' &&
            summary.interpretation_code &&
            summary.interpretation_code !== 'Effect not specified') {

          insights.push({
            medication: summary.medication,
            gene: summary.gene || 'Unknown Gene',
            genotype: summary.genetic_call || summary.known_call || 'Unknown Genotype',
            effect: summary.interpretation_code,
            recommendation: summary.override_comment || 'Monitor response and adjust as needed',
            riskLevel: (summary.summary_flag || 'medium').toLowerCase() as 'low' | 'medium' | 'high',
            category: 'caution',
            athleticRelevance: 'medium',
            commonUse: 'Genetic-specific medication response'
          });
        }
      });
    }

    // Fallback to legacy genetic profiles with enhanced medication database
    geneticProfiles.forEach(profile => {
      switch(profile.gene) {
        case 'CYP2D6':
          if (profile.genotype.includes('Poor')) {
            insights.push({
              medication: 'Codeine',
              gene: profile.gene,
              genotype: profile.genotype,
              effect: 'Poor metabolism - may be ineffective',
              recommendation: 'Avoid codeine, consider alternative pain relief',
              riskLevel: 'high',
              category: 'avoid',
              athleticRelevance: 'high',
              commonUse: 'Post-injury pain relief'
            });
          } else if (profile.genotype.includes('Ultra')) {
            insights.push({
              medication: 'Codeine',
              gene: profile.gene,
              genotype: profile.genotype,
              effect: 'Ultra-rapid metabolism - risk of toxicity',
              recommendation: 'Avoid codeine, risk of overdose',
              riskLevel: 'high',
              category: 'avoid',
              athleticRelevance: 'high',
              commonUse: 'Post-injury pain relief'
            });
          }
          break;

        case 'CYP2C19':
          if (profile.genotype.includes('Poor')) {
            insights.push({
              medication: 'Omeprazole',
              gene: profile.gene,
              genotype: profile.genotype,
              effect: 'Poor metabolism - reduced effectiveness',
              recommendation: 'Higher doses may be needed or alternative PPI',
              riskLevel: 'medium',
              category: 'caution',
              athleticRelevance: 'medium',
              commonUse: 'GERD treatment'
            });
          }
          break;

        case 'SLCO1B1':
          if (profile.genotype === 'CC') {
            insights.push({
              medication: 'Atorvastatin',
              gene: profile.gene,
              genotype: profile.genotype,
              effect: 'Increased risk of statin-induced myopathy',
              recommendation: 'Monitor for muscle pain, consider lower doses',
              riskLevel: 'medium',
              category: 'caution',
              athleticRelevance: 'medium',
              commonUse: 'Cholesterol management'
            });
          } else if (profile.genotype === 'CT' || profile.genotype === 'TT') {
            insights.push({
              medication: 'Atorvastatin',
              gene: profile.gene,
              genotype: profile.genotype,
              effect: 'Significantly increased risk of myopathy',
              recommendation: 'Avoid statins or use very low doses with monitoring',
              riskLevel: 'high',
              category: 'avoid',
              athleticRelevance: 'medium',
              commonUse: 'Cholesterol management'
            });
          }
          break;

        case 'VKORC1':
          insights.push({
            medication: 'Warfarin',
            gene: profile.gene,
            genotype: profile.genotype,
            effect: 'Affects warfarin sensitivity',
            recommendation: profile.genotype === 'AA'
              ? 'May require higher warfarin doses'
              : profile.genotype === 'AG'
                ? 'Standard dosing appropriate'
                : 'May require lower warfarin doses',
            riskLevel: profile.genotype === 'AA' ? 'medium' : profile.genotype === 'GG' ? 'high' : 'low',
            category: profile.genotype === 'GG' ? 'caution' : 'safe',
            athleticRelevance: 'low',
            commonUse: 'Anticoagulation therapy'
          });
          break;

        case 'CFTR':
          if (profile.genotype === 'F508del/F508del') {
            insights.push({
              medication: 'Ivacaftor',
              gene: profile.gene,
              genotype: profile.genotype,
              effect: 'Responds well to CFTR modulator therapy',
              recommendation: 'Ivacaftor indicated for this genotype',
              riskLevel: 'low',
              category: 'safe',
              athleticRelevance: 'low',
              commonUse: 'Cystic fibrosis treatment'
            });
          }
          break;
      }
    });

    return insights;
  }, [geneticSummary, geneticProfiles]);

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card-enhanced p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pharmacogenomics Report</h2>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pharmacogenomics Report</h2>
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

  // Organize medications by category
  const safeMedications = medicationInsights.filter(med => med.category === 'safe');
  const cautionMedications = medicationInsights.filter(med => med.category === 'caution');
  const avoidMedications = medicationInsights.filter(med => med.category === 'avoid');

  return (
    <div className="space-y-6">
      <div className="card-enhanced p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Medication Safety Guide</h2>
            <p className="text-gray-600 mt-1">
              Genetic-based medication recommendations for {athleteName}
            </p>
            <div className="flex items-center gap-4 mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {safeMedications.length} Safe
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {cautionMedications.length} Use with Caution
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {avoidMedications.length} Avoid
              </span>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-1"
            title="Refresh medication data"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Safe Medications */}
        {safeMedications.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              Safe to Use ({safeMedications.length})
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {safeMedications.map((insight, index) => (
                <div key={index} className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900">{insight.medication}</h4>
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 font-medium">
                      {insight.athleticRelevance === 'high' ? 'High Relevance' : 'Medium Relevance'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Common Use:</span> {insight.commonUse}
                  </p>
                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Effect:</span> {insight.effect}
                  </p>
                  {insight.dosage && (
                    <p className="text-sm text-gray-700 mb-2">
                      <span className="font-medium">Recommended Dosage:</span> {insight.dosage}
                    </p>
                  )}
                  {insight.alternatives && insight.alternatives.length > 0 && (
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Alternatives:</span> {insight.alternatives.join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Caution Medications */}
        {cautionMedications.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center">
              <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
              Use with Caution ({cautionMedications.length})
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {cautionMedications.map((insight, index) => (
                <div key={index} className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900">{insight.medication}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      insight.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                      insight.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {insight.riskLevel} Risk
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Common Use:</span> {insight.commonUse}
                  </p>
                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Effect:</span> {insight.effect}
                  </p>
                  <p className="text-sm text-gray-700 mb-3">
                    <span className="font-medium">Recommendation:</span> {insight.recommendation}
                  </p>
                  {insight.dosage && (
                    <p className="text-sm text-gray-700 mb-2">
                      <span className="font-medium">Recommended Dosage:</span> {insight.dosage}
                    </p>
                  )}
                  {insight.alternatives && insight.alternatives.length > 0 && (
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Alternatives:</span> {insight.alternatives.join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Avoid Medications */}
        {avoidMedications.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
              <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
              Avoid These Medications ({avoidMedications.length})
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {avoidMedications.map((insight, index) => (
                <div key={index} className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900">{insight.medication}</h4>
                    <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 font-medium">
                      High Risk
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Common Use:</span> {insight.commonUse}
                  </p>
                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Effect:</span> {insight.effect}
                  </p>
                  <p className="text-sm text-gray-700 mb-3">
                    <span className="font-medium">Recommendation:</span> {insight.recommendation}
                  </p>
                  {insight.alternatives && insight.alternatives.length > 0 && (
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Safer Alternatives:</span> {insight.alternatives.join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {medicationInsights.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">💊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Significant Pharmacogenomic Interactions</h3>
            <p className="text-gray-600">
              Based on available genetic data, no high-risk medication interactions were detected.
            </p>
          </div>
        )}

        {/* Common Athletic Scenarios */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            Common Athletic Scenarios
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-3">Post-Injury Pain Management</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-blue-700">Acetaminophen:</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Safe</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-700">Ibuprofen (short-term):</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Safe</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-700">Codeine:</span>
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Avoid</span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-800 mb-3">Performance Enhancement</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-purple-700">Caffeine:</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Safe</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-purple-700">Albuterol (if prescribed):</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Safe</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-purple-700">Vitamin K (with anticoagulants):</span>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Caution</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Medication Interactions */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
            Important Interactions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h5 className="font-semibold text-orange-800 mb-2">With Athletic Performance</h5>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• Caffeine may interfere with sleep medications</li>
                <li>• NSAIDs can reduce training adaptations if overused</li>
                <li>• Decongestants may cause heart rhythm issues</li>
              </ul>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <h5 className="font-semibold text-red-800 mb-2">With Other Medications</h5>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Aspirin + blood thinners = increased bleeding risk</li>
                <li>• Caffeine + stimulants = heart palpitations</li>
                <li>• Vitamin K + warfarin = reduced effectiveness</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="p-5 bg-blue-50 rounded-lg border border-blue-100">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Important Medical Disclaimer</h3>
          <p className="text-blue-700 text-sm">
            This pharmacogenomic report is for informational purposes only and should not replace
            professional medical advice. Always consult with a healthcare provider before making
            any changes to medication regimens. Genetic testing can provide valuable insights but
            is only one factor in medication response.
          </p>
        </div>
      </div>
      
    </div>
  );
};