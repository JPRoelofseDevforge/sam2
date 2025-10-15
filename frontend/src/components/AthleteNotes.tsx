
import React, { useEffect, useMemo, useState } from 'react';
import { Athlete, AthleteNote } from '../types';
import { athleteService, athleteNotesService } from '../services/dataService';

type Filters = {
  athleteId?: number;
  category?: string; // Positive | Neutral | Negative
  start?: string; // YYYY-MM-DD
  end?: string;   // YYYY-MM-DD
  search?: string;
};

const defaultFilters: Filters = {
  // Default to all-time (no date filters) to ensure existing DB notes are visible by default
  start: undefined,
  end: undefined,
  category: '',
  search: '',
};

const categories = ['Positive', 'Neutral', 'Negative'] as const;

const fmt = (s?: string | number | null) => (s === undefined || s === null ? '' : String(s));
const toIsoDate = (d?: string | Date) => {
  try {
    if (!d) return '';
    const dt = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(dt.getTime())) return '';
    return dt.toISOString().slice(0, 10);
  } catch { return ''; }
};

export const AthleteNotes: React.FC = () => {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<AthleteNote[]>([]);
  const [total, setTotal] = useState(0);

  // Summary/Trend
  const [summary, setSummary] = useState<{ total: number; byCategory: Record<string, number>; topTags: { tag: string, count: number }[] } | null>(null);
  const [trend, setTrend] = useState<Array<{ bucket: string; total: number; positive: number; neutral: number; negative: number }>>([]);

  // Create Modal
  const [openCreate, setOpenCreate] = useState(false);
  const [createData, setCreateData] = useState({
    AthleteId: 0,
    Category: 'Neutral',
    Title: '',
    Content: '',
    Tags: '',
    Author: '',
  });

  useEffect(() => {
    const loadAthletes = async () => {
      try {
        const res = await athleteService.getAllAthletes(1, 2000);
        setAthletes(res?.athletes || []);
      } catch {
        setAthletes([]);
      }
    };
    loadAthletes();
  }, []);

  const athleteMap = useMemo(() => {
    const m = new Map<number, Athlete>();
    for (const a of athletes) m.set(a.id, a);
    return m;
  }, [athletes]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const res = await athleteNotesService.list({
        athleteId: filters.athleteId,
        category: filters.category || undefined,
        start: filters.start,
        end: filters.end,
        search: filters.search || undefined,
        page: 1,
        limit: 500,
      });
      setList((res.items || []) as AthleteNote[]);
      setTotal(res.total || 0);
    } catch {
      setList([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    try {
      const s = await athleteNotesService.reportSummary({
        athleteId: filters.athleteId,
        start: filters.start,
        end: filters.end,
      });
      setSummary({
        total: Number(s?.total ?? 0),
        byCategory: s?.byCategory ?? {},
        topTags: Array.isArray(s?.topTags?.$values) ? s.topTags.$values : (s?.topTags ?? []),
      });
    } catch {
      setSummary(null);
    }

    try {
      const t = await athleteNotesService.reportTrend({
        athleteId: filters.athleteId,
        start: filters.start,
        end: filters.end,
        interval: 'month',
      });
      setTrend(Array.isArray(t) ? (t as any) : []);
    } catch {
      setTrend([]);
    }
  };

  useEffect(() => {
    loadNotes();
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  const onChangeFilters = (patch: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...patch }));
  };

  const resetFilters = () => setFilters(defaultFilters);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createData.AthleteId) return;
    try {
      await athleteNotesService.create({
        AthleteId: createData.AthleteId,
        Category: createData.Category || 'Neutral',
        Title: createData.Title || undefined,
        Content: createData.Content || undefined,
        Tags: createData.Tags || undefined,
        Author: createData.Author || undefined,
      });
      setOpenCreate(false);
      setCreateData({
        AthleteId: 0,
        Category: 'Neutral',
        Title: '',
        Content: '',
        Tags: '',
        Author: '',
      });
      await loadNotes();
      await loadReports();
    } catch {
      // no-op; surface toast if needed
    }
  };

  const deleteNote = async (note: AthleteNote) => {
    if (!window.confirm(`Delete note #${note.id} for ${athleteMap.get(note.athleteId)?.name || note.athleteId}?`)) return;
    try {
      await athleteNotesService.remove(note.id);
      await loadNotes();
      await loadReports();
    } catch {
      // no-op
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-enhanced p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-black">📝 Athlete Notes</h2>
            <p className="text-sm text-gray-700 mt-1">Categorize notes as Positive, Neutral, or Negative. View summaries and trends.</p>
          </div>
          <button
            onClick={() => setOpenCreate(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200"
          >
            + New Note
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card-enhanced p-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Athlete</label>
            <select
              value={filters.athleteId ?? ''}
              onChange={(e) => onChangeFilters({ athleteId: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All</option>
              {athletes.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={filters.category ?? ''}
              onChange={(e) => onChangeFilters({ category: e.target.value || undefined })}
              className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
            <input
              type="date"
              value={filters.start ?? ''}
              onChange={(e) => onChangeFilters({ start: e.target.value || undefined })}
              className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
            <input
              type="date"
              value={filters.end ?? ''}
              onChange={(e) => onChangeFilters({ end: e.target.value || undefined })}
              className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={filters.search ?? ''}
              onChange={(e) => onChangeFilters({ search: e.target.value })}
              className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search title, content, tags or author..."
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200"
              onClick={() => onChangeFilters({})}
            >
              Apply
            </button>
            <button
              className="px-4 py-2 rounded-md bg-gray-600 text-white hover:bg-gray-700 transition-colors duration-200"
              onClick={resetFilters}
            >
              Reset
            </button>
          </div>
          <div className="text-sm text-gray-300">Total: {total}</div>
        </div>
      </div>

      {/* Summary/Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card-enhanced p-6">
          <div className="text-sm font-medium text-gray-700 mb-4">Summary</div>
          <div className="space-y-2">
            <div className="flex justify-between text-gray-800"><span>Total</span><span className="font-semibold">{summary?.total ?? 0}</span></div>
            <div className="flex justify-between text-green-700"><span>Positive</span><span className="font-semibold">{summary?.byCategory?.Positive ?? 0}</span></div>
            <div className="flex justify-between text-gray-700"><span>Neutral</span><span className="font-semibold">{summary?.byCategory?.Neutral ?? 0}</span></div>
            <div className="flex justify-between text-red-700"><span>Negative</span><span className="font-semibold">{summary?.byCategory?.Negative ?? 0}</span></div>
          </div>
        </div>
        <div className="card-enhanced p-6">
          <div className="text-sm font-medium text-gray-700 mb-4">Top Tags</div>
          {summary?.topTags && summary.topTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {summary.topTags.map((t: any) => (
                <span key={t.tag} className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">{t.tag} ({t.count})</span>
              ))}
            </div>
          ) : <div className="text-gray-400 text-sm">No tags</div>}
        </div>
        <div className="card-enhanced p-6">
          <div className="text-sm font-medium text-gray-700 mb-4">Trend (monthly)</div>
          {trend.length === 0 ? (
            <div className="text-gray-400 text-sm">No data</div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="min-w-[500px] w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left">
                    <th className="px-3 py-2 text-xs font-medium text-gray-500">Period</th>
                    <th className="px-3 py-2 text-xs font-medium text-gray-500">Total</th>
                    <th className="px-3 py-2 text-xs font-medium text-green-700">Positive</th>
                    <th className="px-3 py-2 text-xs font-medium text-gray-700">Neutral</th>
                    <th className="px-3 py-2 text-xs font-medium text-red-700">Negative</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {trend.map((b) => (
                    <tr key={b.bucket} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap">{b.bucket}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{b.total}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-green-700">{b.positive}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-700">{b.neutral}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-red-700">{b.negative}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Notes List */}
      <div className="card-enhanced p-6">
        <div className="mb-4 text-sm font-medium text-gray-700">Notes</div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-400">Loading notes...</span>
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-lg mb-2">No notes found.</div>
            <p className="text-sm text-gray-500">Click "New Note" to add the first record.</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-[1000px] w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Athlete</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Title / Content</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {list.map((n) => {
                  const a = athleteMap.get(n.athleteId);
                  const badgeClass =
                    (n.category || '').toLowerCase() === 'positive' ? 'bg-green-100 text-green-800' :
                    (n.category || '').toLowerCase() === 'negative' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800';
                  return (
                    <tr key={n.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-900">{toIsoDate(n.createdAt || '')}</td>
                      <td className="px-4 py-3">
                        <div className="text-gray-900 font-medium">{a?.name || `Athlete ${n.athleteId}`}</div>
                        <div className="text-xs text-gray-500">{a?.sport || 'Unknown Sport'}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeClass}`}>{n.category || 'Neutral'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-900 font-medium">{fmt(n.title) || '-'}</div>
                        {n.content ? <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">{n.content}</div> : null}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-900">{fmt(n.tags) || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-900">{fmt(n.author) || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          className="px-2 py-1 rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-colors duration-200 text-xs"
                          onClick={() => deleteNote(n)}
                          title="Delete"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {openCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
              <div className="font-semibold text-lg text-gray-900">New Note</div>
              <button onClick={() => setOpenCreate(false)} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
            </div>
            <form onSubmit={onCreate} className="p-6 space-y-4 max-h-[calc(90vh-120px)] overflow-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Athlete</label>
                  <select
                    required
                    value={createData.AthleteId || ''}
                    onChange={(e) => setCreateData(prev => ({ ...prev, AthleteId: e.target.value ? Number(e.target.value) : 0 }))}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select athlete</option>
                    {athletes.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={createData.Category}
                    onChange={(e) => setCreateData(prev => ({ ...prev, Category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Positive">Positive</option>
                    <option value="Neutral">Neutral</option>
                    <option value="Negative">Negative</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={createData.Title}
                    onChange={(e) => setCreateData(prev => ({ ...prev, Title: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Optional short title"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                  <textarea
                    value={createData.Content}
                    onChange={(e) => setCreateData(prev => ({ ...prev, Content: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    placeholder="Write your note..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <input
                    type="text"
                    value={createData.Tags}
                    onChange={(e) => setCreateData(prev => ({ ...prev, Tags: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Comma-separated tags (e.g., leadership, rehab)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Author</label>
                  <input
                    type="text"
                    value={createData.Author}
                    onChange={(e) => setCreateData(prev => ({ ...prev, Author: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>
              </div>

              <div className="pt-4 border-t flex items-center justify-end gap-3">
                <button type="button" onClick={() => setOpenCreate(false)} className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-200">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AthleteNotes;