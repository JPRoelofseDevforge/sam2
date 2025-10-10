import React, { useMemo, useState } from 'react';
import {
  Activity,
  HeartPulse,
  Leaf,
  ShieldAlert,
  Pill as PillIcon,
  Sparkles,
  Filter,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';
import { motion } from 'framer-motion';

type RiskLevel = 'High' | 'Moderate' | 'Low';

type WatchEntry = {
  category: string;
  item: string;
  interactions: string;
  guidance: string;
  risk: RiskLevel;
};

const WATCHLIST: WatchEntry[] = [
  {
    category: 'Recovery',
    item: 'NSAIDs (e.g., Ibuprofen, Celebrex)',
    interactions:
      'Alcohol: Adds stomach irritation and increased bleed risk.\n' +
      'Cortisone (prednisone, cortisone injections): Increased risk of gastrointestinal irritation\n' +
      'Dehydration: Risk of kidney strain',
    guidance:
      'Use the lowest effective dose for the shortest time. Take with food + fluids (water). Avoid alcohol while on NSAID therapy. Consider stomach protection. Maintain good hydration.',
    risk: 'High',
  },
  {
    category: 'Recovery',
    item: 'Paracetamol (Panado)',
    interactions:
      'Alcohol (excess/binge): risk of liver strain (esp. high doses or chronic use).',
    guidance:
      'Keep total paracetamol dose ≤4 g/day (adults). Avoid heavy drinking; if regular alcohol use, keep paracetamol doses conservative.',
    risk: 'Moderate',
  },
  {
    category: 'Recovery',
    item: 'Codeine combos (Myprodol, Mybulen)',
    interactions: 'Alcohol / sedating antihistamines: Risk of drowsiness',
    guidance: 'Avoid combination before or during training/matches.',
    risk: 'High',
  },
  {
    category: 'Recovery/ Readiness',
    item: 'Caffeine (coffee, energy drinks, chocolate, pre-workouts)',
    interactions:
      'Excess: anxiety, poor sleep;\n' +
      'With pre-workout stimulants: Risk feeling jittery/ increased heart rate',
    guidance: 'Safe in moderation; avoid late use. Track sleep/HRV.',
    risk: 'Moderate',
  },
  {
    category: 'Recovery/ Readiness',
    item: 'Alcohol',
    interactions:
      'Risk of slower recovery; Increased bleed risk with NSAIDs; increased liver strain with Panado',
    guidance:
      'Avoid for 24–48 h after acute knocks/sprains. Avoid before training/competition',
    risk: 'High',
  },
  {
    category: 'Recovery',
    item: 'Acidic foods (citrus, vinegar, pickles)',
    interactions: 'Can worsen NSAID-related stomach upset',
    guidance: 'Take NSAIDs with non-acidic food/water',
    risk: 'Moderate',
  },
  {
    category: 'Recovery',
    item: 'Sedating antihistamines (Allergex, diphenhydramine)',
    interactions:
      'Drowsy, slower reaction times. Additive drowsiness with alcohol/codeine',
    guidance: 'Prefer non-drowsy antihistamine options for training days',
    risk: 'Moderate',
  },
  {
    category: 'Readiness',
    item: 'Creatine',
    interactions: 'Co-ingested high caffeine may blunt effect in some athletes',
    guidance:
      'Separate caffeine and creatine doses by several hours; hydrate well',
    risk: 'Low',
  },
  {
    category: 'Sustainability',
    item: 'Omega-3 / Fish oil',
    interactions: 'Possible bleeding risk with NSAIDs or blood thinners',
    guidance: 'Usually low risk',
    risk: 'Moderate',
  },
  {
    category: 'Injury Risk',
    item: 'Iron tablets / high iron foods',
    interactions:
      'May reduce tetracycline (e.g., doxycycline) and fluoroquinolone (e.g., ciprofloxacin) antibiotic absorption. Also competes with calcium absorption if taken together.',
    guidance:
      'Take iron at least 2 hours before or 4–6 hours after the antibiotic.\n' +
      'If both iron and calcium supplementation are required daily, take iron on an empty stomach or with vitamin C-rich foods (e.g. orange juice) to enhance uptake, and calcium with meals later in the day.',
    risk: 'Moderate',
  },
  {
    category: 'Injury Risk',
    item: 'Calcium-rich foods (milk, cheese, yoghurt)',
    interactions:
      'May reduce tetracycline (e.g., doxycycline) and fluoroquinolone (e.g., ciprofloxacin) antibiotic absorption. Also competes with iron absorption if taken together.',
    guidance:
      'Avoid dairy products within 2 hours of antibiotic dosing. Use water instead of milk for administration of antibiotic.\n' +
      'If both iron and calcium supplementation are required daily, take iron on an empty stomach or with vitamin C-rich foods (e.g. orange juice) to enhance uptake, and calcium with meals later in the day.',
    risk: 'Moderate',
  },
  {
    category: 'Injury Risk',
    item: 'Magnesium supplements',
    interactions:
      'May reduce tetracycline (e.g., doxycycline) and fluoroquinolone (e.g., ciprofloxacin) antibiotic absorption',
    guidance:
      'Separate magnesium or magnesium containing antacid use by at least 2–4 hours from antibiotic intake.',
    risk: 'Moderate',
  },
];

const RISK_ORDER: Record<RiskLevel, number> = { High: 3, Moderate: 2, Low: 1 };

const riskChip = (risk: RiskLevel) => {
  switch (risk) {
    case 'High':
      return 'bg-rose-100 text-rose-800 border-rose-200';
    case 'Moderate':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Low':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const riskRibbon = (risk: RiskLevel) => {
  switch (risk) {
    case 'High':
      return 'from-rose-500 to-rose-400';
    case 'Moderate':
      return 'from-amber-500 to-amber-400';
    case 'Low':
      return 'from-emerald-500 to-emerald-400';
    default:
      return 'from-gray-500 to-gray-400';
  }
};

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  Recovery: <HeartPulse className="h-5 w-5 text-rose-600" />,
  Readiness: <Activity className="h-5 w-5 text-blue-600" />,
  'Recovery/ Readiness': <Activity className="h-5 w-5 text-indigo-600" />,
  Sustainability: <Leaf className="h-5 w-5 text-emerald-600" />,
  'Injury Risk': <ShieldAlert className="h-5 w-5 text-amber-600" />,
};
const iconForCategory = (name: string) =>
  CATEGORY_ICON[name] ?? <PillIcon className="h-5 w-5 text-gray-600" />;

const TAGS = [
  { slug: 'alcohol', label: 'Alcohol' },
  { slug: 'nsaids', label: 'NSAIDs' },
  { slug: 'caffeine', label: 'Caffeine' },
  { slug: 'antibiotics', label: 'Antibiotics' },
  { slug: 'calcium', label: 'Calcium' },
  { slug: 'magnesium', label: 'Magnesium' },
  { slug: 'iron', label: 'Iron' },
  { slug: 'cortisone', label: 'Cortisone' },
  { slug: 'dehydration', label: 'Dehydration' },
];

function extractTags(entry: WatchEntry): string[] {
  const text = `${entry.item} ${entry.interactions} ${entry.guidance}`.toLowerCase();
  const map: Record<string, RegExp> = {
    alcohol: /\balcohol\b/,
    nsaids: /\bnsaid|ibuprofen|celebrex|naproxen\b/,
    caffeine: /\bcaffeine|coffee|energy\s*drinks|pre-?workout\b/,
    antibiotics: /\bantibiotic|tetracycline|doxycycline|ciprofloxacin|fluoroquinolone\b/,
    calcium: /\bcalcium|dairy|milk|cheese|yoghurt\b/,
    magnesium: /\bmagnesium\b/,
    iron: /\biron\b/,
    cortisone: /\bcortisone|prednisone\b/,
    dehydration: /\bdehydration\b/,
  };
  return TAGS.filter((t) => map[t.slug].test(text)).map((t) => t.slug);
}

const TagChip: React.FC<{ label: string; active?: boolean; onClick?: () => void }> = ({
  label,
  active,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 text-xs rounded-full border transition ${
      active
        ? 'bg-gray-900 text-white border-gray-900'
        : 'bg-white/70 text-gray-700 border-gray-300 hover:bg-gray-50'
    }`}
  >
    {label}
  </button>
);

const RiskBadge: React.FC<{ risk: RiskLevel }> = ({ risk }) => (
  <span className={`text-[11px] px-2 py-1 rounded-full border ${riskChip(risk)}`}>{risk}</span>
);

const KpiTile: React.FC<{ label: string; value: number; icon: React.ReactNode }> = ({
  label,
  value,
  icon,
}) => (
  <div className="rounded-2xl bg-white/15 border border-white/25 p-4 shadow-sm flex items-center gap-3">
    <div className="h-9 w-9 rounded-xl bg-white/20 border border-white/25 flex items-center justify-center text-white">
      {icon}
    </div>
    <div>
      <div className="text-[11px] uppercase tracking-wide text-white/80">{label}</div>
      <div className="mt-0.5 text-2xl font-semibold text-white">{value}</div>
    </div>
  </div>
);

function highlight(text: string) {
  if (!text) return null;
  const KEYS = [
    'Alcohol',
    'NSAIDs',
    'Caffeine',
    'Antibiotic',
    'Tetracycline',
    'Fluoroquinolone',
    'Cortisone',
    'Dehydration',
    'Calcium',
    'Magnesium',
    'Iron',
    'Panado',
    'Paracetamol',
    'Codeine',
    'Ibuprofen',
    'Celebrex',
  ];
  const regex = new RegExp(`(${KEYS.join('|')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    KEYS.some((k) => k.toLowerCase() === part.toLowerCase()) ? (
      <mark key={i} className="bg-yellow-100 text-yellow-900 rounded px-1">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export const PharmaCoWatchlist: React.FC = () => {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | string>('All');
  const [riskFilter, setRiskFilter] = useState<'All' | RiskLevel>('All');
  const [tagFilter, setTagFilter] = useState<'All' | string>('All');
  const [view, setView] = useState<'cards' | 'table'>('cards');

  const categories = useMemo(() => {
    const set = new Set<string>();
    WATCHLIST.forEach((r) => set.add(r.category));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return WATCHLIST.filter((r) => (categoryFilter === 'All' ? true : r.category === categoryFilter))
      .filter((r) => (riskFilter === 'All' ? true : r.risk === riskFilter))
      .filter((r) => {
        if (tagFilter === 'All') return true;
        return extractTags(r).includes(tagFilter);
      })
      .filter((r) => {
        if (!q) return true;
        const hay = `${r.item} ${r.interactions} ${r.guidance} ${r.category}`.toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => {
        const riskDiff = (RISK_ORDER[b.risk] ?? 0) - (RISK_ORDER[a.risk] ?? 0);
        if (riskDiff !== 0) return riskDiff;
        const cat = a.category.localeCompare(b.category);
        if (cat !== 0) return cat;
        return a.item.localeCompare(b.item);
      });
  }, [query, categoryFilter, riskFilter, tagFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, WatchEntry[]>();
    filtered.forEach((r) => {
      const key = r.category || 'Uncategorized';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const counts = useMemo(() => {
    const c = { High: 0, Moderate: 0, Low: 0 } as Record<RiskLevel, number>;
    filtered.forEach((r) => c[r.risk]++);
    return c;
  }, [filtered]);

  const keyWarnings = useMemo(() => {
    const score = (r: WatchEntry) => (r.risk === 'High' ? 3 : r.risk === 'Moderate' ? 2 : 1);
    const sig = (r: WatchEntry) =>
      /alcohol|nsaid|codeine|fluoroquinolone|tetracycline/i.test(
        `${r.item} ${r.interactions}`
      );
    return WATCHLIST.filter((r) => r.risk === 'High' || sig(r))
      .sort((a, b) => score(b) - score(a))
      .slice(0, 4);
  }, []);

  return (
    <div className="relative min-h-screen">
      {/* Full-page gradient background */}
      <div className="fixed inset-0 -z-50 bg-gradient-to-b from-violet-700 via-indigo-700 to-blue-800" />

      {/* Background aesthetics */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-violet-400/30 blur-3xl" />
        <div className="absolute top-40 -right-24 h-72 w-72 rounded-full bg-indigo-400/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-blue-400/20 blur-3xl" />
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-700 via-indigo-700 to-blue-700" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-3 text-indigo-100">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm tracking-wide">Safety Reference</span>
          </div>
          <h1 className="mt-1 bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent text-[28px] sm:text-[36px] font-semibold tracking-tight">
            Pharma Interactions & Safety
          </h1>
          <p className="mt-2 text-indigo-100/90 max-w-2xl">
            Coach-friendly guidance to avoid adverse interactions and support safe performance.
          </p>

          {/* KPI Row */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiTile label="Total Items" value={filtered.length} icon={<BookOpen className="h-5 w-5" />} />
            <KpiTile label="High Risk" value={counts.High} icon={<AlertTriangle className="h-5 w-5" />} />
            <KpiTile label="Moderate Risk" value={counts.Moderate} icon={<ShieldAlert className="h-5 w-5" />} />
            <KpiTile label="Low Risk" value={counts.Low} icon={<Leaf className="h-5 w-5" />} />
          </div>

          {/* Quick warning tiles */}
          {keyWarnings.length > 0 && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {keyWarnings.map((w, idx) => (
                <motion.div
                  key={`${w.item}-${idx}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.05 }}
                  className="rounded-2xl bg-white/15 border border-white/25 p-4 text-white shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-white/20 border border-white/25 flex items-center justify-center">
                        {iconForCategory(w.category)}
                      </div>
                      <div className="text-sm font-semibold leading-tight line-clamp-2">{w.item}</div>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/15 border border-white/25">
                      {w.risk}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-indigo-100/90 line-clamp-3">{w.interactions}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Controls (sticky) */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="sticky top-16 z-20">
          <div className="rounded-2xl bg-white/90 backdrop-blur border border-gray-200 shadow-lg p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              {/* Search */}
              <div className="relative flex-1">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search item, interaction, or guidance..."
                  className="w-full h-11 pl-10 pr-3 rounded-xl border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Search"
                />
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>

              {/* View toggle */}
              <div className="inline-flex rounded-xl border border-gray-300 overflow-hidden">
                <button
                  onClick={() => setView('cards')}
                  className={`px-4 py-2 text-sm ${view === 'cards' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700'}`}
                  aria-pressed={view === 'cards'}
                >
                  Cards
                </button>
                <button
                  onClick={() => setView('table')}
                  className={`px-4 py-2 text-sm ${view === 'table' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700'}`}
                  aria-pressed={view === 'table'}
                >
                  Table
                </button>
              </div>

              {/* Category */}
              <div>
                <label className="sr-only" htmlFor="category">
                  Category
                </label>
                <select
                  id="category"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="h-11 rounded-xl border border-gray-300 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="All">All categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Risk group */}
              <div className="inline-flex rounded-xl border border-gray-300 overflow-hidden">
                {(['All', 'High', 'Moderate', 'Low'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRiskFilter(r as any)}
                    className={`px-3 py-2 text-sm ${
                      riskFilter === r ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'
                    }`}
                    aria-pressed={riskFilter === r}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick tags */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs text-gray-500 mr-1">Quick filters:</span>
              <TagChip label="All" active={tagFilter === 'All'} onClick={() => setTagFilter('All')} />
              {TAGS.map((t) => (
                <TagChip
                  key={t.slug}
                  label={t.label}
                  active={tagFilter === t.slug}
                  onClick={() => setTagFilter(t.slug)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="py-10">
          {filtered.length === 0 && (
            <div className="text-center text-white/90">No entries match your filters.</div>
          )}

          {filtered.length > 0 && view === 'cards' && (
            <div className="space-y-12">
              {grouped.map(([cat, items]) => (
                <section key={cat}>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-white border border-gray-200 shadow-sm">
                      {iconForCategory(cat)}
                    </div>
                    <h2 className="text-xl font-semibold text-white">
                      {cat} <span className="text-sm text-indigo-100/80">({items.length})</span>
                    </h2>
                    <div className="ml-auto hidden md:flex items-center gap-2">
                      <span className="text-xs text-indigo-100/80">Legend:</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full border bg-rose-100 text-rose-800 border-rose-200">
                        High
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full border bg-amber-100 text-amber-800 border-amber-200">
                        Moderate
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full border bg-emerald-100 text-emerald-800 border-emerald-200">
                        Low
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
                    {items.map((r, idx) => {
                      const tags = extractTags(r);
                      return (
                        <motion.article
                          key={`${r.item}-${idx}`}
                          initial={{ opacity: 0, y: 12, scale: 0.98 }}
                          whileInView={{ opacity: 1, y: 0, scale: 1 }}
                          viewport={{ once: true, amount: 0.2 }}
                          transition={{ duration: 0.28, delay: idx * 0.03 }}
                          className="group rounded-2xl bg-white/95 shadow-xl ring-1 ring-black/5 overflow-hidden border border-gray-200 hover:shadow-2xl hover:-translate-y-0.5 transition"
                        >
                          {/* Ribbon */}
                          <div
                            className={`h-1 w-full bg-gradient-to-r ${riskRibbon(r.risk)}`}
                            aria-hidden
                          />
                          <div className="p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-gray-50 border border-gray-200">
                                  {iconForCategory(r.category)}
                                </div>
                                <div>
                                  <h3 className="text-[15px] font-semibold text-gray-900 leading-tight">
                                    {r.item}
                                  </h3>
                                  <div className="mt-0.5 text-xs text-gray-500">{r.category}</div>
                                </div>
                              </div>
                              <RiskBadge risk={r.risk} />
                            </div>

                            {r.interactions && (
                              <div className="mt-4">
                                <div className="text-[11px] uppercase tracking-wide text-gray-500">
                                  Possible interactions
                                </div>
                                <p className="mt-1 text-sm text-gray-800 whitespace-pre-line leading-relaxed">
                                  {highlight(r.interactions)}
                                </p>
                              </div>
                            )}

                            {r.guidance && (
                              <div className="mt-4">
                                <div className="text-[11px] uppercase tracking-wide text-gray-500">
                                  Guidance
                                </div>
                                <p className="mt-1 text-sm text-gray-800 whitespace-pre-line leading-relaxed">
                                  {highlight(r.guidance)}
                                </p>
                              </div>
                            )}

                            {tags.length > 0 && (
                              <div className="mt-5 flex flex-wrap gap-1.5">
                                {tags.map((t) => {
                                  const label = TAGS.find((x) => x.slug === t)?.label ?? t;
                                  return (
                                    <span
                                      key={t}
                                      className="px-2 py-0.5 text-[11px] rounded-full bg-gray-50 text-gray-700 border border-gray-200"
                                    >
                                      {label}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </motion.article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}

          {filtered.length > 0 && view === 'table' && (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white/95 backdrop-blur rounded-2xl border border-gray-200 shadow-xl">
                <thead className="bg-gray-50 sticky top-[calc(4rem+1.5rem)]">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-3">
                      Category
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-3">
                      Item
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-3">
                      Interactions
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-3">
                      Guidance
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-3">
                      Risk
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filtered.map((r, idx) => (
                    <tr key={`${r.item}-row-${idx}`} className="hover:bg-gray-50/60">
                      <td className="p-3 align-top">
                        <div className="inline-flex items-center gap-2">
                          <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-gray-100 border border-gray-200">
                            {iconForCategory(r.category)}
                          </span>
                          <span className="text-sm text-white">{r.category}</span>
                        </div>
                      </td>
                      <td className="p-3 align-top font-medium text-gray-900">{r.item}</td>
                      <td className="p-3 align-top whitespace-pre-line text-gray-800">{r.interactions}</td>
                      <td className="p-3 align-top whitespace-pre-line text-gray-800">{r.guidance}</td>
                      <td className="p-3 align-top">
                        <RiskBadge risk={r.risk} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Disclaimer */}
          <div className="mt-12 text-xs text-indigo-100/90 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-indigo-100/90" />
            <span>
              This guide is informational and not a substitute for medical advice. Always consult team medical staff for
              individual decisions.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmaCoWatchlist;