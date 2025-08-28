import React from 'react';

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

interface ClinicalRecommendationsProps {
   alerts: PathologyAlert[];
   hormoneAnalysis: HormoneAnalysis | null;
}

export const ClinicalRecommendations: React.FC<ClinicalRecommendationsProps> = ({
   alerts,
   hormoneAnalysis
}) => {
   const criticalAlerts = alerts.filter(a => a.type === 'critical');
   const warningAlerts = alerts.filter(a => a.type === 'warning');

   const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
      switch (priority) {
         case 'high': return 'from-red-500/20 to-red-600/20 border-red-500/30';
         case 'medium': return 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30';
         default: return 'from-blue-500/20 to-blue-600/20 border-blue-500/30';
      }
   };

   const getPriorityIcon = (priority: 'high' | 'medium' | 'low') => {
      switch (priority) {
         case 'high': return '🚨';
         case 'medium': return '⚡';
         default: return '📋';
      }
   };

   const recommendations = [
      // Critical recommendations
      ...(criticalAlerts.length > 0 ? [{
         priority: 'high' as const,
         title: 'Immediate Medical Consultation',
         description: 'Critical biomarker abnormalities detected requiring immediate physician consultation',
         actions: [
            'Schedule urgent appointment with sports medicine physician',
            'Prepare detailed training history and symptoms',
            'Bring all recent blood work results',
            'Discuss potential training modifications'
         ],
         icon: '🏥'
      }] : []),

      // Hormonal recommendations
      ...(hormoneAnalysis && hormoneAnalysis.hormonalBalance === 'catabolic' ? [{
         priority: 'high' as const,
         title: 'Hormonal Recovery Protocol',
         description: 'High cortisol relative to testosterone indicates overtraining or chronic stress',
         actions: [
            'Implement immediate stress management techniques',
            'Reduce training intensity and volume by 40-60%',
            'Prioritize 8-9 hours of quality sleep nightly',
            'Consider magnesium supplementation (400-600mg daily)',
            'Practice daily meditation or deep breathing exercises'
         ],
         icon: '🧘'
      }] : []),

      // Metabolic recommendations
      ...(warningAlerts.some(a => a.category === 'Metabolic') ? [{
         priority: 'medium' as const,
         title: 'Metabolic Optimization',
         description: 'Metabolic markers indicate need for dietary and training adjustments',
         actions: [
            'Review carbohydrate intake timing and quality',
            'Optimize pre- and post-workout nutrition',
            'Monitor blood glucose response to training',
            'Consider working with sports dietitian',
            'Track energy levels and recovery quality'
         ],
         icon: '🥗'
      }] : []),

      // Inflammation recommendations
      ...(warningAlerts.some(a => a.category === 'Inflammation') ? [{
         priority: 'medium' as const,
         title: 'Inflammation Management',
         description: 'Elevated inflammatory markers suggest need for recovery focus',
         actions: [
            'Assess and optimize training load distribution',
            'Implement active recovery protocols',
            'Consider anti-inflammatory nutrition strategies',
            'Monitor sleep quality and duration',
            'Evaluate for overtraining syndrome'
         ],
         icon: '🔥'
      }] : []),

      // Blood count recommendations
      ...(warningAlerts.some(a => a.category === 'Blood') ? [{
         priority: 'medium' as const,
         title: 'Hematological Monitoring',
         description: 'Blood count abnormalities require close monitoring',
         actions: [
            'Monitor for signs of fatigue or reduced performance',
            'Track energy levels and exercise tolerance',
            'Ensure adequate iron intake if anemic',
            'Consider complete blood count recheck in 2-4 weeks',
            'Monitor for infection signs or unusual bleeding'
         ],
         icon: '🩸'
      }] : []),

      // Liver function recommendations
      ...(warningAlerts.some(a => a.category === 'Liver') ? [{
         priority: 'medium' as const,
         title: 'Hepatic Function Support',
         description: 'Liver enzyme elevations suggest need for organ support',
         actions: [
            'Evaluate potential hepatotoxic supplements',
            'Optimize hydration and toxin elimination',
            'Consider milk thistle or NAC supplementation',
            'Monitor alcohol intake and timing',
            'Reassess liver function in 4-6 weeks'
         ],
         icon: '🫘'
      }] : []),

      // Kidney function recommendations
      ...(warningAlerts.some(a => a.category === 'Kidney') ? [{
         priority: 'medium' as const,
         title: 'Renal Function Monitoring',
         description: 'Kidney markers indicate need for hydration and function monitoring',
         actions: [
            'Optimize hydration protocols during training',
            'Monitor urine color and volume',
            'Consider electrolyte supplementation if needed',
            'Track blood pressure regularly',
            'Reevaluate kidney function in 4-6 weeks'
         ],
         icon: '🫑'
      }] : [])
   ];

   return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm border border-gray-700/50 shadow-2xl">
         {/* Decorative background elements */}
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500"></div>
         <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-green-500/10 to-transparent rounded-full"></div>
         <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full"></div>

         <div className="relative z-10 p-8">
            <div className="flex items-center gap-3 mb-8">
               <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">💡</span>
               </div>
               <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent">
                     Clinical Recommendations
                  </h3>
                  <p className="text-gray-400 text-sm">Personalized action plan based on your results</p>
               </div>
            </div>

            {/* Priority-based recommendations */}
            <div className="space-y-6 mb-8">
               {recommendations.map((rec, index) => (
                  <div key={index} className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${getPriorityColor(rec.priority)} border hover:border-opacity-60 transition-all duration-300`}>
                     <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                     <div className="relative p-6">
                        <div className="flex items-start gap-4">
                           <div className="w-12 h-12 bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-xl">{rec.icon}</span>
                           </div>
                           <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                 <h4 className="text-lg font-bold text-white">{rec.title}</h4>
                                 <div className="flex items-center gap-2">
                                    <span className="text-sm">{getPriorityIcon(rec.priority)}</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                       rec.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                                       rec.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                                       'bg-blue-500/20 text-blue-300'
                                    }`}>
                                       {rec.priority.toUpperCase()}
                                    </span>
                                 </div>
                              </div>
                              <p className="text-gray-300 mb-4 leading-relaxed">{rec.description}</p>

                              <div className="space-y-2">
                                 <h5 className="font-medium text-white mb-3">Recommended Actions:</h5>
                                 <ul className="space-y-2">
                                    {rec.actions.map((action, actionIndex) => (
                                       <li key={actionIndex} className="flex items-start gap-3">
                                          <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                                          <span className="text-gray-300 text-sm leading-relaxed">{action}</span>
                                       </li>
                                    ))}
                                 </ul>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               ))}
            </div>

            {/* Standard monitoring recommendations */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700/50">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
               <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                     <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-lg">📋</span>
                     </div>
                     <h4 className="text-lg font-bold text-white">Standard Monitoring Protocol</h4>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                     <div className="space-y-4">
                        <h5 className="font-medium text-blue-300 mb-3">Follow-up Schedule:</h5>
                        <ul className="space-y-3">
                           <li className="flex items-start gap-3">
                              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                              <span className="text-gray-300 text-sm">Blood retest in 4-6 weeks</span>
                           </li>
                           <li className="flex items-start gap-3">
                              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                              <span className="text-gray-300 text-sm">Daily symptom tracking</span>
                           </li>
                           <li className="flex items-start gap-3">
                              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                              <span className="text-gray-300 text-sm">Weekly performance metrics</span>
                           </li>
                           <li className="flex items-start gap-3">
                              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                              <span className="text-gray-300 text-sm">Monthly comprehensive review</span>
                           </li>
                        </ul>
                     </div>

                     <div className="space-y-4">
                        <h5 className="font-medium text-purple-300 mb-3">Daily Monitoring:</h5>
                        <ul className="space-y-3">
                           <li className="flex items-start gap-3">
                              <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                              <span className="text-gray-300 text-sm">Energy levels and fatigue</span>
                           </li>
                           <li className="flex items-start gap-3">
                              <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                              <span className="text-gray-300 text-sm">Sleep quality and duration</span>
                           </li>
                           <li className="flex items-start gap-3">
                              <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                              <span className="text-gray-300 text-sm">Hydration and electrolyte balance</span>
                           </li>
                           <li className="flex items-start gap-3">
                              <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                              <span className="text-gray-300 text-sm">Training response and recovery</span>
                           </li>
                        </ul>
                     </div>
                  </div>
               </div>
            </div>

            {/* Professional disclaimer */}
            <div className="mt-6 relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500"></div>
               <div className="p-6">
                  <div className="flex items-start gap-3">
                     <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                        <span className="text-lg">⚕️</span>
                     </div>
                     <div>
                        <h5 className="font-bold text-amber-300 mb-2">Medical Disclaimer</h5>
                        <div className="text-sm text-gray-300 space-y-1">
                           <p>• All recommendations should be reviewed by a qualified sports medicine physician</p>
                           <p>• Consider athlete's training phase, competition schedule, and individual response patterns</p>
                           <p>• Monitor for adverse reactions to any recommended interventions</p>
                           <p>• Regular reassessment is essential for optimal athlete care and performance</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};