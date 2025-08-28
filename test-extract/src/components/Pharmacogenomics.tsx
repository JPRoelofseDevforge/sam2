import React, { useMemo } from 'react';
import { geneticProfiles, athletes } from '../data/mockData';

interface MedicationInsight {
  medication: string;
  gene: string;
  genotype: string;
  effect: string;
  recommendation: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export const Pharmacogenomics: React.FC<{ athleteId: string }> = ({ athleteId }) => {
  // Get pharmacogenomics insights for the athlete
  const medicationInsights = useMemo<MedicationInsight[]>(() => {
    const athleteGenetics = geneticProfiles.filter(g => g.athlete_id === athleteId);
    const insights: MedicationInsight[] = [];
    
    // Common sports medicine medications and their genetic interactions
    athleteGenetics.forEach(profile => {
      switch(profile.gene) {
        case 'CYP2D6':
          if (profile.genotype.includes('Poor')) {
            insights.push({
              medication: 'Codeine',
              gene: profile.gene,
              genotype: profile.genotype,
              effect: 'Poor metabolism - may be ineffective',
              recommendation: 'Avoid codeine, consider alternative pain relief',
              riskLevel: 'high'
            });
          } else if (profile.genotype.includes('Ultra')) {
            insights.push({
              medication: 'Codeine',
              gene: profile.gene,
              genotype: profile.genotype,
              effect: 'Ultra-rapid metabolism - risk of toxicity',
              recommendation: 'Avoid codeine, risk of overdose',
              riskLevel: 'high'
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
              riskLevel: 'medium'
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
              riskLevel: 'medium'
            });
          } else if (profile.genotype === 'CT' || profile.genotype === 'TT') {
            insights.push({
              medication: 'Atorvastatin',
              gene: profile.gene,
              genotype: profile.genotype,
              effect: 'Significantly increased risk of myopathy',
              recommendation: 'Avoid statins or use very low doses with monitoring',
              riskLevel: 'high'
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
            riskLevel: profile.genotype === 'AA' ? 'medium' : profile.genotype === 'GG' ? 'high' : 'low'
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
              riskLevel: 'low'
            });
          }
          break;
      }
    });
    
    return insights;
  }, [athleteId]);

  // Get athlete name
  const athlete = athletes.find(a => a.athlete_id === athleteId);
  
  return (
    <div className="space-y-6">
      <div className="card-enhanced p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pharmacogenomics Report</h2>
        <p className="text-gray-600 mb-6">
          Medication response based on {athlete?.name}'s genetics
        </p>
        
        {medicationInsights.length > 0 ? (
          <div className="space-y-4">
            {medicationInsights.map((insight, index) => (
              <div 
                key={index} 
                className={`p-5 rounded-lg border-l-4 ${
                  insight.riskLevel === 'high' 
                    ? 'border-red-500 bg-red-50' 
                    : insight.riskLevel === 'medium' 
                      ? 'border-yellow-500 bg-yellow-50' 
                      : 'border-green-500 bg-green-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{insight.medication}</h3>
                    <div className="mt-1 flex items-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {insight.gene} • {insight.genotype}
                      </span>
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        insight.riskLevel === 'high' 
                          ? 'bg-red-100 text-red-800' 
                          : insight.riskLevel === 'medium' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-green-100 text-green-800'
                      }`}>
                        {insight.riskLevel.charAt(0).toUpperCase() + insight.riskLevel.slice(1)} Risk
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Effect:</span> {insight.effect}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    <span className="font-medium">Recommendation:</span> {insight.recommendation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">💊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Significant Pharmacogenomic Interactions</h3>
            <p className="text-gray-600">
              Based on available genetic data, no high-risk medication interactions were detected.
            </p>
          </div>
        )}
        
        <div className="mt-8 p-5 bg-blue-50 rounded-lg border border-blue-100">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Important Note</h3>
          <p className="text-blue-700 text-sm">
            This pharmacogenomic report is for informational purposes only and should not replace 
            professional medical advice. Always consult with a healthcare provider before making 
            any changes to medication regimens. Genetic testing can provide valuable insights but 
            is only one factor in medication response.
          </p>
        </div>
      </div>
      
      {/* Genetic Profile Summary */}
      <div className="card-enhanced p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Genetic Profile Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {geneticProfiles
            .filter(g => g.athlete_id === athleteId)
            .map((profile, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">{profile.gene}</div>
                <div className="text-sm text-gray-600 mt-1">Genotype: {profile.genotype}</div>
                <div className="mt-2 text-xs text-gray-500">
                  {profile.gene === 'CYP2D6' && 'Drug metabolism enzyme'}
                  {profile.gene === 'CYP2C19' && 'Proton pump inhibitor metabolism'}
                  {profile.gene === 'SLCO1B1' && 'Statin transporter'}
                  {profile.gene === 'VKORC1' && 'Warfarin sensitivity'}
                  {profile.gene === 'CFTR' && 'Cystic fibrosis transmembrane conductance'}
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
};