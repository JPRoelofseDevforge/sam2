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
  trainingDays: string;
  nonTrainingDays: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  wadaStatus: 'compliant' | 'restricted' | 'banned';
  wadaNotes: string;
  avoidIf: string[];
  confidence_score?: number;
  risk_level?: 'low' | 'medium' | 'high';
  genetic_mark_id?: string;
}

interface WADARestriction {
  substance: string;
  status: 'compliant' | 'restricted' | 'banned';
  notes: string;
  bannedInCompetition: boolean;
  bannedOutOfCompetition: boolean;
}

export const Supplements: React.FC<{ athleteId: string }> = ({ athleteId }) => {
  const [geneticMarks, setGeneticMarks] = useState<any[]>([]);
  const [geneticProfiles, setGeneticProfiles] = useState<GeneticProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [athleteName, setAthleteName] = useState<string>('');

  // WADA compliance database
  const wadaRestrictions: WADARestriction[] = [
    { substance: 'Anabolic steroids', status: 'banned', notes: 'All anabolic steroids are banned in and out of competition', bannedInCompetition: true, bannedOutOfCompetition: true },
    { substance: 'Beta-2 agonists', status: 'restricted', notes: 'Only salbutamol, formoterol, salmeterol, and vilanterol permitted with TUE', bannedInCompetition: true, bannedOutOfCompetition: false },
    { substance: 'Masking agents', status: 'banned', notes: 'All masking agents are prohibited', bannedInCompetition: true, bannedOutOfCompetition: true },
    { substance: 'Diuretics', status: 'banned', notes: 'Masking agents - banned in and out of competition', bannedInCompetition: true, bannedOutOfCompetition: true },
    { substance: 'Blood doping', status: 'banned', notes: 'EPO, darbepoetin, blood transfusions - strictly banned', bannedInCompetition: true, bannedOutOfCompetition: true },
    { substance: 'Stimulants', status: 'banned', notes: 'Most stimulants banned, some permitted with TUE', bannedInCompetition: true, bannedOutOfCompetition: false },
    { substance: 'Hormone modulators', status: 'banned', notes: 'Growth hormone, IGF-1, etc. - banned', bannedInCompetition: true, bannedOutOfCompetition: true },
    { substance: 'Creatine', status: 'compliant', notes: 'Permitted supplement, not banned', bannedInCompetition: false, bannedOutOfCompetition: false },
    { substance: 'Caffeine', status: 'compliant', notes: 'Permitted up to 12μg/ml in urine', bannedInCompetition: false, bannedOutOfCompetition: false },
    { substance: 'Beta-alanine', status: 'compliant', notes: 'Permitted supplement', bannedInCompetition: false, bannedOutOfCompetition: false },
    { substance: 'Glutamine', status: 'compliant', notes: 'Permitted supplement', bannedInCompetition: false, bannedOutOfCompetition: false },
    { substance: 'BCAAs', status: 'compliant', notes: 'Permitted supplement', bannedInCompetition: false, bannedOutOfCompetition: false },
    { substance: 'Omega-3', status: 'compliant', notes: 'Permitted supplement', bannedInCompetition: false, bannedOutOfCompetition: false },
    { substance: 'Vitamin D', status: 'compliant', notes: 'Permitted supplement', bannedInCompetition: false, bannedOutOfCompetition: false },
    { substance: 'Magnesium', status: 'compliant', notes: 'Permitted supplement', bannedInCompetition: false, bannedOutOfCompetition: false },
    { substance: 'Zinc', status: 'compliant', notes: 'Permitted supplement', bannedInCompetition: false, bannedOutOfCompetition: false },
    { substance: 'Iron', status: 'compliant', notes: 'Permitted supplement', bannedInCompetition: false, bannedOutOfCompetition: false },
    { substance: 'Probiotics', status: 'compliant', notes: 'Permitted supplement', bannedInCompetition: false, bannedOutOfCompetition: false },
    { substance: 'Collagen', status: 'compliant', notes: 'Permitted supplement', bannedInCompetition: false, bannedOutOfCompetition: false },
    { substance: 'Curcumin', status: 'compliant', notes: 'Permitted supplement', bannedInCompetition: false, bannedOutOfCompetition: false },
    { substance: 'Quercetin', status: 'compliant', notes: 'Permitted supplement', bannedInCompetition: false, bannedOutOfCompetition: false },
    { substance: 'Resveratrol', status: 'compliant', notes: 'Permitted supplement', bannedInCompetition: false, bannedOutOfCompetition: false },
    { substance: 'Coenzyme Q10', status: 'compliant', notes: 'Permitted supplement', bannedInCompetition: false, bannedOutOfCompetition: false },
    { substance: 'L-citrulline', status: 'compliant', notes: 'Permitted supplement', bannedInCompetition: false, bannedOutOfCompetition: false },
    { substance: 'Beetroot extract', status: 'compliant', notes: 'Permitted supplement', bannedInCompetition: false, bannedOutOfCompetition: false },
    { substance: 'Green tea extract', status: 'compliant', notes: 'Permitted supplement', bannedInCompetition: false, bannedOutOfCompetition: false },
    { substance: 'Methylated folate', status: 'compliant', notes: 'Permitted supplement', bannedInCompetition: false, bannedOutOfCompetition: false },
    { substance: 'Methylcobalamin B12', status: 'compliant', notes: 'Permitted supplement', bannedInCompetition: false, bannedOutOfCompetition: false },
    { substance: 'Methylmalonic acid', status: 'compliant', notes: 'Permitted supplement', bannedInCompetition: false, bannedOutOfCompetition: false },
  ];

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

        // Fetch genetic marks from controllers (supplements data)
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

  // Get supplement recommendations for the athlete
  const supplementRecommendations = useMemo<SupplementRecommendation[]>(() => {
    const recommendations: SupplementRecommendation[] = [];

    // Use genetic marks from controllers if available
    if (geneticMarks.length > 0) {
      geneticMarks.forEach((mark, index) => {
        // Only create recommendations for marks that have supplement information
        if (mark.supplement && mark.gene) {
          const wadaInfo = wadaRestrictions.find(w => w.substance.toLowerCase().includes(mark.supplement.toLowerCase())) ||
                          { status: 'compliant', notes: 'No specific WADA restrictions identified', bannedInCompetition: false, bannedOutOfCompetition: false };

          recommendations.push({
            supplement: mark.supplement,
            gene: mark.gene,
            genotype: mark.genetic_call || mark.known_call || 'Unknown',
            rationale: mark.interpretation_code || 'Genetic-based recommendation',
            dosage: mark.dosage || 'Dosage not specified',
            timing: mark.timing || 'Timing not specified',
            trainingDays: 'Standard dosage',
            nonTrainingDays: 'Reduced dosage or skip',
            priority: (mark.priority || mark.summary_flag || 'medium').toLowerCase() as 'low' | 'medium' | 'high',
            category: mark.category || 'General',
            wadaStatus: wadaInfo.status,
            wadaNotes: wadaInfo.notes,
            avoidIf: [],
            confidence_score: mark.confidence_score,
            risk_level: mark.risk_level,
            genetic_mark_id: `mark_${index}`
          });
        }
      });
    }

    // Fallback to legacy genetic profiles with enhanced supplement database
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
                rationale: 'Reduced enzyme activity affects folate metabolism and homocysteine levels',
                dosage: '400-800 mcg daily',
                timing: 'With breakfast for better absorption',
                trainingDays: 'Standard dosage',
                nonTrainingDays: 'Standard dosage',
                priority: profile.genotype === 'TT' ? 'high' : 'medium',
                category: 'Methylation Support',
                wadaStatus: 'compliant',
                wadaNotes: 'Permitted supplement, no WADA restrictions',
                avoidIf: ['Pregnancy without medical supervision'],
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
                rationale: 'Reduced vitamin D receptor sensitivity affects calcium metabolism and immune function',
                dosage: '2000-4000 IU daily (with blood testing)',
                timing: 'With fat-containing meal for better absorption',
                trainingDays: 'Standard dosage',
                nonTrainingDays: 'Standard dosage',
                priority: 'high',
                category: 'Vitamin Metabolism',
                wadaStatus: 'compliant',
                wadaNotes: 'Permitted supplement, no WADA restrictions',
                avoidIf: ['Hypercalcemia', 'Kidney stones'],
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
                trainingDays: 'Standard dosage',
                nonTrainingDays: 'Standard dosage',
                priority: 'medium',
                category: 'Metabolism',
                wadaStatus: 'compliant',
                wadaNotes: 'Permitted supplement, no WADA restrictions',
                avoidIf: ['Iron deficiency', 'Excessive caffeine sensitivity'],
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
                rationale: 'Reduced power/strength potential, creatine can help maintain ATP stores',
                dosage: '3-5g daily',
                timing: 'Post-workout with carbohydrates',
                trainingDays: 'Standard dosage',
                nonTrainingDays: '2-3g daily or skip',
                priority: 'medium',
                category: 'Performance',
                wadaStatus: 'compliant',
                wadaNotes: 'Permitted supplement, no WADA restrictions',
                avoidIf: ['Kidney disease', 'Dehydration'],
                confidence_score: 0.80,
                risk_level: 'medium'
              });
            } else if (profile.genotype === 'RR') {
              recommendations.push({
                supplement: 'Beta-Alanine',
                gene: profile.gene,
                genotype: profile.genotype,
                rationale: 'Enhanced power capacity, buffering support for high-intensity efforts',
                dosage: '3-5g daily (divided doses)',
                timing: 'Pre-workout',
                trainingDays: 'Standard dosage',
                nonTrainingDays: '2-3g daily',
                priority: 'medium',
                category: 'Performance',
                wadaStatus: 'compliant',
                wadaNotes: 'Permitted supplement, no WADA restrictions',
                avoidIf: ['Paresthesia sensitivity'],
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
                trainingDays: 'Standard dosage',
                nonTrainingDays: 'Standard dosage',
                priority: 'medium',
                category: 'Mitochondrial Function',
                wadaStatus: 'compliant',
                wadaNotes: 'Permitted supplement, no WADA restrictions',
                avoidIf: ['Blood thinning medications'],
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
                trainingDays: 'Standard dosage',
                nonTrainingDays: 'Standard dosage',
                priority: 'medium',
                category: 'Mitochondrial Function',
                wadaStatus: 'compliant',
                wadaNotes: 'Permitted supplement, no WADA restrictions',
                avoidIf: ['Blood thinning medications'],
                confidence_score: 0.75,
                risk_level: 'low'
              });
            }
            break;

          case 'ADRB2':
            if (profile.genotype === 'Gly16Gly') {
              recommendations.push({
                supplement: 'Caffeine',
                gene: profile.gene,
                genotype: profile.genotype,
                rationale: 'Reduced fat mobilization, strategic caffeine use for performance',
                dosage: '100-200mg (lower than typical doses)',
                timing: 'Pre-workout (avoid late in day)',
                trainingDays: 'Standard dosage',
                nonTrainingDays: 'Skip or minimal dose',
                priority: 'medium',
                category: 'Metabolism',
                wadaStatus: 'compliant',
                wadaNotes: 'Permitted up to 12μg/ml in urine',
                avoidIf: ['Heart conditions', 'Anxiety disorders'],
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
                rationale: 'Enhanced nitric oxide production support for circulation',
                dosage: '6-8g daily',
                timing: '30 minutes before exercise',
                trainingDays: 'Standard dosage',
                nonTrainingDays: '3-4g daily',
                priority: 'medium',
                category: 'Cardiovascular',
                wadaStatus: 'compliant',
                wadaNotes: 'Permitted supplement, no WADA restrictions',
                avoidIf: ['Low blood pressure', 'Herpes virus'],
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
          <h2 className="text-2xl font-bold text-gray-900">Supplements Report</h2>
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
          <h2 className="text-2xl font-bold text-gray-900">Supplements Report</h2>
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

  // Organize supplements by WADA status
  const compliantSupplements = supplementRecommendations.filter(s => s.wadaStatus === 'compliant');
  const restrictedSupplements = supplementRecommendations.filter(s => s.wadaStatus === 'restricted');
  const bannedSupplements = supplementRecommendations.filter(s => s.wadaStatus === 'banned');

  return (
    <div className="space-y-6">
      <div className="card-enhanced p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Supplements Guide</h2>
            <p className="text-gray-600 mt-1">
              WADA-compliant supplement recommendations for {athleteName}
            </p>
            <div className="flex items-center gap-4 mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {compliantSupplements.length} WADA Compliant
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {restrictedSupplements.length} Restricted
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {bannedSupplements.length} Banned
              </span>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-1"
            title="Refresh supplement data"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* WADA Compliant Supplements */}
        {compliantSupplements.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              WADA Compliant Supplements ({compliantSupplements.length})
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {compliantSupplements.map((rec, index) => (
                <div key={rec.genetic_mark_id || index} className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900">{rec.supplement}</h4>
                    <div className="flex gap-1">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                        rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {rec.priority} priority
                      </span>
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 font-medium">
                        WADA ✓
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Gene:</span> {rec.gene} ({rec.genotype})
                  </p>
                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Rationale:</span> {rec.rationale}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                    <div>
                      <span className="font-medium text-gray-900">Dosage:</span>
                      <p className="text-gray-700">{rec.dosage}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Timing:</span>
                      <p className="text-gray-700">{rec.timing}</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Training Days:</span> {rec.trainingDays}
                  </div>
                  <div className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Non-Training Days:</span> {rec.nonTrainingDays}
                  </div>
                  {rec.avoidIf.length > 0 && (
                    <div className="text-sm text-red-700">
                      <span className="font-medium">Avoid if:</span> {rec.avoidIf.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Restricted Supplements */}
        {restrictedSupplements.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center">
              <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
              Restricted Supplements ({restrictedSupplements.length})
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {restrictedSupplements.map((rec, index) => (
                <div key={rec.genetic_mark_id || index} className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900">{rec.supplement}</h4>
                    <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 font-medium">
                      WADA Restricted
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Gene:</span> {rec.gene} ({rec.genotype})
                  </p>
                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Rationale:</span> {rec.rationale}
                  </p>
                  <p className="text-sm text-yellow-800 mb-2">
                    <span className="font-medium">WADA Notes:</span> {rec.wadaNotes}
                  </p>
                  <div className="text-sm text-red-700">
                    <span className="font-medium">⚠️ Requires Therapeutic Use Exemption (TUE)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Banned Supplements */}
        {bannedSupplements.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
              <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
              Banned Supplements ({bannedSupplements.length})
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {bannedSupplements.map((rec, index) => (
                <div key={rec.genetic_mark_id || index} className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900">{rec.supplement}</h4>
                    <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 font-medium">
                      WADA Banned
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Gene:</span> {rec.gene} ({rec.genotype})
                  </p>
                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Rationale:</span> {rec.rationale}
                  </p>
                  <p className="text-sm text-red-800 mb-2">
                    <span className="font-medium">WADA Status:</span> {rec.wadaNotes}
                  </p>
                  <div className="text-sm text-red-700 font-medium">
                    🚫 DO NOT USE - Violation of anti-doping rules
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {supplementRecommendations.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">💊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Specific Genetic-Based Supplement Recommendations</h3>
            <p className="text-gray-600">
              Based on available genetic data, no specific supplement recommendations were identified.
              Consider general WADA-compliant supplements for athletic performance.
            </p>
          </div>
        )}

        {/* WADA Compliance Information */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            WADA Compliance Guidelines
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-3">Permitted Supplements</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Vitamins and minerals within RDA</li>
                <li>• Caffeine (up to 12μg/ml in urine)</li>
                <li>• Creatine monohydrate</li>
                <li>• Beta-alanine</li>
                <li>• Amino acids (BCAAs, glutamine)</li>
                <li>• Plant extracts (curcumin, quercetin)</li>
                <li>• Omega-3 fatty acids</li>
              </ul>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <h4 className="font-semibold text-red-800 mb-3">Strictly Prohibited</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Anabolic steroids</li>
                <li>• Masking agents</li>
                <li>• Blood doping substances</li>
                <li>• Beta-2 agonists (without TUE)</li>
                <li>• Diuretics and masking agents</li>
                <li>• Gene doping</li>
                <li>• Hormonal modulators</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Implementation Notes */}
        <div className="p-5 bg-blue-50 rounded-lg border border-blue-100">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Implementation Guidelines</h3>
          <ul className="text-blue-700 text-sm list-disc pl-5 space-y-1">
            <li>Start with high-priority supplements and monitor response for 4-6 weeks</li>
            <li>Introduce one supplement at a time to assess individual effects and tolerance</li>
            <li>Combine with regular blood testing to optimize dosages and monitor safety</li>
            <li>Adjust dosages based on training intensity and recovery needs</li>
            <li>Always check for interactions with medications or other supplements</li>
            <li>Store supplements properly and check expiration dates</li>
            <li>Choose third-party tested supplements from reputable manufacturers</li>
            <li>Consult with a sports dietitian or physician before starting new regimens</li>
          </ul>
        </div>
      </div>

      {/* Training vs Non-Training Day Protocol */}
      <div className="card-enhanced p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Training vs Non-Training Day Protocol</h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Training Days (High Intensity)
              </h4>
              <div className="space-y-2 text-sm text-green-700">
                <div className="flex justify-between">
                  <span>Pre-workout:</span>
                  <span>Caffeine, beta-alanine, citrulline</span>
                </div>
                <div className="flex justify-between">
                  <span>Intra-workout:</span>
                  <span>BCAAs, electrolytes</span>
                </div>
                <div className="flex justify-between">
                  <span>Post-workout:</span>
                  <span>Creatine, protein, carbs</span>
                </div>
                <div className="flex justify-between">
                  <span>Recovery:</span>
                  <span>Magnesium, zinc, omega-3</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Non-Training Days (Recovery)
              </h4>
              <div className="space-y-2 text-sm text-blue-700">
                <div className="flex justify-between">
                  <span>Morning:</span>
                  <span>Vitamin D, methylated folate</span>
                </div>
                <div className="flex justify-between">
                  <span>Midday:</span>
                  <span>Reduced caffeine, green tea extract</span>
                </div>
                <div className="flex justify-between">
                  <span>Evening:</span>
                  <span>Magnesium, resveratrol</span>
                </div>
                <div className="flex justify-between">
                  <span>Maintenance:</span>
                  <span>Omega-3, CoQ10, probiotics</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h5 className="font-semibold text-yellow-800 mb-2">Important Notes</h5>
          <ul className="text-yellow-700 text-sm space-y-1">
            <li>• Adjust dosages based on body weight, training volume, and individual tolerance</li>
            <li>• Monitor for side effects and discontinue if adverse reactions occur</li>
            <li>• Stay hydrated, especially when using creatine or caffeine</li>
            <li>• Cycle supplements periodically to prevent tolerance and assess continued benefits</li>
            <li>• Regular blood work helps optimize supplementation and prevents deficiencies</li>
          </ul>
        </div>
      </div>
    </div>
  );
};