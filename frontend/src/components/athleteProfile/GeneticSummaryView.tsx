import React from 'react';

export interface GeneticSummaryViewProps {
  geneticSummary: any[];
}

export const GeneticSummaryView: React.FC<GeneticSummaryViewProps> = ({ geneticSummary }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white-900 mb-2">🧬 Genetic Summary</h2>
      </div>

      {geneticSummary.length > 0 ? (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="card-enhanced p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{geneticSummary.length}</div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>
            <div className="card-enhanced p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {geneticSummary.reduce((total, summary) => {
                  const genesData = summary.Genes || summary.genes || {};
                  return total + Object.keys(genesData).filter((key) => !key.startsWith('$') && key !== 'id' && key !== 'Id' && key !== 'ID').length;
                }, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Genes</div>
            </div>
            <div className="card-enhanced p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {new Set(
                  geneticSummary.flatMap((summary) => {
                    const genesData = summary.Genes || summary.genes || {};
                    return Object.keys(genesData).filter((key) => !key.startsWith('$') && key !== 'id' && key !== 'Id' && key !== 'ID');
                  })
                ).size}
              </div>
              <div className="text-sm text-gray-600">Unique Genes</div>
            </div>
            <div className="card-enhanced p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {
                  geneticSummary.filter((summary) => {
                    const genesData = summary.Genes || summary.genes || {};
                    return Object.keys(genesData).length > 0;
                  }).length
                }
              </div>
              <div className="text-sm text-gray-600">Active Categories</div>
            </div>
          </div>

          {/* Category Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {geneticSummary.map((summary, index) => {
              const categoryName = summary.Category || summary.category || 'Unknown';
              const genesData = summary.Genes || summary.genes || {};
              const geneCount = Object.keys(genesData).filter(
                (key) => !key.startsWith('$') && key !== 'id' && key !== 'Id' && key !== 'ID'
              ).length;

              // Category icons and colors
              const categoryConfig: Record<string, { icon: string; color: string; bgColor: string }> = {
                performance: { icon: '💪', color: 'text-blue-600', bgColor: 'bg-blue-50' },
                recovery: { icon: '🔄', color: 'text-green-600', bgColor: 'bg-green-50' },
                pharmacogenomics: { icon: '💊', color: 'text-purple-600', bgColor: 'bg-purple-50' },
                nutrigenomics: { icon: '🥗', color: 'text-orange-600', bgColor: 'bg-orange-50' },
                injury: { icon: '🛡️', color: 'text-red-600', bgColor: 'bg-red-50' },
                metabolism: { icon: '⚡', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
                cognition: { icon: '🧠', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
                sleep: { icon: '😴', color: 'text-pink-600', bgColor: 'bg-pink-50' }
              };

              const config = categoryConfig[categoryName.toLowerCase()] || {
                icon: '🧬',
                color: 'text-gray-600',
                bgColor: 'bg-gray-50'
              };

              return (
                <div
                  key={index}
                  className={`card-enhanced p-6 ${config.bgColor} border-l-4`}
                  style={{
                    borderLeftColor: config.color.replace('text-', '').replace('-600', '')
                  }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{config.icon}</span>
                    <div>
                      <h3 className={`text-lg font-semibold ${config.color}`}>
                        {String(categoryName)
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {
                          Object.keys(genesData).filter(
                            (key) => !key.startsWith('$') && key !== 'id' && key !== 'Id' && key !== 'ID'
                          ).length
                        }{' '}
                        genetic marker
                        {
                          Object.keys(genesData).filter(
                            (key) => !key.startsWith('$') && key !== 'id' && key !== 'Id' && key !== 'ID'
                          ).length !== 1
                            ? 's'
                            : ''
                        }
                      </p>
                    </div>
                  </div>

                  {geneCount > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(genesData)
                        .filter(([gene]) => !gene.startsWith('$') && gene !== 'id' && gene !== 'Id' && gene !== 'ID')
                        .slice(0, 6)
                        .map(([gene, genotype], geneIndex) => (
                          <div
                            key={geneIndex}
                            className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm"
                          >
                            <div className="font-medium text-gray-900">{gene}</div>
                            <div className="font-mono font-bold text-blue-600">{String(genotype)}</div>
                          </div>
                        ))}
                      {Object.keys(genesData).filter(
                        (key) => !key.startsWith('$') && key !== 'id' && key !== 'Id' && key !== 'ID'
                      ).length > 6 && (
                        <div className="text-center text-sm text-gray-500 py-2">
                          +
                          {Object.keys(genesData).filter(
                            (key) => !key.startsWith('$') && key !== 'id' && key !== 'Id' && key !== 'ID'
                          ).length - 6}{' '}
                          more genes
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">No genetic data available for this category</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 card-enhanced">
          <div className="text-6xl mb-4">🧬</div>
          <h4 className="text-xl font-semibold text-gray-900 mb-2">No Genetic Summary Data</h4>
          <p className="text-gray-600 max-w-md mx-auto">
            No genetic summary data found in the athletegeneticsummary table for this athlete. Genetic testing results
            need to be uploaded to the database.
          </p>
        </div>
      )}
    </div>
  );
};

export default GeneticSummaryView;