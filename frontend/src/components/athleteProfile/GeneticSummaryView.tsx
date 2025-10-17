import React from 'react';

export interface GeneticSummaryViewProps {
  geneticSummary: any[];
}

/**
 * Normalize an APOE genotype string to canonical form like "e2/e3", "e3/e4", etc.
 */
const normalizeApoeText = (val?: string | null): string | null => {
  if (!val || typeof val !== 'string') return null;
  const s = val
    .toLowerCase()
    .replace(/ε/gi, 'e')
    .replace(/\s+/g, '');
  const m = s.match(/e([2-4])\/?e([2-4])/);
  if (!m) return null;
  const a = [m[1], m[2]].sort();
  return `e${a[0]}/e${a[1]}`;
};

/**
 * Normalize nucleotide genotype like "T/C", "CT", "c c" to "TT" | "CT" | "CC" (only A/C/G/T kept).
 */
const normalizeNucleotideGenotype = (val?: string | null): string | null => {
  if (!val || typeof val !== 'string') return null;
  const s = val.toUpperCase().replace(/[^ACGT]/g, '');
  if (s.length === 2 && /^[ACGT]{2}$/.test(s)) return s;
  // If we got a single allele repeated with a separator, e.g., "T/T"
  const m = val.toUpperCase().match(/([ACGT]).*?([ACGT])/);
  if (m) {
    const a = `${m[1]}${m[2]}`;
    return /^[ACGT]{2}$/.test(a) ? a : null;
  }
  return null;
};

/**
 * Derive APOE genotype from rs429358 and rs7412 genotypes when unambiguous.
 * Only handles common, unambiguous combinations to avoid incorrect calls.
 */
const deriveApoeFromSnps = (rs429358?: string | null, rs7412?: string | null): string | null => {
  const g1 = normalizeNucleotideGenotype(rs429358);
  const g2 = normalizeNucleotideGenotype(rs7412);
  if (!g1 || !g2) return null;

  // Unambiguous mappings
  // Reference:
  //  - e2: rs429358 = T, rs7412 = T
  //  - e3: rs429358 = T, rs7412 = C
  //  - e4: rs429358 = C, rs7412 = C
  //
  // Genotype combinations:
  //  TT + CC => e3/e3
  //  CC + CC => e4/e4
  //  TT + TT => e2/e2
  //  CT + CC => e3/e4
  //  TT + CT => e2/e3
  //
  // Other mixed/hetero combos can be ambiguous without phasing; we won't guess those.
  const key = `${g1}-${g2}`;
  switch (key) {
    case 'TT-CC':
      return 'e3/e3';
    case 'CC-CC':
      return 'e4/e4';
    case 'TT-TT':
      return 'e2/e2';
    case 'CT-CC':
      return 'e3/e4';
    case 'TT-CT':
      return 'e2/e3';
    default:
      return null;
  }
};

type GeneEntry = { gene: string; genotype: string; rsid?: string };

/**
 * Parse the Genes payload (object | array | stringified JSON) into normalized GeneEntry[]
 */
const parseGenesToEntries = (genesRaw: any): GeneEntry[] => {
  if (!genesRaw) return [];

  let data: any = genesRaw;

  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      return [];
    }
  }

  // Handle .NET $values style
  if (data && typeof data === 'object' && !Array.isArray(data) && Array.isArray(data.$values)) {
    data = data.$values;
  }

  const skipKey = (k: string) => {
    const key = String(k);
    return key.startsWith('$') || ['id', 'Id', 'ID'].includes(key);
  };

  const out: GeneEntry[] = [];

  if (Array.isArray(data)) {
    if (data.length === 0) return out;

    const isObj = typeof data[0] === 'object' && data[0] !== null;

    if (isObj) {
      // Array of objects. Two patterns are supported:
      //  - [{ gene|Gene|rsid|RSID, genotype|Genotype }, ...]
      //  - [{ Key, Value }, ...] (key/value pairs)
      for (const item of data) {
        if (!item || typeof item !== 'object') continue;

        if ('Key' in item || 'key' in item) {
          const k = item.Key ?? item.key;
          const v = item.Value ?? item.value;
          if (k != null && v != null && !skipKey(String(k))) {
            out.push({ gene: String(k), genotype: String(v) });
          }
          continue;
        }

        const geneName = item.gene ?? item.Gene ?? item.rsid ?? item.RSID;
        const genotype = item.genotype ?? item.Genotype;
        const rsid = item.rsid ?? item.RSID;

        if (geneName != null && genotype != null && !skipKey(String(geneName))) {
          out.push({ gene: String(geneName), genotype: String(genotype), rsid: rsid ? String(rsid) : undefined });
        }
      }
    } else {
      // Unknown array payload; ignore
    }
    return out;
  }

  if (typeof data === 'object' && data !== null) {
    // Plain object of gene -> genotype
    for (const [k, v] of Object.entries(data)) {
      if (skipKey(k)) continue;
      if (v == null) continue;
      out.push({ gene: String(k), genotype: String(v as any) });
    }
    return out;
  }

  return out;
};

/**
 * Build a canonical gene map (dedup by gene-name) and capture APOE SNPs if present.
 */
const buildGeneMapAndSnps = (entries: GeneEntry[]) => {
  const geneMap = new Map<string, { gene: string; genotype: string }>();
  let rs429358: string | null = null;
  let rs7412: string | null = null;
  let apoeTextCandidates: string[] = [];

  const canonGene = (g: string) => g.trim().toUpperCase();

  for (const e of entries) {
    const gKey = canonGene(e.gene);

    // Record SNPs used for APOE derivation if present by rsid or by gene name
    const geneOrRsid = (e.rsid ?? e.gene).toString().toLowerCase();
    if (geneOrRsid === 'rs429358') rs429358 = e.genotype;
    if (geneOrRsid === 'rs7412') rs7412 = e.genotype;

    // Capture APOE textual genotypes from any key that looks like APOE
    if (gKey.includes('APOE')) {
      const norm = normalizeApoeText(e.genotype);
      if (norm) apoeTextCandidates.push(norm);
    }

    // Canonicalize certain gene aliases into one display key
    const displayGene = gKey.includes('APOE') ? 'APOE' : e.gene;

    // Deduplicate by canonical key; prefer first occurrence
    if (!geneMap.has(gKey)) {
      geneMap.set(gKey, { gene: displayGene, genotype: e.genotype });
    }
  }

  return { geneMap, rs429358, rs7412, apoeTextCandidates };
};

/**
 * Decide a single APOE genotype to display across all categories:
 *  - Prefer SNP-derived when unambiguous
 *  - Else, pick the most frequent textual APOE encountered
 */
const resolveGlobalApoe = (snpsList: Array<{ rs429358: string | null; rs7412: string | null }>, textList: string[]) => {
  // Try SNP-derived (if any unambiguous pair exists)
  for (const snps of snpsList) {
    const derived = deriveApoeFromSnps(snps.rs429358, snps.rs7412);
    if (derived) return derived;
  }

  // Fallback: pick most frequent textual APOE genotype
  const freq = new Map<string, number>();
  for (const t of textList) {
    if (!t) continue;
    freq.set(t, (freq.get(t) || 0) + 1);
  }
  if (freq.size === 0) return null;

  let selected: string | null = null;
  let best = -1;
  for (const [k, v] of freq.entries()) {
    if (v > best) {
      best = v;
      selected = k;
    }
  }
  return selected;
};

export const GeneticSummaryView: React.FC<GeneticSummaryViewProps> = ({ geneticSummary }) => {
  // First pass: parse raw summaries to entries and collect APOE-related info across all categories
  const parsed = geneticSummary.map((summary) => {
    const categoryName: string = summary.Category || summary.category || 'Unknown';
    const entries = parseGenesToEntries(summary.Genes ?? summary.genes ?? {});
    const { geneMap, rs429358, rs7412, apoeTextCandidates } = buildGeneMapAndSnps(entries);
    return { categoryName, geneMap, rs429358, rs7412, apoeTextCandidates };
    });

  // Resolve a single APOE genotype to ensure consistency across the whole Summary view
  const globalApoe = resolveGlobalApoe(
    parsed.map(p => ({ rs429358: p.rs429358, rs7412: p.rs7412 })),
    parsed.flatMap(p => p.apoeTextCandidates)
  );

  // Second pass: produce normalized per-category gene objects for display (apply global APOE, dedup)
  const normalizedSummaries = parsed.map((p) => {
    const obj: Record<string, string> = {};
    p.geneMap.forEach(({ gene, genotype }, key) => {
      const upper = key.toUpperCase();
      if (upper.startsWith('$') || ['ID'].includes(upper)) return;

      if (upper.includes('APOE')) {
        obj['APOE'] = globalApoe ?? normalizeApoeText(genotype) ?? genotype;
      } else {
        obj[gene] = genotype;
      }
    });
    return { categoryName: p.categoryName, genes: obj };
  });

  // Summary stats
  const totalCategories = normalizedSummaries.length;
  const totalGenes = normalizedSummaries.reduce((sum, s) => {
    return sum + Object.keys(s.genes).length;
  }, 0);
  const uniqueGeneSet = new Set<string>();
  normalizedSummaries.forEach(s => {
    Object.keys(s.genes).forEach(k => uniqueGeneSet.add(k));
  });
  const uniqueGenes = uniqueGeneSet.size;
  const activeCategories = normalizedSummaries.filter(s => Object.keys(s.genes).length > 0).length;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white-900 mb-2">🧬 Genetic Summary</h2>
        {globalApoe && (
          <div className="text-sm text-gray-500">
            APOE (harmonized): <span className="font-mono font-semibold">{globalApoe}</span>
          </div>
        )}
      </div>

      {normalizedSummaries.length > 0 ? (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="card-enhanced p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{totalCategories}</div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>
            <div className="card-enhanced p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{totalGenes}</div>
              <div className="text-sm text-gray-600">Total Genes</div>
            </div>
            <div className="card-enhanced p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{uniqueGenes}</div>
              <div className="text-sm text-gray-600">Unique Genes</div>
            </div>
            <div className="card-enhanced p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{activeCategories}</div>
              <div className="text-sm text-gray-600">Active Categories</div>
            </div>
          </div>

          {/* Category Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {normalizedSummaries.map((summary, index) => {
              const categoryName = summary.categoryName;
              const genesData = summary.genes;
              const geneEntries = Object.entries(genesData);
              const geneCount = geneEntries.length;

              // Category icons and colors
              const categoryConfig: Record<string, { icon: string; color: string; bgColor: string }> = {
                performance: { icon: '💪', color: 'text-blue-600', bgColor: 'bg-blue-50' },
                recovery: { icon: '🔄', color: 'text-green-600', bgColor: 'bg-green-50' },
                pharmacogenomics: { icon: '💊', color: 'text-purple-600', bgColor: 'bg-purple-50' },
                nutrigenomics: { icon: '🥗', color: 'text-orange-600', bgColor: 'bg-orange-50' },
                injury: { icon: '🛡️', color: 'text-red-600', bgColor: 'bg-red-50' },
                metabolism: { icon: '⚡', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
                cognition: { icon: '🧠', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
                sleep: { icon: '😴', color: 'text-pink-600', bgColor: 'bg-pink-50' },
              };

              const config = categoryConfig[String(categoryName).toLowerCase()] || {
                icon: '🧬',
                color: 'text-gray-600',
                bgColor: 'bg-gray-50',
              };

              return (
                <div
                  key={index}
                  className={`card-enhanced p-6 ${config.bgColor} border-l-4`}
                  style={{ borderLeftColor: config.color.replace('text-', '').replace('-600', '') }}
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
                        {geneCount} genetic marker{geneCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {geneCount > 0 ? (
                    <div className="space-y-3">
                      {geneEntries.slice(0, 6).map(([gene, genotype], geneIndex) => (
                        <div key={geneIndex} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                          <div className="font-medium text-gray-900">{gene}</div>
                          <div className="font-mono font-bold text-blue-600">{String(genotype)}</div>
                        </div>
                      ))}
                      {geneCount > 6 && (
                        <div className="text-center text-sm text-gray-500 py-2">
                          +{geneCount - 6} more genes
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
            No genetic summary data found in the athletegeneticsummary table for this athlete. Genetic testing results need to be uploaded to the database.
          </p>
        </div>
      )}
    </div>
  );
};

export default GeneticSummaryView;