import React, { useState } from 'react';

/**
 * Genetic Overview Tab
 */
export const GeneticOverviewTab: React.FC<{ geneticSummary: any[] }> = ({ geneticSummary }) => {
  const categories = Array.from(
    new Set(geneticSummary.map((g: any) => g.Category || g.category || g.CATEGORY))
  );

  return (
    <div className="space-y-6">
      {/* Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => {
          const categoryMarkers = geneticSummary.filter(
            (g: any) => (g.Category || g.category || g.CATEGORY) === category
          );
          const categoryColors: Record<
            string,
            { bg: string; border: string; text: string; icon: string }
          > = {
            performance: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: '💪' },
            recovery: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: '🔄' },
            pharmacogenomics: {
              bg: 'bg-purple-50',
              border: 'border-purple-200',
              text: 'text-purple-800',
              icon: '💊'
            },
            nutrigenomics: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', icon: '🥗' },
            injury: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: '🛡️' },
            metabolism: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', icon: '⚡' },
            cognition: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-800', icon: '🧠' },
            sleep: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-800', icon: '😴' }
          };

          const colors =
            categoryColors[category.toLowerCase()] || {
              bg: 'bg-gray-50',
              border: 'border-gray-200',
              text: 'text-gray-800',
              icon: '🧬'
            };

          return (
            <div key={category} className={`card-enhanced p-6 ${colors.bg} ${colors.border} border`}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{colors.icon}</span>
                <div>
                  <h3 className={`text-lg font-semibold capitalize ${colors.text}`}>
                    {String(category).replace('_', ' ')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {categoryMarkers.length} marker{categoryMarkers.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {categoryMarkers.slice(0, 3).map((marker, index) => {
                  const gene = marker.Gene || marker.gene || marker.GENE || 'Unknown';
                  const dbsnpId = marker.DbsnpRsId || 'N/A';
                  const rsid = marker.RSID || marker.rsid || marker.RSID || null;

                  return (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded-lg">
                      <div>
                        <div className={`font-semibold ${colors.text} text-sm`}>{gene}</div>
                        <div className="text-xs text-gray-500 font-mono">{dbsnpId}</div>
                      </div>
                      {rsid && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{rsid}</span>
                      )}
                    </div>
                  );
                })}
                {categoryMarkers.length > 3 && (
                  <div className="text-center text-xs text-gray-500 py-2">
                    +{categoryMarkers.length - 3} more markers
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Genetic Detailed Tab
 */
export const GeneticDetailedTab: React.FC<{ geneticSummary: any[] }> = ({ geneticSummary }) => {
  return (
    <div className="card-enhanced p-6">
      <h3 className="text-xl font-semibold mb-6 flex items-center gap-3 text-gray-900">
        <span className="bg-gradient-to-r from-green-100 to-blue-100 p-2 rounded-full text-green-700">📋</span>
        Detailed Genetic Analysis
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Gene</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">dbSNP RSID</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Category</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">RSID</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Impact</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Details</th>
            </tr>
          </thead>
          <tbody>
            {geneticSummary.map((marker, index) => {
              const gene = marker.Gene || marker.gene || marker.GENE || 'Unknown';
              const dbsnpId = marker.DbsnpRsId || 'N/A';
              const category = marker.Category || marker.category || marker.CATEGORY || 'Unknown';
              const rsid = marker.RSID || marker.rsid || marker.RSID || 'N/A';

              const getImpactLevel = (dbsnp: string) => {
                if (dbsnp.startsWith('rs') && dbsnp.length > 5) {
                  return { level: 'Standard', color: 'text-blue-600', bg: 'bg-blue-100' };
                }
                return { level: 'Standard', color: 'text-blue-600', bg: 'bg-blue-100' };
              };

              const impact = getImpactLevel(dbsnpId);

              return (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{gene}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`font-mono font-bold ${impact.color}`}>{dbsnpId}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${impact.bg} ${impact.color}`}
                    >
                      {String(category).replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-gray-600 text-xs">{rsid}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${impact.bg} ${impact.color}`}>
                      {impact.level} Impact
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {marker.Description && (
                      <div className="text-xs text-gray-600 max-w-xs truncate" title={marker.Description}>
                        {marker.Description}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * Genetic Insights Dashboard Tab
 */
export const GeneticInsightsTab: React.FC<{ geneticSummary: any[]; athlete: any }> = ({
  geneticSummary,
  athlete
}) => {
  // Flatten all genes from summaries
  const allGenes = geneticSummary.flatMap((summary: any) => {
    let genesData = summary.Genes || {};
    if (typeof genesData === 'string') {
      try {
        genesData = JSON.parse(genesData);
      } catch {
        genesData = {};
      }
    }
    if (Array.isArray(genesData)) {
      if (typeof genesData[0] === 'object' && genesData[0] !== null) {
        return (genesData as any[])
          .map((g: any) => ({
            gene: g.gene || g.Gene || g.rsid || g.RSID || 'Unknown',
            genotype: g.genotype || g.Genotype || 'Unknown',
            rsid: g.rsid || g.RSID || '',
            category: summary.Category || summary.category || 'Unknown',
            summary
          }))
          .filter(
            (g) => !g.gene.startsWith('$') && g.gene !== 'id' && g.gene !== 'Id' && g.gene !== 'ID'
          );
      } else {
        const obj = (genesData as any[]).reduce((acc: any, item: any) => {
          acc[item.Key || item.key] = item.Value || item.value;
          return acc;
        }, {});
        return Object.entries(obj)
          .filter(([gene]) => !String(gene).startsWith('$') && gene !== 'id' && gene !== 'Id' && gene !== 'ID')
          .map(([gene, genotype]) => ({
            gene,
            genotype: genotype as string,
            rsid: '',
            category: summary.Category || summary.category || 'Unknown',
            summary
          }));
      }
    } else if (typeof genesData === 'object' && genesData !== null) {
      const entries = Object.entries(genesData).filter(
        ([key]) => !String(key).startsWith('$') && key !== 'id' && key !== 'Id' && key !== 'ID'
      );
      return entries.map(([gene, genotype]) => ({
        gene,
        genotype: genotype as string,
        rsid: '',
        category: summary.Category || summary.category || 'Unknown',
        summary
      }));
    }
    return [];
  });

  // Define comprehensive genetic categories from the document
  const geneticCategories: Record<
    string,
    { name: string; genes: string[]; icon: string; color: string }[]
  > = {
    'Performance & Fitness': [
      { name: 'Power and Strength', genes: ['ACTN3', 'ACE', 'AGT', 'CKM', 'IL6', 'NOS3', 'PPARA', 'PPARGC1A', 'SOD2'], icon: '💪', color: 'orange' },
      { name: 'Endurance Capability', genes: ['ACE', 'ACTN3', 'COMT', 'CRP', 'DRD4', 'HFE', 'PPARA', 'UCP3', 'VEGFA'], icon: '🏃', color: 'blue' },
      { name: 'Lactate Threshold', genes: ['ACTN3', 'AMPD1', 'PPARGC1A', 'VEGFA'], icon: '⚡', color: 'yellow' },
      { name: 'Energy production during Exercise', genes: ['AMPD1', 'GABPB1', 'PPARA', 'PPARGC1A'], icon: '🔋', color: 'green' },
      { name: 'Muscle building', genes: ['ACTN3', 'ACE', 'MYH7', 'MSTN', 'FST', 'ACVR2B', 'IGF1', 'COL1A1', 'COL5A1', 'VDR', 'AR', 'CYP19A1', 'SHBG', 'IL6', 'TNF', 'SOD2'], icon: '🏋️', color: 'purple' }
    ],
    'Health & Disease Risk': [
      { name: 'Cardiovascular markers', genes: ['APOE', 'NOS3', 'ACE', 'AGT', 'ADRB2', 'MTHFR', 'LPA', 'CRP'], icon: '❤️', color: 'red' },
      { name: 'Metabolic Health', genes: ['TCF7L2', 'PPARG', 'FTO', 'MC4R', 'ADIPOQ', 'SLC2A2', 'MTNR1B', 'GCK'], icon: '⚕️', color: 'orange' },
      { name: 'Insulin Resistance Risk', genes: ['KCNJ11', 'PPARG', 'SLC2A2', 'TCF7L2'], icon: '🩸', color: 'red' },
      { name: 'Blood Clotting Risk', genes: ['F2', 'F5'], icon: '🩸', color: 'purple' },
      { name: 'Blood Flow and Circulation', genes: ['ACE', 'ADRB2', 'AGT', 'BDKRB2', 'NOS3'], icon: '💉', color: 'blue' },
      { name: 'Blood pressure Regulation', genes: ['ACE', 'ADRB1', 'AGT', 'NOS3'], icon: '🩺', color: 'indigo' },
      { name: 'Haemochromatosis Risk', genes: ['HFE'], icon: '🩸', color: 'red' },
      { name: 'Concussion Risk', genes: ['APOE', 'MTHFR', 'PEMT'], icon: '🧠', color: 'gray' },
      { name: 'Oxidative Stress', genes: ['SOD2', 'GCLC', 'SOD3', 'NQO1', 'CAT', 'GPX1', 'GSTM1', 'OGG1', 'EPHX1'], icon: '⚡', color: 'yellow' }
    ],
    'Injury Risk': [
      { name: 'Knee injury Risk', genes: ['COL1A1', 'GDF5'], icon: '🦵', color: 'red' },
      { name: 'Achilles Tendonitis Risk', genes: ['COL5A1'], icon: '🦵', color: 'orange' },
      { name: 'Bone and Joint Health Risk', genes: ['COL6A4P1', 'IL1R1', 'MCF2L', 'VDR', 'CYP2R1', 'NADSYN1', 'GC'], icon: '🦴', color: 'blue' },
      { name: 'Lower Back Pain risk', genes: ['CILP', 'COL11A1', 'COL9A3'], icon: '🦴', color: 'purple' },
      { name: 'Soft tissue Injury Risk', genes: ['AMPD1', 'GDF5', 'INS-IGF2'], icon: '🩹', color: 'red' },
      { name: 'General Injury risk', genes: ['COL5A1', 'GDF5', 'COL1A1'], icon: '🩹', color: 'orange' }
    ],
    'Mental Health & Cognition': [
      { name: 'Mental Health', genes: ['COMT', 'SLC6A4', 'TPH2', 'BDNF', 'MAO-A', 'FKBP5', 'GABRA6', 'HTR1A', 'OXTR'], icon: '🧠', color: 'purple' },
      { name: 'Anxiety risk', genes: ['COMT', 'SLC6A4', 'TPH2', 'BDNF', 'MAO-A', 'FKBP5', 'HTR1A', 'IL1B', 'OPRM1', 'OXTR'], icon: '😰', color: 'orange' },
      { name: 'Cognitive Memory', genes: ['ANK3', 'APOE', 'BDNF', 'CACNA1C', 'CETP', 'DRD2', 'TNF'], icon: '🧠', color: 'blue' },
      { name: 'Dopamine Reward', genes: ['ANKK1', 'CACNA1C', 'COMT', 'DRD2', 'DRD4'], icon: '🎯', color: 'green' }
    ],
    'Recovery & Sleep': [
      { name: 'Core Sleep markers', genes: ['COMT', 'PER3', 'CLOCK', 'BDNF', 'PPARGC1A', 'ACTN3', 'NOS3', 'TPH2', 'GABRA6', 'GSK3B', 'PER2'], icon: '😴', color: 'indigo' },
      { name: 'Heart Rate Variability/Autonomic Stress', genes: ['ADRB1', 'ADRB2', 'ACE', 'NOS3', 'CHRM2', 'RGS6'], icon: '❤️', color: 'red' }
    ],
    'Metabolism & Nutrition': [
      { name: 'Methylation Pathways', genes: ['MTHFR', 'MTHFR', 'MTRR', 'MTR', 'BHMT-02', 'CBS', 'SHMT1', 'PEMT', 'SLC19A1', 'TCN2', 'MTHFD1', 'FUT2', 'MAT1A', 'TPH2', 'VDR', 'GSTM1', 'GSTP1', 'GSTT1'], icon: '🧬', color: 'green' },
      { name: 'Detox Phase 1', genes: ['CYP1A1', 'CYP1A2', 'CYP1B1', 'CYP2A6', 'CYP2D6'], icon: '🛡️', color: 'yellow' },
      { name: 'Detox phase 2', genes: ['GSTM1', 'GSTP1', 'GSTT1', 'NAT2', 'NQO1', 'SULT1A1'], icon: '🛡️', color: 'orange' },
      { name: 'Caffeine Metabolism', genes: ['CYP1A2', 'AHR', 'POR', 'ADORA2A'], icon: '☕', color: 'brown' },
      { name: 'Estrogen Metabolism', genes: ['COMT', 'CYP17A1', 'CYP19A1', 'GSTM1', 'GSTT1'], icon: '⚗️', color: 'pink' },
      { name: 'Sex hormone Metabolism', genes: ['COMT', 'CYP1A1', 'CYP1B1', 'SULT1A1'], icon: '⚗️', color: 'purple' },
      { name: 'Vitamin B12 / Pernicious Anaemia', genes: ['FUT2', 'MTR'], icon: '💊', color: 'cyan' },
      { name: 'Gluten Sensitivity', genes: ['TNF'], icon: '🌾', color: 'yellow' }
    ],
    'Environmental & Lifestyle': [
      { name: 'Altitude Training Response', genes: ['ACE', 'ADRB2', 'NOS3', 'PPARA'], icon: '⛰️', color: 'blue' },
      { name: 'Salt Sensitivity', genes: ['ACE', 'AGT'], icon: '🧂', color: 'gray' },
      { name: 'Airway and Allergy', genes: ['ADRB2', 'IL4', 'IL13', 'FCER1A', 'TSLP', 'FLG', 'HRH1', 'HRH4'], icon: '🌬️', color: 'green' },
      { name: 'Bone Health Density', genes: ['DBP', 'VDR'], icon: '🦴', color: 'blue' },
      { name: 'Inflammatory / Infection Response', genes: ['IL6', 'TNF', 'TLR4', 'HLA-DQA1', 'HLA-DQB1', 'HLA-DRB1', 'PON1', 'SH2B3', 'PTPN22', 'SLC23A1', 'GPX1', 'FOXO3', 'IL1B', 'IRF5', 'SOCS2', 'CRP', 'GSTA1', 'IL17A', 'IL1A', 'IL1RN', 'HMOX1'], icon: '🦠', color: 'red' }
    ]
  };

  // Function to get genes for a category
  const getGenesForCategory = (genes: string[]) => {
    return allGenes.filter((g) => genes.includes(g.gene));
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">🧬 Comprehensive Genetic Health Dashboard</h2>
        <p className="text-gray-600 text-lg">
          Complete analysis across {Object.keys(geneticCategories).length} health domains • {allGenes.length} genetic
          markers analyzed
        </p>
      </div>

      {/* Executive Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card-enhanced p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">{allGenes.length}</div>
          <div className="text-sm text-gray-600">Total Genetic Markers</div>
          <div className="text-xs text-gray-500 mt-1">Across all categories</div>
        </div>
        <div className="card-enhanced p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {
              (Object.values(geneticCategories).flat() as any[]).filter(
                (cat: any) => getGenesForCategory(cat.genes).length > 0
              ).length
            }
          </div>
          <div className="text-sm text-gray-600">Categories Analyzed</div>
          <div className="text-xs text-gray-500 mt-1">With genetic data</div>
        </div>
        <div className="card-enhanced p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {new Set(allGenes.map((g) => g.category)).size}
          </div>
          <div className="text-sm text-gray-600">Genetic Categories</div>
          <div className="text-xs text-gray-500 mt-1">From database</div>
        </div>
        <div className="card-enhanced p-6 text-center">
          <div className="text-3xl font-bold text-indigo-600 mb-2">{new Set(allGenes.map((g) => g.gene)).size}</div>
          <div className="text-sm text-gray-600">Unique Genes</div>
          <div className="text-xs text-gray-500 mt-1">Identified</div>
        </div>
      </div>

      {/* Health Domain Sections */}
      {Object.entries(geneticCategories).map(([domain, categories]) => (
        <section key={domain} className="space-y-6">
          <div className="border-t pt-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <span className="bg-gradient-to-r from-blue-100 to-purple-100 p-3 rounded-full">
                {domain === 'Performance & Fitness'
                  ? '🏆'
                  : domain === 'Health & Disease Risk'
                  ? '⚕️'
                  : domain === 'Injury Risk'
                  ? '🩹'
                  : domain === 'Mental Health & Cognition'
                  ? '🧠'
                  : domain === 'Recovery & Sleep'
                  ? '😴'
                  : domain === 'Metabolism & Nutrition'
                  ? '🥗'
                  : '🌍'}
              </span>
              {domain}
              <span className="text-lg font-normal text-gray-600">
                {(categories as any[]).filter((cat) => getGenesForCategory((cat as any).genes).length > 0).length} active
                categories
              </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(categories as any[]).map((category: any, idx: number) => {
                const categoryGenes = getGenesForCategory(category.genes);
                const hasData = categoryGenes.length > 0;

                return (
                  <div
                    key={idx}
                    className={`card-enhanced p-5 ${hasData ? 'hover:shadow-lg transition-shadow' : 'opacity-60'}`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl">{category.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-sm leading-tight">{category.name}</h4>
                        <div
                          className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                            hasData ? `bg-${category.color}-100 text-${category.color}-800` : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {categoryGenes.length} markers
                        </div>
                      </div>
                    </div>

                    {hasData ? (
                      <div className="space-y-2">
                        {categoryGenes.slice(0, 3).map((gene, geneIdx) => (
                          <div
                            key={geneIdx}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs"
                          >
                            <span className="font-medium text-gray-700">{gene.gene}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-gray-600">{gene.genotype}</span>
                              {gene.rsid && (
                                <span className="text-gray-500 bg-white px-1 py-0.5 rounded text-xs">{gene.rsid}</span>
                              )}
                            </div>
                          </div>
                        ))}
                        {categoryGenes.length > 3 && (
                          <div className="text-center text-xs text-gray-500 py-1">
                            +{categoryGenes.length - 3} more genes
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500 text-sm">No genetic data available</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ))}

      {/* Genetic Data Summary */}
      {allGenes.length > 0 && (
        <section className="card-enhanced p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
            <span className="bg-gradient-to-r from-green-100 to-blue-100 p-2 rounded-full text-green-700">📊</span>
            Genetic Data Summary
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Object.entries(
              allGenes.reduce((acc: Record<string, number>, gene) => {
                acc[gene.category] = (acc[gene.category] || 0) + 1;
                return acc;
              }, {})
            )
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .slice(0, 8)
              .map(([category, count]) => (
                <div key={category} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-900">{count as number}</div>
                  <div className="text-xs text-gray-600">{category}</div>
                </div>
              ))}
          </div>

          <div className="text-center text-sm text-gray-600">
            Total genetic markers analyzed:{' '}
            {
              allGenes.filter(
                (g) => !g.gene.startsWith('$') && g.gene !== 'id' && g.gene !== 'Id' && g.gene !== 'ID'
              ).length
            }{' '}
            across {new Set(allGenes.map((g) => g.category)).size} categories
          </div>
        </section>
      )}
    </div>
  );
};

/**
 * Genetic Performance Matrix Tab
 */
export const GeneticPerformanceTab: React.FC<{
  geneticSummary: any[];
  athleteBiometrics: any[];
}> = ({ geneticSummary }) => {
  const performanceCategories = [
    {
      trait: 'Power & Strength',
      genes: geneticSummary.filter((m: any) =>
        ['ACTN3', 'ACE', 'AGT', 'CKM', 'IL6', 'NOS3', 'PPARA', 'PPARGC1A', 'SOD2'].includes(
          m.Gene || m.gene || m.GENE
        )
      ),
      icon: '💪',
      color: 'orange',
      description: 'Explosive power & muscle strength'
    },
    {
      trait: 'Endurance',
      genes: geneticSummary.filter((m: any) =>
        ['ACE', 'ACTN3', 'COMT', 'CRP', 'DRD4', 'HFE', 'PPARA', 'UCP3', 'VEGFA'].includes(m.Gene || m.gene || m.GENE)
      ),
      icon: '🏃',
      color: 'blue',
      description: 'Cardiovascular efficiency'
    },
    {
      trait: 'Recovery',
      genes: geneticSummary.filter((m: any) =>
        ['PPARA', 'BDNF', 'COMT', 'PPARGC1A', 'NOS3'].includes(m.Gene || m.gene || m.GENE)
      ),
      icon: '🔄',
      color: 'green',
      description: 'Recovery & adaptation rate'
    },
    {
      trait: 'Injury Risk',
      genes: geneticSummary.filter((m: any) =>
        ['COL5A1', 'GDF5', 'COL1A1', 'ADRB2'].includes(m.Gene || m.gene || m.GENE)
      ),
      icon: '🛡️',
      color: 'red',
      description: 'Injury susceptibility'
    },
    {
      trait: 'Metabolism',
      genes: geneticSummary.filter((m: any) =>
        ['TCF7L2', 'PPARG', 'FTO', 'MC4R', 'ADIPOQ', 'SLC2A2', 'MTNR1B', 'GCK'].includes(m.Gene || m.gene || m.GENE)
      ),
      icon: '⚡',
      color: 'yellow',
      description: 'Energy & nutrient metabolism'
    },
    {
      trait: 'Cognition',
      genes: geneticSummary.filter((m: any) =>
        ['ANK3', 'APOE', 'BDNF', 'CACNA1C', 'CETP', 'DRD2', 'TNF', 'COMT'].includes(m.Gene || m.gene || m.GENE)
      ),
      icon: '🧠',
      color: 'indigo',
      description: 'Mental performance & stress'
    }
  ];

  return (
    <div className="card-enhanced p-6">
      <h3 className="text-xl font-semibold mb-6 flex items-center gap-3 text-gray-900">
        <span className="bg-gradient-to-r from-purple-100 to-blue-100 p-2 rounded-full text-purple-700">🎯</span>
        Genetic Performance Matrix
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {performanceCategories.map((category, idx) => (
          <div key={idx} className="card-enhanced p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{category.icon}</span>
              <div>
                <h4 className="font-semibold text-gray-900">{category.trait}</h4>
                <p className="text-xs text-gray-500">{category.description}</p>
              </div>
            </div>

            <div className="text-center mb-4">
              <div className={`text-3xl font-bold text-${category.color}-600`}>{category.genes.length}</div>
              <div className="text-sm text-gray-600">Genetic Markers</div>
            </div>

            {category.genes.length > 0 && (
              <div className="space-y-2">
                {category.genes.map((gene: any, geneIdx: number) => (
                  <div key={geneIdx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                    <span className="font-medium text-gray-700">{gene.Gene || gene.gene || gene.GENE}</span>
                    <span className={`font-bold text-${category.color}-600 font-mono`}>
                      {gene.DbsnpRsId || 'N/A'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {category.genes.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">No markers in this category</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Optional tabs wrapper if needed elsewhere
 */
export const GeneticAnalysisTabs: React.FC<{
  geneticSummary: any[];
  athlete: any;
  athleteBiometrics: any[];
}> = ({ geneticSummary, athlete, athleteBiometrics }) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'detailed' | 'insights' | 'performance'>('overview');

  const subTabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'detailed', label: 'Detailed Analysis', icon: '🔬' },
    { id: 'insights', label: 'Smart Insights', icon: '💡' },
    { id: 'performance', label: 'Performance Matrix', icon: '🎯' }
  ] as const;

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {subTabs.map((tab) => {
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sub-tab Content */}
      {activeSubTab === 'overview' && <GeneticOverviewTab geneticSummary={geneticSummary} />}
      {activeSubTab === 'detailed' && <GeneticDetailedTab geneticSummary={geneticSummary} />}
      {activeSubTab === 'insights' && <GeneticInsightsTab geneticSummary={geneticSummary} athlete={athlete} />}
      {activeSubTab === 'performance' && (
        <GeneticPerformanceTab geneticSummary={geneticSummary} athleteBiometrics={athleteBiometrics} />
      )}
    </div>
  );
};