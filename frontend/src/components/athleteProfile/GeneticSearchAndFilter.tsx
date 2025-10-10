import React, { useState, useEffect } from 'react';

const getFieldValue = (marker: any, fieldName: string): string => {
  const possibleNames = [
    fieldName,
    fieldName.toLowerCase(),
    fieldName.toUpperCase(),
    fieldName.charAt(0).toUpperCase() + fieldName.slice(1).toLowerCase(),
    fieldName.charAt(0).toLowerCase() + fieldName.slice(1).toUpperCase()
  ];

  for (const name of possibleNames) {
    if (marker[name]) return marker[name];
  }
  return '';
};

export const GeneticSearchAndFilter: React.FC<{
  geneticSummary: any[];
  onFilteredResults: (results: any[]) => void;
}> = ({ geneticSummary, onFilteredResults }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedImpact, setSelectedImpact] = useState('all');
  const [sortBy, setSortBy] = useState('gene');

  const categories = Array.from(new Set(geneticSummary.map((g: any) => getFieldValue(g, 'category'))));

  useEffect(() => {
    // First, deduplicate the genetic summary data
    const uniqueMarkers = geneticSummary.reduce((acc, marker: any) => {
      // Use the correct DbsnpRsId field as primary key
      const dbsnpField = marker.DbsnpRsId || '';
      const rsidField = marker.RSID || marker.rsid || marker.RSID || '';
      const geneField = marker.Gene || marker.gene || marker.GENE || '';
      const genotypeField = marker.GeneticCall || marker.genetic_call || marker.GENETIC_CALL || marker.Genotype || marker.genotype || '';

      // Prioritize DbsnpRsId as the unique key
      const key = dbsnpField || rsidField || `${geneField}_${genotypeField || 'unknown'}`;
      if (!acc.has(key)) {
        acc.set(key, marker);
      }
      return acc;
    }, new Map());

    let filtered = Array.from(uniqueMarkers.values());

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((marker: any) =>
        getFieldValue(marker, 'gene').toLowerCase().includes(searchTerm.toLowerCase()) ||
        getFieldValue(marker, 'dbsnp_rs_id').toLowerCase().includes(searchTerm.toLowerCase()) ||
        getFieldValue(marker, 'rsid').toLowerCase().includes(searchTerm.toLowerCase()) ||
        getFieldValue(marker, 'genetic_call').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((marker: any) => getFieldValue(marker, 'category') === selectedCategory);
    }

    // Apply impact filter
    if (selectedImpact !== 'all') {
      if (selectedImpact === 'high') {
        filtered = filtered.filter((marker: any) => {
          const genotype = getFieldValue(marker, 'genetic_call');
          return genotype.includes('AA') || genotype.includes('GG') || genotype.includes('TT') || genotype.includes('CC');
        });
      } else if (selectedImpact === 'medium') {
        filtered = filtered.filter((marker: any) => {
          const genotype = getFieldValue(marker, 'genetic_call');
          return genotype.includes('AG') || genotype.includes('CT') || genotype.includes('AC');
        });
      }
    }

    // Apply sorting
    filtered.sort((a: any, b: any) => {
      switch (sortBy) {
        case 'gene':
          return getFieldValue(a, 'gene').localeCompare(getFieldValue(b, 'gene'));
        case 'dbsnp':
          return getFieldValue(a, 'dbsnp_rs_id').localeCompare(getFieldValue(b, 'dbsnp_rs_id'));
        case 'category':
          return getFieldValue(a, 'category').localeCompare(getFieldValue(b, 'category'));
        case 'rsid':
          return getFieldValue(a, 'rsid').localeCompare(getFieldValue(b, 'rsid'));
        default:
          return 0;
      }
    });

    onFilteredResults(filtered);
  }, [searchTerm, selectedCategory, selectedImpact, sortBy, geneticSummary, onFilteredResults]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Search */}
      <div className="lg:col-span-2">
        <div className="relative">
          <input
            type="text"
            placeholder="Search genes, dbSNP RSID, or RSID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
          />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
        </div>
      </div>

      {/* Category Filter */}
      <select
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
      >
        <option value="all">All Categories</option>
        {categories.map(category => (
          <option key={category} value={category}>{category.replace('_', ' ')}</option>
        ))}
      </select>

      {/* Impact Filter */}
      <select
        value={selectedImpact}
        onChange={(e) => setSelectedImpact(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
      >
        <option value="all">All Impact Levels</option>
        <option value="high">High Impact</option>
        <option value="medium">Medium Impact</option>
      </select>

      {/* Sort By */}
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
      >
        <option value="gene">Sort by Gene</option>
        <option value="dbsnp">Sort by dbSNP RSID</option>
        <option value="category">Sort by Category</option>
        <option value="rsid">Sort by RSID</option>
      </select>
    </div>
  );
};