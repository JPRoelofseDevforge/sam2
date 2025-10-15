import React, { useEffect, useMemo, useState } from 'react';
import { Athlete } from '../types';
import { athleteService, injuryService } from '../services/dataService';

type Injury = {
  id: number;
  athleteId: number;
  dateOfInjury: string;
  diagnosis: string;
  bodyArea?: string;
  laterality?: string;
  mechanism?: string;
  severity?: string;
  isConcussion?: boolean;
  hIAFlag?: boolean; // API returns HIAFlag, but protect optional casing differences
  hIAFlagAlt?: boolean;
  concussionStage?: string;
  rTPStage?: string;
  status: string;
  returnDatePlanned?: string;
  returnDateActual?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

type Query = {
  athleteId?: number;
  status?: string;
  isConcussion?: boolean;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
};

const defaultQuery: Query = {
  page: 1,
  limit: 50,
};

const toIsoDate = (d?: Date | string | null) => {
  try {
    if (!d) return '';
    const date = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
  } catch {
    return '';
  }
};

const fmt = (s?: string | number | boolean | null) => {
  if (s === null || s === undefined) return '';
  if (typeof s === 'boolean') return s ? 'Yes' : 'No';
  return String(s);
};

export const InjurySurveillance: React.FC = () => {
  // Filters
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [query, setQuery] = useState<Query>(defaultQuery);
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<Injury[]>([]);
  const [total, setTotal] = useState(0);

  // Create modal
  const [openCreate, setOpenCreate] = useState(false);
  const [createData, setCreateData] = useState({
    AthleteId: 0,
    Diagnosis: '',
    DateOfInjury: toIsoDate(new Date()),
    BodyArea: '',
    Laterality: '',
    Mechanism: '',
    Severity: '',
    IsConcussion: false,
    HIAFlag: false,
    ConcussionStage: '',
    RTPStage: '',
    Status: 'Open',
    ReturnDatePlanned: '',
    Notes: '',
  });

  const loadAthletes = async () => {
    try {
      const res = await athleteService.getAllAthletes(1, 2000);
      setAthletes(res?.athletes || []);
    } catch {
      setAthletes([]);
    }
  };

  const loadInjuries = async () => {
    setLoading(true);
    try {
      const res = await injuryService.getInjuries(query);
      setList(res.items || []);
      setTotal(res.total || 0);
    } catch {
      setList([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAthletes();
  }, []);

  useEffect(() => {
    loadInjuries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(query)]);

  const athleteMap = useMemo(() => {
    const m = new Map<number, Athlete>();
    for (const a of athletes) m.set(a.id, a);
    return m;
  }, [athletes]);

  const onChangeQuery = (patch: Partial<Query>) => {
    setQuery(prev => ({ ...prev, ...patch, page: 1 }));
  };

  const resetFilters = () => setQuery(defaultQuery);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createData.AthleteId || !createData.Diagnosis) return;
    try {
      await injuryService.create({
        AthleteId: createData.AthleteId,
        Diagnosis: createData.Diagnosis,
        DateOfInjury: createData.DateOfInjury,
        BodyArea: createData.BodyArea || undefined,
        Laterality: createData.Laterality || undefined,
        Mechanism: createData.Mechanism || undefined,
        Severity: createData.Severity || undefined,
        IsConcussion: createData.IsConcussion,
        HIAFlag: createData.HIAFlag,
        ConcussionStage: createData.ConcussionStage || undefined,
        RTPStage: createData.RTPStage || undefined,
        Status: createData.Status || 'Open',
        ReturnDatePlanned: createData.ReturnDatePlanned || undefined,
        Notes: createData.Notes || undefined,
      });
      setOpenCreate(false);
      setCreateData({
        ...createData,
        Diagnosis: '',
        BodyArea: '',
        Laterality: '',
        Mechanism: '',
        Severity: '',
        IsConcussion: false,
        HIAFlag: false,
        ConcussionStage: '',
        RTPStage: '',
        Status: 'Open',
        ReturnDatePlanned: '',
        Notes: '',
      });
      await loadInjuries();
    } catch {
      // no-op; could surface toast
    }
  };

  const updateHIA = async (inj: Injury) => {
    const stage = window.prompt('Enter Concussion/HIA Stage (e.g., HIA1, HIA2, HIA3):', inj.concussionStage || '');
    if (stage === null) return;
    const hiaStr = window.prompt('Is HIA Flag set? (yes/no):', (inj.hIAFlag || inj.hIAFlagAlt) ? 'yes' : 'no');
    const notes = window.prompt('Optional notes:', inj.notes || '');
    try {
      await injuryService.updateHia(inj.id, {
        ConcussionStage: stage || undefined,
        HIAFlag: hiaStr?.toLowerCase() === 'yes',
        Notes: notes || undefined,
      });
      await loadInjuries();
    } catch {
      // no-op
    }
  };

  const updateRTP = async (inj: Injury) => {
    const stage = window.prompt('Enter RTP Stage (OffField, Modified, Non-Contact, Contact, Full):', inj.rTPStage || '');
    if (stage === null) return;
    const dateStr = window.prompt('Planned Return Date (YYYY-MM-DD), leave empty to keep:', inj.returnDatePlanned || '');
    try {
      await injuryService.updateRtp(inj.id, {
        RTPStage: stage || undefined,
        ReturnDatePlanned: dateStr || undefined,
      });
      await loadInjuries();
    } catch {
      // no-op
    }
  };

  const resolveInjury = async (inj: Injury) => {
    const dateStr = window.prompt('Actual Return Date (YYYY-MM-DD), leave empty for today:', toIsoDate(new Date()));
    try {
      await injuryService.resolve(inj.id, {
        ReturnDateActual: dateStr || undefined,
      });
      await loadInjuries();
    } catch {
      // no-op
    }
  };

  const deleteInjury = async (inj: Injury) => {
    if (!window.confirm(`Delete injury #${inj.id} for ${athleteMap.get(inj.athleteId)?.name || inj.athleteId}?`)) return;
    try {
      await injuryService.remove(inj.id);
      await loadInjuries();
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
            <h2 className="text-2xl font-bold text-black">🩺 Injury Surveillance</h2>
            <p className="text-sm text-gray-700 mt-1">Log, track, and manage injuries with HIA and RTP workflows.</p>
          </div>
          <button
            onClick={() => setOpenCreate(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200"
          >
            + New Injury
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card-enhanced p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Athlete</label>
            <select
              value={query.athleteId ?? ''}
              onChange={(e) => onChangeQuery({ athleteId: e.target.value ? Number(e.target.value) : undefined })}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={query.status ?? ''}
              onChange={(e) => onChangeQuery({ status: e.target.value || undefined })}
              className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All</option>
              <option value="Open">Open</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Concussion</label>
            <select
              value={typeof query.isConcussion === 'boolean' ? String(query.isConcussion) : ''}
              onChange={(e) => {
                if (!e.target.value) onChangeQuery({ isConcussion: undefined });
                else onChangeQuery({ isConcussion: e.target.value === 'true' });
              }}
              className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All</option>
              <option value="true">Only Concussion</option>
              <option value="false">Exclude Concussion</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
            <input
              type="date"
              value={query.startDate ?? ''}
              onChange={(e) => onChangeQuery({ startDate: e.target.value || undefined })}
              className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
            <input
              type="date"
              value={query.endDate ?? ''}
              onChange={(e) => onChangeQuery({ endDate: e.target.value || undefined })}
              className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200"
              onClick={() => onChangeQuery({})}
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
          <div className="text-sm text-gray-300">
            Total: {total}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="card-enhanced p-6">
        <div className="mb-4 text-sm font-medium text-gray-700">Injuries</div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-400">Loading injuries...</span>
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-lg mb-2">No injuries recorded.</div>
            <p className="text-sm text-gray-500">Click "New Injury" to add the first injury record.</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-[1000px] w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Athlete</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Diagnosis</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Body Area</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Laterality</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Mechanism</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">HIA</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">RTP</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {list.map((inj) => {
                  const athlete = athleteMap.get(inj.athleteId);
                  const hia = (inj.hIAFlag || inj.hIAFlagAlt) ? 'Yes' : (inj.isConcussion ? 'Concussion' : 'No');
                  return (
                    <tr key={inj.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-900">{fmt(toIsoDate(inj.dateOfInjury))}</td>
                      <td className="px-4 py-3">
                        <div className="text-gray-900 font-medium">{athlete?.name || `Athlete ${inj.athleteId}`}</div>
                        <div className="text-xs text-gray-500">{athlete?.sport || 'Unknown Sport'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-900 font-medium">{fmt(inj.diagnosis) || 'No diagnosis'}</div>
                        {inj.notes ? <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">{inj.notes}</div> : null}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-900">{fmt(inj.bodyArea) || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-900">{fmt(inj.laterality) || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-900">{fmt(inj.mechanism) || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          inj.severity === 'Severe' ? 'bg-red-100 text-red-800' :
                          inj.severity === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                          inj.severity === 'Minor' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {fmt(inj.severity) || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-gray-900 font-medium">{hia}</div>
                        {!!inj.concussionStage && <div className="text-xs text-gray-500">{inj.concussionStage}</div>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-gray-900 font-medium">{fmt(inj.rTPStage) || '-'}</div>
                        {!!inj.returnDatePlanned && <div className="text-xs text-gray-500">Plan: {fmt(inj.returnDatePlanned)}</div>}
                        {!!inj.returnDateActual && <div className="text-xs text-gray-500">Actual: {fmt(inj.returnDateActual)}</div>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          inj.status === 'Resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {fmt(inj.status) || 'Open'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          <button
                            className="px-2 py-1 rounded-md bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors duration-200 text-xs"
                            onClick={() => updateHIA(inj)}
                            title="Update Concussion/HIA"
                          >
                            HIA
                          </button>
                          <button
                            className="px-2 py-1 rounded-md bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors duration-200 text-xs"
                            onClick={() => updateRTP(inj)}
                            title="Update RTP"
                          >
                            RTP
                          </button>
                          {inj.status !== 'Resolved' && (
                            <button
                              className="px-2 py-1 rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition-colors duration-200 text-xs"
                              onClick={() => resolveInjury(inj)}
                              title="Resolve"
                            >
                              Resolve
                            </button>
                          )}
                          <button
                            className="px-2 py-1 rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-colors duration-200 text-xs"
                            onClick={() => deleteInjury(inj)}
                            title="Delete"
                          >
                            Delete
                          </button>
                        </div>
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
              <div className="font-semibold text-lg text-gray-900">New Injury</div>
              <button onClick={() => setOpenCreate(false)} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
            </div>
            <form onSubmit={onCreate} className="p-6 space-y-4 max-h-[calc(90vh-120px)] overflow-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Athlete</label>
                  <select
                    required
                    value={createData.AthleteId || ''}
                    onChange={(e) => setCreateData(prev => ({ ...prev, AthleteId: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select athlete</option>
                    {athletes.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Injury</label>
                  <input
                    type="date"
                    value={createData.DateOfInjury}
                    onChange={(e) => setCreateData(prev => ({ ...prev, DateOfInjury: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Diagnosis</label>
                  <input
                    required
                    type="text"
                    value={createData.Diagnosis}
                    onChange={(e) => setCreateData(prev => ({ ...prev, Diagnosis: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Hamstring strain"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Body Area</label>
                  <input
                    type="text"
                    value={createData.BodyArea}
                    onChange={(e) => setCreateData(prev => ({ ...prev, BodyArea: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Hamstring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Laterality</label>
                  <select
                    value={createData.Laterality}
                    onChange={(e) => setCreateData(prev => ({ ...prev, Laterality: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Unknown</option>
                    <option value="Left">Left</option>
                    <option value="Right">Right</option>
                    <option value="Bilateral">Bilateral</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mechanism</label>
                  <select
                    value={createData.Mechanism}
                    onChange={(e) => setCreateData(prev => ({ ...prev, Mechanism: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select</option>
                    <option value="Contact">Contact</option>
                    <option value="Non-contact">Non-contact</option>
                    <option value="Overuse">Overuse</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
                  <select
                    value={createData.Severity}
                    onChange={(e) => setCreateData(prev => ({ ...prev, Severity: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select</option>
                    <option value="Minor">Minor</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Severe">Severe</option>
                  </select>
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={!!createData.IsConcussion}
                      onChange={(e) => setCreateData(prev => ({ ...prev, IsConcussion: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Concussion
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={!!createData.HIAFlag}
                      onChange={(e) => setCreateData(prev => ({ ...prev, HIAFlag: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    HIA Flag
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Concussion Stage</label>
                  <input
                    type="text"
                    value={createData.ConcussionStage}
                    onChange={(e) => setCreateData(prev => ({ ...prev, ConcussionStage: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., HIA1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">RTP Stage</label>
                  <input
                    type="text"
                    value={createData.RTPStage}
                    onChange={(e) => setCreateData(prev => ({ ...prev, RTPStage: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Modified"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Planned Return</label>
                  <input
                    type="date"
                    value={createData.ReturnDatePlanned}
                    onChange={(e) => setCreateData(prev => ({ ...prev, ReturnDatePlanned: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={createData.Notes}
                    onChange={(e) => setCreateData(prev => ({ ...prev, Notes: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Optional notes..."
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

export default InjurySurveillance;