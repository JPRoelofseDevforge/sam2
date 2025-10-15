import React, { useEffect, useMemo, useState } from 'react';
import { Athlete, CalendarEvent } from '../types';
import { athleteService, eventService } from '../services/dataService';

type Filters = {
  athleteId?: number;
  type?: string;
  start?: string; // YYYY-MM-DD
  end?: string;   // YYYY-MM-DD
};

const toLocalDateInput = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fromLocalDateInputToIso = (local?: string) => {
  if (!local) return '';
  const d = new Date(local);
  if (isNaN(d.getTime())) return '';
  return d.toISOString();
};

const formatDateTime = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString();
};

const defaultFilters: Filters = {
  start: new Date().toISOString().slice(0, 10),
  end: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10), // +30 days
};

const eventTypes = ['Training', 'Travel', 'Meeting', 'Competition', 'Other'] as const;

export const EventsCalendar: React.FC = () => {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [total, setTotal] = useState(0);

  // Create Modal
  const [openCreate, setOpenCreate] = useState(false);
  const [createData, setCreateData] = useState({
    Title: '',
    Type: 'Training',
    Description: '',
    Location: '',
    StartUtc: fromLocalDateInputToIso(toLocalDateInput(new Date().toISOString())),
    EndUtc: fromLocalDateInputToIso(toLocalDateInput(new Date(Date.now() + 60 * 60 * 1000).toISOString())), // +1h
    AllDay: false,
    AthleteId: 0 as number | 0,
    OrganizationId: undefined as number | undefined,
    RecurrenceRule: '',
  });

  useEffect(() => {
    const loadAthletes = async () => {
      try {
        const res = await athleteService.getAllAthletes(1, 1000);
        setAthletes(res.athletes || []);
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

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await eventService.getEvents({
        athleteId: filters.athleteId,
        type: filters.type,
        start: filters.start,
        end: filters.end,
        page: 1,
        limit: 500,
      });
      setEvents((res.items || []) as CalendarEvent[]);
      setTotal(res.total || 0);
    } catch {
      setEvents([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Re-fetch whenever filters change
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  const onChangeFilters = (patch: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...patch }));
  };

  const resetFilters = () => setFilters(defaultFilters);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createData.Title) return;
    try {
      await eventService.create({
        Title: createData.Title,
        Type: createData.Type || 'Other',
        Description: createData.Description || undefined,
        Location: createData.Location || undefined,
        StartUtc: createData.StartUtc || undefined,
        EndUtc: createData.EndUtc || undefined,
        AllDay: !!createData.AllDay,
        AthleteId: createData.AthleteId || undefined,
        OrganizationId: createData.OrganizationId || undefined,
        RecurrenceRule: createData.RecurrenceRule || undefined,
      });
      setOpenCreate(false);
      setCreateData(prev => ({
        ...prev,
        Title: '',
        Description: '',
        Location: '',
        RecurrenceRule: '',
        AllDay: false,
      }));
      await loadEvents();
    } catch {
      // no-op (could add toast)
    }
  };

  const deleteEvent = async (ev: CalendarEvent) => {
    if (!window.confirm(`Delete event "${ev.title}"?`)) return;
    try {
      await eventService.remove(ev.id);
      await loadEvents();
    } catch {
      // no-op
    }
  };

  const exportIcs = async () => {
    try {
      const blob = await eventService.exportIcs({
        athleteId: filters.athleteId,
        type: filters.type,
        start: filters.start,
        end: filters.end,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'events.ics';
      a.click();
      URL.revokeObjectURL(url);
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
            <h2 className="text-2xl font-bold text-black">🗓️ Central Calendar</h2>
            <p className="text-sm text-gray-700 mt-1">Synchronize Training, Travel, Meetings, Competitions.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportIcs}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-md transition-colors duration-200"
              title="Export as ICS"
            >
              Export .ics
            </button>
            <button
              onClick={() => setOpenCreate(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200"
            >
              + New Event
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card-enhanced p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Athlete</label>
            <select
              value={filters.athleteId ?? ''}
              onChange={e => onChangeFilters({ athleteId: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All</option>
              {athletes.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={filters.type ?? ''}
              onChange={e => onChangeFilters({ type: e.target.value || undefined })}
              className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All</option>
              {eventTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
            <input
              type="date"
              value={filters.start ?? ''}
              onChange={e => onChangeFilters({ start: e.target.value || undefined })}
              className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
            <input
              type="date"
              value={filters.end ?? ''}
              onChange={e => onChangeFilters({ end: e.target.value || undefined })}
              className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-end gap-3">
            <button
              onClick={() => onChangeFilters({})}
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200"
            >
              Apply
            </button>
            <button
              onClick={resetFilters}
              className="px-4 py-2 rounded-md bg-gray-600 text-white hover:bg-gray-700 transition-colors duration-200"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="mt-6 text-sm text-gray-300">Total: {total}</div>
      </div>

      {/* List */}
      <div className="card-enhanced p-6">
        <div className="mb-4 text-sm font-medium text-gray-700">Events</div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-400">Loading events...</span>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-lg mb-2">No events found.</div>
            <p className="text-sm text-gray-500">Click "New Event" to add your first record.</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-[900px] w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Start</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">End</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Athlete</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {events.map(ev => {
                  const athlete = ev.athleteId ? athleteMap.get(ev.athleteId) : undefined;
                  return (
                    <tr key={ev.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-900">{formatDateTime(ev.startUtc)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-900">{formatDateTime(ev.endUtc)}</td>
                      <td className="px-4 py-3">
                        <div className="text-gray-900 font-medium">{ev.title}</div>
                        {ev.description ? <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">{ev.description}</div> : null}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{ev.type}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {athlete ? (
                          <div>
                            <div className="text-gray-900 font-medium">{athlete.name}</div>
                            <div className="text-xs text-gray-500">{athlete.sport}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Team/Global</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-900">{ev.location || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          className="px-2 py-1 rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-colors duration-200 text-xs"
                          onClick={() => deleteEvent(ev)}
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
              <div className="font-semibold text-lg text-gray-900">New Event</div>
              <button onClick={() => setOpenCreate(false)} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
            </div>
            <form onSubmit={onCreate} className="p-6 space-y-4 max-h-[calc(90vh-120px)] overflow-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    required
                    value={createData.Title}
                    onChange={e => setCreateData(prev => ({ ...prev, Title: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Team Training Session"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={createData.Type}
                    onChange={e => setCreateData(prev => ({ ...prev, Type: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Athlete (optional)</label>
                  <select
                    value={createData.AthleteId || ''}
                    onChange={e => setCreateData(prev => ({ ...prev, AthleteId: e.target.value ? Number(e.target.value) : 0 }))}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Team/Global</option>
                    {athletes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start</label>
                  <input
                    type="datetime-local"
                    value={toLocalDateInput(createData.StartUtc)}
                    onChange={e => setCreateData(prev => ({ ...prev, StartUtc: fromLocalDateInputToIso(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End</label>
                  <input
                    type="datetime-local"
                    value={toLocalDateInput(createData.EndUtc)}
                    onChange={e => setCreateData(prev => ({ ...prev, EndUtc: fromLocalDateInputToIso(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={createData.Location}
                    onChange={e => setCreateData(prev => ({ ...prev, Location: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Main Field A"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={createData.Description}
                    onChange={e => setCreateData(prev => ({ ...prev, Description: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Optional additional details..."
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={!!createData.AllDay}
                      onChange={e => setCreateData(prev => ({ ...prev, AllDay: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    All day
                  </label>
                  <div className="text-xs text-gray-500">Times are saved in UTC</div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recurrence (RRULE)</label>
                  <input
                    type="text"
                    value={createData.RecurrenceRule}
                    onChange={e => setCreateData(prev => ({ ...prev, RecurrenceRule: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., FREQ=WEEKLY;BYDAY=MO,WE,FR"
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

export default EventsCalendar;