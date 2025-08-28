import React from 'react';
import { BloodResults } from '../../types';

interface BiomarkerGridProps {
  latestResults: BloodResults;
}

export const BiomarkerGrid: React.FC<BiomarkerGridProps> = ({ latestResults }) => {
  const biomarkerSections = [
    {
      title: 'Hormones',
      icon: '🧪',
      gradient: 'from-blue-500/20 to-purple-500/20',
      borderColor: 'border-blue-500/30',
      textColor: 'text-blue-300',
      items: [
        { key: 'cortisol_nmol_l', label: 'Cortisol', unit: 'nmol/L', ref: '150-550' },
        { key: 'testosterone', label: 'Testosterone', unit: 'nmol/L', ref: '10-35' },
        { key: 'vitamin_d', label: 'Vitamin D', unit: 'ng/mL', ref: '30-100' }
      ]
    },
    {
      title: 'Metabolic',
      icon: '⚡',
      gradient: 'from-green-500/20 to-emerald-500/20',
      borderColor: 'border-green-500/30',
      textColor: 'text-green-300',
      items: [
        { key: 'fasting_glucose', label: 'Glucose', unit: 'mmol/L', ref: '3.9-5.6' },
        { key: 'hba1c', label: 'HbA1c', unit: '%', ref: '<6.5' },
        { key: 'ck', label: 'CK', unit: 'U/L', ref: '30-200' }
      ]
    },
    {
      title: 'Blood Count',
      icon: '🩸',
      gradient: 'from-purple-500/20 to-pink-500/20',
      borderColor: 'border-purple-500/30',
      textColor: 'text-purple-300',
      items: [
        { key: 'hemoglobin', label: 'Hemoglobin', unit: 'g/dL', ref: '13-17' },
        { key: 'leucocyte_count', label: 'WBC', unit: '×10⁹/L', ref: '4-11' },
        { key: 'platelets', label: 'Platelets', unit: '×10⁹/L', ref: '150-400' }
      ]
    },
    {
      title: 'Liver Function',
      icon: '🫘',
      gradient: 'from-orange-500/20 to-red-500/20',
      borderColor: 'border-orange-500/30',
      textColor: 'text-orange-300',
      items: [
        { key: 's_alanine_transaminase', label: 'ALT', unit: 'U/L', ref: '7-40' },
        { key: 's_aspartate_transaminase', label: 'AST', unit: 'U/L', ref: '10-40' },
        { key: 's_glutamyl_transferase', label: 'GGT', unit: 'U/L', ref: '9-48' }
      ]
    },
    {
      title: 'Kidney Function',
      icon: '🫑',
      gradient: 'from-cyan-500/20 to-blue-500/20',
      borderColor: 'border-cyan-500/30',
      textColor: 'text-cyan-300',
      items: [
        { key: 'creatinine', label: 'Creatinine', unit: 'µmol/L', ref: '60-110' },
        { key: 'egfr', label: 'eGFR', unit: 'mL/min/1.73m²', ref: '>60' },
        { key: 'uric_acid', label: 'Uric Acid', unit: 'µmol/L', ref: '155-428' }
      ]
    },
    {
      title: 'Inflammation',
      icon: '🔥',
      gradient: 'from-red-500/20 to-pink-500/20',
      borderColor: 'border-red-500/30',
      textColor: 'text-red-300',
      items: [
        { key: 'c_reactive_protein', label: 'CRP', unit: 'mg/L', ref: '<3' },
        { key: 'esr', label: 'ESR', unit: 'mm/hr', ref: '1-30' },
        { key: 'nlr', label: 'NLR', unit: '', ref: '<3' }
      ]
    }
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm border border-gray-700/50 shadow-2xl">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full"></div>

      <div className="relative z-10 p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-2xl">📊</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent">
              Biomarker Overview
            </h3>
            <p className="text-gray-400 text-sm">Comprehensive blood analysis results</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {biomarkerSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${section.gradient} border ${section.borderColor} hover:border-opacity-60 transition-all duration-300`}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg flex items-center justify-center">
                    <span className="text-lg">{section.icon}</span>
                  </div>
                  <h4 className={`font-bold text-lg ${section.textColor}`}>{section.title}</h4>
                </div>

                <div className="space-y-4">
                  {section.items.map((item, itemIndex) => {
                    const value = (latestResults as any)[item.key];
                    if (value === undefined || value === null) return null;

                    return (
                      <div key={itemIndex} className="group/item relative overflow-hidden rounded-lg bg-gray-800/50 border border-gray-700/50 hover:border-gray-600/70 transition-all duration-200">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/5 opacity-0 group-hover/item:opacity-100 transition-opacity duration-200"></div>
                        <div className="relative p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-300">{item.label}</span>
                            <span className="text-xs text-gray-500 bg-gray-700/50 px-2 py-1 rounded border border-gray-600/50">
                              {item.ref}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xl font-bold text-white">{value}</span>
                            <span className="text-sm text-gray-400">{item.unit}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};