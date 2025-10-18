import React from 'react';

export interface ComprehensiveGeneticAnalysisProps {
  athlete: any;
  geneticSummary: any[];
  athleteId: number;
}

const ComprehensiveGeneticAnalysis: React.FC<ComprehensiveGeneticAnalysisProps> = ({ athlete, geneticSummary, athleteId }) => {
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
        return genesData.map((g: any) => ({
          gene: g.gene || g.Gene || g.rsid || g.RSID || 'Unknown',
          genotype: g.genotype || g.Genotype || 'Unknown',
          rsid: g.rsid || g.RSID || '',
          category: summary.Category || summary.category || 'Unknown',
          summary
        })).filter(g => !g.gene.startsWith('$') && g.gene !== 'id' && g.gene !== 'Id' && g.gene !== 'ID');
      } else {
        const obj = genesData.reduce((acc: any, item: any) => {
          acc[item.Key || item.key] = item.Value || item.value;
          return acc;
        }, {});
        return Object.entries(obj)
          .filter(([gene]) => !gene.startsWith('$') && gene !== 'id' && gene !== 'Id' && gene !== 'ID')
          .map(([gene, genotype]) => ({
            gene,
            genotype: genotype as string,
            rsid: '',
            category: summary.Category || summary.category || 'Unknown',
            summary
          }));
      }
    } else if (typeof genesData === 'object' && genesData !== null) {
      const entries = Object.entries(genesData).filter(([key]) => !key.startsWith('$') && key !== 'id' && key !== 'Id' && key !== 'ID');
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

  // Comprehensive genetic analysis data
  const geneticAnalysisData = {
  "CoreSleep": {
    "description": "Genes influencing sleep quality, circadian rhythm, and recovery efficiency.",
    "genes": {
      "COMT": { "rsid": "rs4680", "function": "Dopamine breakdown, stress resilience, and sleep depth" },
      "PER3": { "rsid": "rs57875989", "function": "Chronotype (morning/evening preference), sleep duration" },
      "CLOCK": { "rsid": "rs1801260", "function": "Sleep timing and circadian rhythm regulation" },
      "BDNF": { "rsid": "rs6265", "function": "Neuroplasticity and recovery during sleep" },
      "PPARGC1A": { "rsid": "rs8192678", "function": "Mitochondrial biogenesis, recovery, energy metabolism" },
      "ACTN3": { "rsid": "rs1815739", "function": "Muscle fiber type balance, sleep recovery in athletes" },
      "NOS3": { "rsid": "rs1799983", "function": "Vasodilation and oxygenation affecting sleep quality" },
      "TPH2": { "rsid": "rs4570625", "function": "Serotonin synthesis, mood and sleep regulation" },
      "GABRA6": { "rsid": "rs3219151", "function": "GABA receptor activity, sleep onset latency" },
      "GSK3B": { "rsid": "rs334558", "function": "Circadian rhythm stability and bipolar risk" },
      "PER2": { "rsid": "rs2304672", "function": "Light sensitivity, circadian phase timing" }
    }
  },

  "MentalHealth": {
    "description": "Genes impacting stress response, resilience, and emotional regulation.",
    "genes": {
      "COMT": { "rsid": "rs4680", "function": "Dopamine metabolism, anxiety, cognitive function" },
      "BDNF": { "rsid": "rs6265", "function": "Neuroplasticity and mood stability" },
      "TPH2": { "rsid": "rs4570625", "function": "Serotonin synthesis, depression risk" },
      "MAOA": { "rsid": "rs6323", "function": "Monoamine metabolism, aggression, stress response" },
      "SLC6A4": { "rsid": "rs4795541", "function": "Serotonin transporter promoter (5-HTTLPR), stress resilience" },
      "FKBP5": { "rsid": "rs1360780", "function": "HPA-axis stress response, trauma sensitivity" },
      "GABRA6": { "rsid": "rs3219151", "function": "GABA receptor, anxiety regulation" },
      "HTR1A": { "rsid": "rs6295", "function": "Serotonin receptor sensitivity, mood modulation" },
      "OXTR": { "rsid": "rs53576", "function": "Oxytocin receptor, social bonding, empathy" }
    }
  },

  "CardiovascularHealth": {
    "description": "Genes associated with lipid metabolism, vascular tone, and cardiovascular risk.",
    "genes": {
      "APOE": {
        "rsids": ["rs429358", "rs7412"],
        "function": "Lipid transport and metabolism; defines APOE ε2/ε3/ε4 type"
      },
      "NOS3": { "rsid": "rs1799983", "function": "Endothelial nitric oxide synthesis, vascular tone" },
      "ACE": { "rsid": "rs4341", "function": "Blood pressure regulation and endurance potential" },
      "AGT": { "rsid": "rs699", "function": "Angiotensinogen activity, blood pressure and sodium balance" },
      "ADRB2": { "rsid": "rs1042713", "function": "Adrenergic receptor sensitivity, cardiac output" },
      "MTHFR": { "rsid": "rs1801133", "function": "Homocysteine metabolism, methylation" },
      "LPA": { "rsid": "rs3798220", "function": "Lipoprotein(a) levels, cardiovascular risk" },
      "CRP": { "rsid": "rs1205", "function": "C-reactive protein levels, inflammation" }
    }
  },

  "MetabolicHealth": {
    "description": "Genes influencing glucose control, lipid metabolism, and obesity risk.",
    "genes": {
      "TCF7L2": { "rsid": "rs7903146", "function": "Glucose metabolism, type 2 diabetes risk" },
      "PPARG": { "rsid": "rs1801282", "function": "Insulin sensitivity, adipogenesis" },
      "FTO": { "rsid": "rs9939609", "function": "Appetite regulation, obesity predisposition" },
      "MC4R": { "rsid": "rs17782313", "function": "Energy balance, obesity risk" },
      "ADIPOQ": { "rsid": "rs266729", "function": "Adiponectin levels, insulin sensitivity" },
      "SLC2A2": { "rsid": "rs5400", "function": "Glucose transport and utilization" },
      "MTNR1B": { "rsid": "rs10830963", "function": "Melatonin receptor, fasting glucose levels" },
      "GCK": { "rsid": "rs1799884", "function": "Glucokinase activity, fasting glucose control" }
    }
  },

  "PowerStrength": {
    "description": "Genes contributing to muscle power, strength, and explosive performance.",
    "genes": {
      "ACE": { "rsid": "rs4341", "function": "ACE activity affects muscle oxygenation and performance" },
      "ACTN3": { "rsid": "rs1815739", "function": "Fast-twitch muscle fiber efficiency" },
      "AGT": { "rsid": "rs699", "function": "Muscle hypertrophy and recovery" },
      "CKM": { "rsid": "rs8111989", "function": "Creatine kinase activity, muscle energy turnover" },
      "IL6": { "rsid": "rs1800795", "function": "Inflammation and muscle recovery" },
      "NOS3": { "rsid": "rs1799983", "function": "Oxygen delivery and muscle endurance" },
      "PPARA": { "rsid": "rs4253778", "function": "Fat metabolism and energy substrate usage" },
      "PPARGC1A": { "rsid": "rs8192678", "function": "Mitochondrial biogenesis and endurance adaptation" },
      "SOD2": { "rsid": "rs4880", "function": "Antioxidant defense, recovery efficiency" }
    }
  },

  "Endurance": {
    "description": "Genes influencing aerobic capacity, focus, and energy utilization.",
    "genes": {
      "ACE": { "rsid": "rs4341", "function": "Endurance potential and oxygen efficiency" },
      "ACTN3": { "rsid": "rs1815739", "function": "Slow vs fast-twitch muscle balance" },
      "COMT": { "rsid": "rs4680", "function": "Mental endurance, dopamine regulation" },
      "CRP": { "rsid": "rs1205", "function": "Inflammation control during long efforts" },
      "DRD4": { "rsid": "rs1800955", "function": "Dopamine receptor; motivation and novelty-seeking" },
      "HFE": { "rsid": "rs1799945", "function": "Iron regulation and oxygen-carrying capacity" },
      "PPARA": { "rsid": "rs4253778", "function": "Fat oxidation and energy utilization" },
      "UCP3": { "rsid": "rs1800849", "function": "Energy efficiency and thermogenesis" },
      "VEGFA": { "rsid": "rs2010963", "function": "Capillary density, angiogenesis for oxygen delivery" }
    }
  },

  "InjuryRisk": {
    "description": "Genes influencing connective tissue integrity, collagen formation, and injury susceptibility.",
    "genes": {
      "COL1A1": { "rsid": "rs1800012", "function": "Collagen synthesis and tendon strength" },
      "COL5A1": { "rsid": "rs12722", "function": "Collagen structure, ligament flexibility" },
      "GDF5": { "rsid": "rs143383", "function": "Cartilage repair and joint health" }
    }
  },

  "Recovery": {
    "description": "Genes affecting recovery rate, inflammation control, and adaptation speed.",
    "genes": {
      "PPARGC1A": { "rsid": "rs8192678", "function": "Energy metabolism and adaptation to training" },
      "BDNF": { "rsid": "rs6265", "function": "Neural recovery and plasticity" },
      "COMT": { "rsid": "rs4680", "function": "Stress resilience and post-exercise recovery" }
    }
  }
};


  const getGeneAnalysis = (categoryName: string, geneName: string, genotype: string) => {
    const category = geneticAnalysisData[categoryName as keyof typeof geneticAnalysisData] as any;
    const genesObj = (category?.genes ?? undefined) as Record<string, any> | undefined;
    if (!genesObj || !(geneName in genesObj)) {
      return { impact: 'unknown', description: 'Analysis not available', color: 'gray' };
    }

    const geneData = genesObj[geneName];
    const analysis =
      (geneData?.analysis && geneData.analysis[genotype as keyof typeof geneData.analysis]) ||
      geneData?.analysis?.default ||
      { impact: 'unknown', description: 'Analysis not available', color: 'gray' };

    return analysis;
  };

  // Try to resolve a gene's analysis by searching across all defined categories
  const getAnyGeneAnalysis = (geneName: string, genotype: string) => {
    for (const [catName, catData] of Object.entries(geneticAnalysisData)) {
      const genes = (catData as any).genes || {};
      if (genes[geneName]) {
        return getGeneAnalysis(catName, geneName, genotype);
      }
    }
    return { impact: 'unknown', description: 'Analysis not available', color: 'gray' };
  };
  // Normalize helper for gene name matching
  const normalize = (s: string) => (s || '').toUpperCase().replace(/\s+/g, '');
  
  // Get all genes that belong to a display category by matching known gene lists
  const getGenesForCategory = (categoryName: string) => {
    const category = geneticAnalysisData[categoryName as keyof typeof geneticAnalysisData] as any;
    if (!category) return [];
    const geneKeys = Object.keys(category.genes || {});
    const geneSet = new Set(geneKeys.map(normalize));
    // Deduplicate by gene name so present count never exceeds total defined genes
    const unique = new Map<string, typeof allGenes[number]>();
    for (const g of allGenes) {
      const key = normalize(g.gene);
      if (geneSet.has(key) && !unique.has(key)) {
        unique.set(key, g);
      }
    }
    return Array.from(unique.values());
  };

  // Impact mapping and scoring utilities for Rugby-specific summaries
  const impactToNum = (impact: string) => impact === 'beneficial' ? 1 : impact === 'challenging' ? -1 : 0;

  const computeTraitScore = (genes: readonly string[]) => {
    const normGenes = new Set(genes.map(normalize));
    const present = allGenes.filter(g => normGenes.has(normalize(g.gene)));
    if (present.length === 0) return 50; // neutral if no data present
    const total = present.reduce((acc, g) => acc + impactToNum(getAnyGeneAnalysis(g.gene, g.genotype).impact), 0);
    const avg = total / present.length; // -1..1
    return Math.round((avg + 1) * 50); // 0..100
  };

  const scoreBadgeClass = (score: number) =>
    score >= 70
      ? 'bg-green-50 text-green-700 border-green-200'
      : score >= 50
      ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
      : 'bg-red-50 text-red-700 border-red-200';

  const rugbyTraits = [
    { key: 'power', label: 'Scrum/Collision Power', icon: '🏉', genes: ['ACTN3','ACE','AGT','CKM','PPARGC1A','PPARA','IL6','SOD2','NOS3'] },
    { key: 'endurance', label: 'Sprint Repeatability', icon: '⚡', genes: ['ACE','ACTN3','PPARA','UCP3','VEGFA','CRP','COMT'] },
    { key: 'recovery', label: 'Recovery Capacity', icon: '🔄', genes: ['PPARGC1A','BDNF','COMT','NOS3'] },
    { key: 'tissue', label: 'Tissue Integrity Risk', icon: '🩹', genes: ['COL1A1','COL5A1','GDF5','IL6'] },
    { key: 'concussion', label: 'Concussion/Contact Risk', icon: '🧠', genes: ['APOE','MTHFR C677T','PEMT','CRP'] }
  ] as const;

  // Helper: get unique present genes matching a provided gene list (tolerates name variants)
  const getGenesForList = (genes: readonly string[]) => {
    const targets = new Set(genes.map(normalize));
    const unique = new Map<string, typeof allGenes[number]>();
    for (const g of allGenes) {
      const gKey = normalize(g.gene);
      if (targets.has(gKey)) {
        if (!unique.has(gKey)) unique.set(gKey, g);
      }
    }
    return Array.from(unique.values());
  };

  // All health subcategories to always display in overview
  const healthCategories = [
    { name: 'Core Sleep', genes: ['COMT','PER3','CLOCK','BDNF','PPARGC1A','ACTN3','NOS3','TPH2','GABRA6','GSK3B','PER2'], icon: '😴' },
    { name: 'Mental Health', genes: ['COMT','SLC6A4','TPH2','BDNF','MAO-A','FKBP5','GABRA6','HTR1A','OXTR'], icon: '🧠' },
    { name: 'Cardiovascular', genes: ['APOE','NOS3','ACE','AGT','ADRB2','MTHFR','LPA','CRP'], icon: '❤️' },
    { name: 'Metabolic Health', genes: ['TCF7L2','PPARG','FTO','MC4R','ADIPOQ','SLC2A2','MTNR1B','GCK'], icon: '⚡' },
    { name: 'Power and Strength', genes: ['ACTN3','ACE','AGT','CKM','IL6','NOS3','PPARA','PPARGC1A','SOD2'], icon: '💪' },
    { name: 'Endurance Capability', genes: ['ACE','ACTN3','COMT','CRP','DRD4','HFE','PPARA','UCP3','VEGFA'], icon: '🏃' },
    { name: 'Knee injury Risk', genes: ['COL1A1','GDF5'], icon: '🦵' },
    { name: 'Achilles Tendonitis Risk', genes: ['COL5A1'], icon: '🦵' },
    { name: 'Bone and Joint Health Risk', genes: ['COL6A4P1','IL1R1','MCF2L','VDR','CYP2R1','NADSYN1','GC'], icon: '🦴' },
    { name: 'Lower Back Pain risk', genes: ['CILP','COL11A1','COL9A3'], icon: '🦴' },
    { name: 'Soft tissue Injury Risk', genes: ['AMPD1','GDF5','INS-IGF2'], icon: '🩹' },
    { name: 'General Injury risk', genes: ['COL5A1','GDF5','COL1A1'], icon: '🩹' },
    { name: 'Anxiety risk', genes: ['COMT','SLC6A4','TPH2','BDNF','MAO-A','FKBP5','HTR1A','IL1B','OPRM1','OXTR'], icon: '😰' },
    { name: 'Cognitive Memory', genes: ['ANK3','APOE','BDNF','CACNA1C','CETP','DRD2','TNF'], icon: '🧠' },
    { name: 'Dopamine Reward', genes: ['ANKK1','CACNA1C','COMT','DRD2','DRD4'], icon: '🎯' },
    { name: 'HRV/Autonomic Stress', genes: ['ADRB1','ADRB2','ACE','NOS3','CHRM2','RGS6'], icon: '❤️' },
    { name: 'Methylation Pathways', genes: ['MTHFR','MTRR','MTR','BHMT-02','CBS','SHMT1','PEMT','SLC19A1','TCN2','MTHFD1','FUT2','MAT1A','TPH2','VDR','GSTM1','GSTP1','GSTT1'], icon: '🧬' },
    { name: 'Detox Phase 1', genes: ['CYP1A1','CYP1A2','CYP1B1','CYP2A6','CYP2D6'], icon: '🛡️' },
    { name: 'Detox Phase 2', genes: ['GSTM1','GSTP1','GSTT1','NAT2','NQO1','SULT1A1'], icon: '🛡️' },
    { name: 'Caffeine Metabolism', genes: ['CYP1A2','AHR','POR','ADORA2A'], icon: '☕' },
    { name: 'Estrogen Metabolism', genes: ['COMT','CYP17A1','CYP19A1','GSTM1','GSTT1'], icon: '⚗️' },
    { name: 'Sex hormone Metabolism', genes: ['COMT','CYP1A1','CYP1B1','SULT1A1'], icon: '⚗️' },
    { name: 'Vitamin B12 / Pernicious Anaemia', genes: ['FUT2','MTR'], icon: '💊' },
    { name: 'Gluten Sensitivity', genes: ['TNF'], icon: '🌾' },
    { name: 'Altitude Training Response', genes: ['ACE','ADRB2','NOS3','PPARA'], icon: '⛰️' },
    { name: 'Salt Sensitivity', genes: ['ACE','AGT'], icon: '🧂' },
    { name: 'Airway and Allergy', genes: ['ADRB2','IL4','IL13','FCER1A','TSLP','FLG','HRH1','HRH4'], icon: '🌬️' },
    { name: 'Bone Health Density', genes: ['DBP','VDR'], icon: '🦴' },
    { name: 'Inflammatory / Infection Response', genes: ['IL6','TNF','TLR4','HLA-DQA1','HLA-DQB1','HLA-DRB1','PON1','SH2B3','PTPN22','SLC23A1','GPX1','FOXO3','IL1B','IRF5','SOCS2','CRP','GSTA1','IL17A','IL1A','IL1RN','HMOX1'], icon: '🦠' },
    { name: 'Lactate Threshold', genes: ['ACTN3','AMPD1','PPARGC1A','VEGFA'], icon: '⚡' },
    { name: 'Energy production during Exercise', genes: ['AMPD1','GABPB1','PPARA','PPARGC1A'], icon: '🔋' },
    { name: 'Muscle building', genes: ['ACTN3','ACE','MYH7','MSTN','FST','ACVR2B','IGF1','COL1A1','COL5A1','VDR','AR','CYP19A1','SHBG','IL6','TNF','SOD2'], icon: '🏋️' },
    { name: 'Blood Clotting Risk', genes: ['F2','F5'], icon: '🩸' },
    { name: 'Blood Flow and Circulation', genes: ['ACE','ADRB2','AGT','BDKRB2','NOS3'], icon: '💉' },
    { name: 'Blood pressure Regulation', genes: ['ACE','ADRB1','AGT','NOS3'], icon: '🩺' },
    { name: 'Haemochromatosis Risk', genes: ['HFE'], icon: '🩸' },
    { name: 'Concussion Risk', genes: ['APOE','MTHFR','PEMT'], icon: '🧠' }
  ];

  const tissueWatchlistGenes = ['COL1A1','COL5A1','GDF5','IL6','CRP'];

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-white-900 mb-4">🔬 Comprehensive Genetic Analysis</h2>
        <p className="text-xl text-gray-600 max-w-4xl mx-auto">
          Athlete-specific genetic analysis for {athlete.name}.
          Detailed analysis of {allGenes.filter(g => !g.gene.startsWith('$') && g.gene !== 'id' && g.gene !== 'Id' && g.gene !== 'ID').length} genetic markers across {Object.keys(geneticAnalysisData).length} health categories.
        </p>
      </div>

      {/* Category Overview Cards (All Health Subcategories) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
        {healthCategories.map((cat) => {
          const categoryGenes = getGenesForList(cat.genes);
          const totalDefined = cat.genes.length;
          const numerator = Math.min(categoryGenes.length, totalDefined);
          const beneficialRaw = categoryGenes.filter(g =>
            getAnyGeneAnalysis(g.gene, g.genotype).impact === 'beneficial'
          ).length;
          const challengingRaw = categoryGenes.filter(g =>
            getAnyGeneAnalysis(g.gene, g.genotype).impact === 'challenging'
          ).length;
          const beneficialCount = Math.min(beneficialRaw, numerator);
          const challengingCount = Math.min(challengingRaw, Math.max(numerator - beneficialCount, 0));

          return (
            <div key={cat.name} className="card-enhanced p-4 text-center hover:shadow-lg transition-shadow">
              <div className="text-2xl mb-2">{cat.icon}</div>
              <div className="text-sm font-semibold text-gray-900 mb-1 leading-tight">
                {cat.name}
              </div>
              <div className="text-lg font-bold text-blue-600 mb-1">
                {numerator}/{totalDefined}
              </div>
              <div className="text-xs text-gray-500 mb-2">markers</div>
              {beneficialCount > 0 && (
                <div className="flex justify-center items-center gap-1 text-xs">
                  <span className="text-green-600">●</span>
                  <span className="text-green-600 font-medium">{beneficialCount}</span>
                </div>
              )}
              {challengingCount > 0 && (
                <div className="flex justify-center items-center gap-1 text-xs mt-1">
                  <span className="text-red-600">●</span>
                  <span className="text-red-600 font-medium">{challengingCount}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Key Genetic Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Genetic Strengths */}
        <div className="card-enhanced p-6">
          <h3 className="text-xl font-bold text-green-700 mb-6 flex items-center gap-3">
            <span className="bg-green-100 p-2 rounded-full text-green-700">💪</span>
            Genetic Strengths
          </h3>
          <div className="space-y-4">
            {allGenes.filter(g => getAnyGeneAnalysis(g.gene, g.genotype).impact === 'beneficial').slice(0, 5).map((gene, idx) => {
              const analysis = getAnyGeneAnalysis(gene.gene, gene.genotype);
              return (
                <div key={idx} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <span className="text-green-600 mt-0.5">✅</span>
                  <div>
                    <div className="font-medium text-green-800 text-sm">{gene.gene} ({gene.genotype})</div>
                    <div className="text-xs text-green-600 mt-1">{analysis.description}</div>
                    <div className="text-xs text-gray-500 mt-1">{gene.category}</div>
                  </div>
                </div>
              );
            })}
            {allGenes.filter(g => getAnyGeneAnalysis(g.gene, g.genotype).impact === 'beneficial').length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No significant genetic advantages identified
              </div>
            )}
          </div>
        </div>

        {/* Areas for Attention */}
        <div className="card-enhanced p-6">
          <h3 className="text-xl font-bold text-orange-700 mb-6 flex items-center gap-3">
            <span className="bg-orange-100 p-2 rounded-full text-orange-700">⚠️</span>
            Areas for Attention
          </h3>
          <div className="space-y-4">
            {allGenes.filter(g => getAnyGeneAnalysis(g.gene, g.genotype).impact === 'challenging').slice(0, 5).map((gene, idx) => {
              const analysis = getAnyGeneAnalysis(gene.gene, gene.genotype);
              return (
                <div key={idx} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <span className="text-orange-600 mt-0.5">⚠️</span>
                  <div>
                    <div className="font-medium text-orange-800 text-sm">{gene.gene} ({gene.genotype})</div>
                    <div className="text-xs text-orange-600 mt-1">{analysis.description}</div>
                    <div className="text-xs text-gray-500 mt-1">{gene.category}</div>
                  </div>
                </div>
              );
            })}
            {allGenes.filter(g => getAnyGeneAnalysis(g.gene, g.genotype).impact === 'challenging').length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No significant genetic challenges identified
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Personalized Recommendations */}
      <div className="card-enhanced p-6 mb-8">
        <h3 className="text-xl font-bold text-blue-700 mb-6 flex items-center gap-3">
          <span className="bg-blue-100 p-2 rounded-full text-blue-700">🎯</span>
          Personalized Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Training Recommendations */}
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
              <span className="text-lg">🏋️</span>
              Training Focus
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              {allGenes.some(g => g.gene === 'ACTN3' && getAnyGeneAnalysis(g.gene, g.genotype).impact === 'beneficial') && (
                <li>• Prioritize explosive power training</li>
              )}
              {allGenes.some(g => g.gene === 'ACE' && g.genotype.includes('II')) && (
                <li>• Focus on endurance-based sessions</li>
              )}
              {allGenes.some(g => g.gene === 'COL5A1' && getAnyGeneAnalysis(g.gene, g.genotype).impact === 'challenging') && (
                <li>• Include extra mobility work</li>
              )}
              {allGenes.length > 0 && !allGenes.some(g => ['ACTN3', 'ACE'].includes(g.gene)) && (
                <li>• Balanced training approach recommended</li>
              )}
            </ul>
          </div>

          {/* Nutrition Recommendations */}
          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
              <span className="text-lg">🥗</span>
              Nutrition Focus
            </h4>
            <ul className="text-sm text-green-700 space-y-1">
              {allGenes.some(g => g.gene === 'MTHFR' && getAnyGeneAnalysis(g.gene, g.genotype).impact === 'challenging') && (
                <li>• Consider methylated B vitamins</li>
              )}
              {allGenes.some(g => g.gene === 'PPARGC1A' && getAnyGeneAnalysis(g.gene, g.genotype).impact === 'beneficial') && (
                <li>• Higher carbohydrate tolerance</li>
              )}
              {allGenes.some(g => g.gene === 'FTO' && getAnyGeneAnalysis(g.gene, g.genotype).impact === 'challenging') && (
                <li>• Mindful portion control</li>
              )}
              {allGenes.length > 0 && !allGenes.some(g => ['MTHFR', 'PPARGC1A', 'FTO'].includes(g.gene)) && (
                <li>• Standard nutritional guidelines</li>
              )}
            </ul>
          </div>

          {/* Recovery Recommendations */}
          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
            <h4 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
              <span className="text-lg">😴</span>
              Recovery Focus
            </h4>
            <ul className="text-sm text-purple-700 space-y-1">
              {allGenes.some(g => g.gene === 'BDNF' && getAnyGeneAnalysis(g.gene, g.genotype).impact === 'beneficial') && (
                <li>• Excellent neuroplasticity for learning</li>
              )}
              {allGenes.some(g => g.gene === 'COMT' && getAnyGeneAnalysis(g.gene, g.genotype).impact === 'challenging') && (
                <li>• May need longer recovery periods</li>
              )}
              {allGenes.some(g => g.gene === 'PER3' && g.genotype === '4/4') && (
                <li>• Morning chronotype - early training optimal</li>
              )}
              {allGenes.length > 0 && !allGenes.some(g => ['BDNF', 'COMT', 'PER3'].includes(g.gene)) && (
                <li>• Standard recovery protocols</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Rugby Coach & Physio Toolkit */}
      <div className="card-enhanced p-6 mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
          <span className="bg-gradient-to-r from-orange-100 to-red-100 p-2 rounded-full">🏉</span>
          Rugby Coach & Physio Toolkit
        </h3>

        {/* Trait Scores */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {rugbyTraits.map(trait => {
            const score = computeTraitScore(trait.genes);
            return (
              <div key={trait.key} className="p-4 rounded-lg border card-enhanced">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{trait.icon}</span>
                    <div className="text-sm font-semibold text-gray-900">{trait.label}</div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold border ${scoreBadgeClass(score)}`}>{score}</span>
                </div>
                <ul className="text-xs text-gray-700 space-y-1">
                  {trait.key === 'power' && (
                    <>
                      <li>• Heavy eccentrics/contrast if score ≥ 70</li>
                      <li>• Technique focus, progressive load if score &lt; 50</li>
                    </>
                  )}
                  {trait.key === 'endurance' && (
                    <>
                      <li>• Repeat sprints 6–10×30–40 m if score ≥ 60</li>
                      <li>• Extra aerobic base/tempo if score &lt; 50</li>
                    </>
                  )}
                  {trait.key === 'recovery' && (
                    <>
                      <li>• 48–72h between collision-heavy sessions if score &lt; 50</li>
                      <li>• Morning HRV check-in on contact days</li>
                    </>
                  )}
                  {trait.key === 'tissue' && (
                    <>
                      <li>• Tendon prep: isometrics, nordics 2×/week</li>
                      <li>• Avoid weekly sRPE spikes if score &lt; 50</li>
                    </>
                  )}
                  {trait.key === 'concussion' && (
                    <>
                      <li>• Neck strength 2–3×/week; strict HIA protocol</li>
                      <li>• Folate/B12 focus if MTHFR variants present</li>
                    </>
                  )}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Physio Watchlist */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Physio Watchlist</h4>
            <div className="space-y-2">
              {tissueWatchlistGenes.map((gene) => {
                const match = allGenes.find(g => g.gene === gene);
                const analysis = match ? getAnyGeneAnalysis(match.gene, match.genotype) : { impact: 'unknown', description: 'No data', color: 'gray' };
                const impact = analysis.impact as 'beneficial' | 'neutral' | 'challenging' | 'unknown';
                const color =
                  impact === 'challenging' ? 'text-red-700 bg-red-50 border-red-200' :
                  impact === 'beneficial' ? 'text-green-700 bg-green-50 border-green-200' :
                  'text-yellow-700 bg-yellow-50 border-yellow-200';
                return (
                  <div key={gene} className={`flex items-center justify-between p-2 rounded border ${color}`}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{gene}</span>
                      <span className="font-mono text-gray-600 text-xs">{match?.genotype || '—'}</span>
                    </div>
                    <span className="text-xs font-semibold capitalize">{impact}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Return-to-Play Flags */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Return-to-Play Flags</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• High tissue risk or low recovery score: limit collisions and sharp decelerations</li>
              <li>• Concussion risk variants present: gradated contact exposure and strict monitoring</li>
              <li>• Elevated inflammation profile (IL6/CRP): manage training load and recovery modalities</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Summary Insights */}
      <section className="card-enhanced p-8 bg-gradient-to-r from-blue-50 to-purple-50">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">📊 Genetic Profile Summary</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {allGenes.filter(g => getAnyGeneAnalysis(g.gene, g.genotype).impact === 'beneficial').length}
            </div>
            <div className="text-lg font-semibold text-green-800">Beneficial Variants</div>
            <div className="text-sm text-green-600">Genetic advantages identified</div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600 mb-2">
              {allGenes.filter(g => getAnyGeneAnalysis(g.gene, g.genotype).impact === 'neutral').length}
            </div>
            <div className="text-lg font-semibold text-yellow-800">Neutral Variants</div>
            <div className="text-sm text-yellow-600">Average genetic profile</div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-red-600 mb-2">
              {allGenes.filter(g => getAnyGeneAnalysis(g.gene, g.genotype).impact === 'challenging').length}
            </div>
            <div className="text-lg font-semibold text-red-800">Areas for Attention</div>
            <div className="text-sm text-red-600">Potential optimization opportunities</div>
          </div>
        </div>

        <div className="text-center text-gray-700">
          <p className="text-lg mb-2">
            This comprehensive genetic analysis provides personalized insights into your athletic potential,
            health risks, and optimization strategies.
          </p>
          <p className="text-sm text-gray-600">
            Remember: Genetics are one piece of the puzzle. Lifestyle, training, and nutrition play crucial roles
            in maximizing your genetic potential.
          </p>
        </div>
      </section>
    </div>
  );
};

export default ComprehensiveGeneticAnalysis;