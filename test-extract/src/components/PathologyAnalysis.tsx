import React, { useState, useEffect } from 'react';
import { BloodResults } from '../types';
import { bloodResultsService } from '../services/dataService';
import {
    HormoneAnalysisCard,
    PathologyAlerts,
    BiomarkerGrid,
    PathologyTrends,
    ClinicalRecommendations
} from './pathology';
import { PathologyChartsOverview } from './pathology/PathologyChartsOverview';

interface PathologyAnalysisProps {
   athleteId: string | number;
}

interface PathologyAlert {
   type: 'normal' | 'warning' | 'critical';
   category: string;
   test: string;
   value: number;
   unit: string;
   reference: string;
   message: string;
}

interface HormoneAnalysis {
   cortisolTestosteroneRatio: number;
   cortisolStatus: string;
   testosteroneStatus: string;
   hormonalBalance: string;
   balanceMessage: string;
   cortisol: number;
   testosterone: number;
}

export const PathologyAnalysis: React.FC<PathologyAnalysisProps> = ({ athleteId }) => {
   const [bloodResults, setBloodResults] = useState<BloodResults[]>([]);
   const [latestResults, setLatestResults] = useState<BloodResults | null>(null);
   const [alerts, setAlerts] = useState<PathologyAlert[]>([]);
   const [hormoneAnalysis, setHormoneAnalysis] = useState<HormoneAnalysis | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   useEffect(() => {
      const fetchBloodResults = async () => {
         try {
            setLoading(true);
            setError(null);
            const athleteIdStr = typeof athleteId === 'string' ? athleteId : athleteId.toString();

            const results = await bloodResultsService.getBloodResultsByAthlete(athleteIdStr);
            setBloodResults(results);

            if (results.length > 0) {
               setLatestResults(results[0]);
               const pathologyAlerts = analyzeBloodResults(results[0]);
               setAlerts(pathologyAlerts);

               // Calculate hormone analysis if data is available
               const hormoneData = calculateHormoneAnalysis(results);
               setHormoneAnalysis(hormoneData);
            }
         } catch (error) {
            console.error('Failed to fetch blood results:', error);
            setError('Failed to load pathology data. Please try again.');
         } finally {
            setLoading(false);
         }
      };

      fetchBloodResults();
   }, [athleteId]);

  const analyzeBloodResults = (results: BloodResults): PathologyAlert[] => {
     const alerts: PathologyAlert[] = [];

     // Hormone Analysis
     if (results.cortisol_nmol_l !== undefined) {
        if (results.cortisol_nmol_l > 550) {
           alerts.push({
              type: 'critical',
              category: 'Hormones',
              test: 'Cortisol',
              value: results.cortisol_nmol_l,
              unit: 'nmol/L',
              reference: '150-550',
              message: 'Elevated cortisol may indicate chronic stress or Cushing syndrome'
           });
        } else if (results.cortisol_nmol_l < 150) {
           alerts.push({
              type: 'warning',
              category: 'Hormones',
              test: 'Cortisol',
              value: results.cortisol_nmol_l,
              unit: 'nmol/L',
              reference: '150-550',
              message: 'Low cortisol may indicate adrenal insufficiency'
           });
        }
     }

     if (results.vitamin_d !== undefined) {
        if (results.vitamin_d < 30) {
           alerts.push({
              type: 'warning',
              category: 'Vitamins',
              test: 'Vitamin D',
              value: results.vitamin_d,
              unit: 'ng/mL',
              reference: '30-100',
              message: 'Vitamin D deficiency may affect bone health and immune function'
           });
        }
     }

     if (results.testosterone !== undefined) {
        if (results.testosterone < 10) {
           alerts.push({
              type: 'warning',
              category: 'Hormones',
              test: 'Testosterone',
              value: results.testosterone,
              unit: 'nmol/L',
              reference: '10-35',
              message: 'Low testosterone may affect muscle mass and energy levels'
           });
        }
     }

     // Muscle & Metabolic Analysis
     if (results.ck !== undefined) {
        if (results.ck > 200) {
           alerts.push({
              type: 'warning',
              category: 'Muscle',
              test: 'Creatine Kinase',
              value: results.ck,
              unit: 'U/L',
              reference: '30-200',
              message: 'Elevated CK may indicate muscle damage or intense exercise'
           });
        }
     }

     if (results.fasting_glucose !== undefined) {
        if (results.fasting_glucose > 100) {
           alerts.push({
              type: 'warning',
              category: 'Metabolic',
              test: 'Fasting Glucose',
              value: results.fasting_glucose,
              unit: 'mmol/L',
              reference: '3.9-5.6',
              message: 'Elevated fasting glucose may indicate impaired glucose tolerance'
           });
        }
     }

     if (results.hba1c !== undefined) {
        if (results.hba1c > 6.5) {
           alerts.push({
              type: 'critical',
              category: 'Metabolic',
              test: 'HbA1c',
              value: results.hba1c,
              unit: '%',
              reference: '<6.5',
              message: 'Elevated HbA1c indicates poor long-term glucose control'
           });
        }
     }

     // Liver Function Analysis
     if (results.s_alanine_transaminase !== undefined) {
        if (results.s_alanine_transaminase > 40) {
           alerts.push({
              type: 'warning',
              category: 'Liver',
              test: 'ALT',
              value: results.s_alanine_transaminase,
              unit: 'U/L',
              reference: '7-40',
              message: 'Elevated ALT may indicate liver stress or damage'
           });
        }
     }

     if (results.s_aspartate_transaminase !== undefined) {
        if (results.s_aspartate_transaminase > 40) {
           alerts.push({
              type: 'warning',
              category: 'Liver',
              test: 'AST',
              value: results.s_aspartate_transaminase,
              unit: 'U/L',
              reference: '10-40',
              message: 'Elevated AST may indicate liver or muscle damage'
           });
        }
     }

     // Kidney Function Analysis
     if (results.creatinine !== undefined) {
        if (results.creatinine > 110) {
           alerts.push({
              type: 'warning',
              category: 'Kidney',
              test: 'Creatinine',
              value: results.creatinine,
              unit: 'µmol/L',
              reference: '60-110',
              message: 'Elevated creatinine may indicate reduced kidney function'
           });
        }
     }

     if (results.egfr !== undefined) {
        if (results.egfr < 60) {
           alerts.push({
              type: 'critical',
              category: 'Kidney',
              test: 'eGFR',
              value: results.egfr,
              unit: 'mL/min/1.73m²',
              reference: '>60',
              message: 'Reduced eGFR indicates impaired kidney function'
           });
        }
     }

     // Inflammation Analysis
     if (results.c_reactive_protein !== undefined) {
        if (results.c_reactive_protein > 3) {
           alerts.push({
              type: 'warning',
              category: 'Inflammation',
              test: 'CRP',
              value: results.c_reactive_protein,
              unit: 'mg/L',
              reference: '<3',
              message: 'Elevated CRP indicates systemic inflammation'
           });
        }
     }

     // Complete Blood Count Analysis
     if (results.hemoglobin !== undefined) {
        if (results.hemoglobin < 13) {
           alerts.push({
              type: 'warning',
              category: 'Blood',
              test: 'Hemoglobin',
              value: results.hemoglobin,
              unit: 'g/dL',
              reference: '13-17',
              message: 'Low hemoglobin may indicate anemia'
           });
        }
     }

     if (results.leucocyte_count !== undefined) {
        if (results.leucocyte_count > 11) {
           alerts.push({
              type: 'warning',
              category: 'Blood',
              test: 'WBC',
              value: results.leucocyte_count,
              unit: '×10⁹/L',
              reference: '4-11',
              message: 'Elevated WBC may indicate infection or inflammation'
           });
        } else if (results.leucocyte_count < 4) {
           alerts.push({
              type: 'warning',
              category: 'Blood',
              test: 'WBC',
              value: results.leucocyte_count,
              unit: '×10⁹/L',
              reference: '4-11',
              message: 'Low WBC may indicate immunosuppression'
           });
        }
     }

     if (results.platelets !== undefined) {
        if (results.platelets < 150) {
           alerts.push({
              type: 'warning',
              category: 'Blood',
              test: 'Platelets',
              value: results.platelets,
              unit: '×10⁹/L',
              reference: '150-400',
              message: 'Low platelet count may increase bleeding risk'
           });
        }
     }

     return alerts;
  };

  const calculateHormoneAnalysis = (results: BloodResults[]): HormoneAnalysis | null => {
     if (results.length === 0) return null;

     const latest = results[0];
     const cortisol = latest.cortisol_nmol_l;
     const testosterone = latest.testosterone;

     if (!cortisol || !testosterone) return null;

     const cortisolTestosteroneRatio = cortisol / testosterone;
     const cortisolStatus = cortisol > 550 ? 'high' : cortisol < 150 ? 'low' : 'normal';
     const testosteroneStatus = testosterone < 10 ? 'low' : testosterone > 35 ? 'high' : 'normal';

     // Determine overall hormonal balance
     let hormonalBalance = 'balanced';
     let balanceMessage = 'Hormonal balance appears optimal for athletic performance';

     if (cortisolTestosteroneRatio > 0.05) {
        hormonalBalance = 'catabolic';
        balanceMessage = 'High cortisol relative to testosterone may indicate overtraining or chronic stress';
     } else if (cortisolTestosteroneRatio < 0.01) {
        hormonalBalance = 'anabolic';
        balanceMessage = 'Low cortisol relative to testosterone suggests good recovery and adaptation';
     }

     return {
        cortisolTestosteroneRatio,
        cortisolStatus,
        testosteroneStatus,
        hormonalBalance,
        balanceMessage,
        cortisol,
        testosterone
     };
  };

  if (loading) {
     return (
        <div className="flex items-center justify-center py-12">
           <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading pathology data...</p>
           </div>
        </div>
     );
  }

  if (error) {
     return (
        <div className="text-center py-12 card-enhanced rounded-xl">
           <div className="text-4xl mb-3">⚠️</div>
           <p className="text-red-400 font-medium">Error loading pathology data</p>
           <p className="text-sm text-gray-500 mt-2">{error}</p>
        </div>
     );
  }

  if (!latestResults) {
     return (
        <div className="text-center py-12 card-enhanced rounded-xl">
           <div className="text-4xl mb-3">🩸</div>
           <p className="text-gray-700 font-medium">No blood results available</p>
           <p className="text-sm text-gray-500 mt-2">
              Blood test results will appear here once uploaded.
           </p>
        </div>
     );
  }

  return (
     <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="relative overflow-hidden">
           {/* Background Pattern */}
           <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/10 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-pink-500/10 to-transparent"></div>
           </div>

           <div className="relative z-10 p-6 space-y-8">
              {/* Header */}
              <div className="text-center mb-8">
                 <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-red-500 to-pink-500 rounded-full mb-4 shadow-lg animate-pulse">
                    <span className="text-3xl">🩸</span>
                 </div>
                 <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-red-200 to-pink-200 bg-clip-text text-transparent mb-2">
                    Pathology Analysis
                 </h1>
                 <p className="text-gray-400 text-lg">
                    Latest Results: <span className="text-white font-medium">{latestResults.date || 'Recent'}</span>
                 </p>
              </div>

              {/* Hormone Analysis */}
              {hormoneAnalysis && (
                 <div className="transform hover:scale-[1.02] transition-all duration-300">
                    <HormoneAnalysisCard hormoneAnalysis={hormoneAnalysis} />
                 </div>
              )}

              {/* Interactive Charts Overview */}
              {bloodResults.length >= 1 && (
                 <div className="transform hover:scale-[1.01] transition-all duration-300">
                    <PathologyChartsOverview bloodResults={bloodResults} />
                 </div>
              )}

              {/* Pathology Trends */}
              {bloodResults.length >= 1 && (
                 <div className="transform hover:scale-[1.01] transition-all duration-300">
                    <PathologyTrends bloodResults={bloodResults} />
                 </div>
              )}

              {/* Health Alerts */}
              {alerts.length > 0 && (
                 <div className="transform hover:scale-[1.01] transition-all duration-300">
                    <PathologyAlerts alerts={alerts} />
                 </div>
              )}

              {/* Biomarker Grid */}
              <div className="transform hover:scale-[1.01] transition-all duration-300">
                 <BiomarkerGrid latestResults={latestResults} />
              </div>

              {/* Clinical Recommendations */}
              <div className="transform hover:scale-[1.01] transition-all duration-300">
                 <ClinicalRecommendations alerts={alerts} hormoneAnalysis={hormoneAnalysis} />
              </div>
           </div>
        </div>
     </div>
  );
};