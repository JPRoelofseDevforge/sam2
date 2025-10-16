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

  // Calendar View State
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

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

  // Keep filters' start/end in sync with the visible calendar range
  useEffect(() => {
    const toYMD = (d: Date) => d.toISOString().slice(0, 10);

    const getMondayStart = (d: Date) => {
      const x = new Date(d);
      x.setHours(0, 0, 0, 0);
      const day = (x.getDay() + 6) % 7; // Monday=0
      x.setDate(x.getDate() - day);
      return x;
    };

    let start: Date;
    let end: Date;
    if (viewMode === 'week') {
      start = getMondayStart(currentDate);
      end = new Date(start);
      end.setDate(end.getDate() + 6);
    } else {
      const first = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const last = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      start = getMondayStart(first);
      const lastMondayStart = getMondayStart(last);
      end = new Date(lastMondayStart);
      end.setDate(end.getDate() + 6);
    }

    setFilters(prev => ({
      ...prev,
      start: toYMD(start),
      end: toYMD(end),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, currentDate]);

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

  // Calendar helper functions
  const getMondayStart = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    const day = (x.getDay() + 6) % 7;
    x.setDate(x.getDate() - day);
    return x;
  };
  const addDays = (d: Date, n: number) => {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  };
  const viewTitle = (() => {
    if (viewMode === 'week') {
      const s = getMondayStart(currentDate);
      const e = addDays(s, 6);
      const fmt = (x: Date) => x.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      return `${fmt(s)} - ${fmt(e)}`;
    }
    return currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-enhanced p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-2xl font-bold text-black">🗓️ Central Calendar</h2>
            <p className="text-sm text-gray-700 mt-1">Synchronize Training, Travel, Meetings, Competitions.</p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setCurrentDate(prev => (viewMode === 'week' ? new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 7) : new Date(prev.getFullYear(), prev.getMonth() - 1, 1)))}
                className="px-2 py-1 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                title="Previous"
              >
                ‹
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                title="Today"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentDate(prev => (viewMode === 'week' ? new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 7) : new Date(prev.getFullYear(), prev.getMonth() + 1, 1)))}
                className="px-2 py-1 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                title="Next"
              >
                ›
              </button>
              <div className="ml-2 font-semibold text-gray-900">
                {viewTitle}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-md shadow-sm overflow-hidden border">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-2 text-sm ${viewMode === 'month' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                title="Month view"
              >
                Month
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-2 text-sm border-l ${viewMode === 'week' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                title="Week view"
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm border-l ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                title="List view"
              >
                List
              </button>
            </div>

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

      {/* Calendar */}
      {viewMode !== 'list' && (
        <div className="card-enhanced p-6">
          <div className="mb-4 text-sm font-medium text-gray-700">Calendar</div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 text-xs font-medium text-gray-500 mb-1">
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
              <div key={d} className="px-2 py-2 text-center">{d}</div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
            {(() => {
              const getMondayStart = (d: Date) => {
                const x = new Date(d); x.setHours(0,0,0,0); const day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day); return x;
              };
              const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
              const isSameMonth = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
              const isToday = (d: Date) => {
                const t = new Date(); return d.getFullYear()===t.getFullYear() && d.getMonth()===t.getMonth() && d.getDate()===t.getDate();
              };
              const formatTime = (iso?: string) => {
                if (!iso) return '';
                const dt = new Date(iso);
                if (isNaN(dt.getTime())) return '';
                return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              };
              const eventTypeColor = (type: string) => {
                switch (type) {
                  case 'Training': return 'bg-blue-100 text-blue-800 border-blue-200';
                  case 'Travel': return 'bg-amber-100 text-amber-800 border-amber-200';
                  case 'Meeting': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
                  case 'Competition': return 'bg-rose-100 text-rose-800 border-rose-200';
                  default: return 'bg-gray-100 text-gray-800 border-gray-200';
                }
              };

              const days: Date[] = (() => {
                if (viewMode === 'week') {
                  const s = getMondayStart(currentDate);
                  return Array.from({ length: 7 }, (_, i) => addDays(s, i));
                }
                const first = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                const start = getMondayStart(first);
                return Array.from({ length: 42 }, (_, i) => addDays(start, i));
              })();

              return days.map((day, idx) => {
                const dayStart = new Date(day); dayStart.setHours(0,0,0,0);
                const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1);

                const dayEvents = events.filter(ev => {
                  const s = new Date(ev.startUtc);
                  const e = new Date(ev.endUtc || ev.startUtc);
                  return s < dayEnd && e >= dayStart;
                }).sort((a, b) => {
                  return new Date(a.startUtc).getTime() - new Date(b.startUtc).getTime();
                });

                return (
                  <div key={idx} className="bg-white min-h-[110px] p-2">
                    <div className="flex items-center justify-between">
                      <div className={`text-xs font-semibold ${isSameMonth(day, currentDate) ? 'text-gray-900' : 'text-gray-400'}`}>
                        {day.getDate()}
                      </div>
                      {isToday(day) && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-600 text-white">Today</span>}
                    </div>

                    <div className="mt-2 space-y-1">
                      {dayEvents.slice(0, 3).map(ev => (
                        <div
                          key={ev.id}
                          title={`${ev.title}${ev.location ? ' @ ' + ev.location : ''}`}
                          className={`border ${eventTypeColor(ev.type || 'Other')} rounded px-1.5 py-1 text-[11px] leading-tight truncate`}
                        >
                          <span className="font-medium">{ev.title}</span>
                          {!ev.allDay && (
                            <span className="ml-1 opacity-70">
                              ({formatTime(ev.startUtc)} - {formatTime(ev.endUtc)})
                            </span>
                          )}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-[11px] text-gray-500">+{dayEvents.length - 3} more</div>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

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